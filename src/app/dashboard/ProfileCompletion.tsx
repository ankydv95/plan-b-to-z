'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, ChevronRight, Check } from 'lucide-react'

interface Props {
  userId: string
  fullName: string | null
  education: string | null
  optionalSubject: string | null
  attempts: number | null
  stageReached: string | null
  interests: string[] | null
  skills: string[] | null
  priorities: string[] | null
  resumeUrl: string | null
  assessmentCompleted: boolean
}

const EDUCATION_OPTIONS = ['B.A.', 'B.Sc.', 'B.Tech.', 'B.Com.', 'M.A.', 'M.Sc.', 'MBA', 'M.Tech.', 'LLB / Law', 'Other']
const STAGE_OPTIONS = ['None (Prelims not cleared)', 'Prelims cleared', 'Mains cleared', 'Interview stage']
const INTEREST_OPTIONS = ['Research & Analysis', 'People & Communication', 'Technology & Data', 'Policy & Governance', 'Business & Strategy', 'Creative & Content', 'Teaching & Training', 'Social Impact']
const PRIORITY_OPTIONS = ['Salary', 'Impact', 'Work-Life Balance', 'Growth Speed', 'Stability', 'Creative Freedom']

function CircularProgress({ percentage }: { percentage: number }) {
  const r = 32
  const circ = 2 * Math.PI * r
  const filled = (percentage / 100) * circ
  const color = percentage >= 80 ? '#059669' : percentage >= 50 ? '#D97706' : '#EA580C'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="40" y="44" textAnchor="middle" fontSize="15" fontWeight="700" fill={color}>
        {percentage}%
      </text>
    </svg>
  )
}

function SkillInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  function add() {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setInput('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(s => (
          <span key={s} className="flex items-center gap-1 text-xs bg-[#FEF3C7] text-[#D97706] font-semibold px-2.5 py-1 rounded-full">
            {s}
            <button type="button" onClick={() => onChange(value.filter(x => x !== s))}><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Type a skill and press Enter"
          className="flex-1 border-2 border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D97706]"
        />
        <button type="button" onClick={add} className="px-4 py-2 bg-[#D97706] text-white rounded-xl text-sm font-semibold">Add</button>
      </div>
    </div>
  )
}

function MultiSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors border-2 ${
            value.includes(opt)
              ? 'bg-[#D97706] text-white border-[#D97706]'
              : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-[#D97706]'
          }`}
        >
          {value.includes(opt) && <Check size={11} />}
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function ProfileCompletion(props: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: props.fullName ?? '',
    education: props.education ?? '',
    optional_subject: props.optionalSubject ?? '',
    attempts: props.attempts ?? '',
    stage_reached: props.stageReached ?? '',
    interests: props.interests ?? [],
    skills: props.skills ?? [],
    priorities: props.priorities ?? [],
    resume_url: props.resumeUrl ?? '',
  })

  const steps = [
    !!form.full_name && !!form.education,
    !!form.optional_subject && !!form.attempts,
    form.interests.length > 0 && form.skills.length > 0,
    props.assessmentCompleted,
    !!form.resume_url,
  ]
  const completedCount = steps.filter(Boolean).length
  const percentage = Math.round((completedCount / steps.length) * 100)

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: err } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name || null,
          education: form.education || null,
          optional_subject: form.optional_subject || null,
          attempts: form.attempts ? Number(form.attempts) : null,
          stage_reached: form.stage_reached || null,
          interests: form.interests,
          skills: form.skills,
          priorities: form.priorities,
          resume_url: form.resume_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', props.userId)
      if (err) throw err
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 1200)
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (percentage === 100) return null

  return (
    <>
      {/* Compact widget */}
      <div className="bg-white border-2 border-[#e2e8f0] rounded-2xl p-5 mb-8 flex items-center gap-5">
        <CircularProgress percentage={percentage} />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg leading-tight mb-0.5" style={{ fontFamily: 'var(--font-lora)' }}>
            Complete Your Profile
          </h2>
          <p className="text-sm text-[#64748b]">
            {completedCount} of {steps.length} sections done · a complete profile gets better matches
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex-shrink-0"
        >
          Edit Profile <ChevronRight size={15} />
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e2e8f0]">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>Edit Profile</h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-[#F5EFE7] transition-colors">
                <X size={20} className="text-[#64748b]" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Basic info */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">Basic Info</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[#475569] mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full border-2 border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#475569] mb-1.5 block">Highest Education</label>
                    <select
                      value={form.education}
                      onChange={e => setForm(f => ({ ...f, education: e.target.value }))}
                      className="w-full border-2 border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D97706] bg-white"
                    >
                      <option value="">Select qualification</option>
                      {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* UPSC background */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">UPSC Background</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[#475569] mb-1.5 block">Optional Subject</label>
                    <input
                      type="text"
                      value={form.optional_subject}
                      onChange={e => setForm(f => ({ ...f, optional_subject: e.target.value }))}
                      placeholder="e.g. Economics"
                      className="w-full border-2 border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#475569] mb-1.5 block">Attempts</label>
                    <input
                      type="number"
                      min={1} max={10}
                      value={form.attempts}
                      onChange={e => setForm(f => ({ ...f, attempts: e.target.value }))}
                      placeholder="e.g. 3"
                      className="w-full border-2 border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#475569] mb-1.5 block">Highest Stage</label>
                    <select
                      value={form.stage_reached}
                      onChange={e => setForm(f => ({ ...f, stage_reached: e.target.value }))}
                      className="w-full border-2 border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D97706] bg-white"
                    >
                      <option value="">Select stage</option>
                      {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">Work Interests</h3>
                <MultiSelect
                  options={INTEREST_OPTIONS}
                  value={form.interests}
                  onChange={v => setForm(f => ({ ...f, interests: v }))}
                />
              </div>

              {/* Priorities */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">Career Priorities</h3>
                <MultiSelect
                  options={PRIORITY_OPTIONS}
                  value={form.priorities}
                  onChange={v => setForm(f => ({ ...f, priorities: v }))}
                />
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">Your Skills</h3>
                <SkillInput
                  value={form.skills}
                  onChange={v => setForm(f => ({ ...f, skills: v }))}
                />
              </div>

              {/* Resume */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748b] mb-3">Resume</h3>
                <input
                  type="url"
                  value={form.resume_url}
                  onChange={e => setForm(f => ({ ...f, resume_url: e.target.value }))}
                  placeholder="Paste link to your resume (Google Drive, Dropbox, etc.)"
                  className="w-full border-2 border-[#e2e8f0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#D97706]"
                />
                <p className="text-xs text-[#64748b] mt-1">Share a public link to your resume PDF.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between">
              {error && <p className="text-sm text-red-500">{error}</p>}
              {!error && <p className="text-sm text-[#64748b]">Profile completion: <strong className="text-[#D97706]">{percentage}%</strong></p>}
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => setOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#e2e8f0] text-[#475569] hover:border-[#D97706] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#D97706] hover:bg-[#B45309] text-white transition-colors disabled:opacity-70"
                >
                  {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
