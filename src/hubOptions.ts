import type { HubId, Option, TeamBuildingScores } from './types';

const canonicalHubSequence = ['Hub 1', 'Hub 2', 'Hub 4', 'Hub 5'];

export interface HubDefinition {
  id: HubId;
  label: string;
  artwork: string;
  artworkAlt: string;
}

export const HUB_DEFINITIONS: readonly HubDefinition[] = [
  { id: 'hub1', label: 'Hub 1', artwork: 'images/results/hub-1.webp', artworkAlt: 'Hồng Tỷ - Hub 1' },
  { id: 'hub2', label: 'Hub 2', artwork: 'images/results/hub-2.webp', artworkAlt: 'Hub 2 - Đã đỉnh, lại còn đỏ' },
  { id: 'hub4', label: 'Hub 4', artwork: 'images/results/hub-4.webp', artworkAlt: 'Gặp Hub 4 - Hết đường trốn' },
  { id: 'hub5', label: 'Hub 5', artwork: 'images/results/hub-5.webp', artworkAlt: 'Hub 5 - Đụng là bám' },
];

export function createEmptyTeamBuildingScores(): TeamBuildingScores {
  return { hub1: 0, hub2: 0, hub4: 0, hub5: 0 };
}

export function normalizeTeamBuildingScores(value: unknown): TeamBuildingScores {
  const source = value && typeof value === 'object'
    ? value as Partial<Record<HubId, unknown>>
    : {};

  return HUB_DEFINITIONS.reduce<TeamBuildingScores>((scores, hub) => {
    const score = source[hub.id];
    scores[hub.id] = typeof score === 'number' && Number.isFinite(score) && score >= 0
      ? Math.trunc(score)
      : 0;
    return scores;
  }, createEmptyTeamBuildingScores());
}

function getHubNumber(optionText: string) {
  return optionText.match(/\bhub\s*(\d+)\b/i)?.[1];
}

export function getHubId(optionText: string): HubId | null {
  const hubNumber = getHubNumber(optionText);
  return hubNumber === '1' || hubNumber === '2' || hubNumber === '4' || hubNumber === '5'
    ? `hub${hubNumber}` as HubId
    : null;
}

function isLegacyHubSequence(options: Option[]) {
  return options.length === 4
    && options.every((option, index) => getHubNumber(option.text) === String(index + 1));
}

export function normalizeHubOptions(options: Option[]) {
  const shouldReplaceLegacySequence = isLegacyHubSequence(options);

  return options.map((option, index) => {
    const hubNumber = getHubNumber(option.text);
    const text = shouldReplaceLegacySequence
      ? canonicalHubSequence[index]
      : hubNumber && ['1', '2', '4', '5'].includes(hubNumber)
        ? `Hub ${hubNumber}`
        : option.text;

    return text === option.text ? option : { ...option, text };
  });
}

export function getHubOptionClass(optionText: string) {
  switch (getHubNumber(optionText)) {
    case '1':
      return 'vote-option--hub-1';
    case '2':
      return 'vote-option--hub-2';
    case '4':
      return 'vote-option--hub-4';
    case '5':
      return 'vote-option--hub-5';
    default:
      return 'vote-option--hub-default';
  }
}

export function getHubResultBarClass(optionText: string) {
  return getHubResultClass(optionText, 'results-bar');
}

export function getHubResultTextClass(optionText: string) {
  return getHubResultClass(optionText, 'results-column');
}

function getHubResultClass(optionText: string, prefix: 'results-bar' | 'results-column') {
  switch (getHubNumber(optionText)) {
    case '1':
      return `${prefix}--hub-1`;
    case '2':
      return `${prefix}--hub-2`;
    case '4':
      return `${prefix}--hub-4`;
    case '5':
      return `${prefix}--hub-5`;
    default:
      return `${prefix}--default`;
  }
}
