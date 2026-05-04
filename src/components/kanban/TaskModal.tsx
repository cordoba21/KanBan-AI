"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Save, Calendar, Tag, Clock, Users } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "@/hooks/useTasks";
import { useCategoriesQuery } from "@/hooks/useCategories";
import { useUser } from "@/lib/auth/hooks";
import { useBoardMembersQuery } from "@/hooks/useBoards";
import { useBoardRole } from "@/lib/boards/access";
import type { TaskStatus, TaskWithPeople } from "@/types/supabase";

interface TaskModalProps {
  task: TaskWithPeople | null;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
];

export default function TaskModal({ task, onClose }: TaskModalProps) {
  const { user, profile } = useUser();
  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();
  const { data: categories } = useCategoriesQuery(profile?.active_board_id || null);
  const { isEditor } = useBoardRole();
  const { data: members } = useBoardMembersQuery(profile?.active_board_id || null);

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "BACKLOG");
  const [priority, setPriority] = useState(task?.priority || 0);
  const [categoryId, setCategoryId] = useState(task?.category_id || "");
  const [dueDate, setDueDate] = useState(
    task?.due_date
      ? new Date(task.due_date).toISOString().slice(0, 16)
      : ""
  );
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task?.task_assignees?.map((assignee) => assignee.user_id) || []
  );

  useEffect(() => {
    setAssigneeIds(task?.task_assignees?.map((assignee) => assignee.user_id) || []);
  }, [task]);

  const isEditing = !!task;

  async function handleSave() {
    if (!user || !title.trim() || !isEditor) return;

    const taskData = {
      title,
      description,
      status,
      priority,
      category_id: categoryId || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    };

    if (isEditing) {
      updateMutation.mutate(
        {
          id: task.id,
          updates: taskData,
          userId: user.id,
          assigneeIds,
        },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(
        {
          ...taskData,
          user_id: user.id,
          assigneeIds,
        },
        { onSuccess: onClose }
      );
    }
  }

  async function handleDelete() {
    if (!user || !task || !isEditor) return;
    deleteMutation.mutate({ id: task.id, userId: user.id }, { onSuccess: onClose });
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="glass-strong relative w-full max-w-lg z-10"
          style={{ borderRadius: "var(--radius-organic-lg)" }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">
              {isEditing ? "Edit Task" : "New Task"}
            </h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5 max-h-[calc(100vh-260px)] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">
                Title
              </label>
                <input
                  className="glass-input"
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  disabled={!isEditor}
                />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">
                Description
              </label>
                <textarea
                  className="glass-input resize-none"
                  rows={3}
                  placeholder="Describe the task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isEditor}
                />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Status
                </label>
                <select
                  className="glass-input appearance-none"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  disabled={!isEditor}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{ background: "#1a1a2e", color: "white" }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Priority
                </label>
                <select
                  className="glass-input appearance-none"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  disabled={!isEditor}
                >
                  <option value={0} style={{ background: "#1a1a2e" }}>
                    Low
                  </option>
                  <option value={1} style={{ background: "#1a1a2e" }}>
                    Medium
                  </option>
                  <option value={2} style={{ background: "#1a1a2e" }}>
                    High
                  </option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                <Tag size={12} />
                Category
              </label>
              <select
                className="glass-input appearance-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={!isEditor}
              >
                <option value="" style={{ background: "#1a1a2e", color: "white" }}>
                  No category
                </option>
                {categories?.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    style={{ background: "#1a1a2e", color: "white" }}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                <Calendar size={12} />
                Due Date
              </label>
              <input
                type="datetime-local"
                className="glass-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!isEditor}
              />
            </div>

            {/* Assignees */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                <Users size={12} />
                Assignees
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(members || []).map((member) => {
                  const label = member.profiles?.full_name || member.profiles?.email || "Unknown";
                  const isChecked = assigneeIds.includes(member.user_id);
                  return (
                    <label
                      key={member.user_id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-sky-500/10 border-sky-500/30 text-white"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-sky-400"
                        checked={isChecked}
                        onChange={(e) => {
                          if (!isEditor) return;
                          const next = e.target.checked
                            ? [...assigneeIds, member.user_id]
                            : assigneeIds.filter((id) => id !== member.user_id);
                          setAssigneeIds(next);
                        }}
                        disabled={!isEditor}
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  );
                })}
                {(members || []).length === 0 && (
                  <p className="text-xs text-white/30">No members available.</p>
                )}
              </div>
            </div>

            {/* Created at info (editing only) */}
            {isEditing && task && (
              <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-white/25" />
                  <span className="text-[11px] text-white/30">
                    Created: {new Date(task.created_at).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="text-[11px] text-white/30">
                  Created by {task.creator?.full_name || task.creator?.email || "Unknown"}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 pt-4 border-t border-white/5">
            <div>
              {isEditing && (
                <GlassButton
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={deleteMutation.isPending}
                  disabled={!isEditor}
                >
                  <Trash2 size={14} />
                  Delete
                </GlassButton>
              )}
            </div>
            <div className="flex gap-3">
              <GlassButton variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </GlassButton>
              <GlassButton
                size="sm"
                onClick={handleSave}
                loading={createMutation.isPending || updateMutation.isPending}
                disabled={!isEditor}
              >
                <Save size={14} />
                {isEditing ? "Update" : "Create"}
              </GlassButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
