let notesArr = [];

let notesContainer,notesList,addNoteBtn,
    addNoteWrapper,noteTitleInput,noteContentInput,
    submitNoteBtn,closeNoteBtn,noteCategoriesInput,closebtn,editNoteBtn,deleteNoteBtn,duplicaNoteBtn;

document.addEventListener("DOMContentLoaded", () => {
    notesContainer = document.querySelector(".notes-container");
    notesList = document.querySelector(".notes-list");
    addNoteBtn = document.querySelector(".add-note-btn");
    addNoteWrapper = document.querySelector(".add-note-wrapper");
    noteTitleInput = document.querySelector(".note-title");
    quillEditor = null;
    submitNoteBtn = document.querySelector(".submit-note-btn");
    closeNoteBtn = document.querySelector(".close-note-btn");
    noteCategoriesInput = document.querySelector(".note-categories");
    document.querySelector("#LogOut").addEventListener("click", logOut);

    closebtn = document.getElementById("closeFullNote");
    editNoteBtn = document.querySelector(".edit-note-btn");
    deleteNoteBtn = document.querySelector(".delete-note-btn");
    duplicaNoteBtn = document.querySelector(".duplica-note-btn");
    fullNoteWrapper = document.querySelector(".full-note-wrapper");
    fullNoteTitle = document.querySelector(".full-note-title");
    fullNoteCategories = document.querySelector(".full-note-categories");
    fullNoteContent = document.querySelector(".full-note-content");
    fullNoteDates = document.querySelector(".full-note-dates");

    addEvent();

    fetchNotes().then(() => {
        displayNotes();
    });

    quillEditor = new Quill('#editor', {
        theme: 'snow',   // Tema di Quill
        modules: {
          toolbar: [
            [{ 'header': '1' }],
            [{ 'font': [] }],
            [{ 'list': 'ordered'}],
            [{ 'list': 'bullet' }],
            ['bold'],
            ['italic'],
            ['underline'],
          ]
        }
    });
});

async function fetchNotes() {
    try {
        const response = await axios.get("/notes");
        notesArr = response.data;


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

        const plainText = note.content
        .replace(/<\/?p>/gi, ' ')       // Sostituisco i tag <p> con spazi
        .replace(/<[^>]*>/g, '')        // Rimuovo tutti gli altri tag HTML
        .replace(/\s+/g, ' ')           // Rimuovo spazi multipli
        .trim();                        // Rimuovo spazi iniziali/finali

        const truncatedContent = plainText.length > 200
        ? plainText.slice(0, plainText.lastIndexOf(' ', 200)) + "..."
        : plainText;

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

        // Evento per aprire la nota completa quando si clicca sul titolo
        noteElement.querySelector(".nota").addEventListener("click", () => {
            fullNoteWrapper.classList.add("active");
            openFullNoteView(note);
        });

        notesList.appendChild(noteElement);
    });
}

function openFullNoteView(note) {
    fullNoteTitle.textContent = note.title;
    fullNoteCategories.textContent = note.categories;
    fullNoteContent.innerHTML = note.content;
    fullNoteDates.textContent = `Creata il: ${note.createdAt} - Ultima modifica: ${note.updatedAt}`;
    editNoteBtn.setAttribute("data-id", note._id);
    deleteNoteBtn.setAttribute("data-id", note._id);
    duplicaNoteBtn.setAttribute("data-id", note._id);

    fullNoteWrapper.classList.remove("hidden");

    closebtn.addEventListener("click", () => {
        fullNoteWrapper.classList.remove("active");
    });

    deleteNoteBtn.removeEventListener("click", handleDeleteNote);
    editNoteBtn.removeEventListener("click", handleEditNote);
    duplicaNoteBtn.removeEventListener("click", handleDuplicaNote);

    deleteNoteBtn.addEventListener("click", handleDeleteNote);
    editNoteBtn.addEventListener("click", handleEditNote);
    duplicaNoteBtn.addEventListener("click", handleDuplicaNote);
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

function handleDuplicaNote(event) {
    const noteId = event.target.getAttribute("data-id");
    const index = notesArr.findIndex(note => note._id === noteId);
    if (index !== -1) {
        duplicaNote(index);
    }
}

async function addNote() {
    const newNote = {
        title: noteTitleInput.value,
        categories: noteCategoriesInput.value.split(',').map(cat => cat.trim()),
        content: quillEditor.root.innerHTML,
        createdAt: new Date().toLocaleDateString("it-IT"),
        updatedAt: new Date().toLocaleDateString("it-IT")
    };

    try {
        const response = await axios.post("/notes", newNote);

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
    quillEditor.root.innerHTML = noteToEdit.content;
    noteCategoriesInput.value = noteToEdit.categories;

    document.querySelectorAll(".dropdown-menu").forEach(menu => {
        menu.classList.add("hidden");
    });

    submitNoteBtn.dataset.mode = "edit";
    submitNoteBtn.dataset.index = index;

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
        content: quillEditor.root.innerHTML,
        createdAt: notesArr[index].createdAt,
        updatedAt: new Date().toLocaleDateString("it-IT")

    };

    try {
        await axios.put(`/notes/${notesArr[index]._id}`, updatedNote);
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
        await axios.delete(`/notes/${noteId}`);
        notesArr = notesArr.filter((note) => note._id !== noteId);
        displayNotes();
        resetForm();
        alert("Nota eliminata con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'eliminazione della nota");
    }
}

async function duplicaNote(index) {
    const noteToDuplicate = notesArr[index];
    noteTitleInput.value = noteToDuplicate.title;
    quillEditor.root.innerHTML = noteToDuplicate.content;
    noteCategoriesInput.value = noteToDuplicate.categories;

    const duplicateNote = {
        title: noteToDuplicate.title + '_copia',
        categories: noteToDuplicate.categories,
        content: noteToDuplicate.content,
        createdAt: new Date().toLocaleDateString("it-IT"),
        updatedAt: new Date().toLocaleDateString("it-IT")
    };

    try {
        const response = await axios.post("/notes", duplicateNote);

        const savedNote = {
            ...duplicateNote,
            _id: response.data
        };


        notesArr.push(savedNote);

        console.log(savedNote);

        displayNotes();
        resetForm();
        alert("Nota duplicata con successo!");
    } catch (error) {
        console.error(error);
        alert("Errore durante l'aggiunta della nota");
    }

}

function addEvent() {
    addNoteBtn.addEventListener("click", () => {
        addNoteWrapper.classList.add("active");

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
}

function resetForm() {
    noteTitleInput.value = "";
    noteCategoriesInput.value = "";
    quillEditor.root.innerHTML = "";
    addNoteWrapper.classList.remove("active");
    fullNoteWrapper.classList.remove("active");

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
    try {
        await axios.get("/logout")
        window.location.href = "/";
    } catch (error){
        console.error(error);
    }
}
