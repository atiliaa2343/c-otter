export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          id: string
          tab: string
          section_key: string
          type: string
          value: string | null
          image_url: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          tab: string
          section_key: string
          type: string
          value?: string | null
          image_url?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          tab?: string
          section_key?: string
          type?: string
          value?: string | null
          image_url?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      questionnaire_responses: {
        Row: {
          id: string
          user_id: string
          responses: Json
          submitted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          responses: Json
          submitted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          responses?: Json
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      wearable_connections: {
        Row: {
          id: string
          user_id: string
          platform: string
          connected_at: string
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          connected_at?: string
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          connected_at?: string
          last_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      health_metrics: {
        Row: {
          id: string
          user_id: string
          wearable_connection_id: string | null
          metric_type: string
          value: number
          unit: string
          recorded_at: string
          source: string
          flagged: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wearable_connection_id?: string | null
          metric_type: string
          value: number
          unit: string
          recorded_at: string
          source: string
          flagged?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wearable_connection_id?: string | null
          metric_type?: string
          value?: number
          unit?: string
          recorded_at?: string
          source?: string
          flagged?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_metrics_wearable_connection_id_fkey"
            columns: ["wearable_connection_id"]
            isOneToOne: false
            referencedRelation: "wearable_connections"
            referencedColumns: ["id"]
          }
        ]
      }
      hours_of_operation: {
        Row: {
          id: number
          location_id: number
          open_time: string | null
          close_time: string | null
          monday: boolean
          tuesday: boolean
          wednesday: boolean
          thursday: boolean
          friday: boolean
          saturday: boolean
          sunday: boolean
          created_at: string
        }
        Insert: {
          id?: number
          location_id: number
          open_time?: string | null
          close_time?: string | null
          monday?: boolean
          tuesday?: boolean
          wednesday?: boolean
          thursday?: boolean
          friday?: boolean
          saturday?: boolean
          sunday?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          location_id?: number
          open_time?: string | null
          close_time?: string | null
          monday?: boolean
          tuesday?: boolean
          wednesday?: boolean
          thursday?: boolean
          friday?: boolean
          saturday?: boolean
          sunday?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hours_of_operation_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: number
          name: string
          address: string | null
          phone_number: string | null
          theme: string | null
          hours_summary: string | null
          created_at: string
        }
        Insert: {
          id: number
          name: string
          address?: string | null
          phone_number?: string | null
          theme?: string | null
          hours_summary?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          address?: string | null
          phone_number?: string | null
          theme?: string | null
          hours_summary?: string | null
          created_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          type: string | null
          name: string
          description: string | null
          address: string | null
          phone: string | null
          website: string | null
          tags: string[] | null
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type?: string | null
          name: string
          description?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          tags?: string[] | null
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string | null
          name?: string
          description?: string | null
          address?: string | null
          phone?: string | null
          website?: string | null
          tags?: string[] | null
          embedding?: string | null
          created_at?: string
        }
        Relationships: []
      }
      faculty_members: {
        Row: {
          id: string
          name: string
          title: string | null
          email: string | null
          phone: string | null
          image_key: string | null
          is_director: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          title?: string | null
          email?: string | null
          phone?: string | null
          image_key?: string | null
          is_director?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          title?: string | null
          email?: string | null
          phone?: string | null
          image_key?: string | null
          is_director?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      health_topics: {
        Row: {
          id: string
          title: string
          description: string | null
          color: string | null
          image_key: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          color?: string | null
          image_key?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          color?: string | null
          image_key?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      home_events: {
        Row: {
          id: string
          title: string
          description: string | null
          icon: string | null
          color: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_resources: {
        Args: { query_embedding: string; match_count?: number }
        Returns: {
          id: string
          type: string | null
          name: string
          description: string | null
          address: string | null
          phone: string | null
          website: string | null
          tags: string[] | null
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
