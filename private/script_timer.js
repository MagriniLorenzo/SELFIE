let pomodoro, short, long,
    timers, session, shortBreak, longBreak,
    startBtn, azzeraBtn, stopBtn, breakPopup, currentTimer = null, myInterval = null,shortBreakBtn,longBreakBtn,
    customTimePopup,customMinutes,customSeconds,setCustomTimeBtn,cancelCustomTimeBtn;

let customTimes = {
    pomodoro: { minutes: 25, seconds: 0 },
    short: { minutes: 5, seconds: 0 },
    long: { minutes: 10, seconds: 0 }
};

let alertSound = new Audio('/private/sound/alert.mp3');

document.addEventListener("DOMContentLoaded", () => {
    pomodoro = document.getElementById("pomodoro-timer");
    short = document.getElementById("short-timer");
    long = document.getElementById("long-timer");
    timers = document.querySelectorAll(".timer-display");
    session = document.getElementById("pomodoro-session");
    shortBreak = document.getElementById("short-break");
    longBreak = document.getElementById("long-break");
    startBtn = document.getElementById("start");
    azzeraBtn = document.getElementById("azzera");
    stopBtn = document.getElementById("stop");
    breakPopup = document.getElementById("break-popup");
    shortBreakBtn = document.getElementById("short-break-btn");
    longBreakBtn = document.getElementById("long-break-btn");
    customTimePopup = document.getElementById("custom-time-popup");
    customMinutes = document.getElementById("custom-minutes");
    customSeconds = document.getElementById("custom-seconds");
    setCustomTimeBtn = document.getElementById("set-custom-time");
    cancelCustomTimeBtn = document.getElementById("cancel-custom-time");

    document.querySelector("#LogOut").addEventListener("click", logOut);
    startBtn.addEventListener("click", start);
    azzeraBtn.addEventListener("click", azzera);
    stopBtn.addEventListener("click", stop);
    shortBreak.addEventListener("click", pausaCorta);
    longBreak.addEventListener("click", pausaLunga);
    session.addEventListener("click", sessionePomodoro);

    showDefaultTimer();
    
    shortBreakBtn.addEventListener("click", () => {
    breakPopup.style.display = "none";
    pausaCorta();
    startTimer(short);
    });

    longBreakBtn.addEventListener("click", () => {
    breakPopup.style.display = "none";
    pausaLunga();
    startTimer(long);
    });

    timers.forEach(timer => {
        timer.addEventListener("click", () => {
            customTimePopup.style.display = "block";
        });
    });

    cancelCustomTimeBtn.addEventListener("click", () => {
        customTimePopup.style.display = "none";
    });

    setCustomTimeBtn.addEventListener("click", () => {
        let min = parseInt(customMinutes.value) || 0;
        let sec = parseInt(customSeconds.value) || 0;

        if (min === 0 && sec === 0) return;

        let key = currentTimer === pomodoro ? "pomodoro" :
                currentTimer === short ? "short" : "long";

        customTimes[key] = { minutes: min, seconds: sec };

        updateFlipCards(currentTimer, min, sec);
        customTimePopup.style.display = "none";
    });
});

function showDefaultTimer() {
    pomodoro.style.display = "block";
    short.style.display = "none";
    long.style.display = "none";
    session.classList.add("active");
    currentTimer = pomodoro;
}

function sessionePomodoro() {
    pomodoro.style.display = "block";
    short.style.display = "none";
    long.style.display = "none";
    session.classList.add("active");
    shortBreak.classList.remove("active");
    longBreak.classList.remove("active");
    currentTimer = pomodoro;
}

function pausaCorta() {
    short.style.display = "block";
    pomodoro.style.display = "none";
    long.style.display = "none";
    session.classList.remove("active");
    shortBreak.classList.add("active");
    longBreak.classList.remove("active");
    currentTimer = short;
}

function pausaLunga() {
    long.style.display = "block";
    pomodoro.style.display = "none";
    short.style.display = "none";
    session.classList.remove("active");
    shortBreak.classList.remove("active");
    longBreak.classList.add("active");
    currentTimer = long;
}

function flip(flipCard, newNumber) {
    const topHalf = flipCard.querySelector(".top");
    const bottomHalf = flipCard.querySelector(".bottom");
    const startNumber = parseInt(topHalf.textContent);
    if (newNumber === startNumber) return;

    const topFlip = document.createElement("div");
    topFlip.classList.add("top-flip");
    const bottomFlip = document.createElement("div");
    bottomFlip.classList.add("bottom-flip");

    topHalf.textContent = startNumber;
    bottomHalf.textContent = startNumber;
    topFlip.textContent = startNumber;
    bottomFlip.textContent = newNumber;

    topFlip.addEventListener("animationstart", () => {
        topHalf.textContent = newNumber;
    });
    topFlip.addEventListener("animationend", () => {
        topFlip.remove();
    });
    bottomFlip.addEventListener("animationend", () => {
        bottomHalf.textContent = newNumber;
        bottomFlip.remove();
    });
    flipCard.append(topFlip, bottomFlip);
}

function updateFlipCards(timerDisplay, minutes, seconds) {
    let prefix;
    if (timerDisplay === pomodoro) prefix = "pomodoro";
    else if (timerDisplay === short) prefix = "short";
    else if (timerDisplay === long) prefix = "long";

    flip(document.querySelector(`[data-${prefix}-minutes-tens]`), Math.floor(minutes / 10));
    flip(document.querySelector(`[data-${prefix}-minutes-ones]`), minutes % 10);
    flip(document.querySelector(`[data-${prefix}-seconds-tens]`), Math.floor(seconds / 10));
    flip(document.querySelector(`[data-${prefix}-seconds-ones]`), seconds % 10);
}

function startTimer(timerDisplay) {
    if (myInterval) {
        clearInterval(myInterval);
    }

    let prefix = timerDisplay === pomodoro ? "pomodoro" : timerDisplay === short ? "short" : "long";
    let minutesTens = parseInt(document.querySelector(`[data-${prefix}-minutes-tens] .top`).textContent);
    let minutesOnes = parseInt(document.querySelector(`[data-${prefix}-minutes-ones] .top`).textContent);
    let secondsTens = parseInt(document.querySelector(`[data-${prefix}-seconds-tens] .top`).textContent);
    let secondsOnes = parseInt(document.querySelector(`[data-${prefix}-seconds-ones] .top`).textContent);

    let minutes = minutesTens * 10 + minutesOnes;
    let seconds = secondsTens * 10 + secondsOnes;

    if (minutes === 0 && seconds === 0) return;

    myInterval = setInterval(() => {
        if (minutes === 0 && seconds === 0) {
            clearInterval(myInterval);
            myInterval = null;
            alertSound.play();
            azzera();
            if (timerDisplay === pomodoro) {
                breakPopup.style.display = "block";
            }
            return;
        }

        seconds--;

        if (seconds < 0) {
            seconds = 59;
            minutes--;
        }

        updateFlipCards(timerDisplay, minutes, seconds);
    }, 1000);

}

function start() {
    if (currentTimer) {
        startTimer(currentTimer);
    } else {
        alert("Errore");
    }
}

function stop() {
    if (myInterval) {
        clearInterval(myInterval);
        myInterval = null;
    }
}

function azzera() {
    if (myInterval) {
        clearInterval(myInterval);
        myInterval = null;
    }

    let minutes, seconds;
    let key = currentTimer === pomodoro ? "pomodoro" :
          currentTimer === short ? "short" : "long";

    let custom = customTimes[key];
    minutes = custom.minutes;
    seconds = custom.seconds;

    updateFlipCards(currentTimer, minutes, seconds);
}

async function logOut(){
    try {
        await axios.get("/logout")
        window.location.href = "/";
    } catch (error){
        console.error(error);
    }
}