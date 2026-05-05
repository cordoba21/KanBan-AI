"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import { useTheme } from "@/lib/theme/ThemeContext";

interface TasksChartProps {
  data: { date: string; created: number; completed: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <div
      className="glass-strong p-3"
      style={{ borderRadius: "var(--radius-organic-sm)" }}
    >
      <p className="text-xs font-medium text-white/60 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/50">{entry.name}:</span>
          <span className="text-white font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TasksChart({ data }: TasksChartProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const axisColor = isLight ? "rgba(0, 0, 0, 0.4)" : "rgba(255,255,255,0.2)";
  const gridColor = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255,255,255,0.05)";
  const legendColor = isLight ? "rgba(0, 0, 0, 0.55)" : "rgba(255,255,255,0.5)";
  const tickColor = isLight ? "#1a1a2e" : "rgba(255,255,255,0.5)";

  return (
    <GlassCard padding="md" hover={false}>
      <h3 className="text-sm font-semibold text-white/70 mb-4">
        Tasks Over Time
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradientCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FF41" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00FF41" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
            />
            <XAxis
              dataKey="date"
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              tick={{ fill: tickColor }}
            />
            <YAxis
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: tickColor }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: legendColor }}
            />
            <Area
              type="monotone"
              dataKey="created"
              name="Created"
              stroke="#00D4FF"
              strokeWidth={2}
              fill="url(#gradientCreated)"
            />
            <Area
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#00FF41"
              strokeWidth={2}
              fill="url(#gradientCompleted)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
