# Product Requirements Document (PRD)

## 1. Project Overview
**Product Name:** Plan B to Z
**Mission:** To provide a judgment-free, structured, and highly actionable launchpad for ex-aspirants of UPSC and State PSC exams, helping them pivot their rigorous preparation skills into fulfilling modern careers.
**Current Stage:** MVP (Minimum Viable Product)
**Monetization Strategy:** 100% Free for the MVP phase.

## 2. Problem Statement
Annually, lakhs of bright, disciplined individuals invest 3–7 years preparing for UPSC and State PSC exams. When they do not clear the final hurdle, they face:
- **Zero Visibility:** No clear roadmap on where their uniquely built skills apply in the private sector.
- **Identity Crisis:** A deep sense of loss, feeling that their effort was "wasted."
- **Lack of Community:** Isolation from peers who successfully pivoted.

## 3. Target Audience
- **Primary:** Ex-UPSC Aspirants who have decided to move on after multiple attempts.
- **Secondary:** State PSC Aspirants looking for private-sector alternatives.
- **Psychographics:** Highly analytical, deeply knowledgeable, disciplined, but currently feeling lost, overwhelmed, and suffering from a crisis of confidence.

## 4. Value Proposition
*Your UPSC/PSC journey wasn't a dead end. It was a launchpad.* 
We map an aspirant's specific optional subjects and general studies prep to 75+ viable career paths using an empathetic AI Assessment tool, providing them with a 90-day actionable roadmap.

## 5. Core Features (MVP)
1. **AI Career Assessment (Powered by Google Gemini):**
   - Conversational AI (not a static quiz) that maps optional subjects, interests, and personality to real-world roles (e.g., PSIR optional to Public Policy Analyst).
2. **Career Pathways & Launchpads:**
   - 75+ curated careers with salary data, necessary upskilling, and a 90-day week-by-week action plan.
3. **"I Moved On" Wall (Stories):**
   - Real, verified success stories of former aspirants who are now thriving in alternate careers.
4. **Community & Mentorship Forum:**
   - A safe, potentially anonymous space to discuss transitions, ask questions, and network without judgment.
5. **Aspirant-Friendly Jobs Board:**
   - Curated list of companies and roles that actively value the analytical and administrative skills of civil service aspirants.
6. **Wellbeing Support:**
   - Resources and connections to verified therapists specializing in exam-related trauma and identity transitions.

## 6. Success Metrics (KPIs)
- **Primary MVP Goal:** 1,000 registered users.
- **Engagement Metric:** Number of AI Career Assessments completed (Target: 70% of registered users).
- **Retention Metric:** Return visitors within a 7-day window engaging with the Jobs board or Community.

## 7. Analytics & Tracking
- **Tool of Choice:** Mixpanel (Primary, taking advantage of their generous free tier for startups) or PostHog (Open-source alternative).
- **Key Events to Track:**
  - `User_Signed_Up`
  - `Assessment_Started`
  - `Assessment_Completed` (with metadata on suggested career path)
  - `Story_Read`
  - `Job_Viewed`

## 8. Future Scope (V2 & Beyond)
- 1-on-1 Mentorship booking system with ex-aspirants.
- Direct employer partnerships for exclusive hiring drives.
- Cohort-based upskilling programs integrated into the platform.
