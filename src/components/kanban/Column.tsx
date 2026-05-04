"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";
import type { TaskStatus, TaskWithPeople } from "@/types/supabase";

interface ColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: TaskWithPeople[];
  onTaskClick: (task: TaskWithPeople) => void;
  onMoveTask?: (taskId: string, direction: "left" | "right") => void;
  columnIndex: number;
  totalColumns: number;
}

export default function Column({ id, title, color, tasks, onTaskClick, onMoveTask, columnIndex, totalColumns }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      className="glass flex flex-col h-full min-h-[400px]"
      style={{
        borderRadius: "var(--radius-organic)",
        borderTop: `2px solid ${color}`,
      }}
      animate={{
        borderColor: isOver ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
        backgroundColor: isOver ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)",
        scale: isOver ? 1.01 : 1,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={isOver ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, repeat: isOver ? Infinity : 0 }}
          />
          <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        </div>
        <motion.span
          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
          animate={{ scale: isOver ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {tasks.length}
        </motion.span>
      </div>

      {/* Tasks */}
      <div className="flex-1 px-3 pb-3 space-y-2 overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                canMoveLeft={columnIndex > 0}
                canMoveRight={columnIndex < totalColumns - 1}
                onMoveLeft={() => onMoveTask?.(task.id, "left")}
                onMoveRight={() => onMoveTask?.(task.id, "right")}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && (
          <motion.div
            className="flex items-center justify-center h-20 border border-dashed rounded-[var(--radius-organic-sm)] text-white/20 text-xs"
            animate={{
              borderColor: isOver ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
              backgroundColor: isOver ? "rgba(255,255,255,0.03)" : "transparent",
            }}
            transition={{ duration: 0.2 }}
          >
            {isOver ? "Drop here ✨" : "Drop tasks here"}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
