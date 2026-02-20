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
    group_id?: string | null;
    assigned_to?: string | null;
}

export interface UserProfile {
    id: string;
    line_user_id: string;
    tier: 'free' | 'pro';
    display_name?: string | null;
    picture_url?: string | null;
    tutorial_step?: number;
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        language?: 'th' | 'en';
        notifications?: boolean;
        timezone?: string;
        reminder_lead_time?: number;
        briefing_daily_enabled?: boolean;
        briefing_daily_time?: string;
        briefing_weekly_enabled?: boolean;
        briefing_weekly_time?: string;
        briefing_monthly_enabled?: boolean;
        briefing_monthly_time?: string;
        [key: string]: any;
    };
    google_access_token?: string | null;
    google_refresh_token?: string | null;
    google_email?: string | null;
    google_calendar_last_sync?: string | null;
    points?: number;
    level?: number;
    current_group_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message?: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
    is_read: boolean;
    action_link?: string;
    created_at: string;
}
