const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

/**
 * Generate a unique invitation token
 * @returns {string} 64-character hex token
 */
const generateInvitationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Send invitation email to a user
 * @param {string} email - Recipient email address
 * @param {string} token - Invitation token
 * @param {string} projectName - Name of the project
 * @param {string} inviterName - Name of the person sending the invitation
 */
const sendInvitationEmail = async (email, token, projectName, inviterName) => {
    const invitationLink = `${process.env.CLIENT_URL}/invitations/${token}/accept`;

    const mailOptions = {
        from: `"Project Management Platform" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `You've been invited to join "${projectName}"`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #4F46E5;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 8px 8px 0 0;
                    }
                    .content {
                        background-color: #f9fafb;
                        padding: 30px;
                        border-radius: 0 0 8px 8px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #4F46E5;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        color: #6b7280;
                        font-size: 12px;
                    }
                    .info-box {
                        background-color: #eff6ff;
                        border-left: 4px solid #4F46E5;
                        padding: 15px;
                        margin: 15px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Project Invitation</h1>
                    </div>
                    <div class="content">
                        <p>Hi there!</p>
                        <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong>.</p>
                        
                        <div class="info-box">
                            <p style="margin: 0;"><strong>📋 Project:</strong> ${projectName}</p>
                            <p style="margin: 5px 0 0 0;"><strong>👤 Invited by:</strong> ${inviterName}</p>
                        </div>

                        <p>Click the button below to accept this invitation and start collaborating:</p>
                        
                        <div style="text-align: center;">
                            <a href="${invitationLink}" class="button">Accept Invitation</a>
                        </div>

                        <p style="font-size: 14px; color: #6b7280;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${invitationLink}" style="color: #4F46E5; word-break: break-all;">${invitationLink}</a>
                        </p>

                        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                            <strong>Note:</strong> This invitation will expire in 7 days.
                        </p>
                    </div>
                    <div class="footer">
                        <p>This email was sent from the Project Management Platform.</p>
                        <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
${inviterName} has invited you to join the project "${projectName}".

Click the link below to accept this invitation:
${invitationLink}

This invitation will expire in 7 days.

If you weren't expecting this invitation, you can safely ignore this email.
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Invitation email sent successfully to:', email);
        console.log('Message ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Failed to send invitation email:', error);
        throw new Error('Failed to send invitation email');
    }
};

module.exports = {
    generateInvitationToken,
    sendInvitationEmail
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} username - User's name
 * @param {string} resetUrl - Password reset URL
 */
const sendPasswordResetEmail = async (email, username, resetUrl) => {
    const mailOptions = {
        from: `"Project Management Platform" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                    .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header"><h1>🔒 Password Reset</h1></div>
                    <div class="content">
                        <p>Hi ${username},</p>
                        <p>You requested to reset your password for your Project Management Platform account.</p>
                        <p>Click the button below to reset your password:</p>
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </div>
                        <p style="font-size: 14px; color: #6b7280;">
                            If the button doesn't work, copy and paste this link:<br>
                            <a href="${resetUrl}" style="color: #DC2626; word-break: break-all;">${resetUrl}</a>
                        </p>
                        <div class="warning-box">
                            <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>This link will expire in 1 hour</li>
                                <li>If you didn't request this, ignore this email</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `Hi ${username}, You requested to reset your password. Click: ${resetUrl} (Expires in 1 hour)`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent to:', email);
        return info;
    } catch (error) {
        console.error('❌ Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

module.exports = { generateInvitationToken, sendInvitationEmail, sendPasswordResetEmail };
