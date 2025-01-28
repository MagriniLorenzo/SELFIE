document.addEventListener("DOMContentLoaded", () => {
    const listaEventi = document.getElementById("events-list");
    const currentWeek = document.getElementById("current-week");
    const weekDaysContainer = document.querySelector(".week-days");
    const eventsTodayTitle = document.getElementById("events-today-title");
    const notesList = document.getElementById("notes-list");

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
            return `<div class="week-day ${isToday ? 'today' : ''}" data-date="${day.toISOString()}">${dayName} ${day.getDate()}</div>`;
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
                    const dataEvento = new Date(evento.year, evento.month - 1, evento.day);
                    return normalizeDate(dataEvento).getTime() === normalizeDate(data).getTime();
                });

                if (listaEventi) {
                    listaEventi.innerHTML = eventiDaMostrare.length
                        ? eventiDaMostrare.map(evento => `<li>${evento.time} - ${evento.title}</li>`).join('')
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





    displayWeekDays();
    displayCurrentWeek();
    recuperaEventi(new Date());
    recuperaNote();

    const preSelectToday = () => {
        const today = weekDaysContainer.querySelector(".today");
        if (today) {
            today.classList.add("selected");
            eventsTodayTitle.textContent = "Eventi di Oggi";
            recuperaEventi(new Date());
        }
    };

    if (weekDaysContainer) {
        weekDaysContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("week-day")) {
                const selectedDay = weekDaysContainer.querySelector(".week-day.selected");
                if (selectedDay) {
                    selectedDay.classList.remove("selected");
                }
                e.target.classList.add("selected");

                const clickedDate = new Date(e.target.getAttribute('data-date'));
                if (normalizeDate(clickedDate).getTime() === normalizeDate(new Date()).getTime()) {
                    eventsTodayTitle.textContent = "Eventi di Oggi";
                } else {
                    eventsTodayTitle.textContent = `Eventi di ${clickedDate.toLocaleDateString('it-IT', { weekday: 'long' }).charAt(0).toUpperCase() + clickedDate.toLocaleDateString('it-IT', { weekday: 'long' }).slice(1)}`;
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
            window.location.href = "calendario.html";  // Reindirizza a calendario.html
        }
    });

    // Aggiungi evento per tutto il widget calendar-widget tranne che sui giorni
    document.querySelector(".notes-widget").addEventListener("click", (e) => {
        window.location.href = "note.html";  // Reindirizza a calendario.html

    });

});
