//=============================================
// Variables
//=============================================

const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const calledNumbers = [];
const bingo = "BINGO";

const allNumbersElement = document.querySelector(".all-numbers");
const calledNumbersElement = document.querySelector(".called-numbers");

let game, popup;
let soundEnabled = false;

let updateWinningPatternsLoop;
let updateProgressBarLoop;

let soundReady = false;
const soundNames = ["ding", "eagle", "vine-boom", "wilhelm"];
let soundEffect = soundNames[0];

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

        document.querySelector(".progress-bar").style.display = "none";
        document.querySelector(".winning-pattern-label").style.display = "none";
    }

    startGame() {
        this.#gameIsActive = true;
        if (this.#paused) this.togglePause();
        clearInterval(updateWinningPatternsLoop);
        clearInterval(updateProgressBarLoop);
        startDisplayPatternLoop();
        startUpdateProgressLoop(this.#intervalSeconds * 1000);
        this.reloadGameLoop();

        document.querySelector(".progress-bar").style.display = "block";
        document.querySelector(".winning-pattern-label").style.display = "block";
    }

    setIntervalSeconds(secs) {
        this.#intervalSeconds = secs;
    }

    reloadGameLoop() {
        let obj = this;
        if (this.#gameIsActive) {
            this.stop();
            this.#gameLoop = setInterval(obj.tick.bind(obj), obj.#intervalSeconds * 1000);
            if (!game.getPaused()) startUpdateProgressLoop(this.#intervalSeconds * 1000);
        }
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
        if (soundEnabled) {
            const audio = new Audio(`./audio/${soundEffect}.mp3`);
            audio.onloadeddata = () => audio.play();
            audio.load();
        }
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
        sfxCheckbox: null,
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
                input.disabled = config.gameActive;
            }
        }

        this.#window.document
            .querySelectorAll(".delete-button")
            .forEach((input) => {
                input.disabled = config.gameActive;
            });

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
        this.#addSoundEffectToggle();
        this.#addBanner();
        this.#addPatternSelection();
        for (let i = 0; i < winningPatterns.length; i++) {
            this.#addPatternCheckboxes(i);
        }
        this.#addCredits();
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

    #addSoundEffectToggle() {
        this.#addLineBreak();

        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.gap = "5px";
        div.style.alignItems = "center";
        this.#innerElements.container.append(div);

        const soundEffectCheckbox = this.#window.document.createElement("input");
        soundEffectCheckbox.type = "checkbox";
        soundEffectCheckbox.id = "sfx-checkbox";
        soundEffectCheckbox.checked = soundEnabled;
        soundEffectCheckbox.style.transform = "scale(1.3)";
        soundEffectCheckbox.style.accentColor = "#aaa";
        soundEffectCheckbox.style.cursor = "pointer";
        this.#innerElements.sfxCheckbox = soundEffectCheckbox;
        soundEffectCheckbox.addEventListener("change", () => {
            soundEnabled = soundEffectCheckbox.checked;
        });
        div.append(soundEffectCheckbox);

        const chooseSoundEffect = this.#window.document.createElement("label");
        chooseSoundEffect.textContent = "Toggle sound effect for new numbers";
        chooseSoundEffect.htmlFor = "sfx-checkbox";
        chooseSoundEffect.style.cursor = "pointer";
        div.append(chooseSoundEffect);
    }

    #addPatternSelection() {
        const selectPattern = this.#window.document.createElement("p");
        selectPattern.textContent = "Create the winning pattern";
        this.#innerElements.container.append(selectPattern);

        const patternPreset = this.#window.document.createElement("select");
        patternPreset.classList.add("pattern-select");
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
            this.#window.document.querySelector('.delete-button-0').disabled = false;
            const val = parseInt(patternPreset.value);
            if (val == -1) {
                winningPatterns.push(Array(25).fill(0));
                this.#addPatternCheckboxes(winningPatterns.length - 1);
                return;
            } else {
                for (let i = 0; i < winningPatternPresets[val].length; i++) {
                    winningPatterns.push(winningPatternPresets[val][i]);
                    this.#addPatternCheckboxes(winningPatterns.length - 1);
                }
            }
        }
        plusButton.setAttribute("title", "Add the selected pattern to the list");
        this.#innerElements.container.append(plusButton);
        this.#innerElements.plusButton = plusButton;

        const patternCheckboxContainer = this.#window.document.createElement("div");
        patternCheckboxContainer.classList.add("pattern-checkbox-container");
        this.#innerElements.container.append(patternCheckboxContainer);
        this.#innerElements.checkBoxContainer = patternCheckboxContainer;

        const patternCheckbox = document.createElement("div");
        patternCheckbox.classList.add("pattern-checkboxes", "pattern-checkboxes-0");
        patternCheckboxContainer.append(patternCheckbox);
    }

    #addPatternCheckboxes(frameNum) {
        if (!frameNum) frameNum = 0;

        let selectPatternParent = this.#window.document.querySelector(`.pattern-checkboxes-${frameNum}`);
        if (!selectPatternParent) {
            selectPatternParent = document.createElement("div");
            selectPatternParent.classList.add("pattern-checkboxes", `pattern-checkboxes-${frameNum}`);
            this.#innerElements.checkBoxContainer.append(selectPatternParent);
        }

        const deleteButton = this.#window.document.createElement("button");
        deleteButton.innerHTML = "&times;";
        deleteButton.classList.add("delete-button", `delete-button-${frameNum}`);
        deleteButton.disabled = winningPatterns.length <= 1;
        deleteButton.onclick = () => {
            winningPatterns.splice(frameNum, 1);

            if (frameNum === this.#innerElements.checkBoxContainer.children.length - 1) {
                selectPatternParent.remove();
                if (winningPatterns.length === 1) this.#window.document.querySelector('.delete-button-0').disabled = true;
                return;
            }

            this.#window.document.querySelectorAll('.pattern-checkboxes').forEach((el) => el.remove());

            for (let i = 0; i < winningPatterns.length; i++) {
                this.#addPatternCheckboxes(i);
            }
        };
        selectPatternParent.append(deleteButton);

        for (let i = 0; i < 25; i++) {
            let newLabel = this.#window.document.createElement("label");
            newLabel.classList.add("pattern-label", `pattern-label-${frameNum}`);
            newLabel.id = `pattern-label-${frameNum}-${i}`;

            let newCheckbox = this.#window.document.createElement("input");
            newCheckbox.setAttribute("type", "checkbox");
            newCheckbox.id = `pattern-checkbox-${frameNum}-${i}`;
            newCheckbox.classList.add("pattern-checkbox", `pattern-checkbox-${frameNum}`);
            newCheckbox.checked = winningPatterns[frameNum][i];
            newCheckbox.addEventListener('change', () => {
                this.getWinningPatterns();
            });
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
        speedLabel.min = 5;
        speedLabel.max = 30;
        speedLabel.step = 1;
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
        startGameButton.textContent = "Start Game";

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

            this.#window.document
                .querySelectorAll(".delete-button")
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
        againButton.textContent = "New Game";
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

            this.#window.document
                .querySelectorAll(".delete-button")
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

    #addCredits() {
        this.#addLineBreak();
        this.#addLineBreak();
        const credits = this.#window.document.createElement("p");
        credits.innerHTML = "Created by: <a href='https://github.com/devsai9' target='_blank'>Sai Siddhish Chandra Sekaran</a>, <a href='https://hnasheralneam.dev/' target='_blank'>Hamza Nasher-Alneam</a>, and <a href='https://github.com/grekand46' target='_blank'>Kai Luo</a>"
        this.#innerElements.container.append(credits);
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
popup = new ControlsWindow(500, 570);
game.init();