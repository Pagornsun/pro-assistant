export type TaskStatus = 'pending' | 'processing' | 'done' | 'completed' | 'cancelled' | 'pending_payment';

export interface Task {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    due_date?: string | null;
    created_at?: string;
    updated_at?: string;
    line_group_id?: string | null;
    bill_split_details?: Record<string, unknown> | null;
    is_reminded_1h?: boolean;
    is_reminded_24h?: boolean;
    tags?: string[];
    recurring_config?: { frequency: string; interval: number } | null;
}

export interface UserProfile {
    id: string;
    line_user_id: string;
    tier: 'free' | 'pro';
    tutorial_step?: number;
    preferences?: Record<string, unknown>;
    google_access_token?: string | null;
    google_refresh_token?: string | null;
    google_email?: string | null;
    google_calendar_last_sync?: string | null;
    created_at?: string;
    updated_at?: string;
}
