"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ArchivedTask, ArchivedReport } from "@/types/supabase";

/* ─── Fetch archived tasks ────────────────────────────────── */
export function useArchivedTasksQuery(month?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["archived-tasks", month, "active"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as ArchivedTask[];

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", user.id)
        .single();

      if (!profile?.active_board_id) return [] as ArchivedTask[];

      let query = supabase
        .from("archived_tasks")
        .select("*")
        .eq("board_id", profile.active_board_id)
        .order("archived_at", { ascending: false });

      if (month) {
        query = query.eq("archive_month", month);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ArchivedTask[];
    },
  });
}

/* ─── Get unique archive months ──────────────────────────── */
export function useArchiveMonthsQuery() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["archive-months", "active"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as string[];

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", user.id)
        .single();

      if (!profile?.active_board_id) return [] as string[];

      const { data, error } = await supabase
        .from("archived_tasks")
        .select("archive_month")
        .eq("board_id", profile.active_board_id)
        .order("archive_month", { ascending: false });

      if (error) throw error;
      const unique = [...new Set(data?.map((d) => d.archive_month))];
      return unique;
    },
  });
}

/* ─── Archive completed tasks for a month ────────────────── */
export function useArchiveTasksMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", userId)
        .single();

      if (!profile?.active_board_id) throw new Error("No active board");

      const now = new Date();
      const archiveMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Fetch completed tasks with category info
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*, categories(name, color)")
        .eq("status", "DONE")
        .eq("board_id", profile.active_board_id);

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) {
        throw new Error("No completed tasks to archive");
      }

      // Insert into archived_tasks
      const archivedTasks = tasks.map((task: any) => ({
        original_task_id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category_name: task.categories?.name || null,
        category_color: task.categories?.color || null,
        user_id: userId,
        assigned_to: task.assigned_to,
        due_date: task.due_date,
        task_created_at: task.created_at,
        task_completed_at: task.updated_at,
        board_id: profile.active_board_id,
        archive_month: archiveMonth,
      }));

      const { error: insertError } = await supabase
        .from("archived_tasks")
        .insert(archivedTasks);

      if (insertError) throw insertError;

      // Delete archived tasks from active table
      const taskIds = tasks.map((t: any) => t.id);
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .in("id", taskIds);

      if (deleteError) throw deleteError;

      return { archivedCount: tasks.length, month: archiveMonth };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "active"] });
      queryClient.invalidateQueries({ queryKey: ["archived-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["archived-tasks", "active"] });
      queryClient.invalidateQueries({ queryKey: ["archive-months"] });
      queryClient.invalidateQueries({ queryKey: ["archive-months", "active"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

/* ─── Fetch archived reports ──────────────────────────────── */
export function useArchivedReportsQuery() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["archived-reports", "active"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as ArchivedReport[];

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", user.id)
        .single();

      if (!profile?.active_board_id) return [] as ArchivedReport[];

      const { data, error } = await supabase
        .from("archived_reports")
        .select("*")
        .eq("board_id", profile.active_board_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ArchivedReport[];
    },
  });
}

/* ─── Save report to archive ─────────────────────────────── */
export function useArchiveReportMutation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      userId,
      taskCount,
      completedCount,
      completionRate,
      metadata,
    }: {
      title: string;
      content: string;
      userId: string;
      taskCount: number;
      completedCount: number;
      completionRate: number;
      metadata?: Record<string, unknown>;
    }) => {
      const now = new Date();
      const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", userId)
        .single();

      if (!profile?.active_board_id) throw new Error("No active board");

      const { data, error } = await supabase
        .from("archived_reports")
        .insert({
          title,
          content,
          report_month: reportMonth,
          user_id: userId,
          board_id: profile.active_board_id,
          task_count: taskCount,
          completed_count: completedCount,
          completion_rate: completionRate,
          metadata: metadata as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ArchivedReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-reports"] });
      queryClient.invalidateQueries({ queryKey: ["archived-reports", "active"] });
    },
  });
}
