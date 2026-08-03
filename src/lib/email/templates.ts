import "server-only";

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type EmailTemplateResult = {
  subject: string;
  html: string;
  text: string;
};

export function getVerificationEmailTemplate(input: {
  recipientEmail: string;
  rawToken: string;
  siteUrl: string;
}): EmailTemplateResult {
  const verifyUrl = `${input.siteUrl}/verify-email?token=${encodeURIComponent(input.rawToken)}`;
  const safeEmail = escapeHtml(input.recipientEmail);

  const subject = "Verify your email address - Pick Plant";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7; }
    .btn { display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; margin-bottom: 20px; }
    .footer { margin-top: 32px; font-size: 13px; color: #71717a; line-break: anywhere; }
    .note { font-size: 14px; color: #52525b; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Verify your email address</h2>
    <p>Hello,</p>
    <p>Thank you for creating an account with Pick Plant. Please confirm your email address (<strong>${safeEmail}</strong>) by clicking the button below:</p>
    <div>
      <a href="${verifyUrl}" class="btn" style="color: #ffffff;">Verify Email Address</a>
    </div>
    <p class="note">This verification link will expire in 24 hours.</p>
    <p>If you did not request this account, no further action is required.</p>
    <div class="footer">
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin-bottom: 16px;">
      <p>If the button above does not work, copy and paste this URL into your browser:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

  const text = `Verify your email address - Pick Plant

Hello,

Thank you for creating an account with Pick Plant. Please confirm your email address (${input.recipientEmail}) by visiting the link below:

${verifyUrl}

This link will expire in 24 hours.

If you did not request this account, no further action is required.`;

  return { subject, html, text };
}

export function getPasswordResetEmailTemplate(input: {
  recipientEmail: string;
  rawToken: string;
  siteUrl: string;
}): EmailTemplateResult {
  const resetUrl = `${input.siteUrl}/reset-password?token=${encodeURIComponent(input.rawToken)}`;
  const safeEmail = escapeHtml(input.recipientEmail);

  const subject = "Reset your password - Pick Plant";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7; }
    .btn { display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; margin-bottom: 20px; }
    .footer { margin-top: 32px; font-size: 13px; color: #71717a; line-break: anywhere; }
    .note { font-size: 14px; color: #52525b; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset your password</h2>
    <p>Hello,</p>
    <p>We received a request to reset the password for your Pick Plant account (<strong>${safeEmail}</strong>). Click the button below to choose a new password:</p>
    <div>
      <a href="${resetUrl}" class="btn" style="color: #ffffff;">Reset Password</a>
    </div>
    <p class="note">This password reset link will expire in 30 minutes.</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
    <div class="footer">
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin-bottom: 16px;">
      <p>If the button above does not work, copy and paste this URL into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

  const text = `Reset your password - Pick Plant

Hello,

We received a request to reset the password for your Pick Plant account (${input.recipientEmail}).

Please visit the link below to choose a new password:

${resetUrl}

This password reset link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email.`;

  return { subject, html, text };
}

export type OrderItemDetail = {
  productName: string;
  quantity: number;
  unitPrice: number | string | { toString(): string };
  lineTotal: number | string | { toString(): string };
};

export type OrderDetailInput = {
  id?: string | null;
  userId?: string | null;
  orderNumber: string;
  customerName?: string | null;
  customerEmail?: string | null;
  paymentMethod?: string | null;
  status: string;
  subtotal: number | string | { toString(): string };
  shippingTotal: number | string | { toString(): string };
  discountTotal?: number | string | { toString(): string } | null;
  grandTotal: number | string | { toString(): string };
  items: OrderItemDetail[];
  shippingAddressLine1?: string | null;
  shippingCity?: string | null;
};

export function getOrderConfirmationEmailTemplate(input: {
  order: OrderDetailInput;
  siteUrl: string;
}): EmailTemplateResult {
  const { order, siteUrl } = input;
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeCustomerName = escapeHtml(order.customerName || "Customer");
  const safePaymentMethod = escapeHtml(order.paymentMethod || "Standard Payment");
  const safeStatus = escapeHtml(order.status);
  const subject = `Order Confirmation #${safeOrderNumber} - Pick Plant`;

  const isAuthenticated = Boolean(order.userId);
  const targetUrl = isAuthenticated && order.id
    ? `${siteUrl}/account/orders/${encodeURIComponent(order.id)}`
    : `${siteUrl}/contact`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;">${escapeHtml(item.productName)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: right;">BDT ${Number(item.unitPrice).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: right;">BDT ${Number(item.lineTotal).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productName} x ${item.quantity}: BDT ${Number(item.lineTotal).toFixed(2)}`
    )
    .join("\n");

  const actionButtonLabel = isAuthenticated ? "View Order in Account" : "Contact Customer Support";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7; }
    .btn { display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    th { background: #f4f4f5; text-align: left; padding: 10px; font-weight: 600; }
    .summary-row td { padding: 6px 10px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Thank you for your order!</h2>
    <p>Hi ${safeCustomerName},</p>
    <p>We've received your order <strong>#${safeOrderNumber}</strong> and are preparing it for shipment.</p>
    
    <div style="background: #fafafa; border: 1px solid #f4f4f5; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Order Number:</strong> #${safeOrderNumber}</p>
      <p style="margin: 4px 0;"><strong>Status:</strong> ${safeStatus}</p>
      <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${safePaymentMethod}</p>
    </div>

    <h3>Order Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table style="margin-top: 16px; width: 100%;">
      <tr class="summary-row">
        <td style="text-align: right; width: 70%;"><strong>Subtotal:</strong></td>
        <td style="text-align: right;">BDT ${Number(order.subtotal).toFixed(2)}</td>
      </tr>
      <tr class="summary-row">
        <td style="text-align: right;"><strong>Shipping:</strong></td>
        <td style="text-align: right;">BDT ${Number(order.shippingTotal).toFixed(2)}</td>
      </tr>
      ${
        order.discountTotal && Number(order.discountTotal) > 0
          ? `<tr class="summary-row">
              <td style="text-align: right;"><strong>Discount:</strong></td>
              <td style="text-align: right;">-BDT ${Number(order.discountTotal).toFixed(2)}</td>
            </tr>`
          : ""
      }
      <tr class="summary-row">
        <td style="text-align: right;"><strong>Grand Total:</strong></td>
        <td style="text-align: right; font-size: 16px; font-weight: bold; color: #16a34a;">BDT ${Number(order.grandTotal).toFixed(2)}</td>
      </tr>
    </table>

    <div>
      <a href="${targetUrl}" class="btn" style="color: #ffffff;">${actionButtonLabel}</a>
    </div>

    <div style="margin-top: 32px; font-size: 13px; color: #71717a;">
      <p>If you have any questions, please contact our support team with order number #${safeOrderNumber}.</p>
    </div>
  </div>
</body>
</html>`;

  const textHeader = isAuthenticated
    ? `You can view your order status at any time in your account:\n${targetUrl}`
    : `If you have any questions regarding your order, please contact our support team at:\n${targetUrl} (Order #${order.orderNumber})`;

  const text = `Order Confirmation #${order.orderNumber} - Pick Plant

Hi ${order.customerName || "Customer"},

Thank you for your order! We've received order #${order.orderNumber}.

Order Summary:
Order Number: #${order.orderNumber}
Status: ${order.status}
Payment Method: ${order.paymentMethod || "Standard Payment"}

Items:
${itemsText}

Subtotal: BDT ${Number(order.subtotal).toFixed(2)}
Shipping: BDT ${Number(order.shippingTotal).toFixed(2)}
Grand Total: BDT ${Number(order.grandTotal).toFixed(2)}

${textHeader}`;

  return { subject, html, text };
}

export function getOrderStatusUpdateEmailTemplate(input: {
  id?: string | null;
  userId?: string | null;
  orderNumber: string;
  customerName: string;
  newStatus: string;
  siteUrl: string;
}): EmailTemplateResult {
  const safeOrderNumber = escapeHtml(input.orderNumber);
  const safeCustomerName = escapeHtml(input.customerName);
  const safeStatus = escapeHtml(input.newStatus);
  const subject = `Update on Order #${safeOrderNumber} - Pick Plant`;

  const isAuthenticated = Boolean(input.userId);
  const targetUrl = isAuthenticated && input.id
    ? `${input.siteUrl}/account/orders/${encodeURIComponent(input.id)}`
    : `${input.siteUrl}/contact`;

  const actionButtonLabel = isAuthenticated ? "View Order Details" : "Contact Support";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e4e4e7; }
    .btn { display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .status-badge { display: inline-block; background: #dcfce7; color: #15803d; font-weight: bold; padding: 6px 12px; border-radius: 4px; font-size: 16px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Order Status Update</h2>
    <p>Hi ${safeCustomerName},</p>
    <p>Your order <strong>#${safeOrderNumber}</strong> status has been updated.</p>
    
    <div style="margin: 24px 0; text-align: center;">
      <div>New Order Status:</div>
      <div class="status-badge">${safeStatus}</div>
    </div>

    <div>
      <a href="${targetUrl}" class="btn" style="color: #ffffff;">${actionButtonLabel}</a>
    </div>

    <div style="margin-top: 32px; font-size: 13px; color: #71717a;">
      <p>If you have any questions regarding your order update, feel free to contact us with order number #${safeOrderNumber}.</p>
    </div>
  </div>
</body>
</html>`;

  const textHeader = isAuthenticated
    ? `You can view your order details in your account:\n${targetUrl}`
    : `If you have any questions regarding your order, please contact our support team at:\n${targetUrl} (Order #${input.orderNumber})`;

  const text = `Update on Order #${input.orderNumber} - Pick Plant

Hi ${input.customerName},

Your order #${input.orderNumber} status has been updated to: ${input.newStatus}.

${textHeader}`;

  return { subject, html, text };
}
