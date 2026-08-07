import assert from "node:assert/strict";
import test from "node:test";
import { getCountdownState, getPollPhase } from "./countdown";

const startTime = 1_000_000;
const endTime = startTime + 5 * 60_000;

test("recognizes a scheduled poll and counts down to its start", () => {
  assert.equal(getPollPhase(true, startTime, endTime, startTime - 1), "scheduled");
  const countdown = getCountdownState(endTime, startTime - 1, startTime);
  assert.equal(countdown.isBeforeStart, true);
  assert.equal(countdown.isExpired, false);
});

test("recognizes an open poll and counts down to its end", () => {
  assert.equal(getPollPhase(true, startTime, endTime, startTime), "open");
  const countdown = getCountdownState(endTime, startTime + 1_000, startTime);
  assert.equal(countdown.isBeforeStart, false);
  assert.equal(countdown.isExpired, false);
});

test("recognizes a closed poll at the derived end time", () => {
  assert.equal(getPollPhase(true, startTime, endTime, endTime), "closed");
  assert.equal(getCountdownState(endTime, endTime, startTime).isExpired, true);
});
