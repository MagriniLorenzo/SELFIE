import RRule from "rrule";
import RRuleSet from "rrule";
const PORT = 3000;
const EVENT_FILE_PATH = "./events.json";
const NOTES_FILE_PATH = "./notes.json";
import {ICalendar} from 'datebook';
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
    const filter = {id_user: req.user.username};
    //ottengo eventi e attività dell'utente
    getEventsFromDB(filter)
        .then((events) => {
            // Se il file non esiste o è vuoto, restituisci un array vuoto
            events = events ? events : [];
            events = expandRecurringEvents(events);
            res.json(events);})
        .catch((error) => {
            res.status(500).send("Errore nella lettura dei dati");
        });
});

// Endpoint per ottenere eventi
app.get("/events/iCalendar", isAuthenticated, (req, res) => {
    const filter = {id_user: req.user.username, start: { $ne: "" }};
    //ottengo tutti gli eventi dell'utente
    getEventsFromDB(filter)
        .then((events) => {
            // Se il file non esiste o è vuoto, restituisci un array vuoto
            if(events){
                let newEvent ={
                    title: events[0].title,
                    description: events[0].description,
                    start: new Date(events[0].start),
                    end: new Date(events[0].end)
                };
                if(events[0].eventLocation){
                    newEvent.location = events[0].eventLocation;
                }
                if(events[0].eventFrequency && events[0].eventInterval){
                    newEvent.recurrence = {
                        frequency: events[0].eventFrequency,
                        interval: events[0].eventInterval
                    }
                }

                const icsEvents = new ICalendar(newEvent);

                for (let i= 1; i<events.length;i++){
                    let newEvent ={
                        title: events[i].title,
                        description: events[i].description,
                        start: new Date(events[i].start),
                        end: new Date(events[i].end)
                    };
                    if(events[i].eventLocation){
                        newEvent.location = events[i].eventLocation;
                    }
                    if(events[i].eventFrequency && events[i].eventInterval){
                        newEvent.recurrence = {
                            frequency: events[i].eventFrequency,
                            interval: events[i].eventInterval
                        }
                    }

                    icsEvents.addEvent(new ICalendar(newEvent));
                }

                res.setHeader("Content-Disposition", 'attachment; filename="your_events.ics"');
                res.setHeader("Content-Type", "text/calendar");
                res.send(icsEvents.render());
            }else{
                res.status(404).send("No such event");
            }
        })
        .catch((error) => {
            res.status(500).send("Errore nella lettura dei dati");
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
            res.status(200).send(events);
        })
        .catch((error) => {
            res.status(500).send(`Errore nella scrittura dell'evento ${error}`);
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
                res.status(200).json({ message: "Evento eliminato con successo" });
            }else {
                res.status(400).send(`l'evento ${_id} non esiste`);
            }
        })
        .catch((error) => {
            res.status(500).send(`Errore nell'eliminazione dell'evento ${error}`);
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
            res.status(500).send("Errore nella lettura dei dati");
        });
});

// Endpoint per salvare note con ID incrementale
app.post("/notes", isAuthenticated, async (req, res) => {
    const newNote = req.body;

    newNote.id_user=req.user.username;

    if (!newNote.title || !newNote.content || !newNote.categories) {
        res.status(400).send("Il formato dei dati deve contenere 'title', 'content' e 'categories'.");
    }

    await addNoteOnDB(newNote)
        .then((note) => {
            res.status(200).send(note);
        })
        .catch((error) => {
            res.status(500).send(`Errore nella scrittura della nota ${error}`);
        });
});

// Endpoint per aggiornare una nota
app.put("/notes/:id", isAuthenticated, async (req, res) => {
    const {id} = req.params;
    const updatedNote = req.body;
    updatedNote.id_user=req.user.username;

    if (!updatedNote.title || !updatedNote.content || !updatedNote.categories) {
        res.status(400).send("Il formato dei dati deve contenere 'title', 'content' e 'categories'.");
    }

    await updateNoteOnDB(id, updatedNote)
        .then((note) => {
            res.status(200).send(note);
        })
        .catch((error) => {
            res.status(500).send(`Errore nella scrittura della nota ${error}`);
        });
});

// Endpoint per eliminare una nota
app.delete("/notes/:id", isAuthenticated, async (req, res) => {
    const { id } = req.params; // Ottieni l'ID dalla richiesta

    await deleteNoteOnDB(id,req.user.username)
        .then((events) => {
            if(events===1){
                res.status(200).json({ message: "Nota eliminata con successo" });
            }else {
                res.status(400).send(`la nota ${id} non esiste`);
            }
        })
        .catch((error) => {
            res.status(500).send(`Errore nell'eliminazione della nota ${error}`);
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

// Endpoint per creare un account
app.post("/register", async (req, res) => {
    const userData = req.body;

    if (!isNonEmptyJSON(userData)) {
        res.status(400).send("Il formato dei dati deve essere un Json non vuoto.");
    }

    // Hasheriamo la password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    addAccountOnDB(userData.username,hashedPassword)
        .then((events) => {
            if(events)
                res.status(200).send("Account registrato");
            else {
                res.status(400).send("Errore, il nome utente che hai inserito esiste già");
            }
        })
        .catch((error) => {
            res.status(500).send(`Errore nella creazione dell'account ${error}`);
        });
});

// Rotta di login con Passport.js
app.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Login effettuato con successo' });
});

// Rotta di logout
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err){
            res.status(500).json({ message: 'Errore nel logout' });
        }
        res.json({ message: 'Logout effettuato' });
    });
});

// Endpoint per ottenere la data dalla sessione
app.get("/get-today",isAuthenticated, (req, res) => {
    // Assicurati che la sessione sia inizializzata
    if (!req.session.today) {
        req.session.today = new Date(); // Imposta la data alla data attuale se non esiste
    }

    let date = new Date(req.session.today).toISOString(); // Assicurati che sia un oggetto Date
    res.json({ today: date });
});

// Endpoint per cambiare la data nella sessione (ed anche nel cookie)
app.post("/setToday",isAuthenticated, (req, res) => {
    const { newDate } = req.body;
    if (!newDate || isNaN(Date.parse(newDate))) {
        res.status(400).json({ error: "Data non valida" });
    }
    req.session.today = new Date(newDate);
    res.json({ message: `Data impostata a ${req.session.today.toISOString()}` });
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

function expandRecurringEvents(events) {
    const expandedEvents = [];

    events.forEach((event) => {
        if (event.recurrence) {
            const dateStart = new Date(event.start);
            const freqMap = {
                DAILY: RRule.RRule.DAILY,
                WEEKLY: RRule.RRule.WEEKLY,
                MONTHLY: RRule.RRule.MONTHLY,
                YEARLY: RRule.RRule.YEARLY
            };

            const rule = new RRule.RRule({
                freq: freqMap[event.recurrence.frequency],
                count: event.recurrence.interval,
                dtstart: RRule.datetime(dateStart.getFullYear(),dateStart.getMonth()+1,dateStart.getDate(),dateStart.getHours(),dateStart.getMinutes()),
            });

            const occurrences = rule.all();

            occurrences.forEach((date) => {
                if (date.getTime() !== new Date(event.start).getTime()) {
                    const newEvent = {
                        ...event,
                        start: date,
                        end: new Date(date.getTime() + (new Date(event.end) - new Date(event.start))),
                        originalStart: event.start,
                    };
                    delete newEvent.recurrence;
                    expandedEvents.push(newEvent);
                }
            });
        }else{
            expandedEvents.push(event);
        }
    });

    return expandedEvents;
}