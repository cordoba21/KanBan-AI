"use client";

import GlassButton from "@/components/ui/GlassButton";

interface DateRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const PRESETS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
];

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      {PRESETS.map((preset) => (
        <GlassButton
          key={preset.value}
          variant={value === preset.value ? "primary" : "ghost"}
          size="sm"
          onClick={() => onChange(preset.value)}
        >
          {preset.label}
        </GlassButton>
      ))}
    </div>
  );
}

export function getDateRange(preset: string): { from: Date; to: Date } | undefined {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case "7d":
      from.setDate(from.getDate() - 7);
      return { from, to };
    case "30d":
      from.setDate(from.getDate() - 30);
      return { from, to };
    case "90d":
      from.setDate(from.getDate() - 90);
      return { from, to };
    case "1y":
      from.setFullYear(from.getFullYear() - 1);
      return { from, to };
    default:
      return undefined;
  }
}
