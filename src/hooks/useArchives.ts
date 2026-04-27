"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ArchivedTask, ArchivedReport } from "@/types/supabase";

/* ─── Fetch archived tasks ────────────────────────────────── */
export function useArchivedTasksQuery(month?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["archived-tasks", month],
    queryFn: async () => {
      let query = supabase
        .from("archived_tasks")
        .select("*")
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
    queryKey: ["archive-months"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("archived_tasks")
        .select("archive_month")
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
      const now = new Date();
      const archiveMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Fetch completed tasks with category info
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*, categories(name, color)")
        .eq("status", "DONE")
        .eq("user_id", userId);

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
      queryClient.invalidateQueries({ queryKey: ["archived-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["archive-months"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

/* ─── Fetch archived reports ──────────────────────────────── */
export function useArchivedReportsQuery() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["archived-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("archived_reports")
        .select("*")
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

      const { data, error } = await supabase
        .from("archived_reports")
        .insert({
          title,
          content,
          report_month: reportMonth,
          user_id: userId,
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
    },
  });
}
