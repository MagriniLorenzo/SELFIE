// Dichiarazione delle variabili globali
var calendar, date, daysContainer, prev, next, todayBtn, gotoBtn, dateInput,
    eventDay, eventDate, eventsContainer, addEventBtn, addEventWrapper,
    addEventCloseBtn, addEventTitle, addEventFrom, addEventTo, addEventSubmit,
    addEventDescription, eventType, divEventStart, viewActivityBtn, timeMachineBtn,
    timeMachineWrapper, timeMachineCloseBtn,viewActivityWrapper, viewActivityCloseBtn,
    viewActivityBody;

let today = new Date();
let activeDay;
let month = today.getMonth();
let year = today.getFullYear();
// let tempToday;

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
  addEventCloseBtn = document.querySelector(".add-event-wrapper .add-event-header .close");
  addEventTitle = document.querySelector(".event-name");
  addEventFrom = document.querySelector(".event-time-from");
  addEventTo = document.querySelector(".event-time-to");
  addEventSubmit = document.querySelector(".add-event-btn");
  addEventDescription = document.querySelector(".event-description");
  eventType= document.getElementsByName("radio");
  divEventStart= document.getElementById("eventStart");
  viewActivityBtn = document.querySelector(".view-activity");
  timeMachineBtn = document.querySelector(".time-machine");
  timeMachineWrapper = document.querySelector(".time-machine-wrapper");
  timeMachineCloseBtn = document.querySelector(".time-machine-wrapper .add-event-header .close");
  viewActivityWrapper = document.querySelector(".view-activity-wrapper");
  viewActivityCloseBtn = document.querySelector(".view-activity-wrapper .add-event-header .close");
  viewActivityBody = document.querySelector(".view-activity-body");
  document.querySelector("#LogOut").addEventListener("click", logOut);
  document.querySelector(".SetToday-btn").addEventListener("click", setToday);



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
      })
      .catch((error) => {
        console.error("Errore nel recupero degli eventi:", error); // Gestisce gli errori
      });
}

function changeStatus() {
  //to-do
}

//function to add days in days with class day and prev-date next-date on previous month and next month days and active on today
function initCalendar(referenceDay=normalizeDate(today)) {
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
    let data = new Date(year,month,i);
    eventsArr.forEach((eventObj) => {
      let dayStart = normalizeDate(new Date(eventObj.start));
      let dayEnd = normalizeDate(new Date(eventObj.end));
      // if (eventObj.day === i && eventObj.month === month + 1 && eventObj.year === year) {
      if(data >= dayStart && data <= dayEnd){
        event = " event";
      }
      if(eventObj.start==="" && data.toLocaleString("it-IT") === dayEnd.toLocaleString("it-IT")){
        activity = " activity" ;
      }
    });
    if (data.toLocaleString("it-IT")===normalizeDate(today).toLocaleString("it-IT")) {
      if(referenceDay.toLocaleString("it-IT")===normalizeDate(today).toLocaleString("it-IT")){
        activeDay = i;
        getActiveDay(i);
        updateEvents(i);
        days += `<div class="day today active${event}${activity}">${i}</div>`;
      }else{
        days += `<div class="day today${event}${activity}">${i}</div>`;
      }
    } else {
      if(referenceDay.toLocaleString("it-IT")===data.toLocaleString("it-IT")){
        activeDay = i;
        getActiveDay(i);
        updateEvents(i);
        days += `<div class="day${event}${activity}">${i}</div>`;
      }else{
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
  const dayName = day.toLocaleDateString('it-IT', { weekday: 'long' });

  // Aggiorna eventDay con il nome del giorno in italiano
  eventDay.innerHTML = dayName;

  // Aggiorna eventDate con il formato giorno mese anno
  eventDate.innerHTML = date + " " + months[month] + " " + year;
}

//function update events when a day is active
function updateEvents(date) {
  let events = "";
  const formatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };

  // Itera su tutti gli eventi in eventsArr
  eventsArr.forEach((event) => {
    let data = new Date(year,month,date);
    let dayStart = normalizeDate(new Date(event.start));
    let dayEnd = normalizeDate(new Date(event.end));
    if (dayStart <= data  && data <= dayEnd) {
      //formatto l'ora
      let formattedStart,formattedEnd;
      if(dayStart < data && data < dayEnd) {
        formattedStart ="all";
        formattedEnd="day";
      // }else if(dayStart===dayEnd){
      //    formattedStart = (new Date(event.start)).toLocaleTimeString("it-IT", formatOptions);
      //    formattedEnd = (new Date(event.end)).toLocaleTimeString("it-IT", formatOptions);
      }else{
         formattedStart = date===dayStart.getDate()?(new Date(event.start)).toLocaleTimeString("it-IT", formatOptions):"";
         formattedEnd = date===dayEnd.getDate()?(new Date(event.end)).toLocaleTimeString("it-IT", formatOptions):"";
      }

      let formattedTimeRange = `${formattedStart} - ${formattedEnd}`;


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
    }else if(event.start===""&&data.toLocaleDateString("it-IT")===dayEnd.toLocaleDateString("it-IT")){
      let formattedEnd = (new Date(event.end)).toLocaleTimeString("it-IT", formatOptions);

      let type= (new Date())>(new Date(event.end))?"activity expired":"activity";
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

  todayBtn.addEventListener("click", () => {
    today = new Date();
    month = today.getMonth();
    year = today.getFullYear();
    initCalendar();
  });

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
  timeMachineBtn.addEventListener("click", () => {
    timeMachineWrapper.classList.toggle("active");
  });

  timeMachineCloseBtn.addEventListener("click", () => {
    timeMachineWrapper.classList.remove("active");
  });



//function to add event
  addEventBtn.addEventListener("click", () => {
    const selectedRadio = document.querySelector('input[name="radio"]:checked');
    if(selectedRadio.value==="event") {
      setEventData();
    }

    addEventWrapper.classList.toggle("active");
  });

  addEventCloseBtn.addEventListener("click", () => {
    addEventWrapper.classList.remove("active");
  });

  // ???
  document.addEventListener("click", (e) => {
    if (e.target !== addEventBtn && !addEventWrapper.contains(e.target)) {
      addEventWrapper.classList.remove("active");
    }
    if(e.target !== timeMachineBtn && !timeMachineWrapper.contains(e.target)){
      timeMachineWrapper.classList.remove("active");
    }
    if(e.target !== viewActivityWrapper && e.target !== viewActivityBtn){
      viewActivityWrapper.classList.remove("active");
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
    const radio = document.querySelector('input[name="radio"]:checked');

    if(radio.value==="event") {
      if (eventTitle === "" || eventTimeFrom === "" || eventTimeTo === "" || eventDescription === "") {
        alert("Please fill all the fields");
        return;
      }
    }else if(radio.value==="activity"){
      if (eventTitle === "" || eventTimeTo === "" || eventDescription === "") {
        alert("Please fill all the fields");
        return;
      }
      eventTimeFrom="";
    }

    const newEvent = {
      title: eventTitle,
      location: "The Bar, New York, NY",
      description: eventDescription,
      start: eventTimeFrom,
      end: eventTimeTo,
      attendees: [
        {
          "name": "John Doe",
          "email": "john@doe.com",
          "icsOptions": {
            "rsvp": true
          }
        },
        {
          "name": "Jane Doe",
          "email": "jane@doe.com"
        }
      ],
      recurrence: {
        "frequency": "WEEKLY",
        "interval": 2
      }
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

      // Reset dei campi di input
      addEventTitle.value = "";
      addEventFrom.value = "";
      addEventTo.value = "";
      addEventDescription.value = "";
      addEventWrapper.classList.remove("active");

      // Aggiorna la UI
      await fetchEvents(); // Aspetta il completamento di fetchEvents
      initCalendar(new Date(year,month,activeDay));
    } catch (error) {
      console.error(error);
      alert("Errore durante il salvataggio dell'evento");
    }
  });

//function to delete event when clicked on event
  eventsContainer.addEventListener("click", (e) => {
    let type = "event";
    if (e.target.closest(".event")) {
      removeEvent(type,e);
    }else if(e.target.closest(".activity")){
      type="activity";
      removeEvent(type,e);
    }
  });

  //function to visualize the field for the input: event/actiivity
  Array.from(eventType).forEach((radio)=>{
      radio.addEventListener("change",(e)=>{
      if (e.target.value === "event") {
        setEventData();
        divEventStart.style.display = "flex";
      } else if(e.target.value === "activity"){
        //elimino data e ora se impostate
        addEventTo.value="";
        addEventFrom.value="";
        divEventStart.style.display = "none";
      }
    })
  });

  //function to delete activity when clicked on activity in the activity list
  viewActivityBody.addEventListener("click", (e) => {
      removeActivity(e);
  });

}

function removeEvent(type, e){
  if (confirm(`Are you sure you want to delete this ${type}?`)) {
    const eventElement = e.target.closest(`.${type}`)
    const eventTitle = eventElement.querySelector(`.${type}-title`).innerHTML;
    let data = new Date(year,month,activeDay);

    // Trova gli eventi del giorno selezionato
    const selectedDayEvents = eventsArr.filter(
        (event) =>{
          return isBetween(event)||isActivityInActiveDay(event);
        }
    );

    let nodes = Array.from(e.target.parentNode.children);
    // Trova l'indice dell'elemento cliccato tra i figli
    const indexOfClicked = nodes.indexOf(e.target);

    if (indexOfClicked !== -1) {
      const eventToDelete = selectedDayEvents[indexOfClicked];

      // Rimuovi l'evento dal db
      deleteEventOnDB(eventToDelete, type);
    } else {
      alert(`${type} non trovato.`);
    }
  }
}

function removeActivity(e){
  if (confirm("Are you sure you want to delete this activity?")) {
    const eventElement = e.target.closest(".activity")

    // Trova tutte le attività
    const activity = eventsArr.filter((a)=>a.start==="");

    let nodes = Array.from(e.target.parentNode.children);
    // Trova l'indice dell'elemento cliccato tra i figli
    const indexOfClicked = nodes.indexOf(e.target);

    if (indexOfClicked !== -1) {
      const activityToDelete = activity[indexOfClicked];

      // Rimuovo l'attività dal db
      deleteEventOnDB(activityToDelete, "activity");
    } else {
      alert("attività non trovata.");
    }
  }
}

function deleteEventOnDB(eventToDelete, type){
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
        let eventIndex = eventsArr.indexOf(eventToDelete);
        // Rimuovi l'evento dall'array locale
        eventsArr.splice(eventIndex, 1);

        //aggiorna l'interfaccia
        initCalendar(new Date(year,month,activeDay));
      })
      .catch((error) => {
        console.error(error);
        alert(`Errore durante l'eliminazione dell'${type}.`);
      });
}

async function logOut(){
  await fetch("http://localhost:3000/logout")
      .then(res => res.json())
      .then(dati => {
        window.location.href = "/";
      })
      .catch(console.error);
}

function setToday() {
  if(dateInput.value){
    today = new Date(dateInput.value);
    month = today.getMonth();
    year = today.getFullYear();

    initCalendar();
  }
}

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isBetween(event){
  const data = new Date(year, month, activeDay);
  const dayStart = normalizeDate(new Date(event.start));
  const dayEnd = normalizeDate(new Date(event.end));

  return data >= dayStart && data <= dayEnd;
}

function isActivityInActiveDay(event){
  const data = new Date(year, month, activeDay);
  const endDay = normalizeDate(new Date(event.end));

  return endDay.toLocaleString("it-IT")===data.toLocaleString("it-IT");
}

function isEventInActiveDay(event){
  const data = new Date(year, month, activeDay);
  const dayStart = normalizeDate(new Date(event.start));
  const dayEnd = normalizeDate(new Date(event.end));

  return data.toLocaleString("it-IT") === dayStart.toLocaleString("it-IT") && data.toLocaleString("it-IT") === dayEnd.toLocaleString("it-IT");
}

function loadActivity(){
  const activity = eventsArr.filter((a)=> a.start==="");
  let newActivity = "";
  activity.forEach((a)=>{
    let type= (new Date())>(new Date(a.end))?"activity expired":"activity";
    newActivity +=`
        <div class="${type}">
          <div class="title">
            <i class="fas fa-circle"></i>
            <h3 class="activity-title">${a.title}</h3>
          </div>
          <div class="activity-time">
            <span class="activity-time">${a.end}</span>
          </div>
        </div>`;
  });
  viewActivityBody.innerHTML=newActivity;
}

function formatDateToLocalISO(date) {
  const offset = date.getTimezoneOffset(); // Differenza fuso orario in minuti
  date = new Date(date.getTime() - offset * 60000); // Corregge il fuso orario
  return date.toISOString().slice(0, 16); // Formatta YYYY-MM-DDTHH:MM
}

function setEventData(){
  // Ottieni data e ora attuali in fuso orario locale
  const now = new Date();
  now.setDate(activeDay);
  const nowFormatted = formatDateToLocalISO(now);

  // Aggiungi 30 minuti
  const later = new Date(now.getTime() + 30 * 60000);
  const laterFormatted = formatDateToLocalISO(later);

  // Imposta i valori negli input
  addEventFrom.value = nowFormatted;
  addEventTo.value = laterFormatted;

}