/**
 * ZOD DOMAIN SCHEMAS
 * Input validation contracts for business entities, customers, catalog items, and payments.
 */

import { z } from 'zod';

export const BusinessProfileSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Business name is required').max(100),
  legalName: z.string().max(100).optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  addressLine1: z.string().max(150).optional().nullable(),
  addressLine2: z.string().max(150).optional().nullable(),
  city: z.string().max(50).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().min(2).max(3).default('US'),
  logoUri: z.string().optional().nullable(),
  defaultCurrency: z.string().min(3).max(3).default('USD'),
  defaultDocumentLocale: z.string().min(2).max(10).default('en-US'),
  defaultPaymentTerms: z.string().max(200).optional().nullable(),
  defaultNotes: z.string().max(500).optional().nullable(),
});

export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Customer name is required').max(100),
  businessName: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  billingAddress: z.string().max(300).optional().nullable(),
  shippingAddress: z.string().max(300).optional().nullable(),
  country: z.string().max(50).optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const CatalogItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Item name is required').max(100),
  description: z.string().max(300).optional().nullable(),
  unitPriceDecimal: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid price format'),
  currency: z.string().min(3).max(3).default('USD'),
  unitName: z.string().min(1).max(20).default('item'),
  defaultTaxRateBp: z.number().int().min(0).max(10000).default(0),
});

export const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  invoiceId: z.string().min(1, 'Invoice reference required'),
  amountDecimal: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Invalid payment amount'),
  paymentDate: z.number().int().positive(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other']),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});
