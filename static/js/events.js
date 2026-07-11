import { state } from "./state.js";

import {
    hit,
    stand,
    double,
    split
} from "./actions.js";

import {
    startGame
} from "./game.js";

import {
    updateUI,
    clearIlluminatedButtons,
    displayResult,
    reset
} from "./ui.js";

import {
    updateActionHints
} from "./hints.js";


// to add the chip's value to the current bet
// chip clicks only count during betting 
document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
        if (state.gameState !== "betting") return;
        let chipValue = parseInt(chip.dataset.value);
        if (state.balance >= chipValue) {
            state.balance -= chipValue;
            state.bet += chipValue;
            document.querySelector(".bet").textContent = `Bet:\n$${state.bet}`;
            document.querySelector(".balance").textContent = `Balance:\n$${state.balance}`;
        } else {
            console.log("Not enough balance");
        }
    });
});

// undo button refunds the current bet back to balance, only while still betting
document.querySelector(".undo").addEventListener("click", () => {
    if (state.bet > 0 && state.gameState === "betting") {
        state.balance += state.bet;

        state.bet = 0;

        document.querySelector(".bet").textContent = `Bet:\n$${state.bet}`;
        document.querySelector(".balance").textContent = `Balance:\n$${state.balance}`;
    }
});

// deal button kicks off the round, as long as there's an actual bet on the table
document.querySelector(".deal").addEventListener("click", () => {
    if (state.bet <= 0) {
        console.log("Invalid bet");
        return;
    }

    state.gameState = "playing";
    startGame();
    updateUI();
    updateActionHints();
});

// toggles the basic strategy hints feature on/off 
const hintToggle = document.getElementById("hintToggle");
hintToggle.addEventListener("click", () => {
    state.hintsEnabled = !state.hintsEnabled;

    if (state.hintsEnabled) {
        hintToggle.classList.add("active");
        hintToggle.innerText = "Hints: ON";
        if (state.gameState === "playing") updateActionHints();
    } else {
        hintToggle.classList.remove("active");
        hintToggle.innerText = "Hints: OFF";
        clearIlluminatedButtons();
    }
});

document.querySelector(".hit").addEventListener("click", hit);
document.querySelector(".stand").addEventListener("click", stand);
document.querySelector(".double").addEventListener("click", double);
document.querySelector(".split").addEventListener("click", split);

// catch all click listener that drives the "click anywhere to continue" flow
// between hands/rounds (excluding actual button/input clicks, which have their own handlers)
document.addEventListener("click", (event) => {
    // safeguard
    if (event.target.tagName.toLowerCase() === 'button' || event.target.tagName.toLowerCase() === 'input') return;

    if (state.isDealerDrawing) return;

    // after a split, results for hand 0 are shown first, a click reveals hand 1's result
    if (state.gameState === "showing_results") {
        state.showingHand = 1;
        displayResult(state.showingHand);
        state.gameState = "gameover";
    } else if (state.gameState === "gameover") {
        reset();
    }
});