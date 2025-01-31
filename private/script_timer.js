let pomodoro, short, long,
    timers, session, shortBreak, longBreak,
    startBtn,stopBtn, currentTimer = null, myInterval = null;

document.addEventListener("DOMContentLoaded",()=>{
    pomodoro = document.getElementById("pomodoro-timer");
    short = document.getElementById("short-timer");
    long = document.getElementById("long-timer");
    timers = document.querySelectorAll(".timer-display");
    session = document.getElementById("pomodoro-session");
    shortBreak = document.getElementById("short-break");
    longBreak = document.getElementById("long-break");
    startBtn = document.getElementById("start");
    stopBtn = document.getElementById("stop");

    document.querySelector("#LogOut").addEventListener("click", logOut);
    startBtn.addEventListener("click", start);
    stopBtn.addEventListener("click", stop);
    shortBreak.addEventListener("click", pausaCorta);
    longBreak.addEventListener("click", pausaLunga);
    session.addEventListener("click", sessionePomodoro);

    showDefaultTimer();


});

// Show the default timer
function showDefaultTimer() {
    pomodoro.style.display = "block";
    short.style.display = "none";
    long.style.display = "none";
    session.classList.add("active");
    currentTimer = pomodoro;
}

function sessionePomodoro(){

    pomodoro.style.display = "block";
    short.style.display = "none";
    long.style.display = "none";

    session.classList.add("active");
    shortBreak.classList.remove("active");
    longBreak.classList.remove("active");

    console.log(pomodoro);

    currentTimer = pomodoro;
}

function pausaCorta(){
    short.style.display = "block";
    pomodoro.style.display = "none";
    long.style.display = "none";

    session.classList.remove("active");
    shortBreak.classList.add("active");
    longBreak.classList.remove("active");

    currentTimer = short;
}

function pausaLunga(){

    long.style.display = "block";
    pomodoro.style.display = "none";
    short.style.display = "none";

    session.classList.remove("active");
    shortBreak.classList.remove("active");
    longBreak.classList.add("active");

    currentTimer = long;
}

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

function start()  {
    if (currentTimer) {
        startTimer(currentTimer);
    } else {
        alert("Errore");
    }
}


function stop(){
    if (myInterval) {
        clearInterval(myInterval);
        myInterval = null;

        if (currentTimer) {

            let originalTime = currentTimer.querySelector("h1").innerHTML;


            currentTimer.querySelector(".time").textContent = originalTime;
        }
    }
}

async function logOut(){
    await fetch("http://localhost:3000/logout")
        .then(res => res.json())
        .then(dati => {
            console.log(dati);
            window.location.href = "/";
        })
        .catch(console.error);
}

