let notesArr = [];

let notesContainer,notesList,addNoteBtn,
    addNoteWrapper,noteTitleInput,noteContentInput,
    submitNoteBtn,closeNoteBtn,noteCategoriesInput,closebtn,editNoteBtn,deleteNoteBtn;

document.addEventListener("DOMContentLoaded", () => {
    notesContainer = document.querySelector(".notes-container");
    notesList = document.querySelector(".notes-list");
    addNoteBtn = document.querySelector(".add-note-btn");
    addNoteWrapper = document.querySelector(".add-note-wrapper");
    noteTitleInput = document.querySelector(".note-title");
    noteContentInput = document.querySelector(".note-content p");
    submitNoteBtn = document.querySelector(".submit-note-btn");
    closeNoteBtn = document.querySelector(".close-note-btn");
    noteCategoriesInput = document.querySelector(".note-categories");
    document.querySelector("#LogOut").addEventListener("click", logOut);

    closebtn = document.getElementById("closeFullNote");
    editNoteBtn = document.querySelector(".edit-note-btn");
    deleteNoteBtn = document.querySelector(".delete-note-btn");
    fullNoteWrapper = document.querySelector(".full-note-wrapper");
    fullNoteTitle = document.querySelector(".full-note-title");
    fullNoteCategories = document.querySelector(".full-note-categories");
    fullNoteContent = document.querySelector(".full-note-content");
    fullNoteDates = document.querySelector(".full-note-dates");

    addEvent();

    fetchNotes().then(() => {
        displayNotes();
    });
});

async function fetchNotes() {
    try {
        const response = await axios.get("http://localhost:3000/notes");
        notesArr = response.data;
        console.log(response.data);


        notesArr.sort((a, b) => {
            const dateA = new Date(a.createdAt.split("/").reverse().join("-"));
            const dateB = new Date(b.createdAt.split("/").reverse().join("-"));
            return dateB - dateA; // Dalla più recente alla più vecchia
        });


    } catch (error) {
        console.error("Errore:", error);
    }
}

function sortNotes() {
    let criteria = document.getElementById("sortOptions").value;

    notesArr.sort((a, b) => {
        if (criteria === "title") {
            return a.title.localeCompare(b.title);
        } else if (criteria === "date") {
            const dateA = new Date(a.createdAt.split("/").reverse().join("-"));
            const dateB = new Date(b.createdAt.split("/").reverse().join("-"));
            return dateB - dateA; // Dalla più recente alla più vecchia
        } else if (criteria === "lastModified") {
            const dateA = new Date(a.updatedAt.split("/").reverse().join("-"));
            const dateB = new Date(b.updatedAt.split("/").reverse().join("-"));
            return dateB - dateA; // Dalla più recente alla più vecchia
        } else if (criteria === "lung") {
            return a.content.length - b.content.length; // Dalla più corta alla più lunga
        }
    });

    displayNotes();
}


function displayNotes() {
    notesList.innerHTML = "";

    notesArr.forEach((note) => {
        const noteElement = document.createElement("div");
        noteElement.classList.add("note");
        noteElement.setAttribute("data-id", note._id);
        const truncatedContent = note.content.length > 200 ? note.content.slice(0, 200) + "..." : note.content;

        noteElement.innerHTML = `
                <div class="nota">
                    <div class="content">
                        <h3 class="note-title">${note.title}</h3>
                        <!-- <p class="note-categories">Categorie: ${note.categories}</p> -->
                        <p class="note-content">${truncatedContent}</p>
                        <!-- <p class="note-dates">Creata il: ${note.createdAt} - Ultima modifica: ${note.updatedAt}</p> -->
                    </div>
                    <!-- <div class="dropdown">
                        <button class="dropdown-toggle">&#8226;&#8226;&#8226;</button>
                        <div class="dropdown-menu hidden">
                            <button class="edit-note-btn" data-id="${note._id}">Modifica</button>
                            <button class="delete-note-btn" data-id="${note._id}">Elimina</button>
                        </div>
                    </div> -->
                </div>`;

        /*
        const dropdownToggle = noteElement.querySelector(".dropdown-toggle");
        const dropdownMenu = noteElement.querySelector(".dropdown-menu");

        dropdownToggle.addEventListener("click", (event) => {
            // Chiude tutti i menu aperti prima di aprirne uno nuovo
            document.querySelectorAll(".dropdown-menu").forEach(menu => {
                if (menu !== dropdownMenu) menu.classList.add("hidden");
            });

            dropdownMenu.classList.toggle("hidden");
            event.stopPropagation(); // Impedisce la chiusura immediata
        });

        // Chiude il menu se si clicca fuori
        document.addEventListener("click", (event) => {
            if (!dropdownMenu.contains(event.target) && !dropdownToggle.contains(event.target)) {
                dropdownMenu.classList.add("hidden");
            }
        });*/

        // Evento per aprire la nota completa quando si clicca sul titolo
        noteElement.querySelector(".note-title").addEventListener("click", () => {
            fullNoteWrapper.classList.add("active");
            openFullNoteView(note);
        });

        notesList.appendChild(noteElement);
    });
}

function openFullNoteView(note) {
    // Imposta i contenuti della nota completa
    fullNoteTitle.textContent = note.title;
    fullNoteCategories.textContent = note.categories;
    fullNoteContent.textContent = note.content;
    fullNoteDates.textContent = `Creata il: ${note.createdAt} - Ultima modifica: ${note.updatedAt}`;
    editNoteBtn.setAttribute("data-id", note._id);
    deleteNoteBtn.setAttribute("data-id", note._id);

    // Mostra la vista completa della nota
    fullNoteWrapper.classList.remove("hidden");

    // Eventi per la chiusura della vista completa
    closebtn.addEventListener("click", () => {
        fullNoteWrapper.classList.remove("active");
    });

    deleteNoteBtn.removeEventListener("click", handleDeleteNote);
    editNoteBtn.removeEventListener("click", handleEditNote);

    deleteNoteBtn.addEventListener("click", handleDeleteNote);
    editNoteBtn.addEventListener("click", handleEditNote);
}

function handleDeleteNote(event) {
    const noteId = event.target.getAttribute("data-id");
    if (noteId) {
        deleteNote(noteId);
    }
}

function handleEditNote(event) {
    const noteId = event.target.getAttribute("data-id");
    const index = notesArr.findIndex(note => note._id === noteId);
    if (index !== -1) {
        editNote(index);
    }
}

async function addNote() {
    const newNote = {
        title: noteTitleInput.value,
        categories: noteCategoriesInput.value.split(',').map(cat => cat.trim()),
        content: noteContentInput.innerHTML,
        createdAt: new Date().toLocaleDateString("it-IT"),
        updatedAt: new Date().toLocaleDateString("it-IT")
    };

    try {
        const response = await axios.post("http://localhost:3000/notes", newNote);

        const savedNote = {
            ...newNote,
            _id: response.data
        };


        notesArr.push(savedNote);

        console.log(savedNote);

        displayNotes();
        resetForm();
        alert("Nota aggiunta con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'aggiunta della nota");
    }
}

function editNote(index) {
    fullNoteWrapper.classList.remove("active");
    const noteToEdit = notesArr[index];
    noteTitleInput.value = noteToEdit.title;
    noteContentInput.innerHTML = noteToEdit.content;
    noteCategoriesInput.value = noteToEdit.categories;


    document.querySelectorAll(".dropdown-menu").forEach(menu => {
        menu.classList.add("hidden");
    });

    // FIX: Imposta la modalità su "edit" e salva l'indice della nota da modificare
    submitNoteBtn.dataset.mode = "edit";
    submitNoteBtn.dataset.index = index;

    // FIX: Rimuove tutti gli event listener esistenti e aggiunge solo quello corretto
    submitNoteBtn.removeEventListener("click", addNote);
    submitNoteBtn.removeEventListener("click", updateNote);
    submitNoteBtn.addEventListener("click", updateNote);

    addNoteWrapper.classList.add("active");
}

async function updateNote() {
    const index = submitNoteBtn.dataset.index;

    if (index === undefined) return;

    const updatedNote = {
        title: noteTitleInput.value,
        categories: noteCategoriesInput.value.split(',').map(cat => cat.trim()),
        content: noteContentInput.innerHTML,
        createdAt: notesArr[index].createdAt,
        updatedAt: new Date().toLocaleDateString("it-IT")

    };

    try {
        await axios.put(`http://localhost:3000/notes/${notesArr[index]._id}`, updatedNote);
        updatedNote._id = notesArr[index]._id;
        notesArr[index] = updatedNote;

        displayNotes();
        resetForm();
        alert("Nota aggiornata con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'aggiornamento della nota");
    }
}

async function deleteNote(noteId) {
    try {
        await axios.delete(`http://localhost:3000/notes/${noteId}`);
        notesArr = notesArr.filter((note) => note._id !== noteId);
        displayNotes();
        resetForm();
        alert("Nota eliminata con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'eliminazione della nota");
    }
}

function addEvent() {
    addNoteBtn.addEventListener("click", () => {
        addNoteWrapper.classList.add("active");

        // FIX: Imposta la modalità su "add"
        submitNoteBtn.dataset.mode = "add";
        submitNoteBtn.removeEventListener("click", updateNote);
        submitNoteBtn.removeEventListener("click", addNote);
        submitNoteBtn.addEventListener("click", addNote);
    });

    closeNoteBtn.addEventListener("click", resetForm);

    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("edit-note-btn")) {
            const noteId = event.target.getAttribute("data-id");
            const index = notesArr.findIndex(note => note._id === noteId);
            if (index !== -1) editNote(index);
        }
    });

    /*
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("delete-note-btn")) {
            const noteId = event.target.getAttribute("data-id");
            if (noteId) deleteNote(noteId);
        }
    });*/
}

function resetForm() {
    noteTitleInput.value = "";
    noteCategoriesInput.value = "";
    noteContentInput.innerHTML = "";
    addNoteWrapper.classList.remove("active");
    fullNoteWrapper.classList.remove("active");

    // FIX: Resetta la modalità in modo che l'evento corretto venga applicato dopo
    submitNoteBtn.dataset.mode = "add";
    submitNoteBtn.removeEventListener("click", updateNote);
    submitNoteBtn.removeEventListener("click", addNote);
    submitNoteBtn.addEventListener("click", addNote);
}

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

async function logOut(){
    await fetch("http://localhost:3000/logout")
        .then(res => res.json())
        .then(dati => {
            console.log(dati);
            window.location.href = "/";
        })
        .catch(console.error);

}

