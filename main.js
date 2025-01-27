const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const calledNumbers = [];
const bingo = "BINGO";
let intervalSeconds = 2;
let paused = false;

const allNumbersElement = document.querySelector(".all-numbers");
const calledNumbersElement = document.querySelector(".called-numbers");
let pauseButton;

// init game
numberPool.forEach((num, i) => {
   let newElement = document.createElement("div");
   newElement.classList.add("small-number", "number", `small-${num}`);
   newElement.innerHTML = `<p>${bingo[Math.floor(i / 15)]} <br> ${num}</p>`;
   allNumbersElement.append(newElement);
});

createControlsWindow(300, 200);


// game logic
function tick() {
   const randomIndex = Math.floor(Math.random() * numberPool.length);
   const number = numberPool[randomIndex];
   numberPool.splice(randomIndex, 1);
   document.querySelector(`.small-${number}`).classList.add("completed");
   addCalledNumber(number);
}

function startGame() {
   let gameLoop = setInterval(() => {
      if (!paused && numberPool.length > 0) {
         tick();
      }
   }, intervalSeconds * 1000);
}

function addCalledNumber(number) {
   calledNumbers.push(number);
   let numberElement = document.querySelector(`.small-${number}`).cloneNode(true);
   numberElement.classList.remove("small-number", `.small-${number}`, "completed");
   numberElement.classList.add("large-number", `.large-${number}`);
   calledNumbersElement.append(numberElement);
}

function togglePause() {
   pauseButton.textContent = paused ? "Pause" : "Unpause";
   paused = !paused;
}


// helper functions
function createControlsWindow(width, height) {
   let left = (screen.width / 2) - (width / 2);
   let top = (screen.height / 2) - (height / 2);
 
   const controlsWindow = window.open("", "", "width=" + width + ",height=" + height + ",left=" + left + ",top=" + top);
 
   controlsWindow.document.write("<h1>Bingo Controls</h1>");

   const startGameButton = controlsWindow.document.createElement("button");
   startGameButton.textContent = "Start the game";
   startGameButton.onclick = startGame;
   controlsWindow.document.body.append(startGameButton);

   pauseButton = controlsWindow.document.createElement("button");
   pauseButton.textContent = "Pause";
   pauseButton.onclick = togglePause;
   controlsWindow.document.body.append(pauseButton);
}