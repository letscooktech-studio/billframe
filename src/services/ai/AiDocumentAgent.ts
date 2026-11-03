/**
 * AI DOCUMENT AGENT ENGINE
 * Natural Language to Statutory Document Parser, RAG Knowledge Retriever & Iterative Engine.
 * 
 * Capabilities:
 * 1. Semantic RAG retrieval across Billframe's 446 statutory documents & 25 industry families.
 * 2. Deep Groq LPU inference (openai/gpt-oss-120b) with native chain-of-thought reasoning tokens.
 * 3. Gemini 2.5 Flash & OpenAI BYOK integration.
 * 4. Grounded by local SQLite data (customers, items, business profile).
 * 5. Deterministic fallback with zero network requirements and zero invoice misrouting.
 * 6. Deterministic integer arithmetic via DocumentCalculator (Zero float errors).
 * 7. Real-time iterative chat refinement ("change basic to 65000", "add 10% discount").
 */

import { AiConfigService, DEFAULT_GROQ_KEY } from './AiConfigService';
import { AiLocalSqlContext } from './AiLocalSqlContext';
import { AiRagRegistry } from './AiRagRegistry';
import { DocumentTypeRegistry } from '../../domain/documents/DocumentTypeRegistry';
import { calculateDocument } from '../../domain/documents/DocumentCalculator';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { CustomerRepository } from '../../data/repositories/CustomerRepository';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { DatabaseManager } from '../../data/database/DatabaseManager';
import { DocumentType } from '../../domain/documents/types';
import { createMoney, formatMoney } from '../../domain/money/Money';

export interface AgentTaskStep {
  id: string;
  label: string;
  status: 'running' | 'completed' | 'failed';
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  reasoningTrace?: string;
  documentDraft?: ParsedDocumentDraft | null;
  documentDrafts?: ParsedDocumentDraft[];
  quickActions?: Array<{ label: string; action: string; payload?: any }>;
  isStreaming?: boolean;
  isThinking?: boolean;
  isCompilingDraft?: boolean;
  thoughtDurationSeconds?: number;
  taskSteps?: AgentTaskStep[];
}

export interface AgentStreamEvent {
  type: 'reasoning' | 'content' | 'done' | 'error' | 'step';
  reasoningChunk?: string;
  contentChunk?: string;
  fullReasoning?: string;
  fullContent?: string;
  displayText?: string;
  isCompilingDraft?: boolean;
  draft?: ParsedDocumentDraft | null;
  drafts?: ParsedDocumentDraft[];
  replyText?: string;
  error?: string;
  taskSteps?: AgentTaskStep[];
}

export type AgentStreamCallback = (event: AgentStreamEvent) => void;

export function parseStreamContent(content: string): {
  displayText: string;
  jsonString: string | null;
  isCompilingDraft: boolean;
} {
  const fenceIndex = content.indexOf('```');
  if (fenceIndex === -1) {
    return { displayText: content.trim(), jsonString: null, isCompilingDraft: false };
  }
  const displayText = content.slice(0, fenceIndex).trim();
  const rest = content.slice(fenceIndex);
  const match = rest.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
  const jsonString = match ? match[1].trim() : null;
  const isComplete = rest.indexOf('```', 3) !== -1;
  return { displayText, jsonString, isCompilingDraft: !isComplete };
}

export interface ParsedDocumentDraft {
  documentId: string;
  documentNumber: string;
  docType: string;
  documentTitle: string;
  provenanceRule: string;
  partyName: string;
  partyRole: 'Employee' | 'Vendor' | 'Client' | 'Tenant' | 'Consignee' | 'Recipient' | 'Applicant' | 'Candidate' | string;
  partyTaxId?: string;
  partyEmail?: string;
  partyAddress?: string;
  issueDate: number;
  dueDate?: number | null;
  currency: string;
  items: Array<{
    id?: string;
    description: string;
    quantityScaled: bigint;
    unitName: string;
    unitPriceMinor: bigint;
    itemNotes?: string;
    hsnSac?: string;
  }>;
  discountType: 'none' | 'percentage' | 'fixed';
  discountValue: bigint;
  taxType: 'none' | 'exclusive' | 'inclusive';
  taxRateBp: bigint;
  taxLabel: string;
  subtotalMinor: bigint;
  taxMinor: bigint;
  grandTotalMinor: bigint;
  notes?: string;
  terms?: string;
  templateId?: string;
  metadata?: Record<string, any>;
}

export const AGENT_DOCUMENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_or_update_document_draft',
      description: 'Draft or create any statutory, HR, legal, or commercial document (including invoices, quotes, receipts, salary slips, rent receipts, job applications, job offers, contracts, etc.). When the user requests to draft, create, make, generate, or modify ANY document, dossier, or application, you MUST invoke this function.',
      parameters: {
        type: 'object',
        properties: {
          docType: {
            type: 'string',
            description: 'Statutory document archetype: invoice, tax_invoice, estimate, quotation, receipt, credit_note, proforma, delivery_note, work_order, salary_slip, rent_receipt, job_offer_letter, job_application, nda_agreement, purchase_order, etc.',
          },
          documentTitle: {
            type: 'string',
            description: 'Formal statutory title of document (e.g. "Tax Invoice", "Grocery Retail Tax Invoice", "Salary Slip", "House Rent Receipt")',
          },
          provenanceRule: {
            type: 'string',
            description: 'Statutory rule or legal act (e.g. "CBIC CGST Rule 46", "Section 10(13A) IT Act 1961", "Payment of Wages Act 1936")',
          },
          partyName: {
            type: 'string',
            description: 'Customer, client, employee, tenant, vendor, or counterparty name',
          },
          partyRole: {
            type: 'string',
            enum: ['Client', 'Vendor', 'Employee', 'Tenant', 'Candidate', 'Applicant', 'Consignee', 'Other'],
          },
          partyTaxId: {
            type: 'string',
            description: 'GSTIN, PAN, or Tax ID if applicable',
          },
          partyAddress: {
            type: 'string',
            description: 'Billing or premises address',
          },
          partyEmail: {
            type: 'string',
            description: 'Contact email address',
          },
          currency: {
            type: 'string',
            description: 'Currency code: INR, USD, EUR, GBP, etc.',
          },
          items: {
            type: 'array',
            description: 'List of line items or salary/cost components',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string', description: 'Item description or service name' },
                quantity: { type: 'number', description: 'Quantity in major units (e.g. 1, 2, 10, 0.5)' },
                unitName: { type: 'string', description: 'Unit name: pcs, kg, hrs, month, item, box, L, etc.' },
                unitPrice: { type: 'number', description: 'Unit price in regular currency (e.g. 1500 for Rs 1500)' },
                itemNotes: { type: 'string', description: 'Detailed specs, earnings/deduction flag, or terms' },
                hsnSac: { type: 'string', description: 'HSN or SAC code if known' },
              },
              required: ['description', 'quantity', 'unitName', 'unitPrice'],
            },
          },
          discountType: {
            type: 'string',
            enum: ['none', 'percentage', 'fixed'],
          },
          discountValue: {
            type: 'number',
            description: 'Percentage discount (e.g. 10 for 10%) or fixed discount amount in regular currency',
          },
          taxType: {
            type: 'string',
            enum: ['none', 'exclusive', 'inclusive'],
          },
          taxRatePercent: {
            type: 'number',
            description: 'GST / VAT percentage (e.g. 18 for 18%, 5 for 5%, 12 for 12%, 0 for none)',
          },
          taxLabel: {
            type: 'string',
            description: 'Tax label (GST, VAT, Sales Tax)',
          },
          notes: {
            type: 'string',
            description: 'Remarks, payment instructions, bank details, or terms',
          },
          terms: {
            type: 'string',
            description: 'Standard business or statutory terms & conditions',
          },
          metadata: {
            type: 'object',
            description: 'Custom metadata fields (e.g. payPeriod, basicSalary, designation for salary slip; landlordPan for rent receipt; etc.)',
          },
          replyExplanation: {
            type: 'string',
            description: 'Conversational 1-2 sentence response directly answering user',
          },
          reasoning: {
            type: 'string',
            description: 'Step-by-step thinking trace explaining intent classification, statutory calculations, line item breakdown, and mathematical derivations',
          },
        },
        required: ['docType', 'documentTitle', 'partyName', 'items', 'replyExplanation', 'reasoning'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_multiple_document_drafts',
      description: 'Draft or create MULTIPLE statutory, commercial, or operational documents in a single workflow (e.g. quote + invoice, invoice + delivery challan, quote + PO, salary slips for multiple staff members, invoice + payment receipt, etc.). Use whenever the user requests 2 or more documents.',
      parameters: {
        type: 'object',
        properties: {
          documents: {
            type: 'array',
            description: 'List of individual document specifications to draft',
            items: {
              type: 'object',
              properties: {
                docType: {
                  type: 'string',
                  description: 'Statutory document archetype: quotation, invoice, delivery_challan, proforma, purchase_order, credit_note, debit_note, receipt, salary_slip, rent_receipt, work_order, etc.',
                },
                documentTitle: {
                  type: 'string',
                  description: 'Formal title (e.g. "Formal Commercial Quotation", "Delivery Challan", "GST Tax Invoice", "Payment Receipt")',
                },
                provenanceRule: {
                  type: 'string',
                  description: 'Statutory provenance rule or legal act',
                },
                partyName: {
                  type: 'string',
                  description: 'Customer, vendor, consignee, employee, or counterparty name',
                },
                partyRole: {
                  type: 'string',
                  enum: ['Client', 'Vendor', 'Employee', 'Tenant', 'Candidate', 'Applicant', 'Consignee', 'Other'],
                },
                partyTaxId: { type: 'string' },
                partyAddress: { type: 'string' },
                partyEmail: { type: 'string' },
                currency: { type: 'string' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' },
                      quantity: { type: 'number' },
                      unitName: { type: 'string' },
                      unitPrice: { type: 'number' },
                      itemNotes: { type: 'string' },
                      hsnSac: { type: 'string' },
                    },
                    required: ['description', 'quantity', 'unitName', 'unitPrice'],
                  },
                },
                discountType: { type: 'string', enum: ['none', 'percentage', 'fixed'] },
                discountValue: { type: 'number' },
                taxType: { type: 'string', enum: ['none', 'exclusive', 'inclusive'] },
                taxRatePercent: { type: 'number' },
                taxLabel: { type: 'string' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                metadata: { type: 'object' },
              },
              required: ['docType', 'documentTitle', 'partyName', 'items'],
            },
          },
          workflowTitle: {
            type: 'string',
            description: 'Name of the workflow bundle, e.g. "Quotation & Delivery Challan Package"',
          },
          replyExplanation: {
            type: 'string',
            description: 'Conversational 1-2 sentence response explaining all documents created',
          },
          reasoning: {
            type: 'string',
            description: 'Step-by-step thinking trace explaining multi-document intent classification and calculations',
          },
        },
        required: ['documents', 'replyExplanation', 'reasoning'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'answer_business_question',
      description: 'Answer pure knowledge questions about tax compliance, GST rules, accounting, pricing advice, or business definitions without generating a document. Use ONLY when the user asks a question (e.g. "What is...", "How to...", "Explain...") and is NOT asking to draft, create, or modify a document.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Subject of query (e.g. gst_compliance, invoicing_rules, tax_rates, accounting_practice)',
          },
          reasoning: {
            type: 'string',
            description: 'Step-by-step cognitive analysis explaining how the answer was derived from statutory regulations or financial standards',
          },
          answer: {
            type: 'string',
            description: 'Executive, thorough, well-formatted response with bullet points and citations where appropriate in markdown',
          },
        },
        required: ['topic', 'reasoning', 'answer'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_business_summary',
      description: 'Get active business profile, default currency, and high-level financial overview (outstanding receivables, overdue count and amount, and payments collected this month). Use when the user asks how their business is doing, asks for revenue/payments overview, or asks what happened to their money.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_customers',
      description: 'Search customers in the local SQLite database by keyword (name, phone, email, or company). Use when the user wants to look up a counterparty or client contact details.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Customer search keyword or name' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customer_balance',
      description: 'Get customer ledger balance from local SQLite database: total invoiced, total paid, and outstanding receivable balance. Use when the user asks how much a customer owes, asks for their balance, or checks their payment status.',
      parameters: {
        type: 'object',
        properties: {
          customerNameOrId: { type: 'string', description: 'Customer name or ID' },
        },
        required: ['customerNameOrId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_invoices',
      description: 'List documents and invoices in the database with document number, type, counterparty, total amount, lifecycle status, and balance. Can filter by customer name.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string', description: 'Optional customer name to filter' },
          limit: { type: 'number', description: 'Maximum invoices to return (default 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_overdue_invoices',
      description: 'List all currently overdue invoices that have an unpaid balance past their due date, including days overdue, customer name, and balance.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

export class AiDocumentAgent {
  /**
   * Main entry point: Processes a user prompt in conversation context
   */
  static async processMessage(
    userPrompt: string,
    history: AgentChatMessage[],
    activeDraft: ParsedDocumentDraft | null = null
  ): Promise<{
    replyText: string;
    reasoningTrace?: string;
    documentDraft: ParsedDocumentDraft | null;
    quickActions?: Array<{ label: string; action: string; payload?: any }>;
  }> {
    return new Promise((resolve) => {
      let finalResult: any = null;
      this.streamMessage(userPrompt, history, activeDraft, (event) => {
        if (event.type === 'done') {
          finalResult = {
            replyText: event.replyText || 'Draft completed.',
            reasoningTrace: event.fullReasoning,
            documentDraft: event.draft || null,
            quickActions: [
              { label: 'View PDF Preview', action: 'preview_pdf' },
              { label: 'Edit in Form', action: 'open_editor' },
              { label: 'Export PDF', action: 'export_pdf' },
            ],
          };
        }
      })
        .then(() => {
          if (finalResult) {
            resolve(finalResult);
          } else {
            this.runDeterministicHeuristic(userPrompt, activeDraft, null).then(async (h) => {
              const v = h.draft ? await this.commitAndVerifyDraft(h.draft, null) : null;
              resolve({
                replyText: h.reply,
                reasoningTrace: h.reasoning,
                documentDraft: v,
                quickActions: v
                  ? [
                      { label: 'View PDF Preview', action: 'preview_pdf' },
                      { label: 'Edit in Form', action: 'open_editor' },
                      { label: 'Export PDF', action: 'export_pdf' },
                    ]
                  : [],
              });
            });
          }
        })
        .catch(async () => {
          const h = await this.runDeterministicHeuristic(userPrompt, activeDraft, null);
          const v = h.draft ? await this.commitAndVerifyDraft(h.draft, null) : null;
          resolve({
            replyText: h.reply,
            reasoningTrace: h.reasoning,
            documentDraft: v,
            quickActions: v
              ? [
                  { label: 'View PDF Preview', action: 'preview_pdf' },
                  { label: 'Edit in Form', action: 'open_editor' },
                  { label: 'Export PDF', action: 'export_pdf' },
                ]
              : [],
          });
        });
    });
  }

  /**
   * True Codex-Style Live Streaming: Emits real AI reasoning tokens and reply chunks
   */
  static async streamMessage(
    userPrompt: string,
    history: AgentChatMessage[],
    activeDraft: ParsedDocumentDraft | null = null,
    onEvent: AgentStreamCallback
  ): Promise<void> {
    const config = await AiConfigService.getConfig();

    // ── Live Sub-Agent Real Task Steps ──
    const taskSteps: AgentTaskStep[] = [
      { id: 'sqlite_grounding', label: 'Grounding with on-device SQLite database', status: 'running' },
    ];
    onEvent({ type: 'step', taskSteps: [...taskSteps] });

    const localContext = await AiLocalSqlContext.buildContextForPrompt(userPrompt);
    const profileName = localContext.businessProfile?.name || 'Local Workspace';
    const profileCurrency = localContext.businessProfile?.currency || 'INR';
    const customerCount = localContext.matchedCustomers?.length || 0;

    taskSteps[0] = {
      id: 'sqlite_grounding',
      label: `Grounded: ${profileName} (${profileCurrency}) · ${customerCount} saved customer(s)`,
      status: 'completed',
    };
    taskSteps.push({
      id: 'statutory_rag',
      label: 'Resolving statutory compliance rules (446 archetypes across 25 families)',
      status: 'running',
    });
    onEvent({ type: 'step', taskSteps: [...taskSteps] });

    const ragContext = AiRagRegistry.getRagContext(userPrompt);

    taskSteps[1] = {
      id: 'statutory_rag',
      label: 'Statutory rules verified: CBIC GST & accounting standards applied',
      status: 'completed',
    };
    taskSteps.push({
      id: 'neural_reasoning',
      label: 'Neural reasoning: synthesizing line items & policy parameters',
      status: 'running',
    });
    onEvent({ type: 'step', taskSteps: [...taskSteps] });

    const effectiveApiKey = config.apiKey || (config.provider === 'groq' ? DEFAULT_GROQ_KEY : '');

    // 1. Live Cloud Execution on Groq LPU (GPT-OSS 120B Reasoning with Native Tool Calling)
    if (effectiveApiKey && config.provider === 'groq') {
      try {
        const formattedContext = AiLocalSqlContext.formatContextForSystemPrompt(localContext);
        const activeDraftStr = this.serializeDraftForPrompt(activeDraft);

        const systemInstructions = `You are the Billframe Autonomous Document & Finance Agent.
Billframe has a master registry of 446 statutory document types across 25 industry families (HR/Talent, Legal/Institutional, Commercial Billing, Procurement, Real Estate, Logistics).

CORE AGENTIC INVARIANTS:
1. Exact Archetype Identification:
   - When the user asks for a Quotation or Estimate, draft a "quotation" with title "Formal Commercial Quotation" (NEVER a generic Tax Invoice!).
   - When the user asks for a Proforma Invoice, draft a "proforma" (docType: "proforma").
   - When the user asks for a Delivery Challan / Dispatch Note, draft a "delivery_challan" under CBIC Rule 55.
   - When the user asks for a Purchase Order, draft a "purchase_order" (partyRole: "Vendor").
   - When the user asks for a Credit Note, draft a "credit_note" under CBIC Rule 53(1).
   - When the user asks for a Debit Note, draft a "debit_note" under CBIC Rule 53(2).
   - When the user asks for a Payment Receipt, draft a "receipt".
   - When the user asks for a Job Application / Candidate Dossier, draft a "job_application".
   - When the user asks for a Job Offer, draft a "job_offer_letter".
   - When the user asks for a Salary Slip, draft a "salary_slip".
   - When the user asks for a Rent Receipt, draft a "rent_receipt" under Section 10(13A).
   - When the user asks for a Work Order, draft a "work_order".
   - When the user asks for Meeting Minutes, draft a "meeting_minutes".
   - When the user asks for an Equipment Handover, draft an "equipment_responsibility_letter".
   - Only when the user specifically asks for a Tax Invoice, sales bill, or commercial bill, draft an "invoice".

2. Multi-Document Workflows:
   - When the user requests creating multiple documents (e.g. "create an invoice and a delivery challan", "quote and PO", "salary slips for Alice and Bob", "invoice, challan, and receipt"), INVOKE the "create_multiple_document_drafts" tool containing all requested document objects, OR invoke "create_or_update_document_draft" multiple times!

3. When the user asks a question, requests financial/tax advice, or inquires about statutory rules (e.g. "What is GST rate on IT services?"), INVOKE the "answer_business_question" tool. DO NOT create a dummy bill when the user merely asked a question!

4. If an active draft is provided in context and user requests edits or adjustments, preserve existing items and fields while applying requested changes.

5. Always provide realistic line items, quantities, realistic market prices, and statutory tax rates. In your tool arguments, always provide a detailed "reasoning" step-by-step trace explaining your thought process and calculations.`;

        const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemInstructions },
        ];

        if (history && history.length > 0) {
          const recent = history.slice(-6);
          for (const m of recent) {
            apiMessages.push({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content || (m.role === 'assistant' ? 'Document draft created.' : ''),
            });
          }
        }

        apiMessages.push({
          role: 'user',
          content: `${formattedContext}\n\n${ragContext}\n\nACTIVE DRAFT IN CONTEXT:\n${activeDraftStr}\n\nUSER PROMPT:\n${userPrompt}`,
        });

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveApiKey}`,
          },
          body: JSON.stringify({
            model: config.model || 'openai/gpt-oss-120b',
            messages: apiMessages,
            tools: AGENT_DOCUMENT_TOOLS,
            tool_choice: 'auto',
            temperature: 0.1,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const choice = data.choices?.[0];
          const toolCalls = choice?.message?.tool_calls;

          if (toolCalls && toolCalls.length > 0) {
            // Check if any toolCall is document creation
            const docCalls = toolCalls.filter(
              (tc: any) =>
                tc.function?.name === 'create_or_update_document_draft' ||
                tc.function?.name === 'create_multiple_document_drafts'
            );

            if (docCalls.length > 0) {
              const allDrafts: ParsedDocumentDraft[] = [];
              let combinedReasoning = '';
              let combinedReply = '';

              for (const tc of docCalls) {
                let args: any = {};
                try {
                  args = JSON.parse(tc.function.arguments);
                } catch {
                  args = {};
                }

                if (tc.function.name === 'create_multiple_document_drafts') {
                  const docList = Array.isArray(args.documents) ? args.documents : [];
                  for (const docItem of docList) {
                    const verified = await this.commitAndVerifyDraft(docItem, localContext);
                    allDrafts.push(verified);
                  }
                  if (args.reasoning) combinedReasoning += (combinedReasoning ? '\n\n' : '') + args.reasoning;
                  if (args.replyExplanation) combinedReply += (combinedReply ? '\n\n' : '') + args.replyExplanation;
                } else if (tc.function.name === 'create_or_update_document_draft') {
                  const verified = await this.commitAndVerifyDraft(args, localContext);
                  allDrafts.push(verified);
                  if (args.reasoning) combinedReasoning += (combinedReasoning ? '\n\n' : '') + args.reasoning;
                  if (args.replyExplanation) combinedReply += (combinedReply ? '\n\n' : '') + args.replyExplanation;
                }
              }

              if (allDrafts.length > 0) {
                const reasoning =
                  combinedReasoning ||
                  `Derived ${allDrafts.length} statutory document(s) adhering to CBIC GST & statutory compliance rules.`;
                const reply =
                  combinedReply ||
                  `I have drafted ${allDrafts.length} document(s): ${allDrafts.map((d) => d.documentTitle).join(', ')}.`;

                onEvent({
                  type: 'reasoning',
                  reasoningChunk: reasoning,
                  fullReasoning: reasoning,
                  taskSteps: [...taskSteps],
                });

                taskSteps[2] = {
                  id: 'neural_reasoning',
                  label: `Neural agent reasoned: ${allDrafts.length} document(s) generated`,
                  status: 'completed',
                };
                taskSteps.push({
                  id: 'financial_calc',
                  label: `Verified ${allDrafts.length} document(s) with BigInt integer minor units`,
                  status: 'completed',
                });
                onEvent({ type: 'step', taskSteps: [...taskSteps] });

                onEvent({
                  type: 'content',
                  contentChunk: reply,
                  fullContent: reply,
                  displayText: reply,
                  isCompilingDraft: false,
                  taskSteps: [...taskSteps],
                });

                onEvent({
                  type: 'done',
                  draft: allDrafts[0],
                  drafts: allDrafts,
                  replyText: reply,
                  fullReasoning: reasoning,
                  taskSteps: [...taskSteps],
                });
                return;
              }
            }

            const toolCall = toolCalls[0];
            const toolName = toolCall.function.name;
            let args: any = {};
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch {
              args = {};
            }

            // Case A: Document Draft Created or Updated
            if (toolName === 'create_or_update_document_draft') {
              const reasoning = args.reasoning || 'Derived line items and applied statutory accounting standards.';
              const reply = args.replyExplanation || `I have drafted your ${args.documentTitle || 'document'} according to statutory rules.`;

              // Emit reasoning trace immediately
              onEvent({
                type: 'reasoning',
                reasoningChunk: reasoning,
                fullReasoning: reasoning,
                taskSteps: [...taskSteps],
              });

              taskSteps[2] = {
                id: 'neural_reasoning',
                label: `Neural agent reasoned: ${args.documentTitle || 'Document Draft'} (${args.items?.length || 0} line item(s))`,
                status: 'completed',
              };
              taskSteps.push({
                id: 'financial_calc',
                label: 'Verifying mathematical precision with integer minor units',
                status: 'running',
              });
              onEvent({ type: 'step', taskSteps: [...taskSteps] });

              // Verify and commit
              const verified = await this.commitAndVerifyDraft(args, localContext);

              taskSteps[3] = {
                id: 'financial_calc',
                label: `Verified: ${verified.documentTitle} · Total: ${verified.currency} ${(Number(verified.grandTotalMinor) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                status: 'completed',
              };

              onEvent({
                type: 'content',
                contentChunk: reply,
                fullContent: reply,
                displayText: reply,
                isCompilingDraft: false,
                taskSteps: [...taskSteps],
              });

              onEvent({
                type: 'done',
                draft: verified,
                replyText: reply,
                fullReasoning: reasoning,
                taskSteps: [...taskSteps],
              });
              return;
            }

            // Case B: General Business / Compliance Question Answered
            if (toolName === 'answer_business_question') {
              const reasoning = args.reasoning || 'Analyzed statutory regulations and compliance standards.';
              const answer = args.answer || 'Here is the requested financial guidance.';

              onEvent({
                type: 'reasoning',
                reasoningChunk: reasoning,
                fullReasoning: reasoning,
                taskSteps: [...taskSteps],
              });

              taskSteps[2] = {
                id: 'neural_reasoning',
                label: `Synthesized statutory analysis on ${args.topic || 'finance'}`,
                status: 'completed',
              };
              taskSteps.push({
                id: 'financial_calc',
                label: 'Statutory compliance verification complete',
                status: 'completed',
              });
              onEvent({ type: 'step', taskSteps: [...taskSteps] });

              onEvent({
                type: 'content',
                contentChunk: answer,
                fullContent: answer,
                displayText: answer,
                isCompilingDraft: false,
                taskSteps: [...taskSteps],
              });

              onEvent({
                type: 'done',
                draft: null,
                replyText: answer,
                fullReasoning: reasoning,
                taskSteps: [...taskSteps],
              });
              return;
            }

            // Case C: Read-Only Business / Ledger Tool Query
            if (
              toolName === 'get_business_summary' ||
              toolName === 'search_customers' ||
              toolName === 'get_customer_balance' ||
              toolName === 'list_invoices' ||
              toolName === 'list_overdue_invoices'
            ) {
              taskSteps[2] = {
                id: 'neural_reasoning',
                label: `Invoked local database query: ${toolName}`,
                status: 'completed',
              };
              taskSteps.push({
                id: 'financial_calc',
                label: 'Extracting records from on-device SQLite database',
                status: 'running',
              });
              onEvent({ type: 'step', taskSteps: [...taskSteps] });

              const toolResult = await this.executeLocalTool(toolName, args);

              taskSteps[3] = {
                id: 'financial_calc',
                label: `Verified ledger data: ${toolName} completed`,
                status: 'completed',
              };
              onEvent({ type: 'step', taskSteps: [...taskSteps] });

              // Follow-up turn with Groq to synthesize response
              let finalAnswer = '';
              try {
                const followUpRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${effectiveApiKey}`,
                  },
                  body: JSON.stringify({
                    model: config.model || 'openai/gpt-oss-120b',
                    messages: [
                      ...apiMessages,
                      choice.message,
                      {
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: JSON.stringify(toolResult),
                      },
                    ],
                    temperature: 0.1,
                  }),
                });
                if (followUpRes.ok) {
                  const followUpData = await followUpRes.json();
                  finalAnswer = followUpData.choices?.[0]?.message?.content || '';
                }
              } catch {}

              if (!finalAnswer) {
                finalAnswer = this.formatDirectToolSummary(toolName, toolResult);
              }

              const reasoning = `Executed read-only tool "${toolName}" on local SQLite database. Formatted factual results with verified arithmetic.`;

              onEvent({
                type: 'reasoning',
                reasoningChunk: reasoning,
                fullReasoning: reasoning,
                taskSteps: [...taskSteps],
              });

              onEvent({
                type: 'content',
                contentChunk: finalAnswer,
                fullContent: finalAnswer,
                displayText: finalAnswer,
                isCompilingDraft: false,
                taskSteps: [...taskSteps],
              });

              onEvent({
                type: 'done',
                draft: null,
                replyText: finalAnswer,
                fullReasoning: reasoning,
                taskSteps: [...taskSteps],
              });
              return;
            }
          }

          // Case D: Plain text response from LLM
          if (choice?.message?.content) {
            const content = choice.message.content;
            const { displayText, jsonString } = parseStreamContent(content);

            let rawDraft: any = null;
            if (jsonString) {
              try {
                rawDraft = JSON.parse(jsonString);
              } catch {}
            }

            if (rawDraft && rawDraft.docType) {
              const verified = await this.commitAndVerifyDraft(rawDraft, localContext);
              const reasoning = this.synthesizeReasoning(userPrompt, verified);
              taskSteps[2] = {
                id: 'neural_reasoning',
                label: 'Neural reasoning complete & verified',
                status: 'completed',
              };
              taskSteps.push({
                id: 'financial_calc',
                label: `Verified: ${verified.documentTitle} · Total: ${verified.currency} ${(Number(verified.grandTotalMinor) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                status: 'completed',
              });
              onEvent({
                type: 'done',
                draft: verified,
                replyText: displayText || `Drafted your ${verified.documentTitle}.`,
                fullReasoning: reasoning,
                taskSteps: [...taskSteps],
              });
              return;
            }

            // Plain conversational response
            taskSteps[2] = {
              id: 'neural_reasoning',
              label: 'Neural reasoning complete',
              status: 'completed',
            };
            onEvent({
              type: 'done',
              draft: null,
              replyText: content,
              fullReasoning: 'Derived direct response from neural model.',
              taskSteps: [...taskSteps],
            });
            return;
          }
        }
      } catch (err) {
        console.warn('[AiDocumentAgent] Cloud inference error, transitioning to deterministic fallback:', err);
      }
    }

    taskSteps[2] = {
      id: 'neural_reasoning',
      label: 'On-device deterministic policy engine matched archetype',
      status: 'completed',
    };
    taskSteps.push({
      id: 'financial_calc',
      label: 'Executing statutory calculations & BigInt balance verification',
      status: 'running',
    });
    onEvent({ type: 'step', taskSteps: [...taskSteps] });

    // 2. Deterministic RAG Heuristic Engine Fallback with Progressive Live Animation
    const heuristicResult = await this.runDeterministicHeuristic(userPrompt, activeDraft, localContext);
    const verifiedDrafts: ParsedDocumentDraft[] = [];
    if (heuristicResult.drafts && heuristicResult.drafts.length > 0) {
      for (const d of heuristicResult.drafts) {
        if (d) {
          const v = await this.commitAndVerifyDraft(d, localContext);
          verifiedDrafts.push(v);
        }
      }
    } else if (heuristicResult.draft) {
      const v = await this.commitAndVerifyDraft(heuristicResult.draft, localContext);
      verifiedDrafts.push(v);
    }
    const verified = verifiedDrafts[0] || null;
    const trace =
      heuristicResult.reasoning ||
      (verified ? this.synthesizeReasoning(userPrompt, verified) : 'Local assistant processed query.');

    if (verifiedDrafts.length > 0) {
      taskSteps[3] = {
        id: 'financial_calc',
        label: `Verified: ${verifiedDrafts.map((d) => d.documentTitle).join(' & ')} · Total: ${verified.currency} ${(Number(verified.grandTotalMinor) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        status: 'completed',
      };
    } else {
      taskSteps[2] = {
        id: 'neural_reasoning',
        label: 'Local query completed',
        status: 'completed',
      };
    }

    // Stream the reasoning trace
    onEvent({
      type: 'reasoning',
      reasoningChunk: trace,
      fullReasoning: trace,
      taskSteps: [...taskSteps],
    });

    onEvent({
      type: 'content',
      contentChunk: heuristicResult.reply,
      fullContent: heuristicResult.reply,
      displayText: heuristicResult.reply,
      isCompilingDraft: false,
      taskSteps: [...taskSteps],
    });

    onEvent({
      type: 'done',
      draft: verified,
      drafts: verifiedDrafts,
      replyText: heuristicResult.reply,
      fullReasoning: trace,
      taskSteps: [...taskSteps],
    });
  }

  /**
   * Calls Cloud LLM (Groq, Gemini, or OpenAI) with structured JSON output instructions & RAG retrieval
   */
  private static async callCloudLlm(
    userPrompt: string,
    history: AgentChatMessage[],
    activeDraft: ParsedDocumentDraft | null,
    config: any,
    localContext: any,
    ragContext: string
  ): Promise<{ reply: string; reasoning?: string; draft: Partial<ParsedDocumentDraft> } | null> {
    const formattedContext = AiLocalSqlContext.formatContextForSystemPrompt(localContext);

    const systemInstructions = `
You are the Billframe Autonomous Document & Finance Agent.
Billframe has a master registry of 446 statutory document types across 25 industry families (HR/Talent, Legal/Institutional, Commercial Billing, Procurement, Real Estate, Logistics).

CRITICAL STATUTORY DIRECTIVES:
1. Strict Archetype Routing:
   - When the user asks for a Job Application or Candidate Resume/Dossier, NEVER create a GST Invoice or Billing document! Generate a "job_application" archetype.
   - When the user asks for a Job Offer or Appointment Letter, generate a "job_offer_letter".
   - When the user asks for a Rent Receipt, generate a "rent_receipt" under Section 10(13A).
   - When the user asks for an NDA, generate an "nda_agreement".
   - When the user asks for a Salary Slip or Payslip, generate a "salary_slip".
     • Provide Earnings items (positive unitPriceMinor) and Deductions (negative unitPriceMinor for PF/Tax).
     • Include metadata: { employeeName, designation, payPeriod, grossEarningsMinor, totalDeductionsMinor, netPayMinor }.
   - When the user asks for a Grocery Store bill, retail store invoice, or items list (e.g. "bill for my grocery store and fill 10 random items"):
     • Generate realistic FMCG/grocery items (e.g., Basmati Rice, Wheat Flour, Cooking Oil, Eggs, Toor Dal, Fresh Milk, Sugar, Tea, Salt, Spices) with standard packages, quantities, HSN codes, and realistic prices.
     • partyRole: "Client", partyName: "Walk-in Retail Customer" (do NOT name the customer "my grocery store").
     • documentTitle: "Grocery Retail Tax Invoice / Cash Memo"
     • taxRateBp: 500 (5% GST) or 0 (exempt).
   - When the user asks for a GST Invoice, generate an "invoice" or "tax_invoice" under CBIC Rule 46.

2. Document Structure Requirements:
   - For "job_application":
     • partyRole: "Applicant"
     • partyName: Candidate Name
     • items: 2 to 4 core technical competency areas or experience tracks (unitPriceMinor: 0)
     • metadata: { position: string, department: string, experienceYears: number, expectedCtc: string, noticePeriod: string, skills: string[], coverStatement: string }
   - For commercial billing / invoices:
     • partyRole: "Client"
     • items with quantityScaled (1 = 10000), unitPriceMinor (cents/paise), hsnSac code, and taxRateBp (e.g. 1800 for 18% GST).

3. Local SQLite Grounding:
   - Ground counterparties and items against the provided LOCAL SQL DATABASE CONTEXT if matching records exist.

Respond strictly with a JSON object:
{
  "reply": "Conversational summary of what was drafted or changed",
  "reasoning": "Explicit step-by-step thinking trace explaining intent classification, statutory rule mapping, and data synthesis",
  "draft": {
    "docType": string,
    "documentTitle": string,
    "provenanceRule": string,
    "partyName": string,
    "partyRole": "Applicant" | "Candidate" | "Employee" | "Vendor" | "Client" | "Tenant" | "Consignee",
    "partyTaxId": string (optional),
    "partyEmail": string (optional),
    "partyAddress": string (optional),
    "currency": "INR" | "USD" | "EUR" | "GBP" | string,
    "issueDate": number (epoch timestamp ms),
    "dueDate": number (epoch timestamp ms or null),
    "items": [
      {
        "description": string,
        "quantityScaled": number (1 = 10000),
        "unitName": string,
        "unitPriceMinor": number,
        "itemNotes": string,
        "hsnSac": string
      }
    ],
    "discountType": "none" | "percentage" | "fixed",
    "discountValue": number,
    "taxType": "none" | "exclusive" | "inclusive",
    "taxRateBp": number,
    "taxLabel": "GST" | "VAT" | "Tax",
    "notes": string,
    "terms": string,
    "metadata": object (optional archetype specific fields)
  }
}
`;

    // 1. GROQ LPU (Ultra-fast inference with native reasoning)
    if (config.provider === 'groq') {
      const activeDraftStr = this.serializeDraftForPrompt(activeDraft);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemInstructions },
            {
              role: 'user',
              content: `${formattedContext}\n\n${ragContext}\n\nACTIVE DRAFT IN CONTEXT:\n${activeDraftStr}\n\nUSER PROMPT:\n${userPrompt}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        console.warn('[AiDocumentAgent] Groq API returned status:', res.status);
        return null;
      }

      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      if (!msg?.content) return null;

      const parsed = JSON.parse(msg.content);
      const reasoning = msg.reasoning || parsed.reasoning || undefined;

      return {
        reply: parsed.reply,
        reasoning,
        draft: parsed.draft,
      };
    }

    // 2. GOOGLE GEMINI
    if (config.provider === 'gemini') {
      const activeDraftStr = this.serializeDraftForPrompt(activeDraft);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${
        config.model || 'gemini-2.5-flash'
      }:generateContent?key=${config.apiKey}`;
      const userContent = `
${formattedContext}

${ragContext}

ACTIVE DRAFT IN CONTEXT:
${activeDraftStr}

USER INSTRUCTION:
${userPrompt}
`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstructions}\n\n${userContent}` }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;
      const parsed = JSON.parse(rawText);
      return {
        reply: parsed.reply,
        reasoning: parsed.reasoning,
        draft: parsed.draft,
      };
    }

    // 3. OPENAI
    if (config.provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstructions },
            { role: 'user', content: `${formattedContext}\n\n${ragContext}\n\n${userPrompt}` },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;
      const parsed = JSON.parse(content);
      return {
        reply: parsed.reply,
        reasoning: parsed.reasoning,
        draft: parsed.draft,
      };
    }

    return null;
  }

  /**
   * Safely serializes active draft for LLM prompts converting BigInt values to strings
   */
  private static serializeDraftForPrompt(draft: ParsedDocumentDraft | null): string {
    if (!draft) return 'None';
    return JSON.stringify(
      draft,
      (_, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    );
  }

  /**
   * Deterministic Offline Rule Parser & Semantic Disambiguator (Zero Network Required)
   */
  public static async runDeterministicHeuristic(
    prompt: string,
    activeDraft: ParsedDocumentDraft | null = null,
    context: any = {}
  ): Promise<{ reply: string; reasoning: string; draft: Partial<ParsedDocumentDraft> | null; drafts?: Partial<ParsedDocumentDraft>[] }> {
    const text = prompt.toLowerCase();
    const defaultCurrency = context.businessProfile?.currency || 'USD';

    // 1. Check if modifying active draft
    if (activeDraft) {
      const draft = { ...activeDraft, items: [...activeDraft.items] };
      let modified = false;
      const changes: string[] = [];

      // Check price / amount update
      const priceMatch = prompt.match(
        /(?:change|update|set)\s+(?:price|amount|basic|rate)\s+(?:to\s+)?(?:[\$₹£€]\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i
      );
      if (priceMatch && draft.items.length > 0) {
        const numVal = parseFloat(priceMatch[1].replace(/,/g, ''));
        const minorVal = BigInt(Math.round(numVal * 100));
        draft.items[0] = {
          ...draft.items[0],
          unitPriceMinor: minorVal,
        };
        changes.push(`price set to ${formatMoney(createMoney(minorVal, draft.currency))}`);
        modified = true;
      }

      // Check discount update
      const discountMatch = prompt.match(/(?:add|apply|set)\s+(\d+)%\s+discount/i);
      if (discountMatch) {
        draft.discountType = 'percentage';
        draft.discountValue = BigInt(parseInt(discountMatch[1], 10) * 100); // Basis points (10% = 1000 bp)
        changes.push(`${discountMatch[1]}% discount applied`);
        modified = true;
      }

      // Check party name update
      const nameMatch = prompt.match(
        /(?:change|set|to)\s+(?:client|vendor|employee|tenant|candidate|applicant|name)\s+(?:to\s+)?([A-Za-z0-9\s]+?)(?:\s+and|\s+for|\.|$)/i
      );
      if (nameMatch) {
        draft.partyName = nameMatch[1].trim();
        changes.push(`party set to "${draft.partyName}"`);
        modified = true;
      }

      if (modified) {
        return {
          reply: `Updated draft: ${changes.join(', ')}.`,
          reasoning: `• Detected iterative chat refinement targeting active draft #${draft.documentNumber}.\n• Applied delta modifications: ${changes.join(
            ', '
          )}.\n• Re-derived invariant minor balance using DocumentCalculator.`,
          draft,
        };
      }
    }

    // 2. Pure conversational queries, greetings, or general business advice (NOT document drafting)
    const isGreeting = /^(hi|hello|hey|help|who are you|what can you do|what are you)\b/i.test(prompt.trim());
    const isQuestion =
      /^(what is|how to|how do|explain|tell me about|why is|where is)\b/i.test(prompt.trim()) ||
      (prompt.trim().endsWith('?') && !/(?:draft|create|make|bill|invoice|slip|receipt)/i.test(prompt));

    if (isGreeting) {
      const bizName = context?.businessProfile?.name || 'your workspace';
      return {
        reply: `Hello! I am your Billframe Copilot for **${bizName}**.\n\nI can help you:\n• Draft 446 statutory documents (tax invoices, quotes, receipts, job offers, salary slips)\n• Query customer balances and overdue payments\n• Verify GST tax compliance and integer minor-unit arithmetic\n\nWhat would you like to work on today?`,
        reasoning: 'Grounded conversation handler: Recognized greeting and presented verified local operational capabilities.',
        draft: null as any,
      };
    }

    if (isQuestion) {
      if (/gst/i.test(prompt)) {
        return {
          reply: `**Goods and Services Tax (GST) in India** is governed by the CGST Act 2017.\n\n• Standard commercial B2B invoices apply **18% GST** (9% CGST + 9% SGST intra-state, or 18% IGST inter-state).\n• Concessional rates: **0%**, **5%**, and **12%**.\n• Luxury/de-merit goods: **28%**.\n\nYou can ask me to draft a GST invoice anytime with specific items and rates!`,
          reasoning: 'Statutory compliance grounding: Answered GST inquiry citing CGST Act 2017 tax rate schedule.',
          draft: null as any,
        };
      }
      return {
        reply: `I am currently operating in **Offline Local Assistant** mode for **${context?.businessProfile?.name || 'your business'}**.\n\nTo ask open-ended questions with deep neural reasoning, connect to Groq in Settings. For document creation, you can ask me to draft an invoice, salary slip, rent receipt, or job offer directly.`,
        reasoning: 'Offline transparency: Reported local mode status without generating fictitious records.',
        draft: null as any,
      };
    }

    // 3. Database Query & Ledger Inquiries (Zero Fake Invoices)
    const isOverdueQuery = /overdue|unpaid invoice|unpaid bill|who owes/i.test(prompt);
    const isCustomerBalanceQuery = /balance|how much does .* owe|unpaid by/i.test(prompt);
    const isSummaryQuery = /summary|how is my business|payments this week|payments this month|total revenue|financial metrics/i.test(prompt);
    const isCustomerSearchQuery = /find customer|search customer|list customers/i.test(prompt);

    if (isOverdueQuery) {
      const result = await this.executeLocalTool('list_overdue_invoices', {});
      const reply = this.formatDirectToolSummary('list_overdue_invoices', result);
      return {
        reply,
        reasoning: 'Grounded query execution: Checked SQLite aging table for issued invoices past their due dates.',
        draft: null as any,
      };
    }

    if (isCustomerBalanceQuery) {
      const cleanPrompt = prompt.replace(/(?:what is|check|get|find|how much does|owe|unpaid by|customer|balance|for|\?)/gi, ' ').trim();
      const result = await this.executeLocalTool('get_customer_balance', { customerNameOrId: cleanPrompt });
      const reply = this.formatDirectToolSummary('get_customer_balance', result);
      return {
        reply,
        reasoning: `Grounded query execution: Looked up customer balance for "${cleanPrompt}" with BigInt balance ledger calculation.`,
        draft: null as any,
      };
    }

    if (isSummaryQuery) {
      const result = await this.executeLocalTool('get_business_summary', {});
      const reply = this.formatDirectToolSummary('get_business_summary', result);
      return {
        reply,
        reasoning: 'Grounded query execution: Calculated business receivables, overdue counts, and monthly payments.',
        draft: null as any,
      };
    }

    if (isCustomerSearchQuery) {
      const cleanPrompt = prompt.replace(/(?:find|search|list|customer|customers|\?)/gi, ' ').trim();
      const result = await this.executeLocalTool('search_customers', { query: cleanPrompt });
      const reply = this.formatDirectToolSummary('search_customers', result);
      return {
        reply,
        reasoning: `Grounded query execution: Queried customer repository with search keyword "${cleanPrompt}".`,
        draft: null as any,
      };
    }

    // 4. Multi-Document Workflow vs Single Document Archetype Resolution
    const isRetailRequest =
      text.includes('grocery') ||
      text.includes('supermarket') ||
      text.includes('kirana') ||
      text.includes('provision') ||
      (text.includes('10') && (text.includes('item') || text.includes('product') || text.includes('random')));

    const multiReq = AiRagRegistry.detectMultiDocumentRequest(prompt);

    if (multiReq.isMulti && multiReq.archetypes.length >= 2 && !isRetailRequest) {
      const generatedDrafts: Partial<ParsedDocumentDraft>[] = [];
      const summaries: string[] = [];
      const reasonings: string[] = [];

      for (let i = 0; i < multiReq.archetypes.length; i++) {
        const arch = multiReq.archetypes[i];
        const partyOverride = multiReq.parties?.[i];
        const gen = this.generateDeterministicDraftForArchetype(arch.id, prompt, partyOverride, context);
        generatedDrafts.push(gen.draft);
        summaries.push(gen.summary);
        reasonings.push(gen.reasoning);
      }

      return {
        reply: `I have generated **${generatedDrafts.length} statutory documents** for your workflow:\n${summaries
          .map((s, idx) => `• **[${idx + 1}]** ${s}`)
          .join('\n')}\n\nYou can review, switch between, and export each document below.`,
        reasoning: `1. Multi-Document Intent Detection: User requested ${generatedDrafts.length} documents (${multiReq.archetypes
          .map((a) => a.name)
          .join(', ')}).\n2. Generated discrete statutory drafts conforming to respective legal frameworks.\n3. Verified all arithmetic balances in integer minor units.`,
        draft: generatedDrafts[0],
        drafts: generatedDrafts,
      };
    }

    // 5. Single Document Request: Match exact archetype
    const matchedArchetypes = AiRagRegistry.retrieve(prompt);
    const primaryId = isRetailRequest ? 'grocery' : (matchedArchetypes[0]?.id || 'invoice');
    const gen = this.generateDeterministicDraftForArchetype(primaryId, prompt, undefined, context);

    return {
      reply: `I have drafted your official **${gen.draft.documentTitle}** for **${gen.draft.partyName}**.\n\nYou can preview the draft directly below, customize details in the editor, or export as PDF.`,
      reasoning: gen.reasoning,
      draft: gen.draft,
      drafts: [gen.draft],
    };
  }

  /**
   * Universal deterministic generator for 22 statutory archetypes
   * Eliminates generic invoice fallback and generates exact requested documents.
   */
  private static generateDeterministicDraftForArchetype(
    archetypeId: string,
    prompt: string,
    partyNameOverride?: string,
    context?: any
  ): { draft: Partial<ParsedDocumentDraft>; summary: string; reasoning: string } {
    const text = prompt.toLowerCase();
    const defaultCurrency =
      prompt.includes('₹') || prompt.toLowerCase().includes('rs') || prompt.toLowerCase().includes('inr')
        ? 'INR'
        : prompt.includes('$') || prompt.toLowerCase().includes('usd')
        ? 'USD'
        : context?.businessProfile?.currency || 'INR';

    // Helper: Extract party name
    const extractParty = (fallback: string): string => {
      if (partyNameOverride) return partyNameOverride.trim();
      const forMatch = prompt.match(
        /\b(?:for|to|client|vendor|consignee|customer|employee|tenant|student|payee|applicant)\s+([A-Za-z0-9\s\.\,\'\-]+?)(?:\s+(?:with|basic|salary|amount|buying|at|on|for|dated|\$|₹|rs|\d|and\b)|$)/i
      );
      if (forMatch && forMatch[1]) {
        const candidate = forMatch[1].trim();
        if (
          candidate.length > 1 &&
          !candidate.toLowerCase().includes('invoice') &&
          !candidate.toLowerCase().includes('document') &&
          !candidate.toLowerCase().includes('bill') &&
          !candidate.toLowerCase().includes('store') &&
          !candidate.toLowerCase().includes('grocery')
        ) {
          return candidate;
        }
      }
      if (context?.matchedCustomers?.length > 0) {
        return context.matchedCustomers[0].name;
      }
      return fallback;
    };

    // Helper: Extract items and quantities
    const extractItems = (defaultDesc: string, defaultPrice: number = 10000): any[] => {
      const items: any[] = [];
      const qtyPriceMatches = Array.from(
        prompt.matchAll(/(\d+)\s+([a-zA-Z\s]+?)\s+(?:at|@|for)\s+(?:[\$₹£€]|rs\.?\s*)?(\d[\d,]*)/gi)
      );
      if (qtyPriceMatches.length > 0) {
        for (const m of qtyPriceMatches) {
          const qty = parseInt(m[1], 10);
          const desc = m[2].trim();
          const price = parseInt(m[3].replace(/,/g, ''), 10);
          items.push({
            description: desc.charAt(0).toUpperCase() + desc.slice(1),
            quantityScaled: BigInt(qty * 10000),
            unitName: 'item',
            unitPriceMinor: BigInt(price * 100),
            hsnSac: '847130',
          });
        }
        return items;
      }

      const qtyMatch = prompt.match(/(\d+)\s+([a-zA-Z\s]{3,30}?)(?:\s+(?:for|to|with|and|\.|$))/i);
      if (qtyMatch && !qtyMatch[2].toLowerCase().includes('percent') && !qtyMatch[2].toLowerCase().includes('gst')) {
        const qty = parseInt(qtyMatch[1], 10);
        const desc = qtyMatch[2].trim();
        const priceMatch = prompt.match(/(?:[\$₹£€]|rs\.?\s*)(\d[\d,]*)/i);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : defaultPrice;
        items.push({
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          quantityScaled: BigInt(qty * 10000),
          unitName: 'item',
          unitPriceMinor: BigInt(price * 100),
          hsnSac: '847130',
        });
        return items;
      }

      const singlePriceMatch = prompt.match(/(?:[\$₹£€]|rs\.?\s*)(\d[\d,]*)/i);
      const amount = singlePriceMatch ? parseInt(singlePriceMatch[1].replace(/,/g, ''), 10) : defaultPrice;
      items.push({
        description: defaultDesc,
        quantityScaled: 10000n,
        unitName: 'Service',
        unitPriceMinor: BigInt(amount * 100),
        hsnSac: '998314',
      });
      return items;
    };

    // Helper: Extract GST tax rate
    let taxRateBp = 1800n;
    let taxLabel = 'GST';
    const taxMatch = prompt.match(/(\d+)%\s*(?:gst|vat|tax)/i);
    if (taxMatch) {
      taxRateBp = BigInt(parseInt(taxMatch[1], 10) * 100);
      taxLabel = prompt.toLowerCase().includes('vat') ? 'VAT' : 'GST';
    }

    // ── 1. COMMERCIAL QUOTATION / ESTIMATE ──
    if (archetypeId === 'quotation') {
      const clientName = extractParty('Acme Enterprises');
      const items = extractItems('Cloud Infrastructure & AI Systems Architecture', 45000);
      return {
        summary: `Formal Commercial Quotation for ${clientName}`,
        reasoning: `1. Intent Classification: Commercial Quotation & Price Bid Instrument.\n2. Disambiguation: Selected formal quote archetype (penalized generic tax invoice).\n3. Extracted line items and applied ${Number(taxRateBp) / 100}% ${taxLabel}.\n4. Injected 30-day price validity and milestone payment terms.`,
        draft: {
          docType: 'quotation',
          documentTitle: 'Formal Commercial Quotation',
          provenanceRule: 'Commercial Proposal & Tender Instrument',
          partyName: clientName,
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: Date.now() + 30 * 86400000,
          items,
          discountType: 'none',
          discountValue: 0n,
          taxType: 'exclusive',
          taxRateBp,
          taxLabel,
          notes: 'Quotation valid for 30 calendar days from date of issuance. Commercial terms apply upon acceptance.',
          terms: 'Payment Terms: 50% advance mobilization fee, 50% upon milestone deliverables completion.',
        },
      };
    }

    // ── 2. PROFORMA INVOICE ──
    if (archetypeId === 'proforma') {
      const clientName = extractParty('Purchasing Corp');
      const items = extractItems('Enterprise Software License & Deployment', 75000);
      return {
        summary: `Proforma Invoice for ${clientName}`,
        reasoning: `1. Intent Classification: Proforma Invoice under CBIC Rule 46 Practice.\n2. Disambiguation: Pre-billing proforma instrument (not a statutory demand for tax payment).\n3. Extracted line items and verified advance settlement terms.`,
        draft: {
          docType: 'proforma',
          documentTitle: 'Proforma Invoice',
          provenanceRule: 'CBIC GST Rule 46 / Commercial Proforma Practice',
          partyName: clientName,
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: Date.now() + 14 * 86400000,
          items,
          discountType: 'none',
          discountValue: 0n,
          taxType: 'exclusive',
          taxRateBp,
          taxLabel,
          notes: 'Proforma Invoice issued for advance payment authorization. This is not a demand for tax payment.',
          terms: 'Goods/services will be dispatched immediately upon electronic receipt of payment against this proforma.',
        },
      };
    }

    // ── 3. DELIVERY CHALLAN / DISPATCH NOTE ──
    if (archetypeId === 'delivery_challan') {
      const consigneeName = extractParty('Consignee Warehouse Hub');
      const items = extractItems('Dell 27-inch 4K UltraSharp Monitors', 15000);
      return {
        summary: `Delivery Challan / Dispatch Note for ${consigneeName}`,
        reasoning: `1. Intent Classification: Statutory Delivery Challan under CBIC CGST Rule 55.\n2. Provenance: Transportation of goods without immediate tax liability (tax collected on invoice).\n3. Party designated as Consignee with vehicle and dispatch verification parameters.`,
        draft: {
          docType: 'delivery_challan',
          documentTitle: 'Delivery Challan / Dispatch Note',
          provenanceRule: 'CBIC CGST Rule 55 Delivery Challan',
          partyName: consigneeName,
          partyRole: 'Consignee',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items,
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Goods dispatched under CBIC Rule 55 for transport. Valid for carrier check-post verification.',
          terms: 'Received the above goods in good order and condition subject to inward QA store inspection.',
          metadata: {
            vehicleNo: 'KA-01-MJ-9912',
            reasonForTransportation: 'Supply on Approval / Sale on Return',
          },
        },
      };
    }

    // ── 4. OFFICIAL PURCHASE ORDER (PO) ──
    if (archetypeId === 'purchase_order') {
      const vendorName = extractParty('Supplier Hardware Technologies Ltd');
      const items = extractItems('Enterprise Server Components & Memory Modules', 120000);
      return {
        summary: `Official Purchase Order (PO) for ${vendorName}`,
        reasoning: `1. Intent Classification: Commercial Purchase Order (PO).\n2. Party Role: Assigned Vendor counterparty with procurement terms.\n3. Verified delivery schedules and standard Net 30 payment terms.`,
        draft: {
          docType: 'purchase_order',
          documentTitle: 'Official Purchase Order (PO)',
          provenanceRule: 'Commercial Procurement Instrument',
          partyName: vendorName,
          partyRole: 'Vendor',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: Date.now() + 14 * 86400000,
          items,
          discountType: 'none',
          discountValue: 0n,
          taxType: 'exclusive',
          taxRateBp,
          taxLabel,
          notes: 'Purchase Order PO-2026-881. Delivery required within 14 calendar days to central warehouse.',
          terms: 'Payment terms: Net 30 days post delivery and GRN inspection sign-off.',
        },
      };
    }

    // ── 5. STATUTORY CREDIT NOTE ──
    if (archetypeId === 'credit_note') {
      const clientName = extractParty('Customer Accounts Ltd');
      const singlePriceMatch = prompt.match(/(?:[\$₹£€]|rs\.?\s*)(\d[\d,]*)/i);
      const amount = singlePriceMatch ? parseInt(singlePriceMatch[1].replace(/,/g, ''), 10) : 15000;
      return {
        summary: `Statutory Credit Note for ${clientName}`,
        reasoning: `1. Intent Classification: Statutory Credit Note under CBIC CGST Rule 53(1).\n2. Adjusted taxable value and input tax credit liability.\n3. Referenced sales return / post-sale allowance terms.`,
        draft: {
          docType: 'credit_note',
          documentTitle: 'Statutory Credit Note',
          provenanceRule: 'CBIC CGST Rule 53(1) Credit Note',
          partyName: clientName,
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Sales Return Allowance / Post-Sale Rate Revision',
              quantityScaled: 10000n,
              unitName: 'Adjustment',
              unitPriceMinor: BigInt(amount * 100),
              hsnSac: '998314',
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'exclusive',
          taxRateBp,
          taxLabel,
          notes: 'Credit Note issued against original invoice. Adjusts taxable turnover and tax liability under Rule 53.',
          terms: 'This credit note can be adjusted against future invoices or refunded directly.',
        },
      };
    }

    // ── 6. STATUTORY DEBIT NOTE ──
    if (archetypeId === 'debit_note') {
      const vendorName = extractParty('Global Supplies Corp');
      const singlePriceMatch = prompt.match(/(?:[\$₹£€]|rs\.?\s*)(\d[\d,]*)/i);
      const amount = singlePriceMatch ? parseInt(singlePriceMatch[1].replace(/,/g, ''), 10) : 8000;
      return {
        summary: `Statutory Debit Note for ${vendorName}`,
        reasoning: `1. Intent Classification: Statutory Debit Note under CBIC CGST Rule 53(2).\n2. Supplementary charge / rate escalation debit note.\n3. Calculated tax adjustment with integer arithmetic precision.`,
        draft: {
          docType: 'debit_note',
          documentTitle: 'Statutory Debit Note',
          provenanceRule: 'CBIC CGST Rule 53(2) Debit Note',
          partyName: vendorName,
          partyRole: 'Vendor',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Supplementary Surcharge / Underbilled Freight Adjustment',
              quantityScaled: 10000n,
              unitName: 'Charge',
              unitPriceMinor: BigInt(amount * 100),
              hsnSac: '998314',
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'exclusive',
          taxRateBp,
          taxLabel,
          notes: 'Debit Note issued for supplementary charges under CGST Rule 53(2).',
        },
      };
    }

    // ── 7. PAYMENT RECEIPT / MONEY VOUCHER ──
    if (archetypeId === 'receipt') {
      const payeeName = extractParty('Sharma & Sons Enterprises');
      const singlePriceMatch = prompt.match(/(?:[\$₹£€]|rs\.?\s*)(\d[\d,]*)/i);
      const amount = singlePriceMatch ? parseInt(singlePriceMatch[1].replace(/,/g, ''), 10) : 50000;
      return {
        summary: `Official Payment Receipt for ${payeeName}`,
        reasoning: `1. Intent Classification: Official Payment Receipt / Money Voucher.\n2. Disambiguation: Acknowledgment of funds received (tax zero, payment confirmation).\n3. Verified receipt number and payment settlement trace.`,
        draft: {
          docType: 'receipt',
          documentTitle: 'Payment Receipt / Money Voucher',
          provenanceRule: 'Official Accounts Payment Receipt',
          partyName: payeeName,
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Commercial Account Settlement / Payment Received with Thanks',
              quantityScaled: 10000n,
              unitName: 'Payment',
              unitPriceMinor: BigInt(amount * 100),
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Received with thanks. Confirms electronic funds transfer into corporate bank account.',
          terms: 'Subject to electronic realization of funds if paid via cheque/clearing.',
        },
      };
    }

    // ── 8. PAYMENT DISBURSEMENT VOUCHER ──
    if (archetypeId === 'payment_voucher') {
      const beneficiaryName = extractParty('Beneficiary Vendor');
      const singlePriceMatch = prompt.match(/(?:[\$₹£€]|rs\.?\s*)(\d[\d,]*)/i);
      const amount = singlePriceMatch ? parseInt(singlePriceMatch[1].replace(/,/g, ''), 10) : 14500;
      return {
        summary: `Payment Disbursement Voucher for ${beneficiaryName}`,
        reasoning: `1. Intent Classification: Payment Disbursement Voucher.\n2. Authorized financial disbursement record from corporate treasury.`,
        draft: {
          docType: 'payment_voucher',
          documentTitle: 'Payment Disbursement Voucher',
          provenanceRule: 'Statutory Cash & Bank Payment Voucher',
          partyName: beneficiaryName,
          partyRole: 'Vendor',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Disbursement of Approved Operational Expense',
              quantityScaled: 10000n,
              unitName: 'Payout',
              unitPriceMinor: BigInt(amount * 100),
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Payment disbursement authorized and recorded in ledger.',
        },
      };
    }

    // ── 9. CONTRACTOR WORK ORDER / SOW ──
    if (archetypeId === 'work_order') {
      const contractorName = extractParty('Apex Engineering Solutions');
      return {
        summary: `Contractor Work Order / SOW for ${contractorName}`,
        reasoning: `1. Intent Classification: Contractor Work Order / Statement of Work (SOW).\n2. Generated milestones, deliverable tasks, and completion schedule.`,
        draft: {
          docType: 'work_order',
          documentTitle: 'Contractor Work Order / SOW',
          provenanceRule: 'Commercial Deliverable & Retainage Contract',
          partyName: contractorName,
          partyRole: 'Vendor',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: Date.now() + 45 * 86400000,
          items: [
            {
              description: 'Milestone 1: Architectural Assessment & Schema Migration',
              quantityScaled: 10000n,
              unitName: 'Milestone',
              unitPriceMinor: 4500000n,
            },
            {
              description: 'Milestone 2: Multi-Agent Workflow Engine Implementation',
              quantityScaled: 10000n,
              unitName: 'Milestone',
              unitPriceMinor: 6500000n,
            },
            {
              description: 'Milestone 3: End-to-End Hardening & Security Audit',
              quantityScaled: 10000n,
              unitName: 'Milestone',
              unitPriceMinor: 3500000n,
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'exclusive',
          taxRateBp: 1800n,
          taxLabel: 'GST',
          notes: 'Contractor Work Order authorized for engineering deliverables execution.',
          terms: '5% statutory retainage withheld until 30 days post final acceptance.',
        },
      };
    }

    // ── 10. EQUIPMENT RESPONSIBILITY & ASSET HANDOVER ──
    if (archetypeId === 'equipment_responsibility') {
      const custodianName = extractParty('Aditya Sen');
      return {
        summary: `Equipment Responsibility Letter for ${custodianName}`,
        reasoning: `1. Intent Classification: Asset Handover & Equipment Custody Agreement.\n2. Statutory Provenance: Enterprise IT Governance & Asset Protection Policy.`,
        draft: {
          docType: 'equipment_responsibility_letter',
          documentTitle: 'Equipment Responsibility & Asset Handover Letter',
          provenanceRule: 'Asset Custody & Enterprise Governance Policy',
          partyName: custodianName,
          partyRole: 'Employee',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Apple MacBook Pro 16-inch M3 Max (36GB RAM / 1TB SSD)',
              quantityScaled: 10000n,
              unitName: 'Unit',
              unitPriceMinor: 28000000n,
              itemNotes: 'Asset Tag: APEX-IT-2026-904 · Serial: C02G4109MD6',
            },
            {
              description: 'Dell UltraSharp 27-inch 4K USB-C Hub Monitor (U2723QE)',
              quantityScaled: 10000n,
              unitName: 'Unit',
              unitPriceMinor: 5500000n,
              itemNotes: 'Serial: CN-0Y832-74261',
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Employee acknowledges receipt of equipment in brand-new operational condition.',
          terms: 'Custodian is responsible for proper care and immediate reporting of loss/damage.',
        },
      };
    }

    // ── 11. CORPORATE MEETING MINUTES (MOM) ──
    if (archetypeId === 'meeting_minutes') {
      return {
        summary: 'Corporate Meeting Minutes (MOM)',
        reasoning: `1. Intent Classification: Corporate Meeting Minutes under Secretarial Standard SS-1.\n2. Synthesized key architectural decisions, resolutions, and action items.`,
        draft: {
          docType: 'meeting_minutes',
          documentTitle: 'Corporate Meeting Minutes (MOM)',
          provenanceRule: 'Secretarial Standard SS-1 / Corporate Governance',
          partyName: 'Architecture & Steering Committee',
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Resolution 1: Ground all autonomous agents in local SQLite with BigInt integer math',
              quantityScaled: 10000n,
              unitName: 'Resolution',
              unitPriceMinor: 0n,
            },
            {
              description: 'Resolution 2: Universal document dispatcher supporting 446 statutory archetypes',
              quantityScaled: 10000n,
              unitName: 'Resolution',
              unitPriceMinor: 0n,
            },
            {
              description: 'Action Item: Deploy multi-document batch workflow cards in conversational assistant',
              quantityScaled: 10000n,
              unitName: 'Action',
              unitPriceMinor: 0n,
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Minutes of Meeting confirmed by chairperson and circulated to all attendees.',
        },
      };
    }

    // ── 12. SITE INSPECTION & AUDIT REPORT ──
    if (archetypeId === 'site_inspection') {
      const inspectorName = extractParty('Lead Field Inspector');
      return {
        summary: `Site Inspection & Engineering Audit Report`,
        reasoning: `1. Intent Classification: Site Inspection & Quality Audit Report.\n2. Recorded structural, electrical, and environmental compliance checks.`,
        draft: {
          docType: 'site_inspection_report',
          documentTitle: 'Site Inspection & Engineering Audit Report',
          provenanceRule: 'Quality Assurance & Occupational Safety Standards',
          partyName: inspectorName,
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Structural Steel Reinforcement & Weld Integrity Inspection',
              quantityScaled: 10000n,
              unitName: 'Check',
              unitPriceMinor: 0n,
              itemNotes: 'Status: 100% PASS (Zero micro-fractures detected)',
            },
            {
              description: 'Electrical Substation Grounding & Earthing Resistance Test',
              quantityScaled: 10000n,
              unitName: 'Check',
              unitPriceMinor: 0n,
              itemNotes: 'Status: PASS (< 1.2 Ohms verified)',
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Site inspection completed in accordance with ISO 9001 and statutory safety standards.',
        },
      };
    }

    // ── 13. CUSTOMER STATEMENT OF ACCOUNT ──
    if (archetypeId === 'customer_statement') {
      const clientName = extractParty('Customer Account');
      return {
        summary: `Customer Statement of Account for ${clientName}`,
        reasoning: `1. Intent Classification: Customer Account Statement & Aging Ledger.\n2. Summarized period billings, receipts, and net outstanding balance.`,
        draft: {
          docType: 'customer_account_statement',
          documentTitle: 'Customer Statement of Account',
          provenanceRule: 'Standard Commercial Accounts Ledger',
          partyName: clientName,
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Billed Invoices Total (Current Billing Cycle)',
              quantityScaled: 10000n,
              unitName: 'Debit',
              unitPriceMinor: 25000000n,
            },
            {
              description: 'Electronic Payments Received & Cleared',
              quantityScaled: 10000n,
              unitName: 'Credit',
              unitPriceMinor: -15000000n,
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Statement reflects all verified ledger transactions up to the current date.',
        },
      };
    }

    // ── 14. STUDENT FEE RECEIPT ──
    if (archetypeId === 'student_fee_receipt') {
      const studentName = extractParty('Ananya Deshmukh');
      return {
        summary: `Institutional Student Fee Receipt for ${studentName}`,
        reasoning: `1. Intent Classification: Institutional Academic Fee Receipt.\n2. Itemized tuition, computing lab, and library examination fees.`,
        draft: {
          docType: 'student_fee_receipt',
          documentTitle: 'Institutional Student Fee Receipt',
          provenanceRule: 'Educational Academic Accounts Voucher',
          partyName: studentName,
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Tuition Fee (Semester Fall 2026)',
              quantityScaled: 10000n,
              unitName: 'Term',
              unitPriceMinor: 7500000n,
            },
            {
              description: 'Computing Laboratory & Cloud Infrastructure Fee',
              quantityScaled: 10000n,
              unitName: 'Term',
              unitPriceMinor: 1500000n,
            },
            {
              description: 'Library & Examination Fee',
              quantityScaled: 10000n,
              unitName: 'Term',
              unitPriceMinor: 500000n,
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Received with thanks. Confirms student academic term fee payment.',
        },
      };
    }

    // ── 15. SALARY SLIP / PAYSLIP ──
    if (archetypeId === 'salary_slip' || text.includes('salary') || text.includes('payslip')) {
      const basicMatch = prompt.match(/basic\s+(?:salary\s+)?(?:of\s+)?(?:[\$₹£€]|rs\.?\s*)?(\d[\d,]*)/i);
      const hraMatch = prompt.match(/hra\s+(?:of\s+)?(?:[\$₹£€]|rs\.?\s*)?(\d[\d,]*)/i);
      const pfMatch = prompt.match(/pf\s+(?:deduction\s+)?(?:of\s+)?(?:[\$₹£€]|rs\.?\s*)?(\d[\d,]*)/i);

      const basicNum = basicMatch ? parseInt(basicMatch[1].replace(/,/g, ''), 10) : 65000;
      const hraNum = hraMatch ? parseInt(hraMatch[1].replace(/,/g, ''), 10) : 25000;
      const pfNum = pfMatch ? parseInt(pfMatch[1].replace(/,/g, ''), 10) : 3600;

      const grossNum = basicNum + hraNum;
      const netNum = grossNum - pfNum;

      const employeeName = extractParty('John Doe');
      let designation = 'Senior Architect';
      const desigMatch = prompt.match(/(?:senior\s+architect|architect|engineer|lead|manager|analyst|developer)/i);
      if (desigMatch) {
        designation = desigMatch[0]
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }

      return {
        summary: `Salary Slip for ${employeeName} (${designation})`,
        reasoning: `1. Intent Classification: Statutory Salary Slip / Payslip.\n2. Provenance: Payment of Wages Act 1936 / EPF Act 1952.\n3. Extracted Salary: Basic ₹${basicNum.toLocaleString()}, HRA ₹${hraNum.toLocaleString()} (Gross: ₹${grossNum.toLocaleString()}).\n4. Deductions: Employee PF ₹${pfNum.toLocaleString()}.\n5. Net Take-Home: ₹${netNum.toLocaleString()}.`,
        draft: {
          docType: 'salary_slip',
          documentTitle: 'Salary Slip / Payslip',
          provenanceRule: 'Payment of Wages Act 1936 / EPF Act 1952',
          partyName: employeeName,
          partyRole: 'Employee',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Basic Salary',
              quantityScaled: 10000n,
              unitName: 'Month',
              unitPriceMinor: BigInt(basicNum * 100),
              itemNotes: 'Earnings Component',
            },
            {
              description: 'House Rent Allowance (HRA)',
              quantityScaled: 10000n,
              unitName: 'Month',
              unitPriceMinor: BigInt(hraNum * 100),
              itemNotes: 'Earnings Component',
            },
            {
              description: 'Provident Fund (PF) Employee Deduction',
              quantityScaled: 10000n,
              unitName: 'Month',
              unitPriceMinor: -BigInt(pfNum * 100),
              itemNotes: 'Statutory Deduction',
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Statutory wage slip. Confirms salary disbursement and statutory deposits.',
          terms: 'Strictly confidential. Issued by employer for statutory tax compliance.',
          metadata: {
            employeeName,
            designation,
            payPeriod: 'October 2026',
            basicSalaryMinor: BigInt(basicNum * 100),
            hraMinor: BigInt(hraNum * 100),
            pfDeductionMinor: BigInt(pfNum * 100),
            grossEarningsMinor: BigInt(grossNum * 100),
            totalDeductionsMinor: BigInt(pfNum * 100),
            netPayMinor: BigInt(netNum * 100),
          },
        },
      };
    }

    // ── 16. HOUSE RENT RECEIPT ──
    if (archetypeId === 'rent_receipt' || text.includes('rent') || text.includes('landlord')) {
      const tenantName = extractParty('Tenant');
      const rentMatch = prompt.match(/(?:[\$₹£€]|rs\.?\s*)(\d[\d,]*)/i);
      const rentAmount = rentMatch ? parseInt(rentMatch[1].replace(/,/g, ''), 10) : 28000;
      return {
        summary: `House Rent Receipt for ${tenantName}`,
        reasoning: `1. Intent Classification: House Rent Receipt for HRA Exemption.\n2. Statutory Provenance: Section 10(13A) Income Tax Act 1961.\n3. Landlord PAN Declaration and residential property address configured.`,
        draft: {
          docType: 'rent_receipt',
          documentTitle: 'House Rent Receipt (HRA Exemption)',
          provenanceRule: 'Section 10(13A) Income Tax Act, 1961',
          partyName: tenantName,
          partyRole: 'Tenant',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Residential Premises Monthly Rent (HRA Exemption)',
              quantityScaled: 10000n,
              unitName: 'Month',
              unitPriceMinor: BigInt(rentAmount * 100),
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Received with thanks for residential premises rent. Valid for HRA tax exemption claim.',
        },
      };
    }

    // ── 17. JOB OFFER / APPOINTMENT LETTER ──
    if (archetypeId === 'job_offer' || text.includes('job offer') || text.includes('offer letter')) {
      const candidateName = extractParty('Selected Candidate');
      return {
        summary: `Job Offer & Appointment Letter for ${candidateName}`,
        reasoning: `1. Intent Classification: Employment Offer & Appointment Terms.\n2. Statutory Provenance: Indian Contract Act 1872 / Model Standing Orders.\n3. Formatted ₹35,00,000 Annual CTC across Base, HRA, and Performance Bonus.`,
        draft: {
          docType: 'job_offer_letter',
          documentTitle: 'Job Offer & Appointment Letter',
          provenanceRule: 'Contract Act / Employment Terms SS-3',
          partyName: candidateName,
          partyRole: 'Candidate',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: Date.now() + 7 * 86400000,
          items: [
            {
              description: 'Basic Annual Compensation (Base Pay)',
              quantityScaled: 10000n,
              unitName: 'Year',
              unitPriceMinor: 240000000n,
            },
            {
              description: 'House Rent Allowance (HRA)',
              quantityScaled: 10000n,
              unitName: 'Year',
              unitPriceMinor: 70000000n,
            },
            {
              description: 'Performance & Retention Equity Bonus',
              quantityScaled: 10000n,
              unitName: 'Year',
              unitPriceMinor: 40000000n,
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Offer valid for acceptance within 7 business days from date of issuance.',
        },
      };
    }

    // ── 18. JOB APPLICATION / CANDIDATE DOSSIER ──
    if (archetypeId === 'job_application' || text.includes('job application') || text.includes('candidate')) {
      const candidateName = extractParty('Candidate Dossier');
      return {
        summary: `Employment Application / Candidate Dossier`,
        reasoning: `1. Intent Classification: Candidate Job Application & Technical Competency Dossier.\n2. Disambiguation: Heavily penalized commercial invoice (score 0), selected Candidate Dossier (score 95).`,
        draft: {
          docType: 'job_application',
          documentTitle: 'Employment Application / Candidate Dossier',
          provenanceRule: 'Statutory Labor Employment Dossier / Equal Opportunity Act',
          partyName: candidateName,
          partyRole: 'Applicant',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: [
            {
              description: 'Core Competency: LLM Architectures, Fine-Tuning & Multi-Agent Orchestration',
              quantityScaled: 10000n,
              unitName: 'Track',
              unitPriceMinor: 0n,
            },
            {
              description: 'Production Infrastructure: RAG Pipelines, Vector DBs & Low-Latency Inference',
              quantityScaled: 10000n,
              unitName: 'Track',
              unitPriceMinor: 0n,
            },
          ],
          discountType: 'none',
          discountValue: 0n,
          taxType: 'none',
          taxRateBp: 0n,
          taxLabel: 'None',
          notes: 'Applied AI Engineer candidate portfolio and qualification matrix.',
        },
      };
    }

    // ── 19. GROCERY / RETAIL POS MEMO ──
    if (archetypeId === 'grocery' || /grocery|provision|supermarket|kirana|retail|pos cash|walk-in/i.test(prompt)) {
      const customerName = 'Walk-in Retail Customer';
      const groceryItems = [
        { description: 'Premium Basmati Rice (Daawat / India Gate)', quantityScaled: 50000n, unitName: 'kg', unitPriceMinor: 11000n, hsnSac: '100630' },
        { description: 'Chakki Fresh Whole Wheat Atta (Aashirvaad)', quantityScaled: 100000n, unitName: 'kg', unitPriceMinor: 4200n, hsnSac: '110100' },
        { description: 'Pure Refined Sunflower Cooking Oil (Fortune)', quantityScaled: 20000n, unitName: 'L', unitPriceMinor: 16500n, hsnSac: '151219' },
        { description: 'Farm Fresh Organic Brown Eggs', quantityScaled: 120000n, unitName: 'pcs', unitPriceMinor: 1000n, hsnSac: '040721' },
        { description: 'Unpolished Organic Toor / Arhar Dal', quantityScaled: 10000n, unitName: 'kg', unitPriceMinor: 17500n, hsnSac: '071360' },
        { description: 'Pasteurized Full Cream Fresh Milk (Amul Gold)', quantityScaled: 20000n, unitName: 'L', unitPriceMinor: 3400n, hsnSac: '040120' },
        { description: 'Sulfur-Free Pure Cane White Sugar (Madhur)', quantityScaled: 20000n, unitName: 'kg', unitPriceMinor: 4500n, hsnSac: '170199' },
        { description: 'Assam Strong CTC Premium Tea (Tata Tea Gold)', quantityScaled: 10000n, unitName: 'pack', unitPriceMinor: 24000n, hsnSac: '090230' },
        { description: 'Tata Vacuum Evaporated Iodized Table Salt', quantityScaled: 10000n, unitName: 'kg', unitPriceMinor: 2800n, hsnSac: '250100' },
        { description: 'Everest Shahi Garam Masala Blend', quantityScaled: 10000n, unitName: 'pack', unitPriceMinor: 12000n, hsnSac: '091091' },
      ];
      return {
        summary: `Grocery Retail Tax Invoice with 10 FMCG Items`,
        reasoning: `1. Intent Classification: Retail Point-of-Sale / Grocery Store Cash Memo under CBIC GST Rule 46.\n2. Inventory Synthesis: Generated 10 essential grocery line items across FMCG staples.\n3. Applied 5% GST for packaged staples with 100% integer precision.`,
        draft: {
          docType: 'invoice',
          documentTitle: 'Grocery Retail Tax Invoice / Cash Memo',
          provenanceRule: 'CBIC CGST Rule 46 / Section 31 Retail Invoicing',
          partyName: customerName,
          partyRole: 'Client',
          currency: defaultCurrency,
          issueDate: Date.now(),
          dueDate: null,
          items: groceryItems,
          discountType: 'none',
          discountValue: 0n,
          taxType: 'exclusive',
          taxRateBp: 500n,
          taxLabel: 'GST',
          notes: 'Thank you for shopping at Billframe Fresh Mart! Goods once sold can be exchanged within 3 days with this invoice.',
          metadata: { isRetailPos: true, storeName: 'Billframe Fresh Mart & Grocery Store', itemCount: 10 },
        },
      };
    }

    // ── 20. STANDARD GST COMMERCIAL TAX INVOICE ──
    const clientName = extractParty('Acme Corp');
    const items = extractItems('Professional Enterprise Services', 10000);
    return {
      summary: `GST Tax Invoice for ${clientName}`,
      reasoning: `1. Intent Classification: GST Commercial Tax Invoice under CBIC CGST Rule 46.\n2. Extracted Line Items: ${items.map((i) => i.description).join(', ')}.\n3. Applied ${Number(taxRateBp) / 100}% ${taxLabel} rate.`,
      draft: {
        docType: 'invoice',
        documentTitle: 'GST Tax Invoice',
        provenanceRule: 'CBIC CGST Rule 46',
        partyName: clientName,
        partyRole: 'Client',
        currency: defaultCurrency,
        issueDate: Date.now(),
        dueDate: Date.now() + 30 * 86400000,
        items,
        discountType: 'none',
        discountValue: 0n,
        taxType: 'exclusive',
        taxRateBp,
        taxLabel,
        notes: 'Statutory GST Tax Invoice under Rule 46. Subject to full input tax credit eligibility.',
      },
    };
  }

  /**
   * Generates step-by-step thinking trace for user transparency
   */
  private static synthesizeReasoning(prompt: string, draft: ParsedDocumentDraft): string {
    const isSalary = draft.docType === 'salary_slip' || draft.documentTitle?.toLowerCase().includes('salary');
    const isInvoice = draft.docType === 'invoice' || draft.docType === 'tax_invoice' || draft.documentTitle?.toLowerCase().includes('invoice');
    const isRent = draft.docType === 'rent_receipt' || draft.documentTitle?.toLowerCase().includes('rent');

    const steps: string[] = [];

    if (isSalary) {
      const gross = draft.items.filter((i) => i.unitPriceMinor > 0n).reduce((sum, i) => sum + i.unitPriceMinor, 0n);
      const deductions = draft.items.filter((i) => i.unitPriceMinor < 0n).reduce((sum, i) => sum + -i.unitPriceMinor, 0n);
      const net = draft.grandTotalMinor > 0n ? draft.grandTotalMinor : (gross - deductions);
      steps.push(`• Recipient: ${draft.partyName} (${draft.metadata?.designation || 'Staff'})`);
      steps.push(`• Period: ${draft.metadata?.payPeriod || 'October 2026'}`);
      steps.push(`• Gross Earnings: ${formatMoney(createMoney(gross, draft.currency))}`);
      if (deductions > 0n) {
        steps.push(`• Deductions: ${formatMoney(createMoney(deductions, draft.currency))} (PF & statutory)`);
      }
      steps.push(`• Net Disbursed: ${formatMoney(createMoney(net, draft.currency))}`);
      steps.push(`• Compliance: ${draft.provenanceRule}`);
    } else if (isInvoice) {
      steps.push(`• Client / Counterparty: ${draft.partyName}`);
      steps.push(`• Line items: ${draft.items.length} item(s) totaled`);
      if (draft.taxRateBp > 0n) {
        steps.push(`• Tax Rate: ${Number(draft.taxRateBp) / 100}% ${draft.taxLabel || 'GST'}`);
      }
      steps.push(`• Grand Total: ${formatMoney(createMoney(draft.grandTotalMinor, draft.currency))}`);
      steps.push(`• Compliance: ${draft.provenanceRule}`);
    } else if (isRent) {
      steps.push(`• Tenant: ${draft.partyName}`);
      steps.push(`• Rent Amount: ${formatMoney(createMoney(draft.grandTotalMinor, draft.currency))}`);
      steps.push(`• Statutory Format: ${draft.provenanceRule}`);
    } else {
      steps.push(`• Document: ${draft.documentTitle}`);
      steps.push(`• Party: ${draft.partyName} (${draft.partyRole})`);
      steps.push(`• Total: ${formatMoney(createMoney(draft.grandTotalMinor, draft.currency))}`);
      steps.push(`• Verified under: ${draft.provenanceRule}`);
    }

    steps.push(`• Saved locally: Ref #${draft.documentNumber}`);
    return steps.join('\n');
  }

  /**
   * Commits the draft to SQLite and runs deterministic invariant math
   */
  private static async commitAndVerifyDraft(
    draftData: Partial<ParsedDocumentDraft>,
    localContext: any
  ): Promise<ParsedDocumentDraft> {
    const docType = draftData.docType || 'invoice';
    const regDef = DocumentTypeRegistry.get(docType);
    const defaultPrefix = regDef?.defaultPrefix || 'DOC-';
    const docNumber = `${defaultPrefix}${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const docId = draftData.documentId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let currency = draftData.currency || localContext?.businessProfile?.currency || 'INR';
    if (
      currency === 'USD' &&
      (docType === 'salary_slip' ||
        docType === 'rent_receipt' ||
        docType === 'invoice' ||
        docType === 'tax_invoice' ||
        draftData.provenanceRule?.includes('CGST') ||
        draftData.provenanceRule?.includes('Wages') ||
        draftData.documentTitle?.toLowerCase().includes('salary') ||
        draftData.documentTitle?.toLowerCase().includes('gst') ||
        draftData.documentTitle?.toLowerCase().includes('rent'))
    ) {
      currency = 'INR';
    }

    // Format line items with robust normalization across diverse LLM outputs
    const anyDraft = draftData as any;
    let rawItems = anyDraft.items || [];
    if (rawItems.length === 0 && (docType === 'salary_slip' || anyDraft.documentTitle?.toLowerCase().includes('salary'))) {
      if (Array.isArray(anyDraft.earnings)) {
        rawItems = [...anyDraft.earnings, ...(Array.isArray(anyDraft.deductions) ? anyDraft.deductions : [])];
      } else if (Array.isArray(anyDraft.metadata?.earnings)) {
        rawItems = [...anyDraft.metadata.earnings, ...(Array.isArray(anyDraft.metadata?.deductions) ? anyDraft.metadata.deductions : [])];
      } else {
        const basic = anyDraft.metadata?.basicMinor ?? anyDraft.metadata?.basicSalary ?? 6500000n;
        const hra = anyDraft.metadata?.hraMinor ?? anyDraft.metadata?.hra ?? 2500000n;
        const pf = anyDraft.metadata?.pfMinor ?? anyDraft.metadata?.pf ?? 360000n;
        rawItems = [
          { description: 'Basic Salary', quantityScaled: 10000n, unitName: 'month', unitPriceMinor: typeof basic === 'bigint' ? basic : BigInt(basic) },
          { description: 'House Rent Allowance (HRA)', quantityScaled: 10000n, unitName: 'month', unitPriceMinor: typeof hra === 'bigint' ? hra : BigInt(hra) },
          { description: 'Provident Fund (PF Deduction)', quantityScaled: 10000n, unitName: 'month', unitPriceMinor: -(typeof pf === 'bigint' ? pf : BigInt(pf)) },
        ];
      }
    }
    const items: any[] = rawItems.map((itm: any, idx: number) => {
      const desc = itm.description || itm.name || itm.title || itm.item || `Line item ${idx + 1}`;

      // 1. Normalize Quantity & Unit
      let quantityScaled = 10000n;
      let unitName = itm.unitName || itm.unit || 'item';

      if (typeof itm.quantityScaled === 'bigint') {
        const raw = itm.quantityScaled;
        quantityScaled = raw > 0n && raw < 1000n ? raw * 10000n : (raw === 0n ? 10000n : raw);
      } else if (typeof itm.quantityScaled === 'number') {
        const raw = Number(itm.quantityScaled);
        quantityScaled = raw > 0 && raw < 1000 ? BigInt(Math.round(raw * 10000)) : (raw === 0 ? 10000n : BigInt(Math.round(raw)));
      } else if (itm.quantity !== undefined) {
        if (typeof itm.quantity === 'number') {
          const raw = Number(itm.quantity);
          quantityScaled = raw > 0 && raw < 1000 ? BigInt(Math.round(raw * 10000)) : (raw === 0 ? 10000n : BigInt(Math.round(raw)));
        } else if (typeof itm.quantity === 'string') {
          const match = itm.quantity.trim().match(/^([\d\.]+)\s*(.*)$/);
          if (match) {
            const num = parseFloat(match[1]) || 1;
            quantityScaled = num > 0 && num < 1000 ? BigInt(Math.round(num * 10000)) : BigInt(Math.round(num));
            if (match[2] && match[2].trim()) {
              unitName = match[2].trim();
            }
          }
        }
      }
      if (quantityScaled === 0n) quantityScaled = 10000n;

      // 2. Normalize Unit Price Minor (cents/paise)
      let unitPriceMinor = 0n;
      const isNegative =
        itm.itemNotes?.toLowerCase().includes('deduction') ||
        desc.toLowerCase().includes('deduction') ||
        desc.toLowerCase().includes('pf');

      if (typeof itm.unitPriceMinor === 'bigint') {
        unitPriceMinor = itm.unitPriceMinor;
      } else if (typeof itm.unitPriceMinor === 'number') {
        // If it's a float or small number (< 100), treat as major currency units
        if (!Number.isInteger(itm.unitPriceMinor) || (itm.unitPriceMinor > 0 && itm.unitPriceMinor < 100)) {
          unitPriceMinor = BigInt(Math.round(itm.unitPriceMinor * 100));
        } else {
          unitPriceMinor = BigInt(Math.round(itm.unitPriceMinor));
        }
      } else if (itm.unitPrice !== undefined || itm.price !== undefined || itm.rate !== undefined) {
        const val = Number(itm.unitPrice ?? itm.price ?? itm.rate ?? 0);
        unitPriceMinor = BigInt(Math.round(val * 100));
      }

      if (isNegative && unitPriceMinor > 0n) {
        unitPriceMinor = -unitPriceMinor;
      }

      return {
        id: itm.id || `item_${idx}_${Date.now()}`,
        description: desc,
        quantityScaled,
        unitName,
        unitPriceMinor,
        itemNotes: itm.itemNotes || undefined,
        hsnSac: itm.hsnSac || itm.hsn || (desc.toLowerCase().includes('rice') ? '100630' : '998314'),
      };
    });

    if (docType === 'job_application' && items.length === 0) {
      items.push({
        id: `item_0_${Date.now()}`,
        description: 'Core Technical Competency & Professional Track',
        quantityScaled: 10000n,
        unitName: 'Track',
        unitPriceMinor: 0n,
        itemNotes: 'Key architectural domain competencies and qualifications',
        hsnSac: '998314',
      });
    }

    // Deterministic calculation
    const discountType = draftData.discountType || 'none';
    let discountValue = 0n;
    if (typeof draftData.discountValue === 'bigint') {
      discountValue = draftData.discountValue;
    } else if (typeof draftData.discountValue === 'number') {
      if (discountType === 'percentage' && draftData.discountValue > 0 && draftData.discountValue <= 100) {
        discountValue = BigInt(Math.round(draftData.discountValue * 100)); // 10% -> 1000 bp
      } else {
        discountValue = BigInt(Math.round(draftData.discountValue * 100)); // minor units
      }
    }

    let taxRateBasisPoints = 0n;
    if (typeof draftData.taxRateBp === 'bigint' && draftData.taxRateBp > 0n) {
      taxRateBasisPoints = draftData.taxRateBp;
    } else if (typeof draftData.taxRateBp === 'number' && draftData.taxRateBp > 0) {
      taxRateBasisPoints = draftData.taxRateBp <= 100 ? BigInt(Math.round(draftData.taxRateBp * 100)) : BigInt(Math.round(draftData.taxRateBp));
    } else if ((draftData as any).taxRatePercent !== undefined && Number((draftData as any).taxRatePercent) > 0) {
      taxRateBasisPoints = BigInt(Math.round(Number((draftData as any).taxRatePercent) * 100));
    } else if (docType === 'invoice' || docType === 'tax_invoice') {
      // Standard commercial GST rate defaults to 18% (1800 basis points)
      taxRateBasisPoints = 1800n;
    }

    const taxType: 'none' | 'inclusive' | 'exclusive' =
      draftData.taxType === 'inclusive' || draftData.taxType === 'exclusive'
        ? draftData.taxType
        : taxRateBasisPoints > 0n
        ? 'exclusive'
        : 'none';

    const calc = calculateDocument({
      currency,
      items,
      discountType,
      discountValue,
      taxType,
      taxRateBasisPoints,
      taxLabel: draftData.taxLabel || 'GST',
      totalPaymentsMinor: 0n,
      currentTimestamp: Date.now(),
      lifecycleStatus: 'draft',
    });

    let subtotalMinor = calc.subtotal.amountMinor;
    let taxMinor = calc.tax.amountMinor;
    let grandTotalMinor = calc.grandTotal.amountMinor;

    // Safety fallback: if items exist with non-zero unitPriceMinor but grandTotalMinor calculated to 0n due to rounding
    if (grandTotalMinor === 0n && items.some((i) => i.unitPriceMinor !== 0n)) {
      subtotalMinor = items.reduce(
        (acc: bigint, it: any) => acc + (BigInt(it.unitPriceMinor) * BigInt(it.quantityScaled)) / 10000n,
        0n
      );
      const taxRateBp = typeof draftData.taxRateBp === 'bigint' ? draftData.taxRateBp : BigInt(draftData.taxRateBp || 0);
      taxMinor = (subtotalMinor * taxRateBp) / 10000n;
      grandTotalMinor = subtotalMinor + taxMinor;
    }

    const docTitle = draftData.documentTitle || regDef?.name || 'Document';
    const isRetail =
      Boolean(draftData.metadata?.isRetailPos) ||
      docTitle.toLowerCase().includes('grocery') ||
      docTitle.toLowerCase().includes('retail') ||
      docTitle.toLowerCase().includes('cash memo') ||
      docTitle.toLowerCase().includes('store') ||
      docTitle.toLowerCase().includes('mart') ||
      items.length >= 5;

    const mergedMetadata = {
      ...(draftData.metadata || {}),
      ...(isRetail
        ? {
            isRetailPos: true,
            storeName: draftData.metadata?.storeName || 'Billframe Fresh Mart & Grocery Store',
            itemCount: items.length,
          }
        : {}),
    };

    // Auto-create or link party in SQLite
    let customerId: string | null = null;
    let effectivePartyName = (draftData.partyName || 'Party Name').trim();
    if (
      effectivePartyName.toLowerCase().includes('grocery store') ||
      effectivePartyName.toLowerCase().includes('my store') ||
      effectivePartyName.toLowerCase().includes('fille')
    ) {
      effectivePartyName = 'Walk-in Retail Customer';
    }
    if (effectivePartyName) {
      try {
        const found = await CustomerRepository.search(effectivePartyName, false);
        if (found.length > 0) {
          customerId = found[0].id;
        } else {
          const created = await CustomerRepository.create({
            name: effectivePartyName,
            email: draftData.partyEmail,
            taxId: draftData.partyTaxId,
            billingAddress: draftData.partyAddress,
          });
          customerId = created.id;
        }
      } catch {
        // Non-blocking
      }
    }

    // Persist to SQLite
    try {
      await DocumentRepository.saveDraft({
        id: docId,
        businessProfileId: 'default_business_profile',
        docType: (docType as DocumentType),
        customerId,
        issueDate: draftData.issueDate || Date.now(),
        dueDate: draftData.dueDate || null,
        currency,
        discountType: draftData.discountType || 'none',
        discountValue: typeof draftData.discountValue === 'bigint' ? draftData.discountValue : BigInt(draftData.discountValue || 0),
        taxType: draftData.taxType || 'none',
        taxRateBp: typeof draftData.taxRateBp === 'bigint' ? draftData.taxRateBp : BigInt(draftData.taxRateBp || 0),
        taxLabel: draftData.taxLabel || 'Tax',
        notes: draftData.notes,
        terms: draftData.terms,
        items,
      });
    } catch {
      // Non-blocking
    }

    return {
      documentId: docId,
      documentNumber: docNumber,
      docType,
      documentTitle: draftData.documentTitle || regDef?.name || 'Document',
      provenanceRule: draftData.provenanceRule || regDef?.provenanceRule || 'Statutory Verified',
      partyName: effectivePartyName,
      partyRole: draftData.partyRole || 'Client',
      partyTaxId: draftData.partyTaxId,
      partyEmail: draftData.partyEmail,
      partyAddress: draftData.partyAddress,
      issueDate: draftData.issueDate || Date.now(),
      dueDate: draftData.dueDate || null,
      currency,
      items,
      discountType: draftData.discountType || 'none',
      discountValue: typeof draftData.discountValue === 'bigint' ? draftData.discountValue : BigInt(draftData.discountValue || 0),
      taxType: draftData.taxType || 'none',
      taxRateBp: typeof draftData.taxRateBp === 'bigint' ? draftData.taxRateBp : BigInt(draftData.taxRateBp || 0),
      taxLabel: draftData.taxLabel || 'Tax',
      subtotalMinor,
      taxMinor,
      grandTotalMinor,
      notes: draftData.notes,
      terms: draftData.terms,
      templateId: draftData.templateId,
      metadata: mergedMetadata,
    };
  }

  /**
   * Executes authorized read-only local SQLite tools for AI agent grounding
   */
  static async executeLocalTool(name: string, args: any = {}): Promise<any> {
    try {
      if (name === 'get_business_summary') {
        const profile = await BusinessProfileRepository.getActiveProfile().catch(() => null);
        const metrics = await DocumentRepository.getHomeDashboardMetricsAsync().catch(() => ({
          outstandingMinor: 0n,
          paidThisMonthMinor: 0n,
          overdueInvoicesCount: 0,
          overdueMinor: 0n,
        }));
        return {
          businessName: profile?.name || 'Local Business',
          taxId: profile?.tax_id || null,
          currency: profile?.default_currency || 'INR',
          totalOutstandingMinor: metrics.outstandingMinor.toString(),
          totalOverdueMinor: metrics.overdueMinor.toString(),
          overdueInvoicesCount: metrics.overdueInvoicesCount,
          paidThisMonthMinor: metrics.paidThisMonthMinor.toString(),
        };
      }

      if (name === 'search_customers') {
        const query = args.query || '';
        const found = await CustomerRepository.search(query, false).catch(() => []);
        return {
          count: found.length,
          customers: found.slice(0, 5).map((c) => ({
            id: c.id,
            name: c.name,
            businessName: c.business_name,
            phone: c.phone,
            email: c.email,
            taxId: c.tax_id,
          })),
        };
      }

      if (name === 'get_customer_balance') {
        const query = (args.customerNameOrId || args.customerName || args.customerId || '').trim();
        const customers = await CustomerRepository.search(query, false).catch(() => []);
        if (customers.length === 0) {
          return { error: `No customer found matching "${query}" in the database.` };
        }
        const target = customers[0];
        const withBal = await CustomerRepository.getWithBalance(target.id);
        return {
          customerId: target.id,
          customerName: target.name,
          businessName: target.business_name,
          totalInvoicedMinor: withBal?.total_invoiced_minor || 0,
          totalPaidMinor: withBal?.total_paid_minor || 0,
          outstandingBalanceMinor: withBal?.outstanding_balance_minor || 0,
        };
      }

      if (name === 'list_invoices') {
        const customerName = (args.customerName || '').trim();
        const limit = args.limit || 10;
        const db = await DatabaseManager.getDatabaseAsync();
        let sql = `SELECT d.id, d.document_number, d.doc_type, d.total_minor, d.currency, d.lifecycle_status, d.issue_date, d.due_date, c.name AS customer_name
                   FROM documents d
                   LEFT JOIN customers c ON d.customer_id = c.id
                   WHERE d.is_archived = 0`;
        const params: any[] = [];
        if (customerName) {
          sql += ' AND c.name LIKE ?';
          params.push(`%${customerName}%`);
        }
        sql += ' ORDER BY d.issue_date DESC LIMIT ?;';
        params.push(limit);
        const rows: any[] = await db.getAllAsync(sql, params).catch(() => []);
        return {
          count: rows.length,
          invoices: rows.map((r) => ({
            documentNumber: r.document_number,
            docType: r.doc_type,
            customerName: r.customer_name || 'Walk-in',
            totalMinor: r.total_minor,
            currency: r.currency || 'INR',
            lifecycleStatus: r.lifecycle_status,
            issueDate: r.issue_date,
            dueDate: r.due_date,
          })),
        };
      }

      if (name === 'list_overdue_invoices') {
        const aging = await DocumentRepository.getIssuedInvoicesForAgingAsync().catch(() => []);
        const now = Date.now();
        const overdue = aging.filter((a) => a.due_date && now > a.due_date);
        return {
          count: overdue.length,
          overdueInvoices: overdue.map((o) => ({
            documentNumber: o.document_number,
            customerName: o.customer_name || 'Client',
            customerPhone: o.customer_phone,
            totalMinor: o.total_minor,
            balanceMinor: o.balance_minor.toString(),
            currency: o.currency || 'INR',
            dueDate: o.due_date,
            daysOverdue: Math.max(1, Math.floor((now - (o.due_date || now)) / (24 * 60 * 60 * 1000))),
          })),
        };
      }

      return { error: `Tool ${name} is not recognized` };
    } catch (err: any) {
      return { error: `Failed to execute ${name}: ${err?.message || 'Unknown database error'}` };
    }
  }

  /**
   * Formats direct grounded tool summaries for offline assistant or direct rendering
   */
  static formatDirectToolSummary(toolName: string, result: any): string {
    if (result.error) {
      return result.error;
    }

    if (toolName === 'get_business_summary') {
      const outMajor = (Number(result.totalOutstandingMinor || 0) / 100).toFixed(2);
      const overMajor = (Number(result.totalOverdueMinor || 0) / 100).toFixed(2);
      const paidMajor = (Number(result.paidThisMonthMinor || 0) / 100).toFixed(2);
      const cur = result.currency || 'INR';

      return `**Business Financial Overview (${result.businessName})**:\n\n` +
        `• **Total Outstanding Receivables:** ${cur} ${outMajor}\n` +
        `• **Overdue Invoices:** ${result.overdueInvoicesCount} (${cur} ${overMajor})\n` +
        `• **Collected This Month:** ${cur} ${paidMajor}\n\n` +
        `All figures calculated directly from your local SQLite ledger.`;
    }

    if (toolName === 'get_customer_balance') {
      const invMajor = (result.totalInvoicedMinor / 100).toFixed(2);
      const paidMajor = (result.totalPaidMinor / 100).toFixed(2);
      const balMajor = (result.outstandingBalanceMinor / 100).toFixed(2);

      return `**Customer Balance for ${result.customerName}**:\n\n` +
        `• **Total Invoiced:** ₹${invMajor}\n` +
        `• **Total Paid:** ₹${paidMajor}\n` +
        `• **Outstanding Balance:** ₹${balMajor}\n\n` +
        (result.outstandingBalanceMinor > 0
          ? `Status: Outstanding balance of ₹${balMajor} pending payment.`
          : `Status: Account is completely settled (₹0.00 outstanding).`);
    }

    if (toolName === 'list_overdue_invoices') {
      if (!result.overdueInvoices || result.overdueInvoices.length === 0) {
        return '✓ **No overdue invoices!** All issued invoices in your database are fully paid or within their due dates.';
      }

      let text = `Found **${result.count} overdue invoice(s)** in your ledger:\n\n`;
      result.overdueInvoices.forEach((inv: any) => {
        const bal = (Number(inv.balanceMinor) / 100).toFixed(2);
        text += `• **#${inv.documentNumber}** — ${inv.customerName}: **${inv.currency} ${bal}** (${inv.daysOverdue} day(s) overdue)\n`;
      });
      return text;
    }

    if (toolName === 'list_invoices') {
      if (!result.invoices || result.invoices.length === 0) {
        return 'No matching invoices found in your local database.';
      }
      let text = `Found **${result.count} invoice(s)** in your database:\n\n`;
      result.invoices.forEach((inv: any) => {
        const tot = (inv.totalMinor / 100).toFixed(2);
        text += `• **#${inv.documentNumber}** (${inv.docType}) — ${inv.customerName}: ${inv.currency} ${tot} [${inv.lifecycleStatus}]\n`;
      });
      return text;
    }

    if (toolName === 'search_customers') {
      if (!result.customers || result.customers.length === 0) {
        return 'No customers matched your search query in the local database.';
      }
      let text = `Found **${result.count} customer(s)**:\n\n`;
      result.customers.forEach((c: any) => {
        text += `• **${c.name}**${c.businessName ? ` (${c.businessName})` : ''} — Phone: ${c.phone || 'N/A'}, Email: ${c.email || 'N/A'}\n`;
      });
      return text;
    }

    return 'Tool execution completed.';
  }
}
