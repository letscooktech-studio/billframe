import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useTheme } from '../../design/ThemeContext';
import { typography, radii, spacing, colors } from '../../design/tokens';
import { Table, CheckCircle2, ChevronRight, FileText, ArrowRight } from 'lucide-react-native';

interface IntelligentMessageRendererProps {
  content: string;
  isStreaming?: boolean;
  textColor?: string;
  onActionPress?: (actionPrompt: string) => void;
}

interface ParsedBlock {
  type: 'table' | 'heading' | 'bullet' | 'paragraph' | 'callout';
  raw: string;
  data?: any;
}

/**
 * Intelligent Markdown & Structured Content Renderer for Billframe AI Chat
 * Converts raw markdown tables, bullet lists, bold headers, and key-value metrics
 * into polished, native card layouts.
 */
export const IntelligentMessageRenderer: React.FC<IntelligentMessageRendererProps> = ({
  content,
  isStreaming,
  textColor,
  onActionPress,
}) => {
  const { theme } = useTheme();
  const primaryTextColor = textColor || theme.textPrimary;

  if (!content) return null;

  // Split content into blocks by parsing markdown constructs
  const blocks = parseContentToBlocks(content);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'table':
            return (
              <View
                key={`tbl_${index}`}
                style={[
                  styles.tableCard,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.borderDefault,
                  },
                ]}
              >
                {/* Table Header Row */}
                {block.data.headers && block.data.headers.length > 0 && (
                  <View
                    style={[
                      styles.tableHeaderRow,
                      {
                        backgroundColor: theme.surface,
                        borderBottomColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    {block.data.headers.map((h: string, hIdx: number) => (
                      <View
                        key={`h_${hIdx}`}
                        style={[
                          styles.tableCell,
                          hIdx === 0 ? styles.colFirst : styles.colRest,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tableHeaderText,
                            { color: theme.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {h.toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Table Body Rows */}
                {block.data.rows.map((row: string[], rIdx: number) => {
                  const isLast = rIdx === block.data.rows.length - 1;
                  const isZebra = rIdx % 2 === 1;

                  return (
                    <View
                      key={`r_${rIdx}`}
                      style={[
                        styles.tableRow,
                        {
                          borderBottomColor: isLast ? 'transparent' : theme.borderSubtle,
                          backgroundColor: isZebra ? theme.surface : 'transparent',
                        },
                      ]}
                    >
                      {row.map((cell: string, cIdx: number) => {
                        const isPrimaryCol = cIdx === 0;
                        const cleanText = cleanMarkdownFormatting(cell);
                        const isHighlighted =
                          cleanText.includes('$') ||
                          cleanText.includes('₹') ||
                          cleanText.toLowerCase().includes('active') ||
                          cleanText.toLowerCase().includes('paid');

                        return (
                          <View
                            key={`c_${cIdx}`}
                            style={[
                              styles.tableCell,
                              isPrimaryCol ? styles.colFirst : styles.colRest,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tableBodyText,
                                {
                                  color: isHighlighted
                                    ? primaryTextColor
                                    : isPrimaryCol
                                    ? theme.textSecondary
                                    : primaryTextColor,
                                  fontWeight: isPrimaryCol
                                    ? '600'
                                    : isHighlighted
                                    ? '700'
                                    : '500',
                                },
                              ]}
                            >
                              {cleanText}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            );

          case 'heading':
            return (
              <View key={`hd_${index}`} style={styles.headingWrapper}>
                <Text style={[styles.headingText, { color: primaryTextColor }]}>
                  {cleanMarkdownFormatting(block.raw)}
                </Text>
              </View>
            );

          case 'bullet':
            return (
              <View key={`bl_${index}`} style={styles.bulletRow}>
                <View
                  style={[
                    styles.bulletDot,
                    { backgroundColor: theme.brandAnchor || '#3B82F6' },
                  ]}
                />
                <Text style={[styles.bulletText, { color: primaryTextColor }]}>
                  {renderInlineFormattedText(block.raw, primaryTextColor, theme.textSecondary)}
                </Text>
              </View>
            );

          case 'callout':
            return (
              <View
                key={`call_${index}`}
                style={[
                  styles.calloutBox,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderLeftColor: theme.brandAnchor || '#3B82F6',
                    borderColor: theme.borderSubtle,
                  },
                ]}
              >
                <Text style={[styles.calloutText, { color: theme.textSecondary }]}>
                  {cleanMarkdownFormatting(block.raw)}
                </Text>
              </View>
            );

          case 'paragraph':
          default:
            return (
              <View key={`p_${index}`} style={styles.paragraphWrapper}>
                <Text style={[styles.paragraphText, { color: primaryTextColor }]}>
                  {renderInlineFormattedText(block.raw, primaryTextColor, theme.textSecondary)}
                </Text>
              </View>
            );
        }
      })}
    </View>
  );
};

/**
 * Parses multi-line markdown content into structured visual blocks
 */
function parseContentToBlocks(content: string): ParsedBlock[] {
  const lines = content.split('\n');
  const blocks: ParsedBlock[] = [];
  let currentTableLines: string[] = [];
  let inTable = false;

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const parsedTable = parseMarkdownTable(currentTableLines);
      if (parsedTable) {
        blocks.push({
          type: 'table',
          raw: currentTableLines.join('\n'),
          data: parsedTable,
        });
      } else {
        // Fallback to paragraphs if table parse fails
        currentTableLines.forEach((l) => {
          blocks.push({ type: 'paragraph', raw: l });
        });
      }
      currentTableLines = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for markdown table line: starts and ends with '|'
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      currentTableLines.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!line) {
      continue;
    }

    // Heading lines
    if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
      blocks.push({ type: 'heading', raw: line.replace(/^#+\s*/, '') });
    } else if (line.startsWith('**') && line.endsWith('**') && !line.includes('\n')) {
      blocks.push({ type: 'heading', raw: line.replace(/^\*\*|\*\*$/g, '') });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ type: 'bullet', raw: line.replace(/^[-*]\s*/, '') });
    } else if (line.startsWith('>') || (line.startsWith('*') && line.endsWith('*'))) {
      blocks.push({ type: 'callout', raw: line.replace(/^>\s*|^\*|\*$/g, '') });
    } else {
      blocks.push({ type: 'paragraph', raw: line });
    }
  }

  if (inTable) {
    flushTable();
  }

  return blocks;
}

/**
 * Extracts headers and cell values from markdown table lines
 */
function parseMarkdownTable(lines: string[]) {
  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] => {
    return line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
  };

  const headers = parseRow(lines[0]);
  // Line 1 is typically separator |---|---|
  const startIndex = lines[1].includes('---') ? 2 : 1;
  const rows: string[][] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (cols.length > 0) {
      rows.push(cols);
    }
  }

  return { headers, rows };
}

/**
 * Strips asterisks, backticks, and markdown artifacts from a string
 */
function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

/**
 * Renders inline bold segments as React Native Text elements
 */
function renderInlineFormattedText(text: string, defaultColor: string, accentColor: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      return (
        <Text key={index} style={{ fontWeight: '700', color: defaultColor }}>
          {boldContent}
        </Text>
      );
    }
    return (
      <Text key={index} style={{ color: defaultColor }}>
        {part}
      </Text>
    );
  });
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  tableCard: {
    width: '100%',
    borderRadius: radii.sm,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
  },
  colFirst: {
    flex: 1.3,
    paddingRight: 8,
  },
  colRest: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  tableBodyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  headingWrapper: {
    marginTop: 6,
    marginBottom: 2,
  },
  headingText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  calloutBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.xs,
    borderLeftWidth: 3,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  calloutText: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  paragraphWrapper: {
    marginVertical: 2,
  },
  paragraphText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
});
