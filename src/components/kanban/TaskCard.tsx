"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, AlertCircle, Clock, CheckCircle2, Tag, Calendar, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useCategoriesQuery } from "@/hooks/useCategories";
import type { TaskWithPeople } from "@/types/supabase";

interface TaskCardProps {
  task: TaskWithPeople;
  isDragOverlay?: boolean;
  onClick?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
}

const priorityConfig = [
  { label: "Low", color: "#4ade80", icon: CheckCircle2 },
  { label: "Medium", color: "#fbbf24", icon: Clock },
  { label: "High", color: "#f87171", icon: AlertCircle },
];

function CategoryBadge({ categoryId, boardId }: { categoryId: string | null; boardId: string }) {
  const { data: categories } = useCategoriesQuery(boardId);
  if (!categoryId || !categories) return null;

  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: `${cat.color}20`,
        color: cat.color,
        border: `1px solid ${cat.color}30`,
      }}
    >
      <Tag size={8} />
      {cat.name}
    </span>
  );
}

function DueDateBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const isOverdue = due < now;
  const isToday = due.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = due.toDateString() === tomorrow.toDateString();

  let color = "#7dd3fc";
  let label = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (isOverdue) {
    color = "#f87171";
    label = "Overdue";
  } else if (isToday) {
    color = "#fbbf24";
    label = "Today";
  } else if (isTomorrow) {
    color = "#fb923c";
    label = "Tomorrow";
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-medium"
      style={{ color }}
    >
      <Calendar size={9} />
      {label}
    </span>
  );
}

export default function TaskCard({ task, isDragOverlay, onClick, onMoveLeft, onMoveRight, canMoveLeft, canMoveRight }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    opacity: isDragging ? 0.3 : 1,
    scale: isDragging ? 0.95 : 1,
  };

  const priority = priorityConfig[Math.min(task.priority, 2)] || priorityConfig[0];
  const PriorityIcon = priority.icon;

  const createdFormatted = new Date(task.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const creatorName = task.creator?.full_name || task.creator?.email || "Unknown";
  const assignees = task.task_assignees || [];

  // Drag overlay — the card that follows the cursor
  if (isDragOverlay) {
    return (
      <motion.div
        className="glass-strong cursor-grabbing"
        style={{
          borderRadius: "var(--radius-organic-sm)",
          boxShadow: `
            0 25px 60px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(125, 211, 252, 0.15),
            0 0 80px rgba(192, 132, 252, 0.08)
          `,
          border: "1px solid rgba(255,255,255,0.2)",
        }}
        initial={{ scale: 1, rotate: 0 }}
        animate={{
          scale: 1.05,
          rotate: 1.5,
          transition: { type: "spring", stiffness: 300, damping: 20 },
        }}
      >
        <div className="p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white/40">
              <GripVertical size={14} />
            </div>
            <div className="flex items-center gap-1.5">
              <PriorityIcon size={12} style={{ color: priority.color }} />
              <span className="text-[10px] font-medium" style={{ color: priority.color }}>
                {priority.label}
              </span>
            </div>
          </div>
          {task.category_id && (
            <div className="mb-2">
              <CategoryBadge categoryId={task.category_id} boardId={task.board_id} />
            </div>
          )}
          <h4 className="text-sm font-medium text-white/90 mb-1 line-clamp-2">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-white/35 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/25">{createdFormatted}</span>
            <DueDateBadge dueDate={task.due_date} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-white/35">
            <span className="truncate">Created by {creatorName}</span>
            <div className="flex items-center gap-1">
              {assignees.length > 0 ? (
                assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.user_id}
                    className="w-4 h-4 rounded-full bg-gradient-to-br from-sky-300/20 to-purple-400/20 border border-white/10 flex items-center justify-center"
                    title={assignee.profiles?.full_name || assignee.profiles?.email || "User"}
                  >
                    <span className="text-[8px] text-white/70">
                      {(assignee.profiles?.full_name || assignee.profiles?.email || "?").slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1 text-white/25">
                  <User size={10} />
                  Unassigned
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        borderRadius: "var(--radius-organic-sm)",
        border: isDragging ? "1px dashed rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.08)",
        background: isDragging
          ? "rgba(255,255,255,0.02)"
          : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: isDragging
          ? "none"
          : "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      className={`
        cursor-pointer group relative transition-colors duration-200
        hover:bg-white/[0.07] hover:border-white/12
        ${isDragging ? "z-50" : ""}
      `}
      whileHover={{
        scale: 1.015,
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      layout
      layoutId={task.id}
      onClick={onClick}
    >
      <div className="p-3.5">
        {/* Drag handle + Priority */}
        <div className="flex items-center justify-between mb-2">
          <div
            className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </div>
          <div className="flex items-center gap-1.5">
            <PriorityIcon size={12} style={{ color: priority.color }} />
            <span
              className="text-[10px] font-medium"
              style={{ color: priority.color }}
            >
              {priority.label}
            </span>
          </div>
        </div>

        {/* Category Badge */}
        {task.category_id && (
          <div className="mb-2">
            <CategoryBadge categoryId={task.category_id} boardId={task.board_id} />
          </div>
        )}

        {/* Title */}
        <h4 className="text-sm font-medium text-white/90 mb-1 line-clamp-2">
          {task.title}
        </h4>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-white/35 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/25">
            {createdFormatted}
          </span>
          <div className="flex items-center gap-2">
            <DueDateBadge dueDate={task.due_date} />
            <div className="flex items-center gap-1">
              {assignees.length > 0 ? (
                assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.user_id}
                    className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-300/20 to-purple-400/20 border border-white/10 flex items-center justify-center"
                    title={assignee.profiles?.full_name || assignee.profiles?.email || "User"}
                  >
                    <span className="text-[9px] text-white/70">
                      {(assignee.profiles?.full_name || assignee.profiles?.email || "?").slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1 text-white/25">
                  <User size={12} />
                  <span className="text-[9px]">Unassigned</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-white/35 truncate">
          Created by {creatorName}
        </div>

        {/* Move arrows — visible on hover */}
        {(canMoveLeft || canMoveRight) && (
          <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveLeft?.();
              }}
              disabled={!canMoveLeft}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-white/30 hover:text-sky-300 hover:bg-sky-300/10 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              title="Move to previous stage"
            >
              <ChevronLeft size={12} />
              <span className="text-[9px] font-medium">Prev</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveRight?.();
              }}
              disabled={!canMoveRight}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-white/30 hover:text-purple-300 hover:bg-purple-300/10 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
              title="Move to next stage"
            >
              <span className="text-[9px] font-medium">Next</span>
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
