import pkg from 'rrule';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import path from 'path';
import {fileURLToPath} from "url";
import {
    addAccountOnDB,
    addEventOnDB,
    addNoteOnDB,
    addPollOnDB,
    deleteEventOnDB,
    deleteNoteOnDB,
    getAccountFromDB,
    getEventsFromDB,
    getNotesFromDB,
    getPollsFromDB,
    updateNoteOnDB,
    updateVoteInDB
} from "./DBOperations.js"
import ical from "ical-generator";

const {RRule} = pkg;
const PORT = process.env.PORT || 10255;
const EVENT_FILE_PATH = "./events.json";
const NOTES_FILE_PATH = "./notes.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Middleware
//app.use(cors({ origin: 'https://selfietutto-b6bkc4fphhhwbdbu.italynorth-01.azurewebsites.net', credentials: true }));
app.use(cors({origin: 'http://localhost:10255', credentials: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: false}));

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
passport.use(new LocalStrategy({usernameField: 'username'}, async (name, password, done) => {
    // Trova l'utente
    const user = await getAccountFromDB(name);
    if (!user) {
        return done(null, false, {message: 'Username non registrato'});
    }

    // Confronta la password hashata
    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
            return done(null, user);
        } else {
            return done(null, false, {message: 'Password errata'});
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
            res.json(events);
        })
        .catch((error) => {
            res.status(500).send("Errore nella lettura dei dati");
        });
});

// Endpoint per ottenere eventi
app.get("/events/iCalendar", isAuthenticated, (req, res) => {
    const filter = {id_user: req.user.username, start: {$ne: ""}};
    //ottengo tutti gli eventi dell'utente
    getEventsFromDB(filter)
        .then((events) => {
            if(events){
                // Crea il calendario
                const calendar = ical({ name: 'Eventi SELFIE' });

                events.forEach(event => {
                    const e = calendar.createEvent({
                        start: new Date(event.start),
                        end: new Date(event.end),
                        summary: event.title,
                        description: event.description,
                        organizer: { name: event.id_user },
                    });

                    if (event.rrule) {
                        // Estrai solo la parte RRULE (senza DTSTART)
                        const rruleLines = event.rrule.split('\n');
                        const rruleStr = rruleLines.find(line => line.startsWith('RRULE'));
                        e.repeating(rruleStr);
                    }else{
                        event.rrule="";
                    }
                });

                // Impostiamo gli header per il download
                res.setHeader('Content-Disposition', 'attachment; filename="your_events.ics"');
                res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
                res.send(calendar.toString());

            } else {
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

    //aggingo l'id dell'utente
    newEvent.id_user = req.user.username;

    if (newEvent.rrule) {
        const options = {
            freq: RRule[newEvent.rrule.freq],
            dtstart: new Date(newEvent.rrule.dtstart)
        };

        if (newEvent.rrule.freq === "WEEKLY") {
            options.byweekday = [RRule[newEvent.rrule.byweekday]];
        }

        if (newEvent.rrule.until) {
            options.until = newEvent.rrule.until;
        }

        const rule = new RRule(options);
        newEvent.rrule = rule.toString();
    }

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
    const {_id} = req.body; // Parametri dell'evento da eliminare

    await deleteEventOnDB(_id, req.user.username)
        .then((events) => {
            if (events === 1) {
                res.status(200).json({message: "Evento eliminato con successo"});
            } else {
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

            res.json(notes);
        })
        .catch((error) => {
            res.status(500).send("Errore nella lettura dei dati");
        });
});

// Endpoint per salvare note con ID incrementale
app.post("/notes", isAuthenticated, async (req, res) => {
    const newNote = req.body;

    newNote.id_user = req.user.username;

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
    updatedNote.id_user = req.user.username;

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
    const {id} = req.params; // Ottieni l'ID dalla richiesta

    await deleteNoteOnDB(id, req.user.username)
        .then((events) => {
            if (events === 1) {
                res.status(200).json({message: "Nota eliminata con successo"});
            } else {
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

// Endpoint per visualizzare il timer del pomodoro
app.get("/home/sondaggi", isAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, "private", "sondaggi.html");
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

    addAccountOnDB(userData.username, hashedPassword)
        .then((events) => {
            if (events)
                res.status(200).send("Account registrato");
            else {
                res.status(400).send("Errore, il nome utente che hai inserito esiste già");
            }
        })
        .catch((error) => {
            res.status(500).send(`Errore nella creazione dell'account ${error}`);
        });
});


app.get("/polls", isAuthenticated, async (req, res) => {
    const userId = req.user.username; // Ottieni l'ID dell'utente loggato

    try {
        const polls = await getPollsFromDB(); // Recupera tutti i sondaggi
        const pollsWithVoteStatus = polls.map(poll => {
            const hasVoted = poll.options.some(opt => opt.voters && opt.voters.includes(userId)); // Verifica se l'utente ha già votato
            const selectedOption = poll.options.find(opt => opt.voters && opt.voters.includes(userId)); // Trova l'opzione selezionata

            return {
                ...poll,
                hasVoted, // Aggiungi lo stato del voto
                selectedOption: selectedOption ? selectedOption.text : null, // Aggiungi l'opzione selezionata
                userId // Aggiungi userId alla risposta
            };
        });

        res.json(pollsWithVoteStatus); // Restituisci i sondaggi con lo stato del voto e userId
    } catch (error) {
        console.error("Errore nel recupero dei sondaggi:", error);
        res.status(500).send("Errore nella lettura dei dati");
    }
});


// Endpoint per registrare un voto
app.post("/polls/vote", isAuthenticated, async (req, res) => {
    const {pollId, optionText} = req.body;
    const userId = req.user.username; // Otteniamo l'ID dell'utente loggato

    if (!pollId || !optionText) {
        return res.status(400).json({success: false, error: 'Poll ID e/o testo opzione mancanti'});
    }

    try {
        const success = await updateVoteInDB(pollId, optionText, userId);
        if (success) {
            res.json({success: true, hasVoted: true}); // Risposta di successo
        } else {
            res.json({success: false, error: 'Hai già votato per questo sondaggio', hasVoted: true});
        }
    } catch (error) {
        console.error("Errore durante la registrazione del voto:", error);
        res.status(500).json({success: false, error: 'Errore durante la registrazione del voto'});
    }
});


// Endpoint per salvare un nuovo sondaggio
app.post("/polls", isAuthenticated, async (req, res) => {
    const newPoll = req.body;
    newPoll.id_user = req.user.username;

    // Verifica che il sondaggio abbia un titolo e almeno due opzioni
    if (!newPoll.title || !newPoll.options || newPoll.options.length < 2) {
        return res.status(400).json({error: "Il formato dei dati deve contenere 'title' e almeno 2 opzioni."});
    }

    try {
        const pollId = await addPollOnDB(newPoll); // Ottieni l'ID del sondaggio
        // Rispondi con l'ID del sondaggio in formato JSON
        res.status(200).json({success: true, pollId: pollId});
    } catch (error) {
        console.error("Errore durante la creazione del sondaggio:", error);
        res.status(500).json({error: `Errore nella scrittura del sondaggio: ${error.message}`});
    }
});


// Rotta di login con Passport.js
app.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({message: 'Login effettuato con successo'});
});

// Rotta di logout
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            res.status(500).json({message: 'Errore nel logout'});
        }
        res.json({message: 'Logout effettuato'});
    });
});

// Endpoint per ottenere la data dalla sessione
app.get("/get-today", isAuthenticated, (req, res) => {
    // Assicurati che la sessione sia inizializzata
    if (!req.session.today) {
        req.session.today = new Date(); // Imposta la data alla data attuale se non esiste
    }

    let date = new Date(req.session.today).toISOString(); // Assicurati che sia un oggetto Date
    res.json({today: date});
});

// Endpoint per cambiare la data nella sessione (ed anche nel cookie)
app.post("/setToday", isAuthenticated, (req, res) => {
    const {newDate} = req.body;
    if (!newDate || isNaN(Date.parse(newDate))) {
        res.status(400).json({error: "Data non valida"});
    }
    req.session.today = new Date(newDate);
    res.json({message: `Data impostata a ${req.session.today.toISOString()}`});
});

// Endpoint per servire la pagina principale
app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "public", "index.html");
    res.sendFile(filePath);
});

// Avvio del server
app.listen(PORT, () => console.log(`Server in esecuzione`));

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

// Add minutes to a Date
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

// Expand a single recurring event
function expandEvent(event, rangeStart, rangeEnd) {
    const dtStart = convertGmtToUTC(new Date(event.start), 2);
    const dtEnd = convertGmtToUTC(new Date(event.end), 2);
    const duration = (dtEnd - dtStart) / 60000; // calculate real duration; // in minutes

    const rule = new RRule.fromString(event.rrule);

    const dates = rule.all();

    return dates.map(date => ({
        ...event,
        start: date,
        end: addMinutes(date, duration),
    }));
}

// Expand Recurring Events for a Date Range
function expandRecurringEvents(events) {
    const expandedEvents = [];

    try {
        for (const event of events) {
            const rangeStart = convertGmtToUTC(new Date(event.start), 2);
            const rangeEnd = convertGmtToUTC(new Date(event.end), 2);

            if (event.rrule) {
                const instances = expandEvent(event, rangeStart, rangeEnd);
                expandedEvents.push(...instances);
            } else {
                // // Push only if it's within range
                expandedEvents.push(event);
            }
        }
    } catch (e) {
        console.error(e);
    }
    return expandedEvents;
}

function convertGmtToUTC(dateStr, hourFromUTC) {
    // Parse the date as if it's in local GMT+2 time
    const localDate = new Date(dateStr);

    // Get the time in milliseconds
    const utcMillis = localDate.getTime() - (hourFromUTC * 60 * 60 * 1000);

    // Return as ISO string with Z (UTC)
    return new Date(utcMillis);
}
