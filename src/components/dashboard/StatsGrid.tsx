"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface StatsGridProps {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
}

const stats = [
  {
    key: "total",
    label: "Total Tasks",
    icon: ListTodo,
    color: "#00D4FF",
    getValue: (p: StatsGridProps) => p.totalTasks,
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "#00FF41",
    getValue: (p: StatsGridProps) => p.completedTasks,
  },
  {
    key: "progress",
    label: "In Progress",
    icon: Clock,
    color: "#FFB800",
    getValue: (p: StatsGridProps) => p.inProgressTasks,
  },
  {
    key: "rate",
    label: "Completion Rate",
    icon: TrendingUp,
    color: "#fbbf24",
    getValue: (p: StatsGridProps) => `${p.completionRate}%`,
  },
];

export default function StatsGrid(props: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <GlassCard padding="md" hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-white/40 mb-1">
                  {stat.label}
                </p>
                <motion.p
                  className="text-3xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {stat.getValue(props)}
                </motion.p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${stat.color}15`,
                  border: `1px solid ${stat.color}25`,
                }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
