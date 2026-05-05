"use client";

import dynamic from "next/dynamic";

const ReportGenerator = dynamic(
  () => import("@/components/ai/ReportGenerator"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="text-[#00FF41] font-mono text-lg animate-terminal-blink">█</div>
      </div>
    ),
  }
);

export default function InsightsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Insights</h1>
        <p className="text-white/40 text-sm mt-1">
          AI-powered analysis of your project data
        </p>
      </div>

      <ReportGenerator />
    </div>
  );
}
