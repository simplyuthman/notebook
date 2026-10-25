/**
 * Generates the HTML body for a verification-code email.
 * No user PII is embedded beyond the recipient's first name (optional).
 */
export function verificationEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your NotesBook account</title>
  <style>
    body {
      margin: 0; padding: 0;
      font-family: 'Roboto', 'Segoe UI', Helvetica, Arial, sans-serif;
      background-color: #f4f4f7;
      color: #2d2d2d;
    }
    .wrapper {
      max-width: 520px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 36px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0;
      color: rgba(255,255,255,0.8);
      font-size: 14px;
    }
    .body {
      padding: 36px 40px;
    }
    .body p {
      margin: 0 0 16px;
      font-size: 15px;
      line-height: 1.6;
      color: #444;
    }
    .code-box {
      background: #f0eeff;
      border: 2px dashed #7c3aed;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .code-box span {
      display: block;
      font-size: 40px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #4f46e5;
      font-family: 'Courier New', monospace;
    }
    .code-box small {
      display: block;
      margin-top: 8px;
      font-size: 12px;
      color: #888;
    }
    .footer {
      padding: 20px 40px;
      background: #f9f9fb;
      border-top: 1px solid #ececf1;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📓 NotesBook</h1>
      <p>Email Verification</p>
    </div>
    <div class="body">
      <p>Thanks for signing up! To complete your registration, please use the verification code below:</p>
      <div class="code-box">
        <span>${code}</span>
        <small>This code expires in <strong>10 minutes</strong>.</small>
      </div>
      <p>Enter this code on the NotesBook dashboard to verify your email address.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NotesBook · <a href="#">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function verificationEmailText(code: string): string {
  return `Your NotesBook verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not create an account, please ignore this email.`;
}

/**
 * Generates the HTML body for the welcome email sent after successful signup.
 * Includes a Discord community invite as the primary CTA.
 */
export function welcomeEmailHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to NotesBook</title>
  <style>
    body {
      margin: 0; padding: 0;
      font-family: 'Roboto', 'Segoe UI', Helvetica, Arial, sans-serif;
      background-color: #f4f4f7;
      color: #2d2d2d;
    }
    .wrapper {
      max-width: 520px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 36px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0;
      color: rgba(255,255,255,0.8);
      font-size: 14px;
    }
    .body {
      padding: 36px 40px;
    }
    .body p {
      margin: 0 0 16px;
      font-size: 15px;
      line-height: 1.6;
      color: #444;
    }
    .body ul {
      margin: 0 0 20px;
      padding: 0 0 0 4px;
      list-style: none;
    }
    .body ul li {
      padding: 6px 0;
      font-size: 15px;
      line-height: 1.5;
      color: #444;
    }
    .discord-card {
      background: #f0edff;
      border: 1px solid #ddd6fe;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0 8px;
    }
    .discord-card h2 {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 700;
      color: #3b3273;
    }
    .discord-card p {
      margin: 0 0 20px;
      font-size: 14px;
      line-height: 1.5;
      color: #5b5394;
    }
    .discord-btn {
      display: inline-block;
      background-color: #5865F2;
      color: #ffffff !important;
      padding: 14px 36px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 14px rgba(88,101,242,0.35);
    }
    .footer {
      padding: 20px 40px;
      background: #f9f9fb;
      border-top: 1px solid #ececf1;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📓 NotesBook</h1>
      <p>Welcome aboard!</p>
    </div>
    <div class="body">
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>You've just taken the first step toward turning your handwritten notes into a beautifully structured digital book. We're thrilled to have you here.</p>
      <p><strong>Here's what you can do next:</strong></p>
      <ul>
        <li>📸 Upload your handwritten notes (JPEG, PNG, or HEIC)</li>
        <li>🤖 Watch as AI transcribes and organises them into chapters</li>
        <li>📄 Export a clean, professional PDF of your work</li>
      </ul>
      <div class="discord-card">
        <h2>🎮 Join Our Student Community</h2>
        <p>Connect with other students who are already using NotesBook to level up their study game. Ask questions, share tips, and get early access to new features.</p>
        <a href="https://discord.gg/notesbook" class="discord-btn">Join us on Discord →</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NotesBook · <a href="#">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmailText(firstName: string): string {
  return `Welcome to NotesBook!

Hi ${firstName},

You've just taken the first step toward turning your handwritten notes into a
beautifully structured digital book. We're thrilled to have you here.

Here's what you can do next:

  \u2022 Upload your handwritten notes (JPEG, PNG, or HEIC)
  \u2022 Watch as AI transcribes and organises them into chapters
  \u2022 Export a clean, professional PDF of your work

Join Our Student Community
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Connect with other students who are already using NotesBook to level up their
study game. Ask questions, share tips, and get early access to new features.

\u2192 Join us on Discord: https://discord.gg/notesbook

We can't wait to see what you create.

Cheers,
The NotesBook Team

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
\u00A9 ${new Date().getFullYear()} NotesBook \u00B7 You're receiving this because you signed up at notesbook.app`;
}

/**
 * Generates the HTML body for a password reset email containing a 6-digit code.
 */
export function passwordResetEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your NotesBook password</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Roboto', 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #2d2d2d; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
    .body { padding: 36px 40px; }
    .body p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #444; }
    .code-wrap { text-align: center; margin: 28px 0; }
    .code { display: inline-block; background: #f4f4f7; border: 2px dashed #4f46e5; border-radius: 12px; padding: 18px 40px; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #4f46e5; font-family: 'Courier New', monospace; }
    .note { background: #f9f9fb; border-left: 3px solid #e5e7eb; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #666; margin: 16px 0 0; }
    .footer { padding: 20px 40px; background: #f9f9fb; border-top: 1px solid #ececf1; text-align: center; font-size: 12px; color: #999; }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>\uD83D\uDCD3 NotesBook</h1>
      <p>Password Reset</p>
    </div>
    <div class="body">
      <p>We received a request to reset your NotesBook password. Enter the code below on the reset password page:</p>
      <div class="code-wrap">
        <span class="code">${code}</span>
      </div>
      <p>This code expires in <strong>30 minutes</strong>. Do not share it with anyone.</p>
      <div class="note">
        If you didn't request a password reset, you can safely ignore this email \u2014 your account remains secure and your password has not changed.
      </div>
    </div>
    <div class="footer">
      <p>\u00A9 ${new Date().getFullYear()} NotesBook \u00B7 <a href="#">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function passwordResetEmailText(code: string): string {
  return `Reset your NotesBook password

We received a request to reset your password. Use the 6-digit code below on the reset password page:

${code}

This code expires in 30 minutes. Do not share it with anyone.

If you didn't request a password reset, you can safely ignore this email — your account remains secure and your password has not changed.

© ${new Date().getFullYear()} NotesBook`;
}
