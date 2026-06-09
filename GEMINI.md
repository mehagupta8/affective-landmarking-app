# Affective Landmarking - Project Overview

"Affective Landmarking" is a collaborative classroom tool for literary analysis. It allows students to annotate texts with Rasa/Emotion labels and provides teachers with aggregated visualizations of the class's emotional response.

## Core Features

- **Teacher Management:**
  - Secure login/signup via Supabase Auth.
  - Create classes with auto-generated 6-character unique codes.
  - Upload literary texts with optional trigger warnings.
  - Track student enrollment.
- **Student Experience:**
  - Join classes using a simple code and identity verification (Name + optional PIN).
  - **Annotation UI:** Interactive text selection with a floating Rasa/Emotion palette. Supports overlapping highlights with semi-transparent blending.
  - Real-time auto-saving of annotations.
- **Visualizations (Plotly.js):**
  - **Student Spectrum:** Individual student analysis tracks.
  - **Consensus Spectrum:** Aggregated view with row-based luminosity to show the depth of collective agreement for each emotion across the text.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Atmospheric/Glassmorphism theme)
- **Database & Auth:** Supabase
- **Visualization:** Plotly.js / react-plotly.js
- **Icons:** Lucide React
- **React:** React 19

## Project Structure

```text
affective-landmarking/
├── src/app/
│   ├── page.tsx                  # Landing Page
│   ├── teacher/
│   │   ├── login/page.tsx        # Teacher Login
│   │   ├── signup/page.tsx       # Teacher Signup
│   │   ├── dashboard/page.tsx    # Class Management
│   │   └── class/[id]/
│   │       ├── page.tsx          # Class Details (Texts/Students)
│   │       └── text/[textId]/spectrum/page.tsx # Visualizations
│   ├── join/page.tsx             # Student Entry
│   └── annotate/[textId]/page.tsx # Core Annotation UI
├── components/
│   └── viz/                      # Plotly components
├── lib/
│   ├── supabase/                 # Browser/Server clients & Middleware
│   └── utils.ts                  # Shared utilities
├── supabase/
│   └── migrations/               # SQL schema and RLS policies
└── types/
    └── database.ts               # Shared TypeScript interfaces
```

## Running the Project

1.  **Environment Variables:** Ensure `.env.local` has your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2.  **Database:** Run the migration script in `supabase/migrations/00001_initial.sql` in your Supabase SQL Editor.
3.  **Install:** `npm install`
4.  **Dev:** `npm run dev`

## Rasa/Emotion Palette

- **fear:** #1a1a1a
- **joy:** #ffd700
- **anger:** #d32f2f
- **wonder:** #8e44ad
- **disgust:** #2e7d32
- **love:** #ec407a
- **heroism:** #ff8c00
- **sadness:** #607d8b
