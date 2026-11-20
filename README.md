# Semester Exam Minutes of Meeting (MoM) PDF Generator

A configurable Next.js + Supabase web application for generating, storing, and sharing **Minutes of Meeting** A4 PDFs for semester examinations.

## Features

- **Seamless Invigilator Workflow (`/`)**:
  - Smart defaults for Date, Day, and remembered Invigilator Name/Email (`localStorage`).
  - Selecting an Exam **Room** (`RUANG 1 - AKHWAT` through `RUANG 11 - IKHWAN`) automatically loads that room's student roster, sets **Expected Number of Participants**, and provides a one-tap **Present / Absent** checklist that auto-calculates **Number of Present Participants**, **Number of Absent Participants**, and **Names of Absent Participants**.
  - Embeds the uploaded **Documentation** image (`PNG/JPG/WEBP`) and typed invigilator signature block directly into a crisp A4 PDF (`@react-pdf/renderer`) with ICM & Cambridge header logos.
  - Live PDF preview before saving to Supabase Storage.
- **Shared PDF Archive (`/submissions`)**:
  - Anyone can search and filter submitted MoM PDFs by Date, Room, Session, Subject, or Invigilator, preview inline, download, or copy share links.
  - Signed-in Admins can export filtered records to CSV or delete submissions.
- **Admin Configuration (`/admin`)**:
  - Protected by Supabase Auth.
  - Upload/replace **Left & Right Header Logos** and customize the PDF title, institution name, subtitle, and footer.
  - Add, edit, reorder, hide/show, or delete custom form inputs and options.
  - Manage exam rooms and student rosters (including bulk CSV import).

## Setup Instructions

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/fluffykitten/exammom.git
   cd exammom
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com):
   - Open **SQL Editor** in your Supabase Dashboard.
   - Paste the entire contents of `supabase/schema.sql` and run it. This creates all tables, RLS policies, public Storage buckets (`mom-assets`, `mom-docs`, `mom-pdfs`), and seeds the 19 form fields, 11 rooms, and 165 students.
   - Go to **Authentication -> Users -> Add user** and create an Admin email + password for `/admin`.

3. **Configure environment variables**:
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from **Project Settings -> API**.

4. **Run the app**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **PDF Generation**: `@react-pdf/renderer`
- **Backend / Storage / Auth**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
