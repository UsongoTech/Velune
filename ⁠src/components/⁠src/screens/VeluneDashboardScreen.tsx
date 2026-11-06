import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { VeluneTheme } from '../constants/theme';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_stripe_publishable_key';
const MERCHANT_ID = 'merchant.com.yourdomain.velune';
const API_BASE_URL = 'https://api.yourdomain.com/api';

const { width } = Dimensions.get('window');

// --- TYPES ---
export interface TipTransaction {
  id: string;
  sender: string;
  amount: number;
  message: string;
  timestamp: string;
}

export interface AnalyticsMetric {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

// --- INITIAL MOCK DATA ---
const INITIAL_TRANSACTIONS: TipTransaction[] = [
  { id: '1', sender: 'Amina K.', amount: 25.0, message: 'Love the new track! Keep shining ✨', timestamp: '10 mins ago' },
  { id: '2', sender: 'David M.', amount: 50.0, message: 'Incredible acoustic vibe tonight 🔥', timestamp: '32 mins ago' },
  { id: '3', sender: 'Sarah T.', amount: 10.0, message: 'Warm greetings from Mombasa!', timestamp: '1 hour ago' },
  { id: '4', sender: 'Anonymous', amount: 100.0, message: 'Superfan tip!', timestamp: '2 hours ago' },
];

const METRICS: AnalyticsMetric[] = [
  { title: 'Total Revenue', value: '$2,480.50', change: '+18.4%', isPositive: true },
  { title: 'Live Viewers', value: '1,420', change: '+12.1%', isPositive: true },
  { title: 'Tips Today', value: '$385.00', change: '+24.5%', isPositive: true },
  { title: 'Avg. Watch Time', value: '24m 12s', change: '-2.1%', isPositive: false },
];

// --- INNER DASHBOARD CONTENT COMPONENT ---
function DashboardContent() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isLive, setIsLive] = useState<boolean>(true);
  const [loadingPayment, setLoadingPayment] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<TipTransaction[]>(INITIAL_TRANSACTIONS);

  // Trigger Native Stripe Tipping Flow directly from Creator Console
  const handleQuickTip = async (amount: number) => {
    if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes('your_stripe_publishable_key')) {
      Alert.alert(
        'Stripe Configuration Required',
        'Please configure your Stripe publishable key in src/screens/VeluneDashboardScreen.tsx before testing live payments.'
      );
      return;
    }

    setLoadingPayment(true);
    try {
      // 1. Request Payment Intent from Backend
      const response = await fetch(`${API_BASE_URL}/payments/payment-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          creatorId: 'velune_creator_001',
          customerEmail: 'fan@velune.com',
        }),
      });

      if (!response.ok) {
        throw new Error('Could not initiate tip transaction with server');
      }

      const { paymentIntent, ephemeralKey, customer } = await response.json();

      // 2. Initialize Payment Sheet with Apple Pay & Google Pay support
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Velune Streamer Tip',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        applePay: { merchantCountryCode: 'US' },
        googlePay: { merchantCountryCode: 'US', testEnv: true, currencyCode: 'USD' },
        style: 'alwaysDark',
      });

      if (initError) throw new Error(initError.message);

      // 3. Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Tip Error', presentError.message);
        }
      } else {
        Alert.alert('Tip Received 🌙', `Thank you! Your $${amount.toFixed(2)} tip was received.`);
        
        const newTip: TipTransaction = {
          id: `${Date.now()}-${Math.random()}`,
          sender: 'You (Test Fan)',
          amount,
          message: 'Quick tip via Velune Creator Console',
          timestamp: 'Just now',
        };
        setTransactions(prev => [newTip, ...prev]);
      }
    } catch (err: any) {
      Alert.alert('Payment Status', err.message || 'Error processing transaction');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandTitle}>VELUNE</Text>
          <Text style={styles.subTitle}>Creator Live Console</Text>
        </View>

        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: isLive ? VeluneTheme.colors.liveBadge : '#334155' }]}
          onPress={() => setIsLive(!isLive)}
        >
          <View style={[styles.dot, { backgroundColor: isLive ? '#ffffff' : '#94a3b8' }]} />
          <Text style={styles.statusText}>{isLive ? 'BROADCASTING' : 'OFFLINE'}</Text>
        </TouchableOpacity>
      </View>

      {/* METRICS GRID */}
      <Text style={styles.sectionHeader}>Analytics Overview</Text>
      <View style={styles.metricsGrid}>
        {METRICS.map((item, index) => (
          <View key={`metric-${index}`} style={styles.metricCard}>
            <Text style={styles.metricTitle}>{item.title}</Text>
            <Text style={styles.metricValue}>{item.value}</Text>
            <Text style={[styles.metricChange, { color: item.isPositive ? VeluneTheme.colors.successGreen : '#ef4444' }]}>
              {item.change} <Text style={{ color: VeluneTheme.colors.textSecondary }}>this week</Text>
            </Text>
          </View>
        ))}
      </View>

      {/* STRIPE QUICK TIP CONTROL PANEL */}
      <View style={styles.tippingCard}>
        <Text style={styles.tippingTitle}>Stream Tip Test Panel</Text>
        <Text style={styles.tippingSub}>Test native Apple Pay & Google Pay tip processing</Text>

        <View style={styles.tipButtonGroup}>
          {[5, 15, 50].map((amt) => (
            <TouchableOpacity
              key={`tip-${amt}`}
              style={styles.tipButton}
              onPress={() => handleQuickTip(amt)}
              disabled={loadingPayment}
            >
              <Text style={styles.tipButtonText}>Tip ${amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingPayment && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={VeluneTheme.colors.goldPrimary} size="small" />
            <Text style={styles.loadingText}>Initializing Payment Sheet...</Text>
          </View>
        )}
      </View>

      {/* RECENT REVENUE & ACTIVITY FEED */}
      <Text style={styles.sectionHeader}>Live Tip Stream</Text>
      <View style={styles.activityCard}>
        {transactions.map((item) => (
          <View key={item.id} style={styles.transactionRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{item.sender.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.senderName}>{item.sender}</Text>
                <Text style={styles.tipAmount}>+${item.amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.tipMessage} numberOfLines={1}>{item.message}</Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// --- MAIN EXPORTED CREATOR DASHBOARD SCREEN ---
export default function VeluneDashboardScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={VeluneTheme.colors.background} />
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier={MERCHANT_ID}
      >
        <DashboardContent />
      </StripeProvider>
    </SafeAreaView>
  );
}

// --- COMPONENT STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VeluneTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: VeluneTheme.colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: VeluneTheme.colors.cardBorder,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: VeluneTheme.colors.goldPrimary,
    letterSpacing: 3,
  },
  subTitle: {
    fontSize: 13,
    color: VeluneTheme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: VeluneTheme.colors.textPrimary,
    marginBottom: 14,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 52) / 2,
    backgroundColor: VeluneTheme.colors.cardBackground,
    borderColor: VeluneTheme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 12,
    color: VeluneTheme.colors.textSecondary,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: VeluneTheme.colors.goldPrimary,
    marginVertical: 6,
  },
  metricChange: {
    fontSize: 11,
    fontWeight: '600',
  },
  tippingCard: {
    backgroundColor: VeluneTheme.colors.cardBackground,
    borderColor: VeluneTheme.colors.glowPurple,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  tippingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: VeluneTheme.colors.goldPrimary,
  },
  tippingSub: {
    fontSize: 12,
    color: VeluneTheme.colors.textSecondary,
    marginBottom: 14,
    marginTop: 2,
  },
  tipButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipButton: {
    flex: 1,
    backgroundColor: VeluneTheme.colors.glowPurple,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: VeluneTheme.colors.goldSecondary,
  },
  tipButtonText: {
    color: VeluneTheme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loadingText: {
    color: VeluneTheme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
  },
  activityCard: {
    backgroundColor: VeluneTheme.colors.cardBackground,
    borderColor: VeluneTheme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#221538',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: VeluneTheme.colors.glowPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: VeluneTheme.colors.goldPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  senderName: {
    color: VeluneTheme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  tipAmount: {
    color: VeluneTheme.colors.goldPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  tipMessage: {
    color: VeluneTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  timestamp: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
  },
});
