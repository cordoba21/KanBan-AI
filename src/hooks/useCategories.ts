"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryInsert } from "@/types/supabase";

/* ─── Fetch all categories for current user ──────────────── */
export function useCategoriesQuery() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as Category[];

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", user.id)
        .single();

      if (!profile?.active_board_id) return [] as Category[];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("board_id", profile.active_board_id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
  });
}

/* ─── Create category ────────────────────────────────────── */
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (category: CategoryInsert) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", user.id)
        .single();

      if (!profile?.active_board_id) throw new Error("No active board");

      const { data, error } = await supabase
        .from("categories")
        .insert({ ...category, board_id: profile.active_board_id! })
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

/* ─── Update category ────────────────────────────────────── */
export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; color?: string };
    }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

/* ─── Delete category ────────────────────────────────────── */
export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
