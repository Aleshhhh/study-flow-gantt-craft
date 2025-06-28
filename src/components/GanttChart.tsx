
import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import type { Task, DayColors } from '@/types/gantt';
import { KanbanView } from './KanbanView';

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  dayColors?: DayColors;
  view?: 'gantt' | 'kanban';
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  onTaskUpdate,
  onTaskClick,
  dayColors = {},
  view = 'gantt'
}) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [dragging, setDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [columnWidth, setColumnWidth] = useState(50);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startDate,
    to: endDate,
  })
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDateRange({ from: startDate, to: endDate });
  }, [startDate, endDate]);

  useEffect(() => {
    if (dateRange?.from) setStartDate(dateRange.from);
    if (dateRange?.to) setEndDate(dateRange.to);
  }, [dateRange?.from, dateRange?.to]);

  const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const getDayColor = (date: Date): string | undefined => {
    const dayIndex = date.getDay();
    return dayColors[dayIndex];
  };

  const isWeekend = (date: Date): boolean => {
    const dayIndex = date.getDay();
    return dayIndex === 0 || dayIndex === 6; // Sunday or Saturday
  };

  const generateDates = (): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getTaskPosition = (task: Task): number => {
    const taskStart = task.startDate.getTime();
    const chartStart = startDate.getTime();
    const diff = taskStart - chartStart;
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    return daysDiff * columnWidth;
  };

  const getTaskWidth = (task: Task): number => {
    const taskStart = task.startDate.getTime();
    const taskEnd = task.endDate.getTime();
    const diff = taskEnd - taskStart;
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    return daysDiff * columnWidth;
  };

  const handleTaskClick = (task: Task, event: React.MouseEvent) => {
    event.stopPropagation();
    if (view === 'gantt') {
      onTaskClick(task);
    }
  };

  const handleMouseDown = (event: React.MouseEvent, date: Date) => {
    if (view === 'kanban') return;
    
    setDragging(true);
    setHoveredDate(date);
    setDragStart(date);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (view === 'kanban') return;
    
    if (dragging) {
      const rect = chartRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const dayOffset = Math.floor(mouseX / columnWidth);
        const newHoveredDate = new Date(startDate);
        newHoveredDate.setDate(startDate.getDate() + dayOffset);
        setHoveredDate(newHoveredDate);
      }
    }
  };

  const handleMouseUp = () => {
    if (view === 'kanban') return;
    
    if (dragging && dragStart && hoveredDate) {
      const daysDiff = (hoveredDate.getTime() - dragStart.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff !== 0 && draggedTask) {
        onTaskUpdate(draggedTask, {
          startDate: daysDiff > 0 ? dragStart : hoveredDate,
          endDate: daysDiff > 0 ? hoveredDate : dragStart,
        });
      }
      setDragging(false);
      setDraggedTask(null);
      setDragStart(null);
      setHoveredDate(null);
    }
  };

  const handleMouseEnter = (task: Task) => {
    if (dragging) {
      setDraggedTask(task.id);
    }
  };

  const handleColumnWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setColumnWidth(value);
    }
  };

  const moveChart = (days: number) => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() + days);
    setStartDate(newStartDate);

    const newEndDate = new Date(endDate);
    newEndDate.setDate(endDate.getDate() + days);
    setEndDate(newEndDate);
  };

  const moveToStart = () => {
    const firstTask = tasks.reduce((prev, curr) => (curr.startDate < prev.startDate ? curr : prev));
    if (firstTask) {
      setStartDate(new Date(firstTask.startDate));
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const newEndDate = new Date(firstTask.startDate);
      newEndDate.setDate(firstTask.startDate.getDate() + days);
      setEndDate(newEndDate);
    }
  };

  const moveToEnd = () => {
    const lastTask = tasks.reduce((prev, curr) => (curr.endDate > prev.endDate ? curr : prev));
    if (lastTask) {
      setEndDate(new Date(lastTask.endDate));
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const newStartDate = new Date(lastTask.endDate);
      newStartDate.setDate(lastTask.endDate.getDate() - days);
      setStartDate(newStartDate);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="columnWidth" className="text-sm">Column Width:</Label>
          <Input
            id="columnWidth"
            type="number"
            className="w-20 text-sm"
            value={columnWidth}
            onChange={handleColumnWidthChange}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={moveToStart}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => moveChart(-7)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={startDate}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                pagedNavigation
                className="border-0 rounded-md overflow-hidden"
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => moveChart(7)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={moveToEnd}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'gantt' ? (
        <div className="flex-1 overflow-auto">
          <div
            className="relative"
            style={{ width: `${daysInRange * columnWidth}px`, height: `${tasks.length * 40 + 40}px` }}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            ref={chartRef}
          >
            {/* Dates */}
            <div className="sticky top-0 left-0 grid grid-cols-[50px_repeat(auto-fill,minmax(50px,_1fr))] z-10 bg-background border-b border-border">
              <div className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-center h-10">Tasks</div>
              {generateDates().map((date) => (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "flex items-center justify-center h-10 border-r border-border text-xs",
                    isWeekend(date) ? 'bg-secondary' : '',
                    getDayColor(date) ? 'bg-primary/10' : '',
                  )}
                  style={{ width: `${columnWidth}px` }}
                >
                  {formatDate(date)}
                </div>
              ))}
            </div>

            {/* Tasks */}
            {tasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <div
                  className="absolute left-0 flex items-center justify-end h-10 bg-background border-b border-border font-medium text-sm"
                  style={{ top: `${index * 40 + 40}px`, width: '50px' }}
                >
                  <Button variant="ghost" size="sm" onClick={(e) => handleTaskClick(task, e)}>{task.title}</Button>
                </div>
                <div
                  key={task.id}
                  draggable={view === 'gantt'}
                  className="absolute h-10 rounded shadow-md border cursor-pointer touch-manipulation"
                  style={{
                    left: `${getTaskPosition(task) + 50}px`,
                    top: `${index * 40 + 40}px`,
                    width: `${getTaskWidth(task)}px`,
                    backgroundColor: task.color,
                    color: task.textColor || '#fff',
                  }}
                  onClick={(e) => handleTaskClick(task, e)}
                  onMouseDown={(event) => handleMouseDown(event, task.startDate)}
                  onMouseEnter={() => handleMouseEnter(task)}
                >
                  <div className="flex items-center h-full px-2 font-medium text-sm">
                    {task.title}
                    {/* Progress Bar */}
                    <Progress value={50} className="w-1/4 h-1 ml-auto" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <KanbanView tasks={tasks} onTaskUpdate={onTaskUpdate} onTaskClick={onTaskClick} />
      )}
    </div>
  );
};
