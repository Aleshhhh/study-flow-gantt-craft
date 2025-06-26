
export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  color: string;
  milestones: string[];
}

export interface DayColors {
  [dayIndex: number]: string; // 0 = Sunday, 1 = Monday, etc.
}
