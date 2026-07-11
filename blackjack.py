from functools import cache
import random

CARDS_PROB = []  # assuming infinite number of cards
for i in range(2, 12):
    if i == 10:
        CARDS_PROB.append((i, 4/13)) # 10, J, Q, K all count as a 10 card
    else:
        CARDS_PROB.append((i, 1/13))


class Card:
    def __init__(self, suit, rank):
        self.suit = suit
        self.rank = rank

    def value(self):
        if self.rank in ("J", "Q", "K"):
            return 10
        if self.rank == "A":
            return 11  # could also be 1, which will be handled later
        return int(self.rank)


class Deck:
    def __init__(self, num_decks=6):  # default number of decks = 6
        suits = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"]
        ranks = ["J", "Q", "K", "A"]
        for i in range(2, 11):
            ranks.append(str(i))

        self.cards = []
        for _ in range(num_decks):
            for suit in suits:
                for rank in ranks:
                    self.cards.append(Card(suit, rank))

    def shuffle(self):
        random.shuffle(self.cards)

    def deal(self):
        return self.cards.pop()

# returns a hand's total and how many aces are still being counted as 11
def hand_info(cards):
    total = 0
    aces = 0
    for card in cards:
        total += card.value()
        if card.rank == "A":
            aces += 1

    # flip an ace from 11 to 1
    while total > 21 and aces > 0:
        total -= 10
        aces -= 1

    return (total, aces)  # we only consider aces those with value 11


# blackjack dealer rule: draw a card if <= 16, stop if >= 17
# recursively walks every possible sequence of dealer draws, weighting each
# by its probability, and calculates how likely the dealer is to end on
# each final total (or bust)
def dealer_prob(total, aces, current_prob, results):
    if total > 17 or (total == 17 and aces == 0): # dealer hits on soft 17
        if total > 21:
            results["bust"] = results.get("bust", 0) + current_prob
        else:
            results[total] = results.get(total, 0) + current_prob
        return

    for card_value, prob in CARDS_PROB:
        new_total = total + card_value
        if card_value == 11:
            new_aces = aces + 1
        else:
            new_aces = aces
        while new_total > 21 and new_aces > 0:
            new_total -= 10
            new_aces -= 1
        new_prob = current_prob * prob
        dealer_prob(new_total, new_aces, new_prob, results)


# applies a single new card to a (total, aces) state, handling the ace
# reduction the same way hand_info does
def next_state(total, aces, card_value):
    new_total = total + card_value
    if card_value == 11:
        new_aces = aces + 1
    else:
        new_aces = aces

    while new_total > 21 and new_aces > 0:
        new_total -= 10
        new_aces -= 1

    return new_total, new_aces


# ev of standing on total against a given dealer upcard
# compares our total against the dealer's full distribution of possible final totals
@cache
def compare_stand(total, dealer_card):
    results = {}
    aces = 1 if dealer_card == 11 else 0

    # if dealer's upcard is ace or 10-valued card, they will peek their downcard before the player makes any decision
    # if the downcard gives them blackjack, the hand ends inmediately
    if dealer_card == 11:
        adjusted_prob = {value: prob for value, prob in CARDS_PROB if value != 10}
    elif dealer_card == 10:
        adjusted_prob = {value: prob for value, prob in CARDS_PROB if value != 11}
    else:
        adjusted_prob = None

    if adjusted_prob:
         # renormalize probabilities since we removed the blackjack-causing card
        total_prob = sum(adjusted_prob.values())
        total_prob = sum(adjusted_prob.values())
        for card_value, prob in adjusted_prob.items():
            new_total, new_aces = next_state(dealer_card, aces, card_value)
            dealer_prob(new_total, new_aces, prob / total_prob, results)
    else:
        dealer_prob(dealer_card, aces, 1, results)

    ev = 0
    for result, prob in results.items():
        if result == "bust":
            ev += prob
        elif result > total:
            ev -= prob
        elif result < total:  
            ev += prob
    return ev


# ev calculation: recursively figures out the ev of every
# possible action for a given hand state, using memoization since the same states come up over and over
@cache
def calculate_ev(total, aces, dealer_card, num_cards, pair_card, can_split):
    if total > 21:
        return {"Stand": -1.0, "Hit": -1.0, "Double": -1.0, "Split": -1.0}

    ev_stand = compare_stand(total, dealer_card)
    ev_hit = 0.0
    ev_double = 0.0 if num_cards == 2 else -float('inf')
    ev_split = 0.0 if (num_cards == 2 and pair_card is not None and can_split) else -float('inf')

    for card_value, prob in CARDS_PROB:
        new_total, new_aces = next_state(total, aces, card_value)
        # after hitting, we'd play optimally from there, so we take the best
        # possible EV of the resulting state
        ev_hit += prob * max(calculate_ev(new_total, new_aces, dealer_card,
                             num_cards + 1, None, can_split).values())

        if num_cards == 2:
            if new_total > 21:
                ev_double += prob * -2 # doubled bet, so a bust costs double
            else:
                ev_double += prob * (compare_stand(new_total, dealer_card) * 2)

            if pair_card is not None and can_split:
                init_aces = 1 if pair_card == 11 else 0
                split_total, split_aces = next_state(pair_card, init_aces, card_value)
                # if we draw a matching card again, this new hand could itself be split
                next_pair = pair_card if card_value == pair_card else None

                ev_split += prob * max(calculate_ev(split_total, split_aces,
                                       dealer_card, 2, next_pair, False).values())

    if num_cards == 2 and pair_card is not None:
        ev_split *= 2 # split creates 2 hands, each with the same expected value

    return {"Stand": ev_stand, "Hit": ev_hit, "Double": ev_double, "Split": ev_split}


# picks whichever action has the highest ev
def optimal_strategy(total, aces, dealer_card, num_cards, pair_card, can_split):
    results = calculate_ev(total, aces, dealer_card, num_cards, pair_card, can_split)
    ev = max(results.values())
    for result in results:
        if results[result] == ev:
            return result


# picks a random legal action
def random_strategy(total, aces, dealer_card, num_cards, pair_card, can_split):
    options = ["Stand", "Hit"]
    if num_cards == 2:
        options.append("Double")
    if pair_card is not None and can_split:
        options.append("Split")
    return random.choice(options)


# standard dealer rule, hitting if below 16 or soft 17
def dealer_strategy(total, aces, dealer_card, num_cards=None, pair_card=None, can_split=False):
    if total > 17 or (total == 17 and aces == 0):
        return "Stand"
    else:
        return "Hit"


# plays N rounds of blackjack using the given strategy function and
# calculates wins/losses/draws and net units won or lost
def simulator(N, strategy):
    results = {"total_rounds": N, "Wins": 0, "Loses": 0, "Draws": 0, "Units": 0, "History": [0]}

    deck = Deck(6)
    deck.shuffle()

    for _ in range(N):
        # if less than 1 deck, we introduce more
        if len(deck.cards) < 52:
            deck = Deck(6)
            deck.shuffle()

        # queue of hands still needing to be played 
        # starts with just the player's original hand, but splits add more to the queue
        player_hand = [deck.deal(), deck.deal()]
        dealer_hand = [deck.deal(), deck.deal()]
        dealer_card = dealer_hand[0].value()

        hands_to_play = [(player_hand, False, True)]
        hands_finished = []

        while hands_to_play:
            hand, is_doubled, can_split = hands_to_play.pop(0)
            (player_total, player_aces) = hand_info(hand)
            num_cards = len(hand)

            if num_cards == 2 and hand[0].value() == hand[1].value():
                pair_card = hand[0].value()
            else:
                pair_card = None

            action = strategy(player_total, player_aces, dealer_card,
                              num_cards, pair_card, can_split)

            if action == "Split":
                hand1 = [hand[0], deck.deal()]
                hand2 = [hand[1], deck.deal()]

                hands_to_play.append((hand1, False, False))
                hands_to_play.append((hand2, False, False))

            elif action == "Double":
                hand.append(deck.deal())
                hands_finished.append((hand, True))

            else:
                # keep hitting until the strategy says otherwise or we bust
                while action == "Hit":
                    hand.append(deck.deal())
                    (player_total, player_aces) = hand_info(hand)
                    num_cards = len(hand)

                    if player_total > 21:
                        break

                    action = strategy(player_total, player_aces,
                                      dealer_card, num_cards, None, False)

                hands_finished.append((hand, is_doubled))

        dealer_total = None

        # only bother playing out the dealer's hand if at least one player hand is still alive 
        # if everything busted, dealer's total is irrelevant
        if any(hand_info(hand)[0] <= 21 for hand, _ in hands_finished):
            (dealer_total, dealer_aces) = hand_info(dealer_hand)
            while dealer_strategy(dealer_total, dealer_aces, dealer_card) == "Hit":
                dealer_hand.append(deck.deal())
                (dealer_total, dealer_aces) = hand_info(dealer_hand)

        round_units = 0
        for hand, is_doubled in hands_finished:
            (player_total, _) = hand_info(hand)
            bet_multiplier = 2 if is_doubled else 1

            if player_total > 21:
                round_units -= bet_multiplier
            elif dealer_total is None or dealer_total > 21:
                round_units += bet_multiplier
            elif player_total > dealer_total:
                round_units += bet_multiplier
            elif player_total == dealer_total:
                pass # skip bc it's draw
            else:
                round_units -= bet_multiplier

        results["Units"] += round_units
        if round_units > 0:
            results["Wins"] += 1
        elif round_units < 0:
            results["Loses"] += 1
        else:
            results["Draws"] += 1

        results["History"].append(results["Units"])

    return results

