import type { Option } from './types';

const canonicalHubSequence = ['Hub 1', 'Hub 2', 'Hub 4', 'Hub 5'];

function getHubNumber(optionText: string) {
  return optionText.match(/\bhub\s*(\d+)\b/i)?.[1];
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
