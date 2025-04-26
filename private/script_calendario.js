// Dichiarazione delle variabili globali
var calendar, date, daysContainer, prev, next, todayBtn, gotoBtn, dateInput,
    eventDay, eventDate, eventsContainer, addEventBtn, addEventWrapper,
    addEventCloseBtn, addEventTitle, addEventFrom, addEventTo, addEventSubmit, divUntil,
    addEventDescription, eventType, divEventStart, viewActivityBtn, downloadEventsBtn, divWeekday,
    divFrequency, divLocation, viewActivityWrapper, viewActivityCloseBtn, doFullEventBtn, closeFullEventBtn,
    addEventFrequency, addEventLocation, viewActivityBody, resetTodayBtn, logOutBtn,
    fullEventWrapper, fullEventTitle, fullEventTime, fullEventDescription, fullEventDates, deleteFullEventBtn;

let today, activeDay, month, year;

const months = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre"
];
let eventsArr = [];

// Evento DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
    // Inizializzazione delle variabili
    calendar = document.querySelector(".calendar");
    date = document.querySelector(".date");
    daysContainer = document.querySelector(".days");
    prev = document.querySelector(".prev");
    next = document.querySelector(".next");
    todayBtn = document.querySelector(".today-btn");
    gotoBtn = document.querySelector(".goto-btn");
    dateInput = document.querySelector(".date-input");
    eventDay = document.querySelector(".event-day");
    eventDate = document.querySelector(".event-date");
    eventsContainer = document.querySelector(".events");
    addEventBtn = document.querySelector(".add-event");
    addEventWrapper = document.querySelector(".add-event-wrapper");
    addEventCloseBtn = document.querySelector(".add-event-wrapper .add-event-header .close");
    addEventTitle = document.querySelector(".event-name");
    addEventFrom = document.querySelector(".event-time-from");
    addEventTo = document.querySelector(".event-time-to");
    addEventLocation = document.querySelector(".add-event-location");
    addEventFrequency = document.querySelector(".add-event-frequency");
    // addEventInterval = document.querySelector(".add-event-interval");
    addEventSubmit = document.querySelector(".add-event-btn");
    addEventDescription = document.querySelector(".event-description");
    eventType = document.getElementsByName("radio");
    divEventStart = document.getElementById("eventStart");
    viewActivityBtn = document.querySelector(".view-activity");
    downloadEventsBtn = document.querySelector(".download-events");
    viewActivityWrapper = document.querySelector(".view-activity-wrapper");
    viewActivityCloseBtn = document.querySelector(".view-activity-wrapper .add-event-header .close");
    viewActivityBody = document.querySelector(".view-activity-body");
    logOutBtn = document.querySelector("#LogOut");
    resetTodayBtn = document.querySelector(".resetToday-btn");
    divFrequency = document.getElementById("frequency");
    divLocation = document.getElementById("location");
    fullEventWrapper = document.querySelector(".full-event-wrapper");
    fullEventTitle = document.querySelector(".full-event-title");
    fullEventTime = document.querySelector(".full-event-time");
    fullEventDescription = document.querySelector(".full-event-description");
    fullEventDates = document.querySelector(".full-event-dates");
    doFullEventBtn = document.querySelector(".do-event-btn");
    deleteFullEventBtn = document.querySelector(".delete-event-btn");
    closeFullEventBtn = document.getElementById("closeFullEvent");
    divWeekday = document.getElementById("div-weekday");
    divUntil = document.getElementById("div-until");


    today = await getToday();
    if (!today) {
        return;
    }
    month = today.getMonth();
    year = today.getFullYear();

    addEvent();

    // Caricamento eventi e inizializzazione del calendario
    fetchEvents().then(() => {
        initCalendar();
    });

    defineProperty();
});

async function fetchEvents() {
    return fetch("http://localhost:3000/events")
        .then((response) => response.text())
        .then((data) => {
            eventsArr = JSON.parse(data); // Popola l'array eventsArr con i dati

            eventsArr.forEach((eventObj) => {
                // let sDate = new Date(eventObj.start);
                // let eDate = new Date(eventObj.start);

                eventObj.start = convertUTCToLocalISO(eventObj.start);
                eventObj.end = convertUTCToLocalISO(eventObj.end);
            });
        })
        .catch((error) => {
            console.error("Errore nel recupero degli eventi:", error); // Gestisce gli errori
        });
}

function convertUTCToLocalISO(utcDateStr) {
    if (utcDateStr) {
        const date = new Date(utcDateStr); // crea data da stringa UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // mese da 0 a 11
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    } else {
        return "";
    }
}


function changeStatus() {
    //to-do
}

//function to add days in days with class day and prev-date next-date on previous month and next month days and active on today
function initCalendar(referenceDay = normalizeDate(today)) {
    //setto randomicamente lo stato degli eventi passati
    changeStatus();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    const prevDays = prevLastDay.getDate();
    const lastDate = lastDay.getDate();
    const day = firstDay.getDay();

    // Cambia la logica per spostare la settimana a partire da lunedì
    const shift = day === 0 ? 6 : day - 1;  // Se è domenica (0), la settimana deve iniziare da lunedì (6)

    const nextDays = 7 - ((shift + lastDate) % 7);

    date.innerHTML = months[month] + " " + year;

    let days = "";

    for (let x = shift; x > 0; x--) {
        days += `<div class="day prev-date">${prevDays - x + 1}</div>`;
    }

    for (let i = 1; i <= lastDate; i++) {
        let event = "";
        let activity = "";
        let data = new Date(year, month, i);
        eventsArr.forEach((eventObj) => {

            let dayStart = normalizeDate(new Date(eventObj.start));
            let dayEnd = normalizeDate(new Date(eventObj.end));
            // if (eventObj.day === i && eventObj.month === month + 1 && eventObj.year === year) {
            if (data >= dayStart && data <= dayEnd) {
                event = " event";
            }
            if (eventObj.start === "" && data.toLocaleString("it-IT") === dayEnd.toLocaleString("it-IT")) {
                activity = " activity";
            }
        });
        if (data.toLocaleString("it-IT") === normalizeDate(today).toLocaleString("it-IT")) {
            if (referenceDay.toLocaleString("it-IT") === normalizeDate(today).toLocaleString("it-IT")) {
                activeDay = i;
                getActiveDay(i);
                updateEvents(i);
                days += `<div class="day today active${event}${activity}">${i}</div>`;
            } else {
                days += `<div class="day today${event}${activity}">${i}</div>`;
            }
        } else {
            if (referenceDay.toLocaleString("it-IT") === data.toLocaleString("it-IT")) {
                activeDay = i;
                getActiveDay(i);
                updateEvents(i);
                days += `<div class="day${event}${activity}">${i}</div>`;
            } else {
                days += `<div class="day${event}${activity}">${i}</div>`;
            }
        }
    }

    for (let j = 1; j <= nextDays; j++) {
        days += `<div class="day next-date">${j}</div>`;
    }

    daysContainer.innerHTML = days;
    addListner();
}

//function to add month and year on prev and next button
function prevMonth() {
    month--;
    if (month < 0) {
        month = 11;
        year--;
    }
    initCalendar();
}

function nextMonth() {
    month++;
    if (month > 11) {
        month = 0;
        year++;
    }
    initCalendar();
}

//function to add active on day
function addListner() {
    const days = document.querySelectorAll(".day");
    days.forEach((day) => {
        day.addEventListener("click", (e) => {
            getActiveDay(e.target.innerHTML);
            updateEvents(Number(e.target.innerHTML));
            activeDay = Number(e.target.innerHTML);
            //remove active
            days.forEach((day) => {
                day.classList.remove("active");
            });
            //if clicked prev-date or next-date switch to that month
            if (e.target.classList.contains("prev-date")) {
                prevMonth();
                //add active to clicked day after month is change
                setTimeout(() => {
                    //add active where no prev-date or next-date
                    const days = document.querySelectorAll(".day");
                    days.forEach((day) => {
                        if (
                            !day.classList.contains("prev-date") &&
                            day.innerHTML === e.target.innerHTML
                        ) {
                            day.classList.add("active");
                        }
                    });
                }, 100);
            } else if (e.target.classList.contains("next-date")) {
                nextMonth();
                //add active to clicked day after month is changed
                setTimeout(() => {
                    const days = document.querySelectorAll(".day");
                    days.forEach((day) => {
                        if (
                            !day.classList.contains("next-date") &&
                            day.innerHTML === e.target.innerHTML
                        ) {
                            day.classList.add("active");
                        }
                    });
                }, 100);
            } else {
                e.target.classList.add("active");
            }
        });
    });
}

function gotoDate() {
    const dateArr = dateInput.value.split("-");
    if (dateArr.length === 3) {
        if (dateArr[1] > 0 && dateArr[1] < 13 && dateArr[0].length === 4) {
            month = parseInt(dateArr[1]) - 1;
            year = parseInt(dateArr[0]);
            initCalendar();
            return;
        }
    }
    alert("Invalid Date");
}

//function get active day name and date and update eventday eventdate
function getActiveDay(date) {
    const day = new Date(year, month, date);

    // Ottieni il nome del giorno della settimana in italiano
    const dayName = day.toLocaleDateString('it-IT', {weekday: 'long'});

    // Aggiorna eventDay con il nome del giorno in italiano
    eventDay.innerHTML = dayName;

    // Aggiorna eventDate con il formato giorno mese anno
    eventDate.innerHTML = date + " " + months[month] + " " + year;
}

function formatLocalTime(utcString) {
    const formatOptions = {hour: "2-digit", minute: "2-digit", hour12: true};

    const date = new Date(utcString); // Convert the UTC string to a Date object
    const formatter = new Intl.DateTimeFormat(undefined, formatOptions); // `undefined` uses the client's locale
    return formatter.format(date); // Returns something like "12:15 PM"
}


//function update events when a day is active
function updateEvents(date) {
    let events = "";

    // Itera su tutti gli eventi in eventsArr
    eventsArr.forEach((event) => {
        let data = new Date(year, month, date);
        let dayStart = normalizeDate(new Date(event.start));
        let dayEnd = normalizeDate(new Date(event.end));

        if (dayStart <= data && data <= dayEnd) {
            //formatto l'ora
            let formattedTimeRange;
            let formattedStart, formattedEnd;
            if (dayStart < data && data < dayEnd) {
                formattedTimeRange = "all day";
            } else {
                formattedStart = date === dayStart.getDate() ? formatLocalTime(event.start) : "";
                formattedEnd = date === dayEnd.getDate() ? formatLocalTime(event.end) : "";
                formattedTimeRange = `${formattedStart} - ${formattedEnd}`;
            }


            // Aggiungi l'evento alla variabile events come HTML
            events += `
                <div class="event">
                  <div class="title">
                    <i class="fas fa-circle"></i>
                    <h3 class="event-title">${event.title}</h3>
                  </div>
                  <div class="event-time">
                    <span class="event-time">${formattedTimeRange}</span>
                  </div>
                </div>`;
        } else if (event.start === "" && data.getTime() === dayEnd.getTime()) {
            let formattedEnd = formatLocalTime(event.end);
            let type = (today) > (new Date(event.end)) ? "activity expired" : "activity";
            // Aggiungi l'evento alla variabile events come HTML
            events += `
                <div class="${type}">
                  <div class="title">
                    <i class="fas fa-circle"></i>
                    <h3 class="activity-title">${event.title}</h3>
                  </div>
                  <div class="activity-time">
                    <span class="activity-time">${formattedEnd}</span>
                  </div>
                </div>`;
        }
    });


    // Se non ci sono eventi, mostra un messaggio di "No Events"
    if (events === "") {
        events = `<div class="no-event">
                <h3>No Events</h3>
              </div>`;
    }

    // Aggiorna il contenitore degli eventi
    eventsContainer.innerHTML = events;

    // Chiama la funzione per salvare gli eventi (se necessario)
    fetchEvents();
}

function defineProperty() {
    var osccred = document.createElement("div");

    osccred.style.position = "absolute";
    osccred.style.bottom = "0";
    osccred.style.right = "0";
    osccred.style.fontSize = "10px";
    osccred.style.color = "#ccc";
    osccred.style.fontFamily = "sans-serif";
    osccred.style.padding = "5px";
    osccred.style.background = "#fff";
    osccred.style.borderTopLeftRadius = "5px";
    osccred.style.borderBottomRightRadius = "5px";
    osccred.style.boxShadow = "0 0 5px #ccc";
    document.body.appendChild(osccred);
}

function convertTime(time) {
    //convert time to 24 hour format
    let timeArr = time.split(":");
    let timeHour = timeArr[0];
    let timeMin = timeArr[1];
    let timeFormat = timeHour >= 12 ? "PM" : "AM";
    timeHour = timeHour % 12 || 12;
    time = timeHour + ":" + timeMin + " " + timeFormat;
    return time;
}


/**
 Aggiunta eventi agli elementi del dom
 */
function addEvent() {
    prev.addEventListener("click", prevMonth);

    next.addEventListener("click", nextMonth);

    logOutBtn.addEventListener("click", logOut);

    todayBtn.addEventListener("click", async () => {
        if (dateInput.value) {
            await setToday(dateInput.value);
            initCalendar();
        }
    });

    resetTodayBtn.addEventListener("click", async () => {
        await setToday(new Date());
        initCalendar();
    });

    dateInput.addEventListener("input", (e) => {
        if (dateInput.value.length > 10) {
            let d = dateInput.value;
            let first = d.slice(0, 4);
            d = d.split("-");
            d[0] = first;
            dateInput.value = d.join("-");
        }
    });

    gotoBtn.addEventListener("click", gotoDate);

    //function to view activity
    viewActivityBtn.addEventListener("click", () => {
        //aggiungo le attività al wrapper
        loadActivity();

        viewActivityWrapper.classList.toggle("active");
    });

    viewActivityCloseBtn.addEventListener("click", () => {
        viewActivityWrapper.classList.remove("active");
    });


    //function to time machine
    downloadEventsBtn.addEventListener("click", () => {
        axios.get('/events/iCalendar', {responseType: 'blob'})
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'your_events.ics';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            });
    });


//function to add event
    addEventBtn.addEventListener("click", () => {
        const selectedRadio = document.querySelector('input[name="radio"]:checked');
        if (selectedRadio.value === "event") {
            setEventData();
        }

        addEventWrapper.classList.toggle("active");
    });

    addEventCloseBtn.addEventListener("click", () => {
        addEventWrapper.classList.remove("active");
    });

    document.addEventListener("click", (e) => {
        if (e.target !== addEventBtn && !addEventWrapper.contains(e.target)) {
            addEventWrapper.classList.remove("active");
        }
        if (!viewActivityWrapper.contains(e.target) && e.target !== viewActivityBtn && !fullEventWrapper.contains(e.target)) {
            viewActivityWrapper.classList.remove("active");
        }
        if (!eventsContainer.contains(e.target) && e.target !== closeFullEventBtn && !fullEventWrapper.contains(e.target)) {
            fullEventWrapper.classList.remove("active");
        }
    });

//allow 50 chars in eventtitle
    addEventTitle.addEventListener("input", (e) => {
        addEventTitle.value = addEventTitle.value.slice(0, 60);
    });

//function to add event to eventsArr
    addEventSubmit.addEventListener("click", async () => {
        const eventTitle = addEventTitle.value;
        const eventDescription = addEventDescription.value;
        let eventTimeFrom = addEventFrom.value;
        const eventTimeTo = addEventTo.value;
        const eventLocation = addEventLocation.value;
        const eventFrequency = addEventFrequency.value;
        // let eventInterval = addEventInterval.value;
        const radio = document.querySelector('input[name="radio"]:checked');
        const weekday = document.getElementById("weekday")?.value; // You need .value here!
        const untilLocal = document.getElementById("until")?.value;
        let newEvent;


        if (radio.value === "event") {
            if (eventTitle === "" || eventTimeFrom === "" || eventTimeTo === "" || eventDescription === "") {
                alert("Please fill all the fields");
                return;
            }


            newEvent = {
                title: eventTitle,
                description: eventDescription,
                start: new Date(eventTimeFrom).toISOString(),
                end: new Date(eventTimeTo).toISOString()
            };

            if (eventLocation) {
                newEvent.location = eventLocation;
            }
            if (eventFrequency) {
                const options = {
                    freq: eventFrequency,
                    dtstart: new Date(eventTimeFrom).toISOString() // Make sure this is a valid Date object
                };

                if (eventFrequency === "WEEKLY" && weekday) {
                    options.byweekday = weekday.toUpperCase(); // Ensure it's like "MO", "TU", etc.
                }

                if (untilLocal) {
                    options.until = new Date(untilLocal); // Make sure this is in a format JS can parse
                }

                newEvent.rrule = options;
            }
        } else if (radio.value === "activity") {
            if (eventTitle === "" || eventTimeTo === "" || eventDescription === "") {
                alert("Please fill all the fields");
                return;
            }
            newEvent = {
                title: eventTitle,
                description: eventDescription,
                start: "",
                end: new Date(eventTimeTo).toISOString()
            };
        }


        try {
            // Invia l'evento al server
            const response = await fetch("http://localhost:3000/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newEvent), // L'API si aspetta un array di eventi
            });

            if (!response.ok) {
                throw new Error("Errore durante il salvataggio dell'evento");
            }

            await response.text(); // Leggi la risposta come testo

            // Reset dei campi di input
            addEventTitle.value = "";
            addEventFrom.value = "";
            addEventTo.value = "";
            addEventDescription.value = "";
            // addEventInterval.value = "";
            addEventFrequency.value = "";
            addEventLocation.value = "";
            addEventWrapper.classList.remove("active");

            // Aggiorna la UI
            await fetchEvents(); // Aspetta il completamento di fetchEvents
            initCalendar(new Date(year, month, activeDay));
        } catch (error) {
            console.error(error);
            alert("Errore durante il salvataggio dell'evento");
        }
    });

//function to view event/activity when clicked on it
    eventsContainer.addEventListener("click", (e) => {
        // Trova gli eventi del giorno selezionato
        const selectedDayEvents = eventsArr.filter(
            (event) => {
                return isBetween(event) || isActivityInActiveDay(event);
            }
        );

        if (selectedDayEvents.length) {
            let nodes = Array.from(e.target.parentNode.children);
            // Trova l'indice dell'elemento cliccato tra i figli
            const indexOfClicked = nodes.indexOf(e.target);

            if (indexOfClicked !== -1) {
                const eventToDelete = selectedDayEvents[indexOfClicked];
                if (eventToDelete) {
                    openFullEventView(eventToDelete, removeEvent);
                    fullEventWrapper.classList.add("active");
                }
                /*else {
                  alert(`evento o  attivita non trovata.`);
                }*/
            }
        }
    });

    //function to visualize the field for the input: event/activity
    Array.from(eventType).forEach((radio) => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "event") {
                setEventData();
                divEventStart.style.display = "flex";
                divFrequency.style.display = "flex";
                divLocation.style.display = "flex";
                addEventSubmit.innerText = "Add Event";
            } else if (e.target.value === "activity") {
                //elimino data e ora se impostate
                addEventTo.value = "";
                addEventFrom.value = "";
                divEventStart.style.display = "none";
                divFrequency.style.display = "none";
                divLocation.style.display = "none";
                addEventSubmit.innerText = "Add Activity";
            }
        })
    });

    //function to view activity when clicked on activity in the activity list
    viewActivityBody.addEventListener("click", (e) => {
        // Trova tutte le attività
        let activity = eventsArr.filter((a) => a.start === "");
        activity.sort((a, b) => a.end.localeCompare(b.end));

        let nodes = Array.from(e.target.parentNode.children);
        // Trova l'indice dell'elemento cliccato tra i figli
        const indexOfClicked = nodes.indexOf(e.target);
        let event = activity[indexOfClicked];

        openFullEventView(event, removeActivity);
        fullEventWrapper.classList.add("active");

        //faccio in modo che l'evento non venga propagato ulteriormente
        e.stopPropagation();
    });

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            setTimeout(async () => {
                today = await getToday();
                if (!today) {
                    return;
                }
                month = today.getMonth();
                year = today.getFullYear();

                addEvent();

                // Caricamento eventi e inizializzazione del calendario
                fetchEvents().then(() => {
                    initCalendar();
                });
            }, 0);
        }
    });

    addEventFrequency.addEventListener("change", (event) => {
        if (addEventFrequency.value) {
            divUntil.style.display = "flex";
        } else {
            divUntil.style.display = "none";
        }

        if (addEventFrequency.value === "WEEKLY") {
            divWeekday.style.display = "flex";
        } else {
            divWeekday.style.display = "none";
        }
    });
}

function removeEvent(e) {
    let type = e.start === "" ? "activity" : "event";
    // Rimuovi l'evento dal db
    deleteEventOnDB(e, type);
    fullEventWrapper.classList.remove("active");
}

function removeActivity(activityToDelete) {
    if (activityToDelete) {
        // Rimuovo l'attività dal db
        deleteEventOnDB(activityToDelete, "activity");
        let index = eventsArr.indexOf(activityToDelete)
        eventsArr.splice(index, 1);
        loadActivity();
        fullEventWrapper.classList.remove("active");
    } else {
        alert("attività non trovata.");
    }
}

function deleteEventOnDB(eventToDelete, type) {
    // Rimuovi l'evento dal db
    fetch(`http://localhost:3000/events`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(eventToDelete),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Errore durante l'eliminazione dell'evento");
            }

            for (let i = eventsArr.length - 1; i >= 0; i--) {
                if (eventsArr[i]._id === eventToDelete._id) {
                    eventsArr.splice(i, 1);
                }
            }


            //aggiorna l'interfaccia
            initCalendar(new Date(year, month, activeDay));
        })
        .catch((error) => {
            console.error(error);
            alert(`Errore durante l'eliminazione dell'${type}.`);
        });
}

async function logOut() {
    await fetch("http://localhost:3000/logout")
        .then(res => res.json())
        .then(dati => {
            window.location.href = "/";
        })
        .catch(console.error);
}

async function setToday(date) {
    today = new Date(date);
    month = today.getMonth();
    year = today.getFullYear();

    try {
        const response = await fetch("http://localhost:3000/setToday", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({newDate: today})
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Errore nell'invio della data");
        }
    } catch (error) {
        console.error("Errore:", error);
    }
}

function normalizeDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isBetween(event) {
    const data = new Date(year, month, activeDay);
    const dayStart = normalizeDate(new Date(event.start));
    const dayEnd = normalizeDate(new Date(event.end));

    return data >= dayStart && data <= dayEnd;
}

function isActivityInActiveDay(event) {
    const data = new Date(year, month, activeDay);
    const endDay = normalizeDate(new Date(event.end));

    return endDay.getTime() === data.getTime();
}

function isEventInActiveDay(event) {
    const data = new Date(year, month, activeDay);
    const dayStart = normalizeDate(new Date(event.start));
    const dayEnd = normalizeDate(new Date(event.end));

    return data.toLocaleString("it-IT") === dayStart.toLocaleString("it-IT") && data.toLocaleString("it-IT") === dayEnd.toLocaleString("it-IT");
}

function loadActivity() {
    const activity = eventsArr.filter((a) => a.start === "");
    let newActivity = "";

    //ordino le attività in ordine crescente per data e le visualizzo
    activity.sort((a, b) => a.end.localeCompare(b.end));

    activity.forEach((a) => {
        // const tempToday = new Date();
        // tempToday.setDate(today.getDate());
        const timeEnd = new Date(a.end);
        let type = (today) > (timeEnd) ? "activity expired" : "activity";
        newActivity += `
        <div class="${type}">
          <div class="title">
            <i class="fas fa-circle"></i>
            <h3 class="activity-title">${a.title}</h3>
          </div>
          <div class="activity-time">
            <span class="activity-time">completare entro - ${timeEnd.toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit"
        })}</span>
          </div>
        </div>`;
    });

    if (!activity.length) {
        newActivity += `<h3 class="no-activity">No Activities</h3>`;
    }
    viewActivityBody.innerHTML = "";
    viewActivityBody.innerHTML = newActivity;
}

function formatDateToLocalISO(date) {
    const offset = date.getTimezoneOffset(); // Differenza fuso orario in minuti
    date = new Date(date.getTime() - offset * 60000); // Corregge il fuso orario
    return date.toISOString().slice(0, 16); // Formatta YYYY-MM-DDTHH:MM
}

function setEventData() {
    // Ottieni data e ora attuali in fuso orario locale
    let now = new Date(today);
    now.setDate(activeDay);
    const nowFormatted = formatDateToLocalISO(now);

    // Aggiungi 30 minuti
    const later = new Date(now.getTime() + 30 * 60000);
    const laterFormatted = formatDateToLocalISO(later);

    // Imposta i valori negli input
    addEventFrom.value = nowFormatted;
    addEventTo.value = laterFormatted;
}

async function getToday() {
    try {
        const response = await fetch("http://localhost:3000/get-today");
        if (!response.ok) throw new Error("Errore nel recupero della data");
        const data = await response.json();
        return new Date(data.today); // Converte la stringa ISO in oggetto Date
    } catch (error) {
        console.error("Errore:", error);
        return null;
    }
}

function openFullEventView(event, menageEvent) {
    // Imposta i contenuti dell'evento completo
    fullEventTitle.textContent = event.title;
    fullEventDescription.textContent = event.description;
    fullEventTime.textContent = `completare entro - ${formatLocalTime(event.end)}`;
    doFullEventBtn.setAttribute("data-id", event._id);
    deleteFullEventBtn.setAttribute("data-id", event._id);

    // Mostra la vista completa della nota
    fullEventWrapper.classList.remove("hidden");

    // Eventi per la chiusura della vista completa
    closeFullEventBtn.addEventListener("click", () => {
        fullEventWrapper.classList.remove("active");
    });

    //riassegno gli elementi del dom per eliminare gli eventi
    let newElementDelete = deleteFullEventBtn.cloneNode(true);
    let newElementDo = doFullEventBtn.cloneNode(true);
    deleteFullEventBtn.parentNode.replaceChild(newElementDelete, deleteFullEventBtn);
    doFullEventBtn.parentNode.replaceChild(newElementDo, doFullEventBtn);

    deleteFullEventBtn = newElementDelete;
    doFullEventBtn = newElementDo;

    //assegno i nuovi eventi
    deleteFullEventBtn.addEventListener("click", () => menageEvent(event));
    doFullEventBtn.addEventListener("click", () => menageEvent(event));
}

function convertGmtToUTC(dateStr, hourFromUTC) {
    // Parse the date as if it's in local GMT+2 time
    const localDate = new Date(dateStr);

    // Get the time in milliseconds
    const utcMillis = localDate.getTime() - (hourFromUTC * 60 * 60 * 1000);

    // Return as ISO string with Z (UTC)
    return new Date(utcMillis);
}
