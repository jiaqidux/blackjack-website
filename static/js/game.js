// game flow

import { state } from "./state.js";

import { createDecks, shuffle, getValue, getAces, reduceAces } from "./deck.js";

import {
    createCard,
    updateUI,
    updateTotalUI,
    displayResult,
    clearIlluminatedButtons
} from "./ui.js";

import { updateActionHints } from "./hints.js";

import { dealToHand } from "./actions.js";

import { sleep } from "./utils.js";


export function startGame() {
    // reset everything
    state.dealerTotal = 0;
    state.dealerAces = 0;
    state.flipped = false;
    state.playerTotal = [0, 0];
    state.playerAces = [0, 0];
    state.canSplit = true;
    state.isSplit = false;
    state.handDoubled = [false, false];
    state.activeHand = 0;
    state.showingHand = 0;

    document.querySelector(".dealer-container").style.visibility = "visible";
    document.querySelector(".player-container").style.visibility = "visible";

    document.querySelector(".player-hand-1-container").setAttribute("hidden", "true");
    document.querySelector(".title-hand-0").textContent = "Player: 0";

    document.querySelector(".dealer-hand").innerHTML = "";
    document.querySelector(".player-hand-0").innerHTML = "";
    document.querySelector(".player-hand-1").innerHTML = "";

    // if we have less than one deck, we add more cards
    if (state.decks.length < 52) {
        createDecks();
        shuffle();
    }

    // deal dealer's cards: one face down (the "hole" card), one face up
    state.downCard = state.decks.pop();
    state.upCard = state.decks.pop();

    // only the up card counts towards dealerTotal for now, since the down
    // card isn't revealed until dealerPlay() flips it later
    state.dealerTotal += getValue(state.upCard);
    state.dealerAces += getAces(state.upCard);

    state.downCardElem = createCard(state.downCard.suit, state.downCard.rank, true);
    document.querySelector(".dealer-hand").append(state.downCardElem);
    document.querySelector(".dealer-hand").append(createCard(state.upCard.suit, state.upCard.rank));

    // deal player's cards
    state.playerCard1 = state.decks.pop();
    state.playerCard2 = state.decks.pop();

    dealToHand(state.playerCard1, 0);
    dealToHand(state.playerCard2, 0);

    // peek: if adding the hidden down card would make the dealer 21,
    // that's a dealer blackjack, so we end immediately without letting the player act
    if (state.dealerTotal + getValue(state.downCard) == 21) {
        endGame();
        return;
    }

    // if player is 21, it's either draw or win
    // since we peeked and the game continued, it means it's not draw, so it must be win
    if (state.playerTotal[0] == 21) {
        updateUI();
        endGame();
        return;
    }

    updateUI();
    updateActionHints();
    updateTotalUI();
}

export async function dealerPlay() {
    state.isDealerDrawing = true;
    // flip the hole card face up
    state.downCardElem.querySelector(".card-inner").style.transform = "rotateY(0deg)";
    state.flipped = true;

    // now that it's revealed, actually add it to the dealer's total
    state.dealerTotal += getValue(state.downCard);
    state.dealerAces += getAces(state.downCard);

    [state.dealerTotal, state.dealerAces] = reduceAces(
        state.dealerTotal,
        state.dealerAces
    );

    updateTotalUI();

    // no point drawing more cards for the dealer if every player hand already busted
    let allBusted = state.isSplit
        ? (state.playerTotal[0] > 21 && state.playerTotal[1] > 21)
        : (state.playerTotal[0] > 21);

    if (!allBusted) {
        // dealer hits on soft 17 (17 with an ace still counted as 11)
        while (state.dealerTotal < 17 || (state.dealerTotal === 17 && state.dealerAces > 0)) {
            await sleep(750); // pause between cards so it's visible/readable

            let card = state.decks.pop();

            state.dealerTotal += getValue(card);
            state.dealerAces += getAces(card);

            [state.dealerTotal, state.dealerAces] = reduceAces(
                state.dealerTotal,
                state.dealerAces
            );

            document.querySelector(".dealer-hand").append(createCard(card.suit, card.rank));

            updateTotalUI();
        }
    }
    state.isDealerDrawing = false;
    return state.dealerTotal;
}

export async function endGame() {
    // if the hand was split, we show each hand's result one at a time
    if (state.isSplit) {
        state.gameState = "showing_results";
    } else {
        state.gameState = "gameover";
    }

    updateUI();
    updateTotalUI();
    clearIlluminatedButtons();

    await dealerPlay();

    // always show hand 0's result first
    state.showingHand = 0;

    // re-set gameState since dealerPlay() was async and state could've been read elsewhere in between
    if (state.isSplit) {
        state.gameState = "showing_results";
    } else {
        state.gameState = "gameover";
    }

    updateUI();
    updateActionHints();
    updateTotalUI();
    clearIlluminatedButtons();
    displayResult(state.showingHand);
}