
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, startDate: new Date() });
  const barRef = useRef<HTMLDivElement>(null);

  const dayWidth = 60;

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

  const getTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
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

  const handleLeftResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingLeft(true);
  };

  const handleRightResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingRight(true);
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
      } else if (isResizingLeft) {
        const rect = barRef.current?.getBoundingClientRect();
        if (rect) {
          const relativeX = e.clientX - rect.left;
          const daysDelta = Math.round(-relativeX / dayWidth);
          
          const newStartDate = new Date(task.startDate);
          newStartDate.setDate(newStartDate.getDate() + daysDelta);
          
          if (newStartDate < task.endDate) {
            onUpdate({ startDate: newStartDate });
          }
        }
      } else if (isResizingRight) {
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
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isDragging || isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizingLeft, isResizingRight, dragStart, task, dayWidth, onUpdate]);

  return (
    <>
      <div
        ref={barRef}
        className="absolute rounded-xl shadow-sm border transition-all duration-300 hover:shadow-lg cursor-pointer group"
        style={{
          left: `${left}px`,
          top: `${yPosition}px`,
          width: `${width}px`,
          height: '44px',
          backgroundColor: task.color,
          borderColor: task.color,
          color: getTextColor(task.color),
          zIndex: isDragging || isResizingLeft || isResizingRight ? 10 : 1,
          transform: isDragging || isResizingLeft || isResizingRight ? 'scale(1.02)' : 'scale(1)'
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          if (!isDragging && !isResizingLeft && !isResizingRight) {
            onClick();
          }
        }}
      >
        <div className="task-content h-full px-4 py-2 flex items-center justify-between pointer-events-none">
          <div className="task-content flex items-center gap-2 flex-1 truncate">
            <button
              className="pointer-events-auto opacity-70 hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <span className="task-content text-sm font-medium truncate">
              {task.title}
            </span>
          </div>
          
          {/* Left resize handle */}
          <div 
            className="absolute left-0 top-0 w-2 h-full bg-black bg-opacity-20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto rounded-l-xl"
            onMouseDown={handleLeftResizeMouseDown}
          />
          
          {/* Right resize handle */}
          <div 
            className="absolute right-0 top-0 w-2 h-full bg-black bg-opacity-20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto rounded-r-xl"
            onMouseDown={handleRightResizeMouseDown}
          />
        </div>
      </div>
      
      {/* Expanded description */}
      {isExpanded && task.description && (
        <div
          className="absolute bg-card border border-border rounded-xl shadow-lg p-4 max-w-md z-20 transition-all duration-300 animate-in slide-in-from-top-2"
          style={{
            left: `${left}px`,
            top: `${yPosition + 50}px`,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div className="text-sm text-muted-foreground leading-relaxed">
            {task.description}
          </div>
          {task.milestones.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">Milestones:</div>
              <div className="flex flex-wrap gap-1">
                {task.milestones.map((milestone, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 bg-muted rounded-full text-xs"
                  >
                    {milestone}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
