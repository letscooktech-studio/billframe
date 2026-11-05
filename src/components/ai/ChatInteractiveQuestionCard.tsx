import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { HelpCircle, Check, Edit3, ArrowRight, Sparkles } from 'lucide-react-native';
import { ChatInteractiveQuestion, ChatQuestionOption } from '../../services/ai/DocumentQuestionElicitor';

interface ChatInteractiveQuestionCardProps {
  question: ChatInteractiveQuestion;
  theme: any;
  onSelectOption: (option: ChatQuestionOption) => void;
  onSelectOther: (fieldKey: string) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * ChatInteractiveQuestionCard
 * Renders an interactive multiple-choice question in chat to gather essential
 * high-scoring statutory and ATS data without injecting fake sample data.
 * Always renders "Other (Enter custom in chat)" as the final option.
 */
export const ChatInteractiveQuestionCard: React.FC<ChatInteractiveQuestionCardProps> = ({
  question,
  theme,
  onSelectOption,
  onSelectOther,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(question.selectedValue || null);

  const handlePressOption = (opt: ChatQuestionOption) => {
    setSelectedId(opt.id);
    if (opt.isOther) {
      onSelectOther(question.fieldKey);
    } else {
      onSelectOption(opt);
    }
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.surfaceSecondary || '#18191D',
          borderColor: theme.borderSubtle || '#28292E',
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Interactive question: ${question.question}`}
    >
      {/* Question Header & Reason Banner */}
      <View style={styles.headerRow}>
        <View style={styles.iconSlot}>
          <Sparkles size={14} color="#38BDF8" />
        </View>
        <Text style={[styles.questionText, { color: theme.textPrimary || '#F4F4F5' }]}>
          {question.question}
        </Text>
      </View>

      {/* Statutory / ATS Reason Explainer Pill */}
      {Boolean(question.reason) && (
        <View style={styles.reasonPill}>
          <Text style={styles.reasonText}>{question.reason}</Text>
        </View>
      )}

      {/* MCQ Options List */}
      <View style={styles.optionsList}>
        {question.options.map((option, idx) => {
          const isSelected = selectedId === option.id;
          const letter = option.isOther ? '✎' : OPTION_LETTERS[idx] || `${idx + 1}`;

          return (
            <Pressable
              key={option.id}
              style={[
                styles.optionRow,
                {
                  backgroundColor: isSelected
                    ? 'rgba(56, 189, 248, 0.12)'
                    : theme.surface || '#202126',
                  borderColor: isSelected
                    ? '#38BDF8'
                    : option.isOther
                    ? 'rgba(56, 189, 248, 0.35)'
                    : theme.borderSubtle || '#2D2E35',
                },
              ]}
              onPress={() => handlePressOption(option)}
              accessibilityRole="button"
              accessibilityLabel={`${letter}: ${option.label}`}
            >
              {/* Option Letter Badge */}
              <View
                style={[
                  styles.letterBadge,
                  {
                    backgroundColor: isSelected
                      ? '#38BDF8'
                      : option.isOther
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'rgba(255, 255, 255, 0.06)',
                  },
                ]}
              >
                {isSelected ? (
                  <Check size={12} color="#FFFFFF" strokeWidth={2.5} />
                ) : (
                  <Text
                    style={[
                      styles.letterText,
                      { color: option.isOther ? '#38BDF8' : theme.textSecondary || '#A1A1AA' },
                    ]}
                  >
                    {letter}
                  </Text>
                )}
              </View>

              {/* Label & Description Column */}
              <View style={styles.labelCol}>
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : option.isOther
                        ? '#38BDF8'
                        : theme.textPrimary || '#F4F4F5',
                      fontWeight: isSelected || option.isOther ? '700' : '600',
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {Boolean(option.description) && (
                  <Text
                    style={[styles.optionDesc, { color: theme.textMuted || '#71717A' }]}
                    numberOfLines={2}
                  >
                    {option.description}
                  </Text>
                )}
              </View>

              {/* Arrow or Done Indicator */}
              <View style={styles.actionSlot}>
                {isSelected ? (
                  <Text style={styles.selectedDoneText}>Selected</Text>
                ) : option.isOther ? (
                  <Edit3 size={13} color="#38BDF8" />
                ) : (
                  <ArrowRight size={13} color={theme.textMuted || '#71717A'} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconSlot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(204, 120, 92, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    flex: 1,
    letterSpacing: -0.2,
  },
  reasonPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  reasonText: {
    fontSize: 11,
    color: '#38BDF8',
    lineHeight: 16,
    fontWeight: '600',
  },
  optionsList: {
    marginTop: 12,
    gap: 7,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  letterBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 11,
    fontWeight: '800',
  },
  labelCol: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  optionDesc: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 1.5,
  },
  actionSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  selectedDoneText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
