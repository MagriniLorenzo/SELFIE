let pomodoro = document.getElementById("pomodoro-timer");
let short = document.getElementById("short-timer");
let long = document.getElementById("long-timer");
let timers = document.querySelectorAll(".timer-display");
let session = document.getElementById("pomodoro-session");
let shortBreak = document.getElementById("short-break");
let longBreak = document.getElementById("long-break");
let startBtn = document.getElementById("start");
let stopBtn = document.getElementById("stop");
let currentTimer = null;
let myInterval = null;

// Show the default timer
function showDefaultTimer() {
    pomodoro.style.display = "block";
    short.style.display = "none";
    long.style.display = "none";
    session.classList.add("active");
    currentTimer = pomodoro;
}

showDefaultTimer();


session.addEventListener("click", () => {

    pomodoro.style.display = "block";
    short.style.display = "none";
    long.style.display = "none";

    session.classList.add("active");
    shortBreak.classList.remove("active");
    longBreak.classList.remove("active");

    console.log(pomodoro);

    currentTimer = pomodoro;
});

shortBreak.addEventListener("click", () => {

    short.style.display = "block";
    pomodoro.style.display = "none";
    long.style.display = "none";

    session.classList.remove("active");
    shortBreak.classList.add("active");
    longBreak.classList.remove("active");

    currentTimer = short;
});

longBreak.addEventListener("click", () => {

    long.style.display = "block";
    pomodoro.style.display = "none";
    short.style.display = "none";

    session.classList.remove("active");
    shortBreak.classList.remove("active");
    longBreak.classList.add("active");

    currentTimer = long;
});




function startTimer(timerDisplay) {
    if (myInterval) {
        clearInterval(myInterval);
    }

    let sec = timerDisplay.querySelector("h1").innerHTML;
    let minutes = parseInt(sec.split(":")[0]);
    let seconds = parseInt(sec.split(":")[1]);


    myInterval = setInterval(function() {

        seconds--;

        
        if (seconds < 0) {
            seconds = 59;
            minutes--;
        }

        
        timerDisplay.querySelector(".time").textContent = 
            (minutes < 10 ? '0' + minutes : minutes) + ":" + (seconds < 10 ? '0' + seconds : seconds);

        
        if (minutes <= 0 && seconds <= 0) {
            clearInterval(myInterval);
            myInterval = null; 
        }
    }, 1000);
}


startBtn.addEventListener("click", () => {
    if (currentTimer) {
        startTimer(currentTimer);
    } else {
        alert("Errore");
    }
});

stopBtn.addEventListener("click", () => {
    if (myInterval) {
        clearInterval(myInterval);  
        myInterval = null;

        if (currentTimer) {
            
            let originalTime = currentTimer.querySelector("h1").innerHTML;
            
            
            currentTimer.querySelector(".time").textContent = originalTime;
        }
    }
});

async function logOut(){
    await fetch("http://localhost:3000/logout")
        .then(res => res.json())
        .then(dati => {
            console.log(dati);
            window.location.href = "/";
        })
        .catch(console.error);

}

document.querySelector("#LogOut").addEventListener("click", logOut);


