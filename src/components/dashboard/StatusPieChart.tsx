"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";

interface StatusPieChartProps {
  data: { name: string; value: number; color: string }[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;

  const { name, value } = payload[0];
  return (
    <div
      className="glass-strong p-3"
      style={{ borderRadius: "var(--radius-organic-sm)" }}
    >
      <p className="text-xs text-white/60">{name}</p>
      <p className="text-sm font-bold text-white">{value} tasks</p>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {payload?.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-white/50">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatusPieChart({ data }: StatusPieChartProps) {
  return (
    <GlassCard padding="md" hover={false}>
      <h3 className="text-sm font-semibold text-white/70 mb-4">
        Status Distribution
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
