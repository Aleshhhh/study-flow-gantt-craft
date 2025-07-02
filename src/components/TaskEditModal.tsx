
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
    textColor: '#000000',
    progressBarColor: '#3b82f6',
    milestones: [] as string[]
  });
  const [newMilestone, setNewMilestone] = useState('');
  const [customColors, setCustomColors] = useState({
    background: '',
    text: '',
    progressBar: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        startDate: task.startDate.toISOString().split('T')[0],
        endDate: task.endDate.toISOString().split('T')[0],
        color: task.color,
        textColor: task.textColor || '#000000',
        progressBarColor: task.progressBarColor || '#3b82f6',
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
        textColor: formData.textColor,
        progressBarColor: formData.progressBarColor,
        milestones: formData.milestones
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (task) {
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

  const applyCustomColor = (colorType: 'background' | 'text' | 'progressBar') => {
    const color = customColors[colorType];
    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
      if (colorType === 'background') {
        setFormData(prev => ({ ...prev, color }));
      } else if (colorType === 'text') {
        setFormData(prev => ({ ...prev, textColor: color }));
      } else if (colorType === 'progressBar') {
        setFormData(prev => ({ ...prev, progressBarColor: color }));
      }
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Task Details</TabsTrigger>
            <TabsTrigger value="colors">Custom Colors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
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

            {/* Color */}
            <div className="space-y-2">
              <Label>Task Background Color</Label>
              <div className="flex flex-wrap gap-2">
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
          </TabsContent>
          
          <TabsContent value="colors" className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Customize colors using hexadecimal color codes (e.g., #FF5733).
            </p>
            
            {/* Background Color */}
            <div className="space-y-3 p-4 border border-border rounded-lg">
              <Label className="text-sm font-medium">Background Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="#FFFFFF"
                  value={customColors.background}
                  onChange={(e) => setCustomColors(prev => ({ ...prev, background: e.target.value }))}
                  className="font-mono text-sm"
                  maxLength={7}
                />
                <div 
                  className="w-10 h-10 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: customColors.background || formData.color }}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => applyCustomColor('background')}
                  disabled={!customColors.background || !/^#[0-9A-F]{6}$/i.test(customColors.background)}
                >
                  Apply
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Current: {formData.color}
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-3 p-4 border border-border rounded-lg">
              <Label className="text-sm font-medium">Text Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="#000000"
                  value={customColors.text}
                  onChange={(e) => setCustomColors(prev => ({ ...prev, text: e.target.value }))}
                  className="font-mono text-sm"
                  maxLength={7}
                />
                <div 
                  className="w-10 h-10 rounded border border-border flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ 
                    backgroundColor: formData.color,
                    color: customColors.text || formData.textColor
                  }}
                >
                  Aa
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => applyCustomColor('text')}
                  disabled={!customColors.text || !/^#[0-9A-F]{6}$/i.test(customColors.text)}
                >
                  Apply
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Current: {formData.textColor}
              </div>
            </div>

            {/* Progress Bar Color */}
            <div className="space-y-3 p-4 border border-border rounded-lg">
              <Label className="text-sm font-medium">Progress Bar Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="#3B82F6"
                  value={customColors.progressBar}
                  onChange={(e) => setCustomColors(prev => ({ ...prev, progressBar: e.target.value }))}
                  className="font-mono text-sm"
                  maxLength={7}
                />
                <div 
                  className="w-10 h-4 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: customColors.progressBar || formData.progressBarColor }}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => applyCustomColor('progressBar')}
                  disabled={!customColors.progressBar || !/^#[0-9A-F]{6}$/i.test(customColors.progressBar)}
                >
                  Apply
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Current: {formData.progressBarColor}
              </div>
            </div>

            <Separator />

            {/* Preview */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium">Preview</h4>
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: formData.color,
                  color: formData.textColor 
                }}
              >
                <div className="font-medium">{formData.title || 'Task Title'}</div>
                <div className="text-sm opacity-80">{formData.description || 'Task description'}</div>
                <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      backgroundColor: formData.progressBarColor,
                      width: '60%'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Color Format Guide</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Use hexadecimal format: #RRGGBB</p>
                <p>• Example: #FF5733 (orange), #2563EB (blue), #000000 (black)</p>
                <p>• Colors must be exactly 6 characters after the #</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  );
};
