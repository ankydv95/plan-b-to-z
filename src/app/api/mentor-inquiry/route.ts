import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const { mentorName, careerTitle, senderName, senderEmail, message } =
      await request.json() as {
        mentorName: string
        careerTitle: string
        senderName: string
        senderEmail: string
        message: string
      }

    if (
      !mentorName?.trim() ||
      !careerTitle?.trim() ||
      !senderName?.trim() ||
      !senderEmail?.trim() ||
      !message?.trim()
    ) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    if (!EMAIL_RE.test(senderEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Plan B to Z <onboarding@resend.dev>',
      to: 'planbtoz95@gmail.com',
      replyTo: senderEmail,
      subject: `[Plan B to Z] Mentor inquiry — ${escapeHtml(mentorName)} (${escapeHtml(careerTitle)})`,
      html: `
        <h2>New Mentor Inquiry</h2>
        <p><strong>Mentor requested:</strong> ${escapeHtml(mentorName)}</p>
        <p><strong>Career path:</strong> ${escapeHtml(careerTitle)}</p>
        <hr />
        <p><strong>From:</strong> ${escapeHtml(senderName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(senderEmail)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send inquiry.' }, { status: 500 })
  }
}
