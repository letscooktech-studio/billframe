import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { IntelligentMessageRenderer } from './IntelligentMessageRenderer';

interface FluidStreamingTextProps {
  content: string;
  isStreaming: boolean;
  textColor?: string;
  onStreamComplete?: () => void;
  speedMs?: number;
}

/**
 * FluidStreamingText
 * Replicates Claude's organic, rhythmic token streaming cadence.
 * Words materialize in fluid micro-cadence with an active breathing terracotta cursor.
 * When generation finishes, the cursor gently breathes once and fades out.
 */
export const FluidStreamingText: React.FC<FluidStreamingTextProps> = ({
  content,
  isStreaming,
  textColor,
  onStreamComplete,
  speedMs = 18,
}) => {
  // If not streaming initially (e.g. historical messages), display immediately
  const [displayedLength, setDisplayedLength] = useState(() => (isStreaming ? 0 : content.length));
  const cursorPulse = useRef(new Animated.Value(1)).current;
  const cursorFade = useRef(new Animated.Value(isStreaming ? 1 : 0)).current;
  const [showCursor, setShowCursor] = useState(isStreaming);

  // Soft organic pulse loop for active streaming cursor
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (showCursor) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorPulse, {
            toValue: 0.25,
            duration: 480,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(cursorPulse, {
            toValue: 1,
            duration: 480,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      cursorPulse.setValue(1);
    }
    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [showCursor, cursorPulse]);

  // Token cadence timer
  useEffect(() => {
    if (!content) return;

    // If streaming has completed and all text is displayed, fade out cursor
    if (!isStreaming && displayedLength >= content.length) {
      if (showCursor) {
        Animated.timing(cursorFade, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setShowCursor(false);
          onStreamComplete?.();
        });
      }
      return;
    }

    // If stream is active, ensure cursor is visible
    if (isStreaming && !showCursor) {
      setShowCursor(true);
      cursorFade.setValue(1);
    }

    // Continue streaming words to completion
    if (displayedLength < content.length) {
      const timer = setTimeout(() => {
        setDisplayedLength((prev) => {
          if (prev >= content.length) return prev;
          // Advance by 1 to 2 words per tick (~8-15 characters)
          const nextSpace = content.indexOf(' ', prev + 6);
          const nextTarget = nextSpace === -1 ? content.length : nextSpace + 1;
          return Math.min(content.length, Math.max(prev + 4, nextTarget));
        });
      }, speedMs);

      return () => clearTimeout(timer);
    }
  }, [content, displayedLength, isStreaming, speedMs, onStreamComplete, cursorFade, showCursor]);

  const visibleContent = displayedLength < content.length ? content.slice(0, displayedLength) : content;

  return (
    <View style={styles.container}>
      <IntelligentMessageRenderer
        content={visibleContent}
        isStreaming={displayedLength < content.length || isStreaming}
        textColor={textColor}
      />
      {showCursor && (
        <Animated.View
          style={[
            styles.claudeCursor,
            {
              opacity: Animated.multiply(cursorPulse, cursorFade),
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  claudeCursor: {
    width: 6,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    marginTop: 4,
    marginLeft: 2,
  },
});
