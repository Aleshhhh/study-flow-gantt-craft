import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { DayColors, Task } from '@/types/gantt';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayColors: DayColors;
  onDayColorsChange: (colors: DayColors) => void;
  tasks?: Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dayColors,
  onDayColorsChange,
  tasks = [],
  onTaskUpdate
}) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const colorOptions = [
    '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db',
    '#0f172a', '#020617', '#1e293b', '#334155', '#475569',
    '#fef3c7', '#fed7aa', '#fecaca', '#fbb6ce', '#ddd6fe',
    '#bfdbfe', '#a7f3d0', '#fde68a', '#c084fc', '#fb7185'
  ];

  const [customColors, setCustomColors] = useState<{ [key: number]: string }>({});
  const [customTextColors, setCustomTextColors] = useState<{ [key: number]: string }>({});
  const [taskColors, setTaskColors] = useState<{ [taskId: string]: { background?: string; text?: string; progressBar?: string } }>({});

  const handleColorChange = (dayIndex: number, color: string) => {
    onDayColorsChange({ ...dayColors, [dayIndex]: color });
  };

  const handleCustomColorChange = (dayIndex: number, color: string) => {
    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
      setCustomColors(prev => ({ ...prev, [dayIndex]: color }));
      handleColorChange(dayIndex, color);
    }
  };

  const handleCustomTextColorChange = (dayIndex: number, color: string) => {
    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
      setCustomTextColors(prev => ({ ...prev, [dayIndex]: color }));
    }
  };

  const applyCustomColor = (dayIndex: number) => {
    const color = customColors[dayIndex];
    if (color) {
      handleColorChange(dayIndex, color);
    }
  };

  const handleTaskColorChange = (taskId: string, colorType: 'background' | 'text' | 'progressBar', color: string) => {
    setTaskColors(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [colorType]: color
      }
    }));
  };

  const applyTaskColor = (taskId: string, colorType: 'background' | 'text' | 'progressBar') => {
    const color = taskColors[taskId]?.[colorType];
    if (color && onTaskUpdate) {
      const updates: Partial<Task> = {};
      if (colorType === 'background') updates.color = color;
      if (colorType === 'text') updates.textColor = color;
      if (colorType === 'progressBar') updates.progressBarColor = color;
      onTaskUpdate(taskId, updates);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timeline Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Day Colors</TabsTrigger>
            <TabsTrigger value="custom">Custom Colors</TabsTrigger>
            <TabsTrigger value="tasks">Task Colors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="colors" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Customize the background color for each day of the week in your Gantt chart.
            </p>
            
            {dayNames.map((dayName, index) => (
              <div key={index} className="space-y-3">
                <Label className="text-sm font-medium">{dayName}</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                        dayColors[index] === color ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(index, color)}
                      title={color}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Current: {dayColors[index]}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add custom colors using hexadecimal color codes (e.g., #FF5733).
            </p>
            
            {dayNames.map((dayName, index) => (
              <div key={index} className="space-y-3 p-4 border border-border rounded-lg">
                <Label className="text-sm font-medium">{dayName}</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Background Color */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="#FFFFFF"
                        value={customColors[index] || ''}
                        onChange={(e) => setCustomColors(prev => ({ ...prev, [index]: e.target.value }))}
                        className="font-mono text-sm"
                        maxLength={7}
                      />
                      <div 
                        className="w-10 h-10 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: customColors[index] || dayColors[index] }}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => applyCustomColor(index)}
                      disabled={!customColors[index] || !/^#[0-9A-F]{6}$/i.test(customColors[index])}
                      className="w-full"
                    >
                      Apply Background
                    </Button>
                  </div>
                  
                  {/* Text Color */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="#000000"
                        value={customTextColors[index] || ''}
                        onChange={(e) => setCustomTextColors(prev => ({ ...prev, [index]: e.target.value }))}
                        className="font-mono text-sm"
                        maxLength={7}
                      />
                      <div 
                        className="w-10 h-10 rounded border border-border flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ 
                          backgroundColor: customColors[index] || dayColors[index],
                          color: customTextColors[index] || '#000000'
                        }}
                      >
                        Aa
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCustomTextColorChange(index, customTextColors[index])}
                      disabled={!customTextColors[index] || !/^#[0-9A-F]{6}$/i.test(customTextColors[index])}
                      className="w-full"
                    >
                      Apply Text Color
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-xs text-muted-foreground">
                  Current background: {dayColors[index]}
                  {customTextColors[index] && ` • Text: ${customTextColors[index]}`}
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Color Format Guide</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Use hexadecimal format: #RRGGBB</p>
                <p>• Example: #FF5733 (orange), #2563EB (blue), #000000 (black)</p>
                <p>• Colors must be exactly 6 characters after the #</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Customize the colors for individual tasks including background, text, and progress bar colors.
            </p>
            
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tasks available to customize.</p>
                <p className="text-xs mt-1">Create some tasks first to customize their colors.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{task.title}</h4>
                      <div 
                        className="w-8 h-8 rounded border border-border flex-shrink-0"
                        style={{ 
                          backgroundColor: task.color,
                          color: task.textColor || (task.color === '#ffffff' || task.color === '#f9fafb' ? '#000000' : '#ffffff')
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Background Color */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Background Color</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {colorOptions.slice(0, 10).map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                                task.color === color ? 'ring-2 ring-primary' : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => onTaskUpdate?.(task.id, { color })}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="#FFFFFF"
                            value={taskColors[task.id]?.background || ''}
                            onChange={(e) => handleTaskColorChange(task.id, 'background', e.target.value)}
                            className="font-mono text-sm"
                            maxLength={7}
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => applyTaskColor(task.id, 'background')}
                            disabled={!taskColors[task.id]?.background || !/^#[0-9A-F]{6}$/i.test(taskColors[task.id]?.background || '')}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      
                      {/* Text Color */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Text Color</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {['#000000', '#ffffff', '#374151', '#6b7280', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                                task.textColor === color ? 'ring-2 ring-primary' : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => onTaskUpdate?.(task.id, { textColor: color })}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="#000000"
                            value={taskColors[task.id]?.text || ''}
                            onChange={(e) => handleTaskColorChange(task.id, 'text', e.target.value)}
                            className="font-mono text-sm"
                            maxLength={7}
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => applyTaskColor(task.id, 'text')}
                            disabled={!taskColors[task.id]?.text || !/^#[0-9A-F]{6}$/i.test(taskColors[task.id]?.text || '')}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      
                      {/* Progress Bar Color */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Progress Bar Color</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'].map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                                task.progressBarColor === color ? 'ring-2 ring-primary' : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => onTaskUpdate?.(task.id, { progressBarColor: color })}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="#22C55E"
                            value={taskColors[task.id]?.progressBar || ''}
                            onChange={(e) => handleTaskColorChange(task.id, 'progressBar', e.target.value)}
                            className="font-mono text-sm"
                            maxLength={7}
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => applyTaskColor(task.id, 'progressBar')}
                            disabled={!taskColors[task.id]?.progressBar || !/^#[0-9A-F]{6}$/i.test(taskColors[task.id]?.progressBar || '')}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-xs text-muted-foreground">
                      Current: Background {task.color}
                      {task.textColor && ` • Text ${task.textColor}`}
                      {task.progressBarColor && ` • Progress ${task.progressBarColor}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
