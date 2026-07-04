# Blackjack Strategy Engine and Simulator
#### Video Demo: https://youtu.be/qSCGZ8rtb5s

---

## Description
A full-stack Blackjack web application built as the final project for [CS50's Introduction to Computer Science](https://cs50.harvard.edu/x/). Beyond a playable game, it includes a real-time optimal strategy advisor and a Monte Carlo simulator, all built on the exact same core probability engine — so the strategy the app recommends is not a rule of thumb, but the direct output of a calculation the simulator itself verifies empirically.

---

## How to run
Try it live: https://blackjack-optimal-simulator.onrender.com
 
Or run it locally:
```bash
git clone https://github.com/jiaqidux/blackjack.git
cd project
pip install -r requirements.txt
python app.py
```
Then open http://127.0.0.1:5000/ in your browser.

---

## Design highlights
A few decisions worth calling out, explained in full in [`DESIGN.md`](./DESIGN.md):
* Dynamic programming with memoization to make an exponential problem tractable. `calculate_ev` recursively evaluates hitting, standing, doubling, and splitting, caching every state via Python's `@cache` decorator so that recurring states are computed exactly once rather than re-derived on every call.
* Exact dealer-peek probability adjustment. When the dealer's upcard is an Ace or 10-value card, the code filters out the corresponding cards from the probability distribution to reflect the mathematical guarantee that the dealer doesn't hold Blackjack once play continues — rather than approximating it.
* Precomputed strategy tables at server startup. The three canonical strategy matrices are calculated once when Flask launches, separating expensive static computation from cheap per-request routing, instead of recalculating a full decision tree on every page load.
* An infinite-deck assumption for the probability engine, trading a small amount of theoretical precision for a state space small enough to cache effectively — negligible in practice against a simulated six-deck shoe.

---

## Architecture overview
| Component | Purpose |
|---|---|
| `blackjack.py` | The mathematical engine: EV calculation, dealer probability, and the Monte Carlo simulator |
| `app.py` | Flask routes bridging the engine to the game, hint, and simulation endpoints |
| `static/js/state.js` | Shared runtime state: hand totals, shoe composition, balance, active bet |
| `static/js/deck.js` | Builds and shuffles the six-deck shoe, mirroring the backend's deck configuration |
| `static/js/ui.js` | DOM rendering: cards, scores, button visibility across game phases |
| `static/js/actions.js` | Player mechanics, including split-hand tracking and independent bets |
| `static/js/hints.js` | Real-time strategy hints via async requests to `/get_hint` |
| `static/js/events.js` | Centralized DOM event listeners |
| `static/js/game.js` | Core game loop: dealing, dealer play under soft-17 rule, round resolution |

---

## Files
- `blackjack.py` — the mathematical engine (EV calculation, dealer probability, simulator)
- `app.py` — Flask server and route definitions
- `static/js/` — ES module frontend architecture (state, deck, UI, actions, hints, events, game loop, utils)
- `static/images/` — card sprites and UI assets
- `templates/` — Jinja2 HTML templates (index, layout, simulator, strategy)
- `DESIGN.md` — full design document: the probability model, dynamic programming approach, Flask routing choices, and frontend architecture

---

## Built with
Python · Flask · JavaScript (ES Modules) · Chart.js · Bootstrap