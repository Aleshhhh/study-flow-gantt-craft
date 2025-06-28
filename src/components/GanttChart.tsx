import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TaskBar } from './TaskBar';
import { TaskEditModal } from './TaskEditModal';
import { SettingsModal } from './SettingsModal';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, Settings, Plus, ChevronLeft, ChevronRight, BarChart3, Kanban, Calendar as CalendarIcon, Menu } from 'lucide-react';
import type { Task, DayColors } from '@/types/gantt';
import { KanbanView } from './KanbanView';

interface MonthGroup {
  month: string;
  year: string;
  count: number;
}

type ViewMode = 'gantt' | 'kanban';

export const GanttChart: React.FC = () => {
  // Costante configurabile per gli anni da mostrare nel Gantt
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
  const headerRef = useRef<HTMLDivElement>(null);

  // Configurazione ottimizzata per le performance
  const dayWidth = 120;
  const visibleDays = 60;
  const bufferDays = 30;

  /**
   * Genera il timeline dinamico basato sulla data corrente e il numero di anni configurabile
   * La data di fine è calcolata dinamicamente aggiungendo numberOfYearsToShow alla data di navigazione corrente
   */
  const generateDynamicTimeline = () => {
    const timeline = [];
    
    // Usa currentDate come base per la generazione del timeline
    const baseDate = new Date(currentDate);
    
    // Calcola la data di inizio (metà dei giorni visibili prima della data corrente)
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() - Math.floor(visibleDays / 2));
    startDate.setHours(0, 0, 0, 0);
    
    // Genera i giorni necessari per la viewport corrente + buffer
    const totalDays = visibleDays + bufferDays * 2;
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      timeline.push(date);
    }
    
    return timeline;
  };

  const timeline = generateDynamicTimeline();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /**
   * Raggruppa le date per mese per creare l'intestazione del Gantt
   * Ora funziona dinamicamente con qualsiasi range di date
   */
  const monthGroups: Record<string, MonthGroup> = timeline.reduce((acc: Record<string, MonthGroup>, date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { 
        month: monthNames[date.getMonth()], 
        year: date.getFullYear().toString(), 
        count: 0 
      };
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
      milestones: [],
      status: 'To Do'
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
    setIsEditModalOpen(true);
  };

  /**
   * Navigazione dinamica senza limiti - permette di navigare infinitamente
   */
  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      const daysToMove = direction === 'next' ? 30 : -30;
      newDate.setDate(newDate.getDate() + daysToMove);
      return newDate;
    });
  };

  const handleScroll = (scrollLeft: number) => {
    setScrollOffset(scrollLeft);
    
    if (timelineRef.current && timelineRef.current.scrollLeft !== scrollLeft) {
      timelineRef.current.scrollLeft = scrollLeft;
    }
    if (headerRef.current && headerRef.current.scrollLeft !== scrollLeft) {
      headerRef.current.scrollLeft = scrollLeft;
    }
    if (chartRef.current && chartRef.current.scrollLeft !== scrollLeft) {
      chartRef.current.scrollLeft = scrollLeft;
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (timelineRef.current?.contains(target) || chartRef.current?.contains(target) || headerRef.current?.contains(target)) {
        e.preventDefault();
        const newScrollLeft = Math.max(0, scrollOffset + e.deltaY);
        handleScroll(newScrollLeft);
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [scrollOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((viewMode as ViewMode) === 'kanban' || e.button !== 0) return;
    if (e.target === chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollOffset;
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
    if ((viewMode as ViewMode) === 'kanban' || !isDragging || !newTaskPreview || !chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const dayIndex = Math.floor(x / dayWidth);
    const endDate = timeline[dayIndex] || newTaskPreview.endDate;
    
    setNewTaskPreview(prev => prev ? { ...prev, endDate } : null);
  };

  const handleMouseUp = () => {
    if ((viewMode as ViewMode) === 'kanban' || !isDragging || !newTaskPreview) return;
    
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
    
    setIsDragging(false);
    setNewTaskPreview(null);
  };

  const handleCalendarDateSelect = (date: Date | undefined) => {
    setSelectedCalendarDate(date);
    if (date) {
      setCurrentDate(date);
    }
  };

  if ((viewMode as ViewMode) === 'kanban') {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-2 sm:p-6 border-b border-border bg-card">
          <h1 className="text-base sm:text-2xl font-bold truncate">Study Kanban</h1>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Menu */}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Button
                        onClick={() => setViewMode('gantt')}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Gantt View
                      </Button>
                      <Button
                        onClick={() => setViewMode('kanban')}
                        variant="default"
                        className="w-full justify-start"
                      >
                        <Kanban className="w-4 h-4 mr-2" />
                        Kanban View
                      </Button>
                    </div>
                    <Button onClick={handleAddTask} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                    <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button onClick={toggleTheme} variant="outline" className="w-full">
                      {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Controls */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  onClick={() => setViewMode('gantt')}
                  variant={(viewMode as ViewMode) === 'gantt' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-md"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Gantt
                </Button>
                <Button
                  onClick={() => setViewMode('kanban')}
                  variant={(viewMode as ViewMode) === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-md"
                >
                  <Kanban className="w-4 h-4 mr-2" />
                  Kanban
                </Button>
              </div>
              <Button onClick={handleAddTask} size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
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

        <KanbanView 
          tasks={tasks} 
          onTaskUpdate={handleTaskUpdate}
          onTaskClick={handleTaskClick}
        />

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
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-6 border-b border-border bg-card">
        <h1 className="text-base sm:text-2xl font-bold truncate">Study Gantt</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Menu */}
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Button
                      onClick={() => setViewMode('gantt')}
                      variant="default"
                      className="w-full justify-start"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Gantt View
                    </Button>
                    <Button
                      onClick={() => setViewMode('kanban')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Kanban className="w-4 h-4 mr-2" />
                      Kanban View
                    </Button>
                  </div>
                  <Button
                    onClick={() => setIsCalendarOpen(true)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Calendar
                  </Button>
                  <Button onClick={handleAddTask} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                  <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button onClick={toggleTheme} variant="outline" className="w-full">
                    {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </Button>
                  <div className="space-y-2">
                    <Button onClick={() => navigateDate('prev')} variant="outline" className="w-full">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Earlier
                    </Button>
                    <Button onClick={() => navigateDate('next')} variant="outline" className="w-full">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Later
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                onClick={() => setViewMode('gantt')}
                variant={(viewMode as ViewMode) === 'gantt' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-md"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Gantt
              </Button>
              <Button
                onClick={() => setViewMode('kanban')}
                variant={(viewMode as ViewMode) === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-md"
              >
                <Kanban className="w-4 h-4 mr-2" />
                Kanban
              </Button>
            </div>
            <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Calendar</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={handleCalendarDateSelect}
                    className="rounded-xl"
                  />
                  <div className="mt-6 space-y-2">
                    <Button onClick={() => navigateDate('prev')} variant="outline" className="w-full">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Earlier
                    </Button>
                    <Button onClick={() => navigateDate('next')} variant="outline" className="w-full">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Later
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button onClick={handleAddTask} size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
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

      {/* Main Content - Mobile Optimized */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card rounded-none sm:rounded-xl m-0 sm:m-2 shadow-sm">
          {/* Month Header */}
          <div 
            ref={headerRef}
            className="flex border-b border-border bg-muted/20 overflow-hidden"
            onScroll={(e) => handleScroll((e.target as HTMLDivElement).scrollLeft)}
          >
            {Object.entries(monthGroups).map(([key, group]) => (
              <div 
                key={key}
                className="border-r border-border px-1 sm:px-4 py-1 sm:py-4 text-center font-semibold bg-muted/30 text-xs sm:text-sm"
                style={{ minWidth: `${group.count * dayWidth}px` }}
              >
                <div className="sm:hidden">{group.month.slice(0, 3)}</div>
                <div className="hidden sm:block">{group.month} {group.year}</div>
              </div>
            ))}
          </div>

          {/* Day Header */}
          <div 
            ref={timelineRef}
            className="flex border-b border-border bg-card overflow-x-auto scrollbar-thin"
            onScroll={(e) => handleScroll((e.target as HTMLDivElement).scrollLeft)}
          >
            {timeline.map((date, index) => {
              const isWeekStart = date.getDay() === 0;
              const isMonthStart = date.getDate() === 1;
              const isSelectedDate = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
              
              return (
                <div 
                  key={index}
                  className={`relative border-r border-border p-1 sm:p-4 text-center text-xs sm:text-sm transition-all duration-300 hover:bg-muted/20 ${
                    isSelectedDate ? 'bg-primary/20 border-primary shadow-md' : ''
                  }`}
                  style={{ 
                    backgroundColor: isSelectedDate ? undefined : (theme === 'dark' 
                      ? dayColors[date.getDay()] === '#ffffff' ? '#1f2937' : '#374151'
                      : dayColors[date.getDay()]),
                    minWidth: `${dayWidth}px`
                  }}
                >
                  {/* Month divider */}
                  {isMonthStart && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 rounded-full" />
                  )}
                  <div className="font-semibold text-sm sm:text-lg">{date.getDate()}</div>
                  <div className="text-xs text-muted-foreground mt-1 hidden sm:block">{dayNames[date.getDay()]}</div>
                  <div className="text-xs text-muted-foreground mt-1 sm:hidden">{dayNames[date.getDay()].slice(0, 1)}</div>
                </div>
              );
            })}
          </div>

          {/* Tasks Timeline */}
          <div 
            ref={chartRef}
            className="flex-1 overflow-auto relative bg-background"
            style={{ minHeight: '200px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onScroll={(e) => handleScroll((e.target as HTMLDivElement).scrollLeft)}
          >
            {/* Week and Month lines */}
            {timeline.map((date, index) => {
              const isWeekStart = date.getDay() === 0;
              const isMonthStart = date.getDate() === 1;
              return (
                <React.Fragment key={`lines-${index}`}>
                  {isWeekStart && (
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-border/10 pointer-events-none transition-opacity duration-300"
                      style={{ left: `${index * dayWidth}px` }}
                    />
                  )}
                  {isMonthStart && (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-border/30 pointer-events-none transition-opacity duration-300"
                      style={{ left: `${index * dayWidth}px` }}
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
                yPosition={(task as any).rowIndex * 60 + 20}
                dayWidth={dayWidth}
                scrollOffset={0}
                onUpdate={(updates) => handleTaskUpdate(task.id, updates)}
                onClick={() => handleTaskClick(task)}
              />
            ))}

            {/* New task preview */}
            {newTaskPreview && (
              <div
                className="absolute rounded-xl shadow-sm border border-dashed border-muted-foreground/50 bg-muted/30 pointer-events-none transition-all duration-200"
                style={{
                  left: `${Math.min(
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.startDate.toDateString()),
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.endDate.toDateString())
                  ) * dayWidth}px`,
                  top: `${Math.floor((newTaskPreview.y - 20) / 60) * 60 + 20}px`,
                  width: `${Math.abs(
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.endDate.toDateString()) -
                    timeline.findIndex(d => d.toDateString() === newTaskPreview.startDate.toDateString())
                  ) * dayWidth + dayWidth}px`,
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
