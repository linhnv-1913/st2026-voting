export interface Option {
  id: string;
  text: string;
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
