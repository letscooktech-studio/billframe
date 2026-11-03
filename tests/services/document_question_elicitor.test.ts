import { DocumentQuestionElicitor } from '../../src/services/ai/DocumentQuestionElicitor';
import { AiDocumentAgent, ParsedDocumentDraft } from '../../src/services/ai/AiDocumentAgent';

describe('DocumentQuestionElicitor & Interactive Chat Guided Elicitation', () => {
  const baseResumeDraft: ParsedDocumentDraft = {
    documentId: 'doc_resume_test',
    documentNumber: 'RES-2026-001',
    docType: 'resume',
    documentTitle: 'ATS Professional Curriculum Vitae',
    provenanceRule: 'ATS ISO/IEC Vector Readable Standard',
    partyName: 'Farhan Noor',
    partyRole: 'Candidate',
    issueDate: Date.now(),
    currency: 'USD',
    subtotalMinor: 0n,
    taxMinor: 0n,
    grandTotalMinor: 0n,
    discountType: 'none',
    discountValue: 0n,
    taxType: 'none',
    taxRateBp: 0n,
    taxLabel: 'TAX',
    items: [
      {
        description: 'Core Engineering Competence',
        quantityScaled: 10000n,
        unitName: 'pillar',
        unitPriceMinor: 0n,
      },
    ],
    metadata: {
      candidateName: 'Farhan Noor',
      targetRole: 'AI Engineer',
    },
  };

  const baseInvoiceDraft: ParsedDocumentDraft = {
    documentId: 'doc_inv_test',
    documentNumber: 'INV-2026-001',
    docType: 'invoice',
    documentTitle: 'GST Tax Invoice',
    provenanceRule: 'CBIC CGST Rule 46',
    partyName: 'Acme Corp',
    partyRole: 'Client',
    issueDate: Date.now(),
    currency: 'INR',
    subtotalMinor: 1000000n, // ₹10,000.00
    taxMinor: 0n,
    grandTotalMinor: 1000000n,
    discountType: 'none',
    discountValue: 0n,
    taxType: 'none',
    taxRateBp: 0n,
    taxLabel: 'GST',
    items: [
      {
        description: 'IT Consulting Services',
        quantityScaled: 10000n,
        unitName: 'service',
        unitPriceMinor: 1000000n,
      },
    ],
    metadata: {},
  };

  it('generates an interactive question for resume with domain options and Other as the final option', () => {
    const question = DocumentQuestionElicitor.getNextQuestion(baseResumeDraft);
    expect(question).not.toBeNull();
    expect(question?.fieldKey).toBe('targetDomain');
    expect(question?.options.length).toBeGreaterThanOrEqual(4);

    // Verify reason is present
    expect(question?.reason).toContain('ATS 98% Optimization');

    // Verify last option is ALWAYS "Other"
    const lastOption = question?.options[question.options.length - 1];
    expect(lastOption?.isOther).toBe(true);
    expect(lastOption?.label).toContain('Other');
  });

  it('updates resume competencies and document title when user selects a domain', () => {
    const { updatedDraft, feedbackMessage } = DocumentQuestionElicitor.applyAnswerToDraft(
      baseResumeDraft,
      'targetDomain',
      'Large Language Models & GenAI / RAG Systems'
    );

    expect(updatedDraft.metadata?.targetDomain).toBe('Large Language Models & GenAI / RAG Systems');
    expect(updatedDraft.documentTitle).toContain('Large Language Models');
    expect(updatedDraft.items.some((it) => it.description.includes('Generative AI'))).toBe(true);
    expect(feedbackMessage).toContain('Updated resume domain specialization');

    // Now test next question: experience years
    const nextQ = DocumentQuestionElicitor.getNextQuestion(updatedDraft, ['targetDomain']);
    expect(nextQ).not.toBeNull();
    expect(nextQ?.fieldKey).toBe('experienceYears');
    const lastOpt = nextQ?.options[nextQ.options.length - 1];
    expect(lastOpt?.isOther).toBe(true);
  });

  it('generates an interactive question for GST invoice with statutory rates and Other as final option', () => {
    const question = DocumentQuestionElicitor.getNextQuestion(baseInvoiceDraft);
    expect(question).not.toBeNull();
    expect(question?.fieldKey).toBe('taxRate');
    expect(question?.reason).toContain('CBIC CGST Rule 46');

    // Verify last option is ALWAYS Other
    const lastOption = question?.options[question.options.length - 1];
    expect(lastOption?.isOther).toBe(true);
  });

  it('applies statutory 18% GST and recalculates total without float errors', () => {
    const { updatedDraft, feedbackMessage } = DocumentQuestionElicitor.applyAnswerToDraft(
      baseInvoiceDraft,
      'taxRate',
      '18'
    );

    expect(updatedDraft.taxRateBp).toBe(1800n);
    expect(updatedDraft.taxMinor).toBe(180000n); // 18% of 10,000 = ₹1,800.00
    expect(updatedDraft.grandTotalMinor).toBe(1180000n); // ₹11,800.00
    expect(feedbackMessage).toContain('18%');

    // Next question should be payment terms
    const nextQ = DocumentQuestionElicitor.getNextQuestion(updatedDraft, ['taxRate']);
    expect(nextQ).not.toBeNull();
    expect(nextQ?.fieldKey).toBe('paymentTerms');
    expect(nextQ?.reason).toContain('MSMEDA Act 2006');
    const lastOpt = nextQ?.options[nextQ.options.length - 1];
    expect(lastOpt?.isOther).toBe(true);
  });

  it('detects user selected answers and custom answers accurately', () => {
    const history: any[] = [
      {
        id: 'msg_1',
        role: 'assistant',
        content: 'Please choose domain',
        interactiveQuestion: {
          id: 'q_1',
          fieldKey: 'targetDomain',
          question: 'Domain?',
          reason: 'Test',
          docType: 'resume',
          options: [
            { id: '1', label: 'Large Language Models', value: 'Large Language Models' },
            { id: '2', label: 'Other', value: 'CUSTOM_INPUT', isOther: true },
          ],
        },
      },
    ];

    // 1. Tapped option
    const detected1 = AiDocumentAgent.detectAnsweredField(
      'Selected: Large Language Models',
      baseResumeDraft,
      history
    );
    expect(detected1).not.toBeNull();
    expect(detected1?.fieldKey).toBe('targetDomain');
    expect(detected1?.answerValue).toBe('Large Language Models');

    // 2. Custom typed input
    const detected2 = AiDocumentAgent.detectAnsweredField(
      'Custom targetDomain: Distributed Triton Optimization',
      baseResumeDraft,
      history
    );
    expect(detected2).not.toBeNull();
    expect(detected2?.fieldKey).toBe('targetDomain');
    expect(detected2?.answerValue).toBe('Distributed Triton Optimization');
  });

  it('provides interactive questions for salary slips, quotations, and rent receipts with Other always last', () => {
    const salaryDraft: ParsedDocumentDraft = { ...baseInvoiceDraft, docType: 'salary_slip', documentTitle: 'Salary Slip' };
    const qSal = DocumentQuestionElicitor.getNextQuestion(salaryDraft);
    expect(qSal).not.toBeNull();
    expect(qSal?.options[qSal.options.length - 1].isOther).toBe(true);

    const quoteDraft: ParsedDocumentDraft = { ...baseInvoiceDraft, docType: 'quotation', documentTitle: 'Formal Commercial Quotation' };
    const qQuote = DocumentQuestionElicitor.getNextQuestion(quoteDraft);
    expect(qQuote).not.toBeNull();
    expect(qQuote?.options[qQuote.options.length - 1].isOther).toBe(true);

    const rentDraft: ParsedDocumentDraft = { ...baseInvoiceDraft, docType: 'rent_receipt', documentTitle: 'House Rent Receipt' };
    const qRent = DocumentQuestionElicitor.getNextQuestion(rentDraft);
    expect(qRent).not.toBeNull();
    expect(qRent?.options[qRent.options.length - 1].isOther).toBe(true);
  });

  it('formats intelligent conversational document creation replies with embedded question and reason', () => {
    const q = DocumentQuestionElicitor.getNextQuestion(baseResumeDraft);
    const replyWithQuestion = DocumentQuestionElicitor.formatDocumentCreationReply(baseResumeDraft, q);
    expect(replyWithQuestion).toContain('Farhan Noor');
    expect(replyWithQuestion).toContain('Next Required Detail');
    expect(replyWithQuestion).toContain(q?.question || '');
    expect(replyWithQuestion).toContain('Select an option in the chat box below');

    const replyDone = DocumentQuestionElicitor.formatDocumentCreationReply(baseResumeDraft, null);
    expect(replyDone).toContain('All statutory compliance and quality parameters');
    expect(replyDone).toContain('fully compiled on canvas');
  });

  it('handles purchase order delivery lead time and inspection questions', () => {
    const poDraft: ParsedDocumentDraft = {
      ...baseInvoiceDraft,
      docType: 'purchase_order',
      documentTitle: 'Formal Purchase Order',
      partyName: 'Global Microchips Inc',
    };

    const qLead = DocumentQuestionElicitor.getNextQuestion(poDraft);
    expect(qLead).not.toBeNull();
    expect(qLead?.fieldKey).toBe('deliveryLeadTime');
    expect(qLead?.options[qLead.options.length - 1].isOther).toBe(true);

    const { updatedDraft, feedbackMessage } = DocumentQuestionElicitor.applyAnswerToDraft(
      poDraft,
      'deliveryLeadTime',
      '14 Calendar Days from Order Date'
    );
    expect(updatedDraft.metadata?.deliveryLeadTime).toBe('14 Calendar Days from Order Date');
    expect(updatedDraft.terms).toContain('14 Calendar Days');
    expect(feedbackMessage).toContain('14 Calendar Days');

    const qInsp = DocumentQuestionElicitor.getNextQuestion(updatedDraft, ['deliveryLeadTime']);
    expect(qInsp).not.toBeNull();
    expect(qInsp?.fieldKey).toBe('inspectionClause');
    expect(qInsp?.options[qInsp.options.length - 1].isOther).toBe(true);
  });

  it('handles job offer letter probation and compensation structure', () => {
    const offerDraft: ParsedDocumentDraft = {
      ...baseInvoiceDraft,
      docType: 'job_offer_letter',
      documentTitle: 'Executive Employment Offer',
      partyName: 'Dr. Sarah Connor',
    };

    const qProb = DocumentQuestionElicitor.getNextQuestion(offerDraft);
    expect(qProb?.fieldKey).toBe('probationPeriod');

    const { updatedDraft } = DocumentQuestionElicitor.applyAnswerToDraft(
      offerDraft,
      'probationPeriod',
      '3 Months Probation with Performance Appraisal'
    );
    expect(updatedDraft.terms).toContain('3 Months Probation');

    const qComp = DocumentQuestionElicitor.getNextQuestion(updatedDraft, ['probationPeriod']);
    expect(qComp?.fieldKey).toBe('compensationStructure');
  });

  it('handles NDA agreement confidentiality duration', () => {
    const ndaDraft: ParsedDocumentDraft = {
      ...baseInvoiceDraft,
      docType: 'nda_agreement',
      documentTitle: 'Mutual Non-Disclosure Agreement',
      partyName: 'Neural Research Labs',
    };

    const qNda = DocumentQuestionElicitor.getNextQuestion(ndaDraft);
    expect(qNda?.fieldKey).toBe('confidentialityDuration');
    const { updatedDraft } = DocumentQuestionElicitor.applyAnswerToDraft(
      ndaDraft,
      'confidentialityDuration',
      'Perpetual Protection for Trade Secrets & Algorithms'
    );
    expect(updatedDraft.terms).toContain('Perpetual Protection');
  });

  it('handles Work Order milestones and warranty periods', () => {
    const woDraft: ParsedDocumentDraft = {
      ...baseInvoiceDraft,
      docType: 'work_order',
      documentTitle: 'Statement of Work & Work Order',
      partyName: 'CloudScale Enterprises',
    };

    const qWo = DocumentQuestionElicitor.getNextQuestion(woDraft);
    expect(qWo?.fieldKey).toBe('milestoneStructure');

    const { updatedDraft } = DocumentQuestionElicitor.applyAnswerToDraft(
      woDraft,
      'milestoneStructure',
      'Bi-Weekly Sprint Milestones with Formal Sign-Off'
    );
    expect(updatedDraft.terms).toContain('Bi-Weekly Sprint');

    const qWar = DocumentQuestionElicitor.getNextQuestion(updatedDraft, ['milestoneStructure']);
    expect(qWar?.fieldKey).toBe('warrantyPeriod');
  });

  it('handles Credit Note statutory reason under Rule 53(1)', () => {
    const cnDraft: ParsedDocumentDraft = {
      ...baseInvoiceDraft,
      docType: 'credit_note',
      documentTitle: 'Statutory Credit Note',
      partyName: 'Apex Distributors',
    };

    const qCn = DocumentQuestionElicitor.getNextQuestion(cnDraft);
    expect(qCn?.fieldKey).toBe('creditReason');

    const { updatedDraft } = DocumentQuestionElicitor.applyAnswerToDraft(
      cnDraft,
      'creditReason',
      'Post-Sale Commercial Volume Discount under Rule 53(1)'
    );
    expect(updatedDraft.provenanceRule).toContain('Rule 53(1)');
  });
});
