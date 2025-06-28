
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { Task } from '@/types/gantt';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#6b7280',
    textColor: '',
    progressBarColor: '',
    milestones: [] as string[]
  });
  const [newMilestone, setNewMilestone] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        startDate: task.startDate.toISOString().split('T')[0],
        endDate: task.endDate.toISOString().split('T')[0],
        color: task.color,
        textColor: task.textColor || '',
        progressBarColor: task.progressBarColor || '',
        milestones: [...task.milestones]
      });
    }
  }, [task]);

  const handleSave = () => {
    if (task) {
      onSave({
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        color: formData.color,
        textColor: formData.textColor || undefined,
        progressBarColor: formData.progressBarColor || undefined,
        milestones: formData.milestones
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (task && confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const addMilestone = () => {
    if (newMilestone.trim()) {
      setFormData(prev => ({
        ...prev,
        milestones: [...prev.milestones, newMilestone.trim()]
      }));
      setNewMilestone('');
    }
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const colorOptions = [
    '#6b7280', '#374151', '#1f2937', // Grays
    '#dc2626', '#ea580c', '#d97706', // Reds/Oranges
    '#65a30d', '#16a34a', '#059669', // Greens
    '#0284c7', '#2563eb', '#7c3aed', // Blues/Purples
    '#c026d3', '#db2777' // Magentas
  ];

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Task Background Color */}
          <div className="space-y-2">
            <Label>Task Background Color</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 ${
                    formData.color === color ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
            <Input
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="#000000"
              className="w-32"
            />
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label>Text Color (Optional)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['#ffffff', '#000000', '#6b7280', '#dc2626', '#16a34a', '#2563eb'].map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 ${
                    formData.textColor === color ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, textColor: color }))}
                />
              ))}
            </div>
            <Input
              value={formData.textColor}
              onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
              placeholder="#ffffff (leave empty for auto)"
              className="w-64"
            />
          </div>

          {/* Progress Bar Color */}
          <div className="space-y-2">
            <Label>Progress Bar Color (Optional)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 ${
                    formData.progressBarColor === color ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, progressBarColor: color }))}
                />
              ))}
            </div>
            <Input
              value={formData.progressBarColor}
              onChange={(e) => setFormData(prev => ({ ...prev, progressBarColor: e.target.value }))}
              placeholder="#22c55e (leave empty for default)"
              className="w-64"
            />
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <Label>Milestones</Label>
            <div className="flex gap-2">
              <Input
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Add milestone"
                onKeyPress={(e) => e.key === 'Enter' && addMilestone()}
              />
              <Button onClick={addMilestone} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.milestones.map((milestone, index) => (
                <Badge key={index} variant="secondary" className="pr-1">
                  {milestone}
                  <button
                    onClick={() => removeMilestone(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="destructive" onClick={handleDelete}>
              Delete Task
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
