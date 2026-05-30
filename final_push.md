# Final Push & Launch Checklist

This document serves as the tactical roadmap to take the Plan B to Z MVP to a public audience, targeting the goal of **1,000 registered users**.

## Phase 1: Pre-Launch QA (T-Minus 7 Days)
- [ ] **Mobile Responsiveness:** Ensure the Assessment flow, Dashboard, and Landing Page render perfectly on iOS and Android browsers.
- [ ] **Supabase Security:** Double-check Row Level Security (RLS) policies. Users should only be able to read/write their own profile and assessment data.
- [ ] **AI Prompt Stress Test:** Test the Gemini AI assessment with edge-case inputs (e.g., gibberish, extremely short answers) to ensure graceful error handling.
- [ ] **Performance:** Run Lighthouse audits. Aim for >90 on Performance, Accessibility, Best Practices, and SEO.

## Phase 2: Analytics & SEO Setup (T-Minus 5 Days)
- [ ] **Analytics Integration:** Integrate Mixpanel (or PostHog) to track core funnels:
  - Landing Page View -> Sign Up Click -> Account Created.
  - Assessment Started -> Assessment Completed.
- [ ] **SEO & Metadata:**
  - Set up compelling `<title>` and `<meta name="description">` tags for the homepage.
  - Create Open Graph (OG) images (using brand orange and Lora font) for social sharing.

## Phase 3: Content & Community Seeding (T-Minus 3 Days)
- [ ] **Seed "I Moved On" Stories:** Populate the stories wall with 5-10 high-quality, authentic stories of ex-aspirants pivoting to tech, policy, management, etc.
- [ ] **Seed Jobs Board:** Manually add 15-20 active job listings that value analytical/administrative skills.

## Phase 4: The Go-To-Market (GTM) Launch
To hit the 1,000 user KPI without paid marketing, leverage organic communities where aspirants already exist.

1. **Reddit (`r/UPSC`, `r/India`):**
   - *Strategy:* Do not post an "ad." Post a vulnerable, empathetic story about the post-result trauma and introduce Plan B to Z as a free tool built specifically to solve this.
2. **Telegram Channels:**
   - *Strategy:* Partner with or post in popular study material groups. Pitch it as: "Done with this attempt? Find out exactly where your PSIR/Geography skills can get you hired."
3. **LinkedIn / Twitter (X):**
   - *Strategy:* Target civil servants, educators (e.g., popular coaching institute founders), and tech leaders, asking them to amplify the tool for the youth.

## Phase 5: Post-Launch Monitoring (Day 1 - 7)
- [ ] **Error Tracking:** Monitor Vercel logs / Supabase logs for failed AI requests or auth issues.
- [ ] **Feedback Loop:** Add a simple "Give Feedback" button in the dashboard to collect qualitative data from early users.
- [ ] **Check Mixpanel Drop-offs:** Identify where users are abandoning the AI assessment flow and optimize the UI.
