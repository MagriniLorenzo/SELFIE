// Dichiarazione delle variabili globali
var calendar, date, daysContainer, prev, next, todayBtn, gotoBtn, dateInput,
    eventDay, eventDate, eventsContainer, addEventBtn, addEventWrapper,
    addEventCloseBtn, addEventTitle, addEventFrom, addEventTo, addEventSubmit;

let today = new Date();
let activeDay;
let month = today.getMonth();
let year = today.getFullYear();

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
document.addEventListener("DOMContentLoaded", () => {
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
  addEventCloseBtn = document.querySelector(".close");
  addEventTitle = document.querySelector(".event-name");
  addEventFrom = document.querySelector(".event-time-from");
  addEventTo = document.querySelector(".event-time-to");
  addEventSubmit = document.querySelector(".add-event-btn");
  document.querySelector("#LogOut").addEventListener("click", logOut);


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
      console.log(eventsArr); // Mostra gli eventi ricevuti
    })
    .catch((error) => {
      console.error("Errore nel recupero degli eventi:", error); // Gestisce gli errori
    });
}

//function to add days in days with class day and prev-date next-date on previous month and next month days and active on today
function initCalendar() {
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
    let event = false;
    eventsArr.forEach((eventObj) => {
      if (eventObj.day === i && eventObj.month === month + 1 && eventObj.year === year) {
        event = true;
      }
    });
    if (i === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth()) {
      activeDay = i;
      getActiveDay(i);
      updateEvents(i);
      if (event) {
        days += `<div class="day today active event">${i}</div>`;
      } else {
        days += `<div class="day today active">${i}</div>`;
      }
    } else {
      if (event) {
        days += `<div class="day event">${i}</div>`;
      } else {
        days += `<div class="day">${i}</div>`;
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
        //add active to clicked day afte month is change
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
        //add active to clicked day afte month is changed
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
  const dateArr = dateInput.value.split("/");
  if (dateArr.length === 3) {
    if (dateArr[1] > 0 && dateArr[1] < 13 && dateArr[2].length === 4) {
      month = dateArr[1] - 1;
      year = dateArr[2];
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
  const dayName = day.toLocaleDateString('it-IT', { weekday: 'long' });

  // Aggiorna eventDay con il nome del giorno in italiano
  eventDay.innerHTML = dayName;

  // Aggiorna eventDate con il formato giorno mese anno
  eventDate.innerHTML = date + " " + months[month] + " " + year;
}

//function update events when a day is active
function updateEvents(date) {
  let events = "";
  
  // Itera su tutti gli eventi in eventsArr
  eventsArr.forEach((event) => {
    // Verifica se il giorno, mese e anno corrispondono
    if (
      date === event.day && // Giorno
      month + 1 === event.month && // Mese (assicurati che month sia 0-based, quindi aggiungi 1)
      year === event.year // Anno
    ) {
      // Aggiungi l'evento alla variabile events come HTML
      events += `
        <div class="event">
          <div class="title">
            <i class="fas fa-circle"></i>
            <h3 class="event-title">${event.title}</h3>
          </div>
          <div class="event-time">
            <span class="event-time">${event.time}</span>
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

  todayBtn.addEventListener("click", () => {
    today = new Date();
    month = today.getMonth();
    year = today.getFullYear();
    initCalendar();
  });

  // dateInput.addEventListener("input", (e) => {
  //   dateInput.value = dateInput.value.replace(/[^0-9/]/g, "");
  //   if (dateInput.value.length === 2) {
  //
  //     dateInput.value = dateInput.value.charAt(1)=== "/"?"0"+dateInput.value.charAt(0)+"/":dateInput.value+"/";
  //   }
  //   if (dateInput.value.length === 5) {
  //     dateInput.value += "/";
  //   }
  //   if (dateInput.value.length > 10) {
  //     dateInput.value = dateInput.value.slice(0, 10);
  //   }
  //   if (e.inputType === "deleteContentBackward") {
  //     if (dateInput.value.length === 3) {
  //       dateInput.value = dateInput.value.slice(0, 2);
  //     }
  //     if (dateInput.value.length === 6) {
  //       dateInput.value = dateInput.value.slice(0, 5);
  //     }
  //   }
  // });

  dateInput.addEventListener("input", (e) => {
    if (dateInput.value.length > 10) {
      let d = dateInput.value;
      let first = d.slice(0,4);
      d=d.split("-");
      d[0]=first;
      dateInput.value = d.join("-");
    }
  });

  gotoBtn.addEventListener("click", gotoDate);

//function to add event
  addEventBtn.addEventListener("click", () => {
    addEventWrapper.classList.toggle("active");
  });

  addEventCloseBtn.addEventListener("click", () => {
    addEventWrapper.classList.remove("active");
  });

  document.addEventListener("click", (e) => {
    if (e.target !== addEventBtn && !addEventWrapper.contains(e.target)) {
      addEventWrapper.classList.remove("active");
    }
  });

//allow 50 chars in eventtitle
  addEventTitle.addEventListener("input", (e) => {
    addEventTitle.value = addEventTitle.value.slice(0, 60);
  });

//allow only time in eventtime from and to
  addEventFrom.addEventListener("input", (e) => {
    addEventFrom.value = addEventFrom.value.replace(/[^0-9:]/g, "");
    if (addEventFrom.value.length === 2) {
      addEventFrom.value += ":";
    }
    if (addEventFrom.value.length > 5) {
      addEventFrom.value = addEventFrom.value.slice(0, 5);
    }
  });

  addEventTo.addEventListener("input", (e) => {
    addEventTo.value = addEventTo.value.replace(/[^0-9:]/g, "");
    if (addEventTo.value.length === 2) {
      addEventTo.value += ":";
    }
    if (addEventTo.value.length > 5) {
      addEventTo.value = addEventTo.value.slice(0, 5);
    }
  });

//function to add event to eventsArr
  addEventSubmit.addEventListener("click", async () => {
    const eventTitle = addEventTitle.value;
    const eventTimeFrom = addEventFrom.value;
    const eventTimeTo = addEventTo.value;

    if (eventTitle === "" || eventTimeFrom === "" || eventTimeTo === "") {
      alert("Please fill all the fields");
      return;
    }

    // Check correct time format (24-hour)
    const timeFromArr = eventTimeFrom.split(":");
    const timeToArr = eventTimeTo.split(":");
    if (
        timeFromArr.length !== 2 ||
        timeToArr.length !== 2 ||
        timeFromArr[0] > 23 ||
        timeFromArr[1] > 59 ||
        timeToArr[0] > 23 ||
        timeToArr[1] > 59
    ) {
      alert("Invalid Time Format");
      return;
    }

    const timeFrom = convertTime(eventTimeFrom);
    const timeTo = convertTime(eventTimeTo);

    const newEvent = {
      title: eventTitle,
      time: `${timeFrom} - ${timeTo}`,
      day: activeDay,
      month: month + 1,
      year: year,
    };

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

      const data = await response.text(); // Leggi la risposta come testo
      console.log(data);

      // Reset dei campi di input
      addEventTitle.value = "";
      addEventFrom.value = "";
      addEventTo.value = "";
      addEventWrapper.classList.remove("active");

      // Aggiorna la UI
      await fetchEvents(); // Aspetta il completamento di fetchEvents
      updateEvents(activeDay);

      // Aggiungi classe "event" al giorno attivo
      const activeDayEl = document.querySelector(".day.active");
      if (activeDayEl && !activeDayEl.classList.contains("event")) {
        activeDayEl.classList.add("event");
      }
    } catch (error) {
      console.error(error);
      alert("Errore durante il salvataggio dell'evento");
    }
  });

//function to delete event when clicked on event
  eventsContainer.addEventListener("click", (e) => {
    if (e.target.closest(".event")) {
      if (confirm("Are you sure you want to delete this event?")) {
        const eventElement = e.target.closest(".event");
        const eventTitle = eventElement.querySelector(".event-title").innerHTML;

        // Trova l'evento corrispondente nell'array
        const eventIndex = eventsArr.findIndex(
            (event) =>
                event.title === eventTitle &&
                event.day === activeDay &&
                event.month === month + 1 &&
                event.year === year
        );

        if (eventIndex !== -1) {
          const eventToDelete = eventsArr[eventIndex];

          // Rimuovi l'evento dal file JSON sul server
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

                // Rimuovi l'evento dall'array locale
                eventsArr.splice(eventIndex, 1);

                // Aggiorna l'interfaccia
                updateEvents(activeDay);

                // Rimuovi la classe "event" dal giorno se non ci sono più eventi
                const activeDayEl = document.querySelector(".day.active");
                if (!eventsArr.some((event) => event.day === activeDay)) {
                  activeDayEl.classList.remove("event");
                }
              })
              .catch((error) => {
                console.error(error);
                alert("Errore durante l'eliminazione dell'evento.");
              });
        } else {
          alert("Evento non trovato.");
        }
      }
    }
  });
}

async function logOut(){
  await fetch("http://localhost:3000/logout")
      .then(res => res.json())
      .then(dati => {
        console.log(dati);
        window.location.href = "/";
      })
      .catch(console.error);

}
//function to save events in local storage
/*
function saveEvents() {
  localStorage.setItem("events", JSON.stringify(eventsArr));
}*/

//function to get events from local storage
/*
function getEvents() {
  //check if events are already saved in local storage then return event else nothing
  if (localStorage.getItem("events") === null) {
    return;
  }
  eventsArr.push(...JSON.parse(localStorage.getItem("events")));
}*/
