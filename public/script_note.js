// Selezioniamo gli elementi DOM
let notesContainer, notesList, addNoteBtn, addNoteWrapper,
    noteTitleInput, noteContentInput, submitNoteBtn, closeNoteBtn;

let notesArr = []; // Array per memorizzare le note

document.addEventListener("DOMContentLoaded",()=>{
    notesContainer = document.querySelector(".notes-container");
    notesList = document.querySelector(".notes-list");
    addNoteBtn = document.querySelector(".add-note-btn");
    addNoteWrapper = document.querySelector(".add-note-wrapper");
    noteTitleInput = document.querySelector(".note-title");
    noteContentInput = document.querySelector(".note-content");
    submitNoteBtn = document.querySelector(".submit-note-btn");
    closeNoteBtn = document.querySelector(".close-note-btn");

    addEvent();

    // Carica le note iniziali quando la pagina si carica
    fetchNotes().then(() => {
        displayNotes();
    });
})

// Funzione per ottenere le note dal server usando Axios
async function fetchNotes() {
    try {
        const response = await axios.get("http://localhost:3000/notes");
        notesArr = response.data; // Popola l'array notesArr con i dati ricevuti
        console.log(notesArr); // Mostra le note ricevute
    } catch (error) {
        console.error("Errore nel recupero delle note:", error);
    }
}

// Funzione per visualizzare le note
function displayNotes() {
    notesList.innerHTML = "";  // Svuota la lista prima di aggiungere le nuove note

    // Itera su tutte le note e crea un elemento per ciascuna
    notesArr.forEach((note) => {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.setAttribute("data-id", note.id);  // Associa l'id univoco della nota all'elemento DOM
        noteElement.innerHTML = `
            <h3 class="note-title">${note.title}</h3>
            <p class="note-content">${note.content}</p>
            <button class="edit-note-btn" data-id="${note.id}">Modifica</button>
            <button class="delete-note-btn" data-id="${note.id}">Elimina</button>
            `;
        notesList.appendChild(noteElement);
    });
}

// Funzione per aggiungere una nuova nota usando Axios
async function addNote() {
    const newNote = {
        title: noteTitleInput.value,
        content: noteContentInput.value
    };

    try {
        // Invia la richiesta POST per aggiungere la nota
        const response = await axios.post("http://localhost:3000/notes", newNote);

        // Aggiungi la nuova nota all'array locale, che ora include l'ID
        notesArr.push(response.data);

        // Rende visibili le note aggiornate
        displayNotes();

        // Resetta i campi del form
        noteTitleInput.value = "";
        noteContentInput.value = "";
        addNoteWrapper.classList.remove("active");

        // Mostra l'alert di successo
        alert("Nota aggiunta con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'aggiunta della nota");
    }
}

// Funzione per modificare una nota
function editNote(index) {
    const noteToEdit = notesArr[index];
    noteTitleInput.value = noteToEdit.title;
    noteContentInput.value = noteToEdit.content;

    // Cambia l'evento del pulsante di invio per aggiornare la nota
    submitNoteBtn.removeEventListener("click", addNote);  // Rimuovi l'event listener esistente
    submitNoteBtn.addEventListener("click", () => updateNote(index));  // Aggiungi l'event listener per aggiornare la nota
    addNoteWrapper.classList.add("active");  // Mostra il form per la modifica
}

// Funzione per aggiornare una nota usando Axios
async function updateNote(index) {
    const updatedNote = {
        title: noteTitleInput.value,
        content: noteContentInput.value
    };

    try {
        // Effettua la richiesta PUT per aggiornare la nota
        const response = await axios.put(`http://localhost:3000/notes/${notesArr[index].id}`, updatedNote);

        // Aggiorna l'array locale con il nuovo array di note restituito dal server
        notesArr = response.data; // La risposta ora contiene tutte le note aggiornate

        // Verifica l'array delle note aggiornato
        console.log("Array delle note aggiornato:", notesArr);

        // Rendi visibili le note aggiornate
        await displayNotes();

        // Resetta i campi del form e nasconde la finestra di modifica
        noteTitleInput.value = "";
        noteContentInput.value = "";
        addNoteWrapper.classList.remove("active");

        // Mostra il messaggio di successo
        alert("Nota aggiornata con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'aggiornamento della nota");
    }
}

// Funzione per eliminare una nota usando Axios
async function deleteNote(id) {
    try {
        // Assicurati che l'ID sia un numero
        const noteId = parseInt(id);  // Converte l'ID in un numero

        // Effettua la richiesta DELETE
        await axios.delete(`http://localhost:3000/notes/${noteId}`);

        // Rimuove la nota dall'array locale confrontando gli ID come numeri
        notesArr = notesArr.filter((note) => note.id !== noteId);

        console.log("Array dopo l'aggiornamento:", notesArr);  // Verifica se l'array è aggiornato

        // Rende visibili le note aggiornate
        displayNotes();

        // Mostra un messaggio di successo
        alert("Nota eliminata con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'eliminazione della nota");
    }
}


function addEvent() {
// Event listener per aggiungere una nuova nota
    addNoteBtn.addEventListener("click", () => {
        addNoteWrapper.classList.add("active");
        submitNoteBtn.removeEventListener("click", updateNote); // Rimuove l'event listener di aggiornamento se c'era
        submitNoteBtn.addEventListener("click", addNote); // Ritorna l'event listener per aggiungere una nuova nota
    });

// Event listener per chiudere il modulo di aggiunta/modifica nota
    closeNoteBtn.addEventListener("click", () => {
        addNoteWrapper.classList.remove("active");
        noteTitleInput.value = "";
        noteContentInput.value = "";
    });

// Aggiungi un evento di ascolto per il pulsante di modifica
    document.addEventListener("click", function (event) {
        if (event.target && event.target.classList.contains("edit-note-btn")) {
            const noteId = event.target.getAttribute("data-id");  // Ottieni l'id della nota
            const index = notesArr.findIndex(note => note.id === parseInt(noteId)); // Trova l'indice della nota corrispondente

            if (index !== -1) {
                // Chiamata alla funzione per modificare la nota
                editNote(index);
            }
        }
    });

    document.addEventListener("click", function (event) {
        if (event.target && event.target.classList.contains("delete-note-btn")) {
            const noteId = event.target.getAttribute("data-id");
            console.log(`Eliminando la nota con ID: ${noteId}`); // Aggiungi un log per il debug

            if (noteId) {
                // Chiama la funzione deleteNote passando l'ID della nota
                deleteNote(noteId);
            }
        }
    });
}