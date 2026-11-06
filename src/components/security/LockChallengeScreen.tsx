/**
 * FULL-SCREEN APP LOCK CHALLENGE
 * Renders immediately at root navigation layer before protected financial data is mounted.
 * TalkBack-compliant accessibility and custom numeric keypad.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  useColorScheme,
  Vibration,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Delete } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET, MAX_CONTENT_WIDTH } from '../../design/tokens';
import { useSecurity } from '../../services/security/SecurityContext';
import { SecurityService } from '../../services/security/SecurityService';

export function LockChallengeScreen() {
  const security = useSecurity();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    async function checkLockout() {
      if (await SecurityService.isLockedOut()) {
        const remainingSec = Math.ceil((await SecurityService.getLockoutRemainingMs()) / 1000);
        setErrorMsg(`Too many failed attempts. Locked out for ${remainingSec}s.`);
      }
    }
    checkLockout();
  }, []);

  const handleKeyPress = async (digit: string) => {
    if (isVerifying || pin.length >= 6) return;
    setErrorMsg('');

    if (await SecurityService.isLockedOut()) {
      const remainingSec = Math.ceil((await SecurityService.getLockoutRemainingMs()) / 1000);
      setErrorMsg(`Locked out. Try again in ${remainingSec}s.`);
      return;
    }

    const newPin = pin + digit;
    setPin(newPin);

    // Auto-verify if 4 or 6 digits
    if (newPin.length >= 4) {
      setIsVerifying(true);
      const success = await security.unlockSessionAsync(newPin);
      if (!success) {
        if (await SecurityService.isLockedOut()) {
          const remainingSec = Math.ceil((await SecurityService.getLockoutRemainingMs()) / 1000);
          setErrorMsg(`Locked out for ${remainingSec}s.`);
          setPin('');
        } else if (newPin.length === 6) {
          Vibration.vibrate(200);
          const attempts = await SecurityService.getFailedAttempts();
          setErrorMsg(`Incorrect Master PIN (${attempts}/5).`);
          setPin('');
        }
      }
      setIsVerifying(false);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setErrorMsg('');
      setPin(pin.slice(0, -1));
    }
  };

  const handleManualUnlock = async () => {
    if (pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }

    if (await SecurityService.isLockedOut()) {
      const remainingSec = Math.ceil((await SecurityService.getLockoutRemainingMs()) / 1000);
      setErrorMsg(`Locked out for ${remainingSec}s.`);
      return;
    }

    setIsVerifying(true);
    const success = await security.unlockSessionAsync(pin);
    if (!success) {
      Vibration.vibrate(200);
      if (await SecurityService.isLockedOut()) {
        const remainingSec = Math.ceil((await SecurityService.getLockoutRemainingMs()) / 1000);
        setErrorMsg(`Too many failed attempts. Locked out for ${remainingSec}s.`);
      } else {
        const attempts = await SecurityService.getFailedAttempts();
        setErrorMsg(`Incorrect Master PIN (${attempts}/5).`);
      }
      setPin('');
    }
    setIsVerifying(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#0B0B0D' }]}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header / Brand Mark */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/brand/billframe-mark.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Billframe Secured</Text>
          <Text style={styles.subtitle}>
            Enter your Master PIN to access your financial records
          </Text>
        </View>

        {/* PIN Dot Indicators */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                pin.length > idx ? styles.dotFilled : styles.dotEmpty,
                errorMsg ? styles.dotError : null,
              ]}
            />
          ))}
          {pin.length > 4 ? (
            [4, 5].slice(0, pin.length - 4).map((idx) => (
              <View
                key={idx + 4}
                style={[styles.dot, styles.dotFilled, errorMsg ? styles.dotError : null]}
              />
            ))
          ) : null}
        </View>

        {errorMsg ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {errorMsg}
          </Text>
        ) : (
          <View style={{ height: 20 }} />
        )}

        {/* Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'delete'],
          ].map((row, rowIdx) => (
            <View key={rowIdx} style={styles.keypadRow}>
              {row.map((key, keyIdx) => {
                if (key === '') {
                  return <View key={keyIdx} style={styles.keyEmpty} />;
                }
                if (key === 'delete') {
                  return (
                    <Pressable
                      key={keyIdx}
                      style={({ pressed }) => [styles.keyButton, pressed && styles.keyPressed]}
                      onPress={handleDelete}
                      accessibilityRole="button"
                      accessibilityLabel="Delete digit"
                    >
                      <Delete color="#A1A1AA" size={24} />
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={keyIdx}
                    style={({ pressed }) => [styles.keyButton, pressed && styles.keyPressed]}
                    onPress={() => handleKeyPress(key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Digit ${key}`}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {pin.length >= 4 && (
          <Pressable
            style={({ pressed }) => [
              styles.unlockBtn,
              { backgroundColor: theme.brandAnchor, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleManualUnlock}
            accessibilityRole="button"
            accessibilityLabel="Unlock Billframe"
          >
            <Text style={styles.unlockBtnText}>Unlock</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: spacing.md,
  },
  title: {
    color: '#F4F4F6',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotEmpty: {
    borderWidth: 2,
    borderColor: '#3F3F46',
  },
  dotFilled: {
    backgroundColor: '#2563EB',
  },
  dotError: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    height: 20,
    fontWeight: '500',
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: '#27272A',
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    color: '#F4F4F6',
    fontSize: 28,
    fontWeight: '600',
  },
  unlockBtn: {
    marginTop: spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.sm,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
