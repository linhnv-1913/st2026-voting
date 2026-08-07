import {
  collection,
  doc,
  getDocs,
  runTransaction,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { VoteAccessLink } from "./types";
import {
  getVoteDocumentId,
  isVoteAccessCode,
  normalizeVoteAccessLink,
  VOTE_ACCESS_CODES,
  VOTE_ACCESS_COLLECTION,
  VOTE_ACCESS_MAX_VOTES,
} from "./vote-access";

export type VoteAccessErrorCode =
  | "access-link-not-found"
  | "access-link-inactive"
  | "access-link-full"
  | "already-voted";

export class VoteAccessError extends Error {
  constructor(public readonly code: VoteAccessErrorCode) {
    super(code);
    this.name = "VoteAccessError";
  }
}

export async function ensureVoteAccessLinks(database: Firestore) {
  const snapshot = await getDocs(collection(database, VOTE_ACCESS_COLLECTION));
  const existingIds = new Set(snapshot.docs.map((accessLink) => accessLink.id));
  const missingCodes = VOTE_ACCESS_CODES.filter((code) => !existingIds.has(code));
  if (missingCodes.length === 0) return 0;

  const batch = writeBatch(database);
  missingCodes.forEach((code) => {
    batch.set(doc(database, VOTE_ACCESS_COLLECTION, code), {
      voteCount: 0,
      maxVotes: VOTE_ACCESS_MAX_VOTES,
      isActive: true,
    });
  });
  await batch.commit();
  return missingCodes.length;
}

export async function submitVoteForAccessCode(
  database: Firestore,
  accessCode: string,
  userId: string,
  optionIds: string[],
) {
  if (!isVoteAccessCode(accessCode)) {
    throw new VoteAccessError("access-link-not-found");
  }

  const accessLinkRef = doc(database, VOTE_ACCESS_COLLECTION, accessCode);
  const voteRef = doc(database, "votes", getVoteDocumentId(userId, accessCode));

  await runTransaction(database, async (transaction) => {
    const accessLinkSnapshot = await transaction.get(accessLinkRef);
    const voteSnapshot = await transaction.get(voteRef);
    const accessLink = accessLinkSnapshot.exists()
      ? normalizeVoteAccessLink(accessCode, accessLinkSnapshot.data())
      : null;

    if (!accessLink) throw new VoteAccessError("access-link-not-found");
    if (!accessLink.isActive) throw new VoteAccessError("access-link-inactive");
    if (voteSnapshot.exists()) throw new VoteAccessError("already-voted");
    if (accessLink.voteCount >= accessLink.maxVotes) {
      throw new VoteAccessError("access-link-full");
    }

    transaction.update(accessLinkRef, {
      voteCount: accessLink.voteCount + 1,
    });
    transaction.set(voteRef, {
      accessCode,
      optionIds,
      userId,
      timestamp: Date.now(),
    });
  });
}

export function getRemainingVotes(accessLink: VoteAccessLink) {
  return Math.max(0, accessLink.maxVotes - accessLink.voteCount);
}
