import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { matchCareers } from '@/lib/career-matching'
import type { AssessmentUserData, ChatMessage } from '@/types'

const SYSTEM_PROMPT = `You are a warm, empathetic career counselor for "Plan B to Z" — a platform helping ex-government exam aspirants (UPSC, SSC, State PSC) in India transition to fulfilling alternative careers.

Your job is to conduct a career assessment through a natural conversation. You must collect the following information one question at a time, in a warm conversational tone:

1. Full name
2. Highest educational qualification (B.A., B.Sc., B.Tech., M.A., M.Sc., MBA, Law, Other)
3. UPSC optional subject (or "N/A" if they didn't take UPSC)
4. Number of exam attempts
5. Highest stage reached (Prelims, Mains, Interview, None)
6. What kind of work excites them (Research & Analysis, People & Communication, Technology & Data, Policy & Governance, Business & Strategy, Creative & Content, Teaching & Training, Social Impact)
7. Skills they've developed during preparation
8. What matters most in a career (Salary, Impact, Work-Life Balance, Growth Speed, Stability, Creative Freedom)
9. Any constraints (location, financial, family responsibilities)

Rules:
- Ask ONE question at a time
- Be warm, never condescending
- Use their name after they share it
- Acknowledge their journey positively — never call it failure
- Keep responses brief (2-3 sentences max per message)
- After collecting all info, say "I've got a great picture of your profile! Let me analyze the best career paths for you..." and include the marker [ASSESSMENT_COMPLETE] at the end of your message along with a JSON summary of all collected data in the format: [USER_DATA]{"name":"...","education":"...","optional":"...","attempts":N,"stage":"...","interests":[...],"skills":[...],"priorities":[...],"constraints":"..."}[/USER_DATA]`

export async function POST(request: Request) {
  try {
    const { messages, userId } = await request.json() as { messages: ChatMessage[]; userId: string }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    // Gemini requires history to start with a 'user' message — drop leading model messages
    const priorMessages = messages.slice(0, -1)
    const firstUserIdx = priorMessages.findIndex((m) => m.role === 'user')
    const history = (firstUserIdx === -1 ? [] : priorMessages.slice(firstUserIdx)).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({ history })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const responseText = result.response.text()

    // Check if assessment is complete
    if (responseText.includes('[ASSESSMENT_COMPLETE]')) {
      const userDataMatch = responseText.match(/\[USER_DATA\]([\s\S]*?)\[\/USER_DATA\]/)

      if (userDataMatch && userId) {
        try {
          const userData: AssessmentUserData = JSON.parse(userDataMatch[1])
          const supabase = await createClient()

          // Update profile
          await supabase.from('profiles').update({
            full_name: userData.name,
            education: userData.education,
            optional_subject: userData.optional,
            attempts: userData.attempts,
            stage_reached: userData.stage,
            interests: userData.interests,
            skills: userData.skills,
            priorities: userData.priorities,
            assessment_completed: true,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)

          // Fetch career paths and match
          const { data: careerPaths } = await supabase
            .from('career_paths')
            .select('*')
            .eq('is_active', true)

          const careerMatches = matchCareers(userData, careerPaths || [])

          // Save matches
          if (careerMatches.length > 0) {
            const matchInserts = careerMatches.map((m) => ({
              user_id: userId,
              career_path_id: m.career_path_id,
              match_percentage: m.match_percentage,
            }))

            await supabase
              .from('user_career_matches')
              .upsert(matchInserts, { onConflict: 'user_id,career_path_id' })
          }

          // Save conversation
          await supabase.from('assessment_conversations').upsert({
            user_id: userId,
            messages: messages,
            completed: true,
            career_results: careerMatches.map((m) => ({
              career_path_id: m.career_path_id,
              match_percentage: m.match_percentage,
              reasoning: m.reasoning,
            })),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

          return NextResponse.json({
            message: responseText,
            assessmentComplete: true,
            careerMatches: careerMatches.slice(0, 10),
          })
        } catch (parseError) {
          console.error('Error parsing user data:', parseError)
        }
      }

      return NextResponse.json({ message: responseText, assessmentComplete: true })
    }

    return NextResponse.json({ message: responseText, assessmentComplete: false })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
