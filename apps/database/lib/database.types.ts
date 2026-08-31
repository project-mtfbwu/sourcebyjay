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
      ad_campaigns: {
        Row: {
          billing_model: Database["public"]["Enums"]["ad_billing_model"]
          budget_day: string
          category_hint: string | null
          clicks_count: number
          cpm_rate_inr_cents: number | null
          created_at: string
          created_by_staff_id: string | null
          created_by_user_id: string | null
          daily_budget_inr_cents: number
          end_at: string | null
          id: string
          impressions_count: number
          max_cpc_bid_inr_cents: number | null
          name: string
          on_behalf_of_supplier_id: string | null
          placement_types: string[]
          rejection_reason: string | null
          spent_inr_cents: number
          spent_today_inr_cents: number
          sponsorship_daily_inr_cents: number | null
          start_at: string
          status: Database["public"]["Enums"]["ad_campaign_status"]
          supplier_id: string
          total_budget_inr_cents: number | null
          updated_at: string
        }
        Insert: {
          billing_model?: Database["public"]["Enums"]["ad_billing_model"]
          budget_day?: string
          category_hint?: string | null
          clicks_count?: number
          cpm_rate_inr_cents?: number | null
          created_at?: string
          created_by_staff_id?: string | null
          created_by_user_id?: string | null
          daily_budget_inr_cents?: number
          end_at?: string | null
          id?: string
          impressions_count?: number
          max_cpc_bid_inr_cents?: number | null
          name: string
          on_behalf_of_supplier_id?: string | null
          placement_types?: string[]
          rejection_reason?: string | null
          spent_inr_cents?: number
          spent_today_inr_cents?: number
          sponsorship_daily_inr_cents?: number | null
          start_at?: string
          status?: Database["public"]["Enums"]["ad_campaign_status"]
          supplier_id: string
          total_budget_inr_cents?: number | null
          updated_at?: string
        }
        Update: {
          billing_model?: Database["public"]["Enums"]["ad_billing_model"]
          budget_day?: string
          category_hint?: string | null
          clicks_count?: number
          cpm_rate_inr_cents?: number | null
          created_at?: string
          created_by_staff_id?: string | null
          created_by_user_id?: string | null
          daily_budget_inr_cents?: number
          end_at?: string | null
          id?: string
          impressions_count?: number
          max_cpc_bid_inr_cents?: number | null
          name?: string
          on_behalf_of_supplier_id?: string | null
          placement_types?: string[]
          rejection_reason?: string | null
          spent_inr_cents?: number
          spent_today_inr_cents?: number
          sponsorship_daily_inr_cents?: number | null
          start_at?: string
          status?: Database["public"]["Enums"]["ad_campaign_status"]
          supplier_id?: string
          total_budget_inr_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_on_behalf_of_supplier_id_fkey"
            columns: ["on_behalf_of_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_clicks: {
        Row: {
          campaign_id: string
          cpc_charged_inr_cents: number
          created_at: string
          creative_id: string
          id: string
          impression_id: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          campaign_id: string
          cpc_charged_inr_cents?: number
          created_at?: string
          creative_id: string
          id?: string
          impression_id?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          campaign_id?: string
          cpc_charged_inr_cents?: number
          created_at?: string
          creative_id?: string
          id?: string
          impression_id?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_impression_id_fkey"
            columns: ["impression_id"]
            isOneToOne: false
            referencedRelation: "ad_impressions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_wallet_tx_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "ad_wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          body_text: string | null
          campaign_id: string
          created_at: string
          creative_format: string
          cta_label: string
          headline_override: string | null
          id: string
          media_url: string | null
          product_id: string | null
          sort_order: number
        }
        Insert: {
          body_text?: string | null
          campaign_id: string
          created_at?: string
          creative_format?: string
          cta_label?: string
          headline_override?: string | null
          id?: string
          media_url?: string | null
          product_id?: string | null
          sort_order?: number
        }
        Update: {
          body_text?: string | null
          campaign_id?: string
          created_at?: string
          creative_format?: string
          cta_label?: string
          headline_override?: string | null
          id?: string
          media_url?: string | null
          product_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          campaign_id: string
          cpm_charged_inr_cents: number
          created_at: string
          creative_id: string
          id: string
          placement: string
          search_query: string | null
          viewer_user_id: string | null
        }
        Insert: {
          campaign_id: string
          cpm_charged_inr_cents?: number
          created_at?: string
          creative_id: string
          id?: string
          placement: string
          search_query?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          campaign_id?: string
          cpm_charged_inr_cents?: number
          created_at?: string
          creative_id?: string
          id?: string
          placement?: string
          search_query?: string | null
          viewer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_invoices: {
        Row: {
          campaign_id: string | null
          created_at: string
          currency: string
          id: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["ad_invoice_type"]
          issued_at: string
          line_items: Json
          line_summary: string | null
          period_end: string | null
          period_start: string | null
          status: string
          subtotal_inr: number
          supplier_id: string
          test_mode: boolean
          total_inr: number
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["ad_invoice_type"]
          issued_at?: string
          line_items?: Json
          line_summary?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          subtotal_inr: number
          supplier_id: string
          test_mode?: boolean
          total_inr: number
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          invoice_type?: Database["public"]["Enums"]["ad_invoice_type"]
          issued_at?: string
          line_items?: Json
          line_summary?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          subtotal_inr?: number
          supplier_id?: string
          test_mode?: boolean
          total_inr?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_invoices_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_keywords: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          keyword: string
          match_type: string
          negative: boolean
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          keyword: string
          match_type?: string
          negative?: boolean
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          keyword?: string
          match_type?: string
          negative?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ad_keywords_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_wallet_transactions: {
        Row: {
          ad_click_id: string | null
          ad_impression_id: string | null
          ad_invoice_id: string | null
          amount_inr_cents: number
          balance_after_inr_cents: number
          campaign_id: string | null
          created_at: string
          created_by_staff_id: string | null
          created_by_user_id: string | null
          id: string
          note: string | null
          supplier_id: string
          tx_type: Database["public"]["Enums"]["ad_wallet_tx_type"]
        }
        Insert: {
          ad_click_id?: string | null
          ad_impression_id?: string | null
          ad_invoice_id?: string | null
          amount_inr_cents: number
          balance_after_inr_cents: number
          campaign_id?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          created_by_user_id?: string | null
          id?: string
          note?: string | null
          supplier_id: string
          tx_type: Database["public"]["Enums"]["ad_wallet_tx_type"]
        }
        Update: {
          ad_click_id?: string | null
          ad_impression_id?: string | null
          ad_invoice_id?: string | null
          amount_inr_cents?: number
          balance_after_inr_cents?: number
          campaign_id?: string | null
          created_at?: string
          created_by_staff_id?: string | null
          created_by_user_id?: string | null
          id?: string
          note?: string | null
          supplier_id?: string
          tx_type?: Database["public"]["Enums"]["ad_wallet_tx_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ad_wallet_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_wallet_tx_campaign_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_wallet_tx_invoice_fkey"
            columns: ["ad_invoice_id"]
            isOneToOne: false
            referencedRelation: "ad_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_wallets: {
        Row: {
          balance_inr_cents: number
          supplier_id: string
          updated_at: string
        }
        Insert: {
          balance_inr_cents?: number
          supplier_id: string
          updated_at?: string
        }
        Update: {
          balance_inr_cents?: number
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_wallets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      buyer_business_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          buyer_id: string
          city: string | null
          company_name: string | null
          country: string
          created_at: string
          gstin: string | null
          id: string
          is_default: boolean
          label: string
          pan: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          buyer_id: string
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          gstin?: string | null
          id?: string
          is_default?: boolean
          label?: string
          pan?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          buyer_id?: string
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          gstin?: string | null
          id?: string
          is_default?: boolean
          label?: string
          pan?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      buyer_fake_credits: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          currency: string
          id: string
          note: string | null
          order_id: string
          reason: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          order_id: string
          reason?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          order_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_fake_credits_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_favorites: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          kind: string
          product_id: string | null
          supplier_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          kind: string
          product_id?: string | null
          supplier_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          kind?: string
          product_id?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_favorites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      content_blog_post_comments: {
        Row: {
          author_id: string
          blog_post_id: string
          body: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          blog_post_id: string
          body: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          blog_post_id?: string
          body?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blog_post_comments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "content_blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blog_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          inquiry_id: string | null
          last_message_at: string | null
          product_id: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          inquiry_id?: string | null
          last_message_at?: string | null
          product_id?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          inquiry_id?: string | null
          last_message_at?: string | null
          product_id?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          dispute_id: string
          id: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          dispute_id: string
          id?: string
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          dispute_id?: string
          id?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          assigned_staff_id: string | null
          buyer_note: string | null
          created_at: string
          id: string
          opened_by: string
          order_id: string
          reason: string
          refund_amount_cents: number | null
          resolution: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_staff_id?: string | null
          buyer_note?: string | null
          created_at?: string
          id?: string
          opened_by: string
          order_id: string
          reason: string
          refund_amount_cents?: number | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_staff_id?: string | null
          buyer_note?: string | null
          created_at?: string
          id?: string
          opened_by?: string
          order_id?: string
          reason?: string
          refund_amount_cents?: number | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_ledger_entries: {
        Row: {
          actor_user_id: string | null
          amount: number
          created_at: string
          currency: string
          entry_type: string
          id: string
          note: string | null
          order_id: string
        }
        Insert: {
          actor_user_id?: string | null
          amount: number
          created_at?: string
          currency?: string
          entry_type: string
          id?: string
          note?: string | null
          order_id: string
        }
        Update: {
          actor_user_id?: string | null
          amount?: number
          created_at?: string
          currency?: string
          entry_type?: string
          id?: string
          note?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_configs: {
        Row: {
          field_key: string
          id: string
          label: string
          mode: string
          persona: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          field_key: string
          id?: string
          label: string
          mode?: string
          persona: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          field_key?: string
          id?: string
          label?: string
          mode?: string
          persona?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      guarantee_policies: {
        Row: {
          active: boolean
          coverage_quality: boolean
          coverage_shipping: boolean
          created_at: string
          dispute_days: number
          id: string
          max_order_inr_cents: number | null
          max_order_usd_cents: number | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          coverage_quality?: boolean
          coverage_shipping?: boolean
          created_at?: string
          dispute_days?: number
          id?: string
          max_order_inr_cents?: number | null
          max_order_usd_cents?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          coverage_quality?: boolean
          coverage_shipping?: boolean
          created_at?: string
          dispute_days?: number
          id?: string
          max_order_inr_cents?: number | null
          max_order_usd_cents?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          contact_email: string
          created_at: string
          id: string
          is_broadcast: boolean
          message: string
          product_id: string | null
          quantity: number | null
          supplier_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          contact_email: string
          created_at?: string
          id?: string
          is_broadcast?: boolean
          message: string
          product_id?: string | null
          quantity?: number | null
          supplier_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string
          id?: string
          is_broadcast?: boolean
          message?: string
          product_id?: string | null
          quantity?: number | null
          supplier_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_suppliers: {
        Row: {
          created_at: string
          inquiry_id: string
          product_id: string | null
          status: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          inquiry_id: string
          product_id?: string | null
          status?: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          inquiry_id?: string
          product_id?: string | null
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_suppliers_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_plans: {
        Row: {
          active: boolean
          ad_wallet_bonus_inr_cents: number
          created_at: string
          features: Json
          guarantee_eligible: boolean
          id: string
          max_listings: number | null
          name: string
          price_inr_cents_annual: number
          rank_boost_bps: number
          rfq_leads_per_week: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          ad_wallet_bonus_inr_cents?: number
          created_at?: string
          features?: Json
          guarantee_eligible?: boolean
          id?: string
          max_listings?: number | null
          name: string
          price_inr_cents_annual?: number
          rank_boost_bps?: number
          rfq_leads_per_week?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          ad_wallet_bonus_inr_cents?: number
          created_at?: string
          features?: Json
          guarantee_eligible?: boolean
          id?: string
          max_listings?: number | null
          name?: string
          price_inr_cents_annual?: number
          rank_boost_bps?: number
          rfq_leads_per_week?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      listing_request_offers: {
        Row: {
          created_at: string
          currency: string
          id: string
          lead_time_days: number | null
          listing_request_id: string
          message: string
          status: string
          supplier_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          lead_time_days?: number | null
          listing_request_id: string
          message: string
          status?: string
          supplier_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          lead_time_days?: number | null
          listing_request_id?: string
          message?: string
          status?: string
          supplier_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_request_offers_listing_request_id_fkey"
            columns: ["listing_request_id"]
            isOneToOne: false
            referencedRelation: "listing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_request_offers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_requests: {
        Row: {
          buyer_id: string
          category_hint: string | null
          contact_email: string
          created_at: string
          description: string
          id: string
          quantity: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          category_hint?: string | null
          contact_email: string
          created_at?: string
          description: string
          id?: string
          quantity?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          category_hint?: string | null
          contact_email?: string
          created_at?: string
          description?: string
          id?: string
          quantity?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_invoices: {
        Row: {
          buyer_id: string
          created_at: string
          currency: string
          id: string
          invoice_number: string
          issued_at: string
          line_summary: string | null
          order_id: string
          status: string
          subtotal: number
          supplier_id: string
          total: number
        }
        Insert: {
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          issued_at?: string
          line_summary?: string | null
          order_id: string
          status?: string
          subtotal: number
          supplier_id: string
          total: number
        }
        Update: {
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          line_summary?: string | null
          order_id?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          commission_rate_bps: number
          created_at: string
          currency: string
          delivered_at: string | null
          destination_pincode: string | null
          escrow_status: string
          estimated_weight_kg: number | null
          freight_amount: number
          guarantee_policy_id: string | null
          guarantee_protected: boolean
          id: string
          incoterm: string
          inquiry_id: string | null
          is_sample: boolean
          notes: string | null
          product_id: string | null
          product_subtotal: number | null
          quantity: number
          quote_id: string | null
          ship_by_date: string | null
          shipping_zone: string | null
          status: string
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          commission_rate_bps?: number
          created_at?: string
          currency?: string
          delivered_at?: string | null
          destination_pincode?: string | null
          escrow_status?: string
          estimated_weight_kg?: number | null
          freight_amount?: number
          guarantee_policy_id?: string | null
          guarantee_protected?: boolean
          id?: string
          incoterm?: string
          inquiry_id?: string | null
          is_sample?: boolean
          notes?: string | null
          product_id?: string | null
          product_subtotal?: number | null
          quantity: number
          quote_id?: string | null
          ship_by_date?: string | null
          shipping_zone?: string | null
          status?: string
          supplier_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          commission_rate_bps?: number
          created_at?: string
          currency?: string
          delivered_at?: string | null
          destination_pincode?: string | null
          escrow_status?: string
          estimated_weight_kg?: number | null
          freight_amount?: number
          guarantee_policy_id?: string | null
          guarantee_protected?: boolean
          id?: string
          incoterm?: string
          inquiry_id?: string | null
          is_sample?: boolean
          notes?: string | null
          product_id?: string | null
          product_subtotal?: number | null
          quantity?: number
          quote_id?: string | null
          ship_by_date?: string | null
          shipping_zone?: string | null
          status?: string
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_guarantee_policy_id_fkey"
            columns: ["guarantee_policy_id"]
            isOneToOne: false
            referencedRelation: "guarantee_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          marked_paid_at: string | null
          marked_paid_by: string | null
          notes: string | null
          order_id: string
          provider: string
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          marked_paid_at?: string | null
          marked_paid_by?: string | null
          notes?: string | null
          order_id: string
          provider?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          marked_paid_at?: string | null
          marked_paid_by?: string | null
          notes?: string | null
          order_id?: string
          provider?: string
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          purpose: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          purpose: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          purpose?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          default_commission_bps: number
          id: boolean
          min_commission_bps: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          default_commission_bps?: number
          id?: boolean
          min_commission_bps?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          default_commission_bps?: number
          id?: boolean
          min_commission_bps?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      private_items: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      product_media: {
        Row: {
          asset_id: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          asset_id: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          asset_id?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_media_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "supplier_media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json
          category_id: string | null
          created_at: string
          currency: string
          customization_available: boolean
          description: string
          gst_rate_bps: number | null
          hsn_code: string | null
          id: string
          image_url: string
          images: Json
          is_local: boolean
          lead_time_days: number | null
          max_order_qty: number | null
          moq: number
          payment_terms: string | null
          price: number
          price_tiers: Json | null
          product_video_enabled: boolean
          sample_available: boolean
          shipping_info: Json
          slug: string
          sold_count: number | null
          specs: Json
          status: Database["public"]["Enums"]["listing_status"]
          supplier_id: string
          title: string
          unit: string
          updated_at: string
          variants: Json
          video_url: string | null
        }
        Insert: {
          attributes?: Json
          category_id?: string | null
          created_at?: string
          currency?: string
          customization_available?: boolean
          description?: string
          gst_rate_bps?: number | null
          hsn_code?: string | null
          id?: string
          image_url: string
          images?: Json
          is_local?: boolean
          lead_time_days?: number | null
          max_order_qty?: number | null
          moq?: number
          payment_terms?: string | null
          price: number
          price_tiers?: Json | null
          product_video_enabled?: boolean
          sample_available?: boolean
          shipping_info?: Json
          slug: string
          sold_count?: number | null
          specs?: Json
          status?: Database["public"]["Enums"]["listing_status"]
          supplier_id: string
          title: string
          unit?: string
          updated_at?: string
          variants?: Json
          video_url?: string | null
        }
        Update: {
          attributes?: Json
          category_id?: string | null
          created_at?: string
          currency?: string
          customization_available?: boolean
          description?: string
          gst_rate_bps?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string
          images?: Json
          is_local?: boolean
          lead_time_days?: number | null
          max_order_qty?: number | null
          moq?: number
          payment_terms?: string | null
          price?: number
          price_tiers?: Json | null
          product_video_enabled?: boolean
          sample_available?: boolean
          shipping_info?: Json
          slug?: string
          sold_count?: number | null
          specs?: Json
          status?: Database["public"]["Enums"]["listing_status"]
          supplier_id?: string
          title?: string
          unit?: string
          updated_at?: string
          variants?: Json
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          gstin: string | null
          id: string
          industry: string | null
          phone: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          gstin?: string | null
          id: string
          industry?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          gstin?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          buyer_id: string
          created_at: string
          created_by: string | null
          currency: string
          destination_pincode: string | null
          estimated_weight_kg: number | null
          freight_amount: number
          id: string
          incoterm: string
          inquiry_id: string | null
          is_sample: boolean
          lead_time_days: number
          notes: string | null
          product_id: string | null
          quantity: number
          ship_by_date: string | null
          shipping_zone: string | null
          status: string
          supplier_id: string
          unit_price: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          destination_pincode?: string | null
          estimated_weight_kg?: number | null
          freight_amount?: number
          id?: string
          incoterm?: string
          inquiry_id?: string | null
          is_sample?: boolean
          lead_time_days?: number
          notes?: string | null
          product_id?: string | null
          quantity: number
          ship_by_date?: string | null
          shipping_zone?: string | null
          status?: string
          supplier_id: string
          unit_price: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          destination_pincode?: string | null
          estimated_weight_kg?: number | null
          freight_amount?: number
          id?: string
          incoterm?: string
          inquiry_id?: string | null
          is_sample?: boolean
          lead_time_days?: number
          notes?: string | null
          product_id?: string | null
          quantity?: number
          ship_by_date?: string | null
          shipping_zone?: string | null
          status?: string
          supplier_id?: string
          unit_price?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          buyer_id: string
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          rating: number
          supplier_id: string
          title: string | null
        }
        Insert: {
          body: string
          buyer_id: string
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          rating: number
          supplier_id: string
          title?: string | null
        }
        Update: {
          body?: string
          buyer_id?: string
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          rating?: number
          supplier_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zone_pins: {
        Row: {
          label: string
          pin_prefix: string
          zone_code: string
        }
        Insert: {
          label: string
          pin_prefix: string
          zone_code: string
        }
        Update: {
          label?: string
          pin_prefix?: string
          zone_code?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          can_set_below_min_commission: boolean
          created_at: string
          created_by: string | null
          department: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          can_set_below_min_commission?: boolean
          created_at?: string
          created_by?: string | null
          department?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          can_set_below_min_commission?: boolean
          created_at?: string
          created_by?: string | null
          department?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_certificates: {
        Row: {
          cert_number: string | null
          cert_type: string
          created_at: string
          expires_at: string | null
          file_url: string
          id: string
          issuing_authority: string | null
          name: string
          status: Database["public"]["Enums"]["media_review_status"]
          supplier_id: string
          updated_at: string
        }
        Insert: {
          cert_number?: string | null
          cert_type?: string
          created_at?: string
          expires_at?: string | null
          file_url: string
          id?: string
          issuing_authority?: string | null
          name: string
          status?: Database["public"]["Enums"]["media_review_status"]
          supplier_id: string
          updated_at?: string
        }
        Update: {
          cert_number?: string | null
          cert_type?: string
          created_at?: string
          expires_at?: string | null
          file_url?: string
          id?: string
          issuing_authority?: string | null
          name?: string
          status?: Database["public"]["Enums"]["media_review_status"]
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_certificates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_gallery: {
        Row: {
          asset_id: string | null
          caption: string | null
          content_kind: string
          created_at: string
          id: string
          image_url: string
          media_type: Database["public"]["Enums"]["gallery_media_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          sort_order: number
          staff_note: string | null
          status: Database["public"]["Enums"]["media_review_status"]
          supplier_id: string
          updated_at: string
          uploaded_by: string | null
          video_url: string | null
        }
        Insert: {
          asset_id?: string | null
          caption?: string | null
          content_kind?: string
          created_at?: string
          id?: string
          image_url: string
          media_type?: Database["public"]["Enums"]["gallery_media_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number
          staff_note?: string | null
          status?: Database["public"]["Enums"]["media_review_status"]
          supplier_id: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Update: {
          asset_id?: string | null
          caption?: string | null
          content_kind?: string
          created_at?: string
          id?: string
          image_url?: string
          media_type?: Database["public"]["Enums"]["gallery_media_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          sort_order?: number
          staff_note?: string | null
          status?: Database["public"]["Enums"]["media_review_status"]
          supplier_id?: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_gallery_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "supplier_media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_gallery_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_media_assets: {
        Row: {
          caption: string | null
          content_kind: string
          created_at: string
          file_size_bytes: number | null
          folder_id: string | null
          id: string
          public_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          staff_note: string | null
          status: Database["public"]["Enums"]["media_review_status"]
          storage_path: string
          supplier_id: string
          thumbnail_url: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          content_kind: string
          created_at?: string
          file_size_bytes?: number | null
          folder_id?: string | null
          id?: string
          public_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["media_review_status"]
          storage_path: string
          supplier_id: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          content_kind?: string
          created_at?: string
          file_size_bytes?: number | null
          folder_id?: string | null
          id?: string
          public_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["media_review_status"]
          storage_path?: string
          supplier_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_media_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "supplier_media_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_media_assets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_media_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "supplier_media_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_media_folders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          banner_url: string | null
          business_type:
            | Database["public"]["Enums"]["supplier_business_type"]
            | null
          city: string
          commission_below_min_approved: boolean
          commission_notes: string | null
          commission_rate_bps: number
          commission_set_at: string | null
          commission_set_by: string | null
          country: string
          created_at: string
          description: string
          employee_count_band: string | null
          export_markets: Json
          guarantee_ops_override: boolean | null
          guarantee_policy_id: string | null
          id: string
          main_products: string
          msme_udhyam: string | null
          name: string
          owner_id: string | null
          pan: string | null
          pincode: string | null
          response_rate: string
          slug: string
          state: string | null
          updated_at: string
          verification_tier: Database["public"]["Enums"]["verification_tier"]
          verified: boolean
          years_in_business: number
        }
        Insert: {
          banner_url?: string | null
          business_type?:
            | Database["public"]["Enums"]["supplier_business_type"]
            | null
          city: string
          commission_below_min_approved?: boolean
          commission_notes?: string | null
          commission_rate_bps?: number
          commission_set_at?: string | null
          commission_set_by?: string | null
          country: string
          created_at?: string
          description?: string
          employee_count_band?: string | null
          export_markets?: Json
          guarantee_ops_override?: boolean | null
          guarantee_policy_id?: string | null
          id?: string
          main_products?: string
          msme_udhyam?: string | null
          name: string
          owner_id?: string | null
          pan?: string | null
          pincode?: string | null
          response_rate?: string
          slug: string
          state?: string | null
          updated_at?: string
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
          verified?: boolean
          years_in_business?: number
        }
        Update: {
          banner_url?: string | null
          business_type?:
            | Database["public"]["Enums"]["supplier_business_type"]
            | null
          city?: string
          commission_below_min_approved?: boolean
          commission_notes?: string | null
          commission_rate_bps?: number
          commission_set_at?: string | null
          commission_set_by?: string | null
          country?: string
          created_at?: string
          description?: string
          employee_count_band?: string | null
          export_markets?: Json
          guarantee_ops_override?: boolean | null
          guarantee_policy_id?: string | null
          id?: string
          main_products?: string
          msme_udhyam?: string | null
          name?: string
          owner_id?: string | null
          pan?: string | null
          pincode?: string | null
          response_rate?: string
          slug?: string
          state?: string | null
          updated_at?: string
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
          verified?: boolean
          years_in_business?: number
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_guarantee_policy_id_fkey"
            columns: ["guarantee_policy_id"]
            isOneToOne: false
            referencedRelation: "guarantee_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_subscription_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          from_plan_id: string | null
          id: string
          meta: Json
          supplier_id: string
          to_plan_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          from_plan_id?: string | null
          id?: string
          meta?: Json
          supplier_id: string
          to_plan_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          from_plan_id?: string | null
          id?: string
          meta?: Json
          supplier_id?: string
          to_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_subscription_events_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "listing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_subscription_events_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_subscription_events_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "listing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by_staff_id: string | null
          id: string
          notes: string | null
          plan_id: string
          started_at: string
          status: string
          stripe_subscription_id: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by_staff_id?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by_staff_id?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "listing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_subscriptions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_quote: { Args: { p_quote_id: string }; Returns: Json }
      active_guarantee_policy: {
        Args: never
        Returns: {
          active: boolean
          coverage_quality: boolean
          coverage_shipping: boolean
          created_at: string
          dispute_days: number
          id: string
          max_order_inr_cents: number | null
          max_order_usd_cents: number | null
          name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "guarantee_policies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ad_campaign_reset_daily_spend: {
        Args: { p_campaign_id: string }
        Returns: {
          billing_model: Database["public"]["Enums"]["ad_billing_model"]
          budget_day: string
          category_hint: string | null
          clicks_count: number
          cpm_rate_inr_cents: number | null
          created_at: string
          created_by_staff_id: string | null
          created_by_user_id: string | null
          daily_budget_inr_cents: number
          end_at: string | null
          id: string
          impressions_count: number
          max_cpc_bid_inr_cents: number | null
          name: string
          on_behalf_of_supplier_id: string | null
          placement_types: string[]
          rejection_reason: string | null
          spent_inr_cents: number
          spent_today_inr_cents: number
          sponsorship_daily_inr_cents: number | null
          start_at: string
          status: Database["public"]["Enums"]["ad_campaign_status"]
          supplier_id: string
          total_budget_inr_cents: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ad_campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ad_credit_wallet: {
        Args: {
          p_amount_inr_cents: number
          p_create_receipt?: boolean
          p_note?: string
          p_staff_id?: string
          p_supplier_id: string
          p_tx_type: Database["public"]["Enums"]["ad_wallet_tx_type"]
          p_user_id?: string
        }
        Returns: Json
      }
      ad_debit_wallet: {
        Args: {
          p_amount_inr_cents: number
          p_campaign_id?: string
          p_note?: string
          p_staff_id?: string
          p_supplier_id: string
          p_tx_type: Database["public"]["Enums"]["ad_wallet_tx_type"]
          p_user_id?: string
        }
        Returns: Json
      }
      ad_keyword_matches: {
        Args: { p_keyword: string; p_match_type: string; p_query: string }
        Returns: boolean
      }
      add_dispute_message: {
        Args: { p_body: string; p_dispute_id: string }
        Returns: Json
      }
      approve_vendor_plan_request: {
        Args: { p_supplier_id: string }
        Returns: Json
      }
      broadcast_rfq: {
        Args: {
          p_contact_email: string
          p_message: string
          p_quantity: number
          p_targets: Json
          p_title?: string
        }
        Returns: Json
      }
      cancel_unpaid_order: {
        Args: { p_note?: string; p_order_id: string }
        Returns: Json
      }
      create_listing_request: {
        Args: {
          p_category_hint?: string
          p_contact_email: string
          p_description: string
          p_quantity?: number
          p_title: string
        }
        Returns: Json
      }
      create_quote: {
        Args: {
          p_currency?: string
          p_destination_pincode?: string
          p_estimated_weight_kg?: number
          p_freight_amount?: number
          p_incoterm?: string
          p_inquiry_id: string
          p_is_sample?: boolean
          p_lead_time_days: number
          p_notes: string
          p_quantity: number
          p_ship_by_date?: string
          p_unit_price: number
          p_valid_until: string
        }
        Returns: Json
      }
      create_verified_review: {
        Args: {
          p_body: string
          p_order_id: string
          p_rating: number
          p_title?: string
        }
        Returns: Json
      }
      ensure_ad_wallet: { Args: { p_supplier_id: string }; Returns: undefined }
      estimate_freight_inr: {
        Args: {
          p_international?: boolean
          p_pincode?: string
          p_weight_kg: number
        }
        Returns: Json
      }
      fake_mark_order_paid: {
        Args: { p_accept_guarantee_terms?: boolean; p_order_id: string }
        Returns: Json
      }
      fake_top_up_ad_wallet: {
        Args: { p_amount_inr_cents?: number }
        Returns: Json
      }
      get_sponsored_placements: {
        Args: {
          p_category_slug?: string
          p_limit?: number
          p_placement: string
          p_query?: string
        }
        Returns: Json
      }
      is_active_staff: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      is_valid_gstin: { Args: { p_gstin: string }; Returns: boolean }
      is_valid_hsn: { Args: { p_hsn: string }; Returns: boolean }
      is_valid_pan: { Args: { p_pan: string }; Returns: boolean }
      next_ad_invoice_number: { Args: { p_prefix?: string }; Returns: string }
      next_invoice_number: { Args: never; Returns: string }
      open_conversation: {
        Args: {
          p_inquiry_id?: string
          p_product_id?: string
          p_supplier_id: string
        }
        Returns: Json
      }
      open_order_dispute: {
        Args: { p_buyer_note?: string; p_order_id: string; p_reason: string }
        Returns: Json
      }
      ops_grant_ad_credit: {
        Args: {
          p_amount_inr_cents: number
          p_note?: string
          p_supplier_id: string
        }
        Returns: Json
      }
      record_ad_click: {
        Args: {
          p_creative_id: string
          p_impression_id?: string
          p_placement?: string
        }
        Returns: Json
      }
      record_ad_impression: {
        Args: {
          p_creative_id: string
          p_placement: string
          p_search_query?: string
        }
        Returns: Json
      }
      reject_quote: { Args: { p_quote_id: string }; Returns: Json }
      release_escrow_to_seller: {
        Args: { p_note?: string; p_order_id: string }
        Returns: Json
      }
      request_phone_otp: {
        Args: { p_phone: string; p_purpose: string }
        Returns: Json
      }
      request_vendor_plan: { Args: { p_plan_id: string }; Returns: Json }
      resolve_dispute: {
        Args: {
          p_dispute_id: string
          p_note?: string
          p_refund_amount_cents?: number
          p_resolution: string
        }
        Returns: Json
      }
      resolve_shipping_zone: { Args: { p_pincode: string }; Returns: string }
      return_escrow_to_buyer: {
        Args: { p_note?: string; p_order_id: string }
        Returns: Json
      }
      send_chat_message: {
        Args: { p_body: string; p_conversation_id: string }
        Returns: Json
      }
      set_supplier_guarantee_override: {
        Args: { p_override: boolean; p_supplier_id: string }
        Returns: Json
      }
      staff_has_min_role: {
        Args: { min_role: Database["public"]["Enums"]["staff_role"] }
        Returns: boolean
      }
      submit_listing_offer: {
        Args: {
          p_lead_time_days?: number
          p_listing_request_id: string
          p_message: string
          p_unit_price?: number
        }
        Returns: Json
      }
      supplier_active_plan: {
        Args: { p_supplier_id: string }
        Returns: {
          active: boolean
          ad_wallet_bonus_inr_cents: number
          created_at: string
          features: Json
          guarantee_eligible: boolean
          id: string
          max_listings: number | null
          name: string
          price_inr_cents_annual: number
          rank_boost_bps: number
          rfq_leads_per_week: number
          slug: string
          sort_order: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "listing_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      supplier_can_publish_listing: {
        Args: { p_supplier_id: string }
        Returns: boolean
      }
      supplier_is_guarantee_eligible: {
        Args: { p_supplier_id: string }
        Returns: boolean
      }
      supplier_plan_features: { Args: { p_supplier_id: string }; Returns: Json }
      supplier_rfq_leads_this_week: {
        Args: { p_supplier_id: string }
        Returns: number
      }
      supplier_video_slot_count: {
        Args: { p_supplier_id: string }
        Returns: number
      }
      toggle_buyer_favorite: {
        Args: { p_kind: string; p_product_id?: string; p_supplier_id: string }
        Returns: Json
      }
      update_order_status: {
        Args: { p_note?: string; p_order_id: string; p_to_status: string }
        Returns: Json
      }
      validate_supplier_commission: {
        Args: {
          p_actor_id: string
          p_below_min_approved: boolean
          p_rate_bps: number
        }
        Returns: boolean
      }
      verify_phone_otp: {
        Args: { p_code: string; p_phone: string; p_purpose: string }
        Returns: Json
      }
    }
    Enums: {
      ad_billing_model: "cpc" | "cpm" | "sponsorship"
      ad_campaign_status: "draft" | "active" | "paused" | "ended" | "rejected"
      ad_invoice_type:
        | "wallet_receipt"
        | "spend_statement"
        | "service_invoice"
        | "credit_note"
      ad_wallet_tx_type:
        | "top_up"
        | "cpc_charge"
        | "cpm_charge"
        | "sponsorship_charge"
        | "ops_credit"
        | "refund"
      gallery_media_type:
        | "factory"
        | "showroom"
        | "warehouse"
        | "team"
        | "certificate"
      listing_status: "draft" | "published" | "archived"
      media_review_status:
        | "pending"
        | "approved"
        | "rejected"
        | "flagged"
        | "archived"
      staff_role: "super_admin" | "admin" | "manager" | "viewer"
      supplier_business_type: "manufacturer" | "trader" | "both"
      user_role: "buyer" | "seller" | "admin"
      verification_tier: "none" | "basic" | "verified" | "gold" | "assessed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
    Enums: {
      ad_billing_model: ["cpc", "cpm", "sponsorship"],
      ad_campaign_status: ["draft", "active", "paused", "ended", "rejected"],
      ad_invoice_type: [
        "wallet_receipt",
        "spend_statement",
        "service_invoice",
        "credit_note",
      ],
      ad_wallet_tx_type: [
        "top_up",
        "cpc_charge",
        "cpm_charge",
        "sponsorship_charge",
        "ops_credit",
        "refund",
      ],
      gallery_media_type: [
        "factory",
        "showroom",
        "warehouse",
        "team",
        "certificate",
      ],
      listing_status: ["draft", "published", "archived"],
      media_review_status: [
        "pending",
        "approved",
        "rejected",
        "flagged",
        "archived",
      ],
      staff_role: ["super_admin", "admin", "manager", "viewer"],
      supplier_business_type: ["manufacturer", "trader", "both"],
      user_role: ["buyer", "seller", "admin"],
      verification_tier: ["none", "basic", "verified", "gold", "assessed"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

