/**
 * REMINDER ENGINE
 * Generates tailored payment reminder messages and direct WhatsApp/SMS dispatch links
 * with dynamic direct UPI payment parameters and deterministic financial formatting.
 */

import { FormattedReminder, ReminderTemplateInput } from './CollectionTypes';
import { createMoney, formatMoney } from '../money/Money';

export class ReminderEngine {
  /**
   * Formats a clean E.164 phone string into pure digits for WhatsApp URL scheme.
   */
  static cleanPhoneForWhatsApp(phone?: string | null): string | null {
    if (!phone) return null;
    const digitsOnly = phone.replace(/[^\d]/g, '');
    if (digitsOnly.length < 7) return null;
    return digitsOnly;
  }

  /**
   * Formats a clean phone string for SMS scheme.
   */
  static cleanPhoneForSms(phone?: string | null): string | null {
    if (!phone) return null;
    const cleaned = phone.trim().replace(/[\s\-()]/g, '');
    if (cleaned.length < 5) return null;
    return cleaned;
  }

  /**
   * Evaluates if a reminder can be dispatched.
   * Auto-stops reminders if invoice is settled (balance <= 0n).
   */
  static canSendReminder(input: { amountMinor: bigint }): { canSend: boolean; reason?: string } {
    if (input.amountMinor <= 0n) {
      return { canSend: false, reason: 'Invoice is settled or has no outstanding balance.' };
    }
    return { canSend: true };
  }

  /**
   * Builds payment reminder content with appropriate tone and action links.
   */
  static generateReminder(input: ReminderTemplateInput): FormattedReminder {
    const {
      customerName,
      businessName,
      invoiceNumber,
      amountMinor,
      currency,
      dueDate,
      daysOverdue,
      customerPhone,
      upiVpa,
      upiUri,
      bankDetails,
    } = input;

    if (amountMinor <= 0n) {
      throw new Error('Cannot generate payment reminder: invoice balance is zero or settled.');
    }

    const formattedAmount = formatMoney(createMoney(amountMinor, currency));
    const formattedDueDate = new Date(dueDate).toLocaleDateString();

    // Determine tone based on delinquency if not explicitly provided
    let tone: 'friendly' | 'firm' | 'urgent' = input.tone || 'friendly';
    if (!input.tone) {
      if (daysOverdue > 30) {
        tone = 'urgent';
      } else if (daysOverdue > 7) {
        tone = 'firm';
      } else {
        tone = 'friendly';
      }
    }

    let paymentInstructionBlock = '';
    if (upiUri) {
      paymentInstructionBlock += `Pay instantly via UPI:\n${upiUri}`;
    } else if (upiVpa) {
      paymentInstructionBlock += `UPI ID: ${upiVpa}`;
    }

    if (bankDetails) {
      paymentInstructionBlock += paymentInstructionBlock
        ? `\n\nBank Details:\n${bankDetails}`
        : `Bank Details:\n${bankDetails}`;
    }

    let subject = '';
    let message = '';

    if (tone === 'urgent') {
      subject = `URGENT: Overdue Invoice ${invoiceNumber}`;
      message =
        `URGENT PAYMENT NOTICE\n\n` +
        `Dear ${customerName},\n` +
        `Invoice ${invoiceNumber} for ${formattedAmount} from ${businessName} is currently ${daysOverdue} days overdue (Due Date: ${formattedDueDate}).\n\n` +
        `Please arrange immediate settlement.\n\n` +
        (paymentInstructionBlock ? `${paymentInstructionBlock}\n\n` : '') +
        `If payment was recently initiated, please reply with the transfer reference / UTR.\n\n` +
        `Regards,\n${businessName}`;
    } else if (tone === 'firm') {
      subject = `Overdue Notice: Invoice ${invoiceNumber}`;
      message =
        `Dear ${customerName},\n\n` +
        `Our records indicate invoice ${invoiceNumber} for ${formattedAmount} from ${businessName} is ${daysOverdue} days overdue (Due Date: ${formattedDueDate}).\n\n` +
        `Please settle this balance at your earliest convenience to keep your account up to date.\n\n` +
        (paymentInstructionBlock ? `${paymentInstructionBlock}\n\n` : '') +
        `Thank you,\n${businessName}`;
    } else {
      subject = `Payment Reminder: Invoice ${invoiceNumber}`;
      message =
        `Hi ${customerName},\n\n` +
        `Friendly reminder from ${businessName} regarding invoice ${invoiceNumber} for ${formattedAmount}.\n` +
        `Due date: ${formattedDueDate}.\n\n` +
        (paymentInstructionBlock ? `${paymentInstructionBlock}\n\n` : '') +
        `Thank you for your business!\n${businessName}`;
    }

    const waPhone = this.cleanPhoneForWhatsApp(customerPhone);
    const whatsAppLink = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
      : null;

    const smsPhone = this.cleanPhoneForSms(customerPhone);
    const smsLink = smsPhone
      ? `sms:${smsPhone}?body=${encodeURIComponent(message)}`
      : null;

    return {
      tone,
      subject,
      message,
      whatsAppLink,
      smsLink,
    };
  }
}
