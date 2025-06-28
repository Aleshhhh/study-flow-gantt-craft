import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus, Settings, LayoutGrid, BarChart3 } from 'lucide-react';
import { TaskEditModal } from './TaskEditModal';
import { SettingsModal } from './SettingsModal';
import { TaskBar } from './TaskBar';
import { KanbanView } from './KanbanView';
import type { Task, DayColors } from '@/types/gantt';

const GanttChart = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState<'gantt' | 'kanban'>('gantt');
  const [viewStartDate, setViewStartDate] = useState(new Date());
  const [dayColors, setDayColors] = useState<DayColors>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskStart, setNewTaskStart] = useState<Date | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, date: Date } | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef<HTMLDivElement>(null);

  const getDaysInView = () => {
    const days = [];
    const startDate = new Date(viewStartDate);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const getMonthGroups = () => {
    const days = getDaysInView();
    const monthGroups: { month: string; year: number; count: number }[] = [];
    
    days.forEach(date => {
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      const existing = monthGroups.find(group => 
        group.month === date.toLocaleString('default', { month: 'long' }) && 
        group.year === date.getFullYear()
      );
      
      if (existing) {
        existing.count++;
      } else {
        monthGroups.push({
          month: date.toLocaleString('default', { month: 'long' }),
          year: date.getFullYear(),
          count: 1
        });
      }
    });
    
    return monthGroups;
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      status: 'To Do'
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
  };

  const navigateEarlier = () => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setViewStartDate(newDate);
  };

  const navigateLater = () => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setViewStartDate(newDate);
  };

  const scrollToDate = (date: Date) => {
    const daysDiff = Math.floor((date.getTime() - viewStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const scrollPosition = daysDiff * 120;
    
    if (timelineRef.current && tasksRef.current) {
      timelineRef.current.scrollLeft = scrollPosition;
      tasksRef.current.scrollLeft = scrollPosition;
    }
  };

  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (tasksRef.current) {
      tasksRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleTasksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleMouseDown = (e: React.MouseEvent, date: Date) => {
    if (e.button === 0) {
      setDragStart({ x: e.clientX, date });
      setIsCreatingTask(true);
      setNewTaskStart(date);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isCreatingTask && dragStart && e.buttons === 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dayIndex = Math.floor(x / 120);
      const days = getDaysInView();
      
      if (dayIndex >= 0 && dayIndex < days.length) {
        const endDate = days[dayIndex];
        if (endDate >= dragStart.date) {
          // Visual feedback for task creation
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isCreatingTask && dragStart && newTaskStart && e.button === 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dayIndex = Math.floor(x / 120);
      const days = getDaysInView();
      
      if (dayIndex >= 0 && dayIndex < days.length) {
        const endDate = days[dayIndex];
        if (endDate >= newTaskStart) {
          const newTask: Omit<Task, 'id'> = {
            title: 'New Task',
            description: '',
            startDate: newTaskStart,
            endDate: endDate,
            color: '#3b82f6',
            milestones: []
          };
          addTask(newTask);
        }
      }
      
      setIsCreatingTask(false);
      setDragStart(null);
      setNewTaskStart(null);
    }
  };

  if (currentView === 'kanban') {
    return (
      <div className="h-screen bg-background">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Project Tasks</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant={currentView === 'gantt' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('gantt')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Gantt
                </Button>
                <Button
                  variant={currentView === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('kanban')}
                  className="flex items-center gap-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <KanbanView 
          tasks={tasks}
          onTaskUpdate={updateTask}
          onTaskClick={handleTaskClick}
        />

        {editingTask && (
          <TaskEditModal
            task={editingTask}
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSave={(updatedTask) => {
              updateTask(editingTask.id, updatedTask);
              setEditingTask(null);
            }}
            onDelete={() => {
              deleteTask(editingTask.id);
              setEditingTask(null);
            }}
          />
        )}

        {showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            dayColors={dayColors}
            onDayColorsChange={setDayColors}
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              scrollToDate(date);
            }}
          />
        )}
      </div>
    );
  }

  const days = getDaysInView();
  const monthGroups = getMonthGroups();

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">Project Tasks</h1>
            <div className="flex items-center gap-2">
              <Button
                variant={currentView === 'gantt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('gantt')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Gantt
              </Button>
              <Button
                variant={currentView === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('kanban')}
                className="flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={navigateEarlier} variant="outline" size="sm">
              Earlier
            </Button>
            <Button onClick={navigateLater} variant="outline" size="sm">
              Later
            </Button>
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Timeline Header */}
        <div 
          ref={timelineRef}
          className="overflow-x-auto scrollbar-thin"
          onScroll={handleTimelineScroll}
        >
          <div className="flex" style={{ minWidth: `${days.length * 120}px` }}>
            {/* Month Headers */}
            <div className="flex h-12 border-b border-border">
              {monthGroups.map((group, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center bg-muted text-sm font-medium border-r border-border"
                  style={{ width: `${group.count * 120}px` }}
                >
                  {group.month} {group.year}
                </div>
              ))}
            </div>
          </div>
          
          {/* Day Headers */}
          <div className="flex" style={{ minWidth: `${days.length * 120}px` }}>
            {days.map((date, index) => {
              const isHighlighted = selectedDate && 
                date.toDateString() === selectedDate.toDateString();
              const dayColor = dayColors[date.getDay()];
              
              return (
                <div
                  key={index}
                  className={`w-30 h-16 border-r border-border flex flex-col items-center justify-center text-sm transition-all duration-200 ${
                    isHighlighted ? 'bg-primary/20 border-primary' : 'bg-card hover:bg-muted/50'
                  }`}
                  style={{
                    backgroundColor: isHighlighted ? undefined : dayColor,
                    width: '120px'
                  }}
                >
                  <div className="font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks Area */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={tasksRef}
          className="h-full overflow-auto scrollbar-thin"
          onScroll={handleTasksScroll}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const dayIndex = Math.floor(x / 120);
            if (dayIndex >= 0 && dayIndex < days.length) {
              handleMouseDown(e, days[dayIndex]);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div 
            className="relative bg-background"
            style={{ minWidth: `${days.length * 120}px`, minHeight: '400px' }}
          >
            {/* Grid Lines */}
            {days.map((_, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 border-r border-border/30"
                style={{ left: `${index * 120}px`, width: '1px' }}
              />
            ))}

            {/* Tasks */}
            {tasks.map((task) => (
              <TaskBar
                key={task.id}
                task={task}
                viewStartDate={viewStartDate}
                onClick={() => handleTaskClick(task)}
              />
            ))}
          </div>
        </div>
      </div>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(updatedTask) => {
            updateTask(editingTask.id, updatedTask);
            setEditingTask(null);
          }}
          onDelete={() => {
            deleteTask(editingTask.id);
            setEditingTask(null);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          dayColors={dayColors}
          onDayColorsChange={setDayColors}
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            setSelectedDate(date);
            scrollToDate(date);
          }}
        />
      )}
    </div>
  );
};

export default GanttChart;
