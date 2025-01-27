let dev = false;

const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const calledNumbers = [];
const bingo = "BINGO";
let intervalSeconds = 1;
let paused = false;

const allNumbersElement = document.querySelector(".all-numbers");
const calledNumbersElement = document.querySelector(".called-numbers");
let pauseButton;

const colorMask = [
    1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1,
    1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0,
    1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1,
    1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1,
];

// Winning Pattern
const patternDiv = document.querySelector('.pattern');
let winningPattern = [
    1, 0, 1, 0, 0,
    0, 1, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 1, 0,
    0, 0, 1, 0, 1,
]

function displayPattern(pattern) {
    if (!pattern) pattern = winningPattern;
    for (let i = 0; i < 25; i++) {
        patternDiv.innerHTML += `<div class="pattern-square ${pattern[i] ? 'square-b' : 'square-w'}"></div>`;
    }
}

// init game
numberPool.forEach((num, i) => {
    let newElement = document.createElement("div");
    newElement.classList.add(
        "small-number",
        "c-w",
        "number",
        `small-${num}`,
    );
    newElement.innerHTML = `<p>${bingo[Math.floor(i / 15)]} <br> ${num}</p>`;
    allNumbersElement.append(newElement);
});

if (!dev) createControlsWindow(window, 600, 400);
if (dev) startGame();

// game logic
function tick() {
    const randomIndex = Math.floor(Math.random() * numberPool.length);
    const number = numberPool[randomIndex];
    numberPool.splice(randomIndex, 1);
    const clsList = document.querySelector(`.small-${number}`).classList;
    clsList.remove("c-w");
    clsList.add(colorMask[number - 1] ? "c-b" : "c-r");
    addCalledNumber(number);
}

function startGame(pattern) {
    displayPattern(pattern);
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
    let numberElement = document.querySelector(`.small-${number}`).cloneNode(
        true,
    );
    numberElement.classList.remove(
        "small-number",
        `.small-${number}`,
        "completed",
    );
    numberElement.classList.add("large-number", `.large-${number}`);
    calledNumbersElement.append(numberElement);
    numberElement.scrollIntoView();
    if (calledNumbersElement.children.length === 6) {
        console.log("child 'removed'")
        calledNumbersElement.removeChild(calledNumbersElement.children[0]);
    }
}

function togglePause() {
    pauseButton.textContent = paused ? "Pause" : "Unpause";
    paused = !paused;
}

// helper functions
function createControlsWindow(parentWindow, width, height) {
    let left = (screen.width / 2) - (width / 2);
    let top = (screen.height / 2) - (height / 2);

    const controlsWindow = window.open(
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
    controlsWindow.document.write("<link rel='stylesheet' href='popup.css'>");

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
                background-color: white;
                z-index: 999;
                animation-delay: 2s;
                animation: fadeOut .5s forwards;
            }
            @keyframes fadeOut {
                0% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                }
            }
        </style>
        <div class="cover"></div>

        <p>Select the winning pattern</p>
        <div class="choose-pattern">
        <br><br>
        <label for="speed" class="popup-test">Choose speed in seconds between each number reveal</p>
        <input type="text" value="2" name="speed" class="speed-input"><br>
    `;
    controlsWindow.document.body.append(changeSpeed);

    const selectPatternParent = controlsWindow.document.querySelector('.choose-pattern');
    for (let i = 0; i < 25; i++) {
        let newElement = controlsWindow.document.createElement("input");
        newElement.setAttribute('type', 'checkbox');
        newElement.setAttribute('id', `pattern-${i}`);
        newElement.setAttribute('class', 'pattern-input');
        newElement.checked = winningPattern[i];
        if (i % 5 === 0) {
            selectPatternParent.append(controlsWindow.document.createElement("br"));
        }
        selectPatternParent.append(newElement);
    }
    controlsWindow.document.body.append(selectPatternParent);

    const startGameButton = controlsWindow.document.createElement("button");
    startGameButton.textContent = "Start the game";
    startGameButton.onclick = () => {
        intervalSeconds = controlsWindow.document.querySelector(".speed-input").value;
        winningPattern = getWinningPattern(selectPatternParent);
        startGame(/* pattern array here */);
    };
    controlsWindow.document.body.append(startGameButton);

    pauseButton = controlsWindow.document.createElement("button");
    pauseButton.textContent = "Pause";
    pauseButton.onclick = togglePause;
    controlsWindow.document.body.append(pauseButton);

    const againButton = controlsWindow.document.createElement("button");
    againButton.textContent = "Play again";
    againButton.onclick = () => {
        alert("Hi");
        parentWindow.location.reload();
    };
    controlsWindow.document.body.append(againButton);
}

function getWinningPattern(parent) {
    const patternInputs = parent.querySelectorAll('.pattern-input');
    const pattern = [];
    patternInputs.forEach((input) => {
        pattern.push(input.checked ? 1 : 0);
    });
    return pattern;
}

