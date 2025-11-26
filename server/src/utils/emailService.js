const crypto = require('crypto');
const { queueEmail } = require('../queues/email.queue');

const generateInvitationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const sendInvitationEmail = async (email, token, projectName, inviterName) => {
    try {
        await queueEmail('invitation', {
            email,
            token,
            projectName,
            inviterName,
        });
        console.log('Invitation email queued for:', email);
        return { success: true, message: 'Email queued successfully' };
    } catch (error) {
        console.error('Failed to queue invitation email:', error);
        throw new Error('Failed to queue invitation email');
    }
};

const sendPasswordResetEmail = async (email, username, resetUrl) => {
    try {
        await queueEmail('passwordReset', {
            email,
            username,
            resetUrl,
        });
        console.log('Password reset email queued for:', email);
        return { success: true, message: 'Email queued successfully' };
    } catch (error) {
        console.error('Failed to queue password reset email:', error);
        throw new Error('Failed to queue password reset email');
    }
};

module.exports = { generateInvitationToken, sendInvitationEmail, sendPasswordResetEmail };
