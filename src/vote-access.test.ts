import assert from "node:assert/strict";
import test from "node:test";
import {
  getVoteDocumentId,
  isVoteAccessCode,
  normalizeVoteAccessLink,
  VOTE_ACCESS_CODES,
  VOTE_ACCESS_MAX_VOTES,
} from "./vote-access";

test("defines exactly 16 unique access codes with a ten-vote quota", () => {
  assert.equal(VOTE_ACCESS_CODES.length, 16);
  assert.equal(new Set(VOTE_ACCESS_CODES).size, 16);
  assert.equal(VOTE_ACCESS_MAX_VOTES, 10);
  assert.ok(isVoteAccessCode("7f3k9m2q8x1a"));
  assert.equal(isVoteAccessCode("unknown-code"), false);
});

test("builds a per-browser and per-access-code vote document id", () => {
  assert.equal(
    getVoteDocumentId("anonymous-user", "7f3k9m2q8x1a"),
    "vote_anonymous-user_7f3k9m2q8x1a",
  );
});

test("accepts only a complete ten-vote access-link document", () => {
  const link = normalizeVoteAccessLink("7f3k9m2q8x1a", {
    voteCount: 3,
    maxVotes: 10,
    isActive: false,
  });

  assert.deepEqual(link, {
    id: "7f3k9m2q8x1a",
    voteCount: 3,
    maxVotes: 10,
    isActive: false,
  });
  assert.equal(normalizeVoteAccessLink("7f3k9m2q8x1a", {
    voteCount: 12,
    maxVotes: 10,
    isActive: true,
  }), null);
  assert.equal(normalizeVoteAccessLink("unknown-code", {}), null);
});
