const events = {
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

const monthsToRender = [
    { year: 2026, month: 8, name: "September 2026", days: 30, startDay: 2 }, // Sept 1, 2026 is Tuesday (0=Sun, 1=Mon, 2=Tue)
    { year: 2026, month: 9, name: "October 2026", days: 31, startDay: 4 }, // Oct 1, 2026 is Thursday
    { year: 2026, month: 10, name: "November 2026", days: 30, startDay: 0 }, // Nov 1 is Sunday
    { year: 2026, month: 11, name: "December 2026", days: 31, startDay: 2 }, // Dec 1 is Tuesday
    { year: 2027, month: 0, name: "January 2027", days: 31, startDay: 5 }, // Jan 1 is Friday
    { year: 2027, month: 1, name: "February 2027", days: 28, startDay: 1 }, // Feb 1 is Monday
    { year: 2027, month: 2, name: "March 2027", days: 31, startDay: 1 }, // Mar 1 is Monday
    { year: 2027, month: 3, name: "April 2027", days: 30, startDay: 4 }, // Apr 1 is Thursday
    { year: 2027, month: 4, name: "May 2027", days: 31, startDay: 6 }  // May 1 is Saturday
];

const wrapper = document.getElementById('calendar-wrapper');

if (wrapper) {
    let html = '<div class="grid-2">'; // Put months in a 2-column grid to save vertical space
    
    monthsToRender.forEach(m => {
        html += `<div class="calendar-grid-month">
            <div class="month-header">${m.name}</div>
            <div class="days-row">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div class="dates-grid">`;
            
        // Empty cells for start of month
        for(let i=0; i<m.startDay; i++) {
            html += `<div class="date-cell empty-cell"></div>`;
        }
        
        // Days of month
        for(let day=1; day<=m.days; day++) {
            let dateStr = `${m.year}-${String(m.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            let eventHtml = events[dateStr] ? `<div class="event-badge">${events[dateStr]}</div>` : '';
            
            html += `<div class="date-cell">
                <div class="date-num">${day}</div>
                ${eventHtml}
            </div>`;
        }
        
        // Fill remaining cells to complete the grid row
        let totalCells = m.startDay + m.days;
        let remainder = totalCells % 7;
        if(remainder !== 0) {
            for(let i=0; i<(7 - remainder); i++) {
                html += `<div class="date-cell empty-cell"></div>`;
            }
        }
        
        html += `</div></div>`;
    });
    
    html += '</div>';
    wrapper.innerHTML = html;
}
