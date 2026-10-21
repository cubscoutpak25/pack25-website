// Base Special Events (Annual Fallbacks)
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

let syncedEvents = {}; // Holds live events fetched from BAND

const actualToday = new Date();
let currentViewDate = new Date(actualToday.getFullYear(), actualToday.getMonth(), 1); 

// ----------------------------------------------------
// BAND APP CALENDAR SYNC
// ----------------------------------------------------
function fetchBandCalendar() {
    const syncStatus = document.getElementById('sync-status');
    const icsUrl = "https://api.band.us/ical?token=aAAxADVkODI0NGNhZTZhMjI5NzdiMjQ4ZGZkZmNhZGNlYzBlNmI5NTk4NTc";
    
    // We use a CORS proxy because browsers block direct cross-origin fetches from api.band.us
    const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(icsUrl);
    
    fetch(proxyUrl)
        .then(response => response.json())
        .then(data => {
            if (data.contents) {
                parseICS(data.contents);
                if(syncStatus) {
                    syncStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i> Live synced with BAND App';
                }
            }
        })
        .catch(err => {
            console.error("Failed to sync BAND calendar", err);
            if(syncStatus) {
                syncStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color: var(--patriotic-red);"></i> Live sync unavailable, showing static calendar.';
            }
        });
}

function parseICS(icsString) {
    const lines = icsString.split(/\r\n|\n|\r/);
    let currentEvent = {};
    let isEvent = false;

    lines.forEach(line => {
        if (line.startsWith('BEGIN:VEVENT')) {
            isEvent = true;
            currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
            isEvent = false;
            if (currentEvent.start && currentEvent.summary) {
                const year = currentEvent.start.substring(0, 4);
                const month = currentEvent.start.substring(4, 6);
                const day = currentEvent.start.substring(6, 8);
                const dateStr = `${year}-${month}-${day}`;
                
                syncedEvents[dateStr] = currentEvent.summary;
            }
        } else if (isEvent) {
            // Unfold lines if necessary
            if (line.startsWith('SUMMARY:')) {
                currentEvent.summary = line.substring(8).replace(/\\,/g, ',');
            } else if (line.startsWith('DTSTART')) {
                const parts = line.split(':');
                if (parts.length > 1) {
                    currentEvent.start = parts[1].replace(/[^0-9]/g, '').substring(0, 8);
                }
            }
        }
    });
    
    // Re-render the calendar to paint the newly fetched events
    renderCalendar(currentViewDate);
}

// ----------------------------------------------------
// CALENDAR RENDERING
// ----------------------------------------------------
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
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if this date is today
        const isToday = (
            year === actualToday.getFullYear() && 
            month === actualToday.getMonth() && 
            day === actualToday.getDate()
        );
        
        const cellClasses = isToday ? "cal-cell is-today" : "cal-cell";
        
        // Find special events
        const syncedEventTitle = syncedEvents[dateStr];
        const matchingSpecialEvent = baseEvents.find(e => e.month === (month + 1) && e.day === day);
        
        let cellHtml = `<div class="${cellClasses}">`;
        
        if (isToday) {
            cellHtml += `<span class="today-badge"><i class="fa-solid fa-star"></i> Today</span>`;
        }
        
        cellHtml += `<div class="cal-date-num">${day}</div>`;
            
        if (syncedEventTitle) {
            // Prioritize live events from BAND app
            cellHtml += `<div class="event-pill event-special">${syncedEventTitle}</div>`;
        } else if (matchingSpecialEvent) {
            // Fallback to our annual static events if BAND hasn't synced it
            cellHtml += `<div class="event-pill event-special">${matchingSpecialEvent.title}</div>`;
        } else if (currentDayOfWeek === 2) {
            // Automatic Tuesday Meeting Populator
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

// ----------------------------------------------------
// FAMOUS SCOUTS SEARCH
// ----------------------------------------------------
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

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    
    // Setup Calendar Nav
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
        
        // Initial Calendar Render (static)
        renderCalendar(currentViewDate);
        
        // Trigger BAND Sync
        fetchBandCalendar();
    }
    
    // Initialize Famous Scouts Search
    setupFamousSearch();
});
