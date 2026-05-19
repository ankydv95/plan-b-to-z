import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    if (!senderName?.trim() || !senderEmail?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Plan B to Z <onboarding@resend.dev>',
      to: 'planbtoz95@gmail.com',
      replyTo: senderEmail,
      subject: `[Plan B to Z] Mentor inquiry — ${mentorName} (${careerTitle})`,
      html: `
        <h2>New Mentor Inquiry</h2>
        <p><strong>Mentor requested:</strong> ${mentorName}</p>
        <p><strong>Career path:</strong> ${careerTitle}</p>
        <hr />
        <p><strong>From:</strong> ${senderName}</p>
        <p><strong>Email:</strong> ${senderEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mentor inquiry error:', error)
    return NextResponse.json({ error: 'Failed to send inquiry.' }, { status: 500 })
  }
}
