
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { DayColors } from '@/types/gantt';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayColors: DayColors;
  onDayColorsChange: (colors: DayColors) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dayColors,
  onDayColorsChange
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
      // For now, we'll store text colors in a separate state
      // In a real implementation, you'd need to extend the DayColors type
    }
  };

  const applyCustomColor = (dayIndex: number) => {
    const color = customColors[dayIndex];
    if (color) {
      handleColorChange(dayIndex, color);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timeline Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors">Day Colors</TabsTrigger>
            <TabsTrigger value="custom">Custom Colors</TabsTrigger>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
