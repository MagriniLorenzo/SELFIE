let polls = [];
let votedPolls = new Set(); // Tengo traccia dei sondaggi in cui l'utente ha votato

async function fetchPolls() {
    try {
        const response = await axios.get("/polls");
        const polls = response.data;

        const userId = polls.length > 0 ? polls[0].userId : null; // Recupero l'userId dalla prima risposta

        // Aggiorna lo stato dei sondaggi votati
        polls.forEach(poll => {
            if (poll.hasVoted) {
                votedPolls.add(poll._id); // Aggiungi il sondaggio alla lista dei sondaggi votati
            }
        });

        renderPolls(polls, userId);
    } catch (error) {
        console.error("Errore nel recupero dei sondaggi:", error);
    }
}


// Funzione per aggiornare la visualizzazione dei sondaggi
function renderPolls(polls, userId) {
    const pollsContainer = document.getElementById("pollsContainer");
    pollsContainer.innerHTML = "";

    if (polls.length === 0) {
        pollsContainer.innerHTML = `
            <div class="wrapper" id="noPolls">
                <header>Nessun sondaggio attivo</header>
            </div>
        `;
        return;
    }

    polls.forEach((poll) => {
        const wrapper = document.createElement("div");
        wrapper.className = "wrapper";

        const header = document.createElement("header");
        header.textContent = poll.title;
        wrapper.appendChild(header);

        const pollArea = document.createElement("div");
        pollArea.className = "poll-area";
        wrapper.appendChild(pollArea);

        const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.voters ? opt.voters.length : 0), 0);

        poll.options.forEach((option, optionIndex) => {
            const percentage = totalVotes > 0 ? ((option.voters ? option.voters.length : 0) / totalVotes * 100).toFixed(1) : 0;

            const label = document.createElement("label");
            label.setAttribute("for", `opt-${poll._id}-${optionIndex}`);
            label.innerHTML = `
                <div class="row">
                    <div class="column">
                        <span class="circle"></span>
                        <span class="text">${option.text}</span>
                    </div>
                    <span class="percent">${percentage}% (${option.voters ? option.voters.length : 0} voti)</span>
                </div>
                <div class="progress" style="--w: ${percentage}%;"></div>
            `;

            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = `poll-${poll._id}`;
            input.id = `opt-${poll._id}-${optionIndex}`;
            pollArea.appendChild(input);
            pollArea.appendChild(label);

            // Se l'utente ha già votato, disabilito l'input e evidenzio l'opzione selezionata
            if (poll.hasVoted) {
                label.classList.add("voted");
                input.disabled = true;

                if (poll.selectedOption === option.text) {
                    input.checked = true;
                    const circle = label.querySelector(".circle");
                    if (circle) {
                        circle.classList.add("filled");
                    }
                }
            }

            // Gestione del voto
            label.addEventListener("click", async () => {
                if (poll.hasVoted) {
                    alert("Hai già votato in questo sondaggio!");
                    return;
                }

                try {
                    const response = await axios.post("/polls/vote", {
                        pollId: poll._id,
                        optionText: option.text
                    });

                    const data = response.data;
                    if (data.success) {
                        option.voters = option.voters || [];
                        option.voters.push(userId);
                        poll.hasVoted = true;
                        poll.selectedOption = option.text;
                        renderPolls(polls, userId);
                    } else {
                        alert("Errore nel voto: " + data.error);
                    }
                } catch (error) {
                    console.error("Errore durante il voto:", error);
                    alert("Errore di connessione. Riprova.");
                }
            });
        });

        pollsContainer.appendChild(wrapper);
    });
}

const optionLimit = 3;

document.getElementById("addOption").addEventListener("click", () => {
    const optionsCount = document.querySelectorAll(".option-input").length;

    // Se il numero di opzioni è inferiore al limite, aggiungi una nuova opzione
    const newOptionInput = document.createElement("input");
    newOptionInput.type = "text";
    newOptionInput.className = "option-input";
    newOptionInput.placeholder = `Opzione ${optionsCount + 1}`;
    
    document.getElementById("newOptions").appendChild(newOptionInput);

    // Disabilito il pulsante se sono già 4 opzioni
    if (optionsCount >= optionLimit) {
        const addOptionButton = document.getElementById("addOption");
        addOptionButton.disabled = true;
        return;
    }
});

document.getElementById("createPoll").addEventListener("click", async () => {
    const title = document.getElementById("newPollTitle").value;
    const options = Array.from(document.querySelectorAll(".option-input"))
                          .map(input => input.value)
                          .filter(value => value.trim() !== "");

    if (!title || options.length < 2) {
        alert("Il sondaggio deve avere un titolo e almeno 2 opzioni.");
        return;
    }

    try {
        const response = await axios.post("/polls", {
            title,
            options
        });

        const data = response.data;
        if (data.success) {
            alert("Sondaggio creato con successo!");
            window.location.reload();
        } else {
            alert("Errore nella creazione del sondaggio: " + data.error);
        }
    } catch (error) {
        console.error("Errore nel creare il sondaggio:", error);
        alert("Errore nella connessione. Riprova.");
    }
});

fetchPolls();
