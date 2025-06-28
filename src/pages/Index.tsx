
import React, { useState } from 'react';
import { GanttChart } from "@/components/GanttChart";
import { TaskEditModal } from "@/components/TaskEditModal";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Task } from '@/types/gantt';

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Sample Task 1',
      description: 'This is a sample task',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: '#6b7280',
      textColor: '#ffffff',
      progressBarColor: '#22c55e',
      milestones: ['Milestone 1'],
      status: 'todo'
    },
    {
      id: '2',
      title: 'Sample Task 2',
      description: 'Another sample task',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      color: '#dc2626',
      textColor: '#ffffff',
      progressBarColor: '#3b82f6',
      milestones: ['Milestone 2'],
      status: 'in-progress'
    }
  ]);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSave = (updates: Partial<Task>) => {
    if (selectedTask) {
      handleTaskUpdate(selectedTask.id, updates);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <GanttChart 
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskClick={handleTaskClick}
        />
        <TaskEditModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      </div>
    </ThemeProvider>
  );
};

export default Index;
