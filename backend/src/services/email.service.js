import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send an email
 * @param {Object} options - { to, subject, html, text }
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    const mailOptions = {
        from: `"${process.env.FROM_NAME || 'Dwell Mart'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
};

export const sendOrderConfirmationEmail = async (order, userEmail) => {
    await sendEmail({
        to: userEmail,
        subject: `Order Confirmed — ${order.orderId}`,
        html: `<h2>Thank you for your order!</h2><p>Order ID: <strong>${order.orderId}</strong></p><p>Total: ₹${order.total}</p><p>Tracking: ${order.trackingNumber}</p>`,
    });
};
export const sendVendorOnboardingSuccessEmail = async (vendor, plan, payment = null) => {
    const isFree = !payment || payment.amount === 0;
    const amountStr = isFree ? 'Free' : `${payment.currency} ${payment.amount}`;
    
    await sendEmail({
        to: vendor.email,
        subject: 'Welcome to DwellMart! Your Registration is Complete',
        html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0f766e;">Welcome to DwellMart, ${vendor.name}!</h2>
                <p>We are excited to have you on board. Your vendor registration and subscription process is now complete.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Subscription Summary</h3>
                    <p><strong>Plan:</strong> ${plan?.name || 'Standard'}</p>
                    <p><strong>Store Name:</strong> ${vendor.storeName}</p>
                    <p><strong>Payment Status:</strong> ${isFree ? 'N/A (Free Plan)' : 'Paid'}</p>
                    ${!isFree ? `<p><strong>Amount Paid:</strong> ${amountStr}</p>` : ''}
                    ${payment?.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.transactionId}</p>` : ''}
                </div>

                <div style="background: #fff4bf; padding: 15px; border-radius: 8px; border: 1px solid #ffe082; margin-top: 20px;">
                    <p style="margin: 0;"><strong>Important:</strong> Your account is currently in <strong>Pending</strong> status. Our administration team will review your documents and store details shortly. You will receive another email once your account is fully approved and activated.</p>
                </div>

                <p style="margin-top: 30px;">If you have any questions, feel free to reply to this email.</p>
                <p>Best regards,<br>The DwellMart Team</p>
            </div>
        `,
    });
};
