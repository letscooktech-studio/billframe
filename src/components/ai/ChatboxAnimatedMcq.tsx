import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ScrollView,
  Platform,
} from 'react-native';
import { Sparkles, Check, ChevronDown, ChevronUp, Edit3 } from 'lucide-react-native';
import { ChatInteractiveQuestion, ChatQuestionOption } from '../../services/ai/DocumentQuestionElicitor';

export interface ChatboxAnimatedMcqProps {
  question: ChatInteractiveQuestion;
  theme: any;
  onSelectOption: (option: ChatQuestionOption) => void;
  onSelectOther: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * ChatboxAnimatedMcq
 * An animated, interactive multiple-choice question card docked directly in the chat box.
 * 
 * Styled strictly to Billframe Arctic Aurora Monochrome standards:
 * - Surfaces: #18191D, #222326
 * - Polar Accent: Arctic Blue #38BDF8 & Polar Emerald #10B981
 * - Letter Badges: Clean monochrome chips [A], [B], [C], [Other ✎]
 * - Slides up animately when a statutory field is needed to eliminate placeholder data.
 */
export const ChatboxAnimatedMcq: React.FC<ChatboxAnimatedMcqProps> = ({
  question,
  theme,
  onSelectOption,
  onSelectOther,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Animation values for smooth slide-up and fade-in from the chatbox
  const slideUpAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Trigger smooth entrance animation whenever question changes
  useEffect(() => {
    setSelectedId(null);
    slideUpAnim.setValue(24);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.97);

    Animated.parallel([
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 85,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 85,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [question.id, question.fieldKey]);

  const handlePressOption = (opt: ChatQuestionOption) => {
    setSelectedId(opt.id);

    // Micro-interaction bounce
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.02, duration: 60, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    if (opt.isOther) {
      onSelectOther();
    } else {
      setTimeout(() => {
        onSelectOption(opt);
      }, 160);
    }
  };

  const reasonTag = question.reason ? question.reason.split(':')[0].replace(/^[✦\s*]+/, '') : 'Statutory Standard';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceSecondary || '#18191D',
          borderColor: theme.borderDefault || '#35363B',
          opacity: fadeAnim,
          transform: [
            { translateY: slideUpAnim },
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Interactive guided question: ${question.question}`}
    >
      {/* ── Header Row with Prompt, Reason Pill & Collapse Toggle ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleSlot}>
          <View style={styles.sparkleBadge}>
            <Sparkles size={13} color="#38BDF8" />
          </View>
          <Text
            style={[styles.questionTitle, { color: theme.textPrimary || '#F5F5F6' }]}
            numberOfLines={isCollapsed ? 1 : 2}
          >
            {question.question}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {Boolean(reasonTag) && (
            <View style={styles.reasonBadge}>
              <Text style={styles.reasonText} numberOfLines={1}>
                {reasonTag}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.collapseButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setIsCollapsed(!isCollapsed)}
            accessibilityRole="button"
            accessibilityLabel={isCollapsed ? 'Expand question options' : 'Collapse question options'}
          >
            {isCollapsed ? (
              <ChevronUp size={15} color={theme.textMuted || '#77797F'} />
            ) : (
              <ChevronDown size={15} color={theme.textMuted || '#77797F'} />
            )}
          </Pressable>
        </View>
      </View>

      {/* ── Collapsed Helper Note ── */}
      {isCollapsed && (
        <Pressable
          style={styles.collapsedPromptRow}
          onPress={() => setIsCollapsed(false)}
        >
          <Text style={[styles.collapsedPromptText, { color: '#38BDF8' }]}>
            Tap to view {question.options.length} MCQ options or type custom answer below
          </Text>
        </Pressable>
      )}

      {/* ── Expanded Animated MCQ Options List ── */}
      {!isCollapsed && (
        <ScrollView
          style={styles.optionsScrollView}
          contentContainerStyle={styles.optionsContentContainer}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          {question.options.map((opt, idx) => {
            const isSelected = selectedId === opt.id;
            const letter = opt.isOther ? '✎' : OPTION_LETTERS[idx] || `${idx + 1}`;

            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(56, 189, 248, 0.12)'
                      : theme.surface || '#141416',
                    borderColor: isSelected
                      ? '#38BDF8'
                      : opt.isOther
                      ? 'rgba(56, 189, 248, 0.3)'
                      : theme.borderSubtle || '#26272B',
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={() => handlePressOption(opt)}
                accessibilityRole="button"
                accessibilityLabel={`${letter}: ${opt.label}`}
              >
                {/* Letter Badge */}
                <View
                  style={[
                    styles.letterBadge,
                    {
                      backgroundColor: isSelected
                        ? '#38BDF8'
                        : opt.isOther
                        ? 'rgba(56, 189, 248, 0.18)'
                        : 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.letterText,
                      {
                        color: isSelected
                          ? '#0F172A'
                          : opt.isOther
                          ? '#38BDF8'
                          : theme.textPrimary || '#F5F5F6',
                      },
                    ]}
                  >
                    {letter}
                  </Text>
                </View>

                {/* Option Content Label */}
                <View style={styles.optionContentSlot}>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: isSelected
                          ? '#38BDF8'
                          : theme.textPrimary || '#F5F5F6',
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {Boolean(opt.description) && (
                    <Text
                      style={[styles.optionDesc, { color: theme.textMuted || '#77797F' }]}
                      numberOfLines={1}
                    >
                      {opt.description}
                    </Text>
                  )}
                </View>

                {/* Selection Indicator Radio / Checkmark */}
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: isSelected
                        ? '#38BDF8'
                        : opt.isOther
                        ? 'rgba(56, 189, 248, 0.4)'
                        : theme.borderDefault || '#35363B',
                      backgroundColor: isSelected ? '#38BDF8' : 'transparent',
                    },
                  ]}
                >
                  {isSelected ? (
                    <Check size={11} color="#0F172A" strokeWidth={3} />
                  ) : opt.isOther ? (
                    <Edit3 size={10} color="#38BDF8" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sparkleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  reasonText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.2,
  },
  collapseButton: {
    padding: 4,
    borderRadius: 6,
  },
  collapsedPromptRow: {
    marginTop: 6,
    paddingVertical: 4,
  },
  collapsedPromptText: {
    fontSize: 11,
    fontWeight: '600',
  },
  optionsScrollView: {
    marginTop: 10,
    maxHeight: 180,
  },
  optionsContentContainer: {
    gap: 6,
    paddingVertical: 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: 1,
    gap: 10,
  },
  letterBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionContentSlot: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
  optionDesc: {
    fontSize: 10.5,
    marginTop: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
