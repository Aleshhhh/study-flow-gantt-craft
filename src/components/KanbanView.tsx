
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import type { Task, KanbanColumn } from '@/types/gantt';

interface KanbanViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onTaskUpdate,
  onTaskClick
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
      // Move tasks from deleted column to "To Do"
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
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex gap-6 h-full">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.title);
          const isDraggedOver = draggedOverColumn === column.id;
          
          return (
            <div
              key={column.id}
              className={`flex-1 min-w-80 bg-card rounded-xl shadow-sm border transition-all duration-300 ${
                isDraggedOver ? 'border-primary bg-primary/5 scale-102' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{column.title}</h3>
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
              
              <div className="p-4 space-y-3 min-h-96">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => onTaskClick(task)}
                    className="p-4 rounded-xl shadow-sm border cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-102 group"
                    style={{
                      backgroundColor: task.color,
                      borderColor: task.color,
                      color: getTextColor(task.color)
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                      <GripVertical className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {task.description && (
                      <p className="text-xs opacity-80 line-clamp-2 mb-3">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>
                        {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                      </span>
                      {task.milestones.length > 0 && (
                        <span>{task.milestones.length} milestones</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Add Column */}
        <div className="w-80 bg-card rounded-xl shadow-sm border border-dashed border-muted-foreground/30">
          <div className="p-4">
            <div className="space-y-3">
              <Input
                placeholder="Column title"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addColumn()}
                className="rounded-xl"
              />
              <Button
                onClick={addColumn}
                variant="outline"
                className="w-full rounded-xl transition-all duration-300 hover:scale-105"
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
  );
};
