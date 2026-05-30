import Link from 'next/link'
import { Heart, Star, Phone } from 'lucide-react'

const therapists = [
  {
    name: 'Dr. Meera Iyer',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
    specialization: 'Exam Stress & Identity Transitions',
    languages: 'Hindi, English, Tamil',
    experience: '12 years',
    price: '₹1,200 / session',
    rating: 4.9,
    reviews: 124,
    tags: ['Exam Stress', 'Identity Crisis', 'Career Anxiety'],
  },
  {
    name: 'Dr. Arjun Bose',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    specialization: 'Resilience & Life Transitions',
    languages: 'Hindi, English, Bengali',
    experience: '8 years',
    price: '₹900 / session',
    rating: 4.8,
    reviews: 89,
    tags: ['Resilience', 'Burnout', 'Life Transitions'],
  },
  {
    name: 'Dr. Priyanka Nair',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
    specialization: 'Anxiety & Depression in Aspirants',
    languages: 'Hindi, English, Malayalam',
    experience: '10 years',
    price: '₹1,000 / session',
    rating: 4.9,
    reviews: 156,
    tags: ['Anxiety', 'Depression', 'Self-worth'],
  },
  {
    name: 'Dr. Rahul Sharma',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    specialization: 'Career Counselling & Motivation',
    languages: 'Hindi, English',
    experience: '6 years',
    price: '₹800 / session',
    rating: 4.7,
    reviews: 67,
    tags: ['Career Clarity', 'Motivation', 'Goal Setting'],
  },
  {
    name: 'Dr. Ananya Ghosh',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    specialization: 'Family Pressure & Relationship Stress',
    languages: 'Hindi, English, Bengali',
    experience: '9 years',
    price: '₹950 / session',
    rating: 4.8,
    reviews: 103,
    tags: ['Family Pressure', 'Relationships', 'Stress'],
  },
  {
    name: 'Dr. Vikram Menon',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    specialization: 'Mindfulness & Emotional Regulation',
    languages: 'Hindi, English, Malayalam',
    experience: '11 years',
    price: '₹1,100 / session',
    rating: 4.9,
    reviews: 198,
    tags: ['Mindfulness', 'Emotional Health', 'Meditation'],
  },
]

const resources = [
  {
    emoji: '📖',
    title: 'Letting Go of the UPSC Identity',
    type: 'Article · 5 min read',
    desc: 'How to separate your self-worth from the outcome of an exam, and build a new sense of purpose.',
  },
  {
    emoji: '🎧',
    title: 'The Restart Podcast — Ep. 12',
    type: 'Podcast · 38 min',
    desc: '"I failed 5 times. Here is what I learnt." A raw conversation with a former aspirant turned entrepreneur.',
  },
  {
    emoji: '🧘',
    title: '10-Minute Grounding Meditation',
    type: 'Audio · 10 min',
    desc: 'A guided meditation specifically designed for exam-related anxiety and uncertainty about the future.',
  },
  {
    emoji: '✍️',
    title: 'The Identity Shift Workbook',
    type: 'Worksheet · Free',
    desc: '7 journaling prompts to help you rediscover who you are beyond the UPSC journey.',
  },
]

export default function WellbeingPage() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
          <Heart size={12} /> Mental Health Support
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>
          Wellbeing
        </h1>
        <p className="text-[#64748b] max-w-xl leading-relaxed">
          Verified therapists who understand exam stress, identity transitions, and what it takes
          to rebuild. Taking care of your mind is step one.
        </p>
      </div>

      {/* Crisis line banner */}
      <div className="bg-[#FEE2E2] border-2 border-[#E11D48]/20 rounded-2xl p-5 mb-10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E11D48] flex items-center justify-center flex-shrink-0">
          <Phone size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-[#1e293b] text-sm">Need immediate support?</p>
          <p className="text-sm text-[#475569]">
            iCall Helpline: <strong>9152987821</strong> · Vandrevala Foundation: <strong>1860-2662-345</strong> · Available 24/7
          </p>
        </div>
      </div>

      {/* Therapists */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-lora)' }}>
          Verified Therapists
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {therapists.map((t) => (
            <div key={t.name} className="bg-white border-2 border-[#e2e8f0] rounded-2xl p-6 hover:border-[#7C3AED]/40 transition-colors">
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#1e293b]" style={{ fontFamily: 'var(--font-lora)' }}>{t.name}</h3>
                  <p className="text-sm text-[#475569] leading-snug">{t.specialization}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} fill="#D97706" className="text-[#D97706]" />
                    <span className="text-xs font-bold text-[#D97706]">{t.rating}</span>
                    <span className="text-xs text-[#64748b]">({t.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {t.tags.map(tag => (
                  <span key={tag} className="text-xs bg-[#EDE9FE] text-[#7C3AED] font-semibold px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#64748b] mb-4">
                <span>🌐 {t.languages}</span>
                <span>⏱ {t.experience} experience</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0]">
                <span className="font-bold text-[#1e293b]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{t.price}</span>
                <button className="bg-[#7C3AED] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-lora)' }}>
          Self-Help Resources
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {resources.map((r) => (
            <div key={r.title} className="bg-white border-2 border-[#e2e8f0] rounded-2xl p-5 hover:border-[#D97706] transition-colors cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{r.emoji}</div>
                <div>
                  <p className="text-xs text-[#64748b] font-semibold mb-1">{r.type}</p>
                  <h3 className="font-bold text-[#1e293b] mb-1 group-hover:text-[#D97706] transition-colors" style={{ fontFamily: 'var(--font-lora)' }}>
                    {r.title}
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{r.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
