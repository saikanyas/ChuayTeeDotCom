// Supabase generated types — run `supabase gen types typescript` to regenerate
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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'cash' | 'bank' | 'savings' | 'ewallet'
          balance: number
          bank_name: string | null
          color: string
          icon: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          name_th: string | null
          type: 'income' | 'expense'
          icon: string
          color: string
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          category_id: string | null
          type: 'income' | 'expense'
          amount: number
          description: string | null
          transaction_date: string
          transaction_time: string | null
          slip_id: string | null
          source: 'manual' | 'slip_scan'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
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
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['slips']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['slips']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['notification_settings']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notification_settings']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
