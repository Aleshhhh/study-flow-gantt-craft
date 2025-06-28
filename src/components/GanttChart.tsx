import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, LayoutGrid, Plus, Settings, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { TaskEditModal } from '@/components/TaskEditModal';
import { AddTaskModal } from '@/components/AddTaskModal';
import { KanbanView } from '@/components/KanbanView';
import type { Task, DayColors } from '@/types/gantt';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (task: Task) => void;
}

interface TaskBarProps {
  task: Task;
  onClick: () => void;
  days: Date[];
  dayWidth: number;
  dayColors: DayColors;
}

const TaskBar: React.FC<TaskBarProps> = ({ task, onClick, days, dayWidth, dayColors }) => {
  const startDate = task.startDate;
  const endDate = task.endDate;

  const taskStartDay = days.findIndex(day => format(day, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd'));
  const taskEndDay = days.findIndex(day => format(day, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd'));

  if (taskStartDay === -1 || taskEndDay === -1) {
    return null;
  }

  const startPosition = taskStartDay * dayWidth;
  const duration = (taskEndDay - taskStartDay + 1) * dayWidth;

  const getTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  return (
    <div
      onClick={onClick}
      className="absolute h-8 rounded-md border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-102 flex items-center justify-start overflow-hidden px-3"
      style={{
        left: `${startPosition}px`,
        width: `${duration}px`,
        backgroundColor: task.color,
        color: task.textColor || getTextColor(task.color)
      }}
    >
      <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">{task.title}</span>
    </div>
  );
};

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  onTaskUpdate,
  onTaskClick
}) => {
  const [currentView, setCurrentView] = useState<'gantt' | 'kanban'>('gantt');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dayColors, setDayColors] = useState<DayColors>({});

  const dayWidth = 50 * zoomLevel;
  const numberOfDays = 60;

  const getTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const generateDays = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 30); // Go back 30 days
    
    const daysArray: Date[] = [];
    for (let i = 0; i < numberOfDays; i++) {
      const nextDay = new Date(start);
      nextDay.setDate(start.getDate() + i);
      daysArray.push(nextDay);
    }
    return daysArray;
  };

  const days = generateDays();
  const timelineWidth = days.length * dayWidth;

  const handleTaskSave = (updates: Partial<Task>) => {
    if (selectedTask) {
      onTaskUpdate(selectedTask.id, updates);
      setSelectedTask(null);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    onTaskDelete(taskId);
    setSelectedTask(null);
  };

  const handleAddTask = (newTask: Task) => {
    onTaskCreate(newTask);
    setIsAddTaskOpen(false);
  };

  const handleViewChange = (newView: 'gantt' | 'kanban') => {
    setCurrentView(newView);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">Project Timeline</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={currentView === 'gantt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('gantt')}
                className="px-3 py-1 text-xs sm:text-sm"
              >
                <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Gantt</span>
              </Button>
              <Button
                variant={currentView === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('kanban')}
                className="px-3 py-1 text-xs sm:text-sm"
              >
                <LayoutGrid className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
            </div>
            
            {/* Settings and Add Task buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="px-2 sm:px-3 py-1"
              >
                <Settings className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Settings</span>
              </Button>
              <Button
                onClick={() => setIsAddTaskOpen(true)}
                size="sm"
                className="px-2 sm:px-3 py-1"
              >
                <Plus className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Add Task</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'kanban' ? (
          <KanbanView
            tasks={tasks}
            onTaskUpdate={onTaskUpdate}
            onTaskClick={onTaskClick}
          />
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Task List Panel */}
            <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
              <div className="h-full overflow-auto border-r border-border">
                <div className="p-3 sm:p-4">
                  <h2 className="text-base sm:text-lg font-semibold mb-4">Tasks</h2>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-102"
                        style={{ 
                          backgroundColor: task.color,
                          color: task.textColor || getTextColor(task.color)
                        }}
                      >
                        <h3 className="font-medium text-sm mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs opacity-80 line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="text-xs opacity-70">
                          {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                        </div>
                        {task.milestones && task.milestones.length > 0 && (
                          <div className="text-xs opacity-70 mt-1">
                            {task.milestones.length} milestone{task.milestones.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Timeline Panel */}
            <ResizablePanel defaultSize={70} minSize={60}>
              <div className="h-full overflow-auto">
                {/* Timeline Header */}
                <div className="sticky top-0 bg-background border-b border-border z-10">
                  <div className="p-3 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h2 className="text-base sm:text-lg font-semibold">Timeline</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Zoom:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="min-w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date Header */}
                  <div className="px-3 sm:px-4 pb-2">
                    <div className="flex" style={{ minWidth: `${timelineWidth}px` }}>
                      {days.map((day) => {
                        const dayOfWeek = day.getDay();
                        const dayColor = dayColors[dayOfWeek] || '#ffffff';
                        
                        return (
                          <div
                            key={day.toISOString()}
                            className="flex-shrink-0 p-2 text-center border border-border text-xs font-medium"
                            style={{
                              width: `${dayWidth}px`,
                              backgroundColor: dayColor,
                              color: getTextColor(dayColor)
                            }}
                          >
                            <div>{format(day, 'MMM d')}</div>
                            <div className="text-xs opacity-70">{format(day, 'EEE')}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Timeline Content */}
                <div className="p-3 sm:p-4">
                  <div className="space-y-3" style={{ minWidth: `${timelineWidth}px` }}>
                    {tasks.map((task) => (
                      <TaskBar
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick(task)}
                        days={days}
                        dayWidth={dayWidth}
                        dayColors={dayColors}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Modals */}
      <TaskEditModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onSave={handleAddTask}
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
