"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import StatsGrid from "@/components/dashboard/StatsGrid";
import TasksChart from "@/components/dashboard/TasksChart";
import StatusPieChart from "@/components/dashboard/StatusPieChart";
import DateRangeFilter, {
  getDateRange,
} from "@/components/dashboard/DateRangeFilter";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useCategoriesQuery } from "@/hooks/useCategories";
import GlassCard from "@/components/ui/GlassCard";
import { useUserBoardsQuery, useSwitchBoardMutation } from "@/hooks/useBoards";
import { useUser } from "@/lib/auth/hooks";

export default function DashboardClient() {
  const router = useRouter();
  const [rangePreset, setRangePreset] = useState("all");
  const dateRange = useMemo(() => getDateRange(rangePreset), [rangePreset]);
  const { profile, refreshProfile } = useUser();
  const { data: userBoards = [] } = useUserBoardsQuery();
  const switchBoard = useSwitchBoardMutation();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const activeBoardId = selectedBoardId || profile?.active_board_id || null;
  const { data, isLoading } = useDashboardMetrics(dateRange, activeBoardId);
  const { data: categories } = useCategoriesQuery(activeBoardId);

  const handleBoardChange = async (newBoardId: string) => {
    if (newBoardId && newBoardId !== profile?.active_board_id) {
      await switchBoard.mutateAsync({ boardId: newBoardId });
      await refreshProfile();
      window.location.reload();
    }
    setSelectedBoardId(null);
  };


  const categoryStats = useMemo(() => {
    if (!categories || !data?.tasks) return [];
    const counts = new Map<string, number>();
    data.tasks.forEach((task) => {
      if (task.category_id) {
        counts.set(task.category_id, (counts.get(task.category_id) || 0) + 1);
      }
    });
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || "#00D4FF",
      count: counts.get(cat.id) || 0,
    }));
  }, [categories, data?.tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          className="text-[#00FF41] font-mono text-lg animate-terminal-blink"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">
            Track your team&apos;s performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              className="glass-input appearance-none pr-8 text-sm"
              value={selectedBoardId || profile?.active_board_id || ""}
              onChange={(e) => handleBoardChange(e.target.value)}
              disabled={userBoards.length === 0}
            >
              {userBoards.length === 0 && (
                <option value="">No boards</option>
              )}
              {userBoards.map((board) => (
                <option
                  key={board.id}
                  value={board.id}
                  style={{ background: "#0A0A1A", color: "white" }}
                >
                  {board.name}
                </option>
              ))}
            </select>
          </div>
          <DateRangeFilter value={rangePreset} onChange={setRangePreset} />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsGrid
          totalTasks={data?.totalTasks || 0}
          completedTasks={data?.completedTasks || 0}
          inProgressTasks={data?.inProgressTasks || 0}
          completionRate={data?.completionRate || 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TasksChart data={data?.timeSeriesData || []} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatusPieChart data={data?.statusDistribution || []} />
        </motion.div>
      </div>

      {/* Categories */}
      <div className="mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard padding="md" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70">
                Task Categories
              </h3>
              <span className="text-[10px] text-white/30">
                {categoryStats.length} categories
              </span>
            </div>
            {categoryStats.length === 0 ? (
              <p className="text-xs text-white/40">
                No categories created yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryStats.map((cat, index) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-white/70">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-white/80">
                      {cat.count}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
