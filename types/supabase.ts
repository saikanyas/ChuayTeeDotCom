// Supabase generated types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          default_currency: string
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          default_currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          default_currency?: string
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          balance: number
          bank_name: string | null
          color: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          balance?: number
          bank_name?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          balance?: number
          bank_name?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          name_th: string | null
          type: string
          icon: string
          color: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          name_th?: string | null
          type: string
          icon: string
          color: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          name_th?: string | null
          type?: string
          icon?: string
          color?: string
          is_default?: boolean
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_amount: number
          current_amount: number
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_amount: number
          current_amount?: number
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_amount?: number
          current_amount?: number
          color?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          category_id: string | null
          type: string
          amount: number
          description: string | null
          transaction_date: string
          transaction_time: string | null
          slip_id: string | null
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          category_id?: string | null
          type: string
          amount: number
          description?: string | null
          transaction_date?: string
          transaction_time?: string | null
          slip_id?: string | null
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          category_id?: string | null
          type?: string
          amount?: number
          description?: string | null
          transaction_date?: string
          transaction_time?: string | null
          slip_id?: string | null
          source?: string
          created_at?: string
        }
      }
      slips: {
        Row: {
          id: string
          user_id: string
          storage_path: string
          ocr_raw_text: string | null
          detected_bank: string | null
          extracted_amount: number | null
          extracted_date: string | null
          extracted_time: string | null
          reference_number: string | null
          sender_name: string | null
          receiver_name: string | null
          confidence: number | null
          processing_status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          storage_path: string
          ocr_raw_text?: string | null
          detected_bank?: string | null
          extracted_amount?: number | null
          extracted_date?: string | null
          extracted_time?: string | null
          reference_number?: string | null
          sender_name?: string | null
          receiver_name?: string | null
          confidence?: number | null
          processing_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          storage_path?: string
          ocr_raw_text?: string | null
          detected_bank?: string | null
          extracted_amount?: number | null
          extracted_date?: string | null
          extracted_time?: string | null
          reference_number?: string | null
          sender_name?: string | null
          receiver_name?: string | null
          confidence?: number | null
          processing_status?: string
          created_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          enabled: boolean
          reminder_time: string
          timezone: string
          push_subscription: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enabled?: boolean
          reminder_time?: string
          timezone?: string
          push_subscription?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enabled?: boolean
          reminder_time?: string
          timezone?: string
          push_subscription?: Json | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
