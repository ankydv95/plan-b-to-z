import Link from 'next/link'
import {
  Brain,
  BookOpen,
  Users,
  Briefcase,
  Heart,
  Map,
  TrendingUp,
  MessageSquare,
  Star,
  ArrowRight,
  Sparkles,
  Globe,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FEFDFB]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#FEFDFB]/90 backdrop-blur-md border-b border-[#EDDFCC]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
              Plan{' '}
              <em className="text-[#D97706] not-italic">B</em>
              {' '}to Z
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[#5C4E3D] font-semibold text-sm">
            <Link href="#features" className="hover:text-[#D97706] transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-[#D97706] transition-colors">How It Works</Link>
            <Link href="#partners" className="hover:text-[#D97706] transition-colors">Partners</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:inline-flex btn-secondary text-sm py-2 px-5">
              Log In
            </Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-5">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 bg-[#DCFCE7] text-[#059669] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <Sparkles size={12} />
            Free for all ex-aspirants
          </span>
        </div>
        <h1
          className="animate-fade-up-delay-1 text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-4xl mx-auto"
          style={{ fontFamily: 'var(--font-lora)' }}
        >
          Your UPSC journey wasn&apos;t a dead end.{' '}
          <em className="bg-gradient-to-r from-[#D97706] to-[#EA580C] bg-clip-text text-transparent">
            It was a launchpad.
          </em>
        </h1>
        <p className="animate-fade-up-delay-2 text-xl text-[#5C4E3D] max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover 75+ fulfilling career paths that value exactly what you&apos;ve built — your analytical
          mind, your discipline, your depth of knowledge.
        </p>
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/signup"
            className="btn-primary text-base px-8 py-3 !bg-[#2A1F14] hover:!bg-[#3d2d1a]"
          >
            Start Free Assessment
            <ArrowRight size={18} />
          </Link>
          <Link href="#how-it-works" className="btn-secondary text-base px-8 py-3">
            See How It Works
          </Link>
        </div>
        <div className="animate-fade-up-delay-4 flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 border-t border-[#EDDFCC]">
          {[
            { stat: '75+', label: 'Career Paths Mapped' },
            { stat: 'Free', label: '10 Min AI Assessment' },
            { stat: '90', label: 'Days to Launch Your New Career' },
            { stat: '∞', label: 'Possibilities Ahead' },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-bold text-[#D97706]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
                {stat}
              </div>
              <div className="text-sm text-[#9A8B78] mt-1 font-semibold">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="bg-[#FDF6EC] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="tag bg-[#FEE2E2] text-[#E11D48] mb-4 inline-block">The Reality</span>
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
              What no one talks about after the results
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                color: '#EA580C',
                icon: '📅',
                title: 'Years of Preparation',
                body: '3–7 years of your life invested in a single dream. The skills you built are extraordinary — but nobody told you where else they apply.',
              },
              {
                color: '#7C3AED',
                icon: '🧠',
                title: 'Identity Crisis',
                body: "When the exam becomes your identity, not clearing it feels like losing yourself. You are not your rank. You never were.",
              },
              {
                color: '#0284C7',
                icon: '🔍',
                title: 'Zero Visibility',
                body: "No roadmap. No mentor who truly gets it. No community of people who've walked this exact path and come out thriving.",
              },
            ].map(({ color, icon, title, body }) => (
              <div key={title} className="card bg-white p-6 rounded-2xl border-t-4" style={{ borderTopColor: color }}>
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-lora)' }}>{title}</h3>
                <p className="text-[#5C4E3D] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="tag bg-[#FEF3C7] text-[#D97706] mb-4 inline-block">Simple Process</span>
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
              From lost to launched in 4 steps
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#EDDFCC] hidden md:block" />
            {[
              {
                n: '01',
                title: 'Take the AI Assessment',
                body: 'Have a warm, honest 10-minute conversation with our AI counselor. Share your background, skills, and what matters most to you.',
              },
              {
                n: '02',
                title: 'Get Matched to Careers',
                body: 'Our algorithm maps your UPSC preparation, optional subject, and aspirations to 75+ curated career paths with a match score.',
              },
              {
                n: '03',
                title: 'Explore Your Paths',
                body: 'Deep-dive into each career — salary data, trajectory, real stories from ex-aspirants who made the transition.',
              },
              {
                n: '04',
                title: 'Launch in 90 Days',
                body: 'Follow a week-by-week action plan with courses, portfolio projects, networking, and job applications tailored to your path.',
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="relative flex gap-8 mb-10 pl-20">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2A1F14] text-white flex items-center justify-center font-bold z-10 absolute left-0">
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: '0.7rem' }}>{n}</span>
                </div>
                <div className="card bg-white p-6 rounded-2xl flex-1">
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-lora)' }}>{title}</h3>
                  <p className="text-[#5C4E3D] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-[#FDF6EC] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="tag bg-[#EDE9FE] text-[#7C3AED] mb-4 inline-block">Everything You Need</span>
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
              Built for the ex-aspirant journey
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AI Assessment — large card */}
            <div className="md:col-span-2 md:row-span-2 card bg-white p-8 rounded-2xl">
              <span className="tag bg-[#EDE9FE] text-[#7C3AED] mb-4 inline-block">AI-Powered</span>
              <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-lora)' }}>
                Personalized Career Assessment
              </h3>
              <p className="text-[#5C4E3D] mb-6 leading-relaxed">
                Not a quiz. A real conversation. Our AI counselor understands your UPSC journey and maps it
                to careers where your skills actually shine.
              </p>
              <div className="bg-[#FDF6EC] rounded-xl p-4 space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#D97706] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
                  <div className="bg-white rounded-xl rounded-tl-none px-4 py-2.5 text-sm text-[#2A1F14] border border-[#EDDFCC] max-w-xs">
                    What subject did you choose as your optional for UPSC?
                  </div>
                </div>
                <div className="flex gap-3 items-start justify-end">
                  <div className="bg-[#D97706] rounded-xl rounded-tr-none px-4 py-2.5 text-sm text-white max-w-xs">
                    I had Political Science & IR as my optional.
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-[#D97706] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
                  <div className="bg-white rounded-xl rounded-tl-none px-4 py-2.5 text-sm text-[#2A1F14] border border-[#EDDFCC] max-w-xs">
                    That&apos;s a powerful background! Policy research and international organizations would love your depth. What excites you most about work?
                  </div>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="w-7 h-7 rounded-full bg-[#D97706] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
                  <div className="flex gap-1 pb-1">
                    <div className="w-2 h-2 rounded-full bg-[#9A8B78] typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-[#9A8B78] typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-[#9A8B78] typing-dot" />
                  </div>
                </div>
              </div>
            </div>

            {[
              { icon: Map, color: '#D97706', bg: '#FEF3C7', tag: 'Career Intelligence', title: '75+ Career Paths', body: 'Salary data, trajectory, skills, and a 90-day launchpad for each path.' },
              { icon: BookOpen, color: '#E11D48', bg: '#FEE2E2', tag: 'Stories', title: '"I Moved On" Wall', body: 'Real stories from ex-aspirants who found their path.' },
              { icon: Users, color: '#0284C7', bg: '#E0F2FE', tag: 'Community', title: 'Anonymous Forum', body: 'Ask anything, share anything — no judgment, only support.' },
              { icon: Briefcase, color: '#059669', bg: '#DCFCE7', tag: 'Jobs', title: 'Aspirant-Friendly Jobs', body: 'Employers who actively value the UPSC background.' },
              { icon: Heart, color: '#7C3AED', bg: '#EDE9FE', tag: 'Wellbeing', title: 'Mental Health Support', body: 'Verified therapists who understand exam stress.' },
              { icon: TrendingUp, color: '#0D9488', bg: '#CCFBF1', tag: 'Skills', title: '90-Day Launchpad', body: 'Week-by-week action plan for every career path.' },
              { icon: MessageSquare, color: '#EA580C', bg: '#FFEDD5', tag: 'Mentorship', title: 'Mentor Matching', body: 'Connect with professionals who took the same journey.' },
            ].map(({ icon: Icon, color, bg, tag, title, body }) => (
              <div key={title} className="card bg-white p-6 rounded-2xl">
                <span className="tag mb-3 inline-block" style={{ background: bg, color }}>{tag}</span>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="font-bold text-lg mb-1.5" style={{ fontFamily: 'var(--font-lora)' }}>{title}</h3>
                <p className="text-[#5C4E3D] text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="tag bg-[#CCFBF1] text-[#0D9488] mb-4 inline-block">Ecosystem</span>
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
              A support system that gets it
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Briefcase, color: '#059669', bg: '#DCFCE7', title: 'Companies', subtitle: '200+ Aspirant-Friendly Employers', body: "Organizations that actively recruit ex-aspirants and value the UPSC mindset — discipline, integrity, and analytical depth." },
              { icon: Star, color: '#D97706', bg: '#FEF3C7', title: 'Mentors', subtitle: '150+ Verified Mentors', body: "Professionals who were once in your shoes. They'll guide you through the transition with firsthand experience." },
              { icon: Heart, color: '#E11D48', bg: '#FEE2E2', title: 'Therapists', subtitle: '50+ Mental Health Professionals', body: 'Counselors who specialize in exam-related stress, identity transitions, and building resilience after setbacks.' },
            ].map(({ icon: Icon, color, bg, title, subtitle, body }) => (
              <div key={title} className="card bg-white p-8 rounded-2xl text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: bg }}>
                  <Icon size={28} style={{ color }} />
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-lora)' }}>{title}</h3>
                <p className="text-sm font-semibold mb-3" style={{ color }}>{subtitle}</p>
                <p className="text-[#5C4E3D] text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#2A1F14] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Globe className="text-[#D97706] mx-auto mb-6" size={48} />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'var(--font-lora)' }}>
            <em>Your best chapter</em>
            <br />
            <span className="text-[#D97706]">hasn&apos;t been written yet.</span>
          </h2>
          <p className="text-[#9A8B78] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Your discipline, your depth, your drive — they belong somewhere remarkable.
            Let&apos;s find exactly where.
          </p>
          <Link href="/signup" className="btn-primary text-lg px-10 py-4">
            Get Started Free — No Credit Card
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FEFDFB] border-t border-[#EDDFCC] py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
            Plan <em className="text-[#D97706] not-italic">B</em> to Z
          </span>
          <div className="flex items-center gap-6 text-sm text-[#9A8B78]">
            <Link href="/login" className="hover:text-[#D97706] transition-colors">Log In</Link>
            <Link href="/signup" className="hover:text-[#D97706] transition-colors">Sign Up</Link>
            <Link href="#features" className="hover:text-[#D97706] transition-colors">Features</Link>
          </div>
          <p className="text-sm text-[#9A8B78]">© 2026 Plan B to Z. Made with ❤️ for India&apos;s aspirants.</p>
        </div>
      </footer>
    </div>
  )
}
