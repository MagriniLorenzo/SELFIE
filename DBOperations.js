const { MongoClient, ObjectId } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017"; // Sostituisci con la tua stringa di connessione
const client = new MongoClient(uri);
const database = client.db("SELFIE"); // Sostituisci con il nome del database
const tableNames = ["EVENT", "NOTE", "USER"];
const getEventsFromDB = async () => {
    try {
        await client.connect();
        const collection = database.collection("EVENT"); // Sostituisci con il nome della collezione

        const events = await collection.find().toArray(); // Recupera tutti gli eventi
        console.log(events);

        return events; // Restituisce i dati per ulteriori elaborazioni
    } catch (error) {
        console.error("Errore durante il recupero degli eventi:", error);
    } finally {
        await client.close();
    }
};

// Funzione per aggiungere un evento
const addEventOnDB = async (event) => {
    try {
        await client.connect();
        const collection = database.collection("EVENT"); // Sostituisci con il nome della collezione

        const result = await collection.insertOne(event); // Inserisce un evento
        return result.insertedId; // Restituisce l'ID dell'evento appena inserito
    } catch (error) {
        console.error("Errore durante l'inserimento dell'evento:", error);
        throw error;
    } finally {
        await client.close();
    }
};

// Funzione per eliminare un evento
const deleteEventOnDB = async (eventId) => {
    try {
        await client.connect();
        const collection = database.collection("EVENT");

        const result = await collection.deleteOne({ _id: new ObjectId(eventId) }); // Usa l'ID per identificare l'evento

        return result.deletedCount; // Restituisce il numero di documenti eliminati (in questo caso, 1 o 0)
    } catch (error) {
        console.error("Errore durante l'eliminazione dell'evento:", error);
        throw error;
    } finally {
        await client.close();
    }
};

const getAccountFromDB = async (username, password) => {
    try {
        await client.connect();
        const collection = database.collection(tableNames[3]); // Sostituisci con il nome della collezione

        const user = await collection.find({username:username, password:password}); // Recupera tutti gli account con questo nome e con questa password
        console.log(user);

        return user?1:0; // Restituisce 1 se c'è un match 0 altrimenti
    } catch (error) {
        console.error("Errore durante il recupero dei dati dell'utente:", error);
    } finally {
        await client.close();
    }
};

// Funzione per aggiungere un evento
const addAccountOnDB = async (username, password) => {
    try {
        await client.connect();
        const collection = database.collection(tableNames[3]);

        const finded = await collection.find({username:username}); //verifico che non ci sia già un account con lo stesso nome
        if(!finded){
            return finded;
        }
        await collection.insertOne({username:username,password:password}); // Inserisce un account

        return 1; // Restituisce 1 se è stato aggiunto 0 altrimenti
    } catch (error) {
        console.error("Errore durante l'inserimento dell'account:", error);
        throw error;
    } finally {
        await client.close();
    }
};

module.exports = { getEventsFromDB, addEventOnDB, deleteEventOnDB, addAccountOnDB, getAccountFromDB };