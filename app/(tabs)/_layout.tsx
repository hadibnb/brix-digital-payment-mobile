import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, layout, typography } from '../../src/theme';

/**
 * Primary navigation.
 *
 * Five destinations — the maximum a bottom bar should carry — chosen so the
 * daily-use surfaces are one tap away and the rest live under "More":
 *
 *   Dashboard · Wallet · BRIX Card · Transactions · More
 *
 * Everything else from the web sidebar (Card-to-Card, Pay, Merchant, Send,
 * Fund BRIX, Receive, Account) is reachable from "More" and from the dashboard
 * quick actions, so no existing function is lost to a smaller screen.
 */
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.base },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.theme,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? layout.tabBarHeight + 22 : layout.tabBarHeight + 8,
          paddingTop: 6,
          // Material's default ripple/label motion is what makes this feel
          // native rather than like a web tab strip.
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'dashboard' : 'dashboard'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('nav.wallet'),
          tabBarIcon: ({ color }) => <MaterialIcons name="account-balance-wallet" size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: t('nav.card'),
          tabBarIcon: ({ color }) => <MaterialIcons name="credit-card" size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('nav.transactions'),
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('nav.more'),
          tabBarIcon: ({ color }) => <MaterialIcons name="apps" size={23} color={color} />,
        }}
      />
      {/* Account lives inside More but keeps its own route so it is deep-linkable. */}
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}

void typography;
void View;
