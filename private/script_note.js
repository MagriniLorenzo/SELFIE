let notesArr = [];
document.addEventListener("DOMContentLoaded",()=>{
    let notesContainer = document.querySelector(".notes-container");
    let notesList = document.querySelector(".notes-list");
    let addNoteBtn = document.querySelector(".add-note-btn");
    let addNoteWrapper = document.querySelector(".add-note-wrapper");
    let noteTitleInput = document.querySelector(".note-title");
    let noteContentInput = document.querySelector(".note-content p");
    let submitNoteBtn = document.querySelector(".submit-note-btn");
    let closeNoteBtn = document.querySelector(".close-note-btn");
    let noteCategoriesInput = document.querySelector(".note-categories");

    addEvent();

    fetchNotes().then(() => {
        displayNotes();
    });


// Funzione per ottenere le note dal server usando Axios
async function fetchNotes() {
    try {
        const response = await axios.get("http://localhost:3000/notes");
        notesArr = response.data;
    } catch (error) {
        console.error("Errore:", error);
    }
}

// Funzione per visualizzare le note
function displayNotes() {
    notesList.innerHTML = "";

    notesArr.forEach((note) => {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.setAttribute("data-id", note._id);
        noteElement.innerHTML = `
            <div class="nota">
                <div class="content">
                    <h3 class="note-title">${note.title}</h3>
                    <p class="note-categories">Categorie: ${note.categories}</p>
                    <p class="note-content">${note.content}</p>
                    <p class="note-dates">Creata il: ${note.createdAt} - Ultima modifica: ${note.updatedAt}</p>
                </div>
                <div class="dropdown">
                    <button class="dropdown-toggle">&#8226;&#8226;&#8226;</button>
                    <div class="dropdown-menu hidden">
                        <button class="edit-note-btn" data-id="${note._id}">Modifica</button>
                        <button class="delete-note-btn" data-id="${note._id}">Elimina</button>
                    </div>
                </div>
            </div>`;

        const dropdownToggle = noteElement.querySelector(".dropdown-toggle");
        const dropdownMenu = noteElement.querySelector(".dropdown-menu");

        dropdownToggle.addEventListener("click", () => {
            dropdownMenu.classList.toggle("hidden");
        });

        notesList.appendChild(noteElement);
    });
}

async function addNote() {
    const newNote = {
        title: noteTitleInput.value,
        categories: noteCategoriesInput.value.split(',').map(cat => cat.trim()), // Ottieni le categorie dall'input
        content: noteContentInput.innerHTML,
        createdAt: new Date().toLocaleDateString("it-IT"),
        updatedAt: new Date().toLocaleDateString("it-IT")
    };

    try {
        const response = await axios.post("http://localhost:3000/notes", newNote);
        notesArr.push(response.data);
        displayNotes();
        noteTitleInput.value = "";
        noteCategoriesInput.value = "";
        noteContentInput.innerHTML = "";
        addNoteWrapper.classList.remove("active");
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
        noteContentInput.innerHTML = noteToEdit.content;
        noteCategoriesInput.value = noteToEdit.categories;

        // Rimuovi TUTTI gli event listener esistenti
        const cloneSubmitNoteBtn = submitNoteBtn.cloneNode(true);
        submitNoteBtn.parentNode.replaceChild(cloneSubmitNoteBtn, submitNoteBtn);
        submitNoteBtn = cloneSubmitNoteBtn;

        // Aggiungi l'event listener per aggiornare la nota
    submitNoteBtn.removeEventListener("click", addNote);
    submitNoteBtn.addEventListener("click", () => updateNote(index));

        // Mostra il form di modifica
        addNoteWrapper.classList.add("active");
}


// Funzione per aggiornare una nota usando Axios
async function updateNote(index) {
    const updatedNote = {
        title: noteTitleInput.value,
        categories: noteCategoriesInput.value.split(',').map(cat => cat.trim()),
        content: noteContentInput.innerHTML,
        updatedAt: new Date().toLocaleDateString("it-IT")
    };

    try {
        // Effettua la richiesta PUT per aggiornare la nota
        const response = await axios.put(`http://localhost:3000/notes/${notesArr[index]._id}`, updatedNote);

        updatedNote._id = notesArr[index]._id;
        // Aggiorna l'array locale con il nuovo array di note restituito dal server
        notesArr[index] = updatedNote; // La risposta ora contiene tutte le note aggiornate

        // Verifica l'array delle note aggiornato
        console.log("Array delle note aggiornato:", notesArr[index]);

        // Rendi visibili le note aggiornate
        await displayNotes();

        // Resetta i campi del form e nasconde la finestra di modifica
        noteTitleInput.value = "";
        noteCategoriesInput.value = "";
        noteContentInput.innerHTML = "";
        addNoteWrapper.classList.remove("active");
        alert("Nota aggiornata con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'aggiornamento della nota");
    }
}

// Funzione per eliminare una nota usando Axios
async function deleteNote(noteId) {
    try {
        // Assicurati che l'ID sia un numero
        // const noteId = parseInt(id);  // Converte l'ID in un numero

        await axios.delete(`http://localhost:3000/notes/${noteId}`);

        // Rimuove la nota dall'array locale confrontando gli ID come numeri
        notesArr = notesArr.filter((note) => note._id !== noteId);

        console.log("Array dopo l'aggiornamento:", notesArr);

        displayNotes();

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
        submitNoteBtn.removeEventListener("click", updateNote);
        submitNoteBtn.addEventListener("click", addNote);
    });

// Event listener per chiudere il modulo di aggiunta/modifica nota
    closeNoteBtn.addEventListener("click", () => {
        addNoteWrapper.classList.remove("active");
        noteTitleInput.value = "";
        noteCategoriesInput.value = "";
        noteContentInput.innerHTML = "";

    });

// Aggiungi un evento di ascolto per il pulsante di modifica
    document.addEventListener("click", function (event) {
        if (event.target && event.target.classList.contains("edit-note-btn")) {
            const noteId = event.target.getAttribute("data-id");  // Ottieni l'id della nota
            const index = notesArr.findIndex(note => note._id === noteId); // Trova l'indice della nota corrispondente

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

// Filtra le voci del diario in base al titolo
function filterEntries() {
    var searchTerm = document.getElementById("search").value.toLowerCase();
    var entries = document.querySelectorAll(".note");

    
    entries.forEach(function(entry) {
        
        var titolo = entry.querySelector(".note-title").textContent.toLowerCase();
        
        if (titolo.includes(searchTerm)) {
            entry.style.display = "";
        } else {
            entry.style.display = "none";
        }
    });
}
})