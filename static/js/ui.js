// all changes to ui

import { state, cardWidth, cardHeight } from "./state.js";
import { getValue } from "./deck.js";
import { updateActionHints } from "./hints.js"; 

export function createCard(suit, rank, faceDown=false) {
    // we create the card with front and back
    const cardElem = document.createElement('div');
    const cardInnerElem = document.createElement('div');
    const cardFrontElem = document.createElement('div');
    const cardBackElem = document.createElement('div');

    cardElem.classList.add('card-container');
    cardInnerElem.classList.add('card-inner');
    cardFrontElem.classList.add('card-front');
    cardBackElem.classList.add('card-back');

    // the card spritesheet is laid out in a grid by rank/suit
    // we offset the background position to land on the right card image
    const scale = 1.8;
    let x = -(rank * cardWidth * scale);
    let y = -(suit * cardHeight * scale);
    let bgX = -(1 * cardWidth * scale);
    let bgY = 0;
    cardFrontElem.style.backgroundPosition = `${x}px ${y}px, ${bgX}px ${bgY}px`;

    cardElem.appendChild(cardInnerElem);
    cardInnerElem.appendChild(cardFrontElem);
    cardInnerElem.appendChild(cardBackElem);

    // face-down cards start pre-rotated so the back is showing
    if (faceDown) {
        cardInnerElem.style.transform = 'rotateY(180deg)';
    }

    return cardElem;
}

// show and hide buttons
export function updateUI() {
    const dealCont = document.querySelector(".deal-action-container");
    const actionCont = document.querySelector(".action-button-container"); // hit, double, stand
    const splitButton = document.querySelector(".split");
    const doubleButton = document.querySelector(".double");

    if (state.gameState === "playing") {
        dealCont.style.display = "none";
        actionCont.style.visibility = "visible";

        // only show split button if hand can split
        if (state.playerCard1 && state.playerCard2 && state.playerCard1.rank === state.playerCard2.rank && state.canSplit && !state.isSplit && state.activeHand === 0) {
            splitButton.style.display = "inline-block";
        } else {
            splitButton.style.display = "none";
        }

        //  hide double button if not enough state.balance
        if (state.balance >= state.bet) {
            doubleButton.style.display = "inline-block";
        } else {
            doubleButton.style.display = "none";
        }
    } else {
        actionCont.style.visibility = "hidden";
        splitButton.style.display = "none";

        if (state.gameState === "betting") {
            dealCont.style.display = "flex";
        } else {
            dealCont.style.display = "none";
        }
    }
}

export function updateTotalUI() {
    const dealerHeader = document.querySelector(".dealer-container h3");
    const titleHand0 = document.querySelector(".title-hand-0");
    const titleHand1 = document.querySelector(".title-hand-1");
    const hand1Container = document.querySelector(".player-hand-1-container");

    // hide the dealer's hole card total until it's actually flipped
    // show just the up card's value in the meantime
    if (!state.flipped) {
        dealerHeader.textContent = `Dealer: ${getValue(state.upCard)}`;
    } else {
        dealerHeader.textContent = `Dealer: ${state.dealerTotal}`;
    }

    if (!state.isSplit) {
        titleHand0.textContent = `Player: ${state.playerTotal[0]}`;
        hand1Container.setAttribute("hidden", "true");
    } else {
        hand1Container.removeAttribute("hidden");
        // little arrow points at whichever hand is currently active
        let showArrow1 = (state.gameState === "playing" && state.activeHand === 0) ? "  ❮❮" : "";
        let showArrow2 = (state.gameState === "playing" && state.activeHand === 1) ? "  ❮❮" : "";

        titleHand0.textContent = `Hand 1: ${state.playerTotal[0]}${showArrow1}`;
        titleHand1.textContent = `Hand 2: ${state.playerTotal[1]}${showArrow2}`;
    }
}

export function showMessage(text) {
    const message = document.querySelector(".message");
    message.textContent = text;
    message.style.display = "flex";
}

export function displayResult(index) {
    let multiplier = 0;
    let message;
    if (state.playerTotal[index] > 21) {
        message = "You lost";
    } else if (state.dealerTotal > 21) {
        message = "You won!"
        multiplier = 2;
    } else if (state.playerTotal[index] === state.dealerTotal) {
        message = "Draw"
        multiplier = 1; // return the original bet, no gain/loss
    } else if (state.playerTotal[index] > state.dealerTotal) {
        message = "You won!"
        multiplier = 2;
    } else {
        message = "You lost"
    }

    let prefix = state.isSplit ? `Hand ${index + 1}: ` : "";
    showMessage(prefix + message);

    // doubled hands staked twice the bet, so payouts need to reflect that
    let handStake = state.handDoubled[index] ? state.bet * 2 : state.bet;
    state.balance += multiplier * handStake;
    document.querySelector(".balance").textContent = `Balance:\n$${state.balance}`;
}

export function reset() {
    document.querySelector(".message").style.display = "none";
    document.querySelector(".dealer-hand").innerHTML = "";
    document.querySelector(".player-hand-0").innerHTML = "";
    document.querySelector(".player-hand-1").innerHTML = "";

    document.querySelector(".dealer-container").style.visibility = "hidden";
    document.querySelector(".player-container").style.visibility = "hidden";

    state.bet = 0;
    document.querySelector(".bet").textContent = `Bet:\n$${state.bet}`;
    document.querySelector(".balance").textContent = `Balance:\n$${state.balance}`;

    state.gameState = "betting";
    updateUI();
}

export function clearIlluminatedButtons() {
    document.querySelectorAll(".action-button-container button").forEach(btn => {
        btn.classList.remove("illuminated");
    });
}