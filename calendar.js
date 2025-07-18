// Booking Manager Calendar JS
// Renders a styled calendar and shows bookings per day (placeholder data for now)

document.addEventListener('DOMContentLoaded', function() {
  // Calendar state
  let calendarMonth = (new Date()).getMonth();
  let calendarYear = (new Date()).getFullYear();
  let bookings = [];

  // DOM elements
  const bmCalendar = document.getElementById('bm-calendar');
  const todayBtn = document.getElementById('bm-today-btn');
  const dayModal = document.getElementById('bm-day-modal');
  const dayModalTitle = document.getElementById('bm-day-modal-title');
  const dayModalBookings = document.getElementById('bm-day-modal-bookings');
  const dayModalClose = document.getElementById('bm-day-modal-close');
  let dayModalDate = null;

  // Use your Render proxy endpoint here (e.g., https://your-proxy.onrender.com/api/bookings)
  const PROXY_API_URL = 'https://us-central1-property-manager-cf570.cloudfunctions.net/bookings'; // FIXED: now points to /api/bookings

  // Fetch bookings from proxy API
  async function fetchBookings() {
    bmCalendar.innerHTML = '<div style="text-align:center; color:#888; padding:40px;">Loading bookings...</div>';
    try {
      const res = await fetch(PROXY_API_URL);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const apiData = await res.json();
      // Hostex API returns { reservations: [...] }
      const reservations = apiData.reservations || [];
      // Map reservations to expected format for calendar
      bookings = reservations.map(r => {
        // Calculate nights (difference in days between check-in and check-out)
        const checkIn = new Date(r.check_in_date);
        const checkOut = new Date(r.check_out_date);
        const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
        const bookingObj = {
          id: r.reservation_code || r.stay_code,
          guest: r.guest_name || (r.guests && r.guests[0] && r.guests[0].name) || 'Guest',
          source: (r.custom_channel && r.custom_channel.name) || r.channel_type || 'Unknown',
          date: r.check_in_date,
          nights: nights,
          number_of_guests: r.number_of_guests,
          number_of_adults: r.number_of_adults,
          number_of_children: r.number_of_children
        };
        console.log('Loaded booking:', bookingObj); // Log each booking as it's loaded
        return bookingObj;
      });
    } catch (e) {
      bmCalendar.innerHTML = `<div style='color:#d32f2f; text-align:center; padding:40px;'>Error loading bookings.<br>${e.message}</div>`;
      bookings = [];
    }
    renderCalendar(calendarMonth, calendarYear);
  }

  // Helper: get all dates for a booking (from check-in to day before check-out)
  function getBookingDates(checkIn, checkOut) {
    const dates = [];
    let current = new Date(checkIn);
    const end = new Date(checkOut);
    while (current < end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Helper: get first name from full name
  function getFirstName(name) {
    if (!name) return '';
    return name.split(' ')[0];
  }

  function renderCalendar(month, year) {
    bmCalendar.innerHTML = '';
    // Header with month navigation
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'center';
    header.style.alignItems = 'center';
    header.style.gap = '24px';
    header.style.marginBottom = '18px';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '\u2190';
    prevBtn.style.background = 'none';
    prevBtn.style.border = 'none';
    prevBtn.style.fontSize = '22px';
    prevBtn.style.cursor = 'pointer';
    prevBtn.style.color = 'var(--primary)';
    prevBtn.onclick = () => {
      if (month === 0) {
        calendarMonth = 11;
        calendarYear = year - 1;
      } else {
        calendarMonth = month - 1;
      }
      renderCalendar(calendarMonth, calendarYear);
    };
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '\u2192';
    nextBtn.style.background = 'none';
    nextBtn.style.border = 'none';
    nextBtn.style.fontSize = '22px';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.color = 'var(--primary)';
    nextBtn.onclick = () => {
      if (month === 11) {
        calendarMonth = 0;
        calendarYear = year + 1;
      } else {
        calendarMonth = month + 1;
      }
      renderCalendar(calendarMonth, calendarYear);
    };
    const monthYear = document.createElement('div');
    monthYear.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;
    monthYear.style.fontWeight = 'bold';
    monthYear.style.color = 'var(--primary)';
    monthYear.style.fontSize = '20px';
    header.appendChild(prevBtn);
    header.appendChild(monthYear);
    header.appendChild(nextBtn);
    bmCalendar.appendChild(header);
    // Calendar grid
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    // Day headers
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    days.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-header';
      dayHeader.textContent = day;
      grid.appendChild(dayHeader);
    });
    // Get first day and total days
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-cell';
      emptyCell.style.background = '#f4f6fa';
      grid.appendChild(emptyCell);
    }
    const today = new Date();
    // Build a map: date string -> booking info for that day
    const bookingMap = {};
    bookings.forEach(b => {
      const allDates = getBookingDates(b.date, (new Date(b.date).getTime() + b.nights * 24 * 60 * 60 * 1000));
      allDates.forEach((dateStr, idx) => {
        if (!bookingMap[dateStr]) bookingMap[dateStr] = [];
        let type = 'middle';
        if (idx === 0) type = 'start';
        if (idx === allDates.length - 1) type = 'end';
        if (allDates.length === 1) type = 'single';
        bookingMap[dateStr].push({ ...b, type });
      });
    });
    for (let d = 1; d <= totalDays; d++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      const dayNumber = document.createElement('div');
      dayNumber.textContent = d;
      dayNumber.style.fontWeight = 'bold';
      dayNumber.style.marginBottom = '5px';
      dayNumber.style.fontSize = '16px';
      dayNumber.style.textAlign = 'center';
      // Highlight today
      if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        cell.classList.add('today');
      }
      // Booking bar logic
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const bookingsForDay = bookingMap[dateStr] || [];
      bookingsForDay.forEach(booking => {
        // Bar container
        const bar = document.createElement('div');
        bar.className = 'booking-bar';
        // Add type class for CSS (start, middle, end, single)
        bar.classList.add(booking.type);
        // Add channel class for color
        if (booking.source.toLowerCase().includes('airbnb')) {
          bar.classList.add('airbnb');
        } else if (booking.source.toLowerCase().includes('booking.com')) {
          bar.classList.add('bookingcom');
        }
        // Position bar at bottom 3/5 of cell
        bar.style.bottom = '6px';
        bar.style.top = '';
        bar.style.height = '42px';
        bar.style.left = '6px';
        bar.style.right = '6px';
        bar.style.marginTop = '';
        bar.style.marginBottom = '2px';
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.justifyContent = 'center';
        bar.style.fontSize = '13px';
        bar.style.fontWeight = 'bold';
        bar.style.color = '#fff';
        bar.style.overflow = 'hidden';
        bar.style.zIndex = 2;
        bar.style.position = 'absolute';
        // Add a small gap between bookings
        bar.style.marginTop = '4px';
        // Bar content (guest first name and person icon + number)
        const content = document.createElement('span');
        content.className = 'bar-content';
        content.innerHTML = `<span>${getFirstName(booking.guest)}</span> <span style='font-size:15px;'>👤</span> <span>${booking.number_of_guests ?? '-'}</span>`;
        bar.appendChild(content);
        cell.appendChild(bar);
      });
      cell.appendChild(dayNumber);
      cell.onmouseover = () => {
        if (!cell.classList.contains('today'))
          cell.style.backgroundColor = '#f0f4fa';
      };
      cell.onmouseout = () => {
        cell.style.backgroundColor = '';
      };
      // Open day modal on click
      cell.onclick = (e) => {
        e.stopPropagation();
        openDayModal(dateStr);
      };
      grid.appendChild(cell);
    }
    bmCalendar.appendChild(grid);
  }

  function openDayModal(dateStr) {
    dayModalDate = dateStr;
    dayModal.style.display = 'flex';
    dayModalTitle.textContent = `Bookings for ${dateStr}`;
    renderDayModalBookings(dateStr);
  }
  function closeDayModal() {
    dayModal.style.display = 'none';
    dayModalDate = null;
  }
  dayModalClose.addEventListener('click', closeDayModal);
  dayModal.addEventListener('click', (e) => {
    if (e.target === dayModal) closeDayModal();
  });

  function renderDayModalBookings(dateStr) {
    let filtered = bookings.filter(b => b.date === dateStr);
    console.log('Looking for bookings on:', dateStr);
    if (filtered.length === 0) {
      dayModalBookings.innerHTML = '<p style="color:#888; text-align:center;">No bookings for this day.</p>';
      return;
    }
    console.log('Bookings for date', dateStr, filtered);
    dayModalBookings.innerHTML = '';
    filtered.forEach((booking) => {
      console.log('Rendering booking for date', dateStr, booking); // <-- Log each booking being shown
      const div = document.createElement('div');
      div.className = 'booking-item';
      div.style.background = '#f8f9fa';
      div.style.borderRadius = '8px';
      div.style.padding = '16px';
      div.style.marginBottom = '14px';
      div.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      div.innerHTML = `<div style="display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div><strong style="color:var(--primary); font-size:18px;">${booking.guest}</strong> <span style="color:#888; font-size:14px;">${booking.source}</span></div>
          <span style="color:#1976d2; font-size:15px;">${booking.nights} night${booking.nights > 1 ? 's' : ''}</span>
        </div>
        <div style="color:#444; font-size:15px; margin-left:2px;">
          Guests: <strong>${booking.number_of_guests ?? '-'}</strong> &nbsp;|
          Adults: <strong>${booking.number_of_adults ?? '-'}</strong> &nbsp;|
          Children: <strong>${booking.number_of_children ?? '-'}</strong>
        </div>
      </div>`;
      dayModalBookings.appendChild(div);
    });
  }

  todayBtn.addEventListener('click', () => {
    const now = new Date();
    calendarMonth = now.getMonth();
    calendarYear = now.getFullYear();
    renderCalendar(calendarMonth, calendarYear);
  });

  // Initial render
  fetchBookings();
}); 