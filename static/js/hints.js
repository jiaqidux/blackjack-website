import { state } from "./state.js";

import { getValue } from "./deck.js";

import { clearIlluminatedButtons } from "./ui.js";

// asks the backend for the optimal basic-strategy move given the current
// hand, and lights up the matching button
export async function updateActionHints() {
    clearIlluminatedButtons();
    if (!state.hintsEnabled || state.gameState !== "playing") return;

    const currentTotal = state.playerTotal[state.activeHand];
    const currentAces = state.playerAces[state.activeHand];
    const dealerCardValue = getValue(state.upCard);

    // how many cards are actually in the active hand right now
    const handSelector = state.isSplit ? `.player-hand-${state.activeHand}` : `.player-hand-0`;
    const numCards = document.querySelector(handSelector).children.length;

    // pair info only matters pre-split, since you can't split a hand you've already split
    // and only while the hand still hast its original 2 cards
    let isPair = false;
    let pairValue = 0;
    if (!state.isSplit && state.playerCard1 && state.playerCard2) {
        isPair = (state.playerCard1.rank === state.playerCard2.rank);
        pairValue = getValue(state.playerCard1);
    }

    try {
        const response = await fetch(`/get_hint?player_total=${currentTotal}&player_aces=${currentAces}&dealer_card=${dealerCardValue}&is_pair=${isPair}&pair_value=${pairValue}`);
        const data = await response.json();

        if (data.hint) {
            const action = data.hint.toLowerCase();
            const targetButton = document.getElementById(`${action}Button`);
            // only illuminate if the button actually exists and isn't hidden
            if (targetButton && targetButton.style.display !== "none") {
                targetButton.classList.add("illuminated");
            }
        }
    } catch (err) {
        console.error("Error fetching optimal hint:", err);
    }
}