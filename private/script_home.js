let listaEventi, currentWeek, weekDaysContainer, eventsTodayTitle, notesList;

let inputBox, searchBtn, weather_img, temperature, description, cityN, location_not_found, weather_body;

document.addEventListener("DOMContentLoaded", () => {

    weather("Bologna");

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

    // Seleziona il contenitore dei widget
    var grid = GridStack.init({
        cellHeight: 80,
        minRow: 1,
        float: true,
        disableOneColumnMode: true,
    });

    displayWeekDays();
    displayCurrentWeek();
    recuperaEventi(new Date());
    recuperaNote();

    if (weekDaysContainer) {
        weekDaysContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("week-day")) {
                const selectedDay = weekDaysContainer.querySelector(".week-day.selected");
                if (selectedDay) {
                    selectedDay.classList.remove("selected");
                }
                e.target.classList.add("selected");

                let formattedDate = e.target.getAttribute('data-date').split("/").reverse().join("-")
                const clickedDate = new Date(formattedDate);
                if (normalizeDate(clickedDate).getTime() === normalizeDate(new Date()).getTime()) {
                    eventsTodayTitle.textContent = "Eventi di Oggi";
                } else {
                    const giorniSettimana = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
                    const dayOfWeek = giorniSettimana[clickedDate.getDay()];

                    // let dayLong = clickedDate.toLocaleDateString('it-IT', { weekday: 'long' });
                    eventsTodayTitle.textContent = `Eventi di ${dayOfWeek}`;
                }
                recuperaEventi(clickedDate);
            }
        });
        preSelectToday();
    }

    // Aggiungi evento per tutto il widget calendar-widget tranne che sui giorni
    document.querySelector(".calendar-widget").addEventListener("click", (e) => {
        // Verifica che l'elemento cliccato non sia un giorno della settimana
        if (!e.target.classList.contains("week-day")) {
            window.location.href = "/home/calendario";  // Reindirizza a calendario.html
        }
    });

    // Aggiungi evento per tutto il widget calendar-widget tranne che sui giorni
    document.querySelector(".notes-widget").addEventListener("click", (e) => {
        window.location.href = "/home/note";

    });

    document.querySelector(".timer-widget").addEventListener("click", (e) => {
        window.location.href = "/home/timer";
    });

    document.querySelector("#LogOut").addEventListener("click", logOut);

    searchBtn.addEventListener('click', ()=>{
        weather(inputBox.value);
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

    const dataCorrente = new Date();
    const weekDays = getWeekDays(dataCorrente);
    weekDaysContainer.innerHTML = weekDays.map(day => {
        const dayName = day.toLocaleDateString('it-IT', { weekday: 'short' });
        const isToday = normalizeDate(day).getTime() === normalizeDate(dataCorrente).getTime();
        return `<div class="week-day ${isToday ? 'today' : ''}" data-date="${day.toLocaleDateString("it-IT")}">${dayName} ${day.getDate()}</div>`;
    }).join('');
}

function displayCurrentWeek() {
    const dataCorrente = new Date();
    let formattedDate = dataCorrente.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    if (currentWeek) {
        currentWeek.textContent = `${formattedDate}`;
    }
}

function recuperaEventi(data) {
    fetch("http://localhost:3000/events")
        .then(res => res.json())
        .then(dati => {
            const eventiDaMostrare = dati.filter(evento => {
                // const dataEvento = new Date(evento.year, evento.month - 1, evento.day);
                // return normalizeDate(dataEvento).getTime() === normalizeDate(data).getTime();
                return normalizeDate(data) >= normalizeDate(new Date(evento.start)) && normalizeDate(data) <= normalizeDate(new Date(evento.end));
            });

            if (listaEventi) {

                listaEventi.innerHTML = eventiDaMostrare.length
                    ? eventiDaMostrare.map(formatEvent).join('')
                    : '<li>Nessun evento per oggi!</li>';
            }
        })
        .catch(console.error);
}

function recuperaNote() {
    fetch("http://localhost:3000/notes")
        .then(res => res.json())
        .then(dati => {
            if (notesList) {
                notesList.innerHTML = dati.length
                    ? dati.map(nota => {
                        const maxLength = 50; // Lunghezza massima dell'estratto
                        let contentPreview = nota.content;

                        if (nota.content.length > maxLength) {
                            const truncated = nota.content.substring(0, maxLength);
                            const lastSpaceIndex = truncated.lastIndexOf(' ');
                            contentPreview = truncated.substring(0, lastSpaceIndex) + '...';
                        }

                        return `<li>
                    <strong>${nota.title}</strong>: ${contentPreview}
                  </li>`;
                    }).join('')
                    : '<li>Nessuna nota disponibile!</li>';
            }
        })
        .catch(console.error);
}

const preSelectToday = () => {
    const today = weekDaysContainer.querySelector(".today");
    if (today) {
        today.classList.add("selected");
        eventsTodayTitle.textContent = "Eventi di Oggi";
        recuperaEventi(new Date());
    }
};

async function logOut(){
    await fetch("http://localhost:3000/logout")
        .then(res => res.json())
        .then(dati => {
            console.log(dati);
            window.location.href = "/";
        })
        .catch(console.error);

}

function formatEvent(event){
    let dayStart = new Date(event.start);
    let dayEnd = new Date(event.end);

    const formatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };

    const formattedStart = dayStart.toLocaleTimeString("en-US", formatOptions);
    const formattedEnd = dayEnd.toLocaleTimeString("en-US", formatOptions);

    let formattedTimeRange = `${formattedStart} - ${formattedEnd}`;

    formattedTimeRange = dayStart.getDate()===dayEnd.getDate()&&dayStart.getMonth()===dayEnd.getMonth()&&dayStart.getFullYear()===dayEnd.getFullYear()?
            formattedTimeRange:
            "all day";

    return`<li>${formattedTimeRange} - ${event.title}</li>`
}



async function weather(city){
    const api_key = "fa8f1299cf20ad11a0a352cc63ab9499";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api_key}&lang=it`;

    const weather_data = await fetch(`${url}`).then(response => response.json());

    if(weather_data.cod === `404`){
        location_not_found.style.display = "flex";
        weather_body.style.display = "none";
        console.log("error");
        return;
    }
    cityN.textContent = city;
    inputBox.value = "";
    location_not_found.style.display = "none";
    weather_body.style.display = "flex";
    temperature.innerHTML = `${Math.round(weather_data.main.temp - 273.15)}°C`;
    description.innerHTML = `${weather_data.weather[0].description}`;

    const localOffset = new Date().getTimezoneOffset() * 60;
    const timezoneOffset = (weather_data.timezone) + localOffset;
    

    const currentTimeUTC = Math.floor(Date.now() / 1000);
    const currentTime = currentTimeUTC + timezoneOffset;

    const sunrise = weather_data.sys.sunrise + timezoneOffset;
    const sunset = weather_data.sys.sunset + timezoneOffset;

    let isNight = currentTime < sunrise || currentTime > sunset;

    if (isNight && weather_data.weather[0].main == 'Clear') {
        weather_img.src = "/private/image/moon.png";
    } else if(isNight && weather_data.weather[0].main == 'Clouds') {
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


