const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const nodemailer = require('nodemailer');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const path = require('path');

const logoPath = path.join(__dirname, '../../../client/src/assets/imgs/email.png');

const emailTemplates = {
    invitation: (data) => {
        const { email, token, projectName, inviterName } = data;
        const invitationLink = `${process.env.CLIENT_URL}/invitations/${token}/accept`;

        return {
            from: `"Jello Team" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: `${inviterName} invited you to join ${projectName} on Jello! 🐢`,
            attachments: [{
                filename: 'email.png',
                path: logoPath,
                cid: 'jelloLogo'
            }],
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background-color: #F3F4F6; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 20px; text-align: center; }
                        .logo { width: 80px; height: auto; margin-bottom: 10px; }
                        .content { padding: 40px 30px; }
                        .h1 { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 16px; text-align: center; }
                        .text { font-size: 16px; color: #4B5563; margin-bottom: 24px; text-align: center; }
                        .button-container { text-align: center; margin: 32px 0; }
                        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #4F46E5, #7C3AED); color: white !important; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39); transition: transform 0.2s; }
                        .button:hover { transform: translateY(-1px); }
                        .project-card { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
                        .project-name { font-weight: 700; color: #4F46E5; font-size: 18px; }
                        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB; }
                        .footer-text { font-size: 12px; color: #9CA3AF; }
                        .link { color: #4F46E5; text-decoration: none; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="cid:jelloLogo" alt="Jello Logo" class="logo"/>
                            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Jello!</h1>
                        </div>
                        <div class="content">
                            <div class="h1">You've been invited! 🎉</div>
                            <p class="text">
                                Hey there! <strong>${inviterName}</strong> thinks you'd be a great addition to the team. 
                                They've invited you to collaborate on a project.
                            </p>
                            
                            <div class="project-card">
                                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; margin-bottom: 4px;">Project</div>
                                <div class="project-name">${projectName}</div>
                            </div>

                            <div class="button-container">
                                <a href="${invitationLink}" class="button">Accept Invitation</a>
                            </div>

                            <p class="text" style="font-size: 14px;">
                                Or copy this link: <br>
                                <a href="${invitationLink}" class="link">${invitationLink}</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p class="footer-text">
                                Sent with 💚 by the Jello Team<br>
                                If you didn't expect this, you can safely ignore this email.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Hey there! 👋

${inviterName} has invited you to join the project "${projectName}" on Jello.

Click here to join: ${invitationLink}

Happy collaborating!
The Jello Team 🐢
            `
        };
    },

    passwordReset: (data) => {
        const { email, username, resetUrl } = data;

        return {
            from: `"Jello Security" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Reset your Jello password 🔐',
            attachments: [{
                filename: 'email.png',
                path: logoPath,
                cid: 'jelloLogo'
            }],
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; background-color: #F3F4F6; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                        .header { background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%); padding: 40px 20px; text-align: center; }
                        .logo { width: 80px; height: auto; margin-bottom: 10px; }
                        .content { padding: 40px 30px; }
                        .h1 { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 16px; text-align: center; }
                        .text { font-size: 16px; color: #4B5563; margin-bottom: 24px; text-align: center; }
                        .button-container { text-align: center; margin: 32px 0; }
                        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #EF4444, #B91C1C); color: white !important; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.39); transition: transform 0.2s; }
                        .button:hover { transform: translateY(-1px); }
                        .warning-box { background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 16px; margin: 24px 0; color: #991B1B; font-size: 14px; text-align: center; }
                        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB; }
                        .footer-text { font-size: 12px; color: #9CA3AF; }
                        .link { color: #EF4444; text-decoration: none; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="cid:jelloLogo" alt="Jello Logo" class="logo"/>
                            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
                        </div>
                        <div class="content">
                            <div class="h1">Forgot your password? 🤔</div>
                            <p class="text">
                                Hi <strong>${username}</strong>, we received a request to reset your password. 
                                No worries, it happens to the best of us!
                            </p>
                            
                            <div class="button-container">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </div>

                            <div class="warning-box">
                                <strong>Note:</strong> This link expires in 1 hour. If you didn't request this, please ignore this email.
                            </div>

                            <p class="text" style="font-size: 14px;">
                                Or copy this link: <br>
                                <a href="${resetUrl}" class="link">${resetUrl}</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p class="footer-text">
                                Sent with 💚 by the Jello Team
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Hi ${username},

We received a request to reset your Jello password.

Click here to reset it: ${resetUrl}

This link expires in 1 hour. If you didn't ask for this, you can safely ignore this email.

The Jello Team 🐢
            `
        };
    }
};

const emailWorker = new Worker(
    'email',
    async (job) => {
        const type = job.name;
        const data = job.data;
        console.log(`Processing email job ${job.id}: ${type}`);

        try {
            const template = emailTemplates[type];
            if (!template) {
                throw new Error(`Unknown email type: ${type}`);
            }

            const mailOptions = template(data);
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully: ${job.id}`, info.messageId);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`Failed to send email ${job.id}:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 5,
        limiter: {
            max: 10,
            duration: 1000,
        },
    }
);

emailWorker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
    console.error('Email worker error:', err);
});

console.log('Email worker started');

module.exports = emailWorker;
