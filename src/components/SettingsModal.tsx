
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { DayColors } from '@/types/gantt';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayColors: DayColors;
  onDayColorsChange: (colors: DayColors) => void;
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dayColors,
  onDayColorsChange,
  selectedDate,
  onDateSelect
}) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const colorOptions = [
    '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db',
    '#fef3c7', '#fed7aa', '#fecaca', '#fbb6ce', '#ddd6fe',
    '#bfdbfe', '#a7f3d0', '#fde68a'
  ];

  const handleColorChange = (dayIndex: number, color: string) => {
    onDayColorsChange({ ...dayColors, [dayIndex]: color });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Day Color Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Customize the background color for each day of the week in your Gantt chart.
          </p>
          
          {dayNames.map((dayName, index) => (
            <div key={index} className="space-y-2">
              <Label>{dayName}</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      dayColors[index] === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(index, color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
