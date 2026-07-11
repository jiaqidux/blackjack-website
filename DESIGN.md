# Blackjack Strategy Engine and Simulator

#### Video Demo: https://youtu.be/qSCGZ8rtb5s

---

## Description
This project is a web app that functions as a playable Blackjack game, an optimal strategy calculator, and a Monte Carlo strategy simulator. It's built with Python on the backend, Flask as the web server, and plain JavaScript (organized into modules) on the frontend. The whole point is to show the math behind Blackjack strategy, not just state it. Every decision the app recommends comes from actually calculating its expected value, so you can check that "playing optimally" really does lose less money over time compared to arbitrary or dealer-mimicking strategies.

---

## Python Backend: The Math Engine

The core of this project is a mix of probability and dynamic programming, used to figure out the best move for any Blackjack hand. Instead of guessing or hard-coding a strategy chart, the code calculates the expected value (EV) of every possible decision directly.

### Dealer Probability Distribution
The `dealer_prob` function figures out, using recursion, exactly how likely the dealer is to land on each possible final total (17 through 21, or bust), based only on their face-up card. It walks through every card they could possibly draw next, multiplying probabilities together as it goes, and keeps adding up the odds until the dealer reaches a stopping point. It also follows the real casino rule that the dealer has to hit on a soft 17, not stand.

### Expected Value and Conditional Probability
The `compare_stand` function calculates what standing on a given total is worth against a given dealer card, in bet units — a win is +1, a loss is -1, a push is 0.

One tricky part here is the dealer's peek. If their face-up card is an Ace or a 10, they secretly check for blackjack before you even get to make a decision. So if the hand hasn't already ended, that means they don't have blackjack, which is useful information. The code accounts for this by removing the cards that would've given them blackjack from the probability pool (removing 10s if they show an Ace, or Aces if they show a 10) and recalculating the odds from there, so the math stays exact instead of approximate.

### Dynamic Programming for Optimal Play
The `calculate_ev` function is where hitting, standing, doubling, and splitting all get compared. It uses recursion to work this out, and Python's `@cache` decorator to remember every hand state it's already solved.
* Standing just reuses whatever `compare_stand` already worked out.
* Hitting is recursive: for every possible next card, it works out the new hand, and then calls itself again to see what the best move from there would be, weighted by how likely that card is.
* Doubling checks each possible next card and either counts a loss of two units (if you'd bust) or doubles the standing value otherwise.
* Splitting recursively works out the best value of each of the two new hands, since a split hand plays out completely on its own.

Without caching, this would spiral out of control since the same hand can come up thousands of times across different branches of the recursion. Caching means each unique hand only ever gets solved once. Once all four options are worked out, `optimal_strategy` just picks whichever one has the highest value.

One simplification worth mentioning: the probability engine treats the deck as infinite rather than tracking exactly which cards are left in a real shoe. This keeps the number of possible states small enough for caching to work well, and the accuracy loss is negligible once you're simulating a real six-deck shoe anyway.

### The Monte Carlo Simulator
To actually test whether all this math holds up, `simulator(N, strategy)` plays out N full rounds automatically.

* It initializes a six-deck shoe and reshuffles once the deck runs low, the same way a real table would.
* It iterates through hands using a queue system (hands_to_play), which efficiently handles split hands by appending newly split branches to the queue.
* It plays out whatever strategy function you give it, keeping track of doubles and busts along the way.
* At the end, it plays out the dealer's hand, compares totals, and keeps a running total of units won or lost, which we can graph over time.

---

## Web Server Integration (Flask)

`app.py` is what connects the math engine to the actual game people play.

To avoid doing all that expensive recursive math on every single page load, the three main strategy charts (Hard Totals, Soft Totals, and Pairs) are calculated once, right when the server starts up, and just reused after that.

A few routing choices worth calling out:
* `/get_hint` calls `optimal_strategy` directly with whatever the player's hand actually looks like right now, sent as query parameters — since a real hand in progress can end up in situations the static strategy chart doesn't cover.
* `/run_simulator` just renders the page where you set up a simulation.
* `/simulate` is a proper JSON API: it takes in how many rounds you want (`N`), checks that it's a reasonable number, runs the simulation three times (optimal, dealer-style, and random), and sends back all three results together so the frontend can compare them.

---

## Frontend Architecture

The game runs on plain JavaScript, split into modules by responsibility. This wasn't the original setup: the game started as one long script, and got split apart partway through once that became too hard to debug.

* **state.js:** One shared object holding everything about the current game: hand totals, the shoe, balance, current bet, and whether the hand has been split.
* **deck.js:** Builds and shuffles a six-deck shoe on the frontend, matching how the backend sets things up, and converts drawn cards into their Blackjack values.
* **ui.js:** Handles everything visual such as rendering cards from the sprite sheet, updating the totals on screen, and showing/hiding buttons depending on what phase the game is in.
* **actions.js:** The actual player actions. Splitting is the most involved one: it resets the hand totals, deals a card to each new hand, tracks separate bets, keeps track of which hands were doubled, and keeps a pointer to whichever hand is currently active so the right buttons act on the right hand.
* **hints.js:** Asks the backend for the best move whenever it's your turn, via a request to `/get_hint`.
* **events.js:** Every DOM event listener lives here: chip selection, action buttons, and a general click listener that handles things like moving between game phases.
* **game.js:** Runs the actual game loop. `startGame` sets everything up and deals the first cards. `dealerPlay` flips the dealer's hidden card and plays out their hand under the soft-17 rule, with a short delay between each card so it's easier to follow. `endGame` handles figuring out who won, and `reset` clears the table and gets it ready for a new round.