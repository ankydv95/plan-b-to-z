'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { CareerPath, TrajectoryStage, LaunchpadWeek, LaunchpadPhase, LaunchpadPhaseWeek, LaunchpadTask, Course, YoutubeLink, PodcastLink, Resource, Mentor } from '@/types'
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp, Save, Globe, Loader2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type FormData = Omit<CareerPath, 'created_at' | 'linkedin_groups'> & {
  status: 'draft' | 'published'
  linkedin_groups: { name: string; url: string }[] | null
}

const DOMAINS = [
  'Policy & Governance', 'Law & Legal', 'Education & Training', 'Media & Communication',
  'Management Consulting', 'Banking & Finance', 'International Relations', 'Data & Analytics',
  'Social Impact', 'Environment & Sustainability', 'Entrepreneurship', 'Armed Forces',
  'Psychology & Counselling', 'Creative Arts', 'Public Health', 'Technology',
]

const TABS = ['Basic', 'Trajectory', 'Salary & Perks', 'Impact', 'Skills', 'Launchpad', 'Resources', 'Mentors']

// ─── Helper components ────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#2A1F14] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#9A8B78] mt-1">{hint}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { onChange: (v: string) => void }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] bg-white focus:outline-none focus:border-[#D97706] transition-colors"
      {...rest}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 4 }: { value: string | null | undefined; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] bg-white focus:outline-none focus:border-[#D97706] transition-colors resize-none"
    />
  )
}

function StringList({ values, onChange, placeholder }: { values: string[] | null; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const list = values ?? []

  function add() {
    if (!draft.trim()) return
    onChange([...list, draft.trim()])
    setDraft('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
        {list.map((v, i) => (
          <span key={i} className="flex items-center gap-1 bg-[#FEF3C7] text-[#D97706] text-xs font-semibold px-3 py-1.5 rounded-full">
            {v}
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="hover:text-[#E11D48] ml-1">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Type and press Enter'}
          className="flex-1 border-2 border-[#EDDFCC] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#D97706] transition-colors"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-[#FEF3C7] text-[#D97706] rounded-xl text-sm font-semibold hover:bg-[#D97706] hover:text-white transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Tab components ───────────────────────────────────────────────────────────

function BasicTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  function generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Title *">
          <Input
            value={form.title}
            onChange={v => { set('title', v); if (!form.id) set('slug', generateSlug(v)) }}
            placeholder="e.g. Policy Analyst"
          />
        </Field>
        <Field label="Slug *" hint="URL-friendly identifier. Auto-generated from title.">
          <Input value={form.slug} onChange={v => set('slug', v)} placeholder="e.g. policy-analyst" />
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Domain *">
          <select
            value={form.domain ?? ''}
            onChange={e => set('domain', e.target.value)}
            className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] bg-white focus:outline-none focus:border-[#D97706]"
          >
            <option value="">Select domain…</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Difficulty Rating">
          <select
            value={form.difficulty_rating ?? ''}
            onChange={e => set('difficulty_rating', e.target.value ? Number(e.target.value) : null)}
            className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] bg-white focus:outline-none focus:border-[#D97706]"
          >
            <option value="">Select…</option>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>)}
          </select>
        </Field>
      </div>

      <Field label="Short Description" hint="Shown on the career cards in the browse page.">
        <Textarea value={form.description} onChange={v => set('description', v)} placeholder="One sentence about this career." rows={2} />
      </Field>

      <Field label="Overview" hint="Shown at the top of the career detail page.">
        <Textarea value={form.overview} onChange={v => set('overview', v)} placeholder="2–3 sentences that introduce this career compellingly." rows={4} />
      </Field>

      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Growth Rate">
          <Input value={form.growth_rate ?? ''} onChange={v => set('growth_rate', v)} placeholder="e.g. 15% annually or High" />
        </Field>
        <Field label="How to Apply" hint="Optional — entry path notes.">
          <Input value={form.how_to_apply ?? ''} onChange={v => set('how_to_apply', v)} placeholder="e.g. Apply via UPSC CSE, NGO portals..." />
        </Field>
      </div>
    </div>
  )
}

function TrajectoryTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const stages = form.trajectory ?? []
  const [open, setOpen] = useState<number | null>(0)

  function addStage() {
    set('trajectory', [...stages, { stage: 'Entry', title: '', years: '', salary: '', responsibilities: [] }])
    setOpen(stages.length)
  }

  function updateStage(i: number, key: keyof TrajectoryStage, value: unknown) {
    set('trajectory', stages.map((s, j) => j === i ? { ...s, [key]: value } : s))
  }

  function removeStage(i: number) {
    set('trajectory', stages.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={i} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FDF6EC] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#D97706] text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <span className="font-semibold text-sm">{stage.title || 'Untitled Stage'}</span>
              <span className="text-xs text-[#9A8B78]">{stage.stage} · {stage.years}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={e => { e.stopPropagation(); removeStage(i) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                <Trash2 size={14} />
              </button>
              {open === i ? <ChevronUp size={16} className="text-[#9A8B78]" /> : <ChevronDown size={16} className="text-[#9A8B78]" />}
            </div>
          </button>
          {open === i && (
            <div className="px-5 pb-5 border-t border-[#EDDFCC] space-y-4 pt-4">
              <div className="grid md:grid-cols-4 gap-3">
                <Field label="Stage">
                  <select
                    value={stage.stage}
                    onChange={e => updateStage(i, 'stage', e.target.value)}
                    className="w-full border-2 border-[#EDDFCC] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D97706]"
                  >
                    {['Entry', 'Mid', 'Senior', 'Expert', 'Leadership'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Title">
                  <Input value={stage.title} onChange={v => updateStage(i, 'title', v)} placeholder="Job title" />
                </Field>
                <Field label="Years">
                  <Input value={stage.years} onChange={v => updateStage(i, 'years', v)} placeholder="0-2" />
                </Field>
                <Field label="Salary">
                  <Input value={stage.salary} onChange={v => updateStage(i, 'salary', v)} placeholder="₹6-10 LPA" />
                </Field>
              </div>
              <Field label="Responsibilities">
                <StringList
                  values={stage.responsibilities}
                  onChange={v => updateStage(i, 'responsibilities', v)}
                  placeholder="Add a responsibility"
                />
              </Field>
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addStage}
        className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline"
      >
        <Plus size={16} /> Add Stage
      </button>
    </div>
  )
}

function SalaryTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-5">
        <Field label="Entry Salary (0-2 yrs)">
          <Input value={form.salary_entry ?? ''} onChange={v => set('salary_entry', v)} placeholder="₹6-10 LPA" />
        </Field>
        <Field label="Mid Salary (3-7 yrs)">
          <Input value={form.salary_mid ?? ''} onChange={v => set('salary_mid', v)} placeholder="₹12-20 LPA" />
        </Field>
        <Field label="Senior Salary (8+ yrs)">
          <Input value={form.salary_senior ?? ''} onChange={v => set('salary_senior', v)} placeholder="₹25-50 LPA" />
        </Field>
      </div>
      <Field label="Estimated Transition Cost">
        <Input value={form.estimated_cost ?? ''} onChange={v => set('estimated_cost', v)} placeholder="e.g. ₹10,000–50,000 for certifications" />
      </Field>
      <Field label="Common Perks">
        <StringList values={form.perks} onChange={v => set('perks', v)} placeholder="Add a perk" />
      </Field>
    </div>
  )
}

function ImpactTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <Field label="Impact You Can Create">
        <Textarea value={form.impact} onChange={v => set('impact', v)} placeholder="What societal or organizational impact can someone in this role create?" rows={5} />
      </Field>
      <Field label="Exposure You Get">
        <Textarea value={form.exposure} onChange={v => set('exposure', v)} placeholder="What networks, opportunities, and visibility does this career provide?" rows={5} />
      </Field>
    </div>
  )
}

function SkillsTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const weeks = form.launchpad_weeks ?? []

  return (
    <div className="space-y-5">
      <Field label="Eligibility">
        <Textarea value={form.eligibility} onChange={v => set('eligibility', v)} placeholder="What education/experience is required or preferred?" rows={3} />
      </Field>
      <Field label="Skills Needed">
        <StringList values={form.skills_needed} onChange={v => set('skills_needed', v)} placeholder="Add a skill" />
      </Field>
      <Field label="How UPSC Prep Maps Here" hint="Explain how their exam preparation skills transfer to this career.">
        <Textarea value={form.upsc_skill_mapping} onChange={v => set('upsc_skill_mapping', v)} placeholder="e.g. Analytical essay writing maps to policy brief writing..." rows={4} />
      </Field>
      <Field label="Key Certifications">
        <StringList values={form.certifications} onChange={v => set('certifications', v)} placeholder="Add a certification" />
      </Field>
      <Field label="Portfolio Projects">
        <StringList values={form.portfolio_projects} onChange={v => set('portfolio_projects', v)} placeholder="Add a project idea" />
      </Field>
    </div>
  )
}

function LaunchpadTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const phases = (form.launchpad_phases ?? []) as LaunchpadPhase[]
  const courses = form.courses ?? []
  const [openPhase, setOpenPhase] = useState<number | null>(0)
  const [openWeek, setOpenWeek] = useState<{ p: number; w: number } | null>(null)

  function addPhase() {
    const newPhase: LaunchpadPhase = {
      phase: phases.length + 1,
      phase_title: ['Foundation', 'Build', 'Apply'][phases.length] ?? `Phase ${phases.length + 1}`,
      phase_milestone: '',
      weeks: [],
    }
    set('launchpad_phases', [...phases, newPhase])
    setOpenPhase(phases.length)
  }

  function updatePhase(pi: number, key: keyof LaunchpadPhase, value: unknown) {
    set('launchpad_phases', phases.map((p, i) => i === pi ? { ...p, [key]: value } : p))
  }

  function removePhase(pi: number) {
    set('launchpad_phases', phases.filter((_, i) => i !== pi))
  }

  function addWeek(pi: number) {
    const updated = phases.map((p, i) => {
      if (i !== pi) return p
      const newWeek: LaunchpadPhaseWeek = { week: p.weeks.length + 1, title: '', tasks: [] }
      return { ...p, weeks: [...p.weeks, newWeek] }
    })
    set('launchpad_phases', updated)
    setOpenWeek({ p: pi, w: updated[pi].weeks.length - 1 })
  }

  function updateWeek(pi: number, wi: number, key: keyof LaunchpadPhaseWeek, value: unknown) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return { ...p, weeks: p.weeks.map((w, j) => j === wi ? { ...w, [key]: value } : w) }
    }))
  }

  function removeWeek(pi: number, wi: number) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return { ...p, weeks: p.weeks.filter((_, j) => j !== wi) }
    }))
  }

  function addTask(pi: number, wi: number) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return {
        ...p, weeks: p.weeks.map((w, j) => {
          if (j !== wi) return w
          return { ...w, tasks: [...w.tasks, { task: '', resource_url: '' }] }
        }),
      }
    }))
  }

  function updateTask(pi: number, wi: number, ti: number, key: keyof LaunchpadTask, value: string) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return {
        ...p, weeks: p.weeks.map((w, j) => {
          if (j !== wi) return w
          return { ...w, tasks: w.tasks.map((t, k) => k === ti ? { ...t, [key]: value } : t) }
        }),
      }
    }))
  }

  function removeTask(pi: number, wi: number, ti: number) {
    set('launchpad_phases', phases.map((p, i) => {
      if (i !== pi) return p
      return {
        ...p, weeks: p.weeks.map((w, j) => {
          if (j !== wi) return w
          return { ...w, tasks: w.tasks.filter((_, k) => k !== ti) }
        }),
      }
    }))
  }

  // Course handlers (unchanged from original)
  const [openCourse, setOpenCourse] = useState<number | null>(null)
  function addCourse() {
    set('courses', [...courses, { name: '', provider: '', url: '', cost: '', duration: '' }])
    setOpenCourse(courses.length)
  }
  function updateCourse(i: number, key: keyof Course, value: string) {
    set('courses', courses.map((c, j) => j === i ? { ...c, [key]: value } : c))
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-lora)' }}>90-Day Phases</h3>
          <span className="text-xs text-[#9A8B78]">Recommended: 3 phases — Foundation, Build, Apply</span>
        </div>
        <div className="space-y-3">
          {phases.map((phase, pi) => (
            <div key={pi} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
              {/* Phase header */}
              <button type="button" onClick={() => setOpenPhase(openPhase === pi ? null : pi)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FDF6EC] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#D97706] text-white text-xs font-bold flex items-center justify-center">{phase.phase}</span>
                  <span className="font-bold text-sm">{phase.phase_title || `Phase ${phase.phase}`}</span>
                  <span className="text-xs text-[#9A8B78]">{phase.weeks.length} week{phase.weeks.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={e => { e.stopPropagation(); removePhase(pi) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                    <Trash2 size={14} />
                  </button>
                  {openPhase === pi ? <ChevronUp size={16} className="text-[#9A8B78]" /> : <ChevronDown size={16} className="text-[#9A8B78]" />}
                </div>
              </button>

              {openPhase === pi && (
                <div className="px-5 pb-5 border-t border-[#EDDFCC] pt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Phase Title">
                      <Input value={phase.phase_title} onChange={v => updatePhase(pi, 'phase_title', v)} placeholder="e.g. Foundation" />
                    </Field>
                    <Field label="Phase Milestone" hint="What concrete outcome marks this phase complete?">
                      <Input value={phase.phase_milestone} onChange={v => updatePhase(pi, 'phase_milestone', v)} placeholder="e.g. Applied to 3 jobs, resume reviewed..." />
                    </Field>
                  </div>

                  {/* Weeks */}
                  <div>
                    <p className="text-xs font-semibold text-[#9A8B78] mb-2 uppercase tracking-wide">Weeks</p>
                    <div className="space-y-2">
                      {phase.weeks.map((week, wi) => (
                        <div key={wi} className="border border-[#EDDFCC] rounded-xl overflow-hidden">
                          <button type="button"
                            onClick={() => setOpenWeek(openWeek?.p === pi && openWeek?.w === wi ? null : { p: pi, w: wi })}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#FEF9F0] transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-bold flex items-center justify-center">{week.week}</span>
                              <span className="text-sm font-semibold">{week.title || 'Untitled Week'}</span>
                              <span className="text-xs text-[#9A8B78]">{week.tasks.length} task{week.tasks.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={e => { e.stopPropagation(); removeWeek(pi, wi) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                                <Trash2 size={13} />
                              </button>
                              {openWeek?.p === pi && openWeek?.w === wi
                                ? <ChevronUp size={14} className="text-[#9A8B78]" />
                                : <ChevronDown size={14} className="text-[#9A8B78]" />}
                            </div>
                          </button>

                          {openWeek?.p === pi && openWeek?.w === wi && (
                            <div className="px-4 pb-4 border-t border-[#EDDFCC] pt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <Field label="Week #">
                                  <Input type="number" value={String(week.week)} onChange={v => updateWeek(pi, wi, 'week', Number(v))} />
                                </Field>
                                <Field label="Week Theme">
                                  <Input value={week.title} onChange={v => updateWeek(pi, wi, 'title', v)} placeholder="e.g. Build Your Network" />
                                </Field>
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-[#9A8B78] mb-2">Tasks (be specific — no vague tasks)</p>
                                <div className="space-y-2">
                                  {week.tasks.map((task, ti) => (
                                    <div key={ti} className="flex gap-2">
                                      <div className="flex-1 space-y-1.5">
                                        <input
                                          value={task.task}
                                          onChange={e => updateTask(pi, wi, ti, 'task', e.target.value)}
                                          placeholder="Specific actionable task..."
                                          className="w-full border-2 border-[#EDDFCC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#D97706]"
                                        />
                                        <input
                                          value={task.resource_url ?? ''}
                                          onChange={e => updateTask(pi, wi, ti, 'resource_url', e.target.value)}
                                          placeholder="Resource URL (optional)"
                                          className="w-full border border-[#EDDFCC] rounded-lg px-3 py-1.5 text-xs text-[#9A8B78] focus:outline-none focus:border-[#D97706]"
                                        />
                                      </div>
                                      <button type="button" onClick={() => removeTask(pi, wi, ti)} className="text-[#9A8B78] hover:text-[#E11D48] p-1 flex-shrink-0 mt-1">
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <button type="button" onClick={() => addTask(pi, wi)} className="flex items-center gap-1 text-xs text-[#D97706] font-semibold hover:underline mt-2">
                                  <Plus size={12} /> Add Task
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => addWeek(pi)} className="flex items-center gap-1 text-xs text-[#D97706] font-semibold hover:underline mt-2">
                      <Plus size={12} /> Add Week
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addPhase} className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline mt-3">
          <Plus size={16} /> Add Phase
        </button>
      </div>

      {/* Courses — unchanged from original */}
      <div>
        <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'var(--font-lora)' }}>Recommended Courses</h3>
        <div className="space-y-2">
          {courses.map((course, i) => (
            <div key={i} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
              <button type="button" onClick={() => setOpenCourse(openCourse === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#FDF6EC] transition-colors">
                <span className="font-semibold text-sm">{course.name || 'Untitled Course'}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={e => { e.stopPropagation(); set('courses', courses.filter((_, j) => j !== i)) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                    <Trash2 size={14} />
                  </button>
                  {openCourse === i ? <ChevronUp size={16} className="text-[#9A8B78]" /> : <ChevronDown size={16} className="text-[#9A8B78]" />}
                </div>
              </button>
              {openCourse === i && (
                <div className="px-5 pb-4 border-t border-[#EDDFCC] pt-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Course Name"><Input value={course.name} onChange={v => updateCourse(i, 'name', v)} placeholder="Course name" /></Field>
                    <Field label="Provider"><Input value={course.provider} onChange={v => updateCourse(i, 'provider', v)} placeholder="Coursera, Udemy…" /></Field>
                    <Field label="URL"><Input value={course.url} onChange={v => updateCourse(i, 'url', v)} placeholder="https://…" /></Field>
                    <Field label="Cost"><Input value={course.cost} onChange={v => updateCourse(i, 'cost', v)} placeholder="Free or ₹X" /></Field>
                    <Field label="Duration"><Input value={course.duration} onChange={v => updateCourse(i, 'duration', v)} placeholder="6 weeks" /></Field>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addCourse} className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline mt-2">
          <Plus size={16} /> Add Course
        </button>
      </div>
    </div>
  )
}

const RESOURCE_CATEGORIES = [
  'YouTube Channels', 'Podcasts', 'Free Courses', 'Books',
  'Newsletters', 'Communities', 'Government Portals',
] as const

const RESOURCE_STAGES = ['Beginner', 'Intermediate', 'Advanced'] as const

function ResourcesTab({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const resources = (form.resources ?? []) as Resource[]
  const [openResource, setOpenResource] = useState<number | null>(null)

  function addResource() {
    const newResource: Resource = {
      category: 'YouTube Channels',
      title: '',
      url: '',
      annotation: '',
      stage: 'Beginner',
      provider: '',
    }
    set('resources', [...resources, newResource])
    setOpenResource(resources.length)
  }

  function updateResource(i: number, key: keyof Resource, value: string) {
    set('resources', resources.map((r, j) => j === i ? { ...r, [key]: value } : r))
  }

  function removeResource(i: number) {
    set('resources', resources.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#9A8B78]">
        Every resource needs an annotation explaining why it is useful for this career. Use AI Fill to generate a starting set.
      </p>
      <div className="space-y-2">
        {resources.map((resource, i) => (
          <div key={i} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
            <button type="button" onClick={() => setOpenResource(openResource === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#FDF6EC] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] flex-shrink-0">{resource.category.split(' ')[0]}</span>
                <span className="font-semibold text-sm truncate">{resource.title || 'Untitled Resource'}</span>
                <span className="text-xs text-[#9A8B78] flex-shrink-0">{resource.stage}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button type="button" onClick={e => { e.stopPropagation(); removeResource(i) }} className="text-[#9A8B78] hover:text-[#E11D48] p-1">
                  <Trash2 size={14} />
                </button>
                {openResource === i ? <ChevronUp size={16} className="text-[#9A8B78]" /> : <ChevronDown size={16} className="text-[#9A8B78]" />}
              </div>
            </button>
            {openResource === i && (
              <div className="px-5 pb-4 border-t border-[#EDDFCC] pt-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Category">
                    <select value={resource.category} onChange={e => updateResource(i, 'category', e.target.value)}
                      className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] bg-white focus:outline-none focus:border-[#D97706]">
                      {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Stage">
                    <select value={resource.stage} onChange={e => updateResource(i, 'stage', e.target.value)}
                      className="w-full border-2 border-[#EDDFCC] rounded-xl px-4 py-2.5 text-sm text-[#2A1F14] bg-white focus:outline-none focus:border-[#D97706]">
                      {RESOURCE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Title">
                  <Input value={resource.title} onChange={v => updateResource(i, 'title', v)} placeholder="Resource name" />
                </Field>
                <Field label="Provider / Channel" hint="Optional — e.g. PRS India, SWAYAM, Nitin Pai">
                  <Input value={resource.provider ?? ''} onChange={v => updateResource(i, 'provider', v)} placeholder="Organization or author" />
                </Field>
                <Field label="URL">
                  <Input value={resource.url} onChange={v => updateResource(i, 'url', v)} placeholder="https://…" />
                </Field>
                <Field label="Annotation *" hint="Why is this useful? What should the user do with it?">
                  <Textarea value={resource.annotation} onChange={v => updateResource(i, 'annotation', v)}
                    placeholder="e.g. Start here — best plain-language breakdown of Indian policy analysis. Watch the 'Policy 101' playlist first." rows={2} />
                </Field>
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addResource} className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline">
        <Plus size={16} /> Add Resource
      </button>
    </div>
  )
}

function MentorsTab({ careerId }: { careerId: string }) {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(false)
  const [openMentor, setOpenMentor] = useState<number | null>(null)
  const [savingIdx, setSavingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<Mentor>>({})
  const [addingNew, setAddingNew] = useState(false)

  useEffect(() => {
    if (!careerId) return
    setLoading(true)
    fetch(`/api/admin/mentors?careerId=${careerId}`)
      .then(r => r.json())
      .then(j => setMentors(j.data ?? []))
      .finally(() => setLoading(false))
  }, [careerId])

  async function saveMentor() {
    if (!draft.name?.trim() || !draft.role?.trim()) return
    setSavingIdx(-1)
    try {
      const res = await fetch('/api/admin/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career_id: careerId, ...draft }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMentors(prev => [...prev, json.data])
      setDraft({})
      setAddingNew(false)
    } finally {
      setSavingIdx(null)
    }
  }

  async function toggleActive(mentor: Mentor) {
    const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mentor, is_active: !mentor.is_active }),
    })
    const json = await res.json()
    if (res.ok) setMentors(prev => prev.map(m => m.id === mentor.id ? json.data : m))
  }

  async function deleteMentor(id: string) {
    if (!confirm('Delete this mentor?')) return
    const res = await fetch(`/api/admin/mentors/${id}`, { method: 'DELETE' })
    if (res.ok) setMentors(prev => prev.filter(m => m.id !== id))
  }

  if (!careerId) {
    return (
      <div className="text-center py-16 text-[#9A8B78]">
        <p className="font-semibold mb-1">Save the career first</p>
        <p className="text-sm">Mentors can be added after the career is saved.</p>
      </div>
    )
  }

  if (loading) return <div className="py-12 text-center text-[#9A8B78] text-sm">Loading mentors…</div>

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#9A8B78]">Mentors are added manually. They appear on the career detail page with a &quot;Book a call&quot; button.</p>

      {mentors.map((mentor, i) => (
        <div key={mentor.id} className="border-2 border-[#EDDFCC] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-sm text-[#9A8B78]">{mentor.role}{mentor.company && ` · ${mentor.company}`}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => toggleActive(mentor)}
                className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${mentor.is_active ? 'bg-[#DCFCE7] text-[#059669]' : 'bg-[#F5F5F5] text-[#9A8B78]'}`}>
                {mentor.is_active ? 'Active' : 'Inactive'}
              </button>
              <button type="button" onClick={() => setOpenMentor(openMentor === i ? null : i)} className="text-[#9A8B78] hover:text-[#D97706]">
                {openMentor === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button type="button" onClick={() => deleteMentor(mentor.id)} className="text-[#9A8B78] hover:text-[#E11D48]">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          {openMentor === i && (
            <div className="px-5 pb-5 border-t border-[#EDDFCC] pt-4 grid md:grid-cols-2 gap-3">
              <Field label="Name"><Input value={mentor.name} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, name: v } : m))} /></Field>
              <Field label="Current Role"><Input value={mentor.role} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, role: v } : m))} /></Field>
              <Field label="Company"><Input value={mentor.company ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, company: v } : m))} /></Field>
              <Field label="UPSC Background"><Input value={mentor.upsc_background ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, upsc_background: v } : m))} placeholder="e.g. 3 attempts, Mains cleared" /></Field>
              <Field label="LinkedIn URL"><Input value={mentor.linkedin_url ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, linkedin_url: v } : m))} /></Field>
              <Field label="Photo URL"><Input value={mentor.photo_url ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, photo_url: v } : m))} /></Field>
              <div className="md:col-span-2">
                <Field label="Bio" hint="1-2 sentences on how they help.">
                  <Textarea value={mentor.bio ?? ''} onChange={v => setMentors(prev => prev.map((m, j) => j === i ? { ...m, bio: v } : m))} rows={2} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <button type="button"
                  onClick={async () => {
                    setSavingIdx(i)
                    const res = await fetch(`/api/admin/mentors/${mentor.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(mentors[i]),
                    })
                    const json = await res.json()
                    if (res.ok) setMentors(prev => prev.map((m, j) => j === i ? json.data : m))
                    setSavingIdx(null)
                  }}
                  disabled={savingIdx === i}
                  className="px-4 py-2 bg-[#D97706] text-white rounded-xl text-sm font-semibold hover:bg-[#B45309] transition-colors disabled:opacity-50">
                  {savingIdx === i ? 'Saving…' : 'Save Mentor'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {addingNew ? (
        <div className="border-2 border-[#D97706] rounded-2xl p-5 space-y-3">
          <p className="font-semibold text-sm">New Mentor</p>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Name *"><Input value={draft.name ?? ''} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="Full name" /></Field>
            <Field label="Current Role *"><Input value={draft.role ?? ''} onChange={v => setDraft(d => ({ ...d, role: v }))} placeholder="e.g. Policy Analyst, World Bank" /></Field>
            <Field label="Company"><Input value={draft.company ?? ''} onChange={v => setDraft(d => ({ ...d, company: v }))} /></Field>
            <Field label="UPSC Background"><Input value={draft.upsc_background ?? ''} onChange={v => setDraft(d => ({ ...d, upsc_background: v }))} placeholder="e.g. 3 attempts, Mains cleared" /></Field>
            <Field label="LinkedIn URL"><Input value={draft.linkedin_url ?? ''} onChange={v => setDraft(d => ({ ...d, linkedin_url: v }))} /></Field>
            <Field label="Photo URL"><Input value={draft.photo_url ?? ''} onChange={v => setDraft(d => ({ ...d, photo_url: v }))} /></Field>
            <div className="md:col-span-2">
              <Field label="Bio" hint="1-2 sentences on how they help.">
                <Textarea value={draft.bio ?? ''} onChange={v => setDraft(d => ({ ...d, bio: v }))} rows={2} />
              </Field>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={saveMentor} disabled={savingIdx === -1}
              className="px-4 py-2 bg-[#D97706] text-white rounded-xl text-sm font-semibold hover:bg-[#B45309] disabled:opacity-50">
              {savingIdx === -1 ? 'Saving…' : 'Save Mentor'}
            </button>
            <button type="button" onClick={() => { setAddingNew(false); setDraft({}) }}
              className="px-4 py-2 border-2 border-[#EDDFCC] text-[#5C4E3D] rounded-xl text-sm font-semibold">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAddingNew(true)} className="flex items-center gap-2 text-sm text-[#D97706] font-semibold hover:underline">
          <Plus size={16} /> Add Mentor
        </button>
      )}
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────

const TAB_KEYS: Record<number, string> = {
  1: 'trajectory', 2: 'salary', 3: 'impact', 4: 'skills', 5: 'launchpad', 6: 'resources',
}

function emptyForm(): FormData {
  return {
    id: '',
    title: '',
    slug: '',
    domain: '',
    description: null,
    overview: null,
    trajectory: [],
    salary_entry: null,
    salary_mid: null,
    salary_senior: null,
    perks: [],
    impact: null,
    exposure: null,
    eligibility: null,
    skills_needed: [],
    upsc_skill_mapping: null,
    difficulty_rating: null,
    growth_rate: null,
    courses: [],
    certifications: [],
    portfolio_projects: [],
    launchpad_weeks: [],
    launchpad_phases: [],
    resources: [],
    estimated_cost: null,
    how_to_apply: null,
    youtube_links: [],
    podcast_links: [],
    linkedin_groups: [],
    professional_associations: [],
    is_active: false,
    status: 'draft',
  }
}

export default function CareerForm({ career }: { career: CareerPath | null }) {
  const router = useRouter()
  const isNew = !career

  const [form, setForm] = useState<FormData>(() => {
    if (!career) return emptyForm()
    return { ...career, status: (career as unknown as { status?: string }).status === 'published' ? 'published' : 'draft' }
  })

  const [activeTab, setActiveTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function set(key: keyof FormData, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function save(status: 'draft' | 'published') {
    if (!form.title.trim() || !form.slug.trim() || !form.domain) {
      showToast('Title, slug, and domain are required.', false)
      return
    }

    setSaving(true)
    try {
      const payload = { ...form, status }
      const url = isNew ? '/api/admin/careers' : `/api/admin/careers/${career!.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? 'Save failed')

      showToast(status === 'published' ? 'Published!' : 'Saved as draft.')
      if (isNew && json.data?.id) {
        router.push(`/admin/careers/${json.data.id}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', false)
    } finally {
      setSaving(false)
    }
  }

  async function generateWithAI() {
    if (!form.title.trim()) {
      showToast('Enter a career title first.', false)
      return
    }

    const tabKey = TAB_KEYS[activeTab]
    if (!tabKey) return

    setGenerating(true)
    try {
      const res = await fetch('/api/admin/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careerTitle: form.title, tab: tabKey }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Generation failed')

      setForm(prev => ({ ...prev, ...json.data }))
      showToast('AI content generated! Review and edit as needed.')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Generation failed', false)
    } finally {
      setGenerating(false)
    }
  }

  async function deleteCareer() {
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/careers/${career!.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin/careers')
    } catch {
      showToast('Delete failed', false)
      setSaving(false)
    }
  }

  const tabProps = { form, set }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
            {isNew ? 'New Career Path' : `Edit: ${career.title}`}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full capitalize"
              style={{
                background: form.status === 'published' ? '#DCFCE7' : '#FEF3C7',
                color: form.status === 'published' ? '#059669' : '#D97706',
              }}
            >
              {form.status}
            </span>
            {!isNew && (
              <a
                href={`/dashboard/careers/${form.slug}`}
                target="_blank"
                className="text-xs text-[#9A8B78] hover:text-[#D97706] flex items-center gap-1"
              >
                <Globe size={12} /> Preview
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {activeTab > 0 && (
            <button
              type="button"
              onClick={generateWithAI}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#D97706] text-[#D97706] rounded-xl text-sm font-semibold hover:bg-[#FEF3C7] transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              AI Fill Tab
            </button>
          )}
          <button
            type="button"
            onClick={() => save('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#EDDFCC] text-[#5C4E3D] rounded-xl text-sm font-semibold hover:border-[#D97706] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => save('published')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#D97706] text-white rounded-xl text-sm font-semibold hover:bg-[#B45309] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#EDDFCC] mb-8 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
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

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 0 && <BasicTab {...tabProps} />}
        {activeTab === 1 && <TrajectoryTab {...tabProps} />}
        {activeTab === 2 && <SalaryTab {...tabProps} />}
        {activeTab === 3 && <ImpactTab {...tabProps} />}
        {activeTab === 4 && <SkillsTab {...tabProps} />}
        {activeTab === 5 && <LaunchpadTab {...tabProps} />}
        {activeTab === 6 && <ResourcesTab {...tabProps} />}
        {activeTab === 7 && <MentorsTab careerId={form.id} />}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#EDDFCC]">
        {!isNew ? (
          <button
            type="button"
            onClick={deleteCareer}
            disabled={saving}
            className="text-sm text-[#9A8B78] hover:text-[#E11D48] font-semibold flex items-center gap-1"
          >
            <Trash2 size={14} /> Delete Career
          </button>
        ) : <div />}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => save('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#EDDFCC] text-[#5C4E3D] rounded-xl text-sm font-semibold hover:border-[#D97706] transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => save('published')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#D97706] text-white rounded-xl text-sm font-semibold hover:bg-[#B45309] transition-colors disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg z-50 transition-all ${
            toast.ok ? 'bg-[#059669]' : 'bg-[#E11D48]'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
