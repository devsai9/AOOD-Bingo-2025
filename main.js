const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const calledNumbers = [];
const bingo = "BINGO";
let intervalSeconds = 2;
let paused = true;

const allNumbersElement = document.querySelector(".all-numbers");
const calledNumbersElement = document.querySelector(".called-numbers");

let controlsWindow = null;
let pauseButton;

let gameLoop;


function shuffle(arr) {
    for (let i = arr.length; i > 0; i--) {
        let j = Math.floor(Math.random() * i);
        i--;
        [ arr[i], arr[j] ] = [ arr[j], arr[i] ];
        i++;
    }
}

const patternDiv = document.querySelector(".pattern");
let winningPattern = [
    1, 0, 1, 0, 0,
    0, 1, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 1, 0,
    0, 0, 1, 0, 1,
];

function displayPattern() {
    for (let i = 0; i < 25; i++) {
        patternDiv.innerHTML += `<div class="pattern-square ${winningPattern[i] ? "square-b" : "square-w"}"></div>`;
    }
}

function reset() {
    allNumbersElement.textContent = "";
    calledNumbersElement.textContent = "";
    patternDiv.textContent = "";
    init();
}


let current = 0;
function init() {
    clearInterval(gameLoop);
    for (let num = 1; num <= 75; num++) {
        const i = num - 1;
        let newElement = document.createElement("div");
        newElement.classList.add(
            "small-number",
            "c-b",
            "number",
            `small-${num}`,
        );
        newElement.innerHTML = `<div><span>${bingo[Math.floor(i / 15)]}</span> <br> <span class="little-number">${num}</span></div>`;
        allNumbersElement.append(newElement);
    }
    shuffle(numberPool);
    current = 0;
}

init();
createControlsWindow(600, 550);

let logged = [];

// game logic
function tick() {
    if (paused) return;
    if (current >= numberPool.length) {
        togglePause();
        // console.log("Game over");
        checkGameWorkedCorrectly(logged, numberPool);
        return;
    }
    // if (paused) return;
    const number = numberPool[current];
    const clsList = document.querySelector(`.small-${number}`).classList;
    clsList.remove("c-b");
    clsList.add("c-r");
    addCalledNumber(number);
    playSfx();
    // logging
    logged.push([bingo[Math.floor((number - 1) / 15)], number]);
    // console.log(bingo[Math.floor((number - 1) / 15)], number.toString().length === 1 ? "0" + number : "" + number);
    current++;
}

function checkGameWorkedCorrectly(logged, numberPool) {
    let usedNumbers = [...numberPool];
    for (let i = 0; i < logged.length; i++) {
        if (usedNumbers.includes(logged[i][1]) != -1) usedNumbers.splice(usedNumbers.indexOf(logged[i][1]), 1);
        else {
            // console.log("Game did not work correctly");
            return;
        }
    }
    // if (usedNumbers.length === 0) console.log("Game worked correctly");
    // else console.log("Game did not work correctly");
}

function startGame() {
    displayPattern();
    resume();
}

let soundReady = false;
const soundNames = [
    "ding",
    "vine-boom",
    "wilhelm"
];
let soundEffect = soundNames[0];

function playSfx() {
    const audio = new Audio(`./audio/${soundEffect}.mp3`);
    audio.onloadeddata = () => audio.play();
    audio.load();
}

function addCalledNumber(number) {
    calledNumbers.push(number);
    const smallNumberElement = document.querySelector(`.small-${number}`);
    let numberElement = smallNumberElement.cloneNode(true);

    numberElement.classList.remove(
        "small-number",
        `.small-${number}`,
        "completed",
    );
    numberElement.classList.add("large-number", `.large-${number}`);

    let siblings = calledNumbersElement.children;
    for (let i = 0; i < siblings.length; i++) {
        siblings[i].classList.remove("padding-jankiness");
        void siblings[i].offsetWidth;
        siblings[i].classList.add("padding-jankiness");
    }

    calledNumbersElement.prepend(numberElement);

    setTimeout(() => {
        numberElement.classList.add("show");
    }, 1000);

    if (calledNumbersElement.children.length === 6) {
        calledNumbersElement.removeChild(calledNumbersElement.children[calledNumbersElement.children.length - 1]);
    }

    smallNumberElement.classList.add("completed");
}

function resume() {
    gameLoop = setInterval(tick, intervalSeconds * 1000);
}

function togglePause() {
    pauseButton.textContent = paused ? "Pause" : "Unpause";
    paused = !paused;
    if (paused) clearInterval(gameLoop);
    else resume();
}

// helper functions
function createControlsWindow(width, height) {
    let left = (screen.width / 2) - (width / 2);
    let top = (screen.height / 2) - (height / 2);

    controlsWindow = window.open(
        "",
        "",
        "width=" + width + ",height=" + height + ",left=" + left + ",top=" +
        top,
    );
    if (controlsWindow == null) {
        alert(
            "This site uses a pop-up window. Allow pop-ups and reload the page.",
        );
    }

    controlsWindow.document.write("<h1>Bingo Controls</h1>");
    let controlPanel = document.createElement("div");
    controlPanel.classList.add("control-panel");
    controlsWindow.document.body.append(controlPanel);

    const cont = controlsWindow.document.createElement("div");
    cont.innerHTML = `
        <div class="cover"></div>
        <p>Select the winning pattern</p>
        <div class="choose-pattern"></div>
        <br><br>
        <label for="speed" class="popup-test">Choose speed in seconds between each number reveal</p>
        <input type="range" value="6" min="5" max="30" step="1" name="speed" class="speed-input">
        <input type="number" class="speed-label" value="6" min="0.1" max="30" step="0.1" />
        <div class="buttons"></div>
        <div class="banner">
            <p>Game has been reset</p>
        </div>
    `;
    controlPanel.append(cont);

    const buttons = controlsWindow.document.querySelector(".buttons");

    let speedInput = controlsWindow.document.querySelector(".speed-input");
    let speedLabel = controlsWindow.document.querySelector(".speed-label");

    speedInput.addEventListener("input", () => {
        speedLabel.value = speedInput.value;
        intervalSeconds = parseFloat(speedLabel.value);
    });

    speedInput.addEventListener("change", () => {
        if (paused) return;
        clearInterval(gameLoop);
        resume();
    });

    speedLabel.addEventListener("change", () => {
        if (speedLabel.value < 0.1) speedLabel.value = 0.1;
        if (speedLabel.value > 30) speedLabel.value = 30;
        speedInput.value = speedLabel.value;
        intervalSeconds = parseFloat(speedLabel.value);

        if (paused) return;
        clearInterval(gameLoop);
        resume();
    });

    const cssLink = controlsWindow.document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "popup.css";

    cssLink.onload = () => {
        const loadingCover = controlsWindow.document.querySelector(".cover");
        if (loadingCover) loadingCover.style.opacity = 0;
    };

    controlsWindow.document.head.appendChild(cssLink);

    const selectPatternParent = controlsWindow.document.querySelector(".choose-pattern");
    for (let i = 0; i < 25; i++) {
        let newLabel = controlsWindow.document.createElement("label");
        newLabel.classList.add("pattern-label");
        newLabel.id = `pattern-label-${i}`;

        let newCheckbox = controlsWindow.document.createElement("input");
        newCheckbox.setAttribute("type", "checkbox");
        newCheckbox.id = `pattern-checkbox-${i}`;
        newCheckbox.classList.add("pattern-checkbox");
        newCheckbox.checked = winningPattern[i];
        if (i % 5 === 0) {
            selectPatternParent.append(controlsWindow.document.createElement("br"));
        }
        newLabel.appendChild(newCheckbox);

        let newSpan = controlsWindow.document.createElement("span");
        newSpan.classList.add("pattern-square");
        newSpan.id = `pattern-square-${i}`;
        newLabel.appendChild(newSpan);

        selectPatternParent.appendChild(newLabel);
    }

    const startGameButton = controlsWindow.document.createElement("button");
    startGameButton.classList.add("action-btn");
    startGameButton.textContent = "Start the game";
    startGameButton.onclick = () => {
        startGameButton.disabled = true;
        // speedInput.disabled = true;
        // speedLabel.disabled = true;
        pauseButton.disabled = false;
        if (paused) togglePause();
        controlsWindow.document.querySelectorAll(".pattern-checkbox").forEach((input) => {
            input.disabled = true;
        });

        intervalSeconds = parseFloat(speedLabel.value);
        winningPattern = getWinningPattern(selectPatternParent);
        startGame();
    };
    buttons.append(startGameButton);

    pauseButton = controlsWindow.document.createElement("button");
    pauseButton.classList.add("action-btn");
    pauseButton.textContent = "Unpause";
    pauseButton.disabled = true;
    pauseButton.onclick = () => {
        togglePause();
    }
    buttons.append(pauseButton);

    const againButton = controlsWindow.document.createElement("button");
    againButton.classList.add("action-btn");
    againButton.textContent = "Play again";
    againButton.onclick = () => {
        startGameButton.disabled = false;
        speedInput.disabled = false;
        speedLabel.disabled = false;
        if (!paused) togglePause();
        controlsWindow.document.querySelectorAll(".pattern-checkbox").forEach((input) => {
            input.disabled = false;
        });
        let banner = controlPanel.querySelector(".banner");
        banner.classList.add("show");
        setTimeout(() => {
            banner.classList.remove("show");
        }, 2500);
        reset();
    };
    buttons.append(againButton);
}

function getWinningPattern(parent) {
    const patternInputs = parent.querySelectorAll(".pattern-checkbox");
    const pattern = [];
    patternInputs.forEach((input) => {
        pattern.push(input.checked ? 1 : 0);
    });
    return pattern;
}

window.addEventListener("beforeunload", () => {
    if (controlsWindow && !controlsWindow.closed) {
        controlsWindow.close();
    }
});