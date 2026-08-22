import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials missing. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY inside .env'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          preferences: { language: string; currency: string };
          saved_destinations: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      destinations: {
        Row: {
          id: string;
          city_name: string;
          country: string;
          country_code: string | null;
          region: string | null;
          description: string | null;
          image_url: string | null;
          cost_index: number | null;
          popularity_score: number | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['destinations']['Row']>;
        Update: Partial<Database['public']['Tables']['destinations']['Row']>;
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          start_date: string;
          end_date: string;
          estimated_budget: number;
          currency: string;
          is_public: boolean;
          public_slug: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['trips']['Row']>;
        Update: Partial<Database['public']['Tables']['trips']['Row']>;
      };
      trip_stops: {
        Row: {
          id: string;
          trip_id: string;
          destination_id: string;
          arrival_date: string;
          departure_date: string;
          stop_order: number;
          notes: string | null;
          transport_cost: number;
          accommodation_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['trip_stops']['Row']>;
        Update: Partial<Database['public']['Tables']['trip_stops']['Row']>;
      };
      activities: {
        Row: {
          id: string;
          destination_id: string;
          name: string;
          description: string | null;
          category: string;
          duration_minutes: number;
          estimated_cost: number;
          currency: string;
          image_url: string | null;
          popularity_score: number | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['activities']['Row']>;
        Update: Partial<Database['public']['Tables']['activities']['Row']>;
      };
      itinerary_activities: {
        Row: {
          id: string;
          trip_stop_id: string;
          activity_id: string | null;
          activity_date: string;
          start_time: string | null;
          end_time: string | null;
          custom_cost: number;
          notes: string | null;
          activity_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['itinerary_activities']['Row']>;
        Update: Partial<Database['public']['Tables']['itinerary_activities']['Row']>;
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          trip_stop_id: string | null;
          category: 'transport' | 'accommodation' | 'activities' | 'meals' | 'other';
          amount: number;
          currency: string;
          expense_date: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['expenses']['Row']>;
        Update: Partial<Database['public']['Tables']['expenses']['Row']>;
      };
      trip_shares: {
        Row: {
          id: string;
          trip_id: string;
          share_token: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['trip_shares']['Row']>;
        Update: Partial<Database['public']['Tables']['trip_shares']['Row']>;
      };
    };
  };
};
