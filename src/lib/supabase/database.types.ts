export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cms_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          language: string
          published_at: string | null
          slug: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          language?: string
          published_at?: string | null
          slug: string
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          language?: string
          published_at?: string | null
          slug?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          location: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      finance_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: []
      }
      finance_donation_counters: {
        Row: {
          last_seq: number
          year: number
        }
        Insert: {
          last_seq?: number
          year: number
        }
        Update: {
          last_seq?: number
          year?: number
        }
        Relationships: []
      }
      finance_donations: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          district: string | null
          donation_no: string | null
          donor_district_snapshot: string | null
          donor_father_name_snapshot: string | null
          donor_member_id: string | null
          donor_member_no_snapshot: string | null
          donor_name: string
          donor_name_snapshot: string | null
          donor_phone: string | null
          donor_taluka_snapshot: string | null
          donor_user_id: string | null
          id: string
          notes: string | null
          payment_method: string
          purpose: string
          receipt_file_path: string | null
          receipt_no: string | null
          rejected_at: string | null
          rejected_by: string | null
          status: string
          taluka: string | null
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          donation_no?: string | null
          donor_district_snapshot?: string | null
          donor_father_name_snapshot?: string | null
          donor_member_id?: string | null
          donor_member_no_snapshot?: string | null
          donor_name: string
          donor_name_snapshot?: string | null
          donor_phone?: string | null
          donor_taluka_snapshot?: string | null
          donor_user_id?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          purpose: string
          receipt_file_path?: string | null
          receipt_no?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          taluka?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          donation_no?: string | null
          donor_district_snapshot?: string | null
          donor_father_name_snapshot?: string | null
          donor_member_id?: string | null
          donor_member_no_snapshot?: string | null
          donor_name?: string
          donor_name_snapshot?: string | null
          donor_phone?: string | null
          donor_taluka_snapshot?: string | null
          donor_user_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          purpose?: string
          receipt_file_path?: string | null
          receipt_no?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          taluka?: string | null
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_donations_donor_member_id_fkey"
            columns: ["donor_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          created_by: string | null
          district: string | null
          document_path: string | null
          expense_title: string
          id: string
          linked_application_id: string | null
          linked_program_key: Database["public"]["Enums"]["program_key"] | null
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          paid_to: string
          payment_method: string
          receipt_no: string | null
          rejected_at: string | null
          rejected_by: string | null
          status: string
          taluka: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          district?: string | null
          document_path?: string | null
          expense_title: string
          id?: string
          linked_application_id?: string | null
          linked_program_key?: Database["public"]["Enums"]["program_key"] | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          paid_to: string
          payment_method: string
          receipt_no?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          taluka?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          district?: string | null
          document_path?: string | null
          expense_title?: string
          id?: string
          linked_application_id?: string | null
          linked_program_key?: Database["public"]["Enums"]["program_key"] | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          paid_to?: string
          payment_method?: string
          receipt_no?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          taluka?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_expenses_linked_application_id_fkey"
            columns: ["linked_application_id"]
            isOneToOne: false
            referencedRelation: "program_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_path: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_counters: {
        Row: {
          last_seq: number
          year: number
        }
        Insert: {
          last_seq?: number
          year: number
        }
        Update: {
          last_seq?: number
          year?: number
        }
        Relationships: []
      }
      members: {
        Row: {
          address: string | null
          approved_at: string | null
          blood_group: string | null
          caste_branch: string | null
          cnic: string
          created_at: string
          date_of_birth: string | null
          declaration_accepted: boolean
          district: string
          education: string | null
          emergency_contact_mobile: string | null
          emergency_contact_name: string | null
          emergency_contact_relation: string | null
          father_name: string
          full_name: string
          gender: string | null
          id: string
          member_no: string | null
          mobile: string
          photo_url: string
          profession: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["member_status"]
          taluka: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          blood_group?: string | null
          caste_branch?: string | null
          cnic: string
          created_at?: string
          date_of_birth?: string | null
          declaration_accepted?: boolean
          district: string
          education?: string | null
          emergency_contact_mobile?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relation?: string | null
          father_name: string
          full_name: string
          gender?: string | null
          id?: string
          member_no?: string | null
          mobile: string
          photo_url: string
          profession?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          taluka?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          blood_group?: string | null
          caste_branch?: string | null
          cnic?: string
          created_at?: string
          date_of_birth?: string | null
          declaration_accepted?: boolean
          district?: string
          education?: string | null
          emergency_contact_mobile?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relation?: string | null
          father_name?: string
          full_name?: string
          gender?: string | null
          id?: string
          member_no?: string | null
          mobile?: string
          photo_url?: string
          profession?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          taluka?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          category: string
          content: string
          cover_image_path: string | null
          created_at: string
          created_by: string | null
          id: string
          is_featured: boolean
          published_at: string | null
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          content: string
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          content?: string
          cover_image_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_committee_members: {
        Row: {
          appointment_notes: string | null
          committee_id: string
          created_at: string
          created_by: string | null
          designation_id: string | null
          designation_title: string
          district_snapshot: string | null
          father_name_snapshot: string | null
          full_name_snapshot: string
          id: string
          member_id: string
          member_no_snapshot: string | null
          sort_order: number
          status: string
          taluka_snapshot: string | null
          tenure_end: string | null
          tenure_start: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          appointment_notes?: string | null
          committee_id: string
          created_at?: string
          created_by?: string | null
          designation_id?: string | null
          designation_title: string
          district_snapshot?: string | null
          father_name_snapshot?: string | null
          full_name_snapshot: string
          id?: string
          member_id: string
          member_no_snapshot?: string | null
          sort_order?: number
          status?: string
          taluka_snapshot?: string | null
          tenure_end?: string | null
          tenure_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          appointment_notes?: string | null
          committee_id?: string
          created_at?: string
          created_by?: string | null
          designation_id?: string | null
          designation_title?: string
          district_snapshot?: string | null
          father_name_snapshot?: string | null
          full_name_snapshot?: string
          id?: string
          member_id?: string
          member_no_snapshot?: string | null
          sort_order?: number
          status?: string
          taluka_snapshot?: string | null
          tenure_end?: string | null
          tenure_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_committee_members_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "organization_committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_committee_members_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "organization_designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_committee_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_committees: {
        Row: {
          committee_type: string
          created_at: string
          created_by: string | null
          district: string | null
          id: string
          name: string
          notes: string | null
          public_display: boolean
          status: string
          taluka: string | null
          tenure_end: string | null
          tenure_start: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          committee_type: string
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          name: string
          notes?: string | null
          public_display?: boolean
          status?: string
          taluka?: string | null
          tenure_end?: string | null
          tenure_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          committee_type?: string
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          name?: string
          notes?: string | null
          public_display?: boolean
          status?: string
          taluka?: string | null
          tenure_end?: string | null
          tenure_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      organization_designations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          scope: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          scope: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          scope?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      program_admin_assignments: {
        Row: {
          can_approve: boolean
          can_mark_completed: boolean
          can_review: boolean
          can_view: boolean
          created_at: string
          created_by: string | null
          district: string | null
          id: string
          program_key: Database["public"]["Enums"]["program_key"]
          taluka: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve?: boolean
          can_mark_completed?: boolean
          can_review?: boolean
          can_view?: boolean
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          program_key: Database["public"]["Enums"]["program_key"]
          taluka?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve?: boolean
          can_mark_completed?: boolean
          can_review?: boolean
          can_view?: boolean
          created_at?: string
          created_by?: string | null
          district?: string | null
          id?: string
          program_key?: Database["public"]["Enums"]["program_key"]
          taluka?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_application_counters: {
        Row: {
          last_seq: number
          program_key: Database["public"]["Enums"]["program_key"]
          updated_at: string
          year: number
        }
        Insert: {
          last_seq?: number
          program_key: Database["public"]["Enums"]["program_key"]
          updated_at?: string
          year: number
        }
        Update: {
          last_seq?: number
          program_key?: Database["public"]["Enums"]["program_key"]
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      program_applications: {
        Row: {
          address: string | null
          admin_remarks: string | null
          applicant_cnic: string | null
          applicant_name: string
          applicant_user_id: string
          application_no: string | null
          approved_amount: number | null
          approved_at: string | null
          assigned_admin_id: string | null
          completed_at: string | null
          created_at: string
          details: Json
          district: string | null
          email: string | null
          id: string
          member_id: string | null
          membership_no: string
          phone: string
          program_key: Database["public"]["Enums"]["program_key"]
          relationship_to_member: Database["public"]["Enums"]["member_relationship"]
          reviewed_at: string | null
          status: Database["public"]["Enums"]["program_application_status"]
          submitted_at: string
          taluka: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admin_remarks?: string | null
          applicant_cnic?: string | null
          applicant_name: string
          applicant_user_id: string
          application_no?: string | null
          approved_amount?: number | null
          approved_at?: string | null
          assigned_admin_id?: string | null
          completed_at?: string | null
          created_at?: string
          details?: Json
          district?: string | null
          email?: string | null
          id?: string
          member_id?: string | null
          membership_no: string
          phone: string
          program_key: Database["public"]["Enums"]["program_key"]
          relationship_to_member?: Database["public"]["Enums"]["member_relationship"]
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["program_application_status"]
          submitted_at?: string
          taluka?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admin_remarks?: string | null
          applicant_cnic?: string | null
          applicant_name?: string
          applicant_user_id?: string
          application_no?: string | null
          approved_amount?: number | null
          approved_at?: string | null
          assigned_admin_id?: string | null
          completed_at?: string | null
          created_at?: string
          details?: Json
          district?: string | null
          email?: string | null
          id?: string
          member_id?: string | null
          membership_no?: string
          phone?: string
          program_key?: Database["public"]["Enums"]["program_key"]
          relationship_to_member?: Database["public"]["Enums"]["member_relationship"]
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["program_application_status"]
          submitted_at?: string
          taluka?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_applications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      program_documents: {
        Row: {
          admin_note: string | null
          application_id: string
          created_at: string
          document_type: string
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          is_verified: boolean
          mime_type: string | null
          program_key: Database["public"]["Enums"]["program_key"]
          updated_at: string
          uploaded_by: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_note?: string | null
          application_id: string
          created_at?: string
          document_type: string
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_verified?: boolean
          mime_type?: string | null
          program_key: Database["public"]["Enums"]["program_key"]
          updated_at?: string
          uploaded_by: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_note?: string | null
          application_id?: string
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_verified?: boolean
          mime_type?: string | null
          program_key?: Database["public"]["Enums"]["program_key"]
          updated_at?: string
          uploaded_by?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "program_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_member: {
        Args: { _member_id: string; _reviewed_by?: string }
        Returns: {
          address: string | null
          approved_at: string | null
          blood_group: string | null
          caste_branch: string | null
          cnic: string
          created_at: string
          date_of_birth: string | null
          declaration_accepted: boolean
          district: string
          education: string | null
          emergency_contact_mobile: string | null
          emergency_contact_name: string | null
          emergency_contact_relation: string | null
          father_name: string
          full_name: string
          gender: string | null
          id: string
          member_no: string | null
          mobile: string
          photo_url: string
          profession: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["member_status"]
          taluka: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_notification: {
        Args: {
          _action_url?: string
          _category?: string
          _message: string
          _related_id?: string
          _related_type?: string
          _title: string
          _user_id: string
        }
        Returns: string
      }
      current_user_can_approve_program: {
        Args: {
          _district?: string
          _program_key: Database["public"]["Enums"]["program_key"]
          _taluka?: string
        }
        Returns: boolean
      }
      current_user_can_manage_cms: { Args: never; Returns: boolean }
      current_user_can_manage_finance: { Args: never; Returns: boolean }
      current_user_can_manage_organization: { Args: never; Returns: boolean }
      current_user_can_manage_program: {
        Args: {
          _district?: string
          _program_key: Database["public"]["Enums"]["program_key"]
          _taluka?: string
        }
        Returns: boolean
      }
      current_user_can_mark_completed_program: {
        Args: {
          _district?: string
          _program_key: Database["public"]["Enums"]["program_key"]
          _taluka?: string
        }
        Returns: boolean
      }
      current_user_can_review_program: {
        Args: {
          _district?: string
          _program_key: Database["public"]["Enums"]["program_key"]
          _taluka?: string
        }
        Returns: boolean
      }
      current_user_can_view_donor_leaderboard: { Args: never; Returns: boolean }
      current_user_can_view_program: {
        Args: {
          _district?: string
          _program_key: Database["public"]["Enums"]["program_key"]
          _taluka?: string
        }
        Returns: boolean
      }
      current_user_has_role: { Args: { _role: string }; Returns: boolean }
      current_user_is_approved_member: { Args: never; Returns: boolean }
      current_user_is_super_admin: { Args: never; Returns: boolean }
      get_donor_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          donation_count: number
          donor_district: string
          donor_father_name: string
          donor_member_id: string
          donor_member_no: string
          donor_name: string
          donor_taluka: string
          first_approved_at: string
          latest_approved_at: string
          purposes: string[]
          total_donated: number
        }[]
      }
      reject_member: {
        Args: {
          _member_id: string
          _rejection_reason: string
          _reviewed_by?: string
        }
        Returns: {
          address: string | null
          approved_at: string | null
          blood_group: string | null
          caste_branch: string | null
          cnic: string
          created_at: string
          date_of_birth: string | null
          declaration_accepted: boolean
          district: string
          education: string | null
          emergency_contact_mobile: string | null
          emergency_contact_name: string | null
          emergency_contact_relation: string | null
          father_name: string
          full_name: string
          gender: string | null
          id: string
          member_no: string | null
          mobile: string
          photo_url: string
          profession: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["member_status"]
          taluka: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      role_management_assign_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      role_management_remove_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      role_management_search_users: {
        Args: { _query?: string }
        Returns: {
          auth_created_at: string
          email: string
          member_full_name: string
          member_no: string
          member_status: string
          roles: string[]
          user_id: string
        }[]
      }
      verify_membership_no: { Args: { _membership_no: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "admin"
        | "super_admin"
        | "membership_admin"
        | "education_admin"
        | "health_admin"
        | "employment_admin"
        | "ration_admin"
        | "welfare_admin"
        | "finance_admin"
      member_relationship:
        | "self"
        | "son"
        | "daughter"
        | "father"
        | "mother"
        | "brother"
        | "sister"
        | "wife"
        | "husband"
        | "guardian"
        | "other"
      member_status: "pending" | "approved" | "rejected"
      program_application_status:
        | "submitted"
        | "under_review"
        | "need_more_info"
        | "approved"
        | "rejected"
        | "paid_completed"
        | "completed"
      program_key:
        | "membership"
        | "education"
        | "health"
        | "employment"
        | "ration"
        | "welfare"
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
    Enums: {
      app_role: [
        "admin",
        "super_admin",
        "membership_admin",
        "education_admin",
        "health_admin",
        "employment_admin",
        "ration_admin",
        "welfare_admin",
        "finance_admin",
      ],
      member_relationship: [
        "self",
        "son",
        "daughter",
        "father",
        "mother",
        "brother",
        "sister",
        "wife",
        "husband",
        "guardian",
        "other",
      ],
      member_status: ["pending", "approved", "rejected"],
      program_application_status: [
        "submitted",
        "under_review",
        "need_more_info",
        "approved",
        "rejected",
        "paid_completed",
        "completed",
      ],
      program_key: [
        "membership",
        "education",
        "health",
        "employment",
        "ration",
        "welfare",
      ],
    },
  },
} as const

