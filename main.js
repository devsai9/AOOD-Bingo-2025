//=============================================
// Variables
//=============================================

const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const calledNumbers = [];
const bingo = "BINGO";

const allNumbersElement = document.querySelector(".all-numbers");
const calledNumbersElement = document.querySelector(".called-numbers");

let game, popup;

let updateWinningPatternsLoop;
let updateProgressBarLoop;

let soundReady = false;
const soundNames = ["ding", "eagle", "vine-boom", "wilhelm"];
let soundEffect = soundNames[1];

const patternDiv = document.querySelector(".pattern");
let winningPatterns = [
    [
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
        1, 1, 1, 1, 1,
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
    ],
    [
        1, 0, 0, 0, 1,
        0, 1, 0, 1, 0,
        0, 0, 1, 0, 0,
        0, 1, 0, 1, 0,
        1, 0, 0, 0, 1,
    ]
];

let winningPatternPresets = [
    [
        // 5 in a line
        [
            0, 0, 1, 0, 0,
            0, 0, 1, 0, 0,
            1, 1, 1, 1, 1,
            0, 0, 1, 0, 0,
            0, 0, 1, 0, 0,
        ],
        [
            1, 0, 0, 0, 1,
            0, 1, 0, 1, 0,
            0, 0, 1, 0, 0,
            0, 1, 0, 1, 0,
            1, 0, 0, 0, 1,
        ]
    ],
    [
        // Four corners
        [
            1, 0, 0, 0, 1,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            0, 0, 0, 0, 0,
            1, 0, 0, 0, 1,
        ]
    ],
    [
        // Blackout
        [
            1, 1, 1, 1, 1,
            1, 1, 1, 1, 1,
            1, 1, 1, 1, 1,
            1, 1, 1, 1, 1,
            1, 1, 1, 1, 1,
        ]
    ],
    [
        // X
        [
            1, 0, 0, 0, 1,
            0, 1, 0, 1, 0,
            0, 0, 1, 0, 0,
            0, 1, 0, 1, 0,
            1, 0, 0, 0, 1,
        ]
    ],
    [
        // Around the World (Square)
        [
            1, 1, 1, 1, 1,
            1, 0, 0, 0, 1,
            1, 0, 0, 0, 1,
            1, 0, 0, 0, 1,
            1, 1, 1, 1, 1,
        ]
    ],
    [
        // Letter "I"
        [
            1, 1, 1, 1, 1,
            0, 0, 1, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 1, 0, 0,
            1, 1, 1, 1, 1,
        ]
    ],
];

//=============================================
// Classes
//=============================================

class GameObject {
    #current = 0;
    #gameLoop;
    #intervalSeconds = 6;
    #paused = true;
    #gameIsActive = false;
    #initOnce = false;
    #controlWindowButton = null;

    init() {
        if (!this.#initOnce) {
            this.#controlWindowButton = document.querySelector('.openPopupBtn');
            this.#controlWindowButton.addEventListener('click', () => {
                popup.close();
                popup.create(650, 500);
                popup.applyConfig({
                    pattern: winningPatterns,
                    intervalSeconds: this.#intervalSeconds,
                    gameActive: this.#gameIsActive,
                    paused: this.#paused
                });
                popup.getWindow().focus();
                popup.getWindow().addEventListener("beforeunload", () => {
                    this.#controlWindowButton.style.display = "block";
                });
                this.#controlWindowButton.style.display = "none";
            });
        }

        allNumbersElement.textContent = "";
        calledNumbersElement.textContent = "";
        patternDiv.textContent = "";

        clearInterval(this.#gameLoop);
        clearInterval(updateWinningPatternsLoop);
        clearInterval(updateProgressBarLoop);
        setProgressBarEmpty();

        shuffle(numberPool);
        this.#current = 0;
        generateNumberElements();
        this.#initOnce = true;
    }

    startGame() {
        this.#gameIsActive = true;
        if (this.#paused) this.togglePause();
        clearInterval(updateWinningPatternsLoop);
        clearInterval(updateProgressBarLoop);
        startDisplayPatternLoop();
        startUpdateProgressLoop(this.#intervalSeconds * 1000);
        this.reloadGameLoop();
    }

    setIntervalSeconds(secs) { 
        this.#intervalSeconds = secs;
    }

    reloadGameLoop() {
        let obj = this;
        if (this.#gameIsActive) {
            this.stop();
            this.#gameLoop = setInterval(obj.tick.bind(obj), obj.#intervalSeconds * 1000);
        }
        startUpdateProgressLoop(this.#intervalSeconds * 1000);
    }

    stop() {
        setProgressBarEmpty();
        clearInterval(this.#gameLoop);
    }

    isGameActive() {
        return this.#gameIsActive;
    }

    playAgain() {
        this.init();
        this.#gameIsActive = false;
    }

    tick() {
        if (this.#paused) return;
        // Game over
        if (this.#current >= numberPool.length) {
            this.togglePause();
            return;
        }
        const number = numberPool[this.#current];

        const clsList = document.querySelector(`.small-${number}`).classList;
        clsList.remove("c-b");
        clsList.add("c-r");
        addCalledNumber(number);
        this.playSound();
        this.#current++;
        startUpdateProgressLoop(this.#intervalSeconds * 1000);
    }
 
    togglePause() {
        popup.getPauseButton().textContent = this.#paused ? "Pause" : "Unpause";
        this.#paused = !this.#paused;
        if (this.#paused) this.stop();
        else this.reloadGameLoop();
    }

    getPaused() {
        return this.#paused;
    }

    playSound() {
        const audio = new Audio(`./audio/${soundEffect}.mp3`);
        audio.onloadeddata = () => audio.play();
        audio.load();
    }
}

// POPUP
class ControlsWindow {
    #config = {
        width: null,
        height: null,
        left: null,
        top: null,
        open: false
    }

    #window;

    #innerElements = {
        container: null,
        cssCover: null,
        checkBoxContainer: null,
        speedSlider: null,
        speedSliderLabel: null,
        banner: null,
        presetDropdown: null,
        plusButton: null
    }

    #buttons = {
        container: null,
        start: null,
        pause: null,
        again: null
    }

    constructor(width, height) {
        this.#config.width = width;
        this.#config.height = height;
        this.#config.left = (screen.width / 2) - (width / 2);
        this.#config.top = (screen.height / 2) - (height / 2);
        
        this.#window = null;
    }

    create() {
        this.#window = window.open("", "",
            "width=" + this.#config.width + ",height=" + this.#config.height + ",left=" + this.#config.left + ",top=" + this.#config.top,
        );

        if (this.#window == null) alert("This site uses a pop-up window. Allow pop-ups and reload the page.");
        else {
            this.#addElements();
            this.#config.open = true;
        }

        window.addEventListener("beforeunload", () => {
            popup.close();
        });
    }

    applyConfig(config) {
        this.#innerElements.presetDropdown.disabled = config.gameActive;
        this.#innerElements.plusButton.disabled = config.gameActive;

        for (let i = 0; i < config.pattern.length; i++) {
            for (let j = 0; j < 25; j++) {
                const input = this.#window.document.getElementById(`pattern-checkbox-${i}-${j}`);
                input.checked = config.pattern[i][j];
                if (config.gameActive) input.disabled = true;
            }
        }
        
        this.#innerElements.speedSlider.value = config.intervalSeconds;
        this.#innerElements.speedSliderLabel.value = config.intervalSeconds;

        this.#buttons.start.disabled = config.gameActive;
        this.#buttons.pause.disabled = !config.gameActive;
        this.#buttons.pause.textContent = config.paused ? "Unpause" : "Pause";
        this.#buttons.again.disabled = !config.gameActive;
    }

    getWindow() {
        return this.#window;
    }

    close() {
        if (this.#window && !this.#window.closed) {
            this.#window.close();
        }
    }

    // Helper Methods
    #addElements() {
        this.#addContainer();
        this.#addCSSWaitCover();
        this.#addLineBreak();
        this.#addSpeedControls();
        this.#addButtons();
        this.#addBanner();
        this.#addPatternSelection();
        for (let i = 0; i < winningPatterns.length; i++) {
            this.#addPatternCheckboxes(i);
        }
        this.#addCSS();
    }

    #addLineBreak() {
        this.#innerElements.container.append(this.#window.document.createElement("br"));
    }

    #addContainer() {
        this.#window.document.write("<h1>Bingo Controls</h1>");
        this.#innerElements.container = document.createElement("div");
        this.#innerElements.container.classList.add("control-panel");
        this.#window.document.body.append(this.#innerElements.container);
    }

    #addCSSWaitCover() {
        this.#innerElements.cssCover = this.#window.document.createElement("div");
        this.#innerElements.cssCover.classList.add("cover");
        this.#innerElements.container.append(this.#innerElements.cssCover);
    }

    #addPatternSelection() {
        const selectPattern = this.#window.document.createElement("p");
        selectPattern.textContent = "Select the winning pattern";
        this.#innerElements.container.append(selectPattern);

        const patternPreset = this.#window.document.createElement("select");
        patternPreset.classList.add("pattern-select");
        patternPreset.setAttribute("theme", "dark");
        patternPreset.innerHTML = `
        <option value="-1">Blank</option>
        <option value="0">Regular (5 in a line)</option>
        <option value="1">Four Corners</option>
        <option value="2">Blackout</option>
        <option value="3">Letter "X"</option>
        <option value="4">Around the World (Square)</option>
        <option value="5">Letter "I"</option>
        `;
        patternPreset.value = "0";
        this.#innerElements.presetDropdown = patternPreset;
        this.#innerElements.container.append(patternPreset);

        const plusButton = this.#window.document.createElement("button");
        plusButton.textContent = "+";
        plusButton.classList.add("plus-button");
        plusButton.onclick = () => {
            winningPatterns.push(parseInt(patternPreset.value) == -1 ? Array(25).fill(0) : winningPatternPresets[parseInt(patternPreset.value)][0]);
            this.#addPatternCheckboxes(winningPatterns.length - 1);
        }
        this.#innerElements.container.append(plusButton);
        this.#innerElements.plusButton = plusButton;

        const patternCheckboxContainer = this.#window.document.createElement("div");
        patternCheckboxContainer.classList.add("pattern-checkbox-container");
        this.#innerElements.container.append(patternCheckboxContainer);
        this.#innerElements.checkBoxContainer = patternCheckboxContainer;

        const patternCheckbox = document.createElement("div");
        patternCheckbox.classList.add("patternCheckboxes", "patternCheckboxes-0");
        patternCheckboxContainer.append(patternCheckbox);
    }

    #addPatternCheckboxes(frameNum) {
        if (!frameNum) frameNum = 0;

        let selectPatternParent = this.#window.document.querySelector(`.patternCheckboxes-${frameNum}`);
        if (!selectPatternParent) {
            selectPatternParent = document.createElement("div");
            selectPatternParent.classList.add("patternCheckboxes", `patternCheckboxes-${frameNum}`);
            this.#innerElements.checkBoxContainer.append(selectPatternParent);
        }
        
        for (let i = 0; i < 25; i++) {
            let newLabel = this.#window.document.createElement("label");
            newLabel.classList.add("pattern-label", `pattern-label-${frameNum}`);
            newLabel.id = `pattern-label-${frameNum}-${i}`;

            let newCheckbox = this.#window.document.createElement("input");
            newCheckbox.setAttribute("type", "checkbox");
            newCheckbox.id = `pattern-checkbox-${frameNum}-${i}`;
            newCheckbox.classList.add("pattern-checkbox", `pattern-checkbox-${frameNum}`);
            newCheckbox.checked = winningPatterns[frameNum][i];
            if (i % 5 === 0) {
                selectPatternParent.append(this.#window.document.createElement("br"));
            }
            newLabel.appendChild(newCheckbox);

            let newSpan = this.#window.document.createElement("span");
            newSpan.classList.add("pattern-square", `pattern-square-${frameNum}`);
            newSpan.id = `pattern-square-${frameNum}-${i}`;
            newLabel.appendChild(newSpan);

            selectPatternParent.appendChild(newLabel);
        }
    }

    #addSpeedControls() {
        const speedLabel2 = this.#window.document.createElement("label");
        speedLabel2.textContent = "Choose speed in seconds between each number reveal";
        speedLabel2.classList.add("popup-test");
        speedLabel2.htmlFor = "speed";
        this.#innerElements.container.append(speedLabel2);

        this.#addLineBreak();

        const speedInput = this.#window.document.createElement("input");
        const speedLabel = this.#window.document.createElement("input");

        speedInput.type = "range";
        speedInput.value = 6;
        speedInput.min = 5;
        speedInput.max = 30;
        speedInput.step = 1;
        speedInput.name = "speed";
        speedInput.classList.add("speed-input");
        this.#innerElements.speedSliderLabel = speedLabel;
        this.#innerElements.container.append(speedInput);

        speedLabel.type = "number";
        speedLabel.value = 6;
        speedLabel.min = 0.1;
        speedLabel.max = 30;
        speedLabel.step = 0.1;
        speedLabel.classList.add("speed-label");
        this.#innerElements.speedSlider = speedInput;
        this.#innerElements.container.append(speedLabel);

        speedInput.addEventListener("input", () => {
            speedLabel.value = speedInput.value;
        });
    
        speedInput.addEventListener("change", () => {
            game.setIntervalSeconds(parseFloat(speedInput.value));
            game.reloadGameLoop();
        });
    
        speedLabel.addEventListener("change", () => {
            if (speedLabel.value < 0.1) speedLabel.value = 0.1;
            if (speedLabel.value > 30) speedLabel.value = 30;
            speedInput.value = speedLabel.value;
    
            game.setIntervalSeconds(parseFloat(speedLabel.value));
            game.reloadGameLoop();
        });
    }

    #addButtons() {
        const buttons = this.#window.document.createElement("div");
        buttons.classList.add("buttons");
        this.#buttons.container = buttons;
        this.#innerElements.container.append(buttons);

        this.#addStartGameButton();
        this.#addPauseButton();
        this.#addAgainButton();
    }

    #addStartGameButton() {
        const startGameButton = this.#window.document.createElement("button");
        startGameButton.classList.add("action-btn");
        startGameButton.textContent = "Start the game";

        startGameButton.onclick = () => {
            // sets ui stuff
            this.#buttons.start.disabled = true;
            this.#buttons.pause.disabled = false;
            this.#buttons.again.disabled = false;
            this.#innerElements.presetDropdown.disabled = true;
            this.#innerElements.plusButton.disabled = true;

            // gets ui stuff
            this.#window.document
                .querySelectorAll(".pattern-checkbox")
                .forEach((input) => {
                    input.disabled = true;
                });

            // GAME LOGIC
            game.setIntervalSeconds(parseFloat(this.#innerElements.speedSliderLabel.value));
            // winningPatterns[0] = popup.getWinningPatterns();
            game.startGame();
        };

        this.#buttons.container.append(startGameButton);
        this.#buttons.start = startGameButton;
    }

    #addPauseButton() {
        const pauseButton = this.#window.document.createElement("button");
        pauseButton.classList.add("action-btn");
        pauseButton.textContent = "Unpause";
        pauseButton.disabled = true;

        pauseButton.onclick = () => {
            game.togglePause();
        };

        this.#buttons.container.append(pauseButton);
        this.#buttons.pause = pauseButton;
    }

    #addAgainButton() {
        const againButton = this.#window.document.createElement("button");
        againButton.classList.add("action-btn");
        againButton.textContent = "Play again";
        againButton.disabled = true;

        againButton.onclick = () => {
            this.#buttons.start.disabled = false;
            this.#buttons.pause.disabled = true;
            this.#buttons.again.disabled = true;
            this.#innerElements.speedSlider.disabled = false;
            this.#innerElements.speedSliderLabel.disabled = false;
            this.#innerElements.presetDropdown.disabled = false;
            this.#innerElements.plusButton.disabled = false;

            this.#window.document
                .querySelectorAll(".pattern-checkbox")
                .forEach((input) => {
                    input.disabled = false;
                });

            this.#innerElements.banner.classList.add("show");
            setTimeout(() => {
                this.#innerElements.banner.classList.remove("show");
            }, 2500);

            game.playAgain();
        };

        this.#buttons.container.append(againButton);
        this.#buttons.again = againButton;
    }

    #addBanner() {
        const banner = this.#window.document.createElement("div");
        banner.classList.add("banner");
        banner.innerHTML = "<p>Game has been reset</p>";
        this.#innerElements.banner = banner;
        this.#innerElements.container.append(banner);
    }

    #addCSS() {
        const cssLink = this.#window.document.createElement("link");
        cssLink.rel = "stylesheet";
        cssLink.href = "popup.css";

        cssLink.onload = () => {
            const loadingCover = this.#window.document.querySelector(".cover");
            if (loadingCover) loadingCover.style.opacity = 0;
        };

        this.#window.document.head.appendChild(cssLink);
    }

    getPauseButton() {
        return this.#buttons.pause;
    }

    getOpen() {
        return this.#config.open;
    }

    getWinningPatterns() {
        const frames = [];
    
        for (let i = 0; i < winningPatterns.length; i++) {
            frames.push([]);
            const checkboxes = this.#window.document.querySelectorAll(`.pattern-checkbox-${i}`);
            checkboxes.forEach((checkbox) => {
                frames[i].push(checkbox.checked ? 1 : 0);
            });
        }
    
        winningPatterns = frames;
        return frames;
    }
}

//=============================================
// Hell
//=============================================

function shuffle(arr) {
    for (let i = arr.length; i > 0; i--) {
        let j = Math.floor(Math.random() * i);
        i--;
        [ arr[i], arr[j] ] = [ arr[j], arr[i] ];
        i++;
    }
}

function startUpdateProgressLoop(intervalMs) {
    setProgressBarEmpty();
    let endTime = Date.now() + intervalMs;
    updateWinningPatternsLoop = setInterval(() => {
        let timeLeft = endTime - Date.now();
        let percent = (timeLeft / intervalMs) * 100;
        updateProgresBar(100 - Math.round(percent));
    }, 50);
}

function setProgressBarEmpty() {
    clearInterval(updateWinningPatternsLoop);
    const progressBar = document.querySelector(".progress-bar-progress");
    const progressLabel = document.querySelector(".progress-bar-label");
    progressBar.style.width = "0%";
    progressLabel.textContent = "0%";
}

function updateProgresBar(percent) {
    const progressBar = document.querySelector(".progress-bar-progress");
    const progressLabel = document.querySelector(".progress-bar-label");
    progressBar.style.width = percent + "%";
    progressLabel.textContent = percent + "%";
}

function startDisplayPatternLoop() {
    let patternIndex = 0;
    displayPattern(patternIndex);
    updateProgressBarLoop = setInterval(() => {
        patternIndex++
        if (patternIndex >= winningPatterns.length) patternIndex = 0;
        patternDiv.textContent = "";
        displayPattern(patternIndex);
    }, 3000);
}

function displayPattern(patternIndex) {
    let winningPattern = popup.getWinningPatterns()[patternIndex];
    for (let i = 0; i < 25; i++) {
        patternDiv.innerHTML += `<div class="pattern-square ${winningPattern[i] ? "square-b" : "square-w"}"></div>`;
    }
}

function generateNumberElements() {
    for (let num = 1; num <= 75; num++) {
        const i = num - 1;
        let newElement = document.createElement("div");
        newElement.classList.add(
            "small-number",
            "c-b",
            "number",
            `small-${num}`
        );
        newElement.innerHTML = `<div><span class="letter">${
            bingo[Math.floor(i / 15)]
        }</span><div class="spacer"></div><span class="little-number">${num}</span></div>`;
        allNumbersElement.append(newElement);
    }
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

    if (calledNumbersElement.children.length === 10) {
        calledNumbersElement.removeChild(calledNumbersElement.children[calledNumbersElement.children.length - 1]);
    }

    smallNumberElement.classList.add("completed");
}


//=============================================
// All code should be run from here
//=============================================

game = new GameObject();
popup = new ControlsWindow(500, 550);
game.init();
