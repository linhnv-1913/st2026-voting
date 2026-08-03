export interface ResultScoreCandidate {
  id: string;
  text: string;
  voteCount: number;
}

export interface RankedResult extends ResultScoreCandidate {
  rank: number | null;
  points: number;
}

const POINTS_BY_RANK: Readonly<Record<number, number>> = {
  1: 40,
  2: 30,
  3: 20,
  4: 10,
};

function getPointsForRank(rank: number | null): number {
  return rank === null ? 0 : POINTS_BY_RANK[rank] ?? 0;
}

/**
 * Equal vote totals share a rank and the next lower vote total gets the next
 * available rank. For example, vote totals 10, 10, 8, 7 produce ranks 1, 1, 2, 3.
 * When at least one vote exists, zero-vote candidates still occupy their rank;
 * an all-zero result is the only case with no ranking.
 */
export function rankFinalResults(
  results: readonly ResultScoreCandidate[],
): RankedResult[] {
  const hasVotes = results.some((result) => result.voteCount > 0);
  const distinctVoteCounts = [...new Set(results.map((result) => result.voteCount))]
    .sort((first, second) => second - first);

  return results.map((result) => {
    const rank = hasVotes
      ? distinctVoteCounts.indexOf(result.voteCount) + 1
      : null;

    return {
      ...result,
      rank,
      points: getPointsForRank(rank),
    };
  });
}
