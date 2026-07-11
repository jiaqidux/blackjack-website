// implement all game actions

import { state } from "./state.js";

import { getValue, getAces, reduceAces } from "./deck.js";

import {
    createCard,
    updateUI,
    updateTotalUI
} from "./ui.js";

import { updateActionHints } from "./hints.js";

import { endGame } from "./game.js";

// adds a single card to a given hand (by index) and keeps the running total in sync
export function dealToHand(card, handIndex) {
    state.playerTotal[handIndex] += getValue(card);
    state.playerAces[handIndex] += getAces(card);
    // if we've busted but we're holding an ace counted as 11, drop it back to 1
    [state.playerTotal[handIndex], state.playerAces[handIndex]] = reduceAces(
        state.playerTotal[handIndex],
        state.playerAces[handIndex]
    );

    // render the card in the right hand's dom container
    document
        .querySelector(`.player-hand-${handIndex}`)
        .append(createCard(card.suit, card.rank));

    updateTotalUI();
}

export function hit() {
    if (state.gameState !== "playing") return;

    state.canSplit = false;

    dealToHand(state.decks.pop(), state.activeHand);

    // auto-stand if we hit 21 exactly (or somehow over, though reduceAces should prevent a bust here)
    if (state.playerTotal[state.activeHand] >= 21) {
        stand();
    }

    updateUI();
    updateActionHints();
}

export function stand() {
    if (state.gameState !== "playing") return;

    // if this is a split hand and we just finished hand 0, move to hand 1 instead of ending the game
    if (state.isSplit && state.activeHand === 0) {
        state.activeHand = 1;
         // if hand 2 was already dealt a natural 21, skip straight past it too
        if (state.playerTotal[state.activeHand] >= 21) {
            stand();
            return;
        }

        updateUI();
        updateActionHints();
        updateTotalUI();
    } else {
        endGame();
    }
}

export function double() {
    if (state.gameState !== "playing") return;

    // can only double on the initial two cards of a hand
    if (state.isSplit) {
        if (document.querySelector(`.player-hand-${state.activeHand}`).children.length !== 2) return;
    } else {
        if (document.querySelector(`.player-hand-0`).children.length !== 2) return;
    }

    // safeguard
    if (state.balance < state.bet) {
        console.log("Not enough balance");
        return;
    }

    state.canSplit = false;

    state.balance -= state.bet;
    state.handDoubled[state.activeHand] = true;

    document.querySelector(".balance").textContent = `Balance:\n$${state.balance}`;

    // double gets exactly one more card, then forces a stand
    dealToHand(state.decks.pop(), state.activeHand);
    stand();
}

export function split() {
    if (state.gameState !== "playing" || !state.canSplit || state.isSplit) return;

    // safeguard
    if (state.playerCard1.rank !== state.playerCard2.rank) {
        console.log("Can't split");
        return;
    }

    if (state.balance < state.bet) {
        console.log("Not enough money to split");
        return;
    }

    state.balance -= state.bet; // bet for second hand

    document.querySelector(".balance").textContent = `Balance:\n$${state.balance}`;

    // reset totals since we're about to redistribute the original two cards across two separate hands
    state.playerTotal = [0, 0];
    state.playerAces = [0, 0];

    state.canSplit = false;
    state.isSplit = true;
    state.activeHand = 0;

    document.querySelector(".player-hand-0").innerHTML = "";
    document.querySelector(".player-hand-1").innerHTML = "";

    // deal first hand
    dealToHand(state.playerCard1, 0);
    dealToHand(state.decks.pop(), 0);

    // deal second hand
    dealToHand(state.playerCard2, 1);
    dealToHand(state.decks.pop(), 1);

    // if hand 0 already hit 21, skip straight to hand 1
    if (state.playerTotal[state.activeHand] >= 21) {
        state.activeHand = 1;

        // and if hand 1 also hit 21, both hands are done - end the game
        if (state.playerTotal[state.activeHand] >= 21) {
            endGame();
            return;
        }
    }

    updateUI();
    updateActionHints();
}