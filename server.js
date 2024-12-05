const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;
const FILE_PATH = "./events.json";

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

// Endpoint per servire la pagina principale
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in esecuzione su http://localhost:${PORT}`);
});
