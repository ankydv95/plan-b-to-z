import { Users } from 'lucide-react'

export default function CommunityPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#E0F2FE] flex items-center justify-center mx-auto mb-6">
        <Users size={36} className="text-[#0284C7]" />
      </div>
      <span className="tag bg-[#E0F2FE] text-[#0284C7] mb-4 inline-block">Coming Soon</span>
      <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Community</h1>
      <p className="text-[#5C4E3D] text-lg max-w-lg leading-relaxed">
        Anonymous forum, cohort programs, and mentor matching — all in one place. Ask anything,
        share anything. No judgment, only people who truly understand your journey.
      </p>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {['Career Doubts', 'Transition Stories', 'Skill Building', 'Emotional Support'].map(tag => (
          <span key={tag} className="tag bg-[#E0F2FE] text-[#0284C7] px-4 py-2">{tag}</span>
        ))}
      </div>
    </div>
  )
}
