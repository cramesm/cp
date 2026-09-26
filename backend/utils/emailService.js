const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
  },
});

const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) {
    return process.env.FRONTEND_URL;
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://verifitor-frontend.vercel.app';
  }
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

/**
 * Send welcome email with login credentials and OTP for newly created staff accounts
 */
async function sendStaffWelcomeEmail({ to, name, email, tempPassword, department, role, otp }) {
  const fromEmail = process.env.SMTP_EMAIL || 'verifitorr@gmail.com';
  const loginUrl = getFrontendUrl();

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #111827; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">VeriFitor</h1>
        <p style="color: #9ca3af; margin: 6px 0 0; font-size: 13px;">Secure Academic Credential & Verification System</p>
      </div>

      <div style="padding: 32px 28px;">
        <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0;">Welcome to the Team, ${name || 'Staff Member'}!</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          An official account has been created for you in the <strong>${department || 'Academic'}</strong> department with the role of <strong>${role || 'Staff'}</strong>.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 14px; font-size: 14px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Your Login Credentials</h3>
          
          <div style="margin-bottom: 10px;">
            <span style="display: inline-block; width: 130px; font-size: 13px; color: #6b7280;">Login Email:</span>
            <strong style="color: #111827; font-size: 14px;">${email || to}</strong>
          </div>
          <div style="margin-bottom: 10px;">
            <span style="display: inline-block; width: 130px; font-size: 13px; color: #6b7280;">Temporary Password:</span>
            <span style="background: #e5e7eb; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 15px; font-weight: bold; color: #1f2937;">${tempPassword}</span>
          </div>
          ${otp ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #d1d5db;">
            <span style="display: inline-block; width: 130px; font-size: 13px; color: #6b7280;">Verification OTP:</span>
            <span style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 2px;">${otp}</span>
          </div>` : ''}
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Access Portal
          </a>
        </div>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
          <p style="color: #92400e; font-size: 12.5px; margin: 0; line-height: 1.5;">
            <strong>Important Security Notice:</strong> Please log in and change your temporary password immediately in your <em>Profile Settings</em> to safeguard your account.
          </p>
        </div>
      </div>

      <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 24px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} VeriFitor System. All rights reserved. Confidential.
        </p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"VeriFitor System" <${fromEmail}>`,
    to,
    subject: `Welcome to VeriFitor - Your Account Credentials & Access Details`,
    html,
  });
}

/**
 * Send account status change notification (Active / Inactive / Archived)
 */
async function sendAccountStatusEmail({ to, name, status }) {
  const fromEmail = process.env.SMTP_EMAIL || 'verifitorr@gmail.com';
  const isActive = status === 'Active';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #111827; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">VeriFitor</h1>
        <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">Account Status Notification</p>
      </div>

      <div style="padding: 28px 24px;">
        <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Hello ${name || 'User'},</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Your VeriFitor account status has been updated by an administrator:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; padding: 8px 24px; border-radius: 9999px; font-weight: 700; font-size: 14px; ${
            isActive 
              ? 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;' 
              : 'background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;'
          }">
            Status: ${status}
          </span>
        </div>

        <p style="color: #4b5563; font-size: 13.5px; line-height: 1.6;">
          ${isActive 
            ? 'Your account is now <strong>active</strong> and you can log in to perform your duties.'
            : 'Your account has been <strong>deactivated</strong>. You will not be able to log in while the account is inactive. If you believe this is an error, please contact your department administrator or IT Support.'
          }
        </p>
      </div>

      <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 14px 24px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} VeriFitor System. Automated administrative notification.
        </p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"VeriFitor System" <${fromEmail}>`,
    to,
    subject: `VeriFitor - Account Status Update: ${status}`,
    html,
  });
}

/**
 * Send password changed confirmation notification
 */
async function sendPasswordChangedEmail({ to, name }) {
  const fromEmail = process.env.SMTP_EMAIL || 'verifitorr@gmail.com';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background: #111827; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">VeriFitor</h1>
        <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">Security Notification</p>
      </div>
      <div style="padding: 28px 24px;">
        <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Password Changed Successfully</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Hello ${name || 'User'}, your password for your VeriFitor account was successfully updated on <strong>${new Date().toLocaleString()}</strong>.
        </p>
        <p style="color: #4b5563; font-size: 13px; line-height: 1.6;">
          If you did not make this change, please immediately notify your IT Administrator to secure your account.
        </p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"VeriFitor Security" <${fromEmail}>`,
    to,
    subject: `VeriFitor - Password Changed Successfully`,
    html,
  });
}

/**
 * Send role promotion or demotion notification email
 */
async function sendRoleChangeEmail({ to, name, oldRole, newRole, isPromotion }) {
  const fromEmail = process.env.SMTP_EMAIL || 'verifitorr@gmail.com';
  const loginUrl = getFrontendUrl();

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #111827; padding: 28px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">VeriFitor</h1>
        <p style="color: #9ca3af; margin: 6px 0 0; font-size: 13px;">Official Role & Permissions Update</p>
      </div>

      <div style="padding: 32px 28px;">
        <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0;">Hello ${name || 'Staff Member'},</h2>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          Your account role in the <strong>VeriFitor</strong> system has been officially ${isPromotion ? 'promoted' : 'updated'} by the <strong>Super Administrator</strong>.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">New Assigned Role:</div>
          <div style="display: inline-block; font-size: 18px; font-weight: 800; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 24px; border-radius: 9999px;">
            ${newRole}
          </div>
          ${oldRole ? `<div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">Previous Role: ${oldRole}</div>` : ''}
        </div>

        <p style="color: #4b5563; font-size: 13.5px; line-height: 1.6;">
          ${isPromotion 
            ? 'Congratulations! You now have administrative privileges for your department. Your dashboard and accessible navigation features have been automatically upgraded.'
            : 'Your role and system permissions have been adjusted accordingly. Please log in to review your updated dashboard.'}
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
            Log in to VeriFitor
          </a>
        </div>
      </div>

      <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 24px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} VeriFitor System. Authorized Super Administrator Action.
        </p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"VeriFitor System" <${fromEmail}>`,
    to,
    subject: `VeriFitor - Role Update: Assigned as ${newRole}`,
    html,
  });
}

module.exports = {
  sendStaffWelcomeEmail,
  sendAccountStatusEmail,
  sendPasswordChangedEmail,
  sendRoleChangeEmail
};
