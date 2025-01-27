const { MongoClient, ObjectId } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017"; // Sostituisci con la tua stringa di connessione
const client = new MongoClient(uri);
const database = client.db("SELFIE"); // Sostituisci con il nome del database

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


module.exports = { getEventsFromDB, addEventOnDB, deleteEventOnDB };