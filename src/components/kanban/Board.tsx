"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Plus, Tag, Archive, UserPlus, Users } from "lucide-react";
import Column from "./Column";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import CategoryManager from "./CategoryManager";
import CollaboratorsPanel from "./CollaboratorsPanel";
import GlassButton from "@/components/ui/GlassButton";
import { useGroupedTasks, useMoveTask } from "@/hooks/useTasks";
import { useArchiveTasksMutation } from "@/hooks/useArchives";
import { useBoardMembersQuery } from "@/hooks/useBoards";
import { useUser } from "@/lib/auth/hooks";
import { useBoardRole } from "@/lib/boards/access";
import type { TaskStatus, TaskWithPeople } from "@/types/supabase";

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
  const archiveMutation = useArchiveTasksMutation();
  const { user, profile } = useUser();
  const { isEditor, isOwner } = useBoardRole();
  const { data: members } = useBoardMembersQuery(profile?.active_board_id || null);

  const [activeTask, setActiveTask] = useState<TaskWithPeople | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithPeople | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [showCollaboratorsPanel, setShowCollaboratorsPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inviteButtonRef = useRef<HTMLButtonElement | null>(null);
  const collaboratorsButtonRef = useRef<HTMLButtonElement | null>(null);

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

  // Handle arrow-based movement between columns
  const handleMoveTaskByArrow = useCallback(
    (taskId: string, direction: "left" | "right", currentColumnId: TaskStatus) => {
      if (!user) return;

      const currentIndex = COLUMNS.findIndex((col) => col.id === currentColumnId);
      const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= COLUMNS.length) return;

      const targetColumn = COLUMNS[targetIndex];
      const tasksInTarget = grouped[targetColumn.id];
      moveTask(taskId, targetColumn.id, tasksInTarget.length, user.id);
    },
    [grouped, moveTask, user]
  );

  const handleCreateTask = useCallback(() => {
    if (!user || !isEditor) return;
    setShowCreateModal(true);
  }, [user, isEditor]);

  const handleArchive = useCallback(() => {
    if (!user || !isEditor) return;
    if (confirm("Archive all completed tasks? They will be moved to the monthly archive.")) {
      archiveMutation.mutate({ userId: user.id });
    }
  }, [user, isEditor, archiveMutation]);

  useEffect(() => {
    if (!showInvitePanel && !showCollaboratorsPanel) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (inviteButtonRef.current?.contains(target)) return;
      if (collaboratorsButtonRef.current?.contains(target)) return;
      setShowInvitePanel(false);
      setShowCollaboratorsPanel(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setShowInvitePanel(false);
      setShowCollaboratorsPanel(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInvitePanel, showCollaboratorsPanel]);

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
            Manage your tasks in workflow stages
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GlassButton variant="ghost" size="sm" onClick={() => setShowCategoryManager(true)} disabled={!isEditor}>
            <Tag size={14} />
            Categories
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowInvitePanel((prev) => !prev);
              setShowCollaboratorsPanel(false);
            }}
            disabled={!isOwner}
            ref={inviteButtonRef}
          >
            <UserPlus size={14} />
            Invitar
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowCollaboratorsPanel((prev) => !prev);
              setShowInvitePanel(false);
            }}
            ref={collaboratorsButtonRef}
          >
            <Users size={14} />
            Colaboradores
            {!!members?.length && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
                {members.length}
              </span>
            )}
          </GlassButton>
          {doneCount > 0 && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              loading={archiveMutation.isPending}
              disabled={!isEditor}
            >
              <Archive size={14} />
              Archive ({doneCount})
            </GlassButton>
          )}
          <GlassButton onClick={handleCreateTask} disabled={!isEditor}>
            <Plus size={16} />
            New Task
          </GlassButton>
        </div>
      </div>

      {/* Board */}
      {(showInvitePanel || showCollaboratorsPanel) && (
        <div className="mb-6" ref={panelRef}>
          <CollaboratorsPanel
            boardId={profile?.active_board_id || null}
            canManage={!!isOwner}
            mode={showInvitePanel ? "invite" : "manage"}
          />
        </div>
      )}
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
                onMoveTask={(taskId, direction) =>
                  handleMoveTaskByArrow(taskId, direction, column.id)
                }
                columnIndex={index}
                totalColumns={COLUMNS.length}
              />
            </motion.div>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
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
