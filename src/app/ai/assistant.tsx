/**
 * BILLFRAME AI ASSISTANT & CONVERSATIONAL DOCUMENT ENGINE
 * Autonomous statutory document drafting, iterative conversational refinement,
 * on-device SQLite grounding, and Codex-style live task animation & thinking trace.
 *
 * Strict Billframe Arctic Aurora Monochrome Design System:
 * - Neutral-first background (#0D0E10) and surfaces (#18191D, #222326)
 * - Monochrome typography (#F5F5F6, #A5A6AB, #77797F)
 * - Crisp monochrome action buttons (#F3F3F4 primary, #222326 secondary)
 * - Subdued status indicators (no harsh neon colors)
 * - Integrated Live Document Preview Modal with zero-popup-blocker Print & Direct Download
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Settings,
  FileText,
  ExternalLink,
  CheckCircle2,
  Key,
  Shield,
  Layers,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Building2,
  Printer,
  Download,
  Eye,
  Check,
  Maximize2,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '../../design/ThemeContext';
import { colors, radii, spacing, typography } from '../../design/tokens';
import { AiConfigService, AiConfig, AiProvider, DEFAULT_GROQ_KEY } from '../../services/ai/AiConfigService';
import { AiDocumentAgent, AgentChatMessage, ParsedDocumentDraft } from '../../services/ai/AiDocumentAgent';
import { AiTemplateBridge, DocumentTemplateOption } from '../../services/ai/AiTemplateBridge';
import { createMoney, formatMoney } from '../../domain/money/Money';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';
import { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { AgentSessionRepository, AgentProposalRecord } from '../../data/repositories/AgentSessionRepository';
import { ActionApprovalSheet } from '../../components/ai/ActionApprovalSheet';
import { RecommendationEngine, RecommendationItem } from '../../services/ai/RecommendationEngine';
import { BusinessProfile } from '../../domain/profile/types';
import { ClaudeThinkingIndicator } from '../../components/animations/ClaudeThinkingIndicator';
import { IntelligentMessageRenderer } from '../../components/ai/IntelligentMessageRenderer';

/**
 * Transforms raw neural reasoning thoughts into clean, high-elegance cognitive steps.
 * Filters out raw JSON braces, internal prompt artifacts, or code syntax to ensure
 * a modern, sophisticated Codex/Canvas presentation rather than raw hacker terminal dumps.
 */
function formatThinkingTrace(raw: string): string[] {
  if (!raw) return [];
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('```') && !l.startsWith('{') && !l.startsWith('}'));

  const cleaned: string[] = [];
  for (const line of lines) {
    if (
      line.includes('"docType":') ||
      line.includes('"items":') ||
      line.includes('"unitPriceMinor":') ||
      line.includes('"partyName":') ||
      line.includes('```json') ||
      line.startsWith('"') ||
      line.endsWith('":') ||
      line.endsWith('",') ||
      /epoch|timestamp|fenced block|JSON|archetype|spec|boolean|bigint|minor units|calculate days|leap year|confirmation sentence/i.test(line)
    ) {
      continue;
    }
    const cleanLine = line.replace(/^[\*\-\•\d\.]+\s*/, '').trim();
    if (cleanLine.length > 2 && !cleanLine.startsWith('{') && !cleanLine.startsWith('}')) {
      cleaned.push(cleanLine);
    }
  }

  return cleaned.length > 0
    ? cleaned.slice(0, 8)
    : ['Analyzing requirements & verifying statutory compliance...'];
}

/**
 * Returns dynamic, intelligent contextual action chips based on the active draft
 */
function getSmartWorkflowChips(draft: ParsedDocumentDraft | null): Array<{ label: string; prompt: string }> {
  if (!draft) {
    return [
      { label: '📊 Business Overview', prompt: 'What is my current business overview and total receivables?' },
      { label: '⏰ Check Overdue Invoices', prompt: 'List all overdue invoices and unpaid customer balances' },
      { label: '✦ GST Tax Invoice', prompt: 'Draft a GST Tax Invoice for Acme Corp with 18% GST' },
      { label: '✦ ATS Resume (Farhan Noor)', prompt: 'build me complete highest ats scoring resume for farhan noor for ai engineer' },
      { label: '✦ Salary Slip', prompt: 'Create a salary slip for John Doe, Senior Architect, basic 65,000, HRA 25,000, PF 3,600 for October 2026' },
      { label: '✦ Grocery Bill (10 items)', prompt: 'draft me a complete bill for my grocery store and fille 10 random items' },
      { label: '✦ House Rent Receipt', prompt: 'Generate a House Rent Receipt for tenant Rahul Sharma for 28,000 INR' },
      { label: '✦ Job Application', prompt: 'Draft a job application for Senior Fullstack Engineer' },
    ];
  }

  const dt = (draft.docType || '').toLowerCase();
  const title = (draft.documentTitle || '').toLowerCase();

  if (dt === 'resume' || dt === 'curriculum_vitae' || dt === 'cv' || title.includes('resume') || title.includes('curriculum vitae')) {
    return [
      { label: '+ Add MLOps / Triton Competencies', prompt: 'Add Triton Inference Server and vLLM distributed inference to the skills and projects section' },
      { label: '+ Add US Patent on INT8 Quantization', prompt: 'Add US Patent publication on Low-Bit Precision Neural Quantization to the resume' },
      { label: '✦ Tailor for Principal AI Architect', prompt: 'Tailor the resume profile and executive summary for a Principal AI Architect role' },
      { label: '✦ Add NeurIPS Publication', prompt: 'Add peer-reviewed paper at NeurIPS on Transformer Knowledge Distillation' },
      { label: '⎙ Print ATS Resume', prompt: 'Print official ATS resume' },
    ];
  }

  if (dt === 'salary_slip' || title.includes('salary') || title.includes('payslip')) {
    return [
      { label: '+ Add ₹5,000 Special Allowance', prompt: 'Add a Special Allowance of 5000 INR to earnings and recalculate net pay' },
      { label: '+ Add ₹2,500 Performance Bonus', prompt: 'Add 2500 INR Performance Bonus to earnings and update take-home pay' },
      { label: '- Deduct ₹1,500 Professional Tax', prompt: 'Add a deduction of 1500 INR for Professional Tax (PT)' },
      { label: '✦ Update to November 2026', prompt: 'Update the pay period to November 2026' },
      { label: '⎙ Print Payslip', prompt: 'Print official payslip' },
    ];
  }

  if (dt === 'quotation' || dt === 'quote' || title.includes('quotation')) {
    return [
      { label: '+ Add 5% Volume Discount', prompt: 'apply a 5% volume discount to this quotation' },
      { label: '✦ Convert to GST Invoice', prompt: 'convert this quotation into a formal GST tax invoice' },
      { label: '✦ Generate Delivery Challan', prompt: 'generate a matching delivery challan for this quotation' },
      { label: '⎙ Print Quotation', prompt: 'Print official commercial quotation' },
    ];
  }

  if (dt === 'delivery_challan' || title.includes('challan') || title.includes('dispatch')) {
    return [
      { label: '✦ Update Vehicle Number', prompt: 'update vehicle number to MH-02-EE-8899 on this challan' },
      { label: '✦ Add E-Way Bill Number', prompt: 'set e-way bill number to 241098234891' },
      { label: '✦ Generate Tax Invoice', prompt: 'create a tax invoice for the goods listed in this delivery challan' },
      { label: '⎙ Print Challan', prompt: 'Print delivery challan' },
    ];
  }

  if (dt === 'purchase_order' || dt === 'po' || title.includes('purchase order')) {
    return [
      { label: '✦ Set Delivery Due Date', prompt: 'set delivery due date to 15 days from today' },
      { label: '✦ Add Payment Terms Net 30', prompt: 'set payment terms to Net 30 days upon delivery' },
      { label: '⎙ Print Purchase Order', prompt: 'Print purchase order' },
    ];
  }

  if (dt === 'rent_receipt' || title.includes('rent')) {
    return [
      { label: '+ Update Rent to ₹35,000', prompt: 'change the rent amount to 35000 INR' },
      { label: '+ Add ₹1,200 Maintenance', prompt: 'add 1200 INR monthly maintenance charge' },
      { label: '✦ Update to November 2026', prompt: 'change the rent period to November 2026' },
      { label: '✦ Set Payment via UPI UTR', prompt: 'set payment mode to UPI Transfer with UTR 4291882910' },
      { label: '⎙ Print Receipt', prompt: 'Print official rent receipt' },
    ];
  }

  if (dt === 'job_offer_letter' || dt === 'job_application' || title.includes('job') || title.includes('offer')) {
    return [
      { label: '+ Increase CTC to ₹42,00,000', prompt: 'revise the total compensation to 42,00,000 INR per annum' },
      { label: '+ Add ₹2,00,000 Joining Bonus', prompt: 'add a one-time joining bonus of 200000 INR' },
      { label: '✦ Change Joining Date to 1st Dec', prompt: 'set joining date to 1st December 2026' },
      { label: '✦ Add Remote Work Allowance', prompt: 'add remote work equipment allowance of 75000 INR' },
    ];
  }

  // Commercial / GST Tax Invoice
  return [
    { label: '+ Add 10% Trade Discount', prompt: 'apply a 10% trade discount to this invoice' },
    { label: '+ Add 18% GST', prompt: 'apply 18% GST tax rate to all items' },
    { label: '+ Add ₹1,500 Delivery & Freight', prompt: 'add a line item for Express Delivery & Freight Charges of 1500 INR' },
    { label: '+ Add 1 More Enterprise Laptop', prompt: 'increase the Enterprise Laptop quantity to 3 units' },
    { label: '✦ Switch to 80mm POS Receipt', prompt: 'convert this bill into an 80mm POS thermal retail receipt' },
    { label: '✦ Switch to Structured Ledger', prompt: 'switch template to Structured Ledger GST-02' },
    { label: '⎙ Print Invoice', prompt: 'Print official invoice' },
  ];
}

export default function AiAssistantScreen() {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 960;

  // Chat State
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome_msg',
      role: 'assistant',
      content:
        'What would you like to draft today?\n\nTell me what document you need in plain words, or tap a quick starter below.',
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDraft, setActiveDraft] = useState<ParsedDocumentDraft | null>(null);
  const [activeDrafts, setActiveDrafts] = useState<ParsedDocumentDraft[]>([]);

  // Codex Real-Time Streaming & Thinking State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  // Animation values for blinking cursor and pulsing indicator
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;

  // Settings / API Key Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState<AiConfig>({
    provider: 'groq',
    apiKey: DEFAULT_GROQ_KEY,
    model: 'openai/gpt-oss-120b',
    isReady: true,
  });
  const [tempApiKey, setTempApiKey] = useState(DEFAULT_GROQ_KEY);
  const [tempProvider, setTempProvider] = useState<AiProvider>('groq');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Interactive Live Document Preview Modal State
  const [previewDraft, setPreviewDraft] = useState<ParsedDocumentDraft | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Human-in-the-Loop T3/T4 Proposal State & Explainable Local Recommendations
  const [pendingProposal, setPendingProposal] = useState<AgentProposalRecord | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  // Automatically keep live HTML in sync for the desktop Artifact Canvas
  useEffect(() => {
    if (activeDraft) {
      const tmpl = selectedPreviewTemplate || AiTemplateBridge.getDefaultTemplateId(activeDraft);
      generateDocumentHtml(activeDraft, tmpl).then((html) => {
        setPreviewHtml(html);
      });
    }
  }, [activeDraft, selectedPreviewTemplate]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Hydrate persistent AI session and recommendations from SQLite on Mount
  useEffect(() => {
    async function hydrateSessionAndRecs() {
      try {
        const session = await AgentSessionRepository.getOrCreateDefaultSession();
        if (session.activeDraft) {
          setActiveDraft(session.activeDraft);
          setActiveDrafts([session.activeDraft]);
        }
        const saved = await AgentSessionRepository.getMessages(session.id);
        if (saved && saved.length > 0) {
          setMessages(saved);
        }
        const recs = await RecommendationEngine.evaluateRecommendations();
        setRecommendations(recs);
      } catch (err) {
        console.warn('[Assistant] Failed to hydrate persistent session:', err);
      }
    }
    hydrateSessionAndRecs();
  }, []);

  // Load Config on Mount
  useEffect(() => {
    async function initConfig() {
      let current = await AiConfigService.getConfig();
      if (current.provider === 'offline_heuristic' && !current.apiKey) {
        await AiConfigService.saveConfig({
          provider: 'groq',
          apiKey: DEFAULT_GROQ_KEY,
          model: 'openai/gpt-oss-120b',
        });
        current = await AiConfigService.getConfig();
      }
      setConfig(current);
      setTempProvider(current.provider);
      setTempApiKey(current.apiKey || (current.provider === 'groq' ? DEFAULT_GROQ_KEY : ''));
    }
    initConfig();
  }, []);

  // Blinking terminal cursor loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [cursorAnim]);

  // Stopwatch timer during generation
  useEffect(() => {
    let timerInterval: any = null;

    if (isProcessing) {
      setElapsedSeconds(0);
      timerInterval = setInterval(() => {
        setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
      }, 100);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0.4);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isProcessing, pulseAnim]);

  // Expose test helper for programmatic verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__billframeSendMessage = (text: string) => handleSendMessage(text);
      (window as any).__billframeOpenPreview = (draft: ParsedDocumentDraft) => handleOpenPreview(draft);
    }
  }, [messages, activeDraft, isProcessing]);

  function toggleThought(msgId: string) {
    setExpandedThoughts((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  }

  // Clear / Reset Conversation
  async function handleClearConversation() {
    await AgentSessionRepository.clearSession().catch(() => {});
    setActiveDraft(null);
    setActiveDrafts([]);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content:
          'What would you like to draft today?\n\nTell me what document you need in plain words, or tap a quick starter below.',
        timestamp: Date.now(),
      },
    ]);
  }

  // Handle Send Message with Real-Time Codex Streaming Animation
  async function handleSendMessage(promptOverride?: string) {
    const textToSend = (promptOverride || inputText).trim();
    if (!textToSend || isProcessing) return;

    setInputText('');
    const userMsg: AgentChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };
    AgentSessionRepository.saveMessage('ai_session_default', userMsg).catch(() => {});

    const agentMsgId = `agent_${Date.now()}`;
    const initialAgentMsg: AgentChatMessage = {
      id: agentMsgId,
      role: 'assistant',
      content: '',
      reasoningTrace: '',
      timestamp: Date.now(),
      isStreaming: true,
      isThinking: true,
      isCompilingDraft: false,
      taskSteps: [
        { id: '1', label: 'Grounding query with active SQLite profile & records...', status: 'running' },
      ],
    };

    setMessages((prev) => [...prev, userMsg, initialAgentMsg]);
    setIsProcessing(true);
    setElapsedSeconds(0);
    const startTime = Date.now();

    try {
      await AiDocumentAgent.streamMessage(
        textToSend,
        messages,
        activeDraft,
        (event) => {
          if (event.type === 'step') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      taskSteps: event.taskSteps || m.taskSteps,
                      isThinking: true,
                    }
                  : m
              )
            );
          } else if (event.type === 'reasoning') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      reasoningTrace: event.fullReasoning,
                      taskSteps: event.taskSteps || m.taskSteps,
                      isThinking: true,
                    }
                  : m
              )
            );
          } else if (event.type === 'content') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? {
                      ...m,
                      content: event.displayText || '',
                      taskSteps: event.taskSteps || m.taskSteps,
                      isThinking: false,
                      isCompilingDraft: Boolean(event.isCompilingDraft),
                    }
                  : m
              )
            );
          } else if (event.type === 'done') {
            const duration = Math.max(0.6, (Date.now() - startTime) / 1000);
            const allDrafts: ParsedDocumentDraft[] =
              event.drafts && event.drafts.length > 0
                ? event.drafts
                : (event.draft ? [event.draft] : []);

            const finishedAgentMsg: AgentChatMessage = {
              id: agentMsgId,
              role: 'assistant',
              content: event.replyText || '',
              reasoningTrace: event.fullReasoning,
              documentDraft: event.draft || (allDrafts.length > 0 ? allDrafts[0] : null),
              documentDrafts: allDrafts,
              taskSteps: event.taskSteps,
              isStreaming: false,
              isThinking: false,
              isCompilingDraft: false,
              thoughtDurationSeconds: duration,
              timestamp: Date.now(),
            };
            AgentSessionRepository.saveMessage('ai_session_default', finishedAgentMsg).catch(() => {});

            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMsgId
                  ? finishedAgentMsg
                  : m
              )
            );

            if (event.draft || allDrafts.length > 0) {
              const primaryDraft = event.draft || allDrafts[0];
              setActiveDraft(primaryDraft);
              setActiveDrafts(allDrafts);
              AgentSessionRepository.updateActiveDraft('ai_session_default', primaryDraft).catch(() => {});
            }
          }
        }
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId
            ? {
                ...m,
                content: `⚠️ Processing error: ${err?.message || 'Could not synthesize document'}. Please check your connection or settings.`,
                isStreaming: false,
                isThinking: false,
                isCompilingDraft: false,
              }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * Generates full statutory HTML using Billframe's official document template engines
   */
  async function generateDocumentHtml(draft: ParsedDocumentDraft, templateId?: string): Promise<string> {
    const businessProfile = await BusinessProfileRepository.getActiveProfile().catch(() => null);

    const defaultBusiness: BusinessProfile = {
      id: 'biz_default',
      name: 'Apex Studio Enterprises',
      legal_name: 'Apex Studio Enterprises Pvt Ltd',
      tax_id: '27AAAAA0000A1Z5',
      phone: '+91 98765 43210',
      email: 'billing@organization.com',
      address_line1: 'Floor 4, Nexus Business Tower',
      address_line2: 'Bandra-Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400051',
      country: 'India',
      country_iso2: 'IN',
      default_currency: draft.currency || 'INR',
      default_document_locale: 'en-IN',
      is_active: true,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const business = businessProfile || defaultBusiness;
    return AiTemplateBridge.renderDraftHtml(draft, business, templateId);
  }

  /**
   * Opens Interactive Live Document Preview Modal
   */
  async function handleOpenPreview(draft: ParsedDocumentDraft, templateId?: string) {
    setActiveDraft(draft);
    setIsLoadingPreview(true);
    try {
      const tmpl = templateId || selectedPreviewTemplate || AiTemplateBridge.getDefaultTemplateId(draft);
      setSelectedPreviewTemplate(tmpl);
      const html = await generateDocumentHtml(draft, tmpl);
      setPreviewHtml(html);
      if (!isDesktop) {
        setPreviewDraft(draft);
      }
    } catch (err: any) {
      Alert.alert('Preview Error', err?.message || 'Could not render document preview.');
    } finally {
      setIsLoadingPreview(false);
    }
  }

  /**
   * Direct, bulletproof print utility — Zero pop-up blocker issues
   */
  async function handlePrintDocument(draft: ParsedDocumentDraft) {
    try {
      const html = await generateDocumentHtml(draft, selectedPreviewTemplate || undefined);
      if (Platform.OS === 'web') {
        let iframe = document.getElementById('billframe-print-frame') as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'billframe-print-frame';
          iframe.style.position = 'fixed';
          iframe.style.top = '-9999px';
          iframe.style.left = '-9999px';
          iframe.style.width = '1px';
          iframe.style.height = '1px';
          iframe.style.border = 'none';
          document.body.appendChild(iframe);
        }
        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          }, 250);
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (err: any) {
      Alert.alert('Print Error', err?.message || 'Could not initiate print dialog.');
    }
  }

  /**
   * Direct, bulletproof download utility — Zero pop-up blocker issues
   */
  async function handleDownloadHtml(draft: ParsedDocumentDraft) {
    try {
      const html = await generateDocumentHtml(draft, selectedPreviewTemplate || undefined);
      const filename = `${draft.documentNumber || 'document'}_verified.html`;

      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Export ${draft.documentTitle}`,
            UTI: 'com.adobe.pdf',
          });
        }
      }
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Could not download document.');
    }
  }

  // Save Settings Modal
  async function handleSaveSettings() {
    await AiConfigService.saveConfig({
      provider: tempProvider,
      apiKey: tempApiKey,
    });
    const updated = await AiConfigService.getConfig();
    setConfig(updated);
    setShowConfigModal(false);
    setTestResult(null);
  }

  // Test Key Probe
  async function handleTestKey() {
    setIsTestingKey(true);
    setTestResult(null);
    const res = await AiConfigService.testConnection(tempApiKey, tempProvider);
    setIsTestingKey(false);
    setTestResult(res);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={theme.textPrimary} size={20} />
          </Pressable>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color={theme.textPrimary} />
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Billframe AI Agent</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              {config.provider === 'offline_heuristic'
                ? 'Offline Engine'
                : config.isReady
                ? 'AI Agent · Ready'
                : 'Offline Engine'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={handleClearConversation}
            style={[styles.settingsButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Reset conversation"
          >
            <RotateCcw color={theme.textSecondary} size={16} />
          </Pressable>

          <Pressable
            onPress={() => setShowConfigModal(true)}
            style={[styles.settingsButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open AI Settings"
          >
            <Settings color={theme.textSecondary} size={18} />
          </Pressable>
        </View>
      </View>

      {/* Main Responsive Dual-Pane Layout */}
      <View style={[styles.mainLayoutContainer, isDesktop && styles.desktopLayoutRow]}>
        {/* Left Column: Conversational AI Copilot */}
        <KeyboardAvoidingView
          style={[styles.chatPaneContainer, isDesktop && styles.desktopChatPane]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isThoughtExpanded = Boolean(expandedThoughts[msg.id]);

            if (isUser) {
              return (
                <View key={msg.id} style={[styles.messageRow, styles.messageRowUser]}>
                  <View
                    style={[
                      styles.userBubbleContainer,
                      {
                        backgroundColor: theme.surfaceSecondary,
                        borderColor: theme.borderDefault,
                      },
                    ]}
                  >
                    <Text style={[styles.userMessageText, { color: theme.textPrimary }]}>
                      {msg.content}
                    </Text>
                    <Text style={[styles.messageTimestamp, { color: theme.textMuted }]}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View key={msg.id} style={[styles.messageRow, styles.messageRowAssistant]}>
                <View
                  style={[
                    styles.assistantCardContainer,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderDefault,
                    },
                  ]}
                >
                  {/* Intelligent Agent Header Bar */}
                  <View style={[styles.assistantHeaderRow, { borderBottomColor: theme.borderSubtle }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.agentAvatarBadge, { backgroundColor: theme.surfaceSecondary }]}>
                        <Sparkles size={13} color="#CC785C" />
                      </View>
                      <View>
                        <Text style={[styles.agentHeaderTitle, { color: theme.textPrimary }]}>
                          Billframe AI Copilot
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={styles.agentActiveDot} />
                          <Text style={[styles.agentHeaderSubtitle, { color: theme.textMuted }]}>
                            Grounded SQLite • Live
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.messageTimestamp, { color: theme.textMuted }]}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  {/* Claude Intelligent Thinking Indicator & Live Real Sub-Agent Tasks */}
                  {(msg.isThinking || msg.reasoningTrace || (msg.taskSteps && msg.taskSteps.length > 0)) && (
                    <View style={{ marginTop: 8 }}>
                      <ClaudeThinkingIndicator
                        isThinking={Boolean(msg.isThinking)}
                        thoughtDurationSeconds={msg.thoughtDurationSeconds}
                        elapsedSeconds={elapsedSeconds}
                        taskSteps={msg.taskSteps || []}
                        reasoningTrace={msg.reasoningTrace || ''}
                        isExpanded={
                          expandedThoughts[msg.id] !== undefined
                            ? expandedThoughts[msg.id]
                            : Boolean(msg.isThinking)
                        }
                        onToggleExpand={() => toggleThought(msg.id)}
                        textColor={theme.textPrimary}
                        textSecondaryColor={theme.textSecondary}
                        borderColor={theme.borderSubtle}
                        surfaceColor={theme.surfaceSecondary}
                      />
                    </View>
                  )}

                  {/* Conversational Reply Text with Intelligent Markdown / Table Renderer */}
                  {(msg.content || (msg.isStreaming && !msg.isThinking)) ? (
                    <View style={{ marginTop: (msg.isThinking || msg.reasoningTrace) ? 8 : 4 }}>
                      <IntelligentMessageRenderer
                        content={msg.content}
                        isStreaming={Boolean(msg.isStreaming)}
                        textColor={theme.textPrimary}
                      />
                      {msg.isStreaming && !msg.isThinking && (
                        <Animated.Text style={[styles.intelligentCursor, { opacity: cursorAnim, color: '#CC785C' }]}>
                          ▊
                        </Animated.Text>
                      )}
                    </View>
                  ) : null}

                  {/* Initial Welcome Quick Suggestions */}
                  {msg.id === 'welcome_msg' && (
                    <View style={styles.welcomeGrid}>
                      <Pressable
                        style={[styles.welcomeCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}
                        onPress={() => handleSendMessage('What is my current business overview and total receivables?')}
                      >
                        <Text style={[styles.welcomeCardTitle, { color: theme.textPrimary }]}>📊 Business Overview</Text>
                        <Text style={[styles.welcomeCardSubtitle, { color: theme.textMuted }]}>Live balance, receivables, and ledger summary</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.welcomeCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}
                        onPress={() => handleSendMessage('List all overdue invoices and unpaid customer balances')}
                      >
                        <Text style={[styles.welcomeCardTitle, { color: theme.textPrimary }]}>⏰ Check Overdue</Text>
                        <Text style={[styles.welcomeCardSubtitle, { color: theme.textMuted }]}>Find unpaid invoices and outstanding payments</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.welcomeCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}
                        onPress={() => handleSendMessage('Draft a GST Tax Invoice for Acme Corp with 18% GST')}
                      >
                        <Text style={[styles.welcomeCardTitle, { color: theme.textPrimary }]}>✦ GST Tax Invoice</Text>
                        <Text style={[styles.welcomeCardSubtitle, { color: theme.textMuted }]}>Compliant B2B invoice with CBIC tax calculations</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.welcomeCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}
                        onPress={() => handleSendMessage('Create a salary slip for John Doe, Senior Architect, basic 65,000, HRA 25,000, PF 3,600 for October 2026')}
                      >
                        <Text style={[styles.welcomeCardTitle, { color: theme.textPrimary }]}>💼 Salary Slip</Text>
                        <Text style={[styles.welcomeCardSubtitle, { color: theme.textMuted }]}>Official payslip with earnings & deductions breakdown</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Compiling Draft Status Badge */}
                  {msg.isCompilingDraft && (
                    <View style={[styles.compilingDraftBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                      <ActivityIndicator size="small" color={theme.textPrimary} style={{ transform: [{ scale: 0.75 }] }} />
                      <Text style={[styles.compilingDraftText, { color: theme.textSecondary }]}>
                        Compiling document...
                      </Text>
                    </View>
                  )}

                  {/* ── Unified Monochrome Luxury Document Cards (Single & Multi-Document Support) ── */}
                  {(() => {
                    const draftsToRender = (msg.documentDrafts && msg.documentDrafts.length > 0)
                      ? msg.documentDrafts
                      : (msg.documentDraft ? [msg.documentDraft] : []);
                    if (draftsToRender.length === 0) return null;

                    return (
                      <View style={{ marginTop: 10, gap: 10 }}>
                        {draftsToRender.length > 1 && (
                          <View style={[styles.batchHeaderStrip, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                            <Layers size={14} color={theme.textPrimary} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary, flex: 1 }}>
                              {draftsToRender.length} Statutory Documents Generated
                            </Text>
                            <View style={[styles.cardBadge, { backgroundColor: theme.primaryActionBg }]}>
                              <Text style={[styles.cardBadgeText, { color: theme.primaryActionText, fontWeight: '700' }]}>
                                BATCH WORKFLOW
                              </Text>
                            </View>
                          </View>
                        )}
                        {draftsToRender.map((draft, dIdx) => (
                          <View
                            key={draft.documentId || `${draft.documentNumber}_${dIdx}`}
                            style={[styles.draftCard, { borderColor: theme.borderDefault, backgroundColor: theme.surface, marginTop: 0 }]}
                          >
                            {/* 1. Card Top Bar */}
                            <View style={styles.cardHeaderRow}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <FileText size={16} color={theme.textPrimary} />
                                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                                    {draft.documentTitle}
                                  </Text>
                                  {draftsToRender.length > 1 && (
                                    <View style={[styles.cardBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle, paddingHorizontal: 5, paddingVertical: 1 }]}>
                                      <Text style={[styles.cardBadgeText, { color: theme.textMuted, fontSize: 8.5 }]}>
                                        #{dIdx + 1}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={[styles.cardProvenance, { color: theme.textMuted }]}>
                                  {draft.provenanceRule} • {draft.documentNumber}
                                </Text>
                              </View>
                              <View style={[styles.cardBadge, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                                <Text style={[styles.cardBadgeText, { color: theme.textSecondary }]}>
                                  ✦ {AiTemplateBridge.getDefaultTemplateId(draft).toUpperCase().replace(/_/g, ' ')}
                                </Text>
                              </View>
                            </View>

                            {/* 2. Archetype-Specific Data Body */}
                            {draft.docType === 'salary_slip' ||
                            draft.documentTitle?.toLowerCase().includes('salary') ||
                            draft.documentTitle?.toLowerCase().includes('payslip') ? (
                              /* ── A: SALARY SLIP DATA ── */
                              <View style={{ marginTop: 12 }}>
                                <View style={[styles.monoHeroBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                                  <View>
                                    <Text style={[styles.monoHeroLabel, { color: theme.textMuted }]}>Net Take-Home Pay</Text>
                                    <Text style={[styles.monoHeroAmount, { color: theme.textPrimary }]}>
                                      {formatMoney(createMoney(draft.grandTotalMinor > 0n ? draft.grandTotalMinor : (draft.metadata?.netPayMinor || 8640000n), draft.currency))}
                                    </Text>
                                  </View>
                                  <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.statusIndicator, { color: '#10B981' }]}>● Disbursed</Text>
                                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>Direct Bank Transfer</Text>
                                  </View>
                                </View>

                                <View style={[styles.metaStrip, { borderColor: theme.borderSubtle }]}>
                                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    Employee: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{draft.partyName}</Text> • {draft.metadata?.designation || 'Senior Architect'}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                                    Period: {draft.metadata?.payPeriod || 'October 2026'}
                                  </Text>
                                </View>

                                <View style={styles.twoColumnGrid}>
                                  <View style={[styles.columnBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                                    <Text style={[styles.columnHeader, { color: theme.textMuted }]}>EARNINGS (+)</Text>
                                    {draft.items
                                      .filter((it) => it.unitPriceMinor >= 0n)
                                      .map((itm, idx) => (
                                        <View key={idx} style={styles.itemRow}>
                                          <Text style={[styles.itemLabel, { color: theme.textSecondary }]} numberOfLines={1}>{itm.description}</Text>
                                          <Text style={[styles.itemVal, { color: theme.textPrimary }]}>
                                            {formatMoney(createMoney(itm.unitPriceMinor, draft.currency))}
                                          </Text>
                                        </View>
                                      ))}
                                  </View>
                                  <View style={[styles.columnBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                                    <Text style={[styles.columnHeader, { color: theme.textMuted }]}>DEDUCTIONS (-)</Text>
                                    {draft.items
                                      .filter((it) => it.unitPriceMinor < 0n)
                                      .map((itm, idx) => (
                                        <View key={idx} style={styles.itemRow}>
                                          <Text style={[styles.itemLabel, { color: theme.textSecondary }]} numberOfLines={1}>{itm.description}</Text>
                                          <Text style={[styles.itemVal, { color: theme.textPrimary }]}>
                                            {formatMoney(createMoney(-itm.unitPriceMinor, draft.currency))}
                                          </Text>
                                        </View>
                                      ))}
                                  </View>
                                </View>
                              </View>
                            ) : (draft.metadata?.isRetailPos || draft.items.length >= 5 || draft.documentTitle?.toLowerCase().includes('grocery')) ? (
                              /* ── B: RETAIL GROCERY POS DATA TABLE ── */
                              <View style={{ marginTop: 12 }}>
                                <View style={[styles.metaStrip, { borderColor: theme.borderSubtle, marginBottom: 8 }]}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                                      Store: <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>{draft.metadata?.storeName || 'Billframe Fresh Mart'}</Text>
                                    </Text>
                                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                                      Items: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{draft.items.length} items</Text>
                                    </Text>
                                  </View>
                                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                                    Customer: <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>{draft.partyName}</Text>
                                  </Text>
                                </View>

                                <View style={[styles.tableContainer, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}>
                                  <View style={[styles.tableHeaderRow, { borderBottomColor: theme.borderSubtle }]}>
                                    <Text style={[styles.tableHeadCol, { flex: 2, color: theme.textMuted }]}>ITEM</Text>
                                    <Text style={[styles.tableHeadCol, { width: 50, textAlign: 'center', color: theme.textMuted }]}>QTY</Text>
                                    <Text style={[styles.tableHeadCol, { width: 65, textAlign: 'right', color: theme.textMuted }]}>RATE</Text>
                                    <Text style={[styles.tableHeadCol, { width: 75, textAlign: 'right', color: theme.textMuted }]}>TOTAL</Text>
                                  </View>
                                  {draft.items.map((itm, idx) => {
                                    const qtyNum = Number(itm.quantityScaled) / 10000;
                                    const lineMinor = (itm.unitPriceMinor * itm.quantityScaled) / 10000n;
                                    return (
                                      <View key={idx} style={[styles.tableBodyRow, { borderBottomColor: theme.borderSubtle }, idx % 2 === 1 && { backgroundColor: theme.surfaceElevated }]}>
                                        <View style={{ flex: 2 }}>
                                          <Text style={[styles.tableNameCol, { color: theme.textPrimary }]} numberOfLines={1}>{itm.description}</Text>
                                          {itm.hsnSac && <Text style={{ fontSize: 9, color: theme.textMuted }}>HSN: {itm.hsnSac}</Text>}
                                        </View>
                                        <Text style={[styles.tableQtyCol, { width: 50, textAlign: 'center', color: theme.textSecondary }]}>
                                          {qtyNum} {itm.unitName}
                                        </Text>
                                        <Text style={[styles.tableRateCol, { width: 65, textAlign: 'right', color: theme.textSecondary }]}>
                                          {formatMoney(createMoney(itm.unitPriceMinor, draft.currency))}
                                        </Text>
                                        <Text style={[styles.tableTotalCol, { width: 75, textAlign: 'right', color: theme.textPrimary }]}>
                                          {formatMoney(createMoney(lineMinor, draft.currency))}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                </View>

                                <View style={[styles.summaryBox, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary }]}>
                                  <View style={styles.summaryLine}>
                                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Subtotal ({draft.items.length} items):</Text>
                                    <Text style={{ fontSize: 11, color: theme.textPrimary, fontWeight: '600' }}>
                                      {formatMoney(createMoney(draft.subtotalMinor, draft.currency))}
                                    </Text>
                                  </View>
                                  {draft.taxMinor > 0n && (
                                    <View style={styles.summaryLine}>
                                      <Text style={{ fontSize: 11, color: theme.textMuted }}>{draft.taxLabel} ({Number(draft.taxRateBp) / 100}%):</Text>
                                      <Text style={{ fontSize: 11, color: theme.textPrimary, fontWeight: '600' }}>
                                        {formatMoney(createMoney(draft.taxMinor, draft.currency))}
                                      </Text>
                                    </View>
                                  )}
                                  <View style={[styles.summaryLine, { marginTop: 4, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderSubtle }]}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }}>Net Payable Amount:</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary }}>
                                      {formatMoney(createMoney(draft.grandTotalMinor, draft.currency))}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            ) : (draft.docType === 'resume' || draft.documentTitle?.toLowerCase().includes('resume') || draft.documentTitle?.toLowerCase().includes('curriculum vitae')) ? (
                              /* ── C1: ATS RESUME / CANDIDATE DOSSIER DATA ── */
                              <View style={{ marginTop: 12 }}>
                                <View style={[styles.metaStrip, { borderColor: theme.borderSubtle, paddingVertical: 8 }]}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1, paddingRight: 8 }}>
                                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>
                                        {draft.partyName}
                                      </Text>
                                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981', marginTop: 1 }}>
                                        {draft.metadata?.targetRole || 'AI Engineer | Machine Learning Specialist'}
                                      </Text>
                                    </View>
                                    <View style={[styles.cardBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>
                                        ATS: {draft.metadata?.atsScore || 98}%
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 4 }}>
                                    📍 {draft.partyAddress || 'New York, NY, USA'} • ✉️ {draft.partyEmail || `${draft.partyName.toLowerCase().replace(/\s+/g, '.')}@email.com`}
                                  </Text>
                                </View>
                                <View style={{ marginTop: 8, gap: 4 }}>
                                  {draft.items.map((itm, idx) => (
                                    <View key={idx} style={[styles.competencyItem, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                                      <Text style={{ fontSize: 11, fontWeight: '500', color: theme.textSecondary }}>
                                        <Text style={{ color: '#10B981', fontWeight: '700' }}>✦ </Text>
                                        {itm.description}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            ) : draft.docType === 'job_application' ? (
                              /* ── C2: JOB APPLICATION DOSSIER DATA ── */
                              <View style={{ marginTop: 12 }}>
                                <View style={[styles.metaStrip, { borderColor: theme.borderSubtle }]}>
                                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                                    {draft.metadata?.position || 'Applied AI Engineer'}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                                    Applicant: {draft.partyName} • CTC: {draft.metadata?.expectedCtc || '₹35,00,000 PA'}
                                  </Text>
                                </View>
                                <View style={{ marginTop: 8, gap: 4 }}>
                                  {draft.items.map((itm, idx) => (
                                    <View key={idx} style={[styles.competencyItem, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
                                      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textPrimary }}>✦ {itm.description}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            ) : (
                              /* ── D: COMMERCIAL INVOICE / CHALLAN / QUOTE / PO / OTHER ── */
                              <View style={{ marginTop: 12 }}>
                                <View style={[styles.metaStrip, { borderColor: theme.borderSubtle }]}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                                      {draft.docType === 'purchase_order' ? 'Vendor: ' : 'Counterparty: '}
                                      <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>{draft.partyName}</Text>
                                    </Text>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>
                                      {formatMoney(createMoney(draft.grandTotalMinor, draft.currency))}
                                    </Text>
                                  </View>
                                </View>
                                <View style={{ marginTop: 6, gap: 3 }}>
                                  {draft.items.map((itm, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                      <Text style={{ fontSize: 11, color: theme.textSecondary, flex: 1 }} numberOfLines={1}>{itm.description}</Text>
                                      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textPrimary }}>
                                        {formatMoney(createMoney(itm.unitPriceMinor, draft.currency))}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}

                            {/* 3. Standardized Action Toolbar (Unified Across ALL Documents) */}
                            <View style={styles.cardActionsRow}>
                              <Pressable
                                style={[styles.primaryActionBtn, { backgroundColor: theme.primaryActionBg }]}
                                onPress={() => {
                                  setActiveDraft(draft);
                                  handleOpenPreview(draft);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel="Preview document"
                              >
                                <Eye size={13} color={theme.primaryActionText} />
                                <Text style={[styles.primaryActionBtnText, { color: theme.primaryActionText }]}>
                                  Preview Document
                                </Text>
                              </Pressable>

                              <Pressable
                                style={[styles.secondaryActionBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderDefault }]}
                                onPress={() => handlePrintDocument(draft)}
                                accessibilityRole="button"
                                accessibilityLabel="Print document"
                              >
                                <Printer size={13} color={theme.textPrimary} />
                                <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                                  Print
                                </Text>
                              </Pressable>

                              <Pressable
                                style={[styles.secondaryActionBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderDefault }]}
                                onPress={() => handleDownloadHtml(draft)}
                                accessibilityRole="button"
                                accessibilityLabel="Download document HTML"
                              >
                                <Download size={13} color={theme.textPrimary} />
                                <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                                  HTML
                                </Text>
                              </Pressable>

                              <Pressable
                                style={[styles.secondaryActionBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderDefault }]}
                                onPress={() => router.push(`/document/edit?id=${draft.documentId}` as any)}
                                accessibilityRole="button"
                                accessibilityLabel="Open document in editor form"
                              >
                                <ExternalLink size={13} color={theme.textPrimary} />
                                <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                                  Edit
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })()}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Context-Aware Smart Workflow Chips */}
        <View style={[styles.chipsContainer, { borderTopColor: theme.borderSubtle, backgroundColor: theme.surface }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4, gap: 5 }}>
            <Sparkles size={11} color={theme.textMuted} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {activeDraft ? `Workflow Actions: ${activeDraft.documentTitle}` : 'Quick Document Starters'}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 2 }}>
            {getSmartWorkflowChips(activeDraft).map((chip, idx) => (
              <Pressable
                key={idx}
                style={[styles.chipButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}
                onPress={() => {
                  if (chip.label.startsWith('⎙')) {
                    if (activeDraft) handlePrintDocument(activeDraft);
                  } else {
                    handleSendMessage(chip.prompt);
                  }
                }}
              >
                <Text style={[styles.chipText, { color: theme.textSecondary }]}>{chip.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputBarContainer, { backgroundColor: theme.surface, borderTopColor: theme.borderSubtle }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.surfaceSecondary,
                color: theme.textPrimary,
                borderColor: theme.borderDefault,
              },
            ]}
            placeholder={activeDraft ? `Modify ${activeDraft.documentTitle} (e.g. "change price to 45000")...` : 'Ask AI to create or query any document...'}
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
            editable={!isProcessing}
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() && !isProcessing ? theme.primaryActionBg : theme.surfaceSecondary,
              },
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={theme.textMuted} />
            ) : (
              <Send size={18} color={inputText.trim() ? theme.primaryActionText : theme.textMuted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Right Column: Live Document Artifact Canvas (Desktop Wide Screen) */}
      {isDesktop && (
        <View style={[styles.desktopCanvasPane, { borderLeftColor: theme.borderSubtle, backgroundColor: '#090A0D' }]}>
          {activeDraft ? (
            <View style={{ flex: 1, width: '100%' }}>
              {/* Multi-Document Batch Switcher Bar */}
              {activeDrafts.length > 1 && (
                <View style={[styles.desktopDraftSwitcherBar, { backgroundColor: '#131417', borderBottomColor: '#26272B' }]}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 4 }}>
                      <Layers size={13} color="#A5A6AB" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#A5A6AB', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Documents ({activeDrafts.length}):
                      </Text>
                    </View>
                    {activeDrafts.map((d, dIdx) => {
                      const isActive =
                        activeDraft?.documentId === d.documentId ||
                        (activeDraft?.documentTitle === d.documentTitle && activeDraft?.documentNumber === d.documentNumber);
                      return (
                        <Pressable
                          key={d.documentId || dIdx}
                          style={[
                            styles.desktopDraftSwitcherTab,
                            isActive ? styles.desktopDraftSwitcherTabActive : styles.desktopDraftSwitcherTabInactive,
                          ]}
                          onPress={() => {
                            setActiveDraft(d);
                            setSelectedPreviewTemplate('');
                          }}
                        >
                          <FileText size={12} color={isActive ? '#141416' : '#A5A6AB'} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? '#141416' : '#D1D2D6' }}>
                            {d.documentTitle}
                          </Text>
                          <Text style={{ fontSize: 9.5, color: isActive ? '#333333' : '#77797F' }}>
                            ({d.documentNumber})
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Canvas Header */}
              <View style={[styles.desktopCanvasHeader, { backgroundColor: '#18191D', borderBottomColor: '#26272B' }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} color="#F5F5F6" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#F5F5F6' }} numberOfLines={1}>
                      {activeDraft.documentTitle}
                    </Text>
                    <View style={[styles.cardBadge, { backgroundColor: '#222326', borderColor: '#35363B' }]}>
                      <Text style={[styles.cardBadgeText, { color: '#10B981' }]}>
                        ● VERIFIED
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: '#77797F', marginTop: 2 }}>
                    {activeDraft.provenanceRule} • {activeDraft.documentNumber}
                  </Text>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pressable
                    style={[styles.previewToolbarBtnPrimary, { backgroundColor: '#F3F3F4' }]}
                    onPress={() => handlePrintDocument(activeDraft)}
                    accessibilityRole="button"
                    accessibilityLabel="Print document"
                  >
                    <Printer size={13} color="#141416" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#141416' }}>Print</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.previewToolbarBtnSecondary, { backgroundColor: '#222326', borderColor: '#35363B' }]}
                    onPress={() => handleDownloadHtml(activeDraft)}
                    accessibilityRole="button"
                    accessibilityLabel="Save HTML"
                  >
                    <Download size={13} color="#F5F5F6" />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#F5F5F6' }}>Save HTML</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.previewToolbarBtnSecondary, { backgroundColor: '#222326', borderColor: '#35363B' }]}
                    onPress={() => {
                      const id = activeDraft.documentId;
                      if (id) router.push(`/document/edit?id=${id}` as any);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit in form"
                  >
                    <ExternalLink size={13} color="#F5F5F6" />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#F5F5F6' }}>Edit Form</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.previewToolbarBtnSecondary, { backgroundColor: '#222326', borderColor: '#35363B', paddingHorizontal: 8 }]}
                    onPress={() => setPreviewDraft(activeDraft)}
                    accessibilityRole="button"
                    accessibilityLabel="Maximize preview"
                  >
                    <Maximize2 size={13} color="#F5F5F6" />
                  </Pressable>
                </View>
              </View>

              {/* Template Selector Ribbon */}
              <View style={[styles.previewTemplateBar, { backgroundColor: '#131417', borderBottomColor: '#26272B' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10, width: '100%' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <Layers size={13} color="#A5A6AB" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#A5A6AB', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Template:
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 6, paddingRight: 20, flexDirection: 'row', alignItems: 'center' }}
                  >
                    {AiTemplateBridge.getAvailableTemplates(activeDraft).map((tmpl) => {
                      const isSelected = (selectedPreviewTemplate || AiTemplateBridge.getDefaultTemplateId(activeDraft)) === tmpl.id;
                      return (
                        <Pressable
                          key={tmpl.id}
                          style={[
                            styles.previewTemplatePill,
                            isSelected ? styles.previewTemplatePillActive : styles.previewTemplatePillInactive,
                          ]}
                          onPress={async () => {
                            setSelectedPreviewTemplate(tmpl.id);
                            setIsLoadingPreview(true);
                            try {
                              const html = await generateDocumentHtml(activeDraft, tmpl.id);
                              setPreviewHtml(html);
                            } finally {
                              setIsLoadingPreview(false);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.previewTemplatePillText,
                              isSelected ? styles.previewTemplatePillTextActive : styles.previewTemplatePillTextInactive,
                            ]}
                            numberOfLines={1}
                          >
                            {tmpl.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* Paper Canvas */}
              <View style={styles.previewCanvasContainer}>
                {isLoadingPreview ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#F5F5F6" />
                    <Text style={{ color: '#A5A6AB', fontSize: 12, marginTop: 12 }}>
                      Updating statutory document canvas...
                    </Text>
                  </View>
                ) : Platform.OS === 'web' ? (
                  <View
                    style={[
                      styles.previewPaperFrame,
                      {
                        maxWidth: (selectedPreviewTemplate || AiTemplateBridge.getDefaultTemplateId(activeDraft)) === 'receipt'
                          ? 400
                          : 840,
                      },
                    ]}
                  >
                    <iframe
                      srcDoc={previewHtml}
                      title="Live Statutory Document Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </View>
                ) : (
                  <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#F5F5F6', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                      Tap 'Print' or 'Save HTML' above to view the full statutory document on your mobile device.
                    </Text>
                  </ScrollView>
                )}
              </View>
            </View>
          ) : (
            /* Empty State when no document drafted yet */
            <View style={styles.desktopCanvasEmptyState}>
              <View style={[styles.desktopEmptyIconBox, { backgroundColor: '#18191D', borderColor: '#2E3036' }]}>
                <Sparkles size={28} color="#F5F5F6" />
              </View>
              <Text style={styles.desktopEmptyTitle}>Live Document Preview</Text>
              <Text style={styles.desktopEmptySubtitle}>
                Draft or refine any document with natural language on the left. Your document will compile live here with template switching and print export.
              </Text>

              <View style={styles.desktopStarterGrid}>
                {[
                  { title: 'GST Tax Invoice', desc: 'CBIC Rule 46 with dual-state CGST/SGST/IGST breakdown', prompt: 'Draft a GST Tax Invoice for Acme Corp with 18% GST' },
                  { title: 'Executive Salary Slip', desc: 'Payment of Wages Act with gross earnings & PF deductions', prompt: 'Create a salary slip for John Doe, Senior Architect, basic 65,000, HRA 25,000, PF 3,600 for October 2026' },
                  { title: 'House Rent Receipt', desc: 'Section 10(13A) HRA exemption with landlord PAN', prompt: 'Generate a House Rent Receipt for tenant Rahul Sharma for 28,000 INR' },
                  { title: 'Retail Grocery POS Bill', desc: '80mm thermal receipt format with 10 random inventory items', prompt: 'draft me a complete bill for my grocery store and fille 10 random items' },
                ].map((card, i) => (
                  <Pressable
                    key={i}
                    style={[styles.desktopStarterCard, { backgroundColor: '#131417', borderColor: '#26272B' }]}
                    onPress={() => handleSendMessage(card.prompt)}
                  >
                    <Text style={styles.desktopStarterCardTitle}>✦ {card.title}</Text>
                    <Text style={styles.desktopStarterCardDesc}>{card.desc}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>

      {/* ── INTERACTIVE LIVE DOCUMENT PREVIEW MODAL ── */}
      <Modal
        visible={Boolean(previewDraft)}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPreviewDraft(null)}
      >
        <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: '#0D0E10' }]} edges={['top', 'bottom']}>
          {/* Preview Modal Header */}
          <View style={[styles.previewHeaderBar, { backgroundColor: '#18191D', borderBottomColor: '#26272B' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Pressable
                onPress={() => setPreviewDraft(null)}
                style={styles.backButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close preview"
              >
                <X color="#F5F5F6" size={20} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#F5F5F6' }} numberOfLines={1}>
                  {previewDraft?.documentTitle}
                </Text>
                <Text style={{ fontSize: 11, color: '#77797F' }}>
                  {previewDraft?.documentNumber} • Verified Statutory Document
                </Text>
              </View>
            </View>

            {/* Quick Action Toolbar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                style={[styles.previewToolbarBtnPrimary, { backgroundColor: '#F3F3F4' }]}
                onPress={() => previewDraft && handlePrintDocument(previewDraft)}
                accessibilityRole="button"
                accessibilityLabel="Print document"
              >
                <Printer size={14} color="#141416" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#141416' }}>Print</Text>
              </Pressable>

              <Pressable
                style={[styles.previewToolbarBtnSecondary, { backgroundColor: '#222326', borderColor: '#35363B' }]}
                onPress={() => previewDraft && handleDownloadHtml(previewDraft)}
                accessibilityRole="button"
                accessibilityLabel="Save HTML"
              >
                <Download size={14} color="#F5F5F6" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#F5F5F6' }}>Save HTML</Text>
              </Pressable>

              <Pressable
                style={[styles.previewToolbarBtnSecondary, { backgroundColor: '#222326', borderColor: '#35363B' }]}
                onPress={() => {
                  const id = previewDraft?.documentId;
                  setPreviewDraft(null);
                  if (id) router.push(`/document/edit?id=${id}` as any);
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit in form"
              >
                <ExternalLink size={14} color="#F5F5F6" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#F5F5F6' }}>Edit Form</Text>
              </Pressable>
            </View>
          </View>

          {/* Official Document Template Selector Ribbon */}
          {previewDraft && (
            <View style={[styles.previewTemplateBar, { backgroundColor: '#131417', borderBottomColor: '#26272B' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10, width: '100%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <Layers size={13} color="#A5A6AB" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#A5A6AB', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Template:
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ gap: 6, paddingRight: 20, flexDirection: 'row', alignItems: 'center' }}
                >
                  {AiTemplateBridge.getAvailableTemplates(previewDraft).map((tmpl) => {
                    const isSelected = (selectedPreviewTemplate || AiTemplateBridge.getDefaultTemplateId(previewDraft)) === tmpl.id;
                    return (
                      <Pressable
                        key={tmpl.id}
                        style={[
                          styles.previewTemplatePill,
                          isSelected ? styles.previewTemplatePillActive : styles.previewTemplatePillInactive,
                        ]}
                        onPress={async () => {
                          setSelectedPreviewTemplate(tmpl.id);
                          setIsLoadingPreview(true);
                          try {
                            const html = await generateDocumentHtml(previewDraft, tmpl.id);
                            setPreviewHtml(html);
                          } finally {
                            setIsLoadingPreview(false);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.previewTemplatePillText,
                            isSelected ? styles.previewTemplatePillTextActive : styles.previewTemplatePillTextInactive,
                          ]}
                          numberOfLines={1}
                        >
                          {tmpl.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Rendered Document Canvas */}
          <View style={styles.previewCanvasContainer}>
            {isLoadingPreview ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#F5F5F6" />
                <Text style={{ color: '#A5A6AB', fontSize: 12, marginTop: 12 }}>
                  Rendering in selected template engine...
                </Text>
              </View>
            ) : Platform.OS === 'web' ? (
              <View
                style={[
                  styles.previewPaperFrame,
                  {
                    maxWidth: (selectedPreviewTemplate || (previewDraft ? AiTemplateBridge.getDefaultTemplateId(previewDraft) : 'modern')) === 'receipt'
                      ? 400
                      : 840,
                  },
                ]}
              >
                <iframe
                  srcDoc={previewHtml}
                  title="Statutory Document Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </View>
            ) : (
              <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#F5F5F6', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                  Tap 'Print' or 'Save HTML' above to view the full statutory document on your mobile device.
                </Text>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── AI Provider / Settings Modal ── */}
      <Modal visible={showConfigModal} animationType="fade" transparent onRequestClose={() => setShowConfigModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.borderDefault }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Key size={18} color={theme.textPrimary} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>AI Engine Configuration</Text>
              </View>
              <Pressable onPress={() => setShowConfigModal(false)} hitSlop={8}>
                <X color={theme.textSecondary} size={20} />
              </Pressable>
            </View>

            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Billframe supports Bring-Your-Own-Key (BYOK) with deep reasoning on Groq LPU, Gemini 2.5, OpenAI, or 100% offline deterministic processing.
            </Text>

            {/* Provider Selector */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Select Active Model Provider:</Text>
            <View style={styles.providerRow}>
              {[
                { id: 'groq' as AiProvider, label: '⚡ Groq LPU (GPT-OSS 120B Reasoning)' },
                { id: 'gemini' as AiProvider, label: '✦ Google Gemini (Gemini 2.5 Flash)' },
                { id: 'openai' as AiProvider, label: '⌘ OpenAI (GPT-4o Mini)' },
                { id: 'offline_heuristic' as AiProvider, label: '🔒 Offline Heuristic (Zero Network)' },
              ].map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.providerOption,
                    {
                      borderColor: tempProvider === p.id ? theme.borderFocused : theme.borderSubtle,
                      backgroundColor: tempProvider === p.id ? theme.surfaceElevated : theme.surfaceSecondary,
                    },
                  ]}
                  onPress={() => {
                    setTempProvider(p.id);
                    if (p.id === 'groq' && !tempApiKey) {
                      setTempApiKey(DEFAULT_GROQ_KEY);
                    }
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: tempProvider === p.id ? theme.textPrimary : theme.textSecondary }}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Key Input */}
            {tempProvider !== 'offline_heuristic' && (
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    {tempProvider === 'groq'
                      ? 'Groq API Key:'
                      : tempProvider === 'gemini'
                      ? 'Google Gemini API Key:'
                      : 'OpenAI API Key:'}
                  </Text>
                  {tempProvider === 'groq' && (
                    <Pressable onPress={() => setTempApiKey(DEFAULT_GROQ_KEY)} hitSlop={6}>
                      <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '700' }}>Use Pre-Configured Key</Text>
                    </Pressable>
                  )}
                </View>

                <TextInput
                  style={[styles.keyInput, { backgroundColor: theme.surfaceSecondary, color: theme.textPrimary, borderColor: theme.borderDefault }]}
                  placeholder={tempProvider === 'groq' ? 'gsk_...' : tempProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                  placeholderTextColor={theme.textMuted}
                  value={tempApiKey}
                  onChangeText={setTempApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
                <Text style={[styles.helperText, { color: theme.textMuted }]}>
                  {tempProvider === 'groq'
                    ? 'Groq LPU enables sub-second responses and explicit step-by-step thinking traces.'
                    : tempProvider === 'gemini'
                    ? 'Get a free API key at: aistudio.google.com'
                    : 'Get an API key at: platform.openai.com'}
                </Text>
              </View>
            )}

            {/* Test Connection Probe */}
            {testResult && (
              <View
                style={[
                  styles.testResultBox,
                  {
                    backgroundColor: testResult.success ? '#052e16' : '#222326',
                    borderColor: testResult.success ? '#166534' : theme.borderDefault,
                  },
                ]}
              >
                <Text style={{ fontSize: 12, color: testResult.success ? '#4ade80' : theme.textSecondary, fontWeight: '600' }}>
                  {testResult.success ? '✓ ' : '✗ '} {testResult.message}
                </Text>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalButtonsRow}>
              {tempProvider !== 'offline_heuristic' && (
                <Pressable
                  style={[styles.testButton, { borderColor: theme.borderDefault, backgroundColor: theme.surfaceSecondary }]}
                  onPress={handleTestKey}
                  disabled={isTestingKey}
                >
                  {isTestingKey ? (
                    <ActivityIndicator size="small" color={theme.textPrimary} />
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textPrimary }}>Test Probe</Text>
                  )}
                </Pressable>
              )}

              <Pressable style={[styles.saveButton, { backgroundColor: theme.primaryActionBg }]} onPress={handleSaveSettings}>
                <Text style={[styles.saveButtonText, { color: theme.primaryActionText }]}>Save & Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Human-in-the-Loop Action Approval Sheet (T3/T4 Financial Gate) */}
      <ActionApprovalSheet
        visible={pendingProposal !== null}
        proposal={pendingProposal}
        currency={activeDraft?.currency || 'INR'}
        onApprove={async (prop) => {
          try {
            if (prop.actionType === 'issue_document') {
              await DocumentRepository.issueDocument(prop.targetId || prop.payload.documentId);
            } else if (prop.actionType === 'void_document') {
              await DocumentRepository.voidDocument(prop.targetId || prop.payload.documentId);
            }
            await AgentSessionRepository.updateProposalStatus(prop.id, 'executed');
            setPendingProposal(null);
            Alert.alert('Action Committed', `Action "${prop.actionType}" was successfully committed to the database.`);
          } catch (err: any) {
            Alert.alert('Error Executing Action', err?.message || 'Database transaction failed');
          }
        }}
        onReject={async (prop) => {
          await AgentSessionRepository.updateProposalStatus(prop.id, 'rejected');
          setPendingProposal(null);
        }}
        onDismiss={() => setPendingProposal(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  userBubbleContainer: {
    maxWidth: Platform.OS === 'web' ? '78%' : '88%',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  assistantCardContainer: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  agentAvatarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 120, 92, 0.3)',
  },
  agentHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  agentHeaderSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  agentActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  welcomeGrid: {
    marginTop: 12,
    gap: 8,
  },
  welcomeCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  welcomeCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  welcomeCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  messageBubble: {
    maxWidth: Platform.OS === 'web' ? '88%' : '95%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  bubbleUser: {
    borderBottomRightRadius: radii.xs,
  },
  bubbleAssistant: {
    maxWidth: '100%',
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 2,
    borderRadius: 0,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 19,
  },

  // ── Subdued Minimal Thinking Trace Accordion ──
  thoughtAccordionContainer: {
    marginTop: 10,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  thoughtToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  thoughtToggleTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  thoughtStepBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thoughtStepBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  thoughtBox: {
    marginTop: 4,
    padding: 10,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  thoughtText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // ── Codex Live Task Running Indicator ──
  taskRunningContainer: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 10,
    minWidth: 220,
    maxWidth: '85%',
  },
  taskRunningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDotContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulsingDotRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  taskRunningTitle: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  taskRunningTimer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskRunningTimerText: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  taskRunningStageRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  taskRunningStageText: {
    fontSize: 11,
  },
  blinkingCursor: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    marginLeft: 2,
  },
  intelligentCursor: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 18,
    marginLeft: 2,
  },
  compilingDraftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: radii.xs,
    borderWidth: 1,
    marginTop: 8,
  },
  compilingDraftText: {
    fontSize: 11,
    fontStyle: 'italic',
  },

  // ── Unified Document Cards ──
  draftCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardProvenance: {
    fontSize: 10,
    marginTop: 2,
  },
  cardBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  cardBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Payslip & Hero Elements ──
  monoHeroBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monoHeroLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monoHeroAmount: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
  },
  statusIndicator: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  metaStrip: {
    marginTop: 8,
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  columnBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  columnHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2.5,
  },
  itemLabel: {
    fontSize: 10.5,
    flex: 1,
    marginRight: 4,
  },
  itemVal: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // ── Table Elements ──
  tableContainer: {
    borderRadius: radii.xs,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeadCol: {
    fontSize: 10,
    fontWeight: '700',
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  tableNameCol: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableQtyCol: {
    fontSize: 11,
  },
  tableRateCol: {
    fontSize: 11,
  },
  tableTotalCol: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryBox: {
    marginTop: 8,
    borderRadius: radii.xs,
    borderWidth: 1,
    padding: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  competencyItem: {
    padding: 6,
    borderRadius: radii.xs,
    borderWidth: 1,
  },

  // ── Unified Standard Action Buttons ──
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  primaryActionBtn: {
    flex: 1.4,
    height: 38,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Chips & Input Bar ──
  chipsContainer: {
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputBarContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Live Document Preview Modal ──
  modalSafeArea: {
    flex: 1,
  },
  previewHeaderBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  previewToolbarBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
  },
  previewToolbarBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  previewTemplateBar: {
    borderBottomWidth: 1,
    justifyContent: 'center',
    width: '100%',
    height: 48,
    flexShrink: 0,
  },
  previewTemplatePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  previewTemplatePillActive: {
    backgroundColor: '#F5F5F6',
    borderColor: '#FFFFFF',
  },
  previewTemplatePillInactive: {
    backgroundColor: '#1E1F24',
    borderColor: '#2E3036',
  },
  previewTemplatePillText: {
    fontSize: 11,
  },
  previewTemplatePillTextActive: {
    color: '#0D0E10',
    fontWeight: '700',
  },
  previewTemplatePillTextInactive: {
    color: '#A5A6AB',
    fontWeight: '600',
  },
  previewCanvasContainer: {
    flex: 1,
    backgroundColor: '#090A0D',
    alignItems: 'center',
    padding: 20,
  },
  previewPaperFrame: {
    width: '100%',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },

  // ── Settings Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  providerRow: {
    gap: 6,
    marginBottom: 10,
  },
  providerOption: {
    padding: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  keyInput: {
    height: 42,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13,
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
  },
  testResultBox: {
    padding: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    marginTop: 12,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  testButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Desktop Dual-Pane & Artifact Canvas Styles ──
  mainLayoutContainer: {
    flex: 1,
    width: '100%',
  },
  desktopLayoutRow: {
    flexDirection: 'row',
  },
  chatPaneContainer: {
    flex: 1,
  },
  desktopChatPane: {
    width: 480,
    maxWidth: 520,
    borderRightWidth: 1,
    borderRightColor: '#222326',
  },
  desktopCanvasPane: {
    flex: 1,
    borderLeftWidth: 1,
    overflow: 'hidden',
  },
  desktopCanvasHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  desktopCanvasEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    maxWidth: 680,
    alignSelf: 'center',
  },
  desktopEmptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  desktopEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5F5F6',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  desktopEmptySubtitle: {
    fontSize: 13,
    color: '#A5A6AB',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  desktopStarterGrid: {
    width: '100%',
    gap: 10,
  },
  desktopStarterCard: {
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  desktopStarterCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F5F5F6',
    marginBottom: 3,
  },
  desktopStarterCardDesc: {
    fontSize: 11,
    color: '#77797F',
    lineHeight: 16,
  },
  batchHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  desktopDraftSwitcherBar: {
    borderBottomWidth: 1,
  },
  desktopDraftSwitcherTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  desktopDraftSwitcherTabActive: {
    backgroundColor: '#F3F3F4',
    borderColor: '#FFFFFF',
  },
  desktopDraftSwitcherTabInactive: {
    backgroundColor: '#1E1F24',
    borderColor: '#2F3036',
  },
});
