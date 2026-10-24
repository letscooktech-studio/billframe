/**
 * ACTION APPROVAL SHEET (HUMAN-IN-THE-LOOP SAFETY GATE)
 * Enforces T0-T4 authorization boundaries before modifying financial balances,
 * issuing formal documents, or altering SQLite accounting ledgers.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight } from 'lucide-react-native';
import { AgentProposalRecord } from '../../data/repositories/AgentSessionRepository';
import { formatMoney, createMoney } from '../../domain/money/Money';

interface ActionApprovalSheetProps {
  visible: boolean;
  proposal: AgentProposalRecord | null;
  currency?: string;
  onApprove: (proposal: AgentProposalRecord) => Promise<void>;
  onReject: (proposal: AgentProposalRecord) => void;
  onDismiss: () => void;
}

export function ActionApprovalSheet({
  visible,
  proposal,
  currency = 'INR',
  onApprove,
  onReject,
  onDismiss,
}: ActionApprovalSheetProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  if (!proposal) return null;

  const isTier4 = proposal.tier >= 4;
  const tierLabel = isTier4 ? 'T4 · DIRECT FINANCIAL MUTATION' : 'T3 · FORMAL DOCUMENT ISSUANCE';
  const tierColor = isTier4 ? '#EF4444' : '#F59E0B';

  const actionTitle =
    proposal.actionType === 'issue_document'
      ? `Issue Document #${proposal.payload.documentNumber || proposal.payload.docNumber || 'NEW'}`
      : proposal.actionType === 'record_payment'
      ? `Record Payment for ${proposal.payload.customerName || 'Customer'}`
      : proposal.actionType === 'void_document'
      ? `Void Document #${proposal.payload.documentNumber}`
      : 'Execute Ledger Action';

  const amountMinor = proposal.payload.amountMinor || proposal.payload.grandTotalMinor || 0;
  const formattedAmount = formatMoney(createMoney(BigInt(amountMinor), currency));

  async function handleApprove() {
    if (!proposal) return;
    try {
      setIsExecuting(true);
      await onApprove(proposal);
    } finally {
      setIsExecuting(false);
    }
  }

  function handleReject() {
    if (!proposal) return;
    onReject(proposal);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.badge, { borderColor: tierColor }]}>
                <ShieldAlert size={14} color={tierColor} />
                <Text style={[styles.badgeText, { color: tierColor }]}>{tierLabel}</Text>
              </View>
              <Text style={styles.title}>{actionTitle}</Text>
            </View>
          </View>

          {/* Body Content */}
          <View style={styles.body}>
            <Text style={styles.description}>
              {proposal.payload.reason ||
                'The AI Agent proposes the following ledger action. This requires explicit human approval before committing to the SQLite database.'}
            </Text>

            {/* Financial Delta Card */}
            <View style={styles.deltaCard}>
              <View style={styles.deltaRow}>
                <Text style={styles.deltaLabel}>Target Counterparty</Text>
                <Text style={styles.deltaValue}>{proposal.payload.customerName || proposal.payload.partyName || 'Self / Generic'}</Text>
              </View>

              <View style={styles.deltaRow}>
                <Text style={styles.deltaLabel}>Financial Value</Text>
                <Text style={[styles.deltaValue, styles.amountHighlight]}>{formattedAmount}</Text>
              </View>

              {proposal.payload.balanceRemainingMinor !== undefined && (
                <View style={styles.deltaRow}>
                  <Text style={styles.deltaLabel}>Balance After Action</Text>
                  <Text style={styles.deltaValue}>
                    {formatMoney(createMoney(BigInt(proposal.payload.balanceRemainingMinor), currency))}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.rejectButton, pressed && styles.buttonPressed]}
              onPress={handleReject}
              disabled={isExecuting}
            >
              <XCircle size={16} color="#A5A6AB" />
              <Text style={styles.rejectButtonText}>Reject & Discard</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.approveButton, pressed && styles.buttonPressed]}
              onPress={handleApprove}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <ActivityIndicator size="small" color="#0D0E10" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#0D0E10" />
                  <Text style={styles.approveButtonText}>Approve & Commit</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#18191D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E3036',
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2E3036',
  },
  headerLeft: {
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F6',
  },
  body: {
    padding: 16,
    gap: 12,
  },
  description: {
    fontSize: 13,
    color: '#A5A6AB',
    lineHeight: 18,
  },
  deltaCard: {
    backgroundColor: '#222326',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E3036',
    padding: 12,
    gap: 8,
  },
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deltaLabel: {
    fontSize: 12,
    color: '#77797F',
  },
  deltaValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F5F5F6',
  },
  amountHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34D399',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2E3036',
  },
  rejectButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3E4148',
    backgroundColor: '#222326',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A5A6AB',
  },
  approveButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F3F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  approveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0E10',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
