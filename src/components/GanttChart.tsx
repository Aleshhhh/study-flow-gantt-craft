import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, List } from 'lucide-react';
import { TaskBar } from '@/components/TaskBar';
import { TaskEditModal } from '@/components/TaskEditModal';
import { AddTaskModal } from '@/components/AddTaskModal';
import { SettingsModal } from '@/components/SettingsModal';
import { KanbanView } from '@/components/KanbanView';
import type { Task } from '@/types/gantt';

interface GanttChartProps {
  viewMode: 'gantt' | 'kanban';
  onViewModeChange: (mode: 'gantt' | 'kanban') => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ viewMode, onViewModeChange }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState({ scrollLeft: 0, scrollTop: 0 });
  const [customDayColors, setCustomDayColors] = useState<{ [date: string]: string }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('gantt-tasks');
    const savedScrollPosition = localStorage.getItem('gantt-scroll-position');
    const savedCustomDayColors = localStorage.getItem('gantt-custom-day-colors');
    
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate)
        }));
        setTasks(tasksWithDates);
      } catch (error) {
        console.error('Error parsing saved tasks:', error);
      }
    }
    
    if (savedScrollPosition) {
      try {
        const position = JSON.parse(savedScrollPosition);
        setScrollPosition(position);
      } catch (error) {
        console.error('Error parsing saved scroll position:', error);
      }
    }
    
    if (savedCustomDayColors) {
      try {
        const colors = JSON.parse(savedCustomDayColors);
        setCustomDayColors(colors);
      } catch (error) {
        console.error('Error parsing saved custom day colors:', error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('gantt-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save scroll position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gantt-scroll-position', JSON.stringify(scrollPosition));
  }, [scrollPosition]);

  // Save custom day colors to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('gantt-custom-day-colors', JSON.stringify(customDayColors));
  }, [customDayColors]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollPosition.scrollLeft;
      scrollContainerRef.current.scrollTop = scrollPosition.scrollTop;
    }
  }, [scrollContainerRef.current]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition({
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop,
      });
    }
  };

  const handleAddTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
    setIsAddTaskOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Partial<Task>) => {
    if (!editingTask) return;

    setTasks(tasks.map(task => {
      if (task.id === editingTask.id) {
        return {
          ...task,
          ...updatedTask,
          startDate: updatedTask.startDate instanceof Date ? updatedTask.startDate : new Date(updatedTask.startDate as string),
          endDate: updatedTask.endDate instanceof Date ? updatedTask.endDate : new Date(updatedTask.endDate as string),
        };
      }
      return task;
    }));
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setIsEditModalOpen(false);
  };

  const handleUpdateCustomDayColors = (newColors: { [date: string]: string }) => {
    setCustomDayColors(newColors);
    setIsSettingsOpen(false);
  };

  const navigateToTask = (taskId: string) => {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      // Basic navigation logic - adjust as needed
      alert(`Navigating to task ${taskId}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Task List Toggle */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTaskListOpen(!isTaskListOpen)}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Tasks ({tasks.length})
          </Button>
          <div className="text-sm text-muted-foreground">
            {viewMode === 'gantt' ? 'Gantt View' : 'Kanban View'}
          </div>
        </div>
        <Button onClick={() => setIsAddTaskOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="flex-1 flex relative">
        {/* Task List Sidebar */}
        {isTaskListOpen && (
          <div className="w-80 border-r bg-background flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Task List</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks yet. Add your first task to get started!
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigateToTask(task.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: task.color }}
                        />
                        <span className="font-medium text-sm">{task.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                      </div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </div>
                      )}
                      {task.milestones.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.milestones.slice(0, 2).map((milestone, index) => (
                            <span
                              key={index}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {milestone}
                            </span>
                          ))}
                          {task.milestones.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{task.milestones.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'gantt' && (
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-auto"
              onScroll={handleScroll}
            >
              <div className="p-4">
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <TaskBar
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      customDayColors={customDayColors}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="flex-1">
              <KanbanView
                tasks={tasks}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleDeleteTask}
                onEditTask={handleEditTask}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskEditModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleTaskUpdate}
        onDelete={handleDeleteTask}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAdd={handleAddTask}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        customDayColors={customDayColors}
        onUpdateCustomDayColors={handleUpdateCustomDayColors}
      />
    </div>
  );
};
