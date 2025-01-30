const { MongoClient, ObjectId } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";
const dbName = "SELFIE";
const tableNames = ["EVENT", "NOTE", "USER"];

/**
 * Ottiene tutti gli eventi dal db
 * @returns {Promise<WithId<Document>[]>}
 */
const getEventsFromDB = async () => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[0]);

        const events = await collection.find().toArray(); // Recupera tutti gli eventi
        console.log(events);

        return events; // Restituisce i dati per ulteriori elaborazioni
    } catch (error) {
        console.error("Errore durante il recupero degli eventi:", error);
    } finally {
        await client.close();
    }
};

/**
 * Funzione per aggiungere un evento al db
 * @param event evento da aggiungere
 * @returns {Promise<Document extends {_id: infer IdType} ? (Record<any, never> extends infer IdType ? never : IdType) : (Document extends {_id?: infer IdType} ? (unknown extends infer IdType ? ObjectId : IdType) : ObjectId)>}
 */
const addEventOnDB = async (event) => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[0]);

        const result = await collection.insertOne(event); // Inserisce un evento
        return result.insertedId; // Restituisce l'ID dell'evento appena inserito
    } catch (error) {
        console.error("Errore durante l'inserimento dell'evento:", error);
        throw error;
    } finally {
        await client.close();
    }
};

/**
 * Funzione per eliminare un evento dal db
 * @param eventId id dell'evento da eliminare
 * @returns {Promise<number>}
 */
const deleteEventOnDB = async (eventId) => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[0]);
        // Usa l'ID per identificare l'evento
        const result = await collection.deleteOne({ _id: new ObjectId(eventId) });

        return result.deletedCount; // Restituisce il numero di documenti eliminati (in questo caso, 1 o 0)
    } catch (error) {
        console.error("Errore durante l'eliminazione dell'evento:", error);
        throw error;
    } finally {
        await client.close();
    }
};

/**
 * Ottiene tutte le note dal db
 * @returns {Promise<WithId<Document>[]>}
 */
const getNotesFromDB = async () => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[1]);

        const notes = await collection.find().toArray(); // Recupera tutte le note
        console.log(notes);

        return notes; // Restituisce i dati per ulteriori elaborazioni
    } catch (error) {
        console.error("Errore durante il recupero delle note:", error);
    } finally {
        await client.close();
    }
};

const addNoteOnDB = async (note) => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[1]);

        const result = await collection.insertOne(note); // Inserisce una nota
        return result.insertedId; // Restituisce l'ID della nota appena inserita
    } catch (error) {
        console.error("Errore durante l'inserimento della nota:", error);
        throw error;
    } finally {
        await client.close();
    }
};

const deleteNoteOnDB = async (noteId) => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[1]);
        // Usa l'ID per identificare l'evento
        const result = await collection.deleteOne({ _id: new ObjectId(noteId) });

        return result.deletedCount; // Restituisce il numero di documenti eliminati (in questo caso, 1 o 0)
    } catch (error) {
        console.error("Errore durante l'eliminazione della nota:", error);
        throw error;
    } finally {
        await client.close();
    }
};

const updateNoteOnDB = async (id, note) => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[1]);

        // Aggiornare la nota con il nuovo contenuto
        const result = await collection.updateOne(
            { _id: new ObjectId(id) }, // Trova la nota tramite l'ID
            { $set: note } // Applica gli aggiornamenti
        );

        if (result.matchedCount === 0) {
            throw new Error("Nota non trovata");
        }

        return { message: "Nota aggiornata con successo" };
    } catch (error) {
        console.error("Errore durante l'aggiornamento della nota:", error);
        throw error;
    } finally {
        await client.close();
    }
}

/**
 * Restituisce i dati dello user con lo username preso come parametro
 * @param username dell'utente da individuare
 * @returns {Promise<Document & {_id: InferIdType<Document>}>}
 */
const getAccountFromDB = async (username) => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[2]);

        // Recupera l'account con questo nome e con questa password
        return await collection.findOne({username: username});
    } catch (error) {
        console.error("Errore durante il recupero dei dati dell'utente:", error);
    } finally {
        await client.close();
    }
};

/**
 * Funzione per aggiungere un User Account sul db
 * @param username nome utente dell'account
 * @param password password dell'account
 * @returns {Promise<boolean>} true se l'account è stato aggiunto, false altrimenti
 */
const addAccountOnDB = async (username, password) => {
        const client = new MongoClient(uri);
    try {
        const database = client.db(dbName);
        await client.connect();
        const collection = database.collection(tableNames[2]);

        //verifico che non ci sia già un account con lo stesso nome
        const finded = await collection.findOne({username:username},{projection:{_id:0,username:1}});
        if(finded){
            return false; // Restituisce false se non è stato aggiunto l'account
        }
        await collection.insertOne({username:username,password:password}); // Inserisce un account

        return true; // Restituisce true se è stato aggiunto l'account
    } catch (error) {
        console.error("Errore durante l'inserimento dell'account:", error);
        throw error;
    } finally {
        await client.close();
    }
};

module.exports = { getEventsFromDB, addEventOnDB, deleteEventOnDB,
                    getNotesFromDB, addNoteOnDB, deleteNoteOnDB,
                    updateNoteOnDB, addAccountOnDB, getAccountFromDB};