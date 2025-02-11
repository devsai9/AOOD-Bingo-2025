//=============================================
// Variables
//=============================================

const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const calledNumbers = [];
const bingo = "BINGO";

const allNumbersElement = document.querySelector(".all-numbers");
const calledNumbersElement = document.querySelector(".called-numbers");

let game, popup;

let soundReady = false;
const soundNames = ["ding", "vine-boom", "wilhelm"];
let soundEffect = soundNames[0];

const patternDiv = document.querySelector(".pattern");
let winningPattern = [[
    1, 0, 1, 0, 0, 
    0, 1, 1, 0, 0, 
    0, 0, 1, 0, 0, 
    0, 0, 1, 1, 0, 
    0, 0, 1, 0, 1,
]];

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
                popup.create(600, 500);
                popup.applyConfig({
                    pattern: winningPattern[0],
                    intervalSeconds: this.#intervalSeconds,
                    gameActive: this.#gameIsActive,
                    paused: this.#paused
                });
            });
        }

        allNumbersElement.textContent = "";
        calledNumbersElement.textContent = "";
        patternDiv.textContent = "";

        clearInterval(this.#gameLoop);
        shuffle(numberPool);
        this.#current = 0;
        generateNumberElements();

        // this.attachEventListenerToPopup(popup);
    }

    attachEventListenerToPopup(popup) {
        popup.getWindow().addEventListener("beforeunload", () => {
            const openButton = document.createElement("button");
            openButton.textContent = "Open Controls Window";
            openButton.onclick = () => {
                document.body.querySelector('.openPopupBtn').remove();
                if (popup.getOpen()) popup.close();
                popup.create();
                popup.applyConfig({
                    pattern: winningPattern[0],
                    intervalSeconds: this.#intervalSeconds,
                    gameActive: this.#gameIsActive,
                    paused: this.#paused
                });
                this.attachEventListenerToPopup(popup);
            }
            openButton.classList.add("openPopupBtn");
            document.body.append(openButton);
        });
    }

    startGame() {
        this.#gameIsActive = true;
        if (this.#paused) this.togglePause();
        displayPattern();
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
    }

    stop() {
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
        banner: null
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
        const patternInputs = this.#innerElements.checkBoxContainer.querySelectorAll(".pattern-checkbox");
        patternInputs.forEach((input) => {
            input.checked = config.pattern[0][parseInt(input.id.split("-")[2])];
            if (config.gameActive) input.disabled = true;
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
        this.#addPatternSelection();
        this.#addPatternCheckboxes();
        this.#addLineBreak();
        this.#addLineBreak();
        this.#addSpeedControls();
        this.#addButtons();
        this.#addBanner();
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

        this.#innerElements.checkBoxContainer = this.#window.document.createElement("div");
        this.#innerElements.checkBoxContainer.classList.add("choose-pattern");
        this.#innerElements.container.append(this.#innerElements.checkBoxContainer);
    }

    #addPatternCheckboxes() {
        const selectPatternParent = this.#window.document.querySelector(".choose-pattern");
        this.#innerElements.checkBoxContainer = selectPatternParent;
        for (let i = 0; i < 25; i++) {
            let newLabel = this.#window.document.createElement("label");
            newLabel.classList.add("pattern-label");
            newLabel.id = `pattern-label-${i}`;

            let newCheckbox = this.#window.document.createElement("input");
            newCheckbox.setAttribute("type", "checkbox");
            newCheckbox.id = `pattern-checkbox-${i}`;
            newCheckbox.classList.add("pattern-checkbox");
            newCheckbox.checked = winningPattern[0][i];
            if (i % 5 === 0) {
                selectPatternParent.append(this.#window.document.createElement("br"));
            }
            newLabel.appendChild(newCheckbox);

            let newSpan = this.#window.document.createElement("span");
            newSpan.classList.add("pattern-square");
            newSpan.id = `pattern-square-${i}`;
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

            // gets ui stuff
            this.#window.document
                .querySelectorAll(".pattern-checkbox")
                .forEach((input) => {
                    input.disabled = true;
                });

            // GAME LOGIC
            game.setIntervalSeconds(parseFloat(this.#innerElements.speedSliderLabel.value));
            winningPattern[0] = getWinningPattern(this.#innerElements.checkBoxContainer);
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

function displayPattern() {
    for (let i = 0; i < 25; i++) {
        patternDiv.innerHTML += `<div class="pattern-square ${winningPattern[0][i] ? "square-b" : "square-w"}"></div>`;
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
        }</span> <br> <span class="little-number">${num}</span></div>`;
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

    if (calledNumbersElement.children.length === 6) {
        calledNumbersElement.removeChild(calledNumbersElement.children[calledNumbersElement.children.length - 1]);
    }

    smallNumberElement.classList.add("completed");
}

function getWinningPattern(parent) {
    const patternInputs = parent.querySelectorAll(".pattern-checkbox");
    const pattern = [];
    patternInputs.forEach((input) => {
        pattern.push(input.checked ? 1 : 0);
    });
    return pattern;
}


//=============================================
// All code should be run from here
//=============================================

game = new GameObject();
popup = new ControlsWindow(600, 500);
popup.create();
game.init();
