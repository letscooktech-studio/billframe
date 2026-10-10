/**
 * REUSABLE LOGO UPLOADER COMPONENT
 * 
 * Production-ready asset uploader for organization brand marks and logos:
 * - Cross-platform: Mobile (expo-image-picker) & Web (HTML file input pipeline)
 * - Validation: PNG, JPG, JPEG, WEBP, SVG with 2MB strict size limit
 * - App-private durable storage via LogoStorageService
 * - Instant profile synchronization via BusinessProfileRepository
 * - Gold/Black Enterprise design matching Billframe Document Masters
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  useColorScheme,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Trash2, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';
import { LogoStorageService } from '../../services/image/LogoStorageService';
import { BusinessProfileRepository } from '../../data/repositories/BusinessProfileRepository';

export interface LogoUploaderProps {
  /** Current logo URI (Data URI, file URI, or remote URL) */
  logoUri?: string | null;
  /** Callback fired when logo is updated or removed */
  onLogoChange: (newUri: string | null) => void;
  /** Organization profile ID to scope storage (defaults to active profile) */
  profileId?: string;
  /** Automatically persist change to active BusinessProfile in SQLite */
  autoSaveProfile?: boolean;
  /** Render compact layout for tight toolbars or inline sections */
  compact?: boolean;
  /** Custom heading label */
  label?: string;
  /** Custom description text */
  description?: string;
  /** Show the remove logo button */
  showRemove?: boolean;
}

export function LogoUploader({
  logoUri,
  onLogoChange,
  profileId,
  autoSaveProfile = true,
  compact = false,
  label = 'Organization Logo & Brand Mark',
  description = 'Appears in executive monochrome header frame across all 36 enterprise documents and invoices.',
  showRemove = true,
}: LogoUploaderProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [isLoading, setIsLoading] = useState(false);
  const [currentUri, setCurrentUri] = useState<string | null>(logoUri || null);

  // Sync internal state if prop updates
  React.useEffect(() => {
    setCurrentUri(logoUri || null);
  }, [logoUri]);

  /**
   * Processes and stores a chosen logo asset, then persists to profile.
   */
  const processAndPersistLogo = async (
    sourceUri: string,
    mimeType?: string,
    fileSize?: number
  ) => {
    setIsLoading(true);
    try {
      const activeProfileId = profileId || (await BusinessProfileRepository.getActiveProfile())?.id || 'default_business_profile';

      // 1. Process via asset pipeline
      const processed = await LogoStorageService.processAndStoreLogoAsync({
        profileId: activeProfileId,
        sourceUri,
        mimeType,
        fileSize,
      });

      const effectiveUri = processed.dataUri || processed.storedUri;
      setCurrentUri(effectiveUri);
      onLogoChange(effectiveUri);

      // 2. Persist to active business profile if enabled
      if (autoSaveProfile) {
        await BusinessProfileRepository.updateProfile({
          id: activeProfileId,
          logo_uri: effectiveUri,
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to process logo file.';
      if (Platform.OS === 'web') {
        window.alert(`Logo Upload Error: ${msg}`);
      } else {
        Alert.alert('Logo Upload Failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Triggers file selection across Web and Native.
   */
  const handlePickLogo = async () => {
    if (isLoading) return;

    if (Platform.OS === 'web') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
        input.style.display = 'none';

        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return;

          // 2MB size check
          if (file.size > 2 * 1024 * 1024) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            window.alert(`Selected file (${sizeMb} MB) exceeds the 2 MB limit. Please select an image under 2 MB.`);
            return;
          }

          const reader = new FileReader();
          reader.onload = async () => {
            const dataUri = reader.result as string;
            await processAndPersistLogo(dataUri, file.type, file.size);
          };
          reader.readAsDataURL(file);
          document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
      } catch (err: any) {
        // Fallback to ImagePicker on web if DOM manipulation fails
        fallbackImagePicker();
      }
      return;
    }

    // Native mobile (Android / iOS)
    fallbackImagePicker();
  };

  const fallbackImagePicker = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Photo library access is required to select your organization logo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndPersistLogo(asset.uri, asset.mimeType, asset.fileSize);
      }
    } catch (err: any) {
      Alert.alert('Image Selection Error', err?.message || 'Could not select photo.');
    }
  };

  /**
   * Removes current logo asset.
   */
  const handleRemoveLogo = async () => {
    if (isLoading) return;

    const performRemoval = async () => {
      setIsLoading(true);
      try {
        const activeProfileId = profileId || (await BusinessProfileRepository.getActiveProfile())?.id || 'default_business_profile';
        await LogoStorageService.removeLogoAsync(activeProfileId, currentUri);
        setCurrentUri(null);
        onLogoChange(null);

        if (autoSaveProfile) {
          await BusinessProfileRepository.updateProfile({
            id: activeProfileId,
            logo_uri: null,
          });
        }
      } catch {
        setCurrentUri(null);
        onLogoChange(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Remove organization logo from all documents?')) {
        await performRemoval();
      }
    } else {
      Alert.alert(
        'Remove Organization Logo',
        'Are you sure you want to remove the logo? Documents will revert to the gold monogram placeholder.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: performRemoval },
        ]
      );
    }
  };

  // -------------------------------------------------------------
  // COMPACT LAYOUT
  // -------------------------------------------------------------
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactFrame}>
          {currentUri ? (
            <Image source={{ uri: currentUri }} style={styles.compactImage} resizeMode="contain" />
          ) : (
            <View style={styles.compactPlaceholder}>
              <Text style={styles.compactPlaceholderText}>✦ LOGO</Text>
            </View>
          )}
        </View>

        <View style={styles.compactActions}>
          <Pressable
            style={styles.compactBtnPrimary}
            onPress={handlePickLogo}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={currentUri ? 'Change Logo' : 'Upload Logo'}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Upload size={14} color="#FFFFFF" />
                <Text style={styles.compactBtnTextPrimary}>
                  {currentUri ? 'Change Logo' : 'Upload Logo'}
                </Text>
              </>
            )}
          </Pressable>

          {currentUri && showRemove ? (
            <Pressable
              style={styles.compactBtnDanger}
              onPress={handleRemoveLogo}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Remove Logo"
            >
              <Trash2 size={14} color="#EF4444" />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // STANDARD CARD LAYOUT
  // -------------------------------------------------------------
  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.iconBox}>
          <Sparkles size={16} color="#C59B27" />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.cardTitle}>{label}</Text>
          <Text style={styles.cardSubtitle}>{description}</Text>
        </View>
      </View>

      <View style={styles.bodyRow}>
        {/* Logo Frame matching Gold/Black Master standard */}
        <View style={styles.logoFrame}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#C59B27" />
          ) : currentUri ? (
            <Image source={{ uri: currentUri }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyPlaceholderStar}>✦</Text>
              <Text style={styles.emptyPlaceholderText}>LOGO</Text>
            </View>
          )}
        </View>

        {/* Controls and guidance */}
        <View style={styles.controlsWrap}>
          <View style={styles.statusRow}>
            {currentUri ? (
              <View style={styles.activePill}>
                <CheckCircle2 size={12} color="#059669" />
                <Text style={styles.activePillText}>Brand Mark Active</Text>
              </View>
            ) : (
              <View style={styles.inactivePill}>
                <Text style={styles.inactivePillText}>Default Monogram Frame</Text>
              </View>
            )}
            <Text style={styles.formatGuidance}>PNG, JPG, WEBP, SVG • Max 2 MB</Text>
          </View>

          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [
                styles.uploadBtn,
                pressed && { opacity: 0.8 },
                isLoading && { opacity: 0.6 },
              ]}
              onPress={handlePickLogo}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={currentUri ? 'Change Logo Image' : 'Upload Logo Image'}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <Upload size={16} color="#0F172A" />
                  <Text style={styles.uploadBtnText}>
                    {currentUri ? 'Change Logo' : 'Upload Logo'}
                  </Text>
                </>
              )}
            </Pressable>

            {currentUri && showRemove ? (
              <Pressable
                style={({ pressed }) => [
                  styles.removeBtn,
                  pressed && { opacity: 0.8 },
                  isLoading && { opacity: 0.6 },
                ]}
                onPress={handleRemoveLogo}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Remove Logo"
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.removeBtnText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: radii.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoFrame: {
    width: 76,
    height: 76,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  emptyPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPlaceholderStar: {
    color: '#000000',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },
  emptyPlaceholderText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  controlsWrap: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  statusRow: {
    marginBottom: spacing.sm,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  activePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  inactivePill: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  inactivePillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  formatGuidance: {
    color: '#64748B',
    fontSize: 11,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    minHeight: 36,
    marginRight: spacing.sm,
  },
  uploadBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    minHeight: 36,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Compact layout styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  compactFrame: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPlaceholderText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  compactBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    marginRight: 6,
  },
  compactBtnTextPrimary: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  compactBtnDanger: {
    padding: 6,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});
