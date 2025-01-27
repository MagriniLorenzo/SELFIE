const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;
const FILE_PATH = "./events.json";
const NOTES_FILE_PATH = "./notes.json";



// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint per ottenere eventi
app.get("/events", (req, res) => {
    fs.readFile(FILE_PATH, "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Errore nella lettura del file");
        }

        // Se il file non esiste o è vuoto, restituisci un array vuoto
        const events = data ? JSON.parse(data) : [];
        res.json(events);
    });
});

// Endpoint per salvare eventi
app.post("/events", (req, res) => {
    const newEvents = req.body;

    if (!Array.isArray(newEvents)) {
        return res.status(400).send("Il formato dei dati deve essere un array di eventi.");
    }

    fs.readFile(FILE_PATH, "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Errore nella lettura del file");
        }

        const existingEvents = data ? JSON.parse(data) : [];
        const updatedEvents = [...existingEvents, ...newEvents];

        fs.writeFile(FILE_PATH, JSON.stringify(updatedEvents, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Errore nella scrittura del file");
            }
            res.send("Eventi salvati con successo");
        });
    });
});

// Endpoint per eliminare un evento
app.delete("/events", (req, res) => {
    const { title, day, month, year } = req.body; // Parametri dell'evento da eliminare

    if (!title || !day || !month || !year) {
        return res.status(400).send("I parametri 'title', 'day', 'month' e 'year' sono obbligatori.");
    }

    fs.readFile(FILE_PATH, "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Errore nella lettura del file");
        }

        const existingEvents = data ? JSON.parse(data) : [];

        // Filtra gli eventi che non corrispondono a quelli da eliminare
        const updatedEvents = existingEvents.filter(
            (event) =>
                event.title !== title ||
                event.day !== day ||
                event.month !== month ||
                event.year !== year
        );

        // Se non è stato trovato nessun evento corrispondente
        if (existingEvents.length === updatedEvents.length) {
            return res.status(404).send("Evento non trovato.");
        }

        // Scrivi il file con gli eventi aggiornati
        fs.writeFile(FILE_PATH, JSON.stringify(updatedEvents, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Errore nella scrittura del file");
            }
            res.send("Evento eliminato con successo");
        });
    });
});









// Middleware per il parsing del corpo delle richieste JSON
app.use(express.json());

// Abilita CORS per permettere le richieste da altre origini (separato dal server)
app.use(cors());

// Endpoint per ottenere note
app.get("/notes", async (req, res) => {
    try {
        const data = await fs.promises.readFile(NOTES_FILE_PATH, "utf8");
        const notes = data ? JSON.parse(data) : [];
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).send("Errore nella lettura del file delle note");
    }
});

// Endpoint per salvare note con ID incrementale
app.post("/notes", (req, res) => {
    const newNote = req.body;

    if (!newNote.title || !newNote.content) {
        return res.status(400).send("Il formato dei dati deve contenere 'title' e 'content'.");
    }

    fs.readFile(NOTES_FILE_PATH, "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Errore nella lettura del file delle note");
        }

        const existingNotes = data ? JSON.parse(data) : [];
        // Calcola il nuovo ID come uno più grande dell'ID più alto attualmente esistente
        const newId = existingNotes.length > 0 ? Math.max(...existingNotes.map(note => note.id)) + 1 : 1;
        
        // Aggiungi l'ID alla nuova nota
        const noteWithId = { ...newNote, id: newId };

        // Aggiungi la nota alla lista delle note
        existingNotes.push(noteWithId);

        // Salva le note aggiornate nel file
        fs.writeFile(NOTES_FILE_PATH, JSON.stringify(existingNotes, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Errore nella scrittura del file delle note");
            }
            res.json(noteWithId); // Restituisci la nuova nota con l'ID assegnato
        });
    });
});


    // Endpoint per aggiornare una nota
app.put("/notes/:id", async (req, res) => {
    const { id } = req.params;
    const updatedNote = req.body;

    if (!updatedNote.title || !updatedNote.content) {
        return res.status(400).send("Il formato dei dati deve contenere 'title' e 'content'.");
    }

    try {
        const data = await fs.promises.readFile(NOTES_FILE_PATH, "utf8");
        const existingNotes = data ? JSON.parse(data) : [];
        const noteIndex = existingNotes.findIndex(note => note.id === parseInt(id));

        if (noteIndex === -1) {
            return res.status(404).send("Nota non trovata.");
        }

        // Aggiorna la nota con i nuovi dati
        existingNotes[noteIndex] = { ...existingNotes[noteIndex], ...updatedNote };

        // Scrive i dati aggiornati nel file
        await fs.promises.writeFile(NOTES_FILE_PATH, JSON.stringify(existingNotes, null, 2));

        // Restituisce l'array aggiornato delle note
        res.json(existingNotes);
    } catch (err) {
        console.error(err);
        res.status(500).send("Errore nella scrittura del file delle note");
    }
});



// Endpoint per eliminare una nota
app.delete("/notes/:id", async (req, res) => {
    const { id } = req.params; // Ottieni l'ID dalla richiesta

    try {
        const data = await fs.promises.readFile(NOTES_FILE_PATH, "utf8");
        const existingNotes = data ? JSON.parse(data) : [];

        // Filtra le note per escludere quella con l'id passato
        const updatedNotes = existingNotes.filter((note) => note.id !== parseInt(id, 10)); // Assicurati che l'ID sia un numero

        // Se non è stato trovato nessuna nota con quell'id
        if (existingNotes.length === updatedNotes.length) {
            return res.status(404).send("Nota non trovata.");
        }

        await fs.promises.writeFile(NOTES_FILE_PATH, JSON.stringify(updatedNotes, null, 2));
        res.send("Nota eliminata con successo");
    } catch (err) {
        console.error(err);
        res.status(500).send("Errore nella scrittura del file delle note");
    }
});








// Endpoint per servire la pagina principale
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
