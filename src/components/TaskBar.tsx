
import React, { useState, useRef, useEffect } from 'react';
import type { Task } from '@/types/gantt';

interface TaskBarProps {
  task: Task;
  timeline: Date[];
  yPosition: number;
  onUpdate: (updates: Partial<Task>) => void;
  onClick: () => void;
}

export const TaskBar: React.FC<TaskBarProps> = ({ 
  task, 
  timeline, 
  yPosition, 
  onUpdate, 
  onClick 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, startDate: new Date() });
  const barRef = useRef<HTMLDivElement>(null);

  const dayWidth = 60; // Width of each day column

  // Calculate task position and width
  const getTaskPosition = () => {
    const startIndex = timeline.findIndex(date => 
      date.toDateString() === task.startDate.toDateString()
    );
    const endIndex = timeline.findIndex(date => 
      date.toDateString() === task.endDate.toDateString()
    );
    
    const left = Math.max(0, startIndex * dayWidth);
    const width = Math.max(dayWidth, (endIndex - startIndex + 1) * dayWidth);
    
    return { left, width };
  };

  const { left, width } = getTaskPosition();

  // Calculate text color based on background color
  const getTextColor = (backgroundColor: string) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('task-content')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, startDate: new Date(task.startDate) });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const daysDelta = Math.round(deltaX / dayWidth);
        
        const newStartDate = new Date(dragStart.startDate);
        newStartDate.setDate(newStartDate.getDate() + daysDelta);
        
        const duration = task.endDate.getTime() - task.startDate.getTime();
        const newEndDate = new Date(newStartDate.getTime() + duration);
        
        onUpdate({ startDate: newStartDate, endDate: newEndDate });
      } else if (isResizing) {
        const rect = barRef.current?.getBoundingClientRect();
        if (rect) {
          const relativeX = e.clientX - rect.left;
          const newWidth = Math.max(dayWidth, relativeX);
          const durationDays = Math.round(newWidth / dayWidth);
          
          const newEndDate = new Date(task.startDate);
          newEndDate.setDate(newEndDate.getDate() + durationDays - 1);
          
          onUpdate({ endDate: newEndDate });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, task, dayWidth, onUpdate]);

  return (
    <div
      ref={barRef}
      className="absolute rounded-md shadow-sm border transition-all duration-200 hover:shadow-md cursor-pointer group"
      style={{
        left: `${left}px`,
        top: `${yPosition}px`,
        width: `${width}px`,
        height: '36px',
        backgroundColor: task.color,
        borderColor: task.color,
        color: getTextColor(task.color),
        zIndex: isDragging || isResizing ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (!isDragging && !isResizing) {
          onClick();
        }
      }}
    >
      <div className="task-content h-full px-3 py-1 flex items-center justify-between pointer-events-none">
        <div className="task-content flex-1 truncate text-sm font-medium">
          {task.title}
        </div>
        <div 
          className="w-2 h-full bg-black bg-opacity-20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
          onMouseDown={handleResizeMouseDown}
        />
      </div>
    </div>
  );
};
