/**
 * BOTTOM TAB BAR NAVIGATION — 5 PERMANENT DESTINATIONS
 * Standardized across Billframe 2.0 master navigation architecture:
 * 1. Home (Business overview, outstanding, quick actions)
 * 2. Documents (Document creation, categories, history, templates)
 * 3. Clients (Customer directory, balances, statements, client actions)
 * 4. Work (Operational workspace: jobs, inventory, projects, expenses)
 * 5. All (Categorized directory of all app tools and settings)
 * 
 * Strict invariants:
 * - Tab order remains permanently fixed (never dynamically reordered)
 * - Restrained monochrome icons and active indicators
 * - Preserves existing underlying route names for 100% backward compatibility
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Home, FileText, Users, Briefcase, LayoutGrid } from 'lucide-react-native';
import { colors } from '../../design/tokens';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brandAnchor,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.borderSubtle,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 66,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) => <FileText color={color} size={22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color }) => <Users color={color} size={22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          title: 'Work',
          tabBarIcon: ({ color }) => <Briefcase color={color} size={22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'All',
          tabBarIcon: ({ color }) => <LayoutGrid color={color} size={22} strokeWidth={2} />,
        }}
      />

      {/* Hidden legacy routes preserved for backward compatibility */}
      <Tabs.Screen
        name="customers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
