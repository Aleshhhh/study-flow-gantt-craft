
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TaskBar } from './TaskBar';
import { TaskEditModal } from './TaskEditModal';
import { SettingsModal } from './SettingsModal';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, Settings, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task, DayColors } from '@/types/gantt';

export const GanttChart: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Sample Study Task',
      description: 'Complete chapter 1 review and practice problems. This involves reading through all the material, taking notes, and working through the exercises at the end of the chapter.',
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, date: new Date() });
  const [newTaskPreview, setNewTaskPreview] = useState<{ startDate: Date; endDate: Date; x: number } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Generate timeline dates (60 days from current date)
  const generateTimeline = () => {
    const timeline = [];
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 15); // Start 15 days before current date
    startDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
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

  // Arrange tasks in rows to avoid overlap
  const arrangeTasksInRows = () => {
    const rows: Task[][] = [];
    const sortedTasks = [...tasks].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    for (const task of sortedTasks) {
      let placed = false;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const hasOverlap = row.some(existingTask => 
          (task.startDate <= existingTask.endDate && task.endDate >= existingTask.startDate)
        );
        if (!hasOverlap) {
          row.push(task);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([task]);
      }
    }
    
    return rows.flat().map((task, index) => ({
      ...task,
      rowIndex: rows.findIndex(row => row.includes(task))
    }));
  };

  const tasksWithRows = arrangeTasksInRows();

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
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      color: '#6b7280',
      milestones: []
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
    setIsEditModalOpen(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // Handle horizontal scrolling with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (timelineRef.current && timelineRef.current.contains(e.target as Node)) {
        e.preventDefault();
        timelineRef.current.scrollLeft += e.deltaY;
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  // Handle drag to create tasks
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
      const dayIndex = Math.floor(x / 60);
      const date = timeline[dayIndex];
      
      if (date) {
        setIsDragging(true);
        setDragStart({ x, date });
        setNewTaskPreview({ startDate: date, endDate: date, x });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && newTaskPreview && chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
      const dayIndex = Math.floor(x / 60);
      const endDate = timeline[dayIndex] || newTaskPreview.endDate;
      
      setNewTaskPreview(prev => prev ? { ...prev, endDate } : null);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && newTaskPreview) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: 'New Task',
        description: '',
        startDate: newTaskPreview.startDate < newTaskPreview.endDate ? newTaskPreview.startDate : newTaskPreview.endDate,
        endDate: newTaskPreview.startDate < newTaskPreview.endDate ? newTaskPreview.endDate : newTaskPreview.startDate,
        color: '#6b7280',
        milestones: []
      };
      setTasks(prev => [...prev, newTask]);
      setSelectedTask(newTask);
      setIsEditModalOpen(true);
    }
    setIsDragging(false);
    setNewTaskPreview(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card rounded-t-xl">
        <h1 className="text-2xl font-bold">Study Gantt Chart</h1>
        <div className="flex items-center gap-3">
          <Button onClick={handleAddTask} size="sm" className="rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="rounded-full">
            <Settings className="w-4 h-4" />
          </Button>
          <Button onClick={toggleTheme} variant="outline" size="sm" className="rounded-full">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden rounded-b-xl">
        {/* Calendar Sidebar */}
        <div className="w-80 border-r border-border bg-card flex flex-col rounded-bl-xl">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold mb-4">Calendar</h2>
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && setCurrentDate(date)}
              className="rounded-lg"
            />
          </div>
          <div className="flex-1 p-4">
            <h3 className="font-medium mb-3">Navigation</h3>
            <div className="flex gap-2">
              <Button onClick={() => navigateDate('prev')} variant="outline" size="sm" className="rounded-full flex-1">
                <ChevronLeft className="w-4 h-4" />
                Earlier
              </Button>
              <Button onClick={() => navigateDate('next')} variant="outline" size="sm" className="rounded-full flex-1">
                Later
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-br-xl">
          {/* Month Header */}
          <div className="flex border-b border-border bg-card overflow-hidden">
            {Object.entries(monthGroups).map(([key, { month, year, count }]) => (
              <div 
                key={key}
                className="border-r border-border px-4 py-4 text-center font-semibold bg-muted/30 rounded-t-lg"
                style={{ minWidth: `${count * 60}px` }}
              >
                {month} {year}
              </div>
            ))}
          </div>

          {/* Day Header */}
          <div 
            ref={timelineRef}
            className="flex border-b border-border bg-card overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            style={{ scrollbarWidth: 'thin' }}
          >
            {timeline.map((date, index) => {
              const isWeekStart = date.getDay() === 0;
              const isMonthStart = date.getDate() === 1;
              return (
                <div 
                  key={index}
                  className="relative border-r border-border p-3 text-center text-sm rounded-t-lg transition-colors duration-200"
                  style={{ 
                    backgroundColor: theme === 'dark' 
                      ? dayColors[date.getDay()] === '#ffffff' ? '#1f2937' : '#374151'
                      : dayColors[date.getDay()],
                    minWidth: '60px'
                  }}
                >
                  {/* Week divider */}
                  {isWeekStart && (
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-border opacity-60" />
                  )}
                  {/* Month divider */}
                  {isMonthStart && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="font-medium">{date.getDate()}</div>
                  <div className="text-xs text-muted-foreground">{dayNames[date.getDay()]}</div>
                </div>
              );
            })}
          </div>

          {/* Tasks Timeline */}
          <div 
            ref={chartRef}
            className="flex-1 overflow-auto relative bg-background rounded-br-xl"
            style={{ minHeight: '500px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Week and Month lines */}
            {timeline.map((date, index) => {
              const isWeekStart = date.getDay() === 0;
              const isMonthStart = date.getDate() === 1;
              return (
                <React.Fragment key={`lines-${index}`}>
                  {isWeekStart && (
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-border/30 pointer-events-none"
                      style={{ left: `${index * 60}px` }}
                    />
                  )}
                  {isMonthStart && (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-border/50 pointer-events-none"
                      style={{ left: `${index * 60}px` }}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Task bars */}
            {tasksWithRows.map((task) => (
              <TaskBar
                key={task.id}
                task={task}
                timeline={timeline}
                yPosition={(task as any).rowIndex * 80 + 20}
                onUpdate={(updates) => handleTaskUpdate(task.id, updates)}
                onClick={() => handleTaskClick(task)}
              />
            ))}

            {/* New task preview */}
            {newTaskPreview && (
              <div
                className="absolute rounded-lg shadow-sm border border-dashed border-muted-foreground/50 bg-muted/50 pointer-events-none transition-all duration-150"
                style={{
                  left: `${Math.min(
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.startDate.toDateString()),
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.endDate.toDateString())
                  ) * 60}px`,
                  top: '20px',
                  width: `${Math.abs(
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.endDate.toDateString()) -
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.startDate.toDateString())
                  ) * 60 + 60}px`,
                  height: '36px'
                }}
              />
            )}
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
};
