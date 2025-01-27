const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const calledNumbers = [];
const bingo = "BINGO";
let intervalSeconds = 2;
let paused = false;

const allNumbersElement = document.querySelector(".all-numbers");
const calledNumbersElement = document.querySelector(".called-numbers");

// function mkBigNum(n) {
//     const elem = document.createElement("span");
//     elem.textContent = n.toString();
//     elem.classList.add("big-number");
//     return elem;
// }


// init game
numberPool.forEach((num, i) => {
   let newElement = document.createElement("div");
   newElement.classList.add("small-number", "number", `small-${num}`);
   newElement.innerHTML = `<p>${bingo[Math.floor(i / 15)]} <br> ${num}</p>`;
   allNumbersElement.append(newElement);
});

startGame();



// game logic
function tick() {
   const randomIndex = Math.floor(Math.random() * numberPool.length);
   const number = numberPool[randomIndex];
   let spliced = numberPool.splice(randomIndex, 1);
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