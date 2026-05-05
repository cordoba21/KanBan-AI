"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/kanban");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A]">
      <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#A78BFA] border-r-[#2DD4BF] animate-spin" />
    </div>
  );
}
