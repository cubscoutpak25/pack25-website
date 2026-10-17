// Core Special Events
const specialEvents = {
    "2026-09-08": "Pack Kickoff",
    "2026-10-16": "Fall Campout Starts",
    "2026-10-17": "Fall Campout",
    "2026-10-18": "Fall Campout Ends",
    "2026-11-14": "Pack Food Drive",
    "2026-12-15": "Holiday Gathering",
    "2027-01-09": "Derby Workshop",
    "2027-02-20": "Derby Race Day",
    "2027-02-23": "Blue & Gold Banquet",
    "2027-03-20": "Pack Hike",
    "2027-04-23": "Spring Campout Starts",
    "2027-04-24": "Spring Campout",
    "2027-04-25": "Spring Campout Ends",
    "2027-05-15": "Rank Crossover"
};

let currentDate = new Date(2026, 8, 1); // Start at September 2026

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('month-year-display').innerText = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-cell empty"></div>`;
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDayOfWeek = new Date(year, month, day).getDay();
        
        let cellHtml = `<div class="cal-cell">
            <div class="cal-date-num">${day}</div>`;
            
        // Check for special events first
        if (specialEvents[dateStr]) {
            cellHtml += `<div class="event-pill event-special">${specialEvents[dateStr]}</div>`;
        } 
        // If it's a Tuesday and NOT a special event day, mark it as a standard meeting
        else if (currentDayOfWeek === 2) {
            cellHtml += `<div class="event-pill event-meeting">Scout Mtg 6:00p</div>`;
        }
        
        cellHtml += `</div>`;
        grid.innerHTML += cellHtml;
    }
    
    // Fill remaining grid spaces (to make a perfect 7-column grid)
    const totalCells = firstDay + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
        for (let i = 0; i < (7 - remainder); i++) {
            grid.innerHTML += `<div class="cal-cell empty"></div>`;
        }
    }
}

// Event Listeners for buttons
document.addEventListener("DOMContentLoaded", () => {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if(prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });
        
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
        
        // Initial Render
        renderCalendar(currentDate);
    }
});
