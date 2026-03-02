import nodemailer from 'nodemailer';

/**
 * Mocking the email transporter for development.
 * In production, you'd provide real SMTP credentials.
 */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'mock_user',
        pass: process.env.EMAIL_PASS || 'mock_pass',
    },
});

export const sendWelcomeEmail = async (email: string, password: string, name: string) => {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/first-time-reset`;
    
    const mailOptions = {
        from: '"Logistiq System" <noreply@logistiq.com>',
        to: email,
        subject: 'Welcome to Logistiq - Account Created',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2563eb;">Welcome to Logistiq, ${name}!</h2>
                <p>An account has been created for you in our inventory and distribution system.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #475569;">Your Login Credentials:</p>
                    <p style="margin: 10px 0 0 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Default Password:</strong> ${password}</p>
                </div>
                <p>For security reasons, you are <strong>required to reset your password</strong> before your first login.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Your Password</a>
                </div>
                <p style="font-size: 12px; color: #64748b;">If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetLink}">${resetLink}</a></p>
                <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; 2026 Logistiq System. All rights reserved.</p>
            </div>
        `,
    };

    try {
        // In a real scenario, this would send an actual email
        // For this task, we log the intent and the mock data
        console.log(`[EMAIL] Attempting to send welcome email to: ${email}`);
        console.log(`[EMAIL] Content: Welcome ${name}, default psw: ${password}, reset at: ${resetLink}`);
        
        // await transporter.sendMail(mailOptions); // Uncomment for real SMTP
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};
