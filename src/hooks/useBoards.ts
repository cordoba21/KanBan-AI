"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/auth/hooks";
import type { Board, BoardMember } from "@/types/supabase";

export function useActiveBoardQuery(boardId?: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["boards", boardId],
    queryFn: async () => {
      if (!boardId) return null;
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId)
        .single();
      if (error) throw error;
      return data as Board;
    },
  });
}

export function useBoardMembership(boardId?: string | null) {
  const supabase = createClient();
  const { user } = useUser();

  return useQuery({
    queryKey: ["board-membership", boardId, user?.id],
    queryFn: async () => {
      if (!boardId || !user?.id) return null;
      const { data, error } = await supabase
        .from("board_members")
        .select("*")
        .eq("board_id", boardId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      if (error) throw error;
      return data as BoardMember;
    },
  });
}

export type BoardMemberView = {
  id: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  status: string;
  user_id: string;
  invited_by: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string; avatar_url: string | null } | null;
};

export function useBoardMembersQuery(boardId?: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["board-members", boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const { data, error } = await supabase
        .from("board_members")
        .select("id, role, status, user_id, invited_by, created_at, profiles!board_members_user_id_fkey(full_name, email, avatar_url)")
        .eq("board_id", boardId)
        .eq("status", "active")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as BoardMemberView[];
    },
  });
}

export function useUpdateMemberRoleMutation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: "EDITOR" | "VIEWER" }) => {
      const { data, error } = await supabase
        .from("board_members")
        .update({ role })
        .eq("id", memberId)
        .select()
        .single();
      if (error) throw error;
      return data as BoardMember;
    },
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: ["board-members"] });
      queryClient.invalidateQueries({ queryKey: ["board-membership"] });
    },
  });
}

export function useRemoveMemberMutation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId }: { memberId: string }) => {
      const { error } = await supabase
        .from("board_members")
        .update({ status: "revoked" })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members"] });
      queryClient.invalidateQueries({ queryKey: ["board-membership"] });
    },
  });
}
