const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-btn");
const currentLocationBtn = document.querySelector(".current-location-btn");

const weatherInfoSection = document.querySelector(".weather-info");
const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search-city");

const countryTxt = document.querySelector(".country-txt");
const tempTxt = document.querySelector(".temp-txt");
const conditionTxt = document.querySelector(".condition-txt");
const humidityValueTxt = document.querySelector(".humidity-value-txt");
const windValueTxt = document.querySelector(".wind-value-txt");
const currentDateTxt = document.querySelector(".current-date-txt");
const forecastItemsContainer = document.querySelector(".forecast-items-container");
const weatherSvg = document.getElementById("weather-svg");
const currentTimeEl = document.getElementById("current-time");

const feelsLikeTxt = document.querySelector(".feelslike-txt");
const minMaxTxt = document.querySelector(".minmax-txt");
const rainValueTxt = document.querySelector(".rain-value-txt");
const aqiValueTxt = document.querySelector(".aqi-value-txt");

const apiKey = "62cef8c6970f2455c00b419e7b6c6811"; 

let timeInterval; // Variable to store the clock interval

/* ---------------- EVENTS ---------------- */

searchBtn.addEventListener("click", () => {
  if (cityInput.value.trim()) {
    updateWeatherByCity(cityInput.value.trim());
    cityInput.value = "";
    cityInput.blur();
  }
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && cityInput.value.trim()) {
    updateWeatherByCity(cityInput.value.trim());
    cityInput.value = "";
    cityInput.blur();
  }
});

if(currentLocationBtn) {
    currentLocationBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
        (pos) => updateWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
        () => alert("Location permission denied")
    );
    });
}

/* ---------------- FETCH DATA ---------------- */

async function getFetchData(endpoint, query) {
  try {
      const apiUrl = `https://api.openweathermap.org/data/2.5/${endpoint}?${query}&appid=${apiKey}&units=metric`;
      const response = await fetch(apiUrl);
      return response.json();
  } catch (error) {
      console.error("Error fetching data:", error);
      return { cod: "404" };
  }
}

/* ---------------- HELPERS ---------------- */

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function getCurrentDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

// Logic to check if it's night time for the icon (Boolean only)
function isNight(timezone) {
  const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
  const cityTime = new Date(utc + timezone * 1000);
  const hour = cityTime.getHours();
  return hour >= 18 || hour < 6;
}

// New Function: Starts a live clock for the specific timezone
function startLiveClock(timezone) {
    // Clear any existing interval to prevent overlapping timers
    if (timeInterval) clearInterval(timeInterval);

    const updateClock = () => {
        const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
        const cityTime = new Date(utc + timezone * 1000);
        
        if(currentTimeEl) {
            currentTimeEl.textContent = cityTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    };

    updateClock(); // Update immediately
    timeInterval = setInterval(updateClock, 1000); // Update every second
}

function calculateUS_AQI(pm25) {
    if (pm25 <= 12.0) return Math.round(((50 - 0) / (12.0 - 0.0)) * (pm25 - 0.0) + 0);
    if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
    if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
    if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
    if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
    if (pm25 <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301);
    return Math.round(((500 - 401) / (500.4 - 350.5)) * (pm25 - 350.5) + 401);
}

function getWeatherSVG(weatherId, isNightTime) {
    if (weatherId >= 200 && weatherId < 300) return `<img src="assets/weather/thunder.svg" alt="thunder">`;
    if (weatherId >= 300 && weatherId < 500) return `<img src="assets/weather/drizzle.svg" alt="drizzle">`;
    if (weatherId >= 500 && weatherId < 600) return `<img src="assets/weather/rain.svg" alt="rain">`;
    if (weatherId >= 600 && weatherId < 700) return `<img src="assets/weather/snow.svg" alt="snow">`;
    if (weatherId >= 700 && weatherId < 800) return `<img src="assets/weather/atmosphere.svg" alt="mist">`;
    if (weatherId === 800) return isNightTime ? `<img src="assets/weather/clear_night.svg" alt="clear">` : `<img src="assets/weather/clear_day.svg" alt="clear">`;
    return `<img src="assets/weather/clouds.svg" alt="clouds">`;
}

async function updateAQI(lat, lon) {
    try {
        const data = await getFetchData("air_pollution", `lat=${lat}&lon=${lon}`);
        if(!data.list || !data.list[0]) {
             aqiValueTxt.textContent = "N/A";
             return;
        }
        const pm25 = data.list[0].components.pm2_5;
        const aqiVal = calculateUS_AQI(pm25);
        let label = "Good", color = "#2ecc71";
        
        if(aqiVal > 50) { label = "Fair"; color = "#f1c40f"; }
        if(aqiVal > 100) { label = "Moderate"; color = "#e67e22"; }
        if(aqiVal > 150) { label = "Poor"; color = "#e91d1dff"; }
        if(aqiVal > 200) { label = "Very Poor"; color = "#b83cedff"; }
        if(aqiVal > 300) { label = "Hazardous"; color = "#b30033ff"; }

        aqiValueTxt.textContent = `${aqiVal} (${label})`;
        aqiValueTxt.style.color = color;
    } catch (e) { aqiValueTxt.textContent = "N/A"; }
}

/* ---------------- WEATHER PROCESS ---------------- */

let currentCityId = 0;

async function updateWeatherByCity(city) {
  const data = await getFetchData("weather", `q=${city}`);
  processWeather(data);
}

async function updateWeatherByCoords(lat, lon) {
  const data = await getFetchData("weather", `lat=${lat}&lon=${lon}`);
  processWeather(data);
}

async function processWeather(weatherData) {
  if (weatherData.cod !== 200) {
    showDisplaySection(notFoundSection);
    return;
  }

  const {
    id,
    name,
    sys: { country },
    main: { temp, feels_like, temp_min, temp_max, humidity },
    weather: [{ id: weatherId, main }],
    wind: { speed },
    coord,
    timezone,
  } = weatherData;

  currentCityId = id;

  try {
      countryTxt.textContent = `${name}, ${regionNames.of(country)} (${country})`;
  } catch(e) {
      countryTxt.textContent = `${name}, ${country}`;
  }

  tempTxt.textContent = `${Math.round(temp)} °C`;
  feelsLikeTxt.textContent = `Feels like: ${Math.round(feels_like)} °C`;
  
  minMaxTxt.textContent = `Min: ${Math.round(temp_min)}° | Max: ${Math.round(temp_max)}°`;

  conditionTxt.textContent = main;
  humidityValueTxt.textContent = `${humidity}%`;
  windValueTxt.textContent = `${speed} m/s`;
  currentDateTxt.textContent = getCurrentDate();

  // Start the live clock for the found city
  startLiveClock(timezone);

  weatherSvg.innerHTML = getWeatherSVG(weatherId, isNight(timezone));

  await updateAQI(coord.lat, coord.lon);
  await updateForecastInfo(name); 

  showDisplaySection(weatherInfoSection);
}

async function updateForecastInfo(city) {
  const data = await getFetchData("forecast", `q=${city}`);
  if(!data.list) return;

  forecastItemsContainer.innerHTML = "";
  const today = new Date().toISOString().split("T")[0];
  let rainSet = false;

  const dailyData = {};
  let todayMin = 100, todayMax = -100; 

  data.list.forEach(item => {
      const date = item.dt_txt.split(" ")[0];
      
      // Calculate TODAY's true Min/Max 
      if(date === today) {
          if(item.main.temp_min < todayMin) todayMin = item.main.temp_min;
          if(item.main.temp_max > todayMax) todayMax = item.main.temp_max;
      }

      // Logic for Next 5 Days
      if(date !== today) {
          if(!dailyData[date]) {
              dailyData[date] = {
                  temp_min: item.main.temp_min,
                  temp_max: item.main.temp_max,
                  weatherId: item.weather[0].id,
                  date: item.dt_txt
              };
          } else {
              dailyData[date].temp_min = Math.min(dailyData[date].temp_min, item.main.temp_min);
              dailyData[date].temp_max = Math.max(dailyData[date].temp_max, item.main.temp_max);
              if(item.dt_txt.includes("12:00")) {
                  dailyData[date].weatherId = item.weather[0].id;
              }
          }
      }

      // Rain chance
      if (item.dt_txt.includes("12:00:00") && !rainSet) {
          rainValueTxt.textContent = `${Math.round((item.pop || 0) * 100)}%`;
          rainSet = true;
      }
  });

  // UPDATE MAIN CARD MIN/MAX with True Daily Values
  if(todayMax > -100) {
      minMaxTxt.textContent = `Min: ${Math.round(todayMin)}° | Max: ${Math.round(todayMax)}°`;
  }

  // Render Forecast
  Object.values(dailyData).slice(0, 5).forEach(day => {
      const a = document.createElement("a");
      a.className = "forecast-item";
      a.href = `https://openweathermap.org/city/${currentCityId}`;
      a.target = "_blank";
      a.innerHTML = `
        <h4 class="forecast-item-date regular-txt">
          ${new Date(day.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
        </h4>
        ${getWeatherSVG(day.weatherId, false)}
        <h4 class="forecast-item-temp">${Math.round(day.temp_min)}° / ${Math.round(day.temp_max)}°</h4>
      `;
      forecastItemsContainer.appendChild(a);
  });
}

function showDisplaySection(section) {
  [weatherInfoSection, searchCitySection, notFoundSection].forEach(
    (s) => (s.style.display = "none")
  );
  section.style.display = "flex";
}