import React, { useState, useCallback } from "react";
import { Task } from "@/types";
import { Plus, Settings, BarChart3, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddTaskModal } from "./AddTaskModal";
import { TaskEditModal } from "./TaskEditModal";
import { SettingsModal } from "./SettingsModal";
import { GanttView } from "./GanttView";
import { KanbanView } from "./KanbanView";

interface GanttChartProps {
  tasks: Task[];
  onTaskUpdate: (id: string, updates: Partial<Task>) => void;
  onTaskDelete: (id: string) => void;
  onTaskCreate: (task: Omit<Task, "id">) => void;
}

type View = "gantt" | "kanban";

const GanttChart = ({ tasks, onTaskUpdate, onTaskDelete, onTaskCreate }: GanttChartProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<View>("gantt");

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Project Timeline</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "gantt" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("gantt")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Gantt
            </Button>
            <Button
              variant={view === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("kanban")}
            >
              <Columns className="w-4 h-4 mr-2" />
              Kanban
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "gantt" ? (
          <GanttView tasks={tasks} onTaskClick={handleTaskClick} />
        ) : (
          <KanbanView 
            tasks={tasks} 
            onTaskUpdate={onTaskUpdate}
            onTaskDelete={onTaskDelete}
          />
        )}
      </div>

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTask={onTaskCreate}
      />

      <TaskEditModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={onTaskUpdate}
        onDelete={onTaskDelete}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default GanttChart;
