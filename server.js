// const express = require("express");
// const bodyParser = require("body-parser");
// const fs = require("fs");
// const cors = require("cors");
// const path = require("path");
const PORT = 3000;
const EVENT_FILE_PATH = "./events.json";
const NOTES_FILE_PATH = "./notes.json";
// const session = require('express-session');
// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
// const bcrypt = require('bcryptjs');
// const ICalendar = require("datebook");
// const { getEventsFromDB, addEventOnDB, deleteEventOnDB,
//         addAccountOnDB, getAccountFromDB, getNotesFromDB,
//         updateNoteOnDB, deleteNoteOnDB, addNoteOnDB } = require("./DBOperations");
import {GoogleCalendar, ICalendar} from 'datebook';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import fs from 'fs';
import cors from 'cors';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from "url";
import { getEventsFromDB, addEventOnDB, deleteEventOnDB,
         addNoteOnDB, updateNoteOnDB, getNotesFromDB,
         getAccountFromDB, addAccountOnDB, deleteNoteOnDB} from "./DBOperations.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
// app.use('/secure', isAuthenticated, express.static(path.join(__dirname, 'private')));

app.use(bodyParser.urlencoded({ extended: false }));

// Configurazione sessione
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,   // Evita accessi JavaScript (protezione da XSS)
        secure: false,    // Metti "true" se usi HTTPS
        sameSite: "strict" // Previene attacchi CSRF
    }
}));

app.use((req, res, next) => {
    if (req.session) {
        req.session.cookie.maxAge = 30 * 60 * 1000; // 30 minuti di inattività
    }
    next();
});

// Inizializza Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Configurazione della strategia di autenticazione locale
passport.use(new LocalStrategy({ usernameField: 'username' }, async (name, password, done) => {
        // Trova l'utente
        const user = await getAccountFromDB(name);
        if (!user) {
            return done(null, false, { message: 'Username non registrato' });
        }

        // Confronta la password hashata
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password errata' });
            }
        });
    }));

// Serializza e deserializza l'utente per la sessione
passport.serializeUser((user, done) => done(null, user.username));
passport.deserializeUser(async (username, done) => {
    const user = await getAccountFromDB(username);
    done(null, user);
});

// Middleware per verificare l'autenticazione
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // res.status(401).json({ message: 'Accesso negato. Effettua il login.' });

    res.redirect('/index.html'); // Reindirizza alla pagina di login
}

// Middleware per proteggere tutti i file dentro /private
app.use("/private", isAuthenticated, express.static(path.join(__dirname, "private")));


// Endpoint per ottenere la home
app.get("/home", isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, "private", "home.html");
    res.sendFile(filePath)
});

// Endpoint per ottenere eventi
app.get("/events", isAuthenticated, (req, res) => {
    getEventsFromDB(req.user.username)
        .then((events) => {
            // Se il file non esiste o è vuoto, restituisci un array vuoto
            events = events ? events : [];

            res.json(events);})
        .catch((error) => {
            return res.status(500).send("Errore nella lettura dei dati");
        });
});

// Endpoint per salvare eventi
app.post("/events", isAuthenticated, (req, res) => {
    const newEvent = req.body;

    // if (!Array.isArray(newEvents)) {
    //     return res.status(400).send("Il formato dei dati deve essere un array di eventi.");
    // }
    //aggingo l'id dell'utente
    newEvent.id_user=req.user.username;

    addEventOnDB(newEvent)
        .then((events) => {
            return res.status(200).send(events);
        })
        .catch((error) => {
            return res.status(500).send(`Errore nella scrittura dell'evento ${error}`);
        });
});

// Endpoint per eliminare un evento
app.delete("/events", isAuthenticated, async (req, res) => {
    const { title, description, start, end, attendees, recurrence,_id } = req.body; // Parametri dell'evento da eliminare

    // if (!title || !description || !start || !end || !attendees || !recurrence || !_id) {
    //     return res.status(400).send("I parametri 'title', 'description', 'start', 'end', 'attendees', 'recurrence', '_id' sono obbligatori.");
    // }

    await deleteEventOnDB(_id,req.user.username)
        .then((events) => {
            if(events===1){
                return res.status(200).json({ message: "Evento eliminato con successo" });
            }else {
                return res.status(400).send(`l'evento ${_id} non esiste`);
            }
        })
        .catch((error) => {
            return res.status(500).send(`Errore nell'eliminazione dell'evento ${error}`);
        });
});

// Endpoint per ottenere note
app.get("/notes", isAuthenticated, async (req, res) => {
    await getNotesFromDB(req.user.username)
        .then((notes) => {
            // Se il file non esiste o è vuoto, restituisci un array vuoto
            notes = notes ? notes : [];

            res.json(notes);})
        .catch((error) => {
            return res.status(500).send("Errore nella lettura dei dati");
        });
});

// Endpoint per salvare note con ID incrementale
app.post("/notes", isAuthenticated, async (req, res) => {
    const newNote = req.body;

    newNote.id_user=req.user.username;

    if (!newNote.title || !newNote.content || !newNote.categories) {
        return res.status(400).send("Il formato dei dati deve contenere 'title', 'content' e 'categories'.");
    }

    await addNoteOnDB(newNote)
        .then((note) => {
            return res.status(200).send(note);
        })
        .catch((error) => {
            return res.status(500).send(`Errore nella scrittura della nota ${error}`);
        });
});

// Endpoint per aggiornare una nota
app.put("/notes/:id", isAuthenticated, async (req, res) => {
    const {id} = req.params;
    const updatedNote = req.body;
    updatedNote.id_user=req.user.username;

    if (!updatedNote.title || !updatedNote.content || !updatedNote.categories) {
        return res.status(400).send("Il formato dei dati deve contenere 'title', 'content' e 'categories'.");
    }

    await updateNoteOnDB(id, updatedNote)
        .then((note) => {
            return res.status(200).send(note);
        })
        .catch((error) => {
            return res.status(500).send(`Errore nella scrittura della nota ${error}`);
        });
});

// Endpoint per eliminare una nota
app.delete("/notes/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params; // Ottieni l'ID dalla richiesta

    await deleteNoteOnDB(id,req.user.username)
        .then((events) => {
            if(events===1){
                return res.status(200).json({ message: "Nota eliminata con successo" });
            }else {
                return res.status(400).send(`la nota ${id} non esiste`);
            }
        })
        .catch((error) => {
            return res.status(500).send(`Errore nell'eliminazione della nota ${error}`);
        });
});

// Endpoint per ottenere il calendario
app.get("/home/calendario", isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, "private", "calendario.html");
    res.sendFile(filePath)
});

// Endpoint per ottenere l'elenco delle note
app.get("/home/note", isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, "private", "note.html");
    res.sendFile(filePath)
});

// Endpoint per visualizzare il timer del pomodoro
app.get("/home/timer", isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, "private", "timer.html");
    res.sendFile(filePath)
});

// Endpoint per servire la pagina principale
app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "public", "index.html");
    res.sendFile(filePath);
});

// Avvio del server
app.listen(PORT, () => console.log(`Server in esecuzione su http://localhost:${PORT}`));

/**
 * Function per verificare che variable sia un JSON non vuoto
 * @param variable in input
 * @returns {boolean} true se è un json non vuoto false altrimenti
 */
function isNonEmptyJSON(variable) {
    return typeof variable === 'object' &&
        variable !== null &&
        !Array.isArray(variable) &&
        Object.keys(variable).length > 0;
}

// Endpoint per creare un account
app.post("/register", async (req, res) => {
    const userData = req.body;

    if (!isNonEmptyJSON(userData)) {
        return res.status(400).send("Il formato dei dati deve essere un Json non vuoto.");
    }

    // Hasheriamo la password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    addAccountOnDB(userData.username,hashedPassword)
        .then((events) => {
            if(events)
                return res.status(200).send("Account registrato");
            else {
                return res.status(400).send("Errore, il nome utente che hai inserito esiste già");
            }
        })
        .catch((error) => {
            return res.status(500).send(`Errore nella creazione dell'account ${error}`);
        });
});

// Rotta di login con Passport.js
app.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Login effettuato con successo' });
});

// Rotta di logout
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) return res.status(500).json({ message: 'Errore nel logout' });
        res.json({ message: 'Logout effettuato' });
    });
});