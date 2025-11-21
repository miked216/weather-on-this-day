const API_BASE = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';

// WMO Weather Codes Mapping
const weatherCodes = {
    0: { label: 'Clear sky', icon: 'sun' },
    1: { label: 'Mainly clear', icon: 'sun' },
    2: { label: 'Partly cloudy', icon: 'cloud-sun' },
    3: { label: 'Overcast', icon: 'cloud' },
    45: { label: 'Fog', icon: 'cloud-fog' },
    48: { label: 'Depositing rime fog', icon: 'cloud-fog' },
    51: { label: 'Light drizzle', icon: 'cloud-drizzle' },
    53: { label: 'Moderate drizzle', icon: 'cloud-drizzle' },
    55: { label: 'Dense drizzle', icon: 'cloud-drizzle' },
    56: { label: 'Light freezing drizzle', icon: 'cloud-hail' },
    57: { label: 'Dense freezing drizzle', icon: 'cloud-hail' },
    61: { label: 'Slight rain', icon: 'cloud-rain' },
    63: { label: 'Moderate rain', icon: 'cloud-rain' },
    65: { label: 'Heavy rain', icon: 'cloud-rain' },
    66: { label: 'Light freezing rain', icon: 'cloud-hail' },
    67: { label: 'Heavy freezing rain', icon: 'cloud-hail' },
    71: { label: 'Slight snow', icon: 'snowflake' },
    73: { label: 'Moderate snow', icon: 'snowflake' },
    75: { label: 'Heavy snow', icon: 'snowflake' },
    77: { label: 'Snow grains', icon: 'snowflake' },
    80: { label: 'Slight rain showers', icon: 'cloud-rain' },
    81: { label: 'Moderate rain showers', icon: 'cloud-rain' },
    82: { label: 'Violent rain showers', icon: 'cloud-rain' },
    85: { label: 'Slight snow showers', icon: 'snowflake' },
    86: { label: 'Heavy snow showers', icon: 'snowflake' },
    95: { label: 'Thunderstorm', icon: 'cloud-lightning' },
    96: { label: 'Thunderstorm with hail', icon: 'cloud-lightning' },
    99: { label: 'Thunderstorm with heavy hail', icon: 'cloud-lightning' }
};

function getWeatherInfo(code) {
    return weatherCodes[code] || { label: 'Unknown', icon: 'help-circle' };
}

async function initApp() {
    const locationDisplay = document.getElementById('location-display');

    if (!navigator.geolocation) {
        locationDisplay.textContent = 'Geolocation not supported. Using default (NYC).';
        fetchWeatherData(40.7128, -74.0060, "New York");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchCityName(latitude, longitude);

            // Initialize with today
            const today = new Date();
            const datePicker = document.getElementById('date-picker');
            datePicker.value = today.toISOString().split('T')[0];

            // Initial fetch
            fetchWeatherData(latitude, longitude, today);

            // Date change listener
            datePicker.addEventListener('change', (e) => {
                const selectedDate = new Date(e.target.value);
                fetchWeatherData(latitude, longitude, selectedDate);
            });
        },
        (error) => {
            console.error(error);
            locationDisplay.textContent = 'Location access denied. Using default (NYC).';

            const today = new Date();
            const datePicker = document.getElementById('date-picker');
            datePicker.value = today.toISOString().split('T')[0];

            fetchWeatherData(40.7128, -74.0060, today);

            // Date change listener for default location too
            datePicker.addEventListener('change', (e) => {
                const selectedDate = new Date(e.target.value);
                fetchWeatherData(40.7128, -74.0060, selectedDate);
            });
        }
    );
}

async function fetchWeatherData(lat, lon, date) {
    const currentEl = document.getElementById('current-weather');
    const historyGrid = document.getElementById('history-grid');

    // Format date for API (YYYY-MM-DD)
    const dateStr = date.toISOString().split('T')[0];

    try {
        // 1. Fetch "Current" Weather (for the selected date)
        // Note: If date is today, we use 'current' endpoint? 
        // Actually, to be consistent for ANY date, we should use the archive/forecast endpoint for the "current" display too if it's in the past.
        // But user asked for "weather on this day website". 
        // If I pick a past date, "Current Weather" should probably show the weather for THAT date.
        // Let's use the archive endpoint for the main card too if it's not today.
        // However, Open-Meteo 'forecast' endpoint handles current and near future. 'archive' handles past.

        let mainTemp, mainCode;

        const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

        if (isToday) {
            const currentUrl = `${API_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
            const currentRes = await fetch(currentUrl);
            const currentData = await currentRes.json();
            mainTemp = currentData.current.temperature_2m;
            mainCode = currentData.current.weather_code;
        } else {
            // Fetch from archive/forecast for the specific date
            // Use archive for past, forecast for future (up to 14 days). 
            // For simplicity, let's assume we use archive for anything not today/future.
            // Actually, let's just use the daily max/min avg for the main card if it's a past date.
            const archiveUrl = `${ARCHIVE_BASE}?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
            const res = await fetch(archiveUrl);
            const data = await res.json();
            if (data.daily && data.daily.temperature_2m_max) {
                mainTemp = (data.daily.temperature_2m_max[0] + data.daily.temperature_2m_min[0]) / 2;
                mainCode = data.daily.weather_code[0];
            }
        }

        renderMainCard(mainTemp, mainCode, date);
        updateBackground(mainCode, date, lat, lon);

        // 2. Fetch History (Past 5 years from the SELECTED date)
        const historyPromises = [];
        for (let i = 1; i <= 5; i++) {
            const pastDate = new Date(date);
            pastDate.setFullYear(date.getFullYear() - i);
            const pastDateStr = pastDate.toISOString().split('T')[0];

            const historyUrl = `${ARCHIVE_BASE}?latitude=${lat}&longitude=${lon}&start_date=${pastDateStr}&end_date=${pastDateStr}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
            historyPromises.push(fetch(historyUrl).then(res => res.json()).then(data => ({ ...data, year: pastDate.getFullYear() })));
        }

        const historyData = await Promise.all(historyPromises);
        renderHistory(historyData, mainTemp);

    } catch (error) {
        console.error("Error fetching weather:", error);
        currentEl.innerHTML = `<p>Error loading weather data.</p>`;
        historyGrid.innerHTML = `<p>Error loading history.</p>`;
    }
}

function renderMainCard(temp, code, date) {
    const info = getWeatherInfo(code);
    const container = document.getElementById('current-weather');

    // Fix timezone offset issue for display
    const displayDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = displayDate.toLocaleDateString('en-US', dateOptions);

    container.innerHTML = `
        <div class="current-date">${dateStr}</div>
        <div class="current-temp">${Math.round(temp)}°</div>
        <div class="current-condition">
            <i data-lucide="${info.icon}"></i>
            <span>${info.label}</span>
        </div>
    `;
    lucide.createIcons();
}

async function fetchCityName(lat, lon) {
    const locationDisplay = document.getElementById('location-display');
    try {
        // Use Open-Meteo Geocoding API (free, no key)
        // Note: The standard open-meteo API doesn't do reverse geocoding directly in the forecast endpoint.
        // We need to use the geocoding API or a different service. 
        // Actually, Open-Meteo has a geocoding API but it's mostly for search. 
        // For reverse geocoding, we can use `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}` 
        // or BigDataCloud free client side API.
        // Let's use BigDataCloud for client-side simplicity or Nominatim (requires User-Agent).
        // Let's try a simple one: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`

        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const data = await res.json();

        const city = data.city || data.locality || data.principalSubdivision || "Unknown Location";
        locationDisplay.textContent = `Weather in ${city}`;

    } catch (e) {
        console.error("Reverse geocoding failed", e);
        locationDisplay.textContent = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
    }
}

function updateBackground(code, date, lat, lon) {
    const body = document.body;
    let bgImage = 'bg_clear_day.png'; // Default

    // Simple day/night check (approximate)
    const hour = date.getHours();
    const isDay = hour > 6 && hour < 20;

    // Map codes to images
    // 0, 1: Clear
    // 2, 3: Cloudy
    // 45, 48: Fog (Cloudy)
    // 51-67, 80-82: Rain
    // 71-77, 85-86: Snow
    // 95-99: Thunderstorm (Rain)

    if (code >= 71 && code <= 77) {
        bgImage = 'bg_snow.png';
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95)) {
        bgImage = 'bg_rain.png';
    } else if (code >= 2 && code <= 48) {
        bgImage = 'bg_cloudy.png';
    } else {
        // Clear
        if (isDay) {
            bgImage = 'bg_clear_day.png';
        } else {
            bgImage = 'bg_clear_night.png';
        }
    }

    // If the date is NOT today, we might not have the correct "time" of day for the background if we just use the date object (which defaults to midnight usually for input type=date)
    // But let's stick to the logic: if user picked a date, the input gives YYYY-MM-DD. The Date object will be midnight UTC or local.
    // If it's midnight, it will show night. That's probably fine. 
    // Or we could force "Day" for historical dates unless specific logic is added.
    // Let's force "Day" for historical dates to show the scenery better, unless it's explicitly "Now".

    const isToday = new Date().toDateString() === date.toDateString();
    if (!isToday) {
        // For history, default to day view for better visibility, unless it's specifically night weather?
        // Actually, let's just use the 'isDay' logic but assume noon for historical dates so we see the "Day" version of clear/cloudy.
        // If we use the 'date' passed from the picker, it is usually midnight.
        if (code < 2) { // Clear
            bgImage = 'bg_clear_day.png';
        }
    }

    body.style.backgroundImage = `url('${bgImage}')`;
}

function renderHistory(historyData, currentTemp) {
    const grid = document.getElementById('history-grid');
    grid.innerHTML = ''; // Clear skeletons

    historyData.forEach(data => {
        if (!data.daily || !data.daily.temperature_2m_max) return;

        const maxTemp = data.daily.temperature_2m_max[0];
        const minTemp = data.daily.temperature_2m_min[0];
        const code = data.daily.weather_code[0];
        const info = getWeatherInfo(code);
        const avgTemp = (maxTemp + minTemp) / 2; // Rough estimate for comparison

        // Compare with today
        const diff = avgTemp - currentTemp;
        let diffText = '';
        let diffClass = 'diff-same';

        if (diff > 1) {
            diffText = 'Warmer than today';
            diffClass = 'diff-warmer';
        } else if (diff < -1) {
            diffText = 'Cooler than today';
            diffClass = 'diff-cooler';
        } else {
            diffText = 'Similar to today';
        }

        const card = document.createElement('div');
        card.className = 'history-card glass';
        card.innerHTML = `
            <div class="history-year">${data.year}</div>
            <div class="history-condition">
                <i data-lucide="${info.icon}" width="24" height="24"></i>
            </div>
            <div class="history-temp">${Math.round(maxTemp)}° / ${Math.round(minTemp)}°</div>
            <div class="diff-tag ${diffClass}">${diffText}</div>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

// Start
initApp();
