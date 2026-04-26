"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Tag, Palette } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
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
  const deleteMutation = useDeleteCategoryMutation();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  async function handleCreate() {
    if (!user || !newName.trim()) return;
    createMutation.mutate(
      { name: newName.trim(), color: newColor, user_id: user.id },
      { onSuccess: () => { setNewName(""); setNewColor(PRESET_COLORS[0]); } }
    );
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
              <h2 className="text-lg font-semibold text-white">Categorías</h2>
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
                placeholder="Nombre de categoría..."
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
          <div className="p-6 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-sky-300 border-r-purple-400 animate-spin" />
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-organic-sm)] glass-hover group"
                    layout
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm text-white/80 font-medium">
                        {cat.name}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(cat.id)}
                      className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Tag size={24} className="mx-auto text-white/15 mb-2" />
                <p className="text-xs text-white/30">
                  No hay categorías. Crea una arriba.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
