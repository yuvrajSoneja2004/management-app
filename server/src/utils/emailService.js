const crypto = require('crypto');

/**
 * Generate a unique invitation token
 */
const generateInvitationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Send invitation email
 * NOTE: This is a placeholder that logs to console.
 * To actually send emails, integrate a service like:
 * - SendGrid
 * - Nodemailer with SMTP
 * - AWS SES
 * 
 * @param {string} email - Recipient email
 * @param {string} token - Invitation token
 * @param {string} projectName - Name of the project
 * @param {string} inviterName - Name of person sending invitation
 */
const sendInvitationEmail = async (email, token, projectName, inviterName) => {
    const invitationLink = `${process.env.CLIENT_URL}/invitations/${token}/accept`;

    // TODO: Replace with actual email service
    console.log('\n=== INVITATION EMAIL ===');
    console.log(`To: ${email}`);
    console.log(`Subject: You've been invited to join ${projectName}`);
    console.log(`\nHi,\n`);
    console.log(`${inviterName} has invited you to join the project "${projectName}".\n`);
    console.log(`Click the link below to accept the invitation:\n`);
    console.log(`${invitationLink}\n`);
    console.log(`This invitation will expire in 7 days.\n`);
    console.log('========================\n');

    // When integrating a real email service, replace the above with:
    /*
    const msg = {
        to: email,
        from: process.env.FROM_EMAIL,
        subject: `You've been invited to join ${projectName}`,
        html: `
            <h2>Project Invitation</h2>
            <p>Hi,</p>
            <p>${inviterName} has invited you to join the project "<strong>${projectName}</strong>".</p>
            <p><a href="${invitationLink}">Click here to accept the invitation</a></p>
            <p>This invitation will expire in 7 days.</p>
        `
    };
    await emailService.send(msg);
    */
};

module.exports = {
    generateInvitationToken,
    sendInvitationEmail
};
