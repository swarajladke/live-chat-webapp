# Live Chat App

A production-ready real-time 1:1 chat web application built with a modern tech stack.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Backend & Real-time**: Convex
- **Authentication**: Clerk
- **Styling**: Tailwind CSS, shadcn/ui

## Features Configured
1. **Authentication**: Handled via Clerk. Users data syncs with Convex on login.
2. **User List & Search**: Live search through registered users to start conversations.
3. **1-on-1 Direct Messaging**: Real-time DB sync using Convex.
4. **Message Timestamps**: Custom utility formatting. 
5. **Empty States**: Well-designed placeholders.
6. **Responsive Layout**: Desktop sidebar, mobile full-screen toggling.
7. **Online/Offline Status**: Tracked and displayed across users. 
8. **Typing Indicators**: Auto-clearing typing bubbles.
9. **Unread Badge**: Smart unread tracking.
10. **Smart Auto-Scroll**: Messages slide to view but pause if reading history.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local` and add your Clerk API keys, and set up your Convex project:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Initialize Convex
Run the following command to log in to Convex, initialize a project, and start the development server. This will generate the necessary types (`convex/_generated`) from the schema:
```bash
npx convex dev
```

### 4. Start the Application
In a separate terminal, run:
```bash
npm run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000).

---

## Folder Structure Highlights

- `app/page.tsx`: Main Chat Application layout with Auth boundaries.
- `components/ChatApp.tsx`: Manages conversation selection and user syncing logic.
- `components/chat/ChatArea.tsx`: Live chat feed, typing indicators, auto-scroll.
- `components/sidebar/Sidebar.tsx`: Handles conversations lists, user searching, and unread counts.
- `convex/schema.ts`: Scalable Database Schema optimized with indexes.
- `convex/` functions: Extensibile backend functions `users.ts`, `messages.ts`, `conversations.ts`.
- `lib/utils.ts`: Utility format functions.
