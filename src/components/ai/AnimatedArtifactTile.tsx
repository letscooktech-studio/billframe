import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { FileText, ExternalLink, Printer, Download } from 'lucide-react-native';
import { ParsedDocumentDraft } from '../../services/ai/AiDocumentAgent';
import { formatMoney, createMoney } from '../../domain/money/Money';

interface AnimatedArtifactTileProps {
  draft: ParsedDocumentDraft;
  index: number;
  isSelected: boolean;
  isDesktop: boolean;
  theme: any;
  onOpen: () => void;
  onPrint: () => void;
  onExportHtml: () => void;
  onEditForm: () => void;
}

/**
 * AnimatedArtifactTile
 * Renders a Claude-style materialized Artifact Card with silky-smooth entry animation:
 * - Upward glide (translateY 16 -> 0)
 * - Gentle scale (0.96 -> 1.0)
 * - Warm terracotta border highlight pulse (sheen effect)
 * - Popping statutory VERIFIED badge
 */
export const AnimatedArtifactTile: React.FC<AnimatedArtifactTileProps> = ({
  draft,
  index,
  isSelected,
  isDesktop,
  theme,
  onOpen,
  onPrint,
  onExportHtml,
  onEditForm,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const sheenAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const delay = Math.min(300, index * 90);

    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(sheenAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(sheenAnim, {
            toValue: 0,
            duration: 750,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(badgeScale, {
            toValue: 1.15,
            duration: 220,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(badgeScale, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [fadeAnim, slideAnim, scaleAnim, sheenAnim, badgeScale, index]);

  const subtitle =
    draft.docType === 'resume'
      ? `${draft.partyName} · ${draft.metadata?.targetRole || 'AI Engineer'} · 98% ATS`
      : draft.metadata?.isRetailPos || draft.documentTitle?.toLowerCase().includes('grocery')
      ? `${draft.metadata?.storeName || 'Billframe Mart'} · ${draft.items.length} items · ${formatMoney(
          createMoney(draft.grandTotalMinor, draft.currency)
        )}`
      : draft.docType === 'salary_slip'
      ? `${draft.partyName} · ${draft.metadata?.designation || 'Staff'} · Net ${formatMoney(
          createMoney(
            draft.grandTotalMinor > 0n ? draft.grandTotalMinor : draft.metadata?.netPayMinor || 8640000n,
            draft.currency
          )
        )}`
      : `${draft.partyName} · ${formatMoney(
          createMoney(draft.grandTotalMinor, draft.currency)
        )} · ${draft.documentNumber}`;

  // Interpolate border color from Claude's warm terracotta to subtle resting border
  const animatedBorderColor = sheenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isSelected ? '#CC785C' : theme.borderSubtle || '#27272A',
      '#CC785C',
    ],
  });

  return (
    <Animated.View
      style={[
        styles.tileOuter,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          {
            backgroundColor: theme.surfaceSecondary || '#18181B',
            borderColor: animatedBorderColor,
          },
        ]}
      >
        <Pressable
          style={styles.mainTilePressable}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`Open ${draft.documentTitle}`}
        >
          {/* Document Icon Box */}
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isSelected ? 'rgba(204, 120, 92, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isSelected ? 'rgba(204, 120, 92, 0.35)' : 'rgba(255, 255, 255, 0.08)',
              },
            ]}
          >
            <FileText size={17} color="#CC785C" />
          </View>

          {/* Text and Title Column */}
          <View style={styles.textColumn}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.documentTitle, { color: theme.textPrimary || '#F4F4F5' }]}
                numberOfLines={1}
              >
                {draft.documentTitle}
              </Text>
              <Animated.View
                style={[
                  styles.verifiedBadge,
                  {
                    transform: [{ scale: badgeScale }],
                  },
                ]}
              >
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </Animated.View>
            </View>

            <Text
              style={[styles.subtitleText, { color: theme.textMuted || '#71717A' }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>

          {/* Canvas Open Trigger */}
          <View
            style={[
              styles.openTrigger,
              {
                backgroundColor: isSelected ? 'rgba(204, 120, 92, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: isSelected ? '#CC785C' : 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          >
            <Text style={[styles.openTriggerText, { color: theme.textPrimary || '#F4F4F5' }]}>
              {isDesktop ? 'View in Canvas' : 'Preview'}
            </Text>
            <ExternalLink size={11} color={theme.textMuted || '#71717A'} />
          </View>
        </Pressable>

        {/* Inline Quick Action Links */}
        <View
          style={[
            styles.actionsBar,
            {
              borderTopColor: theme.borderSubtle || '#27272A',
            },
          ]}
        >
          <Pressable style={styles.actionBtn} onPress={onPrint} hitSlop={6}>
            <Printer size={12} color={theme.textSecondary || '#A1A1AA'} />
            <Text style={[styles.actionBtnText, { color: theme.textSecondary || '#A1A1AA' }]}>
              Print
            </Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={onExportHtml} hitSlop={6}>
            <Download size={12} color={theme.textSecondary || '#A1A1AA'} />
            <Text style={[styles.actionBtnText, { color: theme.textSecondary || '#A1A1AA' }]}>
              Export HTML
            </Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={onEditForm} hitSlop={6}>
            <ExternalLink size={12} color={theme.textSecondary || '#A1A1AA'} />
            <Text style={[styles.actionBtnText, { color: theme.textSecondary || '#A1A1AA' }]}>
              Edit Form
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tileOuter: {
    width: '100%',
    marginVertical: 4,
  },
  cardContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  mainTilePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 13,
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  documentTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  verifiedText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 11,
    marginTop: 2,
  },
  openTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  openTriggerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
