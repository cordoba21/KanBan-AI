"use client";

import dynamic from "next/dynamic";

const DashboardClient = dynamic(
  () => import("@/components/dashboard/DashboardClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-[#00FF41] font-mono text-lg animate-terminal-blink">█</div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  return <DashboardClient />;
}
