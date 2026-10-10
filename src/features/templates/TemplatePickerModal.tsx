/**
 * TEMPLATE PICKER & STUDIO SELECTION MODAL
 * Allows switching between document presentation styles, previewing template traits,
 * sharing with custom templates, and setting default templates per document type.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, useColorScheme, Pressable, ScrollView } from 'react-native';
import { LayoutTemplate, Check, Star, Share2, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { KeyboardAwareSheet } from '../../components/common/KeyboardAwareSheet';
import { PdfTemplateType } from '../../services/pdf/types';
import { TemplateDefinitionRecord } from '../../data/repositories/TemplateRepository';
import { colors, spacing, radii, typography, MIN_TOUCH_TARGET } from '../../design/tokens';

export interface TemplatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTemplate: PdfTemplateType;
  availableTemplates: TemplateDefinitionRecord[];
  docType: string;
  onSelectTemplate: (code: PdfTemplateType) => void;
  onSetAsDefault: (code: PdfTemplateType) => Promise<void>;
  onShareWithTemplate: (code: PdfTemplateType) => void;
}

export function TemplatePickerModal({
  visible,
  onClose,
  selectedTemplate,
  availableTemplates,
  docType,
  onSelectTemplate,
  onSetAsDefault,
  onShareWithTemplate,
}: TemplatePickerModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [activeCode, setActiveCode] = useState<PdfTemplateType>(selectedTemplate);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [defaultSaved, setDefaultSaved] = useState(false);

  React.useEffect(() => {
    setActiveCode(selectedTemplate);
    setDefaultSaved(false);
  }, [selectedTemplate, visible]);

  const docTypeLabel = docType.replace('_', ' ').toUpperCase();

  const handleSelect = (code: string) => {
    const templateCode = code as PdfTemplateType;
    setActiveCode(templateCode);
    onSelectTemplate(templateCode);
    setDefaultSaved(false);
  };

  const handleMakeDefault = async () => {
    setIsSettingDefault(true);
    try {
      await onSetAsDefault(activeCode);
      setDefaultSaved(true);
      setTimeout(() => setDefaultSaved(false), 2500);
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <KeyboardAwareSheet
      visible={visible}
      onClose={onClose}
      title="Document Presentation"
      subtitle={`Choose layout & brand styling for ${docTypeLabel}`}
      maxHeightPercent={85}
      footer={
        <View style={styles.footerRow}>
          <Pressable
            style={[
              styles.secondaryBtn,
              { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceSecondary },
            ]}
            onPress={handleMakeDefault}
            disabled={isSettingDefault}
            accessibilityRole="button"
            accessibilityLabel={`Set as default template for ${docTypeLabel}`}
          >
            {defaultSaved ? (
              <>
                <CheckCircle2 size={16} color={theme.statusSuccess} />
                <Text style={[styles.secondaryBtnText, { color: theme.statusSuccess }]}>Default Saved!</Text>
              </>
            ) : (
              <>
                <Star size={16} color={theme.textPrimary} />
                <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>Set as Default</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: theme.brandAnchor }]}
            onPress={() => {
              onShareWithTemplate(activeCode);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Share document using ${activeCode} template`}
          >
            <Share2 size={16} color={theme.brandAnchorText} />
            <Text style={[styles.primaryBtnText, { color: theme.brandAnchorText }]}>Share PDF</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.container}>
        <View style={[styles.introCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderSubtle }]}>
          <Sparkles size={16} color={theme.brandAnchor} />
          <Text style={[styles.introText, { color: theme.textSecondary }]}>
            All templates preserve statutory tax rules, verified UPI QR codes, and immutable financial totals while tailoring typography and density.
          </Text>
        </View>

        <View style={styles.templatesList}>
          {availableTemplates.map((item) => {
            const isSelected = item.code === activeCode;
            let configColors: { brandColor?: string; secondaryColor?: string } = {};
            try {
              configColors = JSON.parse(item.default_config_json || '{}');
            } catch {
              // fallback
            }

            return (
              <Pressable
                key={item.code}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: isSelected ? theme.brandAnchor + '0D' : theme.surfaceSecondary,
                    borderColor: isSelected ? theme.brandAnchor : theme.borderSubtle,
                  },
                ]}
                onPress={() => handleSelect(item.code)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.name} template`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: configColors.brandColor || '#171717' },
                      ]}
                    />
                    <Text style={[styles.templateName, { color: theme.textPrimary }]}>
                      {item.name}
                    </Text>
                  </View>

                  <View style={styles.cardHeaderRight}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: theme.surface, borderColor: theme.borderSubtle },
                      ]}
                    >
                      <Text style={[styles.categoryText, { color: theme.textMuted }]}>
                        {item.category.toUpperCase()}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: theme.brandAnchor }]}>
                        <Check size={12} color={theme.brandAnchorText} />
                      </View>
                    )}
                  </View>
                </View>

                <Text style={[styles.templateDesc, { color: theme.textSecondary }]}>
                  {item.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </KeyboardAwareSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.lg,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  introText: {
    fontSize: typography.caption.fontSize,
    flex: 1,
    lineHeight: 18,
  },
  templatesList: {
    gap: spacing.sm,
  },
  templateCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  templateName: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  templateDesc: {
    fontSize: typography.caption.fontSize,
    lineHeight: 18,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: typography.supporting.fontSize,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1.2,
    height: MIN_TOUCH_TARGET,
    borderRadius: radii.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtnText: {
    fontSize: typography.supporting.fontSize,
    fontWeight: '700',
  },
});
