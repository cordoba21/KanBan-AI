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
export type BoardRole = "OWNER" | "EDITOR" | "VIEWER";

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
          active_board_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          active_board_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          active_board_id?: string | null;
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
      boards: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "boards_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      board_members: {
        Row: {
          id: string;
          board_id: string;
          user_id: string;
          role: BoardRole;
          status: string;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id: string;
          role?: BoardRole;
          status?: string;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          user_id?: string;
          role?: BoardRole;
          status?: string;
          invited_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "boards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "board_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "board_members_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      board_invitations: {
        Row: {
          id: string;
          board_id: string;
          email: string;
          role: BoardRole;
          token: string;
          invited_by: string | null;
          expires_at: string;
          created_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          board_id: string;
          email: string;
          role?: BoardRole;
          token: string;
          invited_by?: string | null;
          expires_at: string;
          created_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          board_id?: string;
          email?: string;
          role?: BoardRole;
          token?: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "board_invitations_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "boards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "board_invitations_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "profiles";
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
          board_id: string;
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
          board_id?: string;
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
          board_id?: string;
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
          },
          {
            foreignKeyName: "tasks_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "boards";
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
          board_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          user_id: string;
          board_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          board_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "boards";
            referencedColumns: ["id"];
          }
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          task_id: string | null;
          user_id: string | null;
          board_id: string | null;
          action: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          user_id?: string | null;
          board_id?: string | null;
          action: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string | null;
          user_id?: string | null;
          board_id?: string | null;
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
          },
          {
            foreignKeyName: "activity_logs_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "boards";
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
          board_id: string;
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
          board_id?: string;
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
          board_id?: string;
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
          },
          {
            foreignKeyName: "archived_tasks_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "boards";
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
          board_id: string;
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
          board_id?: string;
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
          board_id?: string;
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
          },
          {
            foreignKeyName: "archived_reports_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "boards";
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
      board_role: BoardRole;
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

export type Board = Database["public"]["Tables"]["boards"]["Row"];
export type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"];
export type BoardUpdate = Database["public"]["Tables"]["boards"]["Update"];

export type BoardMember = Database["public"]["Tables"]["board_members"]["Row"];
export type BoardMemberInsert = Database["public"]["Tables"]["board_members"]["Insert"];
export type BoardMemberUpdate = Database["public"]["Tables"]["board_members"]["Update"];

export type BoardInvitation = Database["public"]["Tables"]["board_invitations"]["Row"];
export type BoardInvitationInsert = Database["public"]["Tables"]["board_invitations"]["Insert"];
export type BoardInvitationUpdate = Database["public"]["Tables"]["board_invitations"]["Update"];

export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
export type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

export type ArchivedTask = Database["public"]["Tables"]["archived_tasks"]["Row"];
export type ArchivedTaskInsert = Database["public"]["Tables"]["archived_tasks"]["Insert"];

export type ArchivedReport = Database["public"]["Tables"]["archived_reports"]["Row"];
export type ArchivedReportInsert = Database["public"]["Tables"]["archived_reports"]["Insert"];
