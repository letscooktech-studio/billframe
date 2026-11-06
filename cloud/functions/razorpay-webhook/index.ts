/**
 * RAZORPAY WEBHOOK SERVER-SIDE EDGE FUNCTION (SUPABASE / DENO)
 * 
 * Verifies HMAC-SHA256 signature against server-side secret (NEVER present on mobile).
 * Defends against replay attacks with atomic event_id idempotency checks.
 * Updates payment_requests status in PostgreSQL and emits notifications.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const GLOBAL_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Computes HMAC-SHA256 hex string using Web Crypto API.
 */
async function computeHmacSha256(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time comparison to prevent timing leak attacks.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const signatureHeader = req.headers.get('x-razorpay-signature');
  if (!signatureHeader) {
    return new Response(JSON.stringify({ error: 'Missing webhook signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();

  try {
    const payload = JSON.parse(rawBody);
    const eventId = payload.id;
    const eventType = payload.event;
    const accountId = payload.account_id; // Razorpay Connected Account ID if Route/Partner

    if (!eventId || !eventType) {
      return new Response(JSON.stringify({ error: 'Invalid payload structure' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Resolve merchant secret: check merchant-specific webhook secret or global partner secret
    let webhookSecret = GLOBAL_WEBHOOK_SECRET;
    let businessId: string | null = null;

    if (accountId) {
      const { data: merchant } = await supabase
        .from('connected_merchants')
        .select('business_id, webhook_secret')
        .eq('gateway_account_id', accountId)
        .maybeSingle();

      if (merchant) {
        businessId = merchant.business_id;
        if (merchant.webhook_secret) {
          webhookSecret = merchant.webhook_secret;
        }
      }
    }

    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: 'Webhook secret not configured on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Cryptographic signature verification
    const expectedSignature = await computeHmacSha256(rawBody, webhookSecret);
    const isValidSignature = constantTimeEqual(expectedSignature, signatureHeader.trim());

    if (!isValidSignature) {
      console.error(`Invalid webhook signature for event ${eventId}`);
      return new Response(JSON.stringify({ error: 'Signature verification failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Replay attack defense: check if eventId was already processed
    const { data: existingEvent } = await supabase
      .from('payment_events')
      .select('id, processed_status')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      // Idempotent success response for already received event
      return new Response(JSON.stringify({ message: 'Event already processed', eventId }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Extract payment details based on event type
    let paymentLinkId: string | null = null;
    let providerPaymentId: string | null = null;
    let amountMinor: number = 0;
    let currency: string = 'INR';

    if (eventType === 'payment_link.paid') {
      const plink = payload.payload?.payment_link?.entity;
      const payment = payload.payload?.payment?.entity;
      paymentLinkId = plink?.id || null;
      providerPaymentId = payment?.id || null;
      amountMinor = Number(plink?.amount_paid || plink?.amount || 0);
      currency = (plink?.currency || 'INR').toUpperCase();
    } else if (eventType === 'payment.captured') {
      const payment = payload.payload?.payment?.entity;
      providerPaymentId = payment?.id || null;
      amountMinor = Number(payment?.amount || 0);
      currency = (payment?.currency || 'INR').toUpperCase();
      paymentLinkId = payment?.notes?.payment_link_id || null;
    }

    // 5. Atomic persistence: first attempt database-level atomic stored procedure
    const { data: rpcData, error: rpcError } = await supabase.rpc('process_payment_webhook', {
      p_event_id: eventId,
      p_event_type: eventType,
      p_provider: 'razorpay',
      p_provider_payment_id: providerPaymentId,
      p_amount_minor: amountMinor,
      p_currency: currency,
      p_payload: payload,
      p_signature: signatureHeader,
      p_payment_link_id: paymentLinkId,
      p_business_id: businessId,
    });

    if (!rpcError && rpcData) {
      if (rpcData.status === 'already_processed') {
        return new Response(JSON.stringify({ message: 'Event already processed', eventId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, eventId, status: rpcData.status }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fallback: If stored procedure is unavailable, perform atomic ON CONFLICT insert with explicit error boundary
    const { error: insertError } = await supabase
      .from('payment_events')
      .insert({
        business_id: businessId,
        event_id: eventId,
        event_type: eventType,
        provider: 'razorpay',
        provider_payment_id: providerPaymentId,
        amount_minor: amountMinor,
        currency,
        payload,
        signature: signatureHeader,
        is_verified: true,
        processed_status: 'processed',
        processed_at: new Date().toISOString(),
      });

    if (insertError) {
      // Postgres error code 23505 indicates unique_violation on event_id
      if (insertError.code === '23505' || insertError.message?.includes('duplicate key') || insertError.message?.includes('already exists')) {
        return new Response(JSON.stringify({ message: 'Event already processed', eventId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error(`Database error inserting payment_event ${eventId}:`, insertError);
      throw insertError;
    }

    // 6. Update payment_request status if linked with explicit error checking
    if (paymentLinkId) {
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
          metadata: {
            providerPaymentId,
            paidAt: new Date().toISOString(),
          },
        })
        .eq('provider_reference_id', paymentLinkId);

      if (updateError) {
        console.error(`Failed to update payment_request status for link ${paymentLinkId}:`, updateError);
        throw updateError;
      }
    }

    return new Response(JSON.stringify({ success: true, eventId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook execution failure:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
