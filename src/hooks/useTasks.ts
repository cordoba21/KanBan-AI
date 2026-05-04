"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskInsert, TaskUpdate, TaskStatus } from "@/types/supabase";

/* ─── Fetch all tasks ─────────────────────────────────────── */
export function useTasksQuery() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["tasks", "active"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as Task[];

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", user.id)
        .single();

      if (!profile?.active_board_id) return [] as Task[];

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("board_id", profile.active_board_id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
  });
}

/* ─── Tasks grouped by status ─────────────────────────────── */
export function useGroupedTasks() {
  const { data: tasks, ...rest } = useTasksQuery();

  const grouped = useMemo(() => {
    const columns: Record<TaskStatus, Task[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
    };

    if (tasks) {
      tasks.forEach((task) => {
        columns[task.status].push(task);
      });
    }

    return columns;
  }, [tasks]);

  return { grouped, tasks, ...rest };
}

/* ─── Create task ─────────────────────────────────────────── */
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", task.user_id)
        .single();

      if (!profile?.active_board_id) throw new Error("No active board");

      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, board_id: profile.active_board_id! })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from("activity_logs").insert({
        task_id: data.id,
        user_id: task.user_id,
        action: "created",
        details: { title: task.title, status: task.status || "BACKLOG" },
      });

      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "active"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

/* ─── Update task ─────────────────────────────────────────── */
export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      userId,
    }: {
      id: string;
      updates: TaskUpdate;
      userId?: string;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Log status changes
      if (updates.status && userId) {
        await supabase.from("activity_logs").insert({
          task_id: id,
          user_id: userId,
          action: "moved",
          details: { new_status: updates.status },
        });
      }

      return data as Task;
    },
    // Optimistic update
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      queryClient.setQueryData<Task[]>(["tasks"], (old) =>
        old?.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ) ?? []
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "active"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

/* ─── Delete task ─────────────────────────────────────────── */
export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      // Log before delete
      await supabase.from("activity_logs").insert({
        task_id: id,
        user_id: userId,
        action: "deleted",
        details: {},
      });

      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "active"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

/* ─── Move task (drag & drop helper) ──────────────────────── */
export function useMoveTask() {
  const updateMutation = useUpdateTaskMutation();

  const moveTask = useCallback(
    (taskId: string, newStatus: TaskStatus, newPosition: number, userId: string) => {
      updateMutation.mutate({
        id: taskId,
        updates: { status: newStatus, position: newPosition },
        userId,
      });
    },
    [updateMutation]
  );

  return { moveTask, isPending: updateMutation.isPending };
}
