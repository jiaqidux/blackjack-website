import time
from blackjack import simulator, optimal_strategy, random_strategy, calculate_ev

N = 100_000


# prints a summary of one strategy's simulation results and returns its EV per hand,
# so we can compare strategies against each other afterward
def summarize(name, results, elapsed):
    n = results["total_rounds"]
    units = results["Units"]
    win_rate = results["Wins"] / n * 100
    lose_rate = results["Loses"] / n * 100
    draw_rate = results["Draws"] / n * 100
    ev_per_hand = units / n

    print(f"\n{name}")
    print(f"Execution time: {elapsed:.2f}s ({n/elapsed:,.0f} rounds/s)")
    print(f"Wins: {win_rate:.2f}%  Loses: {lose_rate:.2f}%  Draws: {draw_rate:.2f}%")
    print(f"Net units: {units:+}")
    print(f"EV per hand: {ev_per_hand:+.4f}")
    return ev_per_hand


def main():
    print(f"Running {N:,} rounds with optimal_strategy...")
    t0 = time.perf_counter()
    optimal_results = simulator(N, optimal_strategy)
    t_optimal = time.perf_counter() - t0

    print(f"Running {N:,} rounds with random_strategy (control)...")
    t0 = time.perf_counter()
    random_results = simulator(N, random_strategy)
    t_random = time.perf_counter() - t0

    ev_optimal = summarize("OPTIMAL STRATEGY", optimal_results, t_optimal)
    ev_random = summarize("RANDOM STRATEGY (control)", random_results, t_random)

    print("\nCOMPARISON")
    diff = ev_optimal - ev_random
    # how much closer to break-even the optimal strategy gets us vs playing randomly
    reduction_pct = (1 - abs(ev_optimal) / abs(ev_random)) * 100
    print(f"EV difference per hand: {diff:+.4f}")
    print(f"Expected loss reduction vs random strategy: {reduction_pct:.1f}%")

    # calculate_ev is decorated with @cache, so this tells us how many unique
    # (total, aces, dealer_card, ...) states actually got computed vs reused
    info = calculate_ev.cache_info()
    print(f"\nUnique decision states computed (memoization): {info.misses:,}")
    print(f"Cache reuses (hits): {info.hits:,}")


if __name__ == "__main__":
    main()