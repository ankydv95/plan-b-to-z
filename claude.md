# AI Developer Context & Rules (claude.md)

## 1. Project Context
- **Name:** Plan B to Z
- **Purpose:** A launchpad and career pivot platform for ex-UPSC and State PSC aspirants.
- **Tone & Design:** Empathetic, premium, warm, utilizing a specific color palette (Earth tones, Oranges). *Always reference `brand.md` before making UI changes.*

## 2. Tech Stack
- **Framework:** Next.js 15 (App Router).
- **Language:** TypeScript (Strict typing enforced).
- **Styling:** Tailwind CSS v4.
- **Database/Auth:** Supabase (using `@supabase/ssr` for server-side rendering support).
- **AI Integration:** Google Generative AI (`@google/generative-ai`) for career assessment.
- **Icons:** `lucide-react`.

## 3. Architecture & Directory Structure
- `src/app/`: Next.js App Router pages, layouts, and API routes.
  - `(auth)/`: Grouped routes for login/signup.
  - `dashboard/`: Protected user areas.
  - `api/`: Route handlers.
- `src/components/`: Reusable UI components. Must be modular.
- `src/lib/`: Utility functions, Supabase client configurations, and Gemini prompts.
- `src/types/`: TypeScript interface definitions.

## 4. Coding Conventions & Best Practices

### A. Next.js App Router Rules
- Default to **Server Components** (`export default async function Page()`).
- Only use `'use client'` when strictly necessary (e.g., hooks, state management, event listeners like `onClick`).
- Use Next.js `Link` for internal navigation and `Image` for optimized images.

### B. Supabase Patterns
- Always use the `@supabase/ssr` package for server-side auth.
- Protect routes in `src/app/dashboard` using middleware or server-side session checks before rendering.
- Maintain Row Level Security (RLS) on all Supabase tables.

### C. TypeScript
- Avoid `any`. Define strict interfaces in `src/types/` for Database schemas, User profiles, and AI Assessment responses.

### D. Styling & Tailwind v4
- Rely on utility classes.
- Use CSS Variables defined in `src/app/globals.css` for fonts (`var(--font-lora)`, `var(--font-jetbrains-mono)`).
- Maintain responsiveness (`sm:`, `md:`, `lg:` prefixes). Mobile-first approach is mandatory.

### E. AI / Gemini Integration
- Assessment prompts should be heavily structured (JSON output preferred for parsing).
- Ensure error handling and graceful fallbacks if the Gemini API times out or fails.

## 5. Development Workflow
1. **Understand Goal:** Read the specific requirement. If it touches UI, consult `brand.md`.
2. **Think Small:** Write modular, single-responsibility functions and components.
3. **Handle Errors:** Wrap API calls in `try/catch` and use `DevErrorSuppressor` or Error Boundaries where applicable.
4. **No Destructive Operations:** Do not drop databases or delete major code blocks without explicit user permission.
