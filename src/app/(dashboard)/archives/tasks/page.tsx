"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Calendar, Tag, AlertCircle, Clock,
  CheckCircle2, Filter, Archive, Search, Layers,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useAllArchivedTasksQuery, useAllArchiveMonthsQuery, useUserBoardsForFilterQuery } from "@/hooks/useArchives";

const priorityConfig = [
  { label: "Low", color: "#4ade80", icon: CheckCircle2 },
  { label: "Medium", color: "#fbbf24", icon: Clock },
  { label: "High", color: "#f87171", icon: AlertCircle },
];

export default function ArchivedTasksPage() {
  const [selectedBoard, setSelectedBoard] = useState<string | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: boards, isLoading: boardsLoading } = useUserBoardsForFilterQuery();
  const { data: months, isLoading: monthsLoading } = useAllArchiveMonthsQuery(selectedBoard);
  const { data: tasks, isLoading: tasksLoading } = useAllArchivedTasksQuery(selectedBoard, selectedMonth);

  const isLoading = boardsLoading || monthsLoading || tasksLoading;

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category_name?.toLowerCase().includes(query) ||
        task.status.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  function formatMonth(m: string) {
    const [year, month] = m.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Archive size={24} className="text-[#00FF41]" />
            Task Archive
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Completed tasks archived by month
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 pr-3 py-2 text-sm"
          />
        </div>

        {/* Board Filter */}
        {boards && boards.length > 0 && (
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-white/30" />
            <select
              value={selectedBoard || ""}
              onChange={(e) => setSelectedBoard(e.target.value || undefined)}
              className="glass-input py-2 text-sm min-w-[160px]"
            >
              <option value="">All Boards</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Month Filter */}
        {months && months.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-white/30" />
            <select
              value={selectedMonth || ""}
              onChange={(e) => setSelectedMonth(e.target.value || undefined)}
              className="glass-input py-2 text-sm min-w-[160px]"
            >
              <option value="">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-[40vh]">
          <motion.div
            className="text-[#00FF41] font-mono animate-terminal-blink"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Tasks Grid */}
      {!isLoading && filteredTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => {
              const priority = priorityConfig[Math.min(task.priority, 2)];
              const PriorityIcon = priority.icon;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <GlassCard padding="md" hover>
                    <div className="space-y-3">
                      {/* Priority + Category */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <PriorityIcon size={12} style={{ color: priority.color }} />
                          <span className="text-[10px] font-medium" style={{ color: priority.color }}>
                            {priority.label}
                          </span>
                        </div>
                        {task.category_name && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${task.category_color || "#00D4FF"}20`,
                              color: task.category_color || "#00D4FF",
                              border: `1px solid ${task.category_color || "#00D4FF"}30`,
                            }}
                          >
                            <Tag size={8} />
                            {task.category_name}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-medium text-white/90">
                        {task.title}
                      </h4>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-white/35 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex flex-col gap-0.5">
                          {task.task_created_at && (
                            <span className="text-[10px] text-white/25 flex items-center gap-1">
                              <Calendar size={9} />
                              Created: {new Date(task.task_created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          {task.task_completed_at && (
                            <span className="text-[10px] text-green-400/50 flex items-center gap-1">
                              <CheckCircle2 size={9} />
                              Completed: {new Date(task.task_completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                        <span className="badge badge-green" style={{ fontSize: "9px", padding: "1px 6px" }}>
                          {task.status}
                        </span>
                      </div>

                      {/* Board Name */}
                      {task.board_id && (
                        <div className="pt-2 border-t border-white/5">
                          <span className="text-[9px] text-white/30 flex items-center gap-1">
                            <Layers size={9} />
                            Board
                          </span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredTasks.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center h-[40vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <CheckSquare size={28} className="text-white/15" />
          </div>
          <p className="text-white/30 text-sm">
            {searchQuery || selectedBoard || selectedMonth ? "No matching tasks" : "No archived tasks"}
          </p>
          <p className="text-white/20 text-xs mt-1">
            {searchQuery || selectedBoard || selectedMonth ? "Try adjusting your filters" : "Completed tasks will be archived here"}
          </p>
        </motion.div>
      )}
    </div>
  );
}