
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { TaskBar } from './TaskBar';
import { TaskEditModal } from './TaskEditModal';
import { SettingsModal } from './SettingsModal';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, Settings, Plus } from 'lucide-react';
import type { Task, DayColors } from '@/types/gantt';

export const GanttChart: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Sample Study Task',
      description: 'Complete chapter 1 review',
      startDate: new Date(2024, 0, 15),
      endDate: new Date(2024, 0, 20),
      color: '#6b7280',
      milestones: ['Review notes', 'Practice problems']
    }
  ]);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dayColors, setDayColors] = useState<DayColors>({
    0: '#f3f4f6', // Sunday - light gray
    1: '#ffffff', // Monday - white
    2: '#ffffff', // Tuesday - white
    3: '#ffffff', // Wednesday - white
    4: '#ffffff', // Thursday - white
    5: '#ffffff', // Friday - white
    6: '#f9fafb'  // Saturday - very light gray
  });

  const chartRef = useRef<HTMLDivElement>(null);

  // Generate timeline dates (30 days from today)
  const generateTimeline = () => {
    const timeline = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      timeline.push(date);
    }
    return timeline;
  };

  const timeline = generateTimeline();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Group dates by month for header
  const monthGroups = timeline.reduce((acc, date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthNames[date.getMonth()], year: date.getFullYear().toString(), count: 0 };
    }
    acc[monthKey].count++;
    return acc;
  }, {} as Record<string, { month: string; year: string; count: number }>);

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: 'New Task',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      color: '#6b7280',
      milestones: []
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
    setIsEditModalOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <h1 className="text-2xl font-bold">Study Gantt Chart</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddTask} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          <Button onClick={toggleTheme} variant="outline" size="sm">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task List Sidebar */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Tasks</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tasks.map(task => (
              <div 
                key={task.id}
                className="p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleTaskClick(task)}
              >
                <div className="font-medium truncate">{task.title}</div>
                <div className="text-sm text-muted-foreground truncate">{task.description}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: task.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Month Header */}
          <div className="flex border-b border-border bg-card">
            {Object.entries(monthGroups).map(([key, { month, year, count }]) => (
              <div 
                key={key}
                className="border-r border-border px-2 py-3 text-center font-semibold bg-muted/30"
                style={{ minWidth: `${count * 60}px` }}
              >
                {month} {year}
              </div>
            ))}
          </div>

          {/* Day Header */}
          <div className="flex border-b border-border bg-card">
            {timeline.map((date, index) => (
              <div 
                key={index}
                className="w-15 border-r border-border p-2 text-center text-sm"
                style={{ 
                  backgroundColor: theme === 'dark' 
                    ? dayColors[date.getDay()] === '#ffffff' ? '#1f2937' : '#374151'
                    : dayColors[date.getDay()],
                  minWidth: '60px'
                }}
              >
                <div className="font-medium">{date.getDate()}</div>
                <div className="text-xs text-muted-foreground">{dayNames[date.getDay()]}</div>
              </div>
            ))}
          </div>

          {/* Tasks Timeline */}
          <div 
            ref={chartRef}
            className="flex-1 overflow-auto relative bg-background"
            style={{ minHeight: '400px' }}
          >
            {tasks.map((task, index) => (
              <TaskBar
                key={task.id}
                task={task}
                timeline={timeline}
                yPosition={index * 60 + 20}
                onUpdate={(updates) => handleTaskUpdate(task.id, updates)}
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskEditModal
        task={selectedTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={(updates) => {
          if (selectedTask) {
            handleTaskUpdate(selectedTask.id, updates);
          }
        }}
        onDelete={(taskId) => {
          setTasks(prev => prev.filter(task => task.id !== taskId));
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        dayColors={dayColors}
        onDayColorsChange={setDayColors}
      />
    </div>
  );

  function handleTaskUpdate(taskId: string, updates: Partial<Task>) {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }

  function handleTaskClick(task: Task) {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  }

  function handleAddTask() {
    const newTask: Task = {
      id: Date.now().toString(),
      title: 'New Task',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      color: '#6b7280',
      milestones: []
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
    setIsEditModalOpen(true);
  }
};
