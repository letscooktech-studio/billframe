/**
 * CLAUDE THINKING INDICATOR & LIVE SUB-AGENT TASK RUNNER
 * 
 * Replicates Claude's exact thinking presentation:
 * 1. 12-spoke radial terracotta sunburst (#CC785C) with hardware-accelerated continuous rotation.
 * 2. Dynamic thinking state cycle: "Mulling", "Cogitating", "Reasoning", "Deliberating", "Synthesizing".
 * 3. Exact completed state: "Thinking for Xs ⌄" with toggle chevron.
 * 4. Real live sub-agent task checklist displaying authentic SQLite queries, RAG lookups, and BigInt checks.
 * 5. Minimalist left-bordered monologue block for real neural reasoning trace.
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
import Svg, { Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
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

// Claude's signature dynamic thinking vocabulary
const CLAUDE_THINKING_WORDS = [
  'Mulling',
  'Cogitating',
  'Reasoning',
  'Deliberating',
  'Synthesizing',
  'Pondering',
];

// Pre-computed 12-spoke radial rays for the Claude terracotta sunburst
const SUNBURST_RAYS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const r1 = 3.6; // Inner radius
  const r2 = 9.2; // Outer radius
  const cx = 10;
  const cy = 10;
  return {
    x1: (cx + r1 * Math.cos(angle)).toFixed(2),
    y1: (cy + r1 * Math.sin(angle)).toFixed(2),
    x2: (cx + r2 * Math.cos(angle)).toFixed(2),
    y2: (cy + r2 * Math.sin(angle)).toFixed(2),
  };
});

export function ClaudeThinkingIndicator({
  isThinking,
  thoughtDurationSeconds = 1.8,
  elapsedSeconds = 0,
  taskSteps = [],
  reasoningTrace = '',
  isExpanded,
  onToggleExpand,
  textColor = '#F4F4F5',
  textSecondaryColor = '#94A3B8',
  borderColor = 'rgba(255, 255, 255, 0.12)',
  surfaceColor = 'rgba(255, 255, 255, 0.04)',
}: ClaudeThinkingIndicatorProps) {
  // Continuous smooth rotation for the Claude sunburst
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.7)).current;
  const wordFadeAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const mirrorSheenAnim = useRef(new Animated.Value(0.35)).current;

  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  // Rotate Claude Sunburst, Liquid Wave & Mirror Glassy Sheen
  useEffect(() => {
    let spinLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let waveLoop: Animated.CompositeAnimation | null = null;
    let sheenLoop: Animated.CompositeAnimation | null = null;

    if (isThinking && !reduceMotion) {
      spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.start();

      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      waveLoop = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      );
      waveLoop.start();

      sheenLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(mirrorSheenAnim, {
            toValue: 0.8,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(mirrorSheenAnim, {
            toValue: 0.35,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      sheenLoop.start();
    } else {
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
      mirrorSheenAnim.setValue(0.3);
    }

    return () => {
      if (spinLoop) spinLoop.stop();
      if (pulseLoop) pulseLoop.stop();
      if (waveLoop) waveLoop.stop();
      if (sheenLoop) sheenLoop.stop();
    };
  }, [isThinking, spinAnim, pulseAnim, waveAnim, mirrorSheenAnim]);

  // Cycle thinking words ("Mulling" -> "Cogitating" -> "Reasoning" ...)
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
      }, 2000);
    } else {
      setActiveWordIndex(0);
      wordFadeAnim.setValue(1);
    }

    return () => {
      if (wordInterval) clearInterval(wordInterval);
    };
  }, [isThinking, wordFadeAnim]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveTranslateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 240],
  });

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
      {/* ── 1. Container-Free Mirror Glassy Thinking Header Pill ── */}
      <Pressable
        style={[
          styles.mirrorGlassPill,
          isThinking ? styles.mirrorGlassPillThinking : styles.mirrorGlassPillCompleted,
        ]}
        onPress={onToggleExpand}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          isThinking
            ? 'Agent is reasoning'
            : `Thinking complete in ${durationSec} seconds. Double tap to toggle reasoning trace.`
        }
      >
        {/* Specular Liquid Wave Sweep Animation */}
        {isThinking && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.waveSweepLayer,
              {
                transform: [{ translateX: waveTranslateX }],
              },
            ]}
          >
            <Svg width={180} height={36} viewBox="0 0 180 36">
              <Defs>
                <LinearGradient id="mirrorGlassWave" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                  <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0" />
                  <Stop offset="48%" stopColor="#CC785C" stopOpacity="0.25" />
                  <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5" />
                  <Stop offset="52%" stopColor="#CC785C" stopOpacity="0.25" />
                  <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={180} height={36} fill="url(#mirrorGlassWave)" />
            </Svg>
          </Animated.View>
        )}

        {/* Ambient Top Mirror Sheen Highlight */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.mirrorSheenOverlay,
            { opacity: mirrorSheenAnim },
          ]}
        />

        <View style={styles.headerLeft}>
          {isThinking ? (
            /* Claude Terracotta Sunburst (Spinning Asterisk) */
            <Animated.View
              style={{
                transform: [{ rotate: spinInterpolate }],
                opacity: pulseAnim,
                marginRight: 2,
              }}
            >
              <Svg width={17} height={17} viewBox="0 0 20 20">
                {SUNBURST_RAYS.map((ray, idx) => (
                  <Line
                    key={idx}
                    x1={ray.x1}
                    y1={ray.y1}
                    x2={ray.x2}
                    y2={ray.y2}
                    stroke="#CC785C"
                    strokeWidth={1.85}
                    strokeLinecap="round"
                  />
                ))}
              </Svg>
            </Animated.View>
          ) : (
            /* Finished Thought Symbol */
            <Text style={[styles.finishedAsterisk, { color: '#CC785C' }]}>✦</Text>
          )}

          {/* Dynamic Thinking Word or Completed Duration */}
          {isThinking ? (
            <Animated.Text
              style={[
                styles.headerText,
                { color: textSecondaryColor, opacity: wordFadeAnim },
              ]}
            >
              {CLAUDE_THINKING_WORDS[activeWordIndex]}
              {elapsedSeconds > 0 ? ` (${elapsedSeconds.toFixed(1)}s)` : ''}
            </Animated.Text>
          ) : (
            <Text style={[styles.headerText, { color: textSecondaryColor }]}>
              {`Thinking for ${durationSec}s`}
            </Text>
          )}
        </View>

        {/* Minimalist Dropdown Chevron */}
        <View style={{ marginLeft: 6 }}>
          {isExpanded ? (
            <ChevronUp size={13} color={textSecondaryColor} />
          ) : (
            <ChevronDown size={13} color={textSecondaryColor} />
          )}
        </View>
      </Pressable>

      {/* ── 2. Container-Free Expanded Real Tasks & Reasoning Drawer ── */}
      {isExpanded && (
        <View style={styles.expandedDrawer}>
          {/* Sub-Agent Real Task Checklist (Container-Free) */}
          {taskSteps.length > 0 && (
            <View style={styles.taskListContainer}>
              {taskSteps.map((step) => {
                const isRunning = step.status === 'running';
                const isDone = step.status === 'completed';

                return (
                  <View key={step.id} style={styles.taskRow}>
                    <View style={styles.taskStatusIcon}>
                      {isRunning ? (
                        <Animated.View style={{ opacity: pulseAnim }}>
                          <Text style={{ fontSize: 10, color: '#CC785C' }}>●</Text>
                        </Animated.View>
                      ) : isDone ? (
                        <Check size={11} color="#10B981" strokeWidth={2.5} />
                      ) : (
                        <Text style={{ fontSize: 10, color: textSecondaryColor }}>○</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.taskLabel,
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

          {/* Real Neural Reasoning Monologue (Container-Free Left-Border Block) */}
          {(thoughtParagraphs.length > 0 || (isThinking && taskSteps.length === 0)) && (
            <View style={styles.monologueContainer}>
              {isThinking && thoughtParagraphs.length === 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Animated.Text style={{ opacity: pulseAnim, color: '#CC785C', fontSize: 12 }}>
                    ●
                  </Animated.Text>
                  <Text style={[styles.monologueText, { color: textSecondaryColor, fontStyle: 'italic' }]}>
                    Analyzing requirements and verifying accounting rules...
                  </Text>
                </View>
              ) : (
                thoughtParagraphs.map((paragraph, idx) => (
                  <Text
                    key={idx}
                    style={[styles.monologueText, { color: textSecondaryColor, marginBottom: 6 }]}
                  >
                    {paragraph}
                  </Text>
                ))
              )}
            </View>
          )}
        </View>
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
    borderWidth: 0,
  },
  mirrorGlassPill: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 7,
    alignSelf: 'flex-start',
  },
  mirrorGlassPillThinking: {
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderColor: 'rgba(204, 120, 92, 0.38)',
    borderTopColor: 'rgba(255, 255, 255, 0.3)', // Mirror specular highlight rim
    shadowColor: '#CC785C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  mirrorGlassPillCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  waveSweepLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 180,
  },
  mirrorSheenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  finishedAsterisk: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerText: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: 0.1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  expandedDrawer: {
    marginTop: 6,
    paddingLeft: 4,
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  taskListContainer: {
    paddingVertical: 4,
    gap: 5,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  taskStatusIcon: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskLabel: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  monologueContainer: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(204, 120, 92, 0.35)',
    paddingLeft: 10,
    marginLeft: 6,
    marginTop: 4,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  monologueText: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
});
