import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, GripVertical, Trash2, BarChart3, Kanban, Calendar as CalendarIcon, Settings, Moon, Sun, Menu } from 'lucide-react';
import type { Task, KanbanColumn } from '@/types/gantt';

interface KanbanViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
  onViewModeChange: (mode: 'gantt' | 'kanban') => void;
  onSettingsOpen: () => void;
  onCalendarOpen: () => void;
  onThemeToggle: () => void;
  theme: string;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onTaskUpdate,
  onTaskClick,
  onAddTask,
  onViewModeChange,
  onSettingsOpen,
  onCalendarOpen,
  onThemeToggle,
  theme
}) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'todo', title: 'To Do', taskIds: [] },
    { id: 'inprogress', title: 'In Progress', taskIds: [] },
    { id: 'done', title: 'Done', taskIds: [] }
  ]);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // Group tasks by status
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => (task.status || 'To Do') === status);
  };

  // Calculate progress based on column position
  const getTaskProgress = (taskStatus: string) => {
    const columnIndex = columns.findIndex(col => col.title === taskStatus);
    if (columnIndex === -1) return 0;
    
    const totalColumns = columns.length;
    if (totalColumns <= 1) return 100;
    
    return Math.round((columnIndex / (totalColumns - 1)) * 100);
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedTask) {
      const column = columns.find(col => col.id === columnId);
      if (column) {
        onTaskUpdate(draggedTask, { status: column.title });
      }
    }
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const addColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn: KanbanColumn = {
        id: Date.now().toString(),
        title: newColumnTitle.trim(),
        taskIds: []
      };
      setColumns(prev => [...prev, newColumn]);
      setNewColumnTitle('');
    }
  };

  const deleteColumn = (columnId: string) => {
    if (columns.length > 1) {
      const columnToDelete = columns.find(col => col.id === columnId);
      if (columnToDelete) {
        const tasksInColumn = getTasksByStatus(columnToDelete.title);
        tasksInColumn.forEach(task => {
          onTaskUpdate(task.id, { status: 'To Do' });
        });
      }
      setColumns(prev => prev.filter(col => col.id !== columnId));
    }
  };

  const getTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-6 border-b border-border bg-card">
        <h1 className="text-base sm:text-2xl font-bold truncate">Study Gantt</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button onClick={() => onViewModeChange('gantt')} variant="ghost" size="sm" className="rounded-md">
                <BarChart3 className="w-4 h-4 mr-2" /> Gantt
              </Button>
              <Button onClick={() => onViewModeChange('kanban')} variant="default" size="sm" className="rounded-md">
                <Kanban className="w-4 h-4 mr-2" /> Kanban
              </Button>
            </div>
            <Button onClick={onCalendarOpen} variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <CalendarIcon className="w-4 h-4" />
            </Button>
            <Button onClick={onAddTask} size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
            <Button onClick={onSettingsOpen} variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <Settings className="w-4 h-4" />
            </Button>
            <Button onClick={onThemeToggle} variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden rounded-xl">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex flex-col gap-2">
                  <Button onClick={() => onViewModeChange('gantt')} variant="ghost" className="justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" /> Gantt View
                  </Button>
                  <Button onClick={() => onViewModeChange('kanban')} variant="default" className="justify-start">
                    <Kanban className="w-4 h-4 mr-2" /> Kanban View
                  </Button>
                </div>
                <Button onClick={onCalendarOpen} variant="outline" className="justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" /> Go to Date
                </Button>
                <Button onClick={onAddTask} className="justify-start">
                  <Plus className="w-4 h-4 mr-2" /> Add Task
                </Button>
                <Button onClick={onSettingsOpen} variant="outline" className="justify-start">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </Button>
                <Button onClick={onThemeToggle} variant="outline" className="justify-start">
                  {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                  Toggle Theme
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Kanban Content */}
      <div className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
          {/* Mobile: Horizontal scroll, Desktop: Normal flex */}
          <div className="flex lg:contents gap-4 lg:gap-6 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.title);
              const isDraggedOver = draggedOverColumn === column.id;
              
              return (
                <div
                  key={column.id}
                  className={`flex-shrink-0 w-80 sm:w-96 lg:flex-1 lg:min-w-80 bg-card rounded-xl shadow-sm border transition-all duration-300 ${
                    isDraggedOver ? 'border-primary bg-primary/5 scale-102' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base sm:text-lg">{column.title}</h3>
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs font-medium">
                        {columnTasks.length}
                      </span>
                    </div>
                    {columns.length > 1 && (
                      <Button
                        onClick={() => deleteColumn(column.id)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="p-3 sm:p-4 space-y-3 min-h-96 max-h-screen overflow-y-auto">
                    {columnTasks.map((task) => {
                      const progress = getTaskProgress(task.status || 'To Do');
                      
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                          onClick={() => onTaskClick(task)}
                          className="p-3 sm:p-4 rounded-xl shadow-sm border cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-102 group active:scale-95 touch-manipulation"
                          style={{
                            backgroundColor: task.color,
                            borderColor: task.color,
                            color: getTextColor(task.color)
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm sm:text-base leading-tight pr-2">{task.title}</h4>
                            <GripVertical className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                          {task.description && (
                            <p className="text-xs sm:text-sm opacity-80 line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs opacity-70">Progress</span>
                              <span className="text-xs opacity-70">{progress}%</span>
                            </div>
                            <Progress 
                              value={progress} 
                              className="h-2 bg-black/20"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.2)'
                              }}
                            />
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs opacity-70 gap-1 sm:gap-0">
                            <span className="text-xs">
                              {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                            </span>
                            {task.milestones.length > 0 && (
                              <span className="text-xs">{task.milestones.length} milestones</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Add Column */}
          <div className="flex-shrink-0 w-80 sm:w-96 lg:w-80 bg-card rounded-xl shadow-sm border border-dashed border-muted-foreground/30">
            <div className="p-3 sm:p-4">
              <div className="space-y-3">
                <Input
                  placeholder="Column title"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addColumn()}
                  className="rounded-xl text-sm sm:text-base"
                />
                <Button
                  onClick={addColumn}
                  variant="outline"
                  className="w-full rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  disabled={!newColumnTitle.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Column
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
