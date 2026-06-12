import { Resend } from 'resend';

export async function sendOTP(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';

  // Fallback if API key is not set
  if (!apiKey) {
    console.log(`\n-----------------------------------------`);
    console.log(`[EMAIL] Your NextSprint verification code is: ${code}`);
    console.log(`Sent to: ${email} (Fallback: RESEND_API_KEY not configured)`);
    console.log(`-----------------------------------------\n`);
    return;
  }

  // Initialize Resend dynamically to avoid ES module import ordering issues with dotenv
  const resend = new Resend(apiKey);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `${code} is your NextSprint verification code`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 10px;">NextSprint Login Code</h2>
          <p>Please enter the following 6-digit verification code to complete your login or registration. This code is valid for 10 minutes:</p>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
    
    if (response.error) {
      throw new Error(response.error.message || JSON.stringify(response.error));
    }
  } catch (err) {
    console.error('Failed to send email via Resend:', err);
    // Fallback to printing in console so development is not blocked
    console.log(`\n-----------------------------------------`);
    console.log(`[EMAIL ERROR FALLBACK] Verification code: ${code}`);
    console.log(`Sent to: ${email}`);
    console.log(`-----------------------------------------\n`);
  }
}
