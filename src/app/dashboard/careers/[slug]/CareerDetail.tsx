'use client'

import React, { useState } from 'react'
import type { CareerPath, LaunchpadPhase, Resource, Mentor } from '@/types'
import {
  Star,
  TrendingUp,
  DollarSign,
  MapPin,
  CheckCircle2,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Briefcase,
  BookOpen,
  Users,
  Target,
  X,
  Send,
  Loader2,
  Globe,
  BookMarked,
  Newspaper,
  MessageCircle,
  Building2,
} from 'lucide-react'

interface JobListing {
  id: string
  company_name: string
  role_title: string
  location: string | null
  salary_range: string | null
  experience_level: string | null
  remote_available: boolean
  apply_url: string | null
  is_aspirant_friendly: boolean
}

interface Story {
  id: string
  person_name: string | null
  is_anonymous: boolean
  current_role: string | null
  company: string | null
  story_text: string | null
  num_attempts: number | null
  optional_subject: string | null
}

interface Props {
  career: CareerPath
  matchPercentage: number | null
  jobs: JobListing[]
  stories: Story[]
  userSkills: string[]
  mentors: Mentor[]
}

const TABS = [
  'Trajectory', 'Salary & Perks', 'Impact & Exposure',
  'Skills & Eligibility', '90-Day Launchpad', 'Mentors',
  'Jobs', 'Resources', 'Stories',
]

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

export default function CareerDetail({ career, matchPercentage, jobs, stories, userSkills, mentors }: Props) {
  const [activeTab, setActiveTab] = useState(0)
  const [openWeek, setOpenWeek] = useState<number | null>(0)
  const [openPhase, setOpenPhase] = useState<number | null>(0)
  const [openPhaseWeek, setOpenPhaseWeek] = useState<{ p: number; w: number } | null>(null)
  const [resourceStageFilter, setResourceStageFilter] = useState<string>('All')
  const [inquiryMentor, setInquiryMentor] = useState<Mentor | null>(null)
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', message: '' })
  const [inquirySending, setInquirySending] = useState(false)
  const [inquirySent, setInquirySent] = useState(false)
  const { bg, color } = getDomainColor(career.domain)
  const userSkillsLower = userSkills.map(s => s.toLowerCase())

  function hasSkill(skill: string) {
    return userSkillsLower.some(us => skill.toLowerCase().includes(us) || us.includes(skill.toLowerCase().split(' ')[0]))
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="tag" style={{ background: bg, color }}>{career.domain}</span>
          {matchPercentage !== null && (
            <span
              className="tag"
              style={{
                background: matchPercentage >= 80 ? '#DCFCE7' : '#FEF3C7',
                color: matchPercentage >= 80 ? '#059669' : '#D97706',
              }}
            >
              {matchPercentage}% match for you
            </span>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-lora)' }}>
          {career.title}
        </h1>
        <p className="text-lg text-[#5C4E3D] leading-relaxed max-w-3xl mb-6">{career.overview}</p>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 py-5 px-6 bg-white border-2 border-[#EDDFCC] rounded-2xl">
          {[
            { icon: DollarSign, label: 'Entry Salary', value: career.salary_entry ?? 'N/A' },
            { icon: TrendingUp, label: 'Growth Rate', value: career.growth_rate ?? 'High' },
            { icon: Star, label: 'Difficulty', value: '' },
            { icon: MapPin, label: 'Senior Salary', value: career.salary_senior ?? 'N/A' },
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                <Icon size={16} className="text-[#D97706]" />
              </div>
              <div>
                <div className="text-xs text-[#9A8B78] font-semibold">{label}</div>
                {label === 'Difficulty' ? (
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={12}
                        fill={j < (career.difficulty_rating ?? 3) ? '#D97706' : 'none'}
                        stroke={j < (career.difficulty_rating ?? 3) ? '#D97706' : '#EDDFCC'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="font-bold text-sm" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#EDDFCC] mb-8 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                activeTab === i
                  ? 'border-[#D97706] text-[#D97706]'
                  : 'border-transparent text-[#9A8B78] hover:text-[#5C4E3D]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}

      {/* Tab 0: Trajectory */}
      {activeTab === 0 && (
        <div className="relative pl-8">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#EDDFCC]" />
          {(career.trajectory || []).map((stage, i) => (
            <div key={i} className="relative mb-8">
              <div className="absolute -left-4 w-8 h-8 rounded-full bg-[#D97706] flex items-center justify-center text-white text-xs font-bold z-10">
                {i + 1}
              </div>
              <div className="card bg-white p-6 rounded-2xl ml-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-lora)' }}>{stage.title}</span>
                  <span className="tag bg-[#FEF3C7] text-[#D97706]">{stage.stage}</span>
                  <span className="text-sm text-[#9A8B78]">{stage.years} years</span>
                  <span className="font-bold text-sm text-[#059669]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{stage.salary}</span>
                </div>
                <ul className="space-y-1.5">
                  {(stage.responsibilities || []).map((r, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[#5C4E3D]">
                      <CheckCircle2 size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 1: Salary & Perks */}
      {activeTab === 1 && (
        <div>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Entry Level', value: career.salary_entry, sub: '0–2 years', color: '#9A8B78' },
              { label: 'Mid Level', value: career.salary_mid, sub: '3–7 years', color: '#D97706' },
              { label: 'Senior Level', value: career.salary_senior, sub: '8+ years', color: '#059669' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="card bg-white p-6 rounded-2xl text-center">
                <div className="text-sm text-[#9A8B78] font-semibold mb-2">{label}</div>
                <div className="text-3xl font-bold mb-1" style={{ color, fontFamily: 'var(--font-jetbrains-mono)' }}>{value ?? 'N/A'}</div>
                <div className="text-xs text-[#9A8B78]">{sub}</div>
              </div>
            ))}
          </div>
          {career.perks && career.perks.length > 0 && (
            <div className="card bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Common Perks</h3>
              <div className="flex flex-wrap gap-2">
                {career.perks.map((perk, i) => (
                  <span key={i} className="tag bg-[#FEF3C7] text-[#D97706] px-3 py-1.5">{perk}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Impact & Exposure */}
      {activeTab === 2 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card bg-white p-6 rounded-2xl">
            <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Impact You Can Create</h3>
            <p className="text-[#5C4E3D] leading-relaxed">{career.impact}</p>
          </div>
          <div className="card bg-white p-6 rounded-2xl">
            <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Exposure You Get</h3>
            <p className="text-[#5C4E3D] leading-relaxed">{career.exposure}</p>
          </div>
        </div>
      )}

      {/* Tab 3: Skills & Eligibility */}
      {activeTab === 3 && (
        <div className="space-y-6">
          <div className="card bg-white p-6 rounded-2xl">
            <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Eligibility</h3>
            <p className="text-[#5C4E3D] leading-relaxed">{career.eligibility}</p>
          </div>
          <div className="card bg-white p-6 rounded-2xl">
            <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Skills Needed</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {(career.skills_needed || []).map((skill, i) => {
                const has = userSkills.length > 0 && hasSkill(skill)
                return (
                  <span
                    key={i}
                    className="tag px-3 py-1.5 flex items-center gap-1"
                    style={{
                      background: has ? '#DCFCE7' : '#FEF3C7',
                      color: has ? '#059669' : '#D97706',
                    }}
                  >
                    {has ? <CheckCircle2 size={12} /> : <Zap size={12} />}
                    {skill}
                  </span>
                )
              })}
            </div>
            {userSkills.length > 0 && (
              <p className="text-xs text-[#9A8B78]">
                <span className="text-[#059669] font-semibold">✓ You have this</span> ·{' '}
                <span className="text-[#D97706] font-semibold">⚡ Build this</span>
              </p>
            )}
          </div>
          {career.upsc_skill_mapping && (
            <div className="card bg-[#FEF3C7] border-[#D97706]/30 p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
                How Your UPSC Prep Maps Here
              </h3>
              <p className="text-[#5C4E3D] leading-relaxed">{career.upsc_skill_mapping}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: 90-Day Launchpad */}
      {activeTab === 4 && (
        <div className="space-y-4">
          {career.estimated_cost && (
            <div className="flex items-center gap-3 bg-[#DCFCE7] text-[#059669] px-5 py-3 rounded-xl text-sm font-semibold mb-6">
              <DollarSign size={16} />
              Estimated cost: {career.estimated_cost}
            </div>
          )}

          {career.launchpad_phases && career.launchpad_phases.length > 0 ? (
            <div className="space-y-4">
              {(career.launchpad_phases as LaunchpadPhase[]).map((phase, pi) => (
                <div key={pi} className="card bg-white rounded-2xl overflow-hidden">
                  <button onClick={() => setOpenPhase(openPhase === pi ? null : pi)}
                    className="w-full flex items-center justify-between p-5 hover:bg-[#FDF6EC] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-[#D97706] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {phase.phase}
                      </span>
                      <div className="text-left">
                        <div className="font-bold" style={{ fontFamily: 'var(--font-lora)' }}>Phase {phase.phase}: {phase.phase_title}</div>
                        <div className="text-xs text-[#9A8B78]">{phase.weeks.length} weeks</div>
                      </div>
                    </div>
                    {openPhase === pi ? <ChevronUp size={18} className="text-[#9A8B78]" /> : <ChevronDown size={18} className="text-[#9A8B78]" />}
                  </button>

                  {openPhase === pi && (
                    <div className="border-t border-[#EDDFCC]">
                      {phase.phase_milestone && (
                        <div className="flex items-start gap-3 px-5 py-4 bg-[#FEF3C7]">
                          <Target size={16} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-[#D97706] mb-0.5 uppercase tracking-wide">Phase milestone</div>
                            <div className="text-sm text-[#5C4E3D] font-semibold">{phase.phase_milestone}</div>
                          </div>
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        {phase.weeks.map((week, wi) => (
                          <div key={wi} className="border border-[#EDDFCC] rounded-xl overflow-hidden">
                            <button
                              onClick={() => setOpenPhaseWeek(openPhaseWeek?.p === pi && openPhaseWeek?.w === wi ? null : { p: pi, w: wi })}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FEF9F0] transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold flex items-center justify-center">
                                  W{week.week}
                                </span>
                                <span className="font-semibold text-sm">{week.title}</span>
                                <span className="text-xs text-[#9A8B78]">{week.tasks.length} tasks</span>
                              </div>
                              {openPhaseWeek?.p === pi && openPhaseWeek?.w === wi
                                ? <ChevronUp size={14} className="text-[#9A8B78]" />
                                : <ChevronDown size={14} className="text-[#9A8B78]" />}
                            </button>
                            {openPhaseWeek?.p === pi && openPhaseWeek?.w === wi && (
                              <div className="px-4 pb-4 border-t border-[#EDDFCC]">
                                <ul className="space-y-2 mt-3">
                                  {week.tasks.map((task, ti) => (
                                    <li key={ti} className="flex items-start gap-2 text-sm text-[#5C4E3D]">
                                      <CheckCircle2 size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                                      <span>
                                        {task.resource_url ? (
                                          <a href={task.resource_url} target="_blank" rel="noopener noreferrer"
                                            className="hover:text-[#D97706] underline underline-offset-2">{task.task}</a>
                                        ) : task.task}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(career.launchpad_weeks || []).map((week, i) => (
                <div key={i} className="card bg-white rounded-2xl overflow-hidden">
                  <button onClick={() => setOpenWeek(openWeek === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 hover:bg-[#FDF6EC] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: '#D97706' }}>
                        {week.week}
                      </span>
                      <span className="font-semibold text-left" style={{ fontFamily: 'var(--font-lora)' }}>{week.title}</span>
                    </div>
                    {openWeek === i ? <ChevronUp size={18} className="text-[#9A8B78]" /> : <ChevronDown size={18} className="text-[#9A8B78]" />}
                  </button>
                  {openWeek === i && (
                    <div className="px-5 pb-5 border-t border-[#EDDFCC]">
                      <ul className="space-y-2 mt-4">
                        {(week.tasks || []).map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-[#5C4E3D]">
                            <CheckCircle2 size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {career.courses && career.courses.length > 0 && (
            <div className="card bg-white p-6 rounded-2xl mt-6">
              <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Recommended Courses</h3>
              <div className="space-y-3">
                {career.courses.map((course, i) => (
                  <a key={i} href={course.url || '#'} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl border-2 border-[#EDDFCC] hover:border-[#D97706] transition-colors group">
                    <div>
                      <div className="font-semibold group-hover:text-[#D97706] transition-colors">{course.name}</div>
                      <div className="text-xs text-[#9A8B78] mt-0.5">{course.provider} · {course.duration} · {course.cost}</div>
                    </div>
                    <ExternalLink size={16} className="text-[#9A8B78] flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {career.certifications && career.certifications.length > 0 && (
            <div className="card bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Key Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {career.certifications.map((cert, i) => (
                  <span key={i} className="tag bg-[#EDE9FE] text-[#7C3AED] px-3 py-1.5">{cert}</span>
                ))}
              </div>
            </div>
          )}

          {career.portfolio_projects && career.portfolio_projects.length > 0 && (
            <div className="card bg-white p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Portfolio Projects</h3>
              <ul className="space-y-2">
                {career.portfolio_projects.map((proj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5C4E3D]">
                    <Zap size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                    {proj}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Mentors */}
      {activeTab === 5 && (
        <div>
          {mentors.length === 0 ? (
            <div className="text-center py-16 card bg-white rounded-2xl">
              <Users size={40} className="text-[#EDDFCC] mx-auto mb-4" />
              <p className="font-semibold text-lg mb-2">Mentors coming soon</p>
              <p className="text-[#9A8B78] text-sm">We&apos;re building a mentor network for this path. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#9A8B78] mb-6">These mentors have walked this path. Reach out — they&apos;ve agreed to help.</p>
              {mentors.map((mentor) => (
                <div key={mentor.id} className="card bg-white p-6 rounded-2xl flex flex-col md:flex-row gap-5">
                  <div className="flex-shrink-0">
                    {mentor.photo_url ? (
                      <img src={mentor.photo_url} alt={mentor.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] text-2xl font-bold">
                        {mentor.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-lora)' }}>{mentor.name}</h3>
                        <p className="text-[#5C4E3D]">{mentor.role}{mentor.company && ` · ${mentor.company}`}</p>
                      </div>
                      {mentor.linkedin_url && (
                        <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-[#0284C7] hover:underline">
                          <Globe size={12} /> LinkedIn
                        </a>
                      )}
                    </div>
                    {mentor.upsc_background && (
                      <span className="tag bg-[#FEF3C7] text-[#D97706] text-xs mb-3 inline-block">
                        UPSC: {mentor.upsc_background}
                      </span>
                    )}
                    {mentor.bio && <p className="text-sm text-[#5C4E3D] mb-4 leading-relaxed">{mentor.bio}</p>}
                    <button
                      onClick={() => { setInquiryMentor(mentor); setInquirySent(false); setInquiryForm({ name: '', email: '', message: '' }) }}
                      className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
                    >
                      <MessageCircle size={14} /> Book a call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Jobs */}
      {activeTab === 6 && (
        <div>
          {jobs.length === 0 ? (
            <div className="text-center py-16 card bg-white rounded-2xl">
              <Briefcase size={40} className="text-[#EDDFCC] mx-auto mb-4" />
              <p className="font-semibold text-lg mb-2">No listings yet</p>
              <p className="text-[#9A8B78] text-sm">We&apos;re building partnerships with employers. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="card bg-white p-6 rounded-2xl">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-lora)' }}>{job.role_title}</h3>
                      <p className="text-[#5C4E3D]">{job.company_name}</p>
                    </div>
                    {job.is_aspirant_friendly && (
                      <span className="tag bg-[#DCFCE7] text-[#059669] flex-shrink-0">Aspirant Friendly</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[#9A8B78] mb-4">
                    {job.location && <span>📍 {job.location}</span>}
                    {job.salary_range && <span>💰 {job.salary_range}</span>}
                    {job.remote_available && <span>🌐 Remote Available</span>}
                    {job.experience_level && <span>📊 {job.experience_level}</span>}
                  </div>
                  {job.apply_url && (
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-2 px-5 inline-flex">
                      Apply Now <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Resources */}
      {activeTab === 7 && (
        <div className="space-y-8">
          {career.resources && career.resources.length > 0 ? (
            <>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map(stage => (
                  <button key={stage} onClick={() => setResourceStageFilter(stage)}
                    className={`tag px-4 py-2 cursor-pointer transition-all text-sm font-semibold ${
                      resourceStageFilter === stage
                        ? 'bg-[#D97706] text-white'
                        : 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#D97706] hover:text-white'
                    }`}>
                    {stage}
                  </button>
                ))}
              </div>

              {(['YouTube Channels', 'Podcasts', 'Free Courses', 'Books', 'Newsletters', 'Communities', 'Government Portals'] as const).map(category => {
                const stageBadgeStyle: Record<string, { bg: string; color: string }> = {
                  'Beginner': { bg: '#DCFCE7', color: '#059669' },
                  'Intermediate': { bg: '#FEF3C7', color: '#D97706' },
                  'Advanced': { bg: '#EDE9FE', color: '#7C3AED' },
                }
                const categoryResources = (career.resources as Resource[]).filter(r =>
                  r.category === category &&
                  (resourceStageFilter === 'All' || r.stage === resourceStageFilter)
                )
                if (categoryResources.length === 0) return null

                const categoryIcons: Record<string, React.ReactNode> = {
                  'YouTube Channels': <Play size={16} className="text-[#E11D48]" />,
                  'Podcasts': <span className="text-base">🎙️</span>,
                  'Free Courses': <BookOpen size={16} className="text-[#7C3AED]" />,
                  'Books': <BookMarked size={16} className="text-[#0284C7]" />,
                  'Newsletters': <Newspaper size={16} className="text-[#059669]" />,
                  'Communities': <Users size={16} className="text-[#D97706]" />,
                  'Government Portals': <Building2 size={16} className="text-[#5C4E3D]" />,
                }

                return (
                  <div key={category}>
                    <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>{category}</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {categoryResources.map((resource, i) => (
                        <a key={i} href={resource.url || '#'} target={resource.url ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className={`card bg-white p-4 rounded-xl flex gap-3 group border-2 border-[#EDDFCC] transition-colors ${resource.url ? 'hover:border-[#D97706]' : 'cursor-default'}`}>
                          <div className="w-9 h-9 rounded-xl bg-[#FDF6EC] flex items-center justify-center flex-shrink-0">
                            {categoryIcons[category]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-semibold text-sm group-hover:text-[#D97706] transition-colors leading-snug">
                                {resource.title}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: stageBadgeStyle[resource.stage]?.bg ?? '#FEF3C7',
                                  color: stageBadgeStyle[resource.stage]?.color ?? '#D97706',
                                }}>
                                {resource.stage}
                              </span>
                            </div>
                            {resource.provider && (
                              <div className="text-xs text-[#9A8B78] mb-1">{resource.provider}</div>
                            )}
                            <p className="text-xs text-[#5C4E3D] leading-relaxed">{resource.annotation}</p>
                          </div>
                          {resource.url && <ExternalLink size={14} className="text-[#9A8B78] flex-shrink-0 mt-0.5" />}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="space-y-6">
              {career.youtube_links && career.youtube_links.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>YouTube Resources</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {career.youtube_links.map((yt, i) => (
                      <a key={i} href={yt.url} target="_blank" rel="noopener noreferrer"
                        className="card bg-white p-4 rounded-xl flex items-start gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                          <Play size={18} className="text-[#E11D48]" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm group-hover:text-[#D97706] transition-colors">{yt.title}</div>
                          <div className="text-xs text-[#9A8B78] mt-0.5">{yt.channel}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {career.podcast_links && career.podcast_links.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Podcasts</h3>
                  <div className="space-y-3">
                    {career.podcast_links.map((pod, i) => (
                      <a key={i} href={pod.url} target="_blank" rel="noopener noreferrer"
                        className="card bg-white p-4 rounded-xl flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center flex-shrink-0">🎙️</div>
                        <div>
                          <div className="font-semibold text-sm group-hover:text-[#D97706] transition-colors">{pod.title}</div>
                          <div className="text-xs text-[#9A8B78]">{pod.host}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Stories */}
      {activeTab === 8 && (
        <div>
          {stories.length === 0 ? (
            <div className="text-center py-16 card bg-white rounded-2xl">
              <BookOpen size={40} className="text-[#EDDFCC] mx-auto mb-4" />
              <p className="font-semibold text-lg mb-2">No stories yet</p>
              <p className="text-[#9A8B78] text-sm">Be the first to share your transition story for this career path.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <div key={story.id} className="card bg-white p-6 rounded-2xl">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706] font-bold flex-shrink-0">
                      {story.is_anonymous ? '?' : (story.person_name?.[0] ?? '?')}
                    </div>
                    <div>
                      <div className="font-bold">{story.is_anonymous ? 'Anonymous' : story.person_name}</div>
                      <div className="text-sm text-[#9A8B78]">
                        {story.current_role}{story.company && ` at ${story.company}`}
                      </div>
                    </div>
                  </div>
                  <p className="text-[#5C4E3D] text-sm leading-relaxed">{story.story_text}</p>
                  {story.optional_subject && (
                    <div className="mt-3 flex gap-2 text-xs text-[#9A8B78]">
                      <span>Optional: {story.optional_subject}</span>
                      {story.num_attempts && <span>· {story.num_attempts} attempts</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mentor Inquiry Modal */}
      {inquiryMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold text-xl" style={{ fontFamily: 'var(--font-lora)' }}>
                  Book a call with {inquiryMentor.name}
                </h3>
                <p className="text-sm text-[#9A8B78] mt-0.5">{inquiryMentor.role}</p>
              </div>
              <button onClick={() => setInquiryMentor(null)} className="text-[#9A8B78] hover:text-[#2A1F14]">
                <X size={20} />
              </button>
            </div>

            {inquirySent ? (
              <div className="text-center py-8">
                <CheckCircle2 size={40} className="text-[#059669] mx-auto mb-3" />
                <p className="font-bold text-lg mb-1">Request sent!</p>
                <p className="text-sm text-[#9A8B78]">We&apos;ve received your request. Ankit will connect you within 48 hours.</p>
                <button onClick={() => setInquiryMentor(null)} className="btn-primary mt-5 text-sm py-2 px-6">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={async e => {
                e.preventDefault()
                setInquirySending(true)
                try {
                  const res = await fetch('/api/mentor-inquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      mentorName: inquiryMentor.name,
                      careerTitle: career.title,
                      senderName: inquiryForm.name,
                      senderEmail: inquiryForm.email,
                      message: inquiryForm.message,
                    }),
                  })
                  if (!res.ok) throw new Error()
                  setInquirySent(true)
                } finally {
                  setInquirySending(false)
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2A1F14] mb-1.5">Your name</label>
                  <input
                    required
                    value={inquiryForm.name}
                    onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D97706]"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2A1F14] mb-1.5">Your email</label>
                  <input
                    required
                    type="email"
                    value={inquiryForm.email}
                    onChange={e => setInquiryForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D97706]"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2A1F14] mb-1.5">What would you like to discuss?</label>
                  <textarea
                    required
                    rows={4}
                    value={inquiryForm.message}
                    onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D97706] resize-none"
                    placeholder="Brief intro about your background and what guidance you&apos;re looking for..."
                  />
                </div>
                <button type="submit" disabled={inquirySending}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {inquirySending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {inquirySending ? 'Sending…' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
