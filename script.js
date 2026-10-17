// Base Special Events definition by month and day (1-indexed month)
// This ensures that no matter what year the user opens the calendar, 
// the annual events show up seamlessly on their correct days.
const baseEvents = [
    { month: 9, day: 8, title: "Pack Kickoff" },
    { month: 10, day: 17, title: "Fall Campout" },
    { month: 10, day: 18, title: "Fall Campout Ends" },
    { month: 11, day: 14, title: "Pack Food Drive" },
    { month: 12, day: 15, title: "Holiday Gathering" },
    { month: 1, day: 9, title: "Derby Workshop" },
    { month: 2, day: 20, title: "Derby Race Day" },
    { month: 2, day: 23, title: "Blue & Gold Banquet" },
    { month: 3, day: 20, title: "Pack Hike" },
    { month: 4, day: 23, title: "Spring Campout Starts" },
    { month: 4, day: 24, title: "Spring Campout" },
    { month: 4, day: 25, title: "Spring Campout Ends" },
    { month: 5, day: 15, title: "Rank Crossover" }
];

// Always start on today's actual system date
const actualToday = new Date();
let currentViewDate = new Date(actualToday.getFullYear(), actualToday.getMonth(), 1); 

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    
    const headerDisplay = document.getElementById('month-year-display');
    if (headerDisplay) {
        headerDisplay.innerText = `${monthNames[month]} ${year}`;
    }
    
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-cell empty"></div>`;
    }
    
    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDayOfWeek = new Date(year, month, day).getDay();
        
        // Check if this date is today
        const isToday = (
            year === actualToday.getFullYear() && 
            month === actualToday.getMonth() && 
            day === actualToday.getDate()
        );
        
        const cellClasses = isToday ? "cal-cell is-today" : "cal-cell";
        
        // Find special events matching this month and day
        const matchingSpecialEvent = baseEvents.find(e => e.month === (month + 1) && e.day === day);
        
        let cellHtml = `<div class="${cellClasses}">`;
        
        if (isToday) {
            cellHtml += `<span class="today-badge"><i class="fa-solid fa-star"></i> Today</span>`;
        }
        
        cellHtml += `<div class="cal-date-num">${day}</div>`;
            
        if (matchingSpecialEvent) {
            cellHtml += `<div class="event-pill event-special">${matchingSpecialEvent.title}</div>`;
        } 
        // If it's a Tuesday and NOT a special event day, mark standard pack meeting
        else if (currentDayOfWeek === 2) {
            cellHtml += `<div class="event-pill event-meeting">Scout Mtg 6:00p</div>`;
        }
        
        cellHtml += `</div>`;
        grid.innerHTML += cellHtml;
    }
    
    // Fill remaining grid spaces to make a complete 7-column grid
    const totalCells = firstDay + daysInMonth;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
        for (let i = 0; i < (7 - remainder); i++) {
            grid.innerHTML += `<div class="cal-cell empty"></div>`;
        }
    }
}

// Search filter for Famous Scouts page
function setupFamousSearch() {
    const searchInput = document.getElementById('famous-search');
    const scoutCards = document.querySelectorAll('.famous-card');
    
    if (searchInput && scoutCards.length > 0) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            scoutCards.forEach(card => {
                const searchData = card.getAttribute('data-search') || '';
                if (searchData.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    
    if(prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentViewDate.setMonth(currentViewDate.getMonth() - 1);
            renderCalendar(currentViewDate);
        });
        
        nextBtn.addEventListener('click', () => {
            currentViewDate.setMonth(currentViewDate.getMonth() + 1);
            renderCalendar(currentViewDate);
        });
        
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                currentViewDate = new Date(actualToday.getFullYear(), actualToday.getMonth(), 1);
                renderCalendar(currentViewDate);
            });
        }
        
        // Initial Calendar Render
        renderCalendar(currentViewDate);
    }
    
    // Initialize Famous Scouts Search
    setupFamousSearch();
});
