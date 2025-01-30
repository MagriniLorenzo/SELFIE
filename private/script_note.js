let notesArr = [];
document.addEventListener("DOMContentLoaded", () => {
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

    async function fetchNotes() {
        try {
            const response = await axios.get("http://localhost:3000/notes");
            notesArr = response.data;
            console.log(response.data);
        } catch (error) {
            console.error("Errore:", error);
        }
    }

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
        const noteToEdit = notesArr[index];
        noteTitleInput.value = noteToEdit.title;
        noteContentInput.innerHTML = noteToEdit.content;
        noteCategoriesInput.value = noteToEdit.categories;

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

        document.addEventListener("click", function (event) {
            if (event.target.classList.contains("delete-note-btn")) {
                const noteId = event.target.getAttribute("data-id");
                if (noteId) deleteNote(noteId);
            }
        });
    }

    function resetForm() {
        noteTitleInput.value = "";
        noteCategoriesInput.value = "";
        noteContentInput.innerHTML = "";
        addNoteWrapper.classList.remove("active");

        // FIX: Resetta la modalità in modo che l'evento corretto venga applicato dopo
        submitNoteBtn.dataset.mode = "add";
        submitNoteBtn.removeEventListener("click", updateNote);
        submitNoteBtn.removeEventListener("click", addNote);
        submitNoteBtn.addEventListener("click", addNote);
    }
});

    
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
