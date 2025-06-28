
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TaskBar } from './TaskBar';
import { TaskEditModal } from './TaskEditModal';
import { SettingsModal } from './SettingsModal';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, Settings, Plus, BarChart3, Kanban, Calendar as CalendarIcon, Menu } from 'lucide-react';
import type { Task, DayColors } from '@/types/gantt';
import { KanbanView } from './KanbanView';

interface MonthGroup {
  month: string;
  year: string;
  count: number;
}

type ViewMode = 'gantt' | 'kanban';

export const GanttChart: React.FC = () => {
  const numberOfYearsToShow = 5;
  
  const { theme, toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Sample Study Task',
      description: 'Complete chapter 1 review and practice problems. This involves reading through all the material, taking notes, and working through the exercises at the end of the chapter.',
      startDate: new Date(2024, 0, 15),
      endDate: new Date(2024, 0, 20),
      color: '#6b7280',
      milestones: ['Review notes', 'Practice problems'],
      status: 'To Do'
    }
  ]);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dayColors, setDayColors] = useState<DayColors>({
    0: '#f3f4f6', 1: '#ffffff', 2: '#ffffff', 3: '#ffffff', 4: '#ffffff', 5: '#ffffff', 6: '#f9fafb'
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [newTaskPreview, setNewTaskPreview] = useState<{ startDate: Date; endDate: Date; x: number; y: number } | null>(null);
  const [currentNavDate, setCurrentNavDate] = useState<Date>(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [taskBeingMoved, setTaskBeingMoved] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragToCreate, setIsDragToCreate] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  const dayWidth = 120;

  // Generate timeline based on current navigation date
  const generateTimeline = () => {
    const timeline = [];
    const startDate = new Date(currentNavDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + numberOfYearsToShow);

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      timeline.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return timeline;
  };

  const [timeline, setTimeline] = useState<Date[]>([]);
  
  useEffect(() => {
    setTimeline(generateTimeline());
  }, [currentNavDate, numberOfYearsToShow]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthGroups: Record<string, MonthGroup> = timeline.reduce((acc: Record<string, MonthGroup>, date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthNames[date.getMonth()], year: date.getFullYear().toString(), count: 0 };
    }
    acc[monthKey].count++;
    return acc;
  }, {});

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
    
    return rows.flat().map((task) => ({
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
    // Only open modal if we're not dragging and not in the middle of a drag operation
    if (!taskBeingMoved && !isDragToCreate) {
      setSelectedTask(task);
      setIsEditModalOpen(true);
    }
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: 'New Task',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      color: '#6b7280',
      milestones: [],
      status: 'To Do'
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
    setIsEditModalOpen(true);
  };
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (headerRef.current) headerRef.current.scrollLeft = scrollLeft;
    if (timelineRef.current) timelineRef.current.scrollLeft = scrollLeft;
  };
  
  const handleCalendarDateSelect = (date: Date | undefined) => {
    setSelectedCalendarDate(date);
    if (date && chartRef.current) {
      setCurrentNavDate(date);
      const dateIndex = timeline.findIndex(d => d.toDateString() === date.toDateString());
      if (dateIndex !== -1) {
        const scrollPosition = dateIndex * dayWidth - (chartRef.current.clientWidth / 2) + (dayWidth / 2);
        chartRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }
    setIsCalendarOpen(false);
  };

  // Task drag handlers for vertical reordering
  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
    setTaskBeingMoved(taskId);
  };

  const handleTaskDragOver = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
  };

  const handleTaskDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (draggedTaskId && draggedTaskId !== targetTaskId) {
      const draggedTask = tasks.find(t => t.id === draggedTaskId);
      const targetTask = tasks.find(t => t.id === targetTaskId);
      
      if (draggedTask && targetTask) {
        const newTasks = [...tasks];
        const draggedIndex = newTasks.findIndex(t => t.id === draggedTaskId);
        const targetIndex = newTasks.findIndex(t => t.id === targetTaskId);
        
        // Remove dragged task and insert at target position
        const [removed] = newTasks.splice(draggedIndex, 1);
        newTasks.splice(targetIndex, 0, removed);
        
        setTasks(newTasks);
      }
    }
    setDraggedTaskId(null);
    setTaskBeingMoved(null);
  };

  // Improved mouse event handlers for drag-to-add functionality
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !chartRef.current || taskBeingMoved) return;
    
    // Only start dragging if clicking on the chart background, not on task elements
    const target = e.target as HTMLElement;
    if (target === chartRef.current || target.closest('[data-chart-background]')) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + chartRef.current.scrollLeft;
      const y = e.clientY - rect.top;
      
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setIsDragToCreate(false);
      
      const dayIndex = Math.floor(x / dayWidth);
      const date = timeline[dayIndex];
      
      if (date) {
        setNewTaskPreview({ startDate: date, endDate: date, x, y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!newTaskPreview || !chartRef.current || taskBeingMoved) return;
    
    // Check if we've moved enough to consider this a drag operation
    if (dragStartPos && !isDragToCreate) {
      const deltaX = Math.abs(e.clientX - dragStartPos.x);
      const deltaY = Math.abs(e.clientY - dragStartPos.y);
      if (deltaX > 5 || deltaY > 5) {
        setIsDragToCreate(true);
        setIsDragging(true);
      }
    }
    
    if (isDragToCreate) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + chartRef.current.scrollLeft;
      const dayIndex = Math.floor(x / dayWidth);
      const endDate = timeline[dayIndex] || newTaskPreview.endDate;
      
      setNewTaskPreview(prev => prev ? { ...prev, endDate } : null);
    }
  };

  const handleMouseUp = () => {
    if (isDragToCreate && newTaskPreview && !taskBeingMoved) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: 'New Task',
        description: '',
        startDate: newTaskPreview.startDate < newTaskPreview.endDate ? newTaskPreview.startDate : newTaskPreview.endDate,
        endDate: newTaskPreview.startDate < newTaskPreview.endDate ? newTaskPreview.endDate : newTaskPreview.startDate,
        color: '#6b7280',
        milestones: [],
        status: 'To Do'
      };
      setTasks(prev => [...prev, newTask]);
      setSelectedTask(newTask);
      setIsEditModalOpen(true);
    }
    
    setIsDragging(false);
    setNewTaskPreview(null);
    setDragStartPos(null);
    setIsDragToCreate(false);
  };

  if (viewMode === 'kanban') {
    return (
      <>
        <KanbanView 
          tasks={tasks} 
          onTaskUpdate={handleTaskUpdate}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          onViewModeChange={setViewMode}
          onSettingsOpen={() => setIsSettingsOpen(true)}
          onCalendarOpen={() => setIsCalendarOpen(true)}
          onThemeToggle={toggleTheme}
          theme={theme}
          onTaskDragStart={handleTaskDragStart}
          onTaskDragOver={handleTaskDragOver}
          onTaskDrop={handleTaskDrop}
          draggedTaskId={draggedTaskId}
        />
        
        {/* Modals */}
        <TaskEditModal 
          task={selectedTask} 
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
          onSave={(updates) => { if (selectedTask) { handleTaskUpdate(selectedTask.id, updates); } }}
          onDelete={(taskId) => { setTasks(prev => prev.filter(task => task.id !== taskId)); setIsEditModalOpen(false); setSelectedTask(null); }}
        />
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          dayColors={dayColors} 
          onDayColorsChange={setDayColors} 
        />
        <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <SheetContent side="left" className="w-auto">
            <SheetHeader><SheetTitle>Go to Date</SheetTitle></SheetHeader>
            <Calendar mode="single" selected={selectedCalendarDate} onSelect={handleCalendarDateSelect} className="rounded-xl mt-4" />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-6 border-b border-border bg-card">
        <h1 className="text-base sm:text-2xl font-bold truncate">Study Gantt</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button onClick={() => setViewMode('gantt')} variant="default" size="sm" className="rounded-md">
                <BarChart3 className="w-4 h-4 mr-2" /> Gantt
              </Button>
              <Button onClick={() => setViewMode('kanban')} variant="ghost" size="sm" className="rounded-md">
                <Kanban className="w-4 h-4 mr-2" /> Kanban
              </Button>
            </div>
            <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-auto">
                <SheetHeader><SheetTitle>Go to Date</SheetTitle></SheetHeader>
                <Calendar mode="single" selected={selectedCalendarDate} onSelect={handleCalendarDateSelect} className="rounded-xl mt-4" />
              </SheetContent>
            </Sheet>
            <Button onClick={handleAddTask} size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
            <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Settings className="w-4 h-4" />
            </Button>
            <Button onClick={toggleTheme} variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-card rounded-none sm:rounded-xl m-0 sm:m-2 shadow-sm">
          {/* Month Header */}
          <div ref={headerRef} className="flex border-b border-border bg-muted/20 overflow-hidden select-none">
            {Object.entries(monthGroups).map(([key, group]) => (
              <div key={key} className="border-r border-border px-1 sm:px-4 py-1 sm:py-4 text-center font-semibold bg-muted/30 text-xs sm:text-sm"
                style={{ minWidth: `${group.count * dayWidth}px` }}
              >
                <div className="sm:hidden">{group.month.slice(0, 3)}</div>
                <div className="hidden sm:block">{group.month} {group.year}</div>
              </div>
            ))}
          </div>

          <div ref={timelineRef} className="flex border-b border-border bg-card overflow-hidden select-none">
            {timeline.map((date, index) => (
              <div key={index} className={`relative border-r border-border p-1 sm:p-4 text-center text-xs sm:text-sm transition-all duration-300 hover:bg-muted/20 ${selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString() ? 'bg-primary/20 border-primary shadow-md' : ''}`}
                style={{ backgroundColor: selectedCalendarDate ? undefined : (theme === 'dark' ? (dayColors[date.getDay()] === '#ffffff' ? '#1f2937' : '#374151') : dayColors[date.getDay()]), minWidth: `${dayWidth}px` }}
              >
                {date.getDate() === 1 && (<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 rounded-full" />)}
                <div className="font-semibold text-sm sm:text-lg">{date.getDate()}</div>
                <div className="text-xs text-muted-foreground mt-1 hidden sm:block">{dayNames[date.getDay()]}</div>
                <div className="text-xs text-muted-foreground mt-1 sm:hidden">{dayNames[date.getDay()].slice(0, 1)}</div>
              </div>
            ))}
          </div>

          {/* Tasks Timeline */}
          <div 
            ref={chartRef}
            className="flex-1 overflow-auto relative bg-background"
            style={{ minHeight: '200px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onScroll={handleScroll}
            data-chart-background="true"
          >
            <div className="relative" style={{ width: `${timeline.length * dayWidth}px`, height: `${tasksWithRows.length * 60 + 40}px` }}>
              {/* Grid lines */}
              {timeline.map((date, index) => {
                const isMonthStart = date.getDate() === 1;
                return (
                  <div key={`line-${index}`} className={`absolute top-0 bottom-0 w-px ${isMonthStart ? 'bg-border/30' : 'bg-border/10'}`} style={{ left: `${index * dayWidth}px` }}/>
                );
              })}

              {/* Task bars with drag and drop */}
              {tasksWithRows.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleTaskDragStart(task.id)}
                  onDragOver={(e) => handleTaskDragOver(e, task.id)}
                  onDrop={(e) => handleTaskDrop(e, task.id)}
                  className={`${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                >
                  <TaskBar
                    task={task} 
                    timeline={timeline} 
                    yPosition={(task as any).rowIndex * 60 + 10}
                    dayWidth={dayWidth} 
                    scrollOffset={0}
                    onUpdate={(updates) => handleTaskUpdate(task.id, updates)}
                    onClick={() => handleTaskClick(task)}
                    onDragStart={() => handleTaskDragStart(task.id)}
                  />
                </div>
              ))}

              {/* New task preview */}
              {newTaskPreview && isDragToCreate && !taskBeingMoved && (
                <div className="absolute rounded-xl shadow-sm border border-dashed border-muted-foreground/50 bg-muted/30 pointer-events-none transition-all duration-150"
                  style={{
                    left: `${timeline.findIndex(d => d.toDateString() === newTaskPreview.startDate.toDateString()) * dayWidth}px`,
                    top: `${Math.floor((newTaskPreview.y) / 60) * 60 + 10}px`,
                    width: `${(Math.abs(timeline.findIndex(d => d.toDateString() === newTaskPreview.endDate.toDateString()) - timeline.findIndex(d => d.toDateString() === newTaskPreview.startDate.toDateString())) + 1) * dayWidth}px`,
                    height: '40px'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskEditModal 
        task={selectedTask} 
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
        onSave={(updates) => { if (selectedTask) { handleTaskUpdate(selectedTask.id, updates); } }}
        onDelete={(taskId) => { setTasks(prev => prev.filter(task => task.id !== taskId)); setIsEditModalOpen(false); setSelectedTask(null); }}
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
