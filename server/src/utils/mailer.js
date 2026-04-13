import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

/**
 * Send restock notification email to a customer
 */
export async function sendRestockEmail({ to, productName, productSlug, clientOrigin }) {
  const productUrl = `${clientOrigin}/product/${productSlug}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAFAF8; border: 1px solid #e0d8cc; border-radius: 12px; overflow: hidden;">
      <div style="background: #2D5A27; padding: 28px 32px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px;">🌿 Good News!</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #6B4423; font-size: 16px; margin-bottom: 8px;">Hello,</p>
        <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6;">
          The product you were waiting for is <strong>back in stock</strong>!
        </p>

        <div style="background: #E8F0E8; border-left: 4px solid #2D5A27; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
          <p style="margin: 0; color: #2D5A27; font-size: 18px; font-weight: bold;">
            ${productName}
          </p>
          <p style="margin: 6px 0 0; color: #6B4423; font-size: 13px;">is now available to order!</p>
        </div>

        <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
          Hurry — stock may be limited. Place your order now before it sells out again.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${productUrl}"
             style="background: #2D5A27; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-size: 16px; font-weight: bold; display: inline-block;">
            🛒 Order Now
          </a>
        </div>

        <p style="color: #8B7355; font-size: 12px; text-align: center; margin-top: 24px;">
          You received this because you subscribed to restock alerts for this product.<br/>
          If you no longer wish to receive these emails, you can ignore this message.
        </p>
      </div>
      <div style="background: #f0ebe3; padding: 16px; text-align: center;">
        <p style="color: #8B7355; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Our Store. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"Our Store" <${env.smtpUser}>`,
    to,
    subject: `✅ ${productName} is back in stock!`,
    html,
  });
}