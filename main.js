const numberPool = Array(75).fill(null).map((_, i) => i + 1);
const bingo = "BINGO";

const allNumbers = document.querySelector(".all-numbers");
const calledNumbers = document.querySelector(".called-numbers");

function mkBigNum(n) {
    const elem = document.createElement("span");
    elem.textContent = n.toString();
    elem.classList.add("big-number");
    return elem;
}

numberPool.forEach((num, i) => {
   let newElement = document.createElement("div");
   newElement.classList.add("small-number");
   newElement.innerHTML = `<p>${bingo[Math.floor(i / 15)]} <br> ${num}</p>`;
   allNumbers.append(newElement);
});

function tick() {
   const rand = Math.floor(Math.random() * numberPool.length);
}