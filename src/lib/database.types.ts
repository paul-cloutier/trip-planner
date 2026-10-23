export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      places: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          fetched_at: string
          google_cid: string | null
          google_place_id: string | null
          google_primary_type: string | null
          google_types: string[]
          id: string
          lat: number
          lng: number
          name: string
          osm_id: number | null
          osm_tag: string | null
          osm_type: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          fetched_at?: string
          google_cid?: string | null
          google_place_id?: string | null
          google_primary_type?: string | null
          google_types?: string[]
          id?: string
          lat: number
          lng: number
          name: string
          osm_id?: number | null
          osm_tag?: string | null
          osm_type?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          fetched_at?: string
          google_cid?: string | null
          google_place_id?: string | null
          google_primary_type?: string | null
          google_types?: string[]
          id?: string
          lat?: number
          lng?: number
          name?: string
          osm_id?: number | null
          osm_tag?: string | null
          osm_type?: string | null
        }
        Relationships: []
      }
      saves: {
        Row: {
          added_at: string
          added_by: string | null
          category: string | null
          id: string
          pin_lat: number | null
          pin_lng: number | null
          place_id: string
          source_url: string | null
          space_id: string
          status: string
          tags: string[]
          via: string | null
          visited_on: string | null
          why: string | null
          would_return: boolean | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          category?: string | null
          id?: string
          pin_lat?: number | null
          pin_lng?: number | null
          place_id: string
          source_url?: string | null
          space_id: string
          status?: string
          tags?: string[]
          via?: string | null
          visited_on?: string | null
          why?: string | null
          would_return?: boolean | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          category?: string | null
          id?: string
          pin_lat?: number | null
          pin_lng?: number | null
          place_id?: string
          source_url?: string | null
          space_id?: string
          status?: string
          tags?: string[]
          via?: string | null
          visited_on?: string | null
          why?: string | null
          would_return?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "saves_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invites: {
        Row: {
          created_at: string
          display_name: string
          email: string
          space_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          space_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_invites_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          display_name: string
          joined_at: string
          space_id: string
          user_id: string
        }
        Insert: {
          display_name: string
          joined_at?: string
          space_id: string
          user_id: string
        }
        Update: {
          display_name?: string
          joined_at?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      trip_items: {
        Row: {
          added_at: string
          day: string | null
          id: string
          position: number
          save_id: string
          space_id: string
          trip_id: string
        }
        Insert: {
          added_at?: string
          day?: string | null
          id?: string
          position?: number
          save_id: string
          space_id: string
          trip_id: string
        }
        Update: {
          added_at?: string
          day?: string | null
          id?: string
          position?: number
          save_id?: string
          space_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_items_save_id_space_id_fkey"
            columns: ["save_id", "space_id"]
            isOneToOne: false
            referencedRelation: "saves"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "trip_items_trip_id_space_id_fkey"
            columns: ["trip_id", "space_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id", "space_id"]
          },
        ]
      }
      trip_legs: {
        Row: {
          city: string
          ends_on: string | null
          id: string
          position: number
          space_id: string
          starts_on: string | null
          trip_id: string
        }
        Insert: {
          city: string
          ends_on?: string | null
          id?: string
          position?: number
          space_id: string
          starts_on?: string | null
          trip_id: string
        }
        Update: {
          city?: string
          ends_on?: string | null
          id?: string
          position?: number
          space_id?: string
          starts_on?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_legs_trip_id_space_id_fkey"
            columns: ["trip_id", "space_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id", "space_id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          space_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          space_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_space_member: { Args: { target: string }; Returns: boolean }
      reconcile_trip_days: { Args: { target: string }; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

