'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, CareerMatchResult } from '@/types'
import { Send, Paperclip, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const INITIAL_MESSAGE: ChatMessage = {
  role: 'model',
  content: "Hello! I'm so glad you're here. 😊 I'm your career counselor at Plan B to Z. I know the UPSC journey is one of the most demanding paths anyone can take — and I want you to know that the skills you've built are genuinely remarkable.\n\nI'd love to help you discover career paths where those skills will be truly valued. Let's start with something simple — what's your name?",
}

const STORAGE_KEY = 'planbz_assessment'

export default function AssessmentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [assessmentDone, setAssessmentDone] = useState(false)
  const [careerMatches, setCareerMatches] = useState<CareerMatchResult[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Init: restore conversation from localStorage, get user, fallback to DB matches
  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const { messages: savedMsgs, careerMatches: savedMatches, done } = JSON.parse(saved)
          if (savedMsgs?.length > 1) {
            setMessages(savedMsgs)
            if (done) {
              setAssessmentDone(true)
              if (savedMatches?.length > 0) {
                setCareerMatches(savedMatches)
              } else if (user) {
                // Matches missing from localStorage — fetch from DB
                const { data: dbMatches } = await supabase
                  .from('user_career_matches')
                  .select('*, career_paths(*)')
                  .eq('user_id', user.id)
                  .order('match_percentage', { ascending: false })
                  .limit(10)
                if (dbMatches && dbMatches.length > 0) {
                  setCareerMatches(dbMatches.map(m => ({
                    career_path_id: m.career_path_id,
                    match_percentage: m.match_percentage,
                    reasoning: 'Strong alignment with your UPSC preparation background',
                    career: m.career_paths as CareerMatchResult['career'],
                  })))
                }
              }
            }
          }
        }
      } catch { /* ignore */ }
    }
    init()
  }, [])

  // Persist conversation to localStorage on every change
  useEffect(() => {
    if (messages.length > 1) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          messages,
          careerMatches,
          done: assessmentDone,
        }))
      } catch { /* ignore */ }
    }
  }, [messages, careerMatches, assessmentDone])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    if (!input.trim() || loading || assessmentDone) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/assessment/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, userId }),
      })

      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'model',
          content: "I'm sorry, I ran into a small issue. Could you repeat that?",
        }])
      } else {
        const cleanMessage = data.message
          .replace(/\[ASSESSMENT_COMPLETE\]/g, '')
          .replace(/\[USER_DATA\][\s\S]*?\[\/USER_DATA\]/g, '')
          .trim()

        setMessages(prev => [...prev, { role: 'model', content: cleanMessage }])

        if (data.assessmentComplete) {
          setAnalyzing(true)
          setTimeout(() => {
            setAnalyzing(false)
            setAssessmentDone(true)
            if (data.careerMatches) {
              setCareerMatches(data.careerMatches)
            }
          }, 2500)
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'model',
        content: "I'm sorry, something went wrong. Please try again.",
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const domainColors: Record<string, { bg: string; color: string }> = {
    'Policy': { bg: '#E0F2FE', color: '#0284C7' },
    'Law': { bg: '#EDE9FE', color: '#7C3AED' },
    'Education': { bg: '#DCFCE7', color: '#059669' },
    'Media': { bg: '#FEE2E2', color: '#E11D48' },
    'Management': { bg: '#FEF3C7', color: '#D97706' },
    'Banking': { bg: '#CCFBF1', color: '#0D9488' },
    'Finance': { bg: '#CCFBF1', color: '#0D9488' },
    'International': { bg: '#E0F2FE', color: '#0284C7' },
    'Data': { bg: '#EDE9FE', color: '#7C3AED' },
    'Social': { bg: '#DCFCE7', color: '#059669' },
    'Communication': { bg: '#FFEDD5', color: '#EA580C' },
    'Environment': { bg: '#DCFCE7', color: '#059669' },
    'Entrepreneurship': { bg: '#FEF3C7', color: '#D97706' },
    'Armed': { bg: '#FEE2E2', color: '#E11D48' },
    'Psychology': { bg: '#EDE9FE', color: '#7C3AED' },
    'Creative': { bg: '#FFEDD5', color: '#EA580C' },
  }

  function getDomainColor(domain: string) {
    const key = Object.keys(domainColors).find(k => domain.includes(k))
    return key ? domainColors[key] : { bg: '#FEF3C7', color: '#D97706' }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#e2e8f0] px-6 py-4 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>Career Assessment</h1>
          <p className="text-xs text-[#64748b]">A conversation to discover your path</p>
        </div>
        {assessmentDone && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[#059669] text-sm font-semibold">
              <CheckCircle2 size={18} />
              Assessment Complete
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY)
                setMessages([INITIAL_MESSAGE])
                setAssessmentDone(false)
                setCareerMatches([])
              }}
              className="text-xs text-[#64748b] hover:text-[#D97706] underline transition-colors"
            >
              Retake
            </button>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end chat-user' : 'justify-start chat-ai'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-[#D97706] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                AI
              </div>
            )}
            <div
              className={`max-w-[85%] md:max-w-[65%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#D97706] text-white rounded-tr-sm'
                  : 'bg-white border-2 border-[#e2e8f0] text-[#1e293b] rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                You
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 items-center chat-ai">
            <div className="w-8 h-8 rounded-full bg-[#D97706] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AI
            </div>
            <div className="bg-white border-2 border-[#e2e8f0] px-5 py-4 rounded-2xl rounded-tl-sm flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#64748b] typing-dot" />
              <div className="w-2 h-2 rounded-full bg-[#64748b] typing-dot" />
              <div className="w-2 h-2 rounded-full bg-[#64748b] typing-dot" />
            </div>
          </div>
        )}

        {/* Analyzing overlay */}
        {analyzing && (
          <div className="flex gap-3 chat-ai">
            <div className="w-8 h-8 rounded-full bg-[#D97706] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
              AI
            </div>
            <div className="bg-white border-2 border-[#e2e8f0] px-5 py-4 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#D97706] typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-[#D97706] typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-[#D97706] typing-dot" />
                </div>
                <span className="text-sm text-[#475569] font-semibold">Analyzing your profile...</span>
              </div>
            </div>
          </div>
        )}

        {/* Career Matches Results */}
        {assessmentDone && careerMatches.length > 0 && (
          <div className="chat-ai">
            <div className="ml-11 bg-white border-2 border-[#e2e8f0] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={20} className="text-[#059669]" />
                <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-lora)' }}>
                  Your Top Career Matches
                </h3>
              </div>
              <p className="text-sm text-[#64748b] mb-5">
                These paths value exactly what you&apos;ve built. They&apos;re now saved in your sidebar. Explore any to see the full picture.
              </p>
              <div className="space-y-3">
                {careerMatches.slice(0, 8).map((match, i) => {
                  const career = match.career
                  if (!career) return null
                  const { bg, color } = getDomainColor(career.domain)
                  return (
                    <Link
                      key={i}
                      href={`/dashboard/careers/${career.slug}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-[#e2e8f0] hover:border-[#D97706] hover:bg-[#FEF3C7]/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="tag flex-shrink-0" style={{ background: bg, color }}>
                          {career.domain.split(' ')[0]}
                        </span>
                        <span className="font-semibold text-sm truncate group-hover:text-[#D97706] transition-colors">
                          {career.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span
                          className="text-sm font-bold"
                          style={{
                            color: match.match_percentage >= 80 ? '#059669' : match.match_percentage >= 60 ? '#D97706' : '#64748b',
                            fontFamily: 'var(--font-jetbrains-mono)',
                          }}
                        >
                          {match.match_percentage}%
                        </span>
                        <ArrowRight size={14} className="text-[#64748b] group-hover:text-[#D97706]" />
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-5 pt-5 border-t border-[#e2e8f0] flex gap-3">
                <Link href="/dashboard/careers" className="btn-primary text-sm py-2.5 px-5">
                  Browse All Careers
                  <ArrowRight size={14} />
                </Link>
                <Link href="/dashboard" className="btn-secondary text-sm py-2.5 px-5">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {assessmentDone && careerMatches.length === 0 && (
          <div className="ml-11 bg-[#FEF3C7] border-2 border-[#D97706]/30 rounded-2xl p-6">
            <p className="font-semibold mb-2">Assessment complete!</p>
            <p className="text-sm text-[#475569] mb-4">
              We&apos;re loading career paths. Browse all 75+ paths to find your match.
            </p>
            <Link href="/dashboard/careers" className="btn-primary text-sm py-2.5 px-5 inline-flex">
              Browse Careers <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!assessmentDone && (
        <div className="border-t border-[#e2e8f0] bg-white px-4 md:px-8 py-4">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <div
              className="relative flex-1 cursor-not-allowed"
              title="Resume upload coming soon"
            >
              <button
                disabled
                className="p-2.5 rounded-xl text-[#64748b] border-2 border-[#e2e8f0] cursor-not-allowed opacity-50"
              >
                <Paperclip size={18} />
              </button>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-2xl px-4 py-2.5 focus-within:border-[#D97706] transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-sm text-[#1e293b] placeholder:text-[#64748b]"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-[#64748b] mt-2">
            Press Enter to send · Resume upload coming soon
          </p>
        </div>
      )}
    </div>
  )
}
