import { Library } from 'lucide-react'

export default function ContentPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#CCFBF1] flex items-center justify-center mx-auto mb-6">
        <Library size={36} className="text-[#0D9488]" />
      </div>
      <span className="tag bg-[#CCFBF1] text-[#0D9488] mb-4 inline-block">Coming Soon</span>
      <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-lora)' }}>Content Library</h1>
      <p className="text-[#5C4E3D] text-lg max-w-lg leading-relaxed">
        Curated podcasts, YouTube channels, newsletters, and the career wiki — all organized by domain
        and handpicked for the UPSC-prepared mind.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
        {['Podcasts', 'YouTube Channels', 'Newsletters', 'Career Wiki', 'Book Lists', 'Case Studies'].map(tag => (
          <span key={tag} className="tag bg-[#CCFBF1] text-[#0D9488] px-4 py-2">{tag}</span>
        ))}
      </div>
    </div>
  )
}
