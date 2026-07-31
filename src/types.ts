export interface Option {
  id: string;
  text: string;
}

export type HubId = 'hub1' | 'hub2' | 'hub4' | 'hub5';

export type TeamBuildingScores = Record<HubId, number>;

export interface TeamBuildingScoreDocument {
  scores: TeamBuildingScores;
  updatedAt: number;
}

export interface Config {
  id: string;
  question: string;
  options: Option[];
  isActive: boolean;
  endTime: number | null;
}

export interface Vote {
  id: string;
  optionId?: string; // Kept for backward compatibility
  optionIds?: string[]; // Supporting 3 selections
  userId: string;
  timestamp: number;
}
