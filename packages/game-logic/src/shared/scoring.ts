const K_FACTOR = 32;

/**
 * Calculate new ELO ratings after a game.
 * @param ratings Array of current ELO ratings for each player (in finishing order, winner first)
 * @returns Array of new ELO ratings
 */
export function calculateEloChanges(
  ratings: number[],
  finishPositions: number[]
): number[] {
  const n = ratings.length;
  const newRatings = [...ratings];

  for (let i = 0; i < n; i++) {
    let eloChange = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;

      const expected = 1 / (1 + Math.pow(10, (ratings[j] - ratings[i]) / 400));
      const actual =
        finishPositions[i] < finishPositions[j]
          ? 1
          : finishPositions[i] === finishPositions[j]
            ? 0.5
            : 0;

      eloChange += K_FACTOR * (actual - expected);
    }
    newRatings[i] = Math.round(ratings[i] + eloChange / (n - 1));
  }

  return newRatings;
}
