"use client";

import { useMemo } from "react";
import { useUser } from "@/lib/auth/hooks";
import { useBoardMembership } from "@/hooks/useBoards";

export function useBoardRole() {
  const { profile } = useUser();
  const { data: membership, isLoading } = useBoardMembership(profile?.active_board_id || null);

  return useMemo(() => {
    return {
      role: membership?.role || null,
      isOwner: membership?.role === "OWNER",
      isEditor: membership?.role === "EDITOR" || membership?.role === "OWNER",
      isViewer: membership?.role === "VIEWER",
      isLoading,
    };
  }, [membership?.role, isLoading]);
}
