
import { useState } from "react";
import { GanttChart } from "@/components/GanttChart";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Task } from "@/types/gantt";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Project Planning',
      description: 'Initial project planning and requirements gathering',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-10'),
      color: '#3b82f6',
      milestones: ['Requirements Done'],
      status: 'Done'
    },
    {
      id: '2',
      title: 'Design Phase',
      description: 'UI/UX design and wireframing',
      startDate: new Date('2024-01-08'),
      endDate: new Date('2024-01-20'),
      color: '#10b981',
      milestones: ['Wireframes', 'Mockups'],
      status: 'In Progress'
    },
    {
      id: '3',
      title: 'Development',
      description: 'Frontend and backend development',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-28'),
      color: '#f59e0b',
      milestones: ['MVP', 'Testing'],
      status: 'To Do'
    }
  ]);

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleTaskCreate = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
  };

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <GanttChart 
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          onTaskCreate={handleTaskCreate}
          onTaskClick={handleTaskClick}
        />
      </div>
    </ThemeProvider>
  );
};

export default Index;
