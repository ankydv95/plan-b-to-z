import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CareerForm from '../CareerForm'

export default async function EditCareerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: career } = await supabase
    .from('career_paths')
    .select('*')
    .eq('id', id)
    .single()

  if (!career) notFound()

  return <CareerForm career={career} />
}
