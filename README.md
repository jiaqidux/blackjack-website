# Blackjack Strategy Engine and Simulator
#### Video Demo: https://youtu.be/qSCGZ8rtb5s

---

## Description
A full-stack Blackjack web application built as the final project for [CS50's Introduction to Computer Science](https://cs50.harvard.edu/x/). Beyond a playable game, it includes a real-time optimal strategy advisor and a Monte Carlo simulator, all built on the exact same core probability engine, so the strategy the app recommends is not a rule of thumb but the direct output of a calculation the simulator itself verifies empirically.

---

## How to run
Try it live: https://blackjack-optimal-simulator.onrender.com
 
Or run it locally:
```bash
git clone https://github.com/jiaqidux/blackjack-website.git
cd blackjack-website
pip install -r requirements.txt
python app.py
```
Then open http://127.0.0.1:5000/ in your browser.

---

## Design highlights
A few decisions worth calling out (full explanations in [`DESIGN.md`](./DESIGN.md)):
* Every hand state is cached with `@cache`, so the recursive EV calculation doesn't redo the same work over and over.
* The dealer's peek (checking for blackjack on an Ace or 10 upcard) is handled exactly by adjusting the odds, not approximated.
* Strategy tables are precomputed once at server startup instead of on every request.
---
 
## Validation
In order to check whether the optimal strategy actually performs better, I wrote `benchmark.py` to run 100,000 rounds each with three strategies: `optimal_strategy`, `dealer_strategy` (a sensible baseline — hit below 17, stand otherwise), and `random_strategy` (picks randomly, as a control), then compare how each one does.
 
**Results (example run, N = 100,000):**
 
| Metric | Optimal strategy | Dealer strategy | Random strategy (control) |
|---|---|---|---|
| EV per hand | -2.8% | -8.2% | -51.8% |
| Simulation speed | ~131,800 rounds/s | ~190,300 rounds/s | ~190,600 rounds/s |
 
Playing optimally cuts expected losses by about 95% compared to playing randomly, but the more interesting comparison is against dealer strategy, since "just play like the dealer" is a genuinely reasonable way to play, not a strawman. Even against that baseline, optimal strategy still cuts expected losses by about 66%.
 
Since `calculate_ev` is cached, `calculate_ev.cache_info()` also tells us how big the underlying decision tree actually is for free: the engine only ever needs to work out 8,700 unique hand states (total × dealer's card × number of cards × whether you can split), and reuses those cached answers around 188,000 times in a typical run. That's not just a speed trick, but a real measure of how much smaller this problem is than it looks at first.
 
> Note: results shift slightly every run since this is a stochastic simulation, but the loss reduction consistently lands in a similar range across repeated runs.
 
## Architecture overview
 
 
| Component | Purpose |
|---|---|
| `blackjack.py` | The math engine: EV calculations, dealer probabilities, and the simulator |
| `benchmark.py` | Checks the strategy engine against dealer and random-decision controls |
| `app.py` | Flask routes connecting the engine to the game, hints, and simulator |
| `static/js/state.js` | Shared game state: hand totals, the shoe, balance, current bet |
| `static/js/deck.js` | Builds and shuffles the six-deck shoe, matching the backend's setup |
| `static/js/ui.js` | Renders cards, scores, and buttons on screen |
| `static/js/actions.js` | Player actions, including handling split hands and separate bets |
| `static/js/hints.js` | Fetches real-time strategy hints from `/get_hint` |
| `static/js/events.js` | All the DOM event listeners in one place |
| `static/js/game.js` | The main game loop: dealing, the dealer's turn, and resolving each round |
| `static/js/simulator.js` | Runs the simulator page: fetches `/simulate` and renders the charts and results table |
| `static/images/` | Card sprites and other UI assets |
| `templates/` | Jinja2 HTML templates (index, layout, simulator, strategy) |
| `DESIGN.md` | The full write-up: the probability model, the caching approach, and how the frontend is organized |

---
 
## Built with
Python · Flask · JavaScript (ES Modules) · Chart.js · Bootstrap
 