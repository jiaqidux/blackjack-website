# Blackjack Strategy Engine and Simulator

#### Video Demo: https://youtu.be/qSCGZ8rtb5s

---

## Description
This project is a comprehensive web application that functions as a playable Blackjack game, an optimal strategy calculator, and a Monte Carlo strategy simulator. Built using Python for the computational backend, Flask for the web server, and a modular HTML, CSS, and JavaScript architecture for the frontend, it demonstrates the underlying mathematics of casino blackjack. The application evaluates the Expected Value (EV) of every possible decision to prove that adhering to mathematically optimal play minimizes long-term losses compared to arbitrary or dealer-mimicking strategies.


---

## How to Run Locally

To run this application on your local machine, follow these setup steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jiaqidux/blackjack.git
   cd project
   ```

2. **Install dependencies:**
   Ensure you have Python installed, then install the required backend modules via your terminal:
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the Flask server:**
   Run the main application script:
   ```bash
   python app.py
   ```

4. **Access the application:**
   Open your preferred web browser and navigate to:
   http://127.0.0.1:5000/

---

## The Mathematical Core

The heart of the project relies on probability theory and dynamic programming implemented in Python to resolve the optimal path through any given blackjack hand. The system evaluates the EV of every possible decision to prove that adhering to mathematically optimal play minimizes long-term losses compared to arbitrary or dealer-mimicking strategies.

### Dealer Probability Distribution
The `dealer_prob` function uses recursion to calculate the exact probability of every possible final state the dealer can reach (17, 18, 19, 20, 21, or bust) based on their single visible upcard. The function explores every possible card draw, multiplying the current probability by the probability of the newly drawn card, accumulating these values into a dictionary. It strictly adheres to the rule that the dealer must hit on a soft 17. The recursive tree terminates when a final resting state is achieved.


### Expected Value and Conditional Probability
The `compare_stand` function calculates the EV of choosing to stand on a given total against a given dealer upcard, measured in bet units where a win pays +1, a loss costs -1, and a push pays 0. 

A critical component of this calculation is handling the dealer peeking rule. If the dealer upcard is an Ace or a 10-value card, they check their hidden card for a Blackjack before the player acts. If the game continues to the player's turn, it mathematically guarantees the dealer does not have Blackjack. The code filters out the corresponding cards (removing 10s if the upcard is an Ace, and removing Aces if the upcard is a 10) and recalculates the relative probabilities in the adjusted_prob dictionary, ensuring perfect accuracy.


### Dynamic Programming for Optimal Play
The `calculate_ev` function determines the mathematical value of hitting, standing, doubling, and splitting. It applies recursion with memoization via Python's `@cache` decorator to traverse the entire decision tree. 
* Standing scales directly with the outputs of `compare_stand`.
* Hitting operates recursively: for each possible next card, it computes the new hand state and recursively calls itself to find the best EV from that state onward, weighted by probability.
* Doubling considers each possible card and records either a loss of two units on a bust or the standing EV at double stakes otherwise.
* Splitting recursively evaluates the best EV from each of the two resulting hands after one more card each, as a split hand is played independently.

Because these functions call each other recursively and the same states recur often, caching ensures any given state is computed exactly once and reused, making the calculation tractable rather than exponential. Finally, `optimal_strategy` compares the four actions and selects the specific string label matching the maximum value.

---

## The Monte Carlo Simulator

To prove the strategy tables work, the `simulator(N, strategy)` function plays N automated rounds.

* It initializes a 6-deck shoe and handles deck penetration, reshuffling only when cards run out.
* It iterates through hands using a queue system (hands_to_play), which efficiently handles split hands by appending newly split branches to the queue for sequential evaluation.
* It applies the injected strategy function to make decisions, tracking doubles and busts.
* Finally, it triggers the dealer's drawing rules and compares totals, keeping a running tally of net units (bankroll performance). It returns a detailed history array used for visualization.


---

## Web Server Integration (Flask)

The `app.py` file serves as the bridge between the mathematical backend and the client interface.

To prevent severe performance bottlenecks, the three canonical strategy matrices (Hard Totals, Soft Totals, and Pairs) are pre-calculated as global variables when the server initially starts. Running the deep recursive tree for every matrix cell upon every individual page load would be computationally prohibitive.

The server features distinct architectural choices for routing:
* The `/get_hint` route calls `optimal_strategy` directly on the exact state of the player's current hand sent as query parameters, since a live hand can reach intermediate states beyond the canonical ones displayed in the static table.
* The `/run_simulator` endpoint acts as a template renderer, serving the static HTML interface where the user sets up simulation parameters.
* The `/simulate` endpoint functions as a RESTful JSON API. It accepts the user's N parameter, validates it to prevent server crashes, invokes the simulation engine three times (optimal, dealer, and random strategies), and packages the comparative tracking arrays into a single JSON response.


---

## Frontend Architecture

The game itself is implemented in vanilla JavaScript using ES modules, introduced midway through development after the original single-file script became difficult to debug. Responsibility is decoupled across distinct modules:

* **state.js:** Holds a single shared object containing the global runtime state of the active game, including hand totals, shoe composition, balance, current bet, and split tracking flags.
* **deck.js:** Mimics the backend deck configurations by building and shuffling the six-deck shoe and translating drawn cards into their respective Blackjack values.
* **ui.js:** Manages all DOM manipulations, including rendering card elements from a custom sprite sheet, updating display scores, and toggling button visibility states across different game phases.
* **actions.js:** Implements the core player mechanics. Splitting is the most intricate component: it resets hand totals, deals a card to each split branch, handles independent bets, tracks doubled-down flags, and manages an active-hand pointer to route subsequent actions to the correct sub-hand.
* **hints.js:** Handles real-time hints by tracking the current hand state and performing asynchronous API `fetch` requests to the `/get_hint` endpoint whenever it is the player's turn.
* **events.js:** Centralizes all DOM event listeners, including chip selection, action buttons, and a global document-level click listener that advances game phases or triggers cleanups.
* **game.js:** Controls the core operational game loop. `startGame` initializes round variables and deals opening cards. `dealerPlay` reveals the hole card and resolves the dealer's hand under the soft-17 rule with automated time delays. `endGame` drives the evaluation transition, while `reset` clears the table graphics and returns the interface to the pristine betting state.

---

## Design Reflections

Several engineering decisions in this project required weighing theoretical correctness against real-world computational performance. 

The infinite-deck assumption used throughout the probability calculations, rather than tracking the exact shifting composition of a finite shoe, keeps the state space small enough for the recursive EV calculations to terminate quickly and cache effectively. This comes at the cost of a minor amount of theoretical precision that becomes statistically negligible when simulating a standard casino six-deck shoe.

Precomputing the strategy tables once at server startup, rather than on each individual request, reflects a broader architectural principle applied throughout the backend: separating expensive, static computation from cheap, per-request routing logic wherever the two can be cleanly divided. On the frontend, migrating from a monolithic script to ES modules organized strictly by responsibility was a choice made to keep testing and debugging tractable as the scale of the codebase grew.

Building the strategy engine, the interactive game, and the statistical simulator on top of the exact same core probability functions was the central architectural choice of the project. It ensures that the interface makes a genuine, verifiable claim: the strategy it recommends to the user is not an arbitrary rule of thumb, but the direct output of an exact calculation that the simulator itself verifies empirically.