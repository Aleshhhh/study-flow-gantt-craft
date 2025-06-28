import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TaskBar } from './TaskBar';
import { SettingsModal } from './SettingsModal';
import { TaskEditModal } from './TaskEditModal';
import { Settings, Plus } from 'lucide-react';
import type { Task, DayColors } from '@/types/gantt';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Omit<Task, 'id'>) => void;
  onTaskDelete: (taskId: string) => void;
  currentView: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  currentView
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dayColors, setDayColors] = useState<DayColors>({
    0: '#1a1a1a', // Sunday - dark
    1: '#262626', // Monday - slightly lighter
    2: '#1a1a1a', // Tuesday - dark
    3: '#262626', // Wednesday - slightly lighter
    4: '#1a1a1a', // Thursday - dark
    5: '#262626', // Friday - slightly lighter
    6: '#333333'  // Saturday - lighter weekend
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; date: Date } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (currentView === 'gantt') {
        setScrollPosition(container.scrollLeft);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && currentView === 'gantt') {
      container.scrollLeft = scrollPosition;
    }
  }, [currentView, scrollPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dayWidth = 120;
      const dayIndex = Math.floor(x / dayWidth);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + dayIndex);
      
      setIsDragging(true);
      setDragStart({ x, date: startDate });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart) {
      // Visual feedback during drag
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && dragStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const dayWidth = 120;
      const endDayIndex = Math.floor(endX / dayWidth);
      const startDayIndex = Math.floor(dragStart.x / dayWidth);
      
      if (Math.abs(endDayIndex - startDayIndex) >= 1) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + Math.min(startDayIndex, endDayIndex));
        
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + Math.abs(endDayIndex - startDayIndex));
        
        const newTask: Omit<Task, 'id'> = {
          title: 'New Task',
          description: '',
          startDate,
          endDate,
          color: '#f5f5dc',
          milestones: []
        };
        
        onTaskCreate(newTask);
      }
    }
    setIsDragging(false);
    setDragStart(null);
  };

  const getCurrentMonth = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = -30; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = generateDays();

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Study Gantt</h2>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">
            {getCurrentMonth()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className="flex border-b border-border sticky top-0 bg-background z-10">
            {days.map((day, index) => (
              <div
                key={index}
                className="w-30 p-2 text-center border-r border-border text-sm"
                style={{ 
                  backgroundColor: dayColors[day.getDay()],
                  color: '#f5f5dc'
                }}
              >
                <div className="font-medium">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs opacity-70">
                  {day.getDate()}/{day.getMonth() + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div className="relative min-h-96">
            {tasks.map((task, index) => (
              <TaskBar
                key={task.id}
                task={task}
                startDate={days[0]}
                dayWidth={120}
                rowHeight={60}
                top={index * 70 + 20}
                onTaskClick={setSelectedTask}
                onTaskUpdate={onTaskUpdate}
              />
            ))}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        dayColors={dayColors}
        onDayColorsChange={setDayColors}
      />

      <TaskEditModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={(updates) => {
          if (selectedTask) {
            onTaskUpdate(selectedTask.id, updates);
            setSelectedTask(null);
          }
        }}
        onDelete={(taskId) => {
          onTaskDelete(taskId);
          setSelectedTask(null);
        }}
      />
    </div>
  );
};
