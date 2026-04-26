"use client";

import dynamic from "next/dynamic";

const Board = dynamic(() => import("@/components/kanban/Board"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[#7dd3fc] border-r-[#c084fc] animate-spin" />
    </div>
  ),
});

export default function KanbanPage() {
  return <Board />;
}
