import { getHubId, HUB_DEFINITIONS } from '../hubOptions';
import type { HubId, TeamBuildingScores } from '../types';

export interface ResultScoreCandidate {
  id: string;
  text: string;
  voteCount: number;
}

export interface RankedResult extends ResultScoreCandidate {
  rank: number | null;
  points: number;
}

export interface FinalLeaderboardEntry {
  hubId: HubId;
  label: string;
  voteCount: number;
  voteRank: number | null;
  votePoints: number;
  teamBuildingScore: number;
  totalScore: number;
  finalRank: number | null;
}

const POINTS_BY_RANK: Readonly<Record<number, number>> = {
  1: 40,
  2: 30,
  3: 20,
  4: 10,
};

// Slot 2 renders left of slot 1, so visual order is 2-1-3-3.
const FINAL_AWARD_RANKS = [1, 2, 3, 3] as const;

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

export function selectCanonicalHubResults(
  results: readonly ResultScoreCandidate[],
): ResultScoreCandidate[] | null {
  const resultsByHub = new Map<HubId, ResultScoreCandidate>();

  for (const result of results) {
    const hubId = getHubId(result.text);
    if (!hubId || resultsByHub.has(hubId)) return null;
    resultsByHub.set(hubId, result);
  }

  if (resultsByHub.size !== HUB_DEFINITIONS.length) return null;
  return HUB_DEFINITIONS.map((hub) => resultsByHub.get(hub.id)!);
}

export function createFinalLeaderboard(
  results: readonly ResultScoreCandidate[],
  teamBuildingScores: TeamBuildingScores,
): FinalLeaderboardEntry[] | null {
  const canonicalResults = selectCanonicalHubResults(results);
  if (!canonicalResults) return null;
  const rankedVotes = rankFinalResults(canonicalResults);
  const votesByHub = new Map<HubId, RankedResult>();

  rankedVotes.forEach((result) => {
    const hubId = getHubId(result.text);
    if (hubId) votesByHub.set(hubId, result);
  });

  const entries = HUB_DEFINITIONS.map((hub) => {
    const voteResult = votesByHub.get(hub.id);
    const votePoints = voteResult?.points ?? 0;
    const teamBuildingScore = teamBuildingScores[hub.id];

    return {
      hubId: hub.id,
      label: hub.label,
      voteCount: voteResult?.voteCount ?? 0,
      voteRank: voteResult?.rank ?? null,
      votePoints,
      teamBuildingScore,
      totalScore: teamBuildingScore + votePoints,
      finalRank: null,
    } satisfies FinalLeaderboardEntry;
  });

  const hasScore = entries.some((entry) => entry.totalScore > 0);
  const compareEntries = (first: FinalLeaderboardEntry, second: FinalLeaderboardEntry) => {
    const totalDifference = second.totalScore - first.totalScore;
    if (totalDifference !== 0) return totalDifference;

    const teamBuildingDifference = second.teamBuildingScore - first.teamBuildingScore;
    if (teamBuildingDifference !== 0) return teamBuildingDifference;

    return HUB_DEFINITIONS.findIndex((hub) => hub.id === first.hubId)
      - HUB_DEFINITIONS.findIndex((hub) => hub.id === second.hubId);
  };
  return [...entries]
    .sort(compareEntries)
    .map((entry, index) => ({
      ...entry,
      finalRank: hasScore ? FINAL_AWARD_RANKS[index] ?? null : null,
    }));
}
