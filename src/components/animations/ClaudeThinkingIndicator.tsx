/**
 * CLAUDE THINKING INDICATOR & LIVE SUB-AGENT TASK RUNNER
 * 
 * Replicates Claude's exact, authentic thinking presentation:
 * 1. Container-free, flat, seamless inline thinking trigger.
 * 2. Subtle, organic pulsing indicator while reasoning (no cartoonish logos or jarring shifts).
 * 3. Quiet, understated completed state: "Thought for Xs ⌵".
 * 4. Smooth, left-bordered indented thought stream with genuine task checkpoints & reasoning.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { AgentTaskStep } from '../../services/ai/AiDocumentAgent';

export interface ClaudeThinkingIndicatorProps {
  isThinking: boolean;
  thoughtDurationSeconds?: number;
  elapsedSeconds?: number;
  taskSteps?: AgentTaskStep[];
  reasoningTrace?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  textColor?: string;
  textSecondaryColor?: string;
  borderColor?: string;
  surfaceColor?: string;
}

// Claude's refined thinking words
const CLAUDE_THINKING_WORDS = [
  'Thinking',
  'Reasoning',
  'Evaluating rules',
  'Synthesizing',
];

export function ClaudeThinkingIndicator({
  isThinking,
  thoughtDurationSeconds = 1.8,
  elapsedSeconds = 0,
  taskSteps = [],
  reasoningTrace = '',
  isExpanded,
  onToggleExpand,
  textColor = '#F4F4F5',
  textSecondaryColor = '#8E8E93',
}: ClaudeThinkingIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const wordFadeAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  // Multi-frequency wave equalizer bars
  const eqBar1 = useRef(new Animated.Value(5)).current;
  const eqBar2 = useRef(new Animated.Value(9)).current;
  const eqBar3 = useRef(new Animated.Value(12)).current;
  const eqBar4 = useRef(new Animated.Value(4)).current;

  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [shouldRenderBody, setShouldRenderBody] = useState(isExpanded);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  // Smooth accordion expansion & collapse
  useEffect(() => {
    if (isExpanded) {
      setShouldRenderBody(true);
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setShouldRenderBody(false);
      });
    }
  }, [isExpanded, expandAnim]);

  // Soft organic pulse animation for thinking dot
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (isThinking && !reduceMotion) {
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0.35,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.25,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.85,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
      scaleAnim.setValue(1);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [isThinking, pulseAnim, scaleAnim, reduceMotion]);

  // Multi-frequency wave equalizer bars loop
  useEffect(() => {
    let eqLoop: Animated.CompositeAnimation | null = null;
    if (isThinking && !reduceMotion) {
      eqLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(eqBar1, { toValue: 12, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(eqBar1, { toValue: 4, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.delay(100),
            Animated.timing(eqBar2, { toValue: 16, duration: 375, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(eqBar2, { toValue: 6, duration: 375, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(eqBar3, { toValue: 14, duration: 325, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(eqBar3, { toValue: 5, duration: 325, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.delay(150),
            Animated.timing(eqBar4, { toValue: 10, duration: 425, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(eqBar4, { toValue: 3, duration: 425, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
        ])
      );
      eqLoop.start();
    } else {
      eqBar1.setValue(5);
      eqBar2.setValue(9);
      eqBar3.setValue(12);
      eqBar4.setValue(4);
    }
    return () => {
      if (eqLoop) eqLoop.stop();
    };
  }, [isThinking, eqBar1, eqBar2, eqBar3, eqBar4, reduceMotion]);

  // Cycle thinking words smoothly
  useEffect(() => {
    let wordInterval: any = null;

    if (isThinking) {
      wordInterval = setInterval(() => {
        Animated.sequence([
          Animated.timing(wordFadeAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(wordFadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();

        setActiveWordIndex((prev) => (prev + 1) % CLAUDE_THINKING_WORDS.length);
      }, 2400);
    } else {
      setActiveWordIndex(0);
      wordFadeAnim.setValue(1);
    }

    return () => {
      if (wordInterval) clearInterval(wordInterval);
    };
  }, [isThinking, wordFadeAnim]);

  const durationSec = Math.max(1, Math.round(thoughtDurationSeconds || elapsedSeconds || 1));

  // Extract clean thought monologue paragraphs without raw markdown JSON blobs
  const thoughtParagraphs = React.useMemo(() => {
    if (!reasoningTrace || !reasoningTrace.trim()) return [];
    return reasoningTrace
      .replace(/```(?:json)?[\s\S]*?```/g, '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !p.startsWith('{') && !p.endsWith('}'));
  }, [reasoningTrace]);

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {/* ── 1. Container-Free Pure Inline Thinking Trigger ── */}
      <Pressable
        style={styles.inlineThinkingTrigger}
        onPress={onToggleExpand}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          isThinking
            ? 'Model is thinking'
            : `Thought for ${durationSec} seconds. Double tap to toggle reasoning trace.`
        }
      >
        <View style={styles.triggerContent}>
          {isThinking ? (
            <View style={styles.thinkingIndicatorGroup}>
              {/* Soft Pulsing Dot */}
              <Animated.View
                style={[
                  styles.thinkingDot,
                  {
                    opacity: pulseAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              />
              {/* Multi-Frequency Wave Equalizer Bars */}
              <View style={styles.miniEqualizerRow}>
                <Animated.View style={[styles.miniEqBar, { height: eqBar1 }]} />
                <Animated.View style={[styles.miniEqBar, { height: eqBar2 }]} />
                <Animated.View style={[styles.miniEqBar, { height: eqBar3 }]} />
                <Animated.View style={[styles.miniEqBar, { height: eqBar4 }]} />
              </View>
            </View>
          ) : null}

          {isThinking ? (
            <Animated.Text
              style={[
                styles.thinkingLabel,
                { color: textSecondaryColor, opacity: wordFadeAnim },
              ]}
            >
              {CLAUDE_THINKING_WORDS[activeWordIndex]}
              {elapsedSeconds > 0 ? ` (${elapsedSeconds.toFixed(1)}s)` : '...'}
            </Animated.Text>
          ) : (
            <Text style={[styles.thoughtCompletedLabel, { color: textSecondaryColor }]}>
              {`Thought for ${durationSec} second${durationSec === 1 ? '' : 's'}`}
            </Text>
          )}

          <Animated.View
            style={{
              marginLeft: 4,
              transform: [
                {
                  rotate: expandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            }}
          >
            <ChevronDown size={12} color={textSecondaryColor} />
          </Animated.View>
        </View>
      </Pressable>

      {/* ── 2. Container-Free Left-Bordered Reasoning Stream with Silk Accordion Motion ── */}
      {shouldRenderBody && (
        <Animated.View
          style={[
            styles.expandedThoughtStream,
            {
              opacity: expandAnim,
              transform: [
                {
                  translateY: expandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-6, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Sub-Agent Task Steps (if present) */}
          {taskSteps.length > 0 && (
            <View style={styles.taskStepsBlock}>
              {taskSteps.map((step) => {
                const isRunning = step.status === 'running';
                const isDone = step.status === 'completed';

                return (
                  <View key={step.id} style={styles.taskRow}>
                    <View style={styles.taskIconSlot}>
                      {isRunning ? (
                        <Animated.View style={{ opacity: pulseAnim }}>
                          <Text style={{ fontSize: 9, color: '#38BDF8' }}>●</Text>
                        </Animated.View>
                      ) : isDone ? (
                        <Check size={11} color="#10B981" strokeWidth={2.5} />
                      ) : (
                        <Text style={{ fontSize: 9, color: textSecondaryColor }}>○</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.taskLabelText,
                        {
                          color: isRunning ? textColor : textSecondaryColor,
                          fontWeight: isRunning ? '600' : '400',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Genuine Neural Monologue Text */}
          {thoughtParagraphs.length > 0 ? (
            <View style={styles.thoughtParagraphsBlock}>
              {thoughtParagraphs.map((paragraph, idx) => (
                <Text
                  key={idx}
                  style={[styles.thoughtBodyText, { color: textSecondaryColor }]}
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          ) : isThinking && taskSteps.length === 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 }}>
              <Animated.Text style={{ opacity: pulseAnim, color: '#38BDF8', fontSize: 11 }}>
                ●
              </Animated.Text>
              <Text style={[styles.thoughtBodyText, { color: textSecondaryColor, fontStyle: 'italic' }]}>
                Analyzing query and grounding records...
              </Text>
            </View>
          ) : null}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    alignSelf: 'flex-start',
    width: '100%',
    backgroundColor: 'transparent',
  },
  inlineThinkingTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thinkingIndicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miniEqualizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    gap: 2,
    marginRight: 2,
  },
  miniEqBar: {
    width: 2.2,
    borderRadius: 1,
    backgroundColor: '#2DD4BF',
  },
  thinkingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#38BDF8',
  },
  thinkingLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  thoughtCompletedLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  expandedThoughtStream: {
    marginTop: 6,
    marginBottom: 4,
    marginLeft: 2,
    paddingLeft: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'transparent',
  },
  taskStepsBlock: {
    gap: 4,
    marginBottom: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskIconSlot: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskLabelText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  thoughtParagraphsBlock: {
    gap: 6,
  },
  thoughtBodyText: {
    fontSize: 12.5,
    lineHeight: 18.5,
    letterSpacing: 0.1,
  },
});
