// Booking Manager Calendar JS
// Renders a styled calendar and shows bookings per day (placeholder data for now)

class SVGCalendar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.bookings = [];
        this.cellWidth = 180;
        this.cellHeight = 120;
        this.headerHeight = 60;
        this.dayHeaderHeight = 50;
        this.margin = 40;
        this.arrowWidth = 20;
        
        this.init();
    }

    init() {
        this.render(); // Render empty calendar first
        this.loadBookings(); // Then load and render bookings
    }

    async loadBookings() {
        try {
            console.log('Loading bookings from Firebase Cloud Function...');
            const response = await fetch('https://us-central1-property-manager-cf570.cloudfunctions.net/bookings');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);
            
            // Handle different response formats
  let bookings = [];
            if (data.reservations) {
                bookings = data.reservations;
            } else if (data.bookings) {
                bookings = data.bookings;
            } else if (Array.isArray(data)) {
                bookings = data;
            } else {
                console.error('Unexpected API response format:', data);
                return;
            }
            
            this.bookings = bookings.map(booking => ({
                ...booking,
                check_in_date: new Date(booking.check_in_date),
                check_out_date: new Date(booking.check_out_date),
                guest_first_name: booking.guest_name ? booking.guest_name.split(' ')[0] : 'Guest',
                channel: booking.channel_type || booking.channel
            }));
            
            console.log('Bookings loaded:', this.bookings.length);
            console.log('Sample booking:', this.bookings[0]);
            
            // Re-render after loading bookings
            this.render();
            
        } catch (error) {
            console.error('Error loading bookings:', error);
            this.showError('Failed to load bookings. Please check if the server is running.');
        }
    }

    render() {
        this.container.innerHTML = '';
        
        const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElem.setAttribute('class', 'calendar-svg');
        svgElem.setAttribute('viewBox', `0 0 ${this.getCalendarWidth()} ${this.getCalendarHeight()}`);
        
        // Add header
        this.renderHeader(svgElem);
        
        // Add day headers
        this.renderDayHeaders(svgElem);
        
        // Add grid
        this.renderGrid(svgElem);
        
        // Add booking bars
        this.renderBookings(svgElem);
        
        // Add day numbers (after bookings, so they are on top)
        this.renderDayNumbers(svgElem);
        
        this.container.appendChild(svgElem);
    }

    getCalendarWidth() {
        return 7 * this.cellWidth + 2 * this.margin;
    }

    getCalendarHeight() {
        const weeks = this.getWeeksInMonth();
        return this.headerHeight + this.dayHeaderHeight + weeks * this.cellHeight + 2 * this.margin;
    }

    getWeeksInMonth() {
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startWeek = Math.floor((firstDay.getDay() + 6) % 7);
        const totalDays = lastDay.getDate();
        return Math.ceil((startWeek + totalDays) / 7);
    }

    renderHeader(svg) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.getCalendarWidth() / 2);
        text.setAttribute('y', this.headerHeight / 2 + 8);
        text.setAttribute('class', 'calendar-header');
        text.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        svg.appendChild(text);
    }

    renderDayHeaders(svg) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        days.forEach((day, index) => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', this.margin + index * this.cellWidth + this.cellWidth / 2);
            text.setAttribute('y', this.headerHeight + this.dayHeaderHeight / 2 + 5);
            text.setAttribute('class', 'day-header');
            text.textContent = day;
            
            svg.appendChild(text);
        });
    }

    renderGrid(svg) {
        const weeks = this.getWeeksInMonth();
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const startWeek = Math.floor((firstDay.getDay() + 6) % 7);
        const today = new Date();
        
        for (let week = 0; week < weeks; week++) {
            for (let day = 0; day < 7; day++) {
                const cellIndex = week * 7 + day;
                const dayNumber = cellIndex - startWeek + 1;
                
                if (dayNumber > 0 && dayNumber <= new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate()) {
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', this.margin + day * this.cellWidth);
                    rect.setAttribute('y', this.headerHeight + this.dayHeaderHeight + week * this.cellHeight);
                    rect.setAttribute('width', this.cellWidth);
                    rect.setAttribute('height', this.cellHeight);
                    
                    // Check if this is today
                    const isToday = dayNumber === today.getDate() && 
                                   this.currentDate.getMonth() === today.getMonth() && 
                                   this.currentDate.getFullYear() === today.getFullYear();
                    
                    rect.setAttribute('class', isToday ? 'calendar-cell today-cell' : 'calendar-cell');
                    
                    svg.appendChild(rect);
                }
            }
        }
    }

    renderDayNumbers(svg) {
        const weeks = this.getWeeksInMonth();
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const startWeek = Math.floor((firstDay.getDay() + 6) % 7);
        
        for (let week = 0; week < weeks; week++) {
            for (let day = 0; day < 7; day++) {
                const cellIndex = week * 7 + day;
                const dayNumber = cellIndex - startWeek + 1;
                
                if (dayNumber > 0 && dayNumber <= new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate()) {
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', this.margin + day * this.cellWidth + 15);
                    text.setAttribute('y', this.headerHeight + this.dayHeaderHeight + week * this.cellHeight + 30);
                    text.setAttribute('class', 'day-number');
                    text.textContent = dayNumber;
                    
                    svg.appendChild(text);
                }
            }
        }
    }

    renderBookings(svg) {
        this.bookings.forEach(booking => {
            this.renderBookingBar(svg, booking);
        });
    }

    renderBookingBar(svg, booking) {
        const startPos = this.getBookingPosition(booking.check_in_date);
        const endPos = this.getBookingPosition(booking.check_out_date);
        if (!startPos || !endPos) return;

        const { startCol, startRow } = startPos;
        const { startCol: endCol, startRow: endRow } = endPos;

        for (let row = startRow; row <= endRow; row++) {
            let segStartCol, segEndCol;
            if (row === startRow && row === endRow) {
                segStartCol = startCol;
                segEndCol = endCol;
            } else if (row === startRow) {
                segStartCol = startCol;
                segEndCol = 6;
            } else if (row === endRow) {
                segStartCol = 0;
                segEndCol = endCol;
      } else {
                segStartCol = 0;
                segEndCol = 6;
            }

            // Calculate bar segment position and width
            let barX, barWidth;
            if (row === startRow) {
                barX = this.margin + segStartCol * this.cellWidth + this.cellWidth / 3;
                barWidth = (segEndCol - segStartCol + 1) * this.cellWidth - this.cellWidth / 1.5;
            } else if (row === endRow) {
                barX = this.margin;
                barWidth = (segEndCol + 1) * this.cellWidth - this.cellWidth / 3;
      } else {
                barX = this.margin;
                barWidth = 7 * this.cellWidth;
            }
            // Make the bar shorter and align it to the bottom of the cell
            const barHeight = this.cellHeight - 50;
            const barY = this.headerHeight + this.dayHeaderHeight + (row + 1) * this.cellHeight - barHeight + this.margin - this.margin;

            // Determine slant type for this segment
            let slantType = 'middle';
            if (row === startRow && row === endRow) slantType = 'single';
            else if (row === startRow) slantType = 'start';
            else if (row === endRow) slantType = 'end';

            // Create the booking bar shape
            const barShape = this.createBookingBarSegmentShape(barX, barY, barWidth, barHeight, slantType);
            const channelClass = this.getChannelClass(booking.channel);
            barShape.setAttribute('class', `booking-bar ${channelClass}`);
            barShape.addEventListener('click', () => this.showBookingModal(booking));
            svg.appendChild(barShape);

            // Only add text to the first segment (row)
            if (row === startRow) {
                this.addBookingText(svg, barX, barY, barWidth, barHeight, booking);
            }
        }
    }

    createBookingBarSegmentShape(x, y, width, height, slantType) {
        const aw = this.cellWidth / 4; // Always half cell width for slant
        let points;
        if (slantType === 'single') {
            // Single row: left slant increases bottom to top, right slant as before
            points = `${x + aw},${y} ${x + width},${y} ${x + width - aw},${y + height} ${x},${y + height}`;
        } else if (slantType === 'start') {
            // First row: left slant increases bottom to top, right edge is full width
            points = `${x + aw},${y} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}`;
        } else if (slantType === 'end') {
            // Last row: left edge is full width, right slant ends at middle
            points = `${x},${y} ${x + width},${y} ${x + width - aw},${y + height} ${x},${y + height}`;
        } else {
            // Middle row: full width rectangle
            points = `${x},${y} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}`;
        }
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points);
        return polygon;
    }

    addBookingText(svg, x, y, width, height, booking) {
        // Guest name
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', x + width / 2);
        nameText.setAttribute('y', y + height / 2 - 5);
        nameText.setAttribute('class', 'booking-text');
        nameText.textContent = booking.guest_first_name || 'Guest';
        
        // Guest count
        const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        countText.setAttribute('x', x + width / 2);
        countText.setAttribute('y', y + height / 2 + 10);
        countText.setAttribute('class', 'booking-guest-count');
        countText.textContent = `${booking.number_of_guests || 1} guest${booking.number_of_guests > 1 ? 's' : ''}`;
        
        svg.appendChild(nameText);
        svg.appendChild(countText);
    }

    getBookingPosition(date) {
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const startWeek = Math.floor((firstDay.getDay() + 6) % 7);
        const dayOfMonth = date.getDate();
        
        if (date.getMonth() !== this.currentDate.getMonth() || date.getFullYear() !== this.currentDate.getFullYear()) {
            return null;
        }
        
        const cellIndex = startWeek + dayOfMonth - 1;
        const col = cellIndex % 7;
        const row = Math.floor(cellIndex / 7);
        
        return { startCol: col, startRow: row };
    }

    getChannelClass(channel) {
        const channelMap = {
            'airbnb': 'booking-airbnb',
            'booking.com': 'booking-booking',
            'direct': 'booking-direct'
        };
        return channelMap[channel?.toLowerCase()] || 'booking-other';
    }

    getFirstDayOfMonth() {
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        return Math.floor((firstDay.getDay() + 6) % 7);
    }

    getLastDayOfMonth() {
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const startWeek = Math.floor((firstDay.getDay() + 6) % 7);
        return (startWeek + lastDay.getDate() - 1) % 7;
    }

    showBookingModal(booking) {
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        `;
        
        content.innerHTML = `
            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Booking Details</h2>
            <div style="margin-bottom: 15px;">
                <strong>Guest:</strong> ${booking.guest_name || booking.guest_first_name || 'N/A'}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Phone:</strong> ${booking.guest_phone || 'N/A'}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Guests:</strong> ${booking.number_of_guests || 1} (${booking.number_of_adults || 0} adults, ${booking.number_of_children || 0} children)
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Check-in:</strong> ${booking.check_in_date.toLocaleDateString()}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Check-out:</strong> ${booking.check_out_date.toLocaleDateString()}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Channel:</strong> ${booking.channel_type || booking.channel || 'N/A'}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Status:</strong> ${booking.status || 'N/A'}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Rate:</strong> ${booking.rates?.rate?.amount || 'N/A'} ${booking.rates?.rate?.currency || ''}
            </div>
            <button onclick="this.closest('.modal').remove()" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
            ">Close</button>
        `;
        
        modal.appendChild(content);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        document.body.appendChild(modal);
    }

    // Navigation methods
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error">
                <div>
                    <h3>Error Loading Calendar</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-top: 15px;
                    ">Retry</button>
                </div>
            </div>
        `;
    }
}

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const calendar = new SVGCalendar('bm-calendar');
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                calendar.previousMonth();
                break;
            case 'ArrowRight':
                calendar.nextMonth();
                break;
            case 'Home':
                calendar.goToToday();
                break;
        }
    });
    
    // Add navigation buttons (optional)
    const navContainer = document.createElement('div');
    navContainer.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        display: flex;
        gap: 10px;
        z-index: 100;
    `;
    
    navContainer.innerHTML = `
        <button onclick="calendar.previousMonth()" style="
            background: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        ">‹</button>
        <button onclick="calendar.nextMonth()" style="
            background: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        ">›</button>
        <button onclick="calendar.goToToday()" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
        ">Today</button>
    `;
    
    document.body.appendChild(navContainer);
    
    // Make calendar globally accessible
    window.calendar = calendar;
}); 