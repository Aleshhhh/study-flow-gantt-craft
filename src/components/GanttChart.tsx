
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TaskBar } from './TaskBar';
import { TaskEditModal } from './TaskEditModal';
import { SettingsModal } from './SettingsModal';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, Settings, Plus, BarChart3, Kanban, Calendar as CalendarIcon, Menu, List } from 'lucide-react';
import type { Task, DayColors } from '@/types/gantt';
import { KanbanView } from './KanbanView';

// --- TIPI E INTERFACCE ---
interface MonthGroup {
  month: string;
  year: string;
  count: number;
}
type ViewMode = 'gantt' | 'kanban';

// Storage utility functions
const STORAGE_KEYS = {
  TASKS: 'gantt-tasks',
  DAY_COLORS: 'gantt-day-colors',
  CURRENT_DATE: 'gantt-current-date',
  VIEW_MODE: 'gantt-view-mode',
  SCROLL_POSITION: 'gantt-scroll-position'
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

// --- COMPONENTE GANTT CHART MODIFICATO ---
export const GanttChart: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  // Load initial data from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => 
    loadFromStorage(STORAGE_KEYS.VIEW_MODE, 'gantt')
  );
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    if (savedTasks.length === 0) {
      return [{
        id: '1',
        title: 'Sample Study Task',
        description: 'Complete chapter 1 review and practice problems. This involves reading through all the material, taking notes, and working through the exercises at the end of the chapter.',
        startDate: new Date(2025, 5, 15),
        endDate: new Date(2025, 5, 20),
        color: '#f5f5dc',
        milestones: ['Review notes', 'Practice problems'],
        status: 'To Do'
      }];
    }
    
    // Convert date strings back to Date objects
    return savedTasks.map((task: any) => ({
      ...task,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate)
    }));
  });
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  
  const [dayColors, setDayColors] = useState<DayColors>(() => {
    const savedColors = loadFromStorage(STORAGE_KEYS.DAY_COLORS, null);
    console.log('Loading day colors from localStorage:', savedColors);
    return savedColors || {
      0: theme === 'dark' ? '#0f172a' : '#f8fafc', 
      1: theme === 'dark' ? '#020617' : '#ffffff', 
      2: theme === 'dark' ? '#020617' : '#ffffff', 
      3: theme === 'dark' ? '#020617' : '#ffffff',
      4: theme === 'dark' ? '#020617' : '#ffffff', 
      5: theme === 'dark' ? '#020617' : '#ffffff', 
      6: theme === 'dark' ? '#0f172a' : '#f1f5f9'
    };
  });
  
  const [currentDate, setCurrentDate] = useState(() => {
    const savedDate = loadFromStorage(STORAGE_KEYS.CURRENT_DATE, null);
    return savedDate ? new Date(savedDate) : new Date();
  });
  
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [isTaskBeingDragged, setIsTaskBeingDragged] = useState(false);
  const [newTaskPreview, setNewTaskPreview] = useState<{ startDate: Date; endDate: Date; x: number; y: number } | null>(null);
  
  // Mobile touch states
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // --- STATE E REFS PER LA TIMELINE INFINITA ---
  const [scrollOffset, setScrollOffset] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SCROLL_POSITION, 0)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [savedScrollPositions, setSavedScrollPositions] = useState<{ [key in ViewMode]?: number }>({});
  const lastNavDirection = useRef<'prev' | 'next' | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Configurazione per la virtualizzazione
  const dayWidth = 120;
  const visibleDays = 60;
  const bufferDays = 30;
  const daysToNavigate = 30;

  // Save data to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  useEffect(() => {
    console.log('Saving day colors to localStorage:', dayColors);
    saveToStorage(STORAGE_KEYS.DAY_COLORS, dayColors);
  }, [dayColors]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_DATE, currentDate);
  }, [currentDate]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SCROLL_POSITION, scrollOffset);
  }, [scrollOffset]);

  // Update day colors when theme changes only if no custom colors are saved
  useEffect(() => {
    const savedColors = loadFromStorage(STORAGE_KEYS.DAY_COLORS, null);
    if (!savedColors) {
      const newColors = {
        0: theme === 'dark' ? '#0f172a' : '#f8fafc', 
        1: theme === 'dark' ? '#020617' : '#ffffff', 
        2: theme === 'dark' ? '#020617' : '#ffffff', 
        3: theme === 'dark' ? '#020617' : '#ffffff',
        4: theme === 'dark' ? '#020617' : '#ffffff', 
        5: theme === 'dark' ? '#020617' : '#ffffff', 
        6: theme === 'dark' ? '#0f172a' : '#f1f5f9'
      };
      setDayColors(newColors);
    }
  }, [theme]);

  // Handle dayColors changes from SettingsModal
  const handleDayColorsChange = (newColors: DayColors) => {
    console.log('Day colors changed:', newColors);
    setDayColors(newColors);
  };

  // Reset states when switching to Gantt view and restore scroll position
  useEffect(() => {
    if (viewMode === 'gantt') {
      setIsDragging(false);
      setIsTaskBeingDragged(false);
      setNewTaskPreview(null);
      
      // Restore scroll position after a short delay to ensure DOM is ready
      setTimeout(() => {
        const savedScrollPos = savedScrollPositions.gantt !== undefined ? savedScrollPositions.gantt : scrollOffset;
        if (chartRef.current) {
          chartRef.current.scrollLeft = savedScrollPos;
          setScrollOffset(savedScrollPos);
        }
      }, 50);
    } else {
      // Save current scroll position when leaving Gantt view
      setSavedScrollPositions(prev => ({
        ...prev,
        gantt: scrollOffset
      }));
    }
  }, [viewMode]);

  // Save scroll position when leaving Gantt view
  useEffect(() => {
    return () => {
      if (viewMode === 'gantt') {
        setSavedScrollPositions(prev => ({
          ...prev,
          gantt: scrollOffset
        }));
      }
    };
  }, [scrollOffset, viewMode]);

  // --- LOGICA DI GENERAZIONE TIMELINE ---
  const generateDynamicTimeline = useCallback(() => {
    const timeline = [];
    const baseDate = new Date(currentDate);
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() - Math.floor(visibleDays / 2));
    startDate.setHours(0, 0, 0, 0);
    const totalDays = visibleDays + bufferDays * 2;
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      timeline.push(date);
    }
    return timeline;
  }, [currentDate, visibleDays, bufferDays]);

  const timeline = generateDynamicTimeline();
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

  // Get current visible month based on scroll position
  const getCurrentVisibleMonth = () => {
    const currentDayIndex = Math.floor(scrollOffset / dayWidth);
    const currentVisibleDate = timeline[currentDayIndex] || timeline[0];
    return `${monthNames[currentVisibleDate.getMonth()]} ${currentVisibleDate.getFullYear()}`;
  };

  // Navigate to task function
  const navigateToTask = (task: Task) => {
    const taskStartIndex = timeline.findIndex(date => 
      date.toDateString() === task.startDate.toDateString()
    );
    
    if (taskStartIndex !== -1 && chartRef.current) {
      const targetScrollLeft = Math.max(0, taskStartIndex * dayWidth - (chartRef.current.clientWidth / 2));
      chartRef.current.scrollLeft = targetScrollLeft;
      setScrollOffset(targetScrollLeft);
      setIsTaskListOpen(false);
    }
  };

  // --- LOGICA DI GESTIONE TASK ---
  const arrangeTasksInRows = () => {
    const rows: Task[][] = [];
    const sortedTasks = [...tasks].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    for (const task of sortedTasks) {
      let placed = false;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const hasOverlap = row.some(existingTask => (task.startDate <= existingTask.endDate && task.endDate >= existingTask.startDate));
        if (!hasOverlap) {
          row.push(task);
          placed = true;
          break;
        }
      }
      if (!placed) rows.push([task]);
    }
    return rows.flat().map((task) => ({ ...task, rowIndex: rows.findIndex(row => row.includes(task)) }));
  };
  const tasksWithRows = arrangeTasksInRows();

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updates } : task));
  };
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };
  const handleAddTask = () => {
    const centerDate = timeline[Math.floor(timeline.length / 2)];
    const newTask: Task = {
      id: Date.now().toString(), title: 'New Task', description: '',
      startDate: centerDate,
      endDate: new Date(centerDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      color: '#f5f5dc', milestones: [], status: 'To Do'
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
    setIsEditModalOpen(true);
  };
  
  // --- LOGICA DI NAVIGAZIONE E SCROLL INFINITO ---
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    if (isLoading) return;
    setIsLoading(true);
    lastNavDirection.current = direction;
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? daysToNavigate : -daysToNavigate));
      return newDate;
    });
  }, [isLoading, daysToNavigate]);

  const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollOffset = e.currentTarget.scrollLeft;
    setScrollOffset(newScrollOffset);
  };
  
  useEffect(() => {
    if (viewMode !== 'gantt') return;
    
    if (timelineRef.current) timelineRef.current.scrollLeft = scrollOffset;
    if (headerRef.current) headerRef.current.scrollLeft = scrollOffset;

    const chartEl = chartRef.current;
    if (!chartEl || isLoading) return;

    const { clientWidth, scrollWidth } = chartEl;
    const threshold = dayWidth * 15;

    if (scrollWidth > clientWidth) {
      if (scrollWidth - (scrollOffset + clientWidth) < threshold) {
        navigateDate('next');
      } else if (scrollOffset < threshold) {
        navigateDate('prev');
      }
    }
  }, [scrollOffset, isLoading, navigateDate, viewMode, dayWidth]);

  useLayoutEffect(() => {
    if (viewMode !== 'gantt' || !isLoading) return;
    
    const chartEl = chartRef.current;
    if (chartEl && lastNavDirection.current) {
        const pixelsMoved = daysToNavigate * dayWidth;
        if (lastNavDirection.current === 'prev') {
            chartEl.scrollLeft += pixelsMoved;
        } else {
            chartEl.scrollLeft -= pixelsMoved;
        }
        setScrollOffset(chartEl.scrollLeft);
    }
    setIsLoading(false);
    lastNavDirection.current = null;
  }, [timeline, isLoading, viewMode, daysToNavigate, dayWidth]);

  useEffect(() => {
    if (viewMode !== 'gantt') return;
    
    const wheelTarget = chartRef.current;
    if (!wheelTarget) return;

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        wheelTarget.scrollLeft += e.deltaY;
    };

    wheelTarget.addEventListener('wheel', handleWheel, { passive: false });
    return () => wheelTarget.removeEventListener('wheel', handleWheel);
  }, [viewMode]);

  // --- LOGICA DRAG & DROP ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'gantt' || e.button !== 0 || isTaskBeingDragged) return;
    const target = e.target as HTMLElement;
    if (target.closest('.task-bar')) return;

    const chartEl = chartRef.current;
    if (chartEl && chartEl.contains(target)) {
      const rect = chartEl.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollOffset;
      const y = e.clientY - rect.top;
      const dayIndex = Math.floor(x / dayWidth);
      const date = timeline[dayIndex];
      if (date) {
        setIsDragging(true);
        setNewTaskPreview({ startDate: new Date(date), endDate: new Date(date), x, y });
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (viewMode !== 'gantt' || !isDragging || !newTaskPreview || !chartRef.current || isTaskBeingDragged) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const dayIndex = Math.max(0, Math.floor(x / dayWidth));
    const endDate = timeline[dayIndex] ? new Date(timeline[dayIndex]) : new Date(newTaskPreview.endDate);
    setNewTaskPreview(prev => prev ? { ...prev, endDate } : null);
  };
  
  const handleMouseUp = () => {
    if (viewMode !== 'gantt' || !isDragging || !newTaskPreview || isTaskBeingDragged) return;
    const { startDate, endDate } = newTaskPreview;
    if (startDate.getTime() === endDate.getTime()) {
         setIsDragging(false);
         setNewTaskPreview(null);
         return;
    }

    const newTask: Task = {
      id: Date.now().toString(), title: 'New Task', description: '',
      startDate: startDate < endDate ? new Date(startDate) : new Date(endDate),
      endDate: startDate < endDate ? new Date(endDate) : new Date(startDate),
      color: '#f5f5dc', milestones: [], status: 'To Do'
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
    setIsEditModalOpen(true);
    setIsDragging(false);
    setNewTaskPreview(null);
  };

  // --- MOBILE TOUCH HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== 'gantt' || isTaskBeingDragged) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('.task-bar')) return;

    const touch = e.touches[0];
    const chartEl = chartRef.current;
    
    if (chartEl && chartEl.contains(target)) {
      const rect = chartEl.getBoundingClientRect();
      const x = touch.clientX - rect.left + scrollOffset;
      const y = touch.clientY - rect.top;
      
      setTouchStartTime(Date.now());
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      setIsLongPress(false);
      
      // Set long press timer
      const timer = setTimeout(() => {
        setIsLongPress(true);
        // Start task creation preview
        const dayIndex = Math.floor(x / dayWidth);
        const date = timeline[dayIndex];
        if (date) {
          setIsDragging(true);
          setNewTaskPreview({ startDate: new Date(date), endDate: new Date(date), x, y });
        }
      }, 500); // 500ms for long press
      
      setLongPressTimer(timer);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (viewMode !== 'gantt') return;
    
    const touch = e.touches[0];
    const chartEl = chartRef.current;
    
    if (!chartEl) return;
    
    // Check if this is a long press drag for task creation
    if (isLongPress && isDragging && newTaskPreview && !isTaskBeingDragged) {
      e.preventDefault(); // Prevent scrolling during task creation
      const rect = chartEl.getBoundingClientRect();
      const x = touch.clientX - rect.left + scrollOffset;
      const dayIndex = Math.max(0, Math.floor(x / dayWidth));
      const endDate = timeline[dayIndex] ? new Date(timeline[dayIndex]) : new Date(newTaskPreview.endDate);
      setNewTaskPreview(prev => prev ? { ...prev, endDate } : null);
    } else if (touchStartPos) {
      // Check if user moved too much (cancel long press)
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);
      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
        setIsLongPress(false);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (viewMode !== 'gantt') return;
    
    // Complete task creation if it was a long press drag
    if (isLongPress && isDragging && newTaskPreview && !isTaskBeingDragged) {
      const { startDate, endDate } = newTaskPreview;
      if (startDate.getTime() !== endDate.getTime()) {
        const newTask: Task = {
          id: Date.now().toString(), title: 'New Task', description: '',
          startDate: startDate < endDate ? new Date(startDate) : new Date(endDate),
          endDate: startDate < endDate ? new Date(endDate) : new Date(startDate),
          color: '#f5f5dc', milestones: [], status: 'To Do'
        };
        setTasks(prev => [...prev, newTask]);
        setSelectedTask(newTask);
        setIsEditModalOpen(true);
      }
    }
    
    // Reset all touch states
    setIsDragging(false);
    setNewTaskPreview(null);
    setIsLongPress(false);
    setTouchStartTime(0);
    setTouchStartPos(null);
  };

  const handleCalendarDateSelect = (date: Date | undefined) => {
    setSelectedCalendarDate(date);
    if (date) {
        setCurrentDate(date);
        setIsCalendarOpen(false);
    }
  };

  // --- RENDER DEL COMPONENTE ---
  if (viewMode === 'kanban') {
    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header Kanban */}
            <div className="flex items-center justify-between p-2 sm:p-6 border-b border-border bg-card">
              <h1 className="text-base sm:text-2xl font-bold truncate">Kanban</h1>
              <div className="flex items-center gap-1 sm:gap-2">
                 {/* Controlli Mobile */}
                 <div className="sm:hidden">
                     <Sheet>
                         <SheetTrigger asChild>
                             <Button variant="outline" size="sm"><Menu className="w-4 h-4" /></Button>
                         </SheetTrigger>
                         <SheetContent side="right" className="w-80">
                             <SheetHeader>
                                 <SheetTitle>Menu</SheetTitle>
                             </SheetHeader>
                             <div className="space-y-4 mt-6">
                                 <div className="flex flex-col gap-2">
                                      <Button onClick={() => setViewMode('gantt')} variant={viewMode === ('gantt' as ViewMode) ? 'default' : 'outline'} className="w-full justify-start">
                                          <BarChart3 className="w-4 h-4 mr-2" />Gantt
                                      </Button>
                                      <Button onClick={() => setViewMode('kanban')} variant={viewMode === ('kanban' as ViewMode) ? 'default' : 'outline'} className="w-full justify-start">
                                          <Kanban className="w-4 h-4 mr-2" />Kanban
                                      </Button>
                                 </div>
                                 <Button onClick={() => setIsCalendarOpen(true)} variant="outline" className="w-full justify-start">
                                     <CalendarIcon className="w-4 h-4 mr-2" />Calendar
                                 </Button>
                                 <Button onClick={handleAddTask} className="w-full justify-start">
                                     <Plus className="w-4 h-4 mr-2" />Add Task
                                 </Button>
                                 <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="w-full justify-start">
                                     <Settings className="w-4 h-4 mr-2" />Settings
                                 </Button>
                                 <Button onClick={toggleTheme} variant="outline" className="w-full justify-start">
                                     {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                                     {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                                 </Button>
                             </div>
                         </SheetContent>
                     </Sheet>
                 </div>
                {/* Controlli Desktop */}
                 <div className="hidden sm:flex items-center gap-3">
                     <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                         <Button onClick={() => setViewMode('gantt')} variant={viewMode === ('gantt' as ViewMode) ? 'default' : 'ghost'} size="sm" className="rounded-md"><BarChart3 className="w-4 h-4 mr-2" />Gantt</Button>
                         <Button onClick={() => setViewMode('kanban')} variant={viewMode === ('kanban' as ViewMode) ? 'default' : 'ghost'} size="sm" className="rounded-md"><Kanban className="w-4 h-4 mr-2" />Kanban</Button>
                     </div>
                     <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                         <SheetTrigger asChild>
                             <Button variant="outline" size="sm" className="rounded-xl shadow-sm"><CalendarIcon className="w-4 h-4" /></Button>
                         </SheetTrigger>
                         <SheetContent side="left" className="w-auto p-0">
                             <Calendar mode="single" selected={selectedCalendarDate} onSelect={handleCalendarDateSelect} className="rounded-xl"/>
                         </SheetContent>
                     </Sheet>
                     <Button onClick={handleAddTask} size="sm" className="rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" />Add Task</Button>
                     <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="rounded-xl shadow-sm"><Settings className="w-4 h-4" /></Button>
                     <Button onClick={toggleTheme} variant="outline" size="sm" className="rounded-xl shadow-sm">{theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</Button>
                 </div>
              </div>
            </div>
            <KanbanView tasks={tasks} onTaskUpdate={handleTaskUpdate} onTaskClick={handleTaskClick} />
            {/* Modals */}
            <TaskEditModal task={selectedTask} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }} onSave={(updates) => { if (selectedTask) handleTaskUpdate(selectedTask.id, updates); }} onDelete={(taskId) => { setTasks(prev => prev.filter(task => task.id !== taskId)); setIsEditModalOpen(false); setSelectedTask(null); }} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} dayColors={dayColors} onDayColorsChange={handleDayColorsChange} />
        </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-6 border-b border-border bg-card">
         <div className="flex items-center gap-4">
           <h1 className="text-base sm:text-2xl font-bold truncate">Study Gantt</h1>
           <div className="text-sm text-muted-foreground font-medium">
             {getCurrentVisibleMonth()}
           </div>
         </div>
         <div className="flex items-center gap-1 sm:gap-2">
            {/* Controlli Mobile */}
             <div className="sm:hidden">
                 <Sheet>
                     <SheetTrigger asChild>
                         <Button variant="outline" size="sm"><Menu className="w-4 h-4" /></Button>
                     </SheetTrigger>
                     <SheetContent side="right" className="w-80">
                         <SheetHeader>
                             <SheetTitle>Menu</SheetTitle>
                         </SheetHeader>
                         <div className="space-y-4 mt-6">
                             <div className="flex flex-col gap-2">
                                  <Button onClick={() => setViewMode('gantt')} variant={viewMode === ('gantt' as ViewMode) ? 'default' : 'outline'} className="w-full justify-start">
                                      <BarChart3 className="w-4 h-4 mr-2" />Gantt
                                  </Button>
                                  <Button onClick={() => setViewMode('kanban')} variant={viewMode === ('kanban' as ViewMode) ? 'default' : 'outline'} className="w-full justify-start">
                                      <Kanban className="w-4 h-4 mr-2" />Kanban
                                  </Button>
                             </div>
                             <Button onClick={() => setIsTaskListOpen(true)} variant="outline" className="w-full justify-start">
                                 <List className="w-4 h-4 mr-2" />Task List
                             </Button>
                             <Button onClick={() => setIsCalendarOpen(true)} variant="outline" className="w-full justify-start">
                                 <CalendarIcon className="w-4 h-4 mr-2" />Calendar
                             </Button>
                             <Button onClick={handleAddTask} className="w-full justify-start">
                                 <Plus className="w-4 h-4 mr-2" />Add Task
                             </Button>
                             <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="w-full justify-start">
                                 <Settings className="w-4 h-4 mr-2" />Settings
                             </Button>
                             <Button onClick={toggleTheme} variant="outline" className="w-full justify-start">
                                 {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                                 {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                             </Button>
                         </div>
                     </SheetContent>
                 </Sheet>
             </div>
            {/* Controlli Desktop */}
             <div className="hidden sm:flex items-center gap-3">
                 <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                     <Button onClick={() => setViewMode('gantt')} variant={viewMode === ('gantt' as ViewMode) ? 'default' : 'ghost'} size="sm" className="rounded-md"><BarChart3 className="w-4 h-4 mr-2" />Gantt</Button>
                     <Button onClick={() => setViewMode('kanban')} variant={viewMode === ('kanban' as ViewMode) ? 'default' : 'ghost'} size="sm" className="rounded-md"><Kanban className="w-4 h-4 mr-2" />Kanban</Button>
                 </div>
                 <Sheet open={isTaskListOpen} onOpenChange={setIsTaskListOpen}>
                     <SheetTrigger asChild>
                         <Button variant="outline" size="sm" className="rounded-xl shadow-sm"><List className="w-4 h-4 mr-2" />Tasks</Button>
                     </SheetTrigger>
                     <SheetContent side="left" className="w-80">
                         <SheetHeader>
                             <SheetTitle>Task List</SheetTitle>
                         </SheetHeader>
                         <div className="mt-6 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                             {tasks.length === 0 ? (
                                 <p className="text-muted-foreground text-center py-8">No tasks yet. Create your first task!</p>
                             ) : (
                                 tasks.map((task) => (
                                     <div
                                         key={task.id}
                                         className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                         onClick={() => navigateToTask(task)}
                                     >
                                         <div className="flex items-center gap-3">
                                             <div 
                                                 className="w-3 h-3 rounded-full flex-shrink-0"
                                                 style={{ backgroundColor: task.color }}
                                             />
                                             <div className="flex-1 min-w-0">
                                                 <h4 className="font-medium truncate">{task.title}</h4>
                                                 <p className="text-sm text-muted-foreground">
                                                     {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                                                 </p>
                                                 <span className="text-xs px-2 py-1 bg-muted rounded-full">
                                                     {task.status}
                                                 </span>
                                             </div>
                                         </div>
                                     </div>
                                 ))
                             )}
                         </div>
                     </SheetContent>
                 </Sheet>
                 <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                     <SheetTrigger asChild>
                         <Button variant="outline" size="sm" className="rounded-xl shadow-sm"><CalendarIcon className="w-4 h-4" /></Button>
                     </SheetTrigger>
                     <SheetContent side="left" className="w-auto p-0">
                         <Calendar mode="single" selected={selectedCalendarDate} onSelect={handleCalendarDateSelect} className="rounded-xl"/>
                     </SheetContent>
                 </Sheet>
                 <Button onClick={handleAddTask} size="sm" className="rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" />Add Task</Button>
                 <Button onClick={() => setIsSettingsOpen(true)} variant="outline" size="sm" className="rounded-xl shadow-sm"><Settings className="w-4 h-4" /></Button>
                 <Button onClick={toggleTheme} variant="outline" size="sm" className="rounded-xl shadow-sm">{theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</Button>
             </div>
         </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-card rounded-none sm:rounded-xl m-0 sm:m-2 shadow-sm">
          {/* Month Header */}
          <div ref={headerRef} className="flex border-b border-border bg-muted/20 overflow-hidden">
            {Object.entries(monthGroups).map(([key, group]) => (
              <div key={key} className="border-r border-border px-1 sm:px-4 py-1 sm:py-4 text-center font-semibold bg-muted/30 text-xs sm:text-sm"
                   style={{ minWidth: `${group.count * dayWidth}px` }}>
                <div className="sm:hidden">{group.month.slice(0, 3)}</div>
                <div className="hidden sm:block">{group.month} {group.year}</div>
              </div>
            ))}
          </div>

          {/* Day Header */}
          <div ref={timelineRef} className="flex border-b border-border bg-card overflow-x-hidden">
            {timeline.map((date, index) => {
              const isMonthStart = date.getDate() === 1;
              const isSelectedDate = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
              return (
                <div key={index} className={`relative border-r border-border p-1 sm:p-4 text-center text-xs sm:text-sm transition-colors duration-200 ${isSelectedDate ? 'bg-primary/20' : ''}`}
                     style={{ 
                       backgroundColor: isSelectedDate ? undefined : dayColors[date.getDay()],
                       minWidth: `${dayWidth}px` 
                     }}>
                  {isMonthStart && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/30 rounded-full" />}
                  <div className="font-semibold text-sm sm:text-lg">{date.getDate()}</div>
                  <div className="text-xs text-muted-foreground mt-1">{dayNames[date.getDay()]}</div>
                </div>
              );
            })}
          </div>

          {/* Tasks Timeline */}
          <div ref={chartRef} className="flex-1 overflow-auto relative bg-background"
               style={{ minHeight: '200px', cursor: isDragging ? 'crosshair' : 'default' }}
               onScroll={handleMainScroll}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onTouchStart={handleTouchStart}
               onTouchMove={handleTouchMove}
               onTouchEnd={handleTouchEnd}>
            
            <div className="relative w-full h-full">
                 {/* Vertical Grid Lines */}
                 <div className="absolute top-0 left-0 h-full w-max pointer-events-none">
                     {timeline.map((date, index) => {
                         const isWeekStart = date.getDay() === 0;
                         const isMonthStart = date.getDate() === 1;
                         return (
                             <div key={`line-${index}`}>
                                 {isWeekStart && <div className="absolute top-0 bottom-0 w-px bg-border/20" style={{ left: `${index * dayWidth}px` }} />}
                                 {isMonthStart && <div className="absolute top-0 bottom-0 w-0.5 bg-border/40" style={{ left: `${index * dayWidth}px` }} />}
                             </div>
                         );
                     })}
                 </div>

                {/* Task bars */}
                {tasksWithRows.map((task) => (
                    <TaskBar 
                      key={task.id} 
                      task={task} 
                      timeline={timeline} 
                      yPosition={(task as any).rowIndex * 60 + 10}
                      dayWidth={dayWidth} 
                      scrollOffset={scrollOffset} 
                      onUpdate={(updates) => handleTaskUpdate(task.id, updates)}
                      onClick={() => handleTaskClick(task)}
                      onDragStart={() => setIsTaskBeingDragged(true)}
                      onDragEnd={() => setIsTaskBeingDragged(false)}
                    />
                ))}

                {/* New task preview */}
                {newTaskPreview && !isTaskBeingDragged && (
                    <div className="absolute rounded-lg border border-dashed border-primary bg-primary/20 pointer-events-none"
                         style={{
                             left: `${Math.min(timeline.findIndex(d => d.toDateString() === newTaskPreview.startDate.toDateString()), timeline.findIndex(d => d.toDateString() === newTaskPreview.endDate.toDateString())) * dayWidth}px`,
                             top: `${Math.floor((newTaskPreview.y - 10) / 60) * 60 + 10}px`,
                             width: `${(Math.abs(newTaskPreview.endDate.getTime() - newTaskPreview.startDate.getTime()) / (1000 * 60 * 60 * 24) + 1) * dayWidth}px`,
                             height: '40px'
                         }} />
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskEditModal task={selectedTask} isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
        onSave={(updates) => { if (selectedTask) handleTaskUpdate(selectedTask.id, updates); }}
        onDelete={(taskId) => { setTasks(prev => prev.filter(task => task.id !== taskId)); setIsEditModalOpen(false); setSelectedTask(null); }} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} dayColors={dayColors} onDayColorsChange={handleDayColorsChange} />
    </div>
  );
};
