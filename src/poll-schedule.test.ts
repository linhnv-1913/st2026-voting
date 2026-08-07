import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEndTime,
  DEFAULT_DURATION_MINUTES,
  isValidDurationMinutes,
} from "./poll-schedule";

test("derives end time from start time and duration", () => {
  const startTime = 1_000_000;
  assert.equal(
    calculateEndTime(startTime, DEFAULT_DURATION_MINUTES),
    startTime + 5 * 60_000,
  );
});

test("accepts only positive integer durations", () => {
  assert.equal(isValidDurationMinutes(1), true);
  assert.equal(isValidDurationMinutes(5), true);
  assert.equal(isValidDurationMinutes(0), false);
  assert.equal(isValidDurationMinutes(1.5), false);
});
