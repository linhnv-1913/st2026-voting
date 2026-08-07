import type { VoteAccessLink } from "./types";

export const VOTE_ACCESS_COLLECTION = "vote-links";
export const VOTE_ACCESS_MAX_VOTES = 10;

export const VOTE_ACCESS_CODES = [
  "7f3k9m2q8x1a",
  "c4n8v2p6r9tz",
  "m8q1x5k7d3wj",
  "p2z9r4v6n8cf",
  "x7d3k9m1q5vb",
  "r6n2c8z4p7kt",
  "k9v5x1m3d8qw",
  "t4p7r2n9c6xz",
  "v1m8q3k6d9rf",
  "z5c2x7p4n8kt",
  "d8r1v6m9q3xp",
  "n3k7t2z8c5vw",
  "q6x4p9r1m7dk",
  "c9v2n5z7t3qm",
  "m4d8x1k6r9vp",
  "t7q3c9n2z5rx",
] as const;

export type VoteAccessCode = (typeof VOTE_ACCESS_CODES)[number];

export function isVoteAccessCode(value: string | undefined): value is VoteAccessCode {
  return typeof value === "string" && VOTE_ACCESS_CODES.includes(value as VoteAccessCode);
}

export function getVoteDocumentId(userId: string, accessCode: string) {
  return `vote_${userId}_${accessCode}`;
}

export function normalizeVoteAccessLink(
  id: string,
  value: unknown,
): VoteAccessLink | null {
  if (!isVoteAccessCode(id) || !value || typeof value !== "object") return null;

  const data = value as Partial<VoteAccessLink>;
  if (
    data.maxVotes !== VOTE_ACCESS_MAX_VOTES ||
    !Number.isInteger(data.voteCount) ||
    data.voteCount < 0 ||
    data.voteCount > VOTE_ACCESS_MAX_VOTES ||
    typeof data.isActive !== "boolean"
  ) {
    return null;
  }

  return {
    id,
    voteCount: data.voteCount,
    maxVotes: data.maxVotes,
    isActive: data.isActive,
  };
}
