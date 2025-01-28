let dev = false;

const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const calledNumbers = [];
const bingo = "BINGO";
let intervalSeconds = 2;
let paused = false;

const allNumbersElement = document.querySelector(".all-numbers");
const calledNumbersElement = document.querySelector(".called-numbers");

let controlsWindow = null;
let pauseButton;


function shuffle(arr) {
    for (let i = arr.length; i > 0; i--) {
        let j = Math.floor(Math.random() * i);
        [ arr[i], arr[j] ] = [ arr[j], arr[i] ];
    }
}

// Winning Pattern
const patternDiv = document.querySelector('.pattern');
let winningPattern = [
    1, 0, 1, 0, 0,
    0, 1, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 1, 0,
    0, 0, 1, 0, 1,
];

function displayPattern() {
    for (let i = 0; i < 25; i++) {
        patternDiv.innerHTML += `<div class="pattern-square ${winningPattern[i] ? 'square-b' : 'square-w'}"></div>`;
    }
}

function reset() {
    allNumbersElement.textContent = "";
    calledNumbersElement.textContent = "";
    init();
}

if (!dev) createControlsWindow(600, 500);
if (dev) startGame();

let current = 0;
function init() {
    // init game
    for (let num = 1; num <= 75; num++) {
        const i = num - 1;
        let newElement = document.createElement("div");
        newElement.classList.add(
            "small-number",
            "c-b",
            "number",
            `small-${num}`,
        );
        newElement.innerHTML = `<p>${bingo[Math.floor(i / 15)]} <br> ${num}</p>`;
        allNumbersElement.append(newElement);
    }
    shuffle(numberPool);
    current = 0;
}

init();


// game logic
function tick() {
    if (current >= numberPool.length) return;
    const number = numberPool[current];
    const clsList = document.querySelector(`.small-${number}`).classList;
    clsList.remove("c-b");
    clsList.add("c-r");
    addCalledNumber(number);
    current++;
}

function startGame() {
    displayPattern();
    let gameLoop = setInterval(() => {
        if (!paused && numberPool.length > 0) {
            tick();
        }
    }, intervalSeconds * 1000);
}

function playSfx() {
    const audio = new Audio("vine-boom.mp3");
    audio.play();
}

function addCalledNumber(number) {
    // if (!dev) playSfx();
    calledNumbers.push(number);
    const smallNumberElement = document.querySelector(`.small-${number}`);
    let numberElement = smallNumberElement.cloneNode(true);

    numberElement.classList.remove(
        "small-number",
        `.small-${number}`,
        "completed",
    );
    numberElement.classList.add("large-number", `.large-${number}`);
    calledNumbersElement.prepend(numberElement);
    // numberElement.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
        numberElement.classList.add("show");
    }, 1000);

    if (calledNumbersElement.children.length === 6) {
        calledNumbersElement.removeChild(calledNumbersElement.children[calledNumbersElement.children.length - 1]);
    }

    smallNumberElement.classList.add("completed");
}

function togglePause() {
    pauseButton.textContent = paused ? "Pause" : "Unpause";
    paused = !paused;
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

    const changeSpeed = controlsWindow.document.createElement("div");
    changeSpeed.innerHTML = `
        <!-- jank cover to prevent styling flash -->
        <style>
            .cover {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                background-color: white;
                z-index: 999;
                transition: opacity .8s;
                /* animation: fadeOut .8s forwards; */
            }
            @keyframes fadeOut {
                0% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                }
            }
        </style>
        <div class="cover"></div>

        <p>Select the winning pattern</p>
        <div class="choose-pattern"></div>
        <br><br>
        <label for="speed" class="popup-test">Choose speed in seconds between each number reveal</p>
        <input type="number" value="2" name="speed" class="speed-input"><br>
    `;
    controlPanel.append(changeSpeed);

    let speedInput = controlsWindow.document.querySelector(".speed-input");

    const cssLink = controlsWindow.document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "popup.css";

    cssLink.onload = () => {
        const loadingCover = controlsWindow.document.querySelector(".cover");
        if (loadingCover) loadingCover.style.opacity = 0;
    };

    controlsWindow.document.head.appendChild(cssLink);

    const selectPatternParent = controlsWindow.document.querySelector('.choose-pattern');
    for (let i = 0; i < 25; i++) {
        let newLabel = controlsWindow.document.createElement("label");
        newLabel.classList.add('pattern-label');
        newLabel.id = `pattern-label-${i}`;

        let newCheckbox = controlsWindow.document.createElement("input");
        newCheckbox.setAttribute('type', 'checkbox');
        newCheckbox.id = `pattern-checkbox-${i}`;
        newCheckbox.classList.add('pattern-checkbox');
        newCheckbox.checked = winningPattern[i];
        if (i % 5 === 0) {
            selectPatternParent.append(controlsWindow.document.createElement("br"));
        }
        newLabel.appendChild(newCheckbox);

        let newSpan = controlsWindow.document.createElement("span");
        newSpan.classList.add('pattern-square');
        newSpan.id = `pattern-square-${i}`;
        newLabel.appendChild(newSpan);

        selectPatternParent.appendChild(newLabel);
    }

    const startGameButton = controlsWindow.document.createElement("button");
    startGameButton.classList.add("action-btn");
    startGameButton.textContent = "Start the game";
    startGameButton.onclick = () => {
        startGameButton.disabled = true;
        speedInput.disabled = true;
        controlsWindow.document.querySelectorAll('.pattern-checkbox').forEach((input) => {
            input.disabled = true;
        });

        intervalSeconds = speedInput.value;
        winningPattern = getWinningPattern(selectPatternParent);
        startGame();
    };
    controlPanel.append(startGameButton);

    pauseButton = controlsWindow.document.createElement("button");
    pauseButton.classList.add("action-btn");
    pauseButton.textContent = "Pause";
    pauseButton.onclick = togglePause;
    controlPanel.append(pauseButton);

    const againButton = controlsWindow.document.createElement("button");
    againButton.classList.add("action-btn");
    againButton.textContent = "Play again";
    againButton.onclick = () => {
        reset();
        controlsWindow.close();
    };
    controlPanel.append(againButton);
}

function getWinningPattern(parent) {
    const patternInputs = parent.querySelectorAll('.pattern-checkbox');
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