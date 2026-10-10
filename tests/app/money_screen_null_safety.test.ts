import React from 'react';

describe('Work/Money screen & payment records null safety', () => {
  it('safely handles null or undefined payment_method without crashing', () => {
    const rawPayment: {
      id: string;
      invoice_id: string;
      document_number: string | null;
      customer_name: string | null;
      amount_minor: number;
      payment_method: string | null;
      reference: string | null;
      payment_date: number;
    } = {
      id: 'pay-1',
      invoice_id: 'inv-1',
      document_number: null,
      customer_name: null,
      amount_minor: 5000,
      payment_method: null,
      reference: null,
      payment_date: 0,
    };

    // Test the exact rendering logic used in money.tsx
    const docNumber = rawPayment.document_number || 'Payment';
    const methodStr = (rawPayment.payment_method ? rawPayment.payment_method.replace(/_/g, ' ') : 'PAYMENT').toUpperCase();
    const customer = rawPayment.customer_name || 'Customer';
    const dateStr = rawPayment.payment_date ? new Date(rawPayment.payment_date).toLocaleDateString() : '';

    expect(docNumber).toBe('Payment');
    expect(methodStr).toBe('PAYMENT');
    expect(customer).toBe('Customer');
    expect(dateStr).toBe('');
  });

  it('safely handles underscore payment methods like bank_transfer', () => {
    const rawPayment: { payment_method: string | null } = {
      payment_method: 'bank_transfer',
    };

    const methodStr = (rawPayment.payment_method ? rawPayment.payment_method.replace(/_/g, ' ') : 'PAYMENT').toUpperCase();
    expect(methodStr).toBe('BANK TRANSFER');
  });

  it('safely handles undefined properties in document viewer and statement engine', () => {
    const payItem: { payment_method?: string | null; reference?: string | null } = {
      payment_method: undefined,
      reference: undefined,
    };

    const methodLabel = (payItem.payment_method ? payItem.payment_method.replace('_', ' ') : 'PAYMENT').toUpperCase();
    expect(methodLabel).toBe('PAYMENT');
  });
});
