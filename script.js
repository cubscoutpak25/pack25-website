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

// Holds live events fetched from BAND: { "YYYY-MM-DD": ["Event 1", "Event 2"] }
let syncedEvents = {};

const actualToday = new Date();
let currentViewDate = new Date(actualToday.getFullYear(), actualToday.getMonth(), 1);

// ----------------------------------------------------
// BAND APP CALENDAR SYNC (MULTI-PROXY CASCADE + BASE64 DECODER)
// ----------------------------------------------------
const BAND_ICS_URL = "https://api.band.us/ical?token=aAAxADVkODI0NGNhZTZhMjI5NzdiMjQ4ZGZkZmNhZGNlYzBlNmI5NTk4NTc";

function decodeBase64DataUri(str) {
    if (!str || typeof str !== 'string') return '';
    if (str.startsWith('data:')) {
        const commaIdx = str.indexOf(',');
        if (commaIdx !== -1) {
            const base64Part = str.substring(commaIdx + 1).trim();
            try {
                const binaryStr = atob(base64Part);
                const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
                return new TextDecoder('utf-8').decode(bytes);
            } catch (e) {
                console.warn("Base64 decode failed:", e);
            }
        }
    }
    return str;
}

async function fetchWithTimeout(url, timeoutMs = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timer);
        return response;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

async function fetchBandCalendar() {
    const syncStatus = document.getElementById('sync-status');

    // Load cached events from localStorage immediately if available
    try {
        const cachedIcs = localStorage.getItem('pack25_band_ics_cache');
        if (cachedIcs && cachedIcs.includes('BEGIN:VCALENDAR')) {
            parseICS(cachedIcs);
        }
    } catch (e) {}

    // Ordered list of fetch strategies:
    // 1. Local band.ics (if synced by GitHub Action)
    // 2. allorigins.win/get (decodes base64 data:text/calendar URI automatically)
    // 3. codetabs proxy
    // 4. allorigins.win/raw
    // 5. cors.lol proxy
    // 6. corsproxy.io with ?url= syntax
    const strategies = [
        {
            name: "Local band.ics",
            url: "band.ics",
            extract: async (res) => await res.text()
        },
        {
            name: "AllOrigins JSON (Base64)",
            url: `https://api.allorigins.win/get?url=${encodeURIComponent(BAND_ICS_URL)}&t=${Date.now()}`,
            extract: async (res) => {
                const json = await res.json();
                return decodeBase64DataUri(json.contents);
            }
        },
        {
            name: "CodeTabs Proxy",
            url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(BAND_ICS_URL)}`,
            extract: async (res) => await res.text()
        },
        {
            name: "AllOrigins Raw",
            url: `https://api.allorigins.win/raw?url=${encodeURIComponent(BAND_ICS_URL)}`,
            extract: async (res) => await res.text()
        },
        {
            name: "CORS.lol Proxy",
            url: `https://api.cors.lol/?url=${encodeURIComponent(BAND_ICS_URL)}`,
            extract: async (res) => await res.text()
        },
        {
            name: "CorsProxy.io",
            url: `https://corsproxy.io/?url=${encodeURIComponent(BAND_ICS_URL)}`,
            extract: async (res) => await res.text()
        }
    ];

    for (const strategy of strategies) {
        try {
            const response = await fetchWithTimeout(strategy.url, 6500);
            if (!response.ok) continue;

            const icsText = await strategy.extract(response);
            if (icsText && icsText.includes('BEGIN:VCALENDAR')) {
                console.log(`BAND Calendar synced via ${strategy.name}`);
                try {
                    localStorage.setItem('pack25_band_ics_cache', icsText);
                } catch (e) {}
                parseICS(icsText);
                if (syncStatus) {
                    syncStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i> Live synced with BAND App';
                    syncStatus.style.color = "#00C62B";
                }
                return; // Stop once a strategy succeeds
            }
        } catch (err) {
            console.warn(`Sync strategy [${strategy.name}] failed:`, err.message);
        }
    }

    // If all live strategies fail, check if we had cached events or fallback gracefully
    if (syncStatus) {
        if (Object.keys(syncedEvents).length > 0) {
            syncStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i> Showing synced BAND schedule';
            syncStatus.style.color = "#00C62B";
        } else {
            syncStatus.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Showing Pack 25 Standard Schedule';
            syncStatus.style.color = "var(--primary)";
        }
    }
}

function parseICSDate(rawVal) {
    if (!rawVal) return null;
    const clean = rawVal.trim();

    // Case 1: UTC Timestamp (e.g. 20261020T220000Z)
    if (clean.endsWith('Z') && clean.length >= 15) {
        const y = parseInt(clean.substring(0, 4), 10);
        const m = parseInt(clean.substring(4, 6), 10) - 1;
        const d = parseInt(clean.substring(6, 8), 10);
        const hr = parseInt(clean.substring(9, 11), 10);
        const min = parseInt(clean.substring(11, 13), 10);
        const sec = parseInt(clean.substring(13, 15), 10);
        const utcDate = new Date(Date.UTC(y, m, d, hr, min, sec));
        return {
            dateStr: `${utcDate.getFullYear()}-${String(utcDate.getMonth() + 1).padStart(2, '0')}-${String(utcDate.getDate()).padStart(2, '0')}`,
            dateObj: new Date(utcDate.getFullYear(), utcDate.getMonth(), utcDate.getDate()),
            isAllDay: false
        };
    }

    // Case 2: Local Timestamp or All-Day Date (e.g. 20261020T180000 or 20261020)
    const digits = clean.replace(/[^0-9]/g, '');
    if (digits.length >= 8) {
        const y = parseInt(digits.substring(0, 4), 10);
        const m = parseInt(digits.substring(4, 6), 10);
        const d = parseInt(digits.substring(6, 8), 10);
        return {
            dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
            dateObj: new Date(y, m - 1, d),
            isAllDay: clean.length === 8
        };
    }
    return null;
}

function addSyncedEvent(dateStr, title) {
    if (!syncedEvents[dateStr]) {
        syncedEvents[dateStr] = [];
    }
    if (!syncedEvents[dateStr].includes(title)) {
        syncedEvents[dateStr].push(title);
    }
}

function parseICS(icsString) {
    syncedEvents = {};

    // Unfold RFC 5545 folded lines (lines starting with space or tab)
    const unfolded = icsString.replace(/\r?\n[ \t]/g, '');
    const lines = unfolded.split(/\r\n|\n|\r/);

    let currentEvent = {};
    let isEvent = false;

    lines.forEach(line => {
        if (line.startsWith('BEGIN:VEVENT')) {
            isEvent = true;
            currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
            isEvent = false;
            if (currentEvent.start && currentEvent.summary) {
                const startInfo = parseICSDate(currentEvent.start);
                if (startInfo) {
                    addSyncedEvent(startInfo.dateStr, currentEvent.summary);

                    // Handle multi-day events if DTEND is present
                    if (currentEvent.end) {
                        const endInfo = parseICSDate(currentEvent.end);
                        if (endInfo && endInfo.dateObj > startInfo.dateObj) {
                            let cur = new Date(startInfo.dateObj);
                            cur.setDate(cur.getDate() + 1);
                            // For all-day events in ICS, DTEND is exclusive
                            const lastDate = new Date(endInfo.dateObj);
                            if (startInfo.isAllDay || currentEvent.endIsDate) {
                                lastDate.setDate(lastDate.getDate() - 1);
                            }
                            let safety = 0;
                            while (cur <= lastDate && safety < 14) {
                                const spanStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
                                addSyncedEvent(spanStr, currentEvent.summary);
                                cur.setDate(cur.getDate() + 1);
                                safety++;
                            }
                        }
                    }
                }
            }
        } else if (isEvent) {
            if (line.startsWith('SUMMARY')) {
                const colonIdx = line.indexOf(':');
                if (colonIdx !== -1) {
                    currentEvent.summary = line.substring(colonIdx + 1)
                        .replace(/\\,/g, ',')
                        .replace(/\\;/g, ';')
                        .replace(/\\n/gi, ' ')
                        .trim();
                }
            } else if (line.startsWith('DTSTART')) {
                const colonIdx = line.indexOf(':');
                if (colonIdx !== -1) {
                    currentEvent.start = line.substring(colonIdx + 1).trim();
                }
            } else if (line.startsWith('DTEND')) {
                const colonIdx = line.indexOf(':');
                if (colonIdx !== -1) {
                    currentEvent.end = line.substring(colonIdx + 1).trim();
                    currentEvent.endIsDate = line.includes('VALUE=DATE');
                }
            }
        }
    });

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
    if (!grid) return;
    grid.innerHTML = '';

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += `<div class="cal-cell empty"></div>`;
    }

    const hasAnyBandEvents = Object.keys(syncedEvents).length > 0;

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDayOfWeek = new Date(year, month, day).getDay();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const isToday = (
            year === actualToday.getFullYear() &&
            month === actualToday.getMonth() &&
            day === actualToday.getDate()
        );

        const cellClasses = isToday ? "cal-cell is-today" : "cal-cell";

        const bandTitles = syncedEvents[dateStr] || [];
        const matchingSpecialEvent = baseEvents.find(e => e.month === (month + 1) && e.day === day);

        let cellHtml = `<div class="${cellClasses}">`;

        if (isToday) {
            cellHtml += `<span class="today-badge"><i class="fa-solid fa-star"></i> Today</span>`;
        }

        cellHtml += `<div class="cal-date-num">${day}</div>`;

        if (bandTitles.length > 0) {
            // Render all live events from BAND for this day
            bandTitles.forEach(title => {
                cellHtml += `<div class="event-pill event-special">${title}</div>`;
            });
        } else if (!hasAnyBandEvents && matchingSpecialEvent) {
            // Fallback to static special events only if BAND sync hasn't loaded
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

    if (prevBtn && nextBtn) {
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

        // Trigger BAND Sync
        fetchBandCalendar();
    }

    // Initialize Famous Scouts Search
    setupFamousSearch();
});
