/* ──────────────────────────────────────────────────────────────
   Supabase Database Types — auto-generated style, hand-written
   for full type safety across the project.
   ────────────────────────────────────────────────────────────── */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "ADMIN" | "MANAGER" | "USER";
export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: number;
          position: number;
          user_id: string;
          assigned_to: string | null;
          category_id: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: number;
          position?: number;
          user_id: string;
          assigned_to?: string | null;
          category_id?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: number;
          position?: number;
          user_id?: string;
          assigned_to?: string | null;
          category_id?: string | null;
          due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey";
            columns: ["assigned_to"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          task_id: string | null;
          user_id: string | null;
          action: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          user_id?: string | null;
          action: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string | null;
          user_id?: string | null;
          action?: string;
          details?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      archived_tasks: {
        Row: {
          id: string;
          original_task_id: string | null;
          title: string;
          description: string | null;
          status: string;
          priority: number;
          category_name: string | null;
          category_color: string | null;
          user_id: string;
          assigned_to: string | null;
          due_date: string | null;
          task_created_at: string | null;
          task_completed_at: string | null;
          archived_at: string;
          archive_month: string;
        };
        Insert: {
          id?: string;
          original_task_id?: string | null;
          title: string;
          description?: string | null;
          status: string;
          priority?: number;
          category_name?: string | null;
          category_color?: string | null;
          user_id: string;
          assigned_to?: string | null;
          due_date?: string | null;
          task_created_at?: string | null;
          task_completed_at?: string | null;
          archived_at?: string;
          archive_month: string;
        };
        Update: {
          id?: string;
          original_task_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: number;
          category_name?: string | null;
          category_color?: string | null;
          user_id?: string;
          assigned_to?: string | null;
          due_date?: string | null;
          task_created_at?: string | null;
          task_completed_at?: string | null;
          archive_month?: string;
        };
        Relationships: [
          {
            foreignKeyName: "archived_tasks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      archived_reports: {
        Row: {
          id: string;
          title: string;
          content: string;
          report_month: string;
          user_id: string;
          task_count: number;
          completed_count: number;
          completion_rate: number;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          report_month: string;
          user_id: string;
          task_count?: number;
          completed_count?: number;
          completion_rate?: number;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          report_month?: string;
          user_id?: string;
          task_count?: number;
          completed_count?: number;
          completion_rate?: number;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "archived_reports_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      task_status: TaskStatus;
    };
  };
}

/* ── Convenience aliases ─────────────────────────────────────── */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
export type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

export type ArchivedTask = Database["public"]["Tables"]["archived_tasks"]["Row"];
export type ArchivedTaskInsert = Database["public"]["Tables"]["archived_tasks"]["Insert"];

export type ArchivedReport = Database["public"]["Tables"]["archived_reports"]["Row"];
export type ArchivedReportInsert = Database["public"]["Tables"]["archived_reports"]["Insert"];
