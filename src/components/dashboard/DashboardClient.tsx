"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StatsGrid from "@/components/dashboard/StatsGrid";
import TasksChart from "@/components/dashboard/TasksChart";
import StatusPieChart from "@/components/dashboard/StatusPieChart";
import DateRangeFilter, {
  getDateRange,
} from "@/components/dashboard/DateRangeFilter";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

export default function DashboardClient() {
  const [rangePreset, setRangePreset] = useState("all");
  const dateRange = getDateRange(rangePreset);
  const { data, isLoading } = useDashboardMetrics(dateRange);

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
    </div>
  );
}
