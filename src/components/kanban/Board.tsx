"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Plus, Tag, Archive } from "lucide-react";
import Column from "./Column";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import CategoryManager from "./CategoryManager";
import GlassButton from "@/components/ui/GlassButton";
import { useGroupedTasks, useMoveTask, useCreateTaskMutation } from "@/hooks/useTasks";
import { useArchiveTasksMutation } from "@/hooks/useArchives";
import { useUser } from "@/lib/auth/hooks";
import type { Task, TaskStatus } from "@/types/supabase";

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "BACKLOG", title: "Backlog", color: "rgba(255,255,255,0.4)" },
  { id: "TODO", title: "To Do", color: "#7dd3fc" },
  { id: "IN_PROGRESS", title: "In Progress", color: "#c084fc" },
  { id: "REVIEW", title: "Review", color: "#fbbf24" },
  { id: "DONE", title: "Done", color: "#4ade80" },
];

export default function Board() {
  const { grouped, isLoading } = useGroupedTasks();
  const { moveTask } = useMoveTask();
  const createTask = useCreateTaskMutation();
  const archiveMutation = useArchiveTasksMutation();
  const { user } = useUser();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = event.active.id as string;
      const allTasks = Object.values(grouped).flat();
      const task = allTasks.find((t) => t.id === taskId);
      if (task) setActiveTask(task);
    },
    [grouped]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || !user) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Check if dropped over a column
      const targetColumn = COLUMNS.find((col) => col.id === overId);
      if (targetColumn) {
        const tasksInColumn = grouped[targetColumn.id];
        moveTask(taskId, targetColumn.id, tasksInColumn.length, user.id);
        return;
      }

      // Dropped over another task — find which column
      const allTasks = Object.values(grouped).flat();
      const overTask = allTasks.find((t) => t.id === overId);
      if (overTask) {
        const tasksInColumn = grouped[overTask.status];
        const overIndex = tasksInColumn.findIndex((t) => t.id === overId);
        moveTask(taskId, overTask.status, overIndex, user.id);
      }
    },
    [grouped, moveTask, user]
  );

  const handleCreateTask = useCallback(() => {
    if (!user) return;
    setShowCreateModal(true);
  }, [user]);

  const handleArchive = useCallback(() => {
    if (!user) return;
    if (confirm("¿Archivar todas las tareas completadas? Se moverán al archivo mensual.")) {
      archiveMutation.mutate({ userId: user.id });
    }
  }, [user, archiveMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-transparent border-t-sky-300 border-r-purple-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const doneCount = grouped["DONE"]?.length || 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
          <p className="text-white/40 text-sm mt-1">
            Gestiona tus tareas en flujos de trabajo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" size="sm" onClick={() => setShowCategoryManager(true)}>
            <Tag size={14} />
            Categorías
          </GlassButton>
          {doneCount > 0 && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              loading={archiveMutation.isPending}
            >
              <Archive size={14} />
              Archivar ({doneCount})
            </GlassButton>
          )}
          <GlassButton onClick={handleCreateTask}>
            <Plus size={16} />
            Nueva Tarea
          </GlassButton>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
          {COLUMNS.map((column, index) => (
            <motion.div
              key={column.id}
              className="flex-shrink-0 w-[280px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <Column
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={grouped[column.id]}
                onTaskClick={setEditingTask}
              />
            </motion.div>
          ))}
        </div>

        <DragOverlay dropAnimation={{
          duration: 250,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        }}>
          {activeTask && (
            <TaskCard task={activeTask} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>

      {/* Create / Edit Modal */}
      {(showCreateModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager onClose={() => setShowCategoryManager(false)} />
      )}
    </>
  );
}
