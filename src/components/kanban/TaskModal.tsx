"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Save, Calendar, Tag, Clock } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "@/hooks/useTasks";
import { useCategoriesQuery } from "@/hooks/useCategories";
import { useUser } from "@/lib/auth/hooks";
import type { Task, TaskStatus } from "@/types/supabase";

interface TaskModalProps {
  task: Task | null;
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
  const { user } = useUser();
  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();
  const { data: categories } = useCategoriesQuery();

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

  const isEditing = !!task;

  async function handleSave() {
    if (!user || !title.trim()) return;

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
        },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(
        {
          ...taskData,
          user_id: user.id,
        },
        { onSuccess: onClose }
      );
    }
  }

  async function handleDelete() {
    if (!user || !task) return;
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
              {isEditing ? "Editar Tarea" : "Nueva Tarea"}
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
                Título
              </label>
              <input
                className="glass-input"
                placeholder="Título de la tarea..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">
                Descripción
              </label>
              <textarea
                className="glass-input resize-none"
                rows={3}
                placeholder="Describe la tarea..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Estado
                </label>
                <select
                  className="glass-input appearance-none"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
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
                  Prioridad
                </label>
                <select
                  className="glass-input appearance-none"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                >
                  <option value={0} style={{ background: "#1a1a2e" }}>
                    Baja
                  </option>
                  <option value={1} style={{ background: "#1a1a2e" }}>
                    Media
                  </option>
                  <option value={2} style={{ background: "#1a1a2e" }}>
                    Alta
                  </option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2">
                <Tag size={12} />
                Categoría
              </label>
              <select
                className="glass-input appearance-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="" style={{ background: "#1a1a2e", color: "white" }}>
                  Sin categoría
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
                Fecha Límite
              </label>
              <input
                type="datetime-local"
                className="glass-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Created at info (editing only) */}
            {isEditing && task && (
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <Clock size={12} className="text-white/25" />
                <span className="text-[11px] text-white/30">
                  Creada: {new Date(task.created_at).toLocaleString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                >
                  <Trash2 size={14} />
                  Eliminar
                </GlassButton>
              )}
            </div>
            <div className="flex gap-3">
              <GlassButton variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </GlassButton>
              <GlassButton
                size="sm"
                onClick={handleSave}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                <Save size={14} />
                {isEditing ? "Actualizar" : "Crear"}
              </GlassButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
