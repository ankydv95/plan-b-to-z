import type { AssessmentUserData, CareerPath, CareerMatchResult } from '@/types'

const OPTIONAL_DOMAIN_MAP: Record<string, string[]> = {
  'Political Science': ['Policy, Governance & Public Affairs', 'International Relations & Diplomacy', 'Law & Legal Services', 'Media, Journalism & Content'],
  'History': ['Media, Journalism & Content', 'Education & Training', 'Policy, Governance & Public Affairs', 'Creative & Unconventional'],
  'Geography': ['Environment & Sustainability', 'Urban Planning', 'Data, Analytics & Tech-Adjacent'],
  'Economics': ['Banking, Finance & Economics', 'Management Consulting & Strategy', 'Policy, Governance & Public Affairs', 'Data, Analytics & Tech-Adjacent'],
  'Sociology': ['Social Sector & Non-Profit', 'Education & Training', 'Psychology & Counseling', 'Media, Journalism & Content'],
  'Public Administration': ['Policy, Governance & Public Affairs', 'Management Consulting & Strategy', 'Social Sector & Non-Profit'],
  'Law': ['Law & Legal Services', 'Policy, Governance & Public Affairs', 'Management Consulting & Strategy'],
  'Philosophy': ['Education & Training', 'Media, Journalism & Content', 'Psychology & Counseling', 'Creative & Unconventional'],
  'Literature': ['Media, Journalism & Content', 'Education & Training', 'Creative & Unconventional'],
  'Mathematics': ['Data, Analytics & Tech-Adjacent', 'Banking, Finance & Economics', 'Education & Training'],
  'Science': ['Data, Analytics & Tech-Adjacent', 'Environment & Sustainability', 'Education & Training'],
  'Engineering': ['Data, Analytics & Tech-Adjacent', 'Management Consulting & Strategy', 'GovTech'],
  'Management': ['Management Consulting & Strategy', 'Banking, Finance & Economics', 'Communication, PR & Corporate Affairs'],
  'IR': ['International Relations & Diplomacy', 'Policy, Governance & Public Affairs', 'Media, Journalism & Content'],
}

const INTEREST_DOMAIN_MAP: Record<string, string[]> = {
  'Research & Analysis': ['Policy, Governance & Public Affairs', 'Banking, Finance & Economics', 'Data, Analytics & Tech-Adjacent', 'Management Consulting & Strategy'],
  'People & Communication': ['Communication, PR & Corporate Affairs', 'Education & Training', 'Media, Journalism & Content', 'Social Sector & Non-Profit'],
  'Technology & Data': ['Data, Analytics & Tech-Adjacent', 'Banking, Finance & Economics', 'Management Consulting & Strategy'],
  'Policy & Governance': ['Policy, Governance & Public Affairs', 'International Relations & Diplomacy', 'Law & Legal Services', 'Social Sector & Non-Profit'],
  'Business & Strategy': ['Management Consulting & Strategy', 'Banking, Finance & Economics', 'Entrepreneurship & Freelancing', 'Communication, PR & Corporate Affairs'],
  'Creative & Content': ['Media, Journalism & Content', 'Creative & Unconventional', 'Communication, PR & Corporate Affairs', 'Education & Training'],
  'Teaching & Training': ['Education & Training', 'Social Sector & Non-Profit', 'Psychology & Counseling'],
  'Social Impact': ['Social Sector & Non-Profit', 'Policy, Governance & Public Affairs', 'Environment & Sustainability', 'Psychology & Counseling'],
}

const PRIORITY_CAREER_MAP: Record<string, string[]> = {
  'Salary': ['Banking, Finance & Economics', 'Management Consulting & Strategy', 'Law & Legal Services', 'Data, Analytics & Tech-Adjacent'],
  'Impact': ['Social Sector & Non-Profit', 'Policy, Governance & Public Affairs', 'Environment & Sustainability', 'Education & Training'],
  'Work-Life Balance': ['Education & Training', 'Psychology & Counseling', 'Creative & Unconventional', 'Entrepreneurship & Freelancing'],
  'Growth Speed': ['Management Consulting & Strategy', 'Data, Analytics & Tech-Adjacent', 'Banking, Finance & Economics', 'Communication, PR & Corporate Affairs'],
  'Stability': ['Banking, Finance & Economics', 'Education & Training', 'Law & Legal Services', 'Armed Forces & Paramilitary'],
  'Creative Freedom': ['Creative & Unconventional', 'Media, Journalism & Content', 'Entrepreneurship & Freelancing', 'Education & Training'],
}

export function matchCareers(userData: AssessmentUserData, careerPaths: CareerPath[]): CareerMatchResult[] {
  const results: CareerMatchResult[] = []

  for (const career of careerPaths) {
    let score = 0
    const reasons: string[] = []

    // Optional subject match (25 points max)
    const optionalKey = Object.keys(OPTIONAL_DOMAIN_MAP).find(key =>
      userData.optional?.toLowerCase().includes(key.toLowerCase())
    )
    if (optionalKey) {
      const matchedDomains = OPTIONAL_DOMAIN_MAP[optionalKey]
      if (matchedDomains.some(d => career.domain.includes(d) || d.includes(career.domain))) {
        score += 25
        reasons.push(`Your ${optionalKey} background is highly relevant`)
      } else if (matchedDomains.some(d => career.title.toLowerCase().includes(d.toLowerCase()))) {
        score += 15
      }
    }

    // Interest match (25 points max)
    let interestScore = 0
    for (const interest of userData.interests || []) {
      const domains = INTEREST_DOMAIN_MAP[interest] || []
      if (domains.some(d => career.domain.includes(d) || d.includes(career.domain))) {
        interestScore += 10
        reasons.push(`Aligns with your interest in ${interest}`)
      }
    }
    score += Math.min(interestScore, 25)

    // Priority match (20 points max)
    let priorityScore = 0
    for (const priority of userData.priorities || []) {
      const highSalaryCareers = PRIORITY_CAREER_MAP[priority] || []
      if (highSalaryCareers.some(d => career.domain.includes(d) || d.includes(career.domain))) {
        priorityScore += 8
      }
    }
    score += Math.min(priorityScore, 20)

    // Skills match (20 points max)
    let skillScore = 0
    const userSkillsLower = (userData.skills || []).map(s => s.toLowerCase())
    for (const careerSkill of career.skills_needed || []) {
      const skillLower = careerSkill.toLowerCase()
      if (userSkillsLower.some(us => skillLower.includes(us) || us.includes(skillLower.split(' ')[0]))) {
        skillScore += 5
      }
    }
    // UPSC prep baseline skills
    const upscBaseSkills = ['analytical writing', 'current affairs', 'research', 'critical thinking', 'reading comprehension']
    for (const careerSkill of career.skills_needed || []) {
      if (upscBaseSkills.some(us => careerSkill.toLowerCase().includes(us))) {
        skillScore += 3
      }
    }
    score += Math.min(skillScore, 20)

    // Education match (10 points max)
    if (career.eligibility) {
      if (userData.education && career.eligibility.toLowerCase().includes('any graduate')) {
        score += 8
      } else if (userData.education?.toLowerCase().includes('law') && career.domain.includes('Law')) {
        score += 10
      } else if (userData.education && career.eligibility.toLowerCase().includes('graduate')) {
        score += 5
      }
    }

    // Normalize to 0-100
    const matchPercentage = Math.min(Math.max(Math.round((score / 100) * 100), 20), 98)

    results.push({
      career_path_id: career.id,
      match_percentage: matchPercentage,
      reasoning: reasons.slice(0, 2).join('. ') || 'Strong alignment with your UPSC preparation background',
      career,
    })
  }

  return results
    .sort((a, b) => b.match_percentage - a.match_percentage)
    .slice(0, 15)
}
