// to build decks

import { state, suits, ranks } from "./state.js";

// builds a 6-deck shoe and stores it in state
export function createDecks() {
    state.decks.length = 0; // to empty actual decks

    for (let i = 0; i < 6; i++) {
        for (let suit of suits) {
            for (let rank of ranks) {
                state.decks.push({ rank, suit });
            }
        }
    }

    return state.decks;
}

// fisher-yates shuffle: walk forward through the deck, swapping each
// card with a random card at or before its own position
export function shuffle() {
    for (let i = 0; i < state.decks.length; i++) {
        let j = Math.floor(Math.random() * (i + 1));

        let temp = state.decks[i];
        state.decks[i] = state.decks[j];
        state.decks[j] = temp;

        // [state.decks[i], state.decks[j]] = [state.decks[j], state.decks[i]];
    }
}

// rank is stored as an index (0-12), so we convert it to actual blackjack value here
export function getValue(card) {
    let rank = card.rank;

    if (rank === 12) {
        return 11; // ace, counted high by default (see reduceAces for the low case)
    }
    else if (rank >= 9 && rank <= 11) {
        return 10; // jack, queen, king
    }
    else {
        return rank + 2; // rank 0 = value 2, rank 1 = value 3, etc 
    }
}

// tells us if this card is an ace, so we can track how many soft  aces a hand has
export function getAces(card) {
    if (card.rank === 12) {
        return 1;
    }

    return 0;
}

// converts aces from 11 down to 1 (one at a time) for as long as we're
// bust and still have an ace being counted as 11
export function reduceAces(total, aces) {
    while (total > 21 && aces > 0) {
        total -= 10; // 11 -> 1 is a difference of 10
        aces -= 1;
    }

    return [total, aces];
}