"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, Archive, UserPlus, Users } from "lucide-react";
import Column from "./Column";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import CategoryManager from "./CategoryManager";
import CollaboratorsPanel from "./CollaboratorsPanel";
import GlassButton from "@/components/ui/GlassButton";
import { useGroupedTasks, useMoveTask } from "@/hooks/useTasks";
import { useArchiveTasksMutation } from "@/hooks/useArchives";
import { useBoardMembersQuery, useUserBoardsQuery } from "@/hooks/useBoards";
import { useUser } from "@/lib/auth/hooks";
import { useBoardRole } from "@/lib/boards/access";
import type { TaskStatus, TaskWithPeople } from "@/types/supabase";

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "BACKLOG", title: "Backlog", color: "rgba(200,200,200,0.4)" },
  { id: "TODO", title: "To Do", color: "#00D4FF" },
  { id: "IN_PROGRESS", title: "In Progress", color: "#FFB800" },
  { id: "REVIEW", title: "Review", color: "#FF8C00" },
  { id: "DONE", title: "Done", color: "#00FF41" },
];

export default function Board() {
  const { user, profile } = useUser();
  const { grouped, isLoading } = useGroupedTasks(profile?.active_board_id || null);
  const { moveTask } = useMoveTask();
  const archiveMutation = useArchiveTasksMutation();
  const { isEditor, isOwner } = useBoardRole();
  const { data: members } = useBoardMembersQuery(profile?.active_board_id || null);
  const { data: userBoards } = useUserBoardsQuery();
  const activeBoardName = userBoards?.find((b) => b.id === profile?.active_board_id)?.name;

  const [activeTask, setActiveTask] = useState<TaskWithPeople | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithPeople | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [showCollaboratorsPanel, setShowCollaboratorsPanel] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const prevBoardId = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inviteButtonRef = useRef<HTMLButtonElement | null>(null);
  const collaboratorsButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (profile?.active_board_id && profile.active_board_id !== prevBoardId.current) {
      prevBoardId.current = profile.active_board_id;
      setShowInvitePanel(false);
      setShowCollaboratorsPanel(false);
    }
  }, [profile?.active_board_id]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const dropAnimation: DropAnimation = {
    duration: 260,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

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
    setShowArchiveConfirm(true);
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showInvitePanel, showCollaboratorsPanel]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          className="w-12 h-12 rounded border border-[#00FF41]/20 flex items-center justify-center"
          style={{ color: '#00FF41' }}
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
          {activeBoardName && (
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded bg-[#00FF41]/10 border border-[#00FF41]/20">
              <span className="text-xs font-semibold text-[#00FF41] font-mono">{activeBoardName}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
          <p className="text-white/40 text-sm mt-1">
            Manage your tasks in workflow stages
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GlassButton variant="ghost" size="sm" onClick={() => setShowCategoryManager(true)} disabled={!isEditor}>
            <Tag size={14} />
            <span className="hidden sm:inline">Categories</span>
          </GlassButton>
          <span ref={inviteButtonRef}>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowInvitePanel((prev) => !prev);
                setShowCollaboratorsPanel(false);
              }}
              disabled={!isOwner}
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline">Invite</span>
            </GlassButton>
          </span>
          <span ref={collaboratorsButtonRef}>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCollaboratorsPanel((prev) => !prev);
                setShowInvitePanel(false);
              }}
            >
              <Users size={14} />
              <span className="hidden sm:inline">Collaborators</span>
              {!!members?.length && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
                  {members.length}
                </span>
              )}
            </GlassButton>
          </span>
          {doneCount > 0 && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              loading={archiveMutation.isPending}
              disabled={!isEditor}
            >
              <Archive size={14} />
              <span className="hidden sm:inline">Archive</span>
              <span className="sm:hidden">({doneCount})</span>
              <span className="hidden sm:inline"> ({doneCount})</span>
            </GlassButton>
          )}
          <GlassButton onClick={handleCreateTask} disabled={!isEditor}>
            <Plus size={16} />
            <span className="hidden sm:inline">New Task</span>
          </GlassButton>
        </div>
      </div>

      {/* Board */}
      {(showInvitePanel || showCollaboratorsPanel) && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowInvitePanel(false);
              setShowCollaboratorsPanel(false);
            }}
          />
          <div className="relative w-full max-w-lg" ref={panelRef}>
            <CollaboratorsPanel
              boardId={profile?.active_board_id || null}
              canManage={!!isOwner}
              mode={showInvitePanel ? "invite" : "manage"}
              onClose={() => {
                setShowInvitePanel(false);
                setShowCollaboratorsPanel(false);
              }}
            />
          </div>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {COLUMNS.map((column, index) => (
            <motion.div
              key={column.id}
              className="kanban-column"
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

        <DragOverlay dropAnimation={dropAnimation}>
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

      {/* Archive Confirmation */}
      <AnimatePresence>
        {showArchiveConfirm && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowArchiveConfirm(false)}
            />
            <motion.div
              className="glass-strong relative w-full max-w-md z-10 p-6"
              style={{ borderRadius: "var(--radius-organic-lg)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Archive size={18} className="text-white/70" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Archive completed</h3>
                  <p className="text-xs text-white/40">They will be moved to the monthly archive</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                <p className="text-xs text-white/60 leading-relaxed">
                  All Done tasks in the current board will be archived.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!user) return;
                    setShowArchiveConfirm(false);
                    archiveMutation.mutate({ userId: user.id });
                  }}
                  disabled={archiveMutation.isPending}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-[#00FF41] bg-[#00FF41]/10 hover:bg-[#00FF41]/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-[var(--radius-organic-sm)] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider border border-[#00FF41]/20 hover:border-[#00FF41]/40"
                >
                  {archiveMutation.isPending ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Archive size={14} />
                  )}
                  Archive
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
