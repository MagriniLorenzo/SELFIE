import {create} from "axios";
let usernameField, passwordField;

document.addEventListener('DOMContentLoaded', () => {
   // Seleziona gli elementi dal DOM
   usernameField = document.getElementById('username');
   passwordField = document.getElementById('password');

   let btnLogin = document.getElementById('Login');
   let btnCreateAccount = document.getElementById('createAccount');

   btnLogin.addEventListener('click', login);
   btnCreateAccount.addEventListener('click', createAccount);
});

async function createAccount(event){
   event.preventDefault();

   // Leggi i valori dei campi
   const username = usernameField.value.trim();
   const password = passwordField.value;

   validateData(username,password);
   //verifico che non ci sia già un utente con lo stesso nome
   // Hash della password (utilizzando la libreria SubtleCrypto disponibile nei browser moderni)
   try {
      const hashedPassword = await hashPassword(password);

      // Prepara i dati da inviare al server
      const registerData = {
         username: username,
         password: hashedPassword, // Invia l'hash invece della password in chiaro
      };

      // Invia i dati al server tramite una richiesta POST
      const response = await fetch('/register', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(registerData)
      });

      // Gestisci la risposta del server
      if (response.ok) {
         alert('Account creato con successo! Puoi ora effettuare il login.');
         usernameField.value = '';
         passwordField.value = '';
      } else {
         const errorData = await response.json();
         alert(`Errore: ${errorData.message}`);
      }

   } catch (error) {
      console.error('Errore durante la registrazione:', error);
      alert('Si è verificato un errore. Riprova più tardi.');
   }
}

// Aggiungi un event listener al pulsante di login
async function login(event){
   event.preventDefault(); // Previene il comportamento predefinito del bottone

   // Leggi i valori dei campi
   const username = usernameField.value.trim();
   const password = passwordField.value;

   validateData(username,password);

   // Hash della password (utilizzando la libreria SubtleCrypto disponibile nei browser moderni)
   try {
      const hashedPassword = await hashPassword(password);

      // Prepara i dati da inviare al server
      const loginData = {
         username: username,
         password: hashedPassword, // Invia l'hash invece della password in chiaro
      };

      // Invia i dati al server tramite una richiesta POST
      const response = await fetch('/login', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(loginData)
      });

      // Gestisci la risposta del server
      if (response.ok) {
         alert('Login effettuato con successo!');
         window.location.href = '/index.html'; // Reindirizza a una nuova pagina
      } else {
         const errorData = await response.json();
         alert(`Errore: ${errorData.message}`);
      }

   } catch (error) {
      console.error('Errore durante il login:', error);
      alert('Si è verificato un errore. Riprova più tardi.');
   }
}

// Funzione per effettuare l'hashing della password
async function hashPassword(password) {
   const encoder = new TextEncoder();
   const data = encoder.encode(password);
   const hashBuffer = await crypto.subtle.digest('SHA-256', data);
   return bufferToHex(hashBuffer);
}

// Funzione per convertire un ArrayBuffer in una stringa esadecimale
function bufferToHex(buffer) {
   return Array.from(new Uint8Array(buffer))
       .map(b => b.toString(16).padStart(2, '0'))
       .join('');
}

function validateData(username, password) {
   // Controlla che i campi non siano vuoti
   if (!username || !password) {
      alert('Inserisci sia il nome utente che la password.');
      return;
   }

   // Esegui una validazione base (esempio: lunghezza minima)
   if (password.length < 8) {
      alert('La password deve contenere almeno 8 caratteri.');
   }
}