// builds the initial shoe and wires up all the event listeners

import { createDecks, shuffle } from "./deck.js";

import "./events.js"; // side-effect import, just registers listeners

createDecks();
shuffle();