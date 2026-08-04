import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFinalLeaderboard,
  rankFinalResults,
  selectCanonicalHubResults,
} from './results-scoring';

const results = [
  { id: '1', text: 'Hub 1', voteCount: 10 },
  { id: '2', text: 'Hub 2', voteCount: 10 },
  { id: '4', text: 'Hub 4', voteCount: 8 },
  { id: '5', text: 'Hub 5', voteCount: 7 },
];

test('awards dense vote ranks and points', () => {
  assert.deepEqual(
    rankFinalResults(results).map(({ rank, points }) => ({ rank, points })),
    [
      { rank: 1, points: 40 },
      { rank: 1, points: 40 },
      { rank: 2, points: 30 },
      { rank: 3, points: 20 },
    ],
  );
});

test('combines Team Building and vote points with dense final ranking', () => {
  const leaderboard = createFinalLeaderboard(results, {
    hub1: 100,
    hub2: 90,
    hub4: 110,
    hub5: 100,
  })!;

  assert.deepEqual(
    leaderboard.map(({ hubId, totalScore, finalRank }) => ({ hubId, totalScore, finalRank })),
    [
      { hubId: 'hub4', totalScore: 140, finalRank: 1 },
      { hubId: 'hub1', totalScore: 140, finalRank: 2 },
      { hubId: 'hub2', totalScore: 130, finalRank: 3 },
      { hubId: 'hub5', totalScore: 120, finalRank: 4 },
    ],
  );
});

test('uses Team Building score to break a final total tie', () => {
  const tieResults = [
    { id: '1', text: 'Hub 1', voteCount: 8 },
    { id: '2', text: 'Hub 2', voteCount: 10 },
    { id: '4', text: 'Hub 4', voteCount: 7 },
    { id: '5', text: 'Hub 5', voteCount: 6 },
  ];
  const leaderboard = createFinalLeaderboard(tieResults, {
    hub1: 110,
    hub2: 100,
    hub4: 80,
    hub5: 80,
  })!;

  assert.deepEqual(
    leaderboard.slice(0, 2).map(({ hubId, totalScore, teamBuildingScore, finalRank }) => ({
      hubId,
      totalScore,
      teamBuildingScore,
      finalRank,
    })),
    [
      { hubId: 'hub1', totalScore: 140, teamBuildingScore: 110, finalRank: 1 },
      { hubId: 'hub2', totalScore: 140, teamBuildingScore: 100, finalRank: 2 },
    ],
  );
});

test('leaves an all-zero final scoreboard unranked', () => {
  const zeroResults = results.map((result) => ({ ...result, voteCount: 0 }));
  const leaderboard = createFinalLeaderboard(zeroResults, {
    hub1: 0,
    hub2: 0,
    hub4: 0,
    hub5: 0,
  })!;

  assert.ok(leaderboard.every((entry) => entry.finalRank === null));
});

test('rejects unknown, duplicate, or missing Hub options', () => {
  const invalidResults = [
    { id: 'unknown', text: 'Khách mời', voteCount: 99 },
    { id: 'hub1', text: 'Hub 1', voteCount: 10 },
    { id: 'hub1-duplicate', text: 'Hub 1', voteCount: 50 },
    { id: 'hub2', text: 'Hub 2', voteCount: 8 },
    { id: 'hub4', text: 'Hub 4', voteCount: 6 },
    { id: 'hub5', text: 'Hub 5', voteCount: 4 },
  ];

  assert.equal(selectCanonicalHubResults(invalidResults), null);
  assert.equal(createFinalLeaderboard(
    invalidResults,
    { hub1: 0, hub2: 0, hub4: 0, hub5: 0 },
  ), null);
  assert.equal(selectCanonicalHubResults(results.slice(0, 2)), null);
});
