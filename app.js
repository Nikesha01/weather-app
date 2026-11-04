const API_KEY = "a286d8313d08438fa8351112260111";

async function getWeather(city) {

    const cityInput = document.getElementById("city-input");
    const searchButton = document.getElementById("search-button");

    try {

        searchButton.textContent = "Loading...";
        searchButton.disabled = true;

        const url =
            `https://api.weatherapi.com/v1/forecast.json` +
            `?key=${API_KEY}` +
            `&q=${encodeURIComponent(city)}` +
            `&days=7`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                "City not found or API request failed."
            );
        }

        const data = await response.json();

        document.getElementById("city-name").textContent =
            `${data.location.name}, ${data.location.country}`;

        document.getElementById("temperature").textContent =
            `${Math.round(data.current.temp_c)}°C`;

        document.getElementById("weather-feel").textContent =
            `${data.current.condition.text} · Feels like ${Math.round(data.current.feelslike_c)}°C`;

        document.getElementById("weather-date").textContent =
            data.location.localtime;

        document.getElementById("humidity").textContent =
            `${data.current.humidity}%`;

        document.getElementById("wind").textContent =
            `${data.current.wind_kph} km/h`;

        document.getElementById("uv-index").textContent =
            data.current.uv;

        const currentHour = Number(
            data.location.localtime.slice(11, 13)
        );

        const hourlyData =
            data.forecast.forecastday[0].hour;

        document.getElementById("rain-chance").textContent =
            `${hourlyData[currentHour].chance_of_rain}%`;

        renderHourlyForecast(data);
        renderWeeklyForecast(data);
        renderSunriseSunset(data);

        cityInput.value = data.location.name;

    } catch (error) {

        alert(
            "Weather data could not be loaded. " +
            "Please check the city name and try again."
        );

        console.error(error);

    } finally {

        searchButton.textContent = "Search";
        searchButton.disabled = false;

    }
}

getWeather();

function renderHourlyForecast(data) {

    const localTime = data.location.localtime;
    const currentHour = Number(localTime.slice(11, 13));

    const todayHours = data.forecast.forecastday[0].hour;
    const tomorrowHours = data.forecast.forecastday[1].hour;

    const allHours = todayHours.concat(tomorrowHours);

    // Get the next 7 hours, including the current hour
    const hourlyData = allHours.slice(currentHour, currentHour + 7);

    if (hourlyData.length === 0) {
        return;
    }

    const top = 18;
    const bottom = 118;

    const temperatures = hourlyData.map(hour => hour.temp_c);

    let minTemp = Math.min(...temperatures) - 2;
    let maxTemp = Math.max(...temperatures) + 2;

    if (minTemp === maxTemp) {
        maxTemp = minTemp + 1;
    }

    const points = hourlyData.map((hour, index) => {

        const x = 15 + index * (730 / 6);

        const y = bottom -
            ((hour.temp_c - minTemp) /
                (maxTemp - minTemp)) * (bottom - top);

        return {
            x: x,
            y: y,
            hour: hour
        };
    });

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {

        const previous = points[i - 1];
        const current = points[i];

        const midX = (previous.x + current.x) / 2;

        path += ` Q ${midX} ${previous.y} ${current.x} ${current.y}`;
    }

    document.getElementById("temperature-line")
        .setAttribute("d", path);

    const dot = document.getElementById("temperature-dot");

    dot.setAttribute("cx", points[0].x);
    dot.setAttribute("cy", points[0].y);

    const rainHours = points.filter(
        point => point.hour.chance_of_rain >= 40
    );

    const highlight = document.getElementById("rain-highlight");

    if (rainHours.length > 0) {

        const first = rainHours[0];
        const last = rainHours[rainHours.length - 1];

        highlight.setAttribute("x", first.x);
        highlight.setAttribute("y", 12);
        highlight.setAttribute(
            "width",
            Math.max(12, last.x - first.x)
        );
        highlight.setAttribute("height", 88);

        document.getElementById("rain-message").textContent =
            `Rain likely ${formatHour(first.hour.time)}`;

    } else {

        highlight.setAttribute("width", 0);

        document.getElementById("rain-message").textContent =
            "Low chance of rain";
    }

    const labels = document.getElementById("hourly-labels");

    labels.innerHTML = "";

    points.forEach((point, index) => {

        const span = document.createElement("span");

        if (index === 0) {
            span.textContent =
                `Now · ${Math.round(point.hour.temp_c)}°`;
        } else {
            span.textContent = formatHour(point.hour.time);
        }

        labels.appendChild(span);
    });
}


function formatHour(dateTime) {

    const hour = Number(dateTime.slice(11, 13));

    const suffix = hour >= 12 ? "PM" : "AM";

    const displayHour = hour % 12 || 12;

    return `${displayHour} ${suffix}`;
}

function renderWeeklyForecast(data) {

    const weeklyList = document.getElementById("weekly-list");

    weeklyList.innerHTML = "";

    const days = data.forecast.forecastday;

    console.log("Forecast days:", data.forecast.forecastday.length);
    const maxTemps = days.map(day => day.day.maxtemp_c);
    const minTemps = days.map(day => day.day.mintemp_c);

    const highestTemp = Math.max(...maxTemps);
    const lowestTemp = Math.min(...minTemps);

    days.forEach((day, index) => {

        const date = new Date(day.date + "T12:00:00");

        const dayName = index === 0
            ? "Today"
            : date.toLocaleDateString("en-US", {
                weekday: "short"
            });

        const condition = day.day.condition.text;
        const minTemp = Math.round(day.day.mintemp_c);
        const maxTemp = Math.round(day.day.maxtemp_c);

        const range = highestTemp - lowestTemp || 1;

        const barWidth = Math.max(
            15,
            ((maxTemp - minTemp) / range) * 100
        );

        let barClass = "";

        if (condition.toLowerCase().includes("cloud")) {
            barClass = "cloudy";
        } else if (
            condition.toLowerCase().includes("rain") ||
            condition.toLowerCase().includes("shower") ||
            condition.toLowerCase().includes("storm")
        ) {
            barClass = "cool";
        }

        const row = document.createElement("div");
        row.className = "forecast-row";

        const dayElement = document.createElement("span");
        dayElement.className = "forecast-day";
        dayElement.textContent = dayName;

        const conditionElement = document.createElement("span");
        conditionElement.className = "forecast-condition";
        conditionElement.textContent = condition;

        const bar = document.createElement("div");
        bar.className = "forecast-bar";

        const fill = document.createElement("div");
        fill.className = "forecast-bar-fill " + barClass;
        fill.style.width = barWidth + "%";

        bar.appendChild(fill);

        const temperature = document.createElement("span");
        temperature.className = "forecast-temperature";
        temperature.textContent = `${minTemp}° ${maxTemp}°`;

        row.appendChild(dayElement);
        row.appendChild(conditionElement);
        row.appendChild(bar);
        row.appendChild(temperature);

        weeklyList.appendChild(row);
    });
}

const searchButton =
    document.getElementById("search-button");

const cityInput =
    document.getElementById("city-input");

searchButton.addEventListener("click", function () {

    const city = cityInput.value.trim();

    if (city === "") {
        alert("Please enter a city name.");
        return;
    }

    getWeather(city);

});

cityInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        searchButton.click();
    }

});

getWeather("Colombo");

function renderSunriseSunset(data) {

    // Get sunrise and sunset from WeatherAPI
    const astro = data.forecast.forecastday[0].astro;

    const sunrise = astro.sunrise;
    const sunset = astro.sunset;

    // Update the labels
    document.getElementById("sunrise-label").textContent =
        "Sunrise " + sunrise;

    document.getElementById("sunset-label").textContent =
        "Sunset " + sunset;

    function timeToMinutes(time) {

        const parts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);

        let hour = Number(parts[1]);
        const minute = Number(parts[2]);
        const period = parts[3].toUpperCase();

        if (period === "PM" && hour !== 12) {
            hour += 12;
        }

        if (period === "AM" && hour === 12) {
            hour = 0;
        }

        return hour * 60 + minute;
    }

    const sunriseMinutes = timeToMinutes(sunrise);
    const sunsetMinutes = timeToMinutes(sunset);

    const localTime = data.location.localtime;
    const currentHour = Number(localTime.slice(11, 13));
    const currentMinute = Number(localTime.slice(14, 16));

    const currentMinutes = currentHour * 60 + currentMinute;

    let progress =
        (currentMinutes - sunriseMinutes) /
        (sunsetMinutes - sunriseMinutes);

    progress = Math.max(0, Math.min(1, progress));

    const angle = Math.PI * progress;

    const x = 230 - 210 * Math.cos(angle);
    const y = 210 - 190 * Math.sin(angle);

    document.querySelector(".sun").setAttribute("cx", x);
    document.querySelector(".sun").setAttribute("cy", y);

    document.querySelector(".sun-glow").setAttribute("cx", x);
    document.querySelector(".sun-glow").setAttribute("cy", y);

    let path = "";

    for (let i = 0; i <= 50 * progress; i++) {

        const p = i / 50;
        const a = Math.PI * p;

        const px = 230 - 210 * Math.cos(a);
        const py = 210 - 190 * Math.sin(a);

        if (i === 0) {
            path = `M ${px} ${py}`;
        } else {
            path += ` L ${px} ${py}`;
        }
    }

    document.getElementById("arc-orange").setAttribute("d", path);
}