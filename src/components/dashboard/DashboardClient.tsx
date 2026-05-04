"use client";

import { useMemo, useState } from "react";
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

export default function DashboardClient() {
  const [rangePreset, setRangePreset] = useState("all");
  const dateRange = useMemo(() => getDateRange(rangePreset), [rangePreset]);
  const { data, isLoading } = useDashboardMetrics(dateRange);
  const { data: categories } = useCategoriesQuery();

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
      color: cat.color || "#7dd3fc",
      count: counts.get(cat.id) || 0,
    }));
  }, [categories, data?.tasks]);

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
        <DateRangeFilter value={rangePreset} onChange={setRangePreset} />
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
