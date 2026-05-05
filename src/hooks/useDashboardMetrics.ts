"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus } from "@/types/supabase";

interface DateRange {
  from: Date;
  to: Date;
}

interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
  statusDistribution: { name: string; value: number; color: string }[];
  timeSeriesData: { date: string; created: number; completed: number }[];
  tasks: Task[];
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: "rgba(200,200,200,0.3)",
  TODO: "#00D4FF",
  IN_PROGRESS: "#FFB800",
  REVIEW: "#FF8C00",
  DONE: "#00FF41",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

export function useDashboardMetrics(dateRange?: DateRange, boardId?: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: [
      "dashboard-metrics",
      dateRange?.from?.toISOString(),
      dateRange?.to?.toISOString(),
      boardId || "active",
    ],
    queryFn: async (): Promise<DashboardMetrics> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          completionRate: 0,
          statusDistribution: [],
          timeSeriesData: [],
          tasks: [],
        };
      }

      let resolvedBoardId = boardId || null;
      if (!resolvedBoardId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("active_board_id")
          .eq("id", user.id)
          .single();
        resolvedBoardId = profile?.active_board_id || null;
      }

      if (!resolvedBoardId) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          completionRate: 0,
          statusDistribution: [],
          timeSeriesData: [],
          tasks: [],
        };
      }

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("board_id", resolvedBoardId)
        .order("created_at", { ascending: true });

      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      const allTasks = tasks as Task[];
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((t) => t.status === "DONE").length;
      const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Status distribution
      const statusCounts: Record<string, number> = {};
      allTasks.forEach((t) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: STATUS_LABELS[status as TaskStatus] || status,
        value: count,
        color: STATUS_COLORS[status as TaskStatus] || "#ffffff",
      }));

      // Time series — group by day
      const dayMap: Record<string, { created: number; completed: number }> = {};

      allTasks.forEach((t) => {
        const day = new Date(t.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!dayMap[day]) dayMap[day] = { created: 0, completed: 0 };
        dayMap[day].created++;
        if (t.status === "DONE") dayMap[day].completed++;
      });

      const timeSeriesData = Object.entries(dayMap)
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        completionRate,
        statusDistribution,
        timeSeriesData,
        tasks: allTasks,
      };
    },
  });
}
