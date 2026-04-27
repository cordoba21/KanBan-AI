"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Tag, Palette, Pencil, Check } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/hooks/useCategories";
import { useUser } from "@/lib/auth/hooks";

const PRESET_COLORS = [
  "#7dd3fc", "#c084fc", "#4ade80", "#fbbf24", "#f87171",
  "#fb923c", "#34d399", "#a78bfa", "#f472b6", "#38bdf8",
  "#818cf8", "#2dd4bf",
];

interface CategoryManagerProps {
  onClose: () => void;
}

export default function CategoryManager({ onClose }: CategoryManagerProps) {
  const { user } = useUser();
  const { data: categories, isLoading } = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleCreate() {
    if (!user || !newName.trim()) return;
    createMutation.mutate(
      { name: newName.trim(), color: newColor, user_id: user.id },
      { onSuccess: () => { setNewName(""); setNewColor(PRESET_COLORS[0]); } }
    );
  }

  function startEditing(cat: { id: string; name: string; color: string }) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setConfirmDeleteId(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    updateMutation.mutate(
      { id: editingId, updates: { name: editName.trim(), color: editColor } },
      { onSuccess: cancelEditing }
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => setConfirmDeleteId(null),
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        <motion.div
          className="glass-strong relative w-full max-w-md z-10"
          style={{ borderRadius: "var(--radius-organic-lg)" }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400/20 to-sky-300/20 flex items-center justify-center border border-white/10">
                <Tag size={16} className="text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Categories</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Create new */}
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3 mb-3">
              <input
                className="glass-input flex-1"
                placeholder="Category name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <GlassButton
                size="sm"
                onClick={handleCreate}
                loading={createMutation.isPending}
                disabled={!newName.trim()}
              >
                <Plus size={14} />
              </GlassButton>
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-2">
              <Palette size={14} className="text-white/30 flex-shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-full transition-all duration-200 border-2"
                    style={{
                      backgroundColor: color,
                      borderColor: newColor === color ? "white" : "transparent",
                      transform: newColor === color ? "scale(1.2)" : "scale(1)",
                    }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Category list */}
          <div className="p-6 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-sky-300 border-r-purple-400 animate-spin" />
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    className="rounded-[var(--radius-organic-sm)] glass-hover group"
                    layout
                  >
                    {editingId === cat.id ? (
                      /* ── Edit Mode ─────────────────────── */
                      <div className="p-3 space-y-3">
                        <div className="flex gap-2">
                          <input
                            className="glass-input flex-1 text-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") cancelEditing();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            disabled={!editName.trim() || updateMutation.isPending}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-30 transition-all cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10 transition-all cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {/* Edit color picker */}
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              className="w-5 h-5 rounded-full transition-all duration-200 border-2"
                              style={{
                                backgroundColor: color,
                                borderColor: editColor === color ? "white" : "transparent",
                                transform: editColor === color ? "scale(1.2)" : "scale(1)",
                              }}
                              onClick={() => setEditColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : confirmDeleteId === cat.id ? (
                      /* ── Delete Confirmation ───────────── */
                      <div className="p-3">
                        <p className="text-xs text-red-300/80 mb-3">
                          Delete <span className="font-semibold text-white/80">{cat.name}</span>? Tasks with this category will be uncategorized.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white/50 bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            disabled={deleteMutation.isPending}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500/70 hover:bg-red-500 disabled:opacity-50 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Trash2 size={11} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Display Mode ──────────────────── */
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm text-white/80 font-medium">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(cat)}
                            className="p-1.5 text-white/20 hover:text-sky-300 transition-colors rounded-md hover:bg-sky-300/10 cursor-pointer"
                            title="Edit category"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(cat.id)}
                            className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10 cursor-pointer"
                            title="Delete category"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag size={24} className="mx-auto text-white/15 mb-2" />
                <p className="text-xs text-white/30">
                  No categories yet. Create one above.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
