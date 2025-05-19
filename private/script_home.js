let listaEventi, currentWeek, weekDaysContainer, eventsTodayTitle, notesList;

let inputBox, searchBtn, weather_img, temperature, description, cityN,
    location_not_found, weather_body, today, resetTodayBtn;

document.addEventListener("DOMContentLoaded", async () => {
    listaEventi = document.getElementById("events-list");
    currentWeek = document.getElementById("current-week");
    weekDaysContainer = document.querySelector(".week-days");
    eventsTodayTitle = document.getElementById("events-today-title");
    notesList = document.getElementById("notes-list");

    inputBox = document.querySelector('.input-box');
    searchBtn = document.getElementById('searchBtn');
    weather_img = document.querySelector('.weather-img');
    temperature = document.querySelector('.temperature');
    description = document.querySelector('.description');
    cityN = document.getElementById('city');

    location_not_found = document.querySelector('.location-not-found');
    weather_body = document.querySelector('.weather-body');
    resetTodayBtn = document.querySelector('.resetToday-btn');

    adjustWidgetLayout();
    window.addEventListener('resize', adjustWidgetLayout);

    await initHome();

    // Aggiungi evento per tutto il widget calendar-widget tranne che sui giorni
    document.querySelector(".calendar-widget").addEventListener("click", (e) => {
        if (!e.target.classList.contains("week-day")) {
            window.location.href = "/home/calendario"; 
        }
    });

    // Aggiungi evento per tutto il widget calendar-widget tranne che sui giorni
    document.querySelector(".notes-widget").addEventListener("click", (e) => {
        window.location.href = "/home/note";

    });

    document.querySelector(".timer-widget").addEventListener("click", (e) => {
        window.location.href = "/home/timer";
    });

    document.querySelector(".poll-widget").addEventListener("click", (e) => {
        window.location.href = "/home/sondaggi";
    });

    document.querySelector("#LogOut").addEventListener("click", logOut);

    searchBtn.addEventListener('click', ()=>{
        weather(inputBox.value);
    });

    resetTodayBtn.addEventListener("click",  async ()=>{
        await setToday(new Date());
        await initHome();
    });

    window.addEventListener("pageshow",(event) => {
        if (event.persisted) {
            setTimeout(initHome, 0);
        }
    });
});

function normalizeDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfWeek(date) {
    const day = date.getDay(),
        diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
}

function getWeekDays(date) {
    const startOfWeek = getStartOfWeek(new Date(date));
    return Array.from({ length: 7 }, (_, i) => new Date(startOfWeek + i * 86400000));
}

function displayWeekDays() {
    if (!weekDaysContainer) return;

    const dataCorrente = today;
    const weekDays = getWeekDays(dataCorrente);
    weekDaysContainer.innerHTML = weekDays.map(day => {
        const dayName = day.toLocaleDateString('it-IT', { weekday: 'short' });
        const isToday = normalizeDate(day).getTime() === normalizeDate(dataCorrente).getTime();
        return `<div class="week-day ${isToday ? 'today' : ''}" data-date="${day.toLocaleDateString("it-IT")}">${dayName} ${day.getDate()}</div>`;
    }).join('');
}

function displayCurrentWeek() {
    let formattedDate = today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    if (currentWeek) {
        currentWeek.textContent = `${formattedDate}`;
    }
}

async function loadEvents(data) {
    try {
        const response = await axios.get("/events");

        const dati = await response.data;
        const eventiDaMostrare = dati.filter(event =>{
                if(event.start===""){
                    return normalizeDate(data).toLocaleDateString("it-IT") === normalizeDate(new Date(event.end)).toLocaleDateString("it-IT");
                }else{
                    return normalizeDate(data) >= normalizeDate(new Date(event.start)) &&
                        normalizeDate(data) <= normalizeDate(new Date(event.end));
                }
            }
        );

        if (listaEventi) {
            listaEventi.innerHTML = eventiDaMostrare.length
                ? eventiDaMostrare.map((event)=>formatEvent(event,data)).join('')
                : '<li>Nessun evento per oggi!</li>';
        }
    } catch (error) {
        console.error("Errore nel caricamento degli eventi:", error);
    }
}

async function recuperaNote() {
    try {
        let response = await axios.get("/notes")
        let data = response.data;
        if (notesList) {
            // Prendo solo le prime 3 note
            const primeTreNote = data.slice(0, 3);

            notesList.innerHTML = primeTreNote.length
                ? primeTreNote.map(nota => {
                    // Rimuovo HTML, mantenendo gli spazi
                    const plainText = nota.content.replace(/<\/?p>/g, ' ').replace(/<[^>]*>/g, '');
                    let preview = plainText.substring(0, 40);

                    if (plainText.length > 40) {
                        const lastSpaceIndex = preview.lastIndexOf(' ');
                        preview = preview.substring(0, lastSpaceIndex) + '...';
                    }

                    return `<li><strong>${nota.title}</strong>: ${preview}</li>`;
                }).join('')
                : '<li>Nessuna nota disponibile!</li>';
        }

    } catch (error) {
        console.error(error);
    }
}

const preSelectToday = async () => {
    const tempToday = weekDaysContainer.querySelector(".today");
    if (tempToday) {
        tempToday.classList.add("selected");
        eventsTodayTitle.textContent = "Eventi di Oggi";
        await loadEvents(today);
    }
};

async function logOut(){
    try {
        await axios.get("/logout")
        window.location.href = "/";
    } catch (error){
        console.error(error);
    }
}

function formatEvent(event, data){
    const formatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    let formattedTimeRange;
    if(event.start===""){
        let dayEnd = new Date(event.end);
        const formattedEnd = dayEnd.toLocaleTimeString("it-IT", formatOptions);

        formattedTimeRange = `entro: ${formattedEnd}`;
    }else {
        let formattedStart,formattedEnd;
        let dayStart = new Date(event.start);
        let dayEnd = new Date(event.end);

        if(normalizeDate(dayStart) < normalizeDate(data) && normalizeDate(data) < normalizeDate(dayEnd)) {
            formattedTimeRange= "all day";
        }else{
            formattedStart = data.getDate()===dayStart.getDate()?(new Date(event.start)).toLocaleTimeString("it-IT", formatOptions):"";
            formattedEnd = data.getDate()===dayEnd.getDate()?(new Date(event.end)).toLocaleTimeString("it-IT", formatOptions):"";
            formattedTimeRange = `${formattedStart} - ${formattedEnd}`;
        }
    }
    return`<li>${event.title}   ${formattedTimeRange}</li>`
}

async function weather(city){
    const api_key = "fa8f1299cf20ad11a0a352cc63ab9499";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api_key}&lang=it`;
    let weather_data;
    try {
        weather_data = await axios.get(`${url}`);
        weather_data = weather_data.data;
    } catch (error) {
        location_not_found.style.display = "flex";
        cityN.style.display = "none";
        weather_body.style.display = "none";
        console.log("error");
        return;
    }

    cityN.textContent = city;
    inputBox.value = "";
    location_not_found.style.display = "none";
    cityN.style.display = "block";
    weather_body.style.display = "flex";
    temperature.innerHTML = `${Math.round(weather_data.main.temp - 273.15)}°C`;
    description.innerHTML = `${weather_data.weather[0].description}`;

    const localOffset = today.getTimezoneOffset() * 60;
    const timezoneOffset = (weather_data.timezone) + localOffset;

    const currentTimeUTC = Math.floor(Date.now() / 1000);
    const currentTime = currentTimeUTC + timezoneOffset;

    const sunrise = weather_data.sys.sunrise + timezoneOffset;
    const sunset = weather_data.sys.sunset + timezoneOffset;

    let isNight = currentTime < sunrise || currentTime > sunset;

    if (isNight && weather_data.weather[0].main === 'Clear') {
        weather_img.src = "/private/image/moon.png";
    } else if(isNight && weather_data.weather[0].main === 'Clouds') {
        weather_img.src = "/private/image/clouds_moon.png";
    }else {
        switch (weather_data.weather[0].main) {
            case 'Thunderstorm':
                weather_img.src = "/private/image/thunderstorm.svg";
                break;
            case 'Drizzle':
                weather_img.src = "/private/image/drizzle.svg";
                break;
            case 'Rain':
                weather_img.src = "/private/image/rain.svg";
                break;
            case 'Snow':
                weather_img.src = "/private/image/snow.svg";
                break;
            case 'Clear':
                weather_img.src = "/private/image/clear.svg";
                break;
            case 'Clouds':
                weather_img.src = "/private/image/clouds.svg";
                break;
            case 'Mist':
            case 'Smoke':
            case 'Haze':
            case 'Dust':
            case 'Fog':
            case 'Sand':
            case 'Ash':
            case 'Squall':
            case 'Tornado':
                weather_img.src = "/private/image/atmosphere.svg";
                break;
        }
    }

}

async function getToday() {
    try {
        const response = await axios.get("/get-today");
        const data =  response.data;
        return new Date(data.today); // Converte la stringa ISO in oggetto Date
    } catch (error) {
        console.error("Errore:", error);
        return null;
    }
}

async function setToday(date) {
    today = new Date(date);
    month = today.getMonth();
    year = today.getFullYear();

    try {
        await axios.post("/setToday", {newDate: today}, {
            headers: {"Content-Type": "application/json"}
        });
    } catch (error) {
        console.error("Errore:", error);
    }
}

async function initHome() {
    today = await getToday();
    if (!today) return;

    displayWeekDays();
    displayCurrentWeek();

    const eventsPromise = loadEvents(today);
    const notesPromise = recuperaNote();
    const weatherPromise = weather("Bologna");

    if (weekDaysContainer) {
        weekDaysContainer.addEventListener("click", async (e) => {
            if (e.target.classList.contains("week-day")) {
                weekDaysContainer.querySelector(".week-day.selected")?.classList.remove("selected");
                e.target.classList.add("selected");

                let formattedDate = e.target.getAttribute('data-date').split("/").reverse().join("-");
                const clickedDate = new Date(formattedDate);

                const giorniSettimana = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
                const dayOfWeek = giorniSettimana[clickedDate.getDay()];
                eventsTodayTitle.textContent = normalizeDate(clickedDate).getTime() === normalizeDate(today).getTime()
                    ? "Eventi di Oggi"
                    : `Eventi di ${dayOfWeek}`;

                await loadEvents(clickedDate);
            }
        });

        await preSelectToday();
    }

    await Promise.all([eventsPromise, notesPromise, weatherPromise]);
}

function adjustWidgetLayout() {
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 768;
    const cellHeight = isMobile ? 60 : 80;

    var grid = GridStack.init({
        cellHeight: cellHeight,
        minRow: 1,
        float: true,
        disableOneColumnMode: true,
        disableResize: isMobile,
        disableDrag: isMobile
    });

    const calendarWidget = document.querySelector('.calendar-widget').closest('.grid-stack-item');
    const notesWidget = document.querySelector('.notes-widget').closest('.grid-stack-item');
    const timerWidget = document.querySelector('.timer-widget').closest('.grid-stack-item');
    const meteoWidget = document.querySelector('.meteo-widget').closest('.grid-stack-item');
    const pollWidget = document.querySelector('.poll-widget').closest('.grid-stack-item');

    if (screenWidth < 768) {
        grid.update(calendarWidget, { x: 0, y: 0, w: 12, h: 4 });
        grid.update(notesWidget, { x: 0, y: 4, w: 12, h: 3 });
        grid.update(timerWidget, { x: 7, y: 7, w: 5, h: 2 });
        grid.update(meteoWidget, { x: 0, y: 7, w: 7, h: 4 });
        grid.update(pollWidget, { x: 7, y: 9, w: 5, h: 2 });
    } else {

        grid.update(calendarWidget, { x: 0, y: 0, w: 12, h: 4 });
                
        grid.update(notesWidget, { x: 0, y: 4, w: 12, h: 3 });
        
        grid.update(timerWidget, { x: 4, y: 7, w: 4, h: 3 });
        grid.update(meteoWidget, { x: 0, y: 7, w: 4, h: 3 });
        grid.update(pollWidget, { x: 8, y: 7, w: 4, h: 3 });
    }
}
