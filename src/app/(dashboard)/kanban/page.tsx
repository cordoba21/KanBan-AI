"use client";

import dynamic from "next/dynamic";

const Board = dynamic(() => import("@/components/kanban/Board"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[#A78BFA] border-r-[#2DD4BF] animate-spin" />
    </div>
  ),
});

export default function KanbanPage() {
  return <Board />;
}
