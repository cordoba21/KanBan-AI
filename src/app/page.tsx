"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/kanban");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510]">
      <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#7dd3fc] border-r-[#c084fc] animate-spin" />
    </div>
  );
}
