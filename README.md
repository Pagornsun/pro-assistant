# Kinn (ProAssistant) 🤖✨

**Kinn** is an advanced AI Personal Assistant integrated into LINE, designed to help users manage tasks, schedule meetings, and organize their lives through natural conversation. It features a modern LIFF Dashboard and a Subscription model using Stripe.

![Kinn Demo](https://placehold.co/1200x600/101522/ffffff?text=Kinn+ProAssistant)

## 🚀 Key Features

*   **🧠 Intelligent Chat**: Powered by **Google Gemini 2.0 Flash**, Kinn understands context, remembers conversation history, and can differentiate between general chat and task requests.
*   **✅ Task Management**: Create tasks simply by typing (e.g., *"Remind me to buy milk tomorrow"*). Tasks are synced to a real-time database.
*   **📱 LIFF Dashboard**: A beautiful, mobile-first web interface embedded in LINE for viewing tasks and managing settings.
*   **💳 Subscription System**: Integrated with **Stripe** for "Pro" plan upgrades, unlocking premium features.
*   **🔔 Smart Notifications**: Uses Flex Messages for rich, interactive confirmations.

## 🛠️ Tech Stack

*   **Frontend**: Lastest Next.js 15 (App Router), Tailwind CSS v4, Lucide Icons
*   **Backend**: Next.js Server Actions & API Routes
*   **Database**: Supabase (PostgreSQL)
*   **AI Model**: Google Gemini API
*   **Payment**: Stripe (Checkout & Webhooks)
*   **Messaging**: LINE Messaging API & LIFF

## ⚙️ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/pro-assistant.git
    cd pro-assistant
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env.local` file and add the keys from `.env.example`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    LINE_CHANNEL_ACCESS_TOKEN=...
    GEMINI_API_KEY=...
    STRIPE_SECRET_KEY=...
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 🧪 Testing

We use **Jest** for automated testing.

*   **Run Unit Tests**:
    ```bash
    npm test
    ```
*   **Manual UAT**: Refer to `uat_guide.md` for a comprehensive checklist.

## 📂 Documentation

*   [Deployment Guide](deployment_guide.md)
*   [User Manual](user_manual.md)
*   [Testing Strategy](testing_strategy.md)

---
© 2026 Kinn ProAssistant. All rights reserved.
