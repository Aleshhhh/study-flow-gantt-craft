
export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  color: string;
  milestones: string[];
  status?: string;
}

export interface DayColors {
  [dayIndex: number]: string; // 0 = Sunday, 1 = Monday, etc.
}

export interface KanbanColumn {
  id: string;
  title: string;
  taskIds: string[];
}

export interface CustomColors {
  taskBackground: string;
  taskText: string;
  progressBar: string;
}
