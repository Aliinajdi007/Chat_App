# Leb-AnonChat

> **Now ready for GitHub Codespaces!**
>
> **Quick Start in Codespaces:**
> 1. Click the green "Code" button on GitHub, then "Open with Codespaces".
> 2. Wait for the Codespace to build (Node.js 18, all dependencies auto-installed).
> 3. Run the app with `npm start` (or use the VS Code Run/Debug panel).
> 4. Open the forwarded port (3000) to access your chat app!

A secure, anonymous, hacking-themed 1-to-1 chat app for Lebanon. Built with Node.js, Express, Socket.io, Supabase, and a neon cyber UI. Now with full PWA support!
![WhatsApp Image 2025-07-16 at 1 50 54 PM](https://github.com/user-attachments/assets/b41d1dd5-32ed-4332-a425-14f07c688398)
![WhatsApp Image 2025-07-16 at 1 50 55 PM (1)](https://github.com/user-attachments/assets/57d0eaa5-9da7-4015-9fa2-68f9fe615d71)
![WhatsApp Image 2025-07-16 at 1 50 55 PM](https://github.com/user-attachments/assets/51563e5f-d632-425d-866f-41bcaca09fb0)

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack & Software Used](#tech-stack--software-used)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [PWA (Progressive Web App)](#pwa-progressive-web-app)
- [Security](#security)
- [Project Structure](#project-structure)
- [Customization](#customization)
- [License](#license)

---

## Overview
**Leb-AnonChat** is a modern, secure, and anonymous chat app designed for 1-to-1 direct messaging. It features a hacking/cyber neon theme, no personal data collection, and is optimized for both desktop and mobile. The app is a full PWA, installable and usable offline.

---

## Features
- Anonymous signup with short random user ID and password (no email, no PII)
- Secure authentication and password storage (Supabase Auth)
- 1-to-1 direct messaging (no global chat)
- Persistent previous chats list (per user, saved in browser)
- Copy your user ID with one click
- Hacking/cyber neon theme (dark mode, monospaced font, glowing effects)
- Responsive and mobile-friendly
- All chat data stored securely in Supabase
- No user data or messages are public
- PWA: Installable, works offline, home screen icon, standalone window

---

## Tech Stack & Software Used
- **Node.js** (JavaScript runtime)
- **Express** (web server framework)
- **Socket.io** (real-time communication)
- **Supabase** (Auth & Postgres database)
- **HTML5** (structure)
- **CSS3** (custom hacking/cyber theme, Flexbox/Grid)
- **Vanilla JavaScript** (frontend logic)
- **localStorage** (persistent DM list)
- **Fira Mono/Consolas/Monospace fonts** (hacker look)
- **PWA** (manifest, service worker, offline support)

---

## Setup & Installation

1. **Clone the repository**
   ```sh
   git clone <repo-url>
   cd chat app
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Configure Supabase**
   - Create a [Supabase](https://supabase.com/) project.
   - Enable **email signups** and **disable email confirmation** in Auth settings.
   - Create the `messages` table (see below).
   - Get your Supabase URL and anon key, and update them in `public/client.js`:
     ```js
     const SUPABASE_URL = 'https://your-project.supabase.co';
     const SUPABASE_ANON_KEY = 'your-anon-key';
     ```
4. **Start the server**
   ```sh
   npm start
   ```
5. **Open your browser**
   - Visit [http://localhost:3000](http://localhost:3000)

---

## Configuration

### Supabase Table (SQL)
Create the `messages` table in your Supabase SQL editor:
```sql
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  recipient_id text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc', now())
);
```
Enable Row Level Security (RLS) and add these policies:
```sql
alter table public.messages enable row level security;
create policy "Allow read to all authenticated users"
  on public.messages for select using (auth.role() = 'authenticated');
create policy "Allow insert to all authenticated users"
  on public.messages for insert with check (auth.role() = 'authenticated');
```

---

## Usage Guide

### Signup
- Click **Sign Up**.
- Enter a password (minimum 6 characters).
- You will receive a short random User ID. **Save this ID!**

### Login
- Click **Log In**.
- Enter your User ID and password.

### Chatting
- Enter another user's ID in the "Start DM" field to begin a chat.
- Your previous chats are saved and shown for easy switching.
- Click the **Copy** button to copy your own ID.
- All messages are private between you and your chat partner.

### Logout
- Click the **Logout** button (top right) to end your session.

---

## PWA (Progressive Web App)
- The app is installable on desktop and mobile.
- Click the browser's "Install" or "Add to Home Screen" option.
- Works offline for static assets and previously loaded chats.
- Custom icon and theme color for a native feel.

---

## Security
- **No personal info or email required**
- **Passwords are hashed and managed by Supabase**
- **Only sender and recipient can see their messages in the UI**
- **All chat data is private in Supabase**
- **No XSS, code injection, or file upload vulnerabilities**
- **No password reset (for maximum anonymity)**
- **No global chat, only 1-to-1 DMs**

---

## Project Structure
```
server.js            # Node/Express/Socket.io server
public/index.html    # Main chat UI
public/style.css     # Chat UI styles (hacking theme)
public/client.js     # Client-side JS (auth, chat, DM logic)
public/manifest.json # PWA manifest
public/service-worker.js # PWA service worker
public/icon-192.png  # PWA icon (192x192)
public/icon-512.png  # PWA icon (512x512)
package.json         # Project metadata & dependencies
.gitignore           # Ignore node_modules
```

---

## Customization
- **Logo/Icon:** Replace `public/icon-192.png` and `public/icon-512.png` with your own PNGs.
- **Theme:** Edit `public/style.css` for colors, fonts, and effects.
- **App Name:** Change in `index.html`, `manifest.json`, and `.app-logo`.
- **Supabase:** You can use your own Supabase project and database.
- **Add Features:** End-to-end encryption, notifications, group chat, etc.

---

## License
MIT 
