import { Resend } from 'resend'

let resendClient: Resend | null = null

/** Created on first use, so the build does not need the Resend key. */
function getResend(): Resend {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

interface ContactEmailData {
  name: string
  email: string
  company?: string
  phone?: string
  service: string
  message: string
  currentSite?: string
}

export async function sendContactNotification(data: ContactEmailData) {
  const toEmail = process.env.CONTACT_EMAIL || 'hello@beam.dev'

  const { data: result, error } = await getResend().emails.send({
    from: 'BEAM Contact Form <notifications@beam.dev>',
    to: [toEmail],
    reply_to: data.email,
    subject: `New Contact: ${data.name} - ${data.service}`,
    html: generateNotificationEmail(data),
    text: generateNotificationEmailText(data),
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error('Failed to send notification email')
  }

  return result
}

export async function sendContactConfirmation(data: ContactEmailData) {
  const { data: result, error } = await getResend().emails.send({
    from: 'BEAM <hello@beam.dev>',
    to: [data.email],
    subject: `Thanks for reaching out, ${data.name.split(' ')[0]}!`,
    html: generateConfirmationEmail(data),
    text: generateConfirmationEmailText(data),
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error('Failed to send confirmation email')
  }

  return result
}

function generateNotificationEmail(data: ContactEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0c8ee6 0%, #0070c4 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; width: 140px;">Name</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.name)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Email</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="mailto:${escapeHtml(data.email)}" style="color: #0c8ee6;">${escapeHtml(data.email)}</a>
        </td>
      </tr>
      ${data.company ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Company</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.company)}</td>
      </tr>
      ` : ''}
      ${data.phone ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Phone</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="tel:${escapeHtml(data.phone)}" style="color: #0c8ee6;">${escapeHtml(data.phone)}</a>
        </td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Service</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${escapeHtml(data.service)}</span>
        </td>
      </tr>
      ${data.currentSite ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Current Site</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="${escapeHtml(data.currentSite)}" style="color: #0c8ee6;">${escapeHtml(data.currentSite)}</a>
        </td>
      </tr>
      ` : ''}
    </table>

    <div style="margin-top: 24px;">
      <h3 style="color: #374151; margin: 0 0 12px 0; font-size: 16px;">Message</h3>
      <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${escapeHtml(data.message)}</div>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <a href="mailto:${escapeHtml(data.email)}" style="display: inline-block; background: #0c8ee6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reply to ${escapeHtml(data.name.split(' ')[0])}</a>
    </div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
    This email was sent from the BEAM contact form.
  </p>
</body>
</html>
  `.trim()
}

function generateNotificationEmailText(data: ContactEmailData): string {
  return `
New Contact Form Submission
============================

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}
Service: ${data.service}
${data.currentSite ? `Current Site: ${data.currentSite}` : ''}

Message:
--------
${data.message}
  `.trim()
}

function generateConfirmationEmail(data: ContactEmailData): string {
  const firstName = data.name.split(' ')[0]

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanks for reaching out!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #0c8ee6 0%, #0070c4 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Thanks for reaching out!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">We've received your message</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; margin: 0 0 20px 0;">
        Hi ${escapeHtml(firstName)},
      </p>

      <p style="font-size: 16px; margin: 0 0 20px 0;">
        Thank you for contacting BEAM! We're excited to learn more about your project and how we can help grow your digital presence.
      </p>

      <div style="background: #f0f7ff; border-left: 4px solid #0c8ee6; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
        <p style="margin: 0; font-weight: 600; color: #0c8ee6;">What happens next?</p>
        <p style="margin: 8px 0 0 0; color: #374151;">
          A member of our team will review your inquiry and get back to you within 24 hours. We'll schedule a free consultation call to discuss your goals and create a plan tailored to your business.
        </p>
      </div>

      <p style="font-size: 16px; margin: 24px 0 0 0;">
        In the meantime, feel free to check out our <a href="https://beam.dev" style="color: #0c8ee6;">services</a> or read some of our <a href="https://beam.dev#testimonials" style="color: #0c8ee6;">client success stories</a>.
      </p>

      <p style="font-size: 16px; margin: 24px 0 0 0;">
        Looking forward to speaking with you!
      </p>

      <p style="font-size: 16px; margin: 24px 0 0 0;">
        Best regards,<br>
        <strong>The BEAM Team</strong>
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Questions? Reply to this email or call us at <a href="tel:+15551234567" style="color: #0c8ee6;">(555) 123-4567</a>
      </p>
    </div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
    &copy; ${new Date().getFullYear()} BEAM. All rights reserved.
  </p>
</body>
</html>
  `.trim()
}

function generateConfirmationEmailText(data: ContactEmailData): string {
  const firstName = data.name.split(' ')[0]

  return `
Hi ${firstName},

Thank you for contacting BEAM! We're excited to learn more about your project and how we can help grow your digital presence.

What happens next?
A member of our team will review your inquiry and get back to you within 24 hours. We'll schedule a free consultation call to discuss your goals and create a plan tailored to your business.

In the meantime, feel free to check out our services at https://beam.dev

Looking forward to speaking with you!

Best regards,
The BEAM Team

---
Questions? Reply to this email or call us at (555) 123-4567
  `.trim()
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
