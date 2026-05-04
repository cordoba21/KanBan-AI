"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      role,
      boardId,
    }: {
      email: string;
      role?: "OWNER" | "EDITOR" | "VIEWER";
      boardId?: string | null;
    }) => {
      const res = await fetch("/api/boards/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, boardId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite");
      return data as { token: string; inviteUrl: string; email: string; expiresAt: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-invitations"] });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch("/api/boards/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept invitation");
      return data as { status: string; boardId?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members"] });
      queryClient.invalidateQueries({ queryKey: ["board-membership"] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await fetch("/api/boards/invitations/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke invitation");
      return data as { status: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-invitations"] });
    },
  });
}
