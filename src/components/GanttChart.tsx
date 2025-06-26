
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
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [newTaskPreview, setNewTaskPreview] = useState<{ startDate: Date; endDate: Date; x: number; y: number } | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const timelineRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const dayWidth = 180; // Made days much wider

  // Generate timeline dates (60 days from current date)
  const generateTimeline = () => {
    const timeline = [];
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 15);
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

  // Group dates by month for header - Fixed TypeScript error
  const monthGroups = timeline.reduce((acc: Record<string, { month: string; year: string; count: number }>, date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthNames[date.getMonth()], year: date.getFullYear().toString(), count: 0 };
    }
    acc[monthKey].count++;
    return acc;
  }, {});

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
    
    // Smooth scroll animation
    if (timelineRef.current) {
      const scrollAmount = direction === 'next' ? dayWidth * 7 : -dayWidth * 7;
      timelineRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Handle horizontal scrolling with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (timelineRef.current && timelineRef.current.contains(e.target as Node)) {
        e.preventDefault();
        timelineRef.current.scrollLeft += e.deltaY;
        setScrollOffset(timelineRef.current.scrollLeft);
      }
    };

    const timelineElement = timelineRef.current;
    if (timelineElement) {
      timelineElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => timelineElement.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Handle drag to create tasks - Only with left mouse button
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    if (e.target === chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
      const y = e.clientY - rect.top;
      const dayIndex = Math.floor(x / dayWidth);
      const date = timeline[dayIndex];
      
      if (date) {
        setIsDragging(true);
        setNewTaskPreview({ startDate: date, endDate: date, x, y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && newTaskPreview && chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
      const dayIndex = Math.floor(x / dayWidth);
      const endDate = timeline[dayIndex] || newTaskPreview.endDate;
      
      setNewTaskPreview(prev => prev ? { ...prev, endDate } : null);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && newTaskPreview) {
      // Find appropriate row for the new task
      const taskY = newTaskPreview.y;
      const rowIndex = Math.floor((taskY - 20) / 80);
      
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

  // Handle calendar date selection
  const handleCalendarDateSelect = (date: Date | undefined) => {
    setSelectedCalendarDate(date);
    if (date && timelineRef.current) {
      // Find the date in timeline and scroll to it
      const dayIndex = timeline.findIndex(d => d.toDateString() === date.toDateString());
      if (dayIndex !== -1) {
        const scrollPosition = dayIndex * dayWidth - (timelineRef.current.clientWidth / 2) + (dayWidth / 2);
        timelineRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card">
        <h1 className="text-2xl font-bold">Study Gantt Chart</h1>
        <div className="flex items-center gap-3">
          <Button onClick={handleAddTask} size="sm" className="rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="rounded-lg">
            <Settings className="w-4 h-4" />
          </Button>
          <Button onClick={toggleTheme} variant="outline" size="sm" className="rounded-lg">
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Sidebar */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold mb-4">Calendar</h2>
            <Calendar
              mode="single"
              selected={selectedCalendarDate}
              onSelect={handleCalendarDateSelect}
              className="rounded-lg"
            />
          </div>
          <div className="flex-1 p-4">
            <h3 className="font-medium mb-3">Navigation</h3>
            <div className="flex gap-2">
              <Button onClick={() => navigateDate('prev')} variant="outline" size="sm" className="rounded-lg flex-1">
                <ChevronLeft className="w-4 h-4" />
                Earlier
              </Button>
              <Button onClick={() => navigateDate('next')} variant="outline" size="sm" className="rounded-lg flex-1">
                Later
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Month Header */}
          <div 
            className="flex border-b border-border bg-card overflow-hidden"
            style={{ transform: `translateX(-${scrollOffset}px)` }}
          >
            {Object.entries(monthGroups).map(([key, { month, year, count }]) => (
              <div 
                key={key}
                className="border-r border-border px-4 py-4 text-center font-semibold bg-muted/30"
                style={{ minWidth: `${count * dayWidth}px` }}
              >
                {month} {year}
              </div>
            ))}
          </div>

          {/* Day Header */}
          <div 
            ref={timelineRef}
            className="flex border-b border-border bg-card overflow-x-auto scrollbar-thin"
            onScroll={(e) => setScrollOffset((e.target as HTMLDivElement).scrollLeft)}
          >
            {timeline.map((date, index) => {
              const isWeekStart = date.getDay() === 0;
              const isMonthStart = date.getDate() === 1;
              const isSelectedDate = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
              
              return (
                <div 
                  key={index}
                  className={`relative border-r border-border p-4 text-center text-sm transition-all duration-200 ${
                    isSelectedDate ? 'bg-primary/20 border-primary' : ''
                  }`}
                  style={{ 
                    backgroundColor: isSelectedDate ? undefined : (theme === 'dark' 
                      ? dayColors[date.getDay()] === '#ffffff' ? '#1f2937' : '#374151'
                      : dayColors[date.getDay()]),
                    minWidth: `${dayWidth}px`,
                    borderLeftWidth: isWeekStart ? '1px' : '0px',
                    borderLeftColor: isWeekStart ? 'hsl(var(--border))' : 'transparent',
                    borderLeftMargin: isMonthStart ? '2px' : '0px'
                  }}
                >
                  {/* Month divider */}
                  {isMonthStart && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
                  )}
                  <div className="font-semibold text-lg">{date.getDate()}</div>
                  <div className="text-xs text-muted-foreground mt-1">{dayNames[date.getDay()]}</div>
                </div>
              );
            })}
          </div>

          {/* Tasks Timeline */}
          <div 
            ref={chartRef}
            className="flex-1 overflow-auto relative bg-background"
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
                      className="absolute top-0 bottom-0 w-px bg-border/20 pointer-events-none"
                      style={{ left: `${index * dayWidth - scrollOffset}px` }}
                    />
                  )}
                  {isMonthStart && (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-border/40 pointer-events-none"
                      style={{ left: `${index * dayWidth - scrollOffset}px` }}
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
                dayWidth={dayWidth}
                scrollOffset={scrollOffset}
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
                  ) * dayWidth - scrollOffset}px`,
                  top: `${Math.floor((newTaskPreview.y - 20) / 80) * 80 + 20}px`,
                  width: `${Math.abs(
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.endDate.toDateString()) -
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.startDate.toDateString())
                  ) * dayWidth + dayWidth}px`,
                  height: '44px'
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
