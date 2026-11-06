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
  Switch,
} from 'react-native';
import { VeluneTheme } from '../constants/theme';

const { width } = Dimensions.get('window');

// --- TYPES ---
export interface LiveStreamSession {
  id: string;
  creatorName: string;
  category: string;
  viewers: number;
  reported: boolean;
  status: 'active' | 'suspended';
}

export interface CreatorPayout {
  id: string;
  creatorName: string;
  grossRevenue: number;
  platformFee: number;
  netPayout: number;
  payoutStatus: 'pending' | 'processed';
}

// --- INITIAL MOCK DATA ---
const INITIAL_STREAMS: LiveStreamSession[] = [
  { id: 'str_101', creatorName: 'Azzbash', category: 'R&B / Acoustic', viewers: 1420, reported: false, status: 'active' },
  { id: 'str_102', creatorName: 'DJ Kasimu', category: 'Afropop Mix', viewers: 890, reported: true, status: 'active' },
  { id: 'str_103', creatorName: 'Sarah Live', category: 'Storytelling', viewers: 310, reported: false, status: 'active' },
];

const INITIAL_PAYOUTS: CreatorPayout[] = [
  { id: 'pay_001', creatorName: 'Azzbash', grossRevenue: 2480.50, platformFee: 248.05, netPayout: 2232.45, payoutStatus: 'pending' },
  { id: 'pay_002', creatorName: 'DJ Kasimu', grossRevenue: 1250.00, platformFee: 125.00, netPayout: 1125.00, payoutStatus: 'processed' },
];

export default function VeluneOwnerAdminScreen() {
  const [platformCommission, setPlatformCommission] = useState<number>(10);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'streams' | 'payouts'>('overview');
  
  const [streams, setStreams] = useState<LiveStreamSession[]>(INITIAL_STREAMS);
  const [payouts, setPayouts] = useState<CreatorPayout[]>(INITIAL_PAYOUTS);

  // Moderate or suspend a broadcast in real-time
  const toggleStreamStatus = (streamId: string) => {
    setStreams(prev =>
      prev.map(s => {
        if (s.id === streamId) {
          const newStatus: 'active' | 'suspended' = s.status === 'active' ? 'suspended' : 'active';
          Alert.alert(
            'Moderation Action',
            `Stream by ${s.creatorName} is now ${newStatus.toUpperCase()}`
          );
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
  };

  // Process payouts for creators via Stripe Connect
  const processPayout = (payoutId: string) => {
    setPayouts(prev =>
      prev.map(p => {
        if (p.id === payoutId) {
          Alert.alert('Payout Initiated', `Processed payout of $${p.netPayout.toFixed(2)} to ${p.creatorName}`);
          return { ...p, payoutStatus: 'processed' };
        }
        return p;
      })
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={VeluneTheme.colors.background} />

      {/* HEADER BAR */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.adminTitle}>VELUNE OWNER ADMIN</Text>
          <Text style={styles.adminSubtitle}>Platform Executive Console</Text>
        </View>

        <TouchableOpacity 
          style={styles.maintenanceBadge}
          onPress={() => {
            const nextMode = !maintenanceMode;
            setMaintenanceMode(nextMode);
            Alert.alert(
              'Maintenance Status', 
              `Platform maintenance mode set to ${nextMode ? 'ENABLED' : 'DISABLED'}`
            );
          }}
        >
          <Text style={styles.maintenanceText}>
            {maintenanceMode ? 'MAINTENANCE ON' : 'SYSTEM ONLINE'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TABS SELECTOR */}
      <View style={styles.tabContainer}>
        {(['overview', 'streams', 'payouts'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* TAB 1: OVERVIEW & PERFORMANCE */}
        {activeTab === 'overview' && (
          <>
            <Text style={styles.sectionHeader}>Platform Performance</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Gross Platform Revenue</Text>
                <Text style={styles.metricValue}>$48,920.00</Text>
                <Text style={{ color: VeluneTheme.colors.successGreen, fontSize: 11 }}>+22% this month</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Net Platform Cut ({platformCommission}%)</Text>
                <Text style={styles.metricValue}>$4,892.00</Text>
                <Text style={{ color: VeluneTheme.colors.goldPrimary, fontSize: 11 }}>App Owner Net</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Registered Creators</Text>
                <Text style={styles.metricValue}>312</Text>
                <Text style={{ color: VeluneTheme.colors.textSecondary, fontSize: 11 }}>+14 new this week</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Active Live Streams</Text>
                <Text style={styles.metricValue}>{streams.filter(s => s.status === 'active').length}</Text>
                <Text style={{ color: VeluneTheme.colors.liveBadge, fontSize: 11 }}>Broadcasting now</Text>
              </View>
            </View>

            {/* PLATFORM CONFIGURATION */}
            <Text style={styles.sectionHeader}>Platform Settings</Text>
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Platform Commission Fee</Text>
                  <Text style={styles.settingSub}>Current take rate on tips & subscriptions</Text>
                </View>
                <View style={styles.commissionControl}>
                  <TouchableOpacity
                    style={styles.commissionBtn}
                    onPress={() => setPlatformCommission(prev => Math.max(1, prev - 1))}
                  >
                    <Text style={styles.commissionBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.commissionValue}>{platformCommission}%</Text>
                  <TouchableOpacity
                    style={styles.commissionBtn}
                    onPress={() => setPlatformCommission(prev => Math.min(100, prev + 1))}
                  >
                    <Text style={styles.commissionBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.settingRow, { borderBottomWidth: 0, marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Maintenance Lockdown</Text>
                  <Text style={styles.settingSub}>Restrict broadcasting & transactions globally</Text>
                </View>
                <Switch
                  value={maintenanceMode}
                  onValueChange={setMaintenanceMode}
                  trackColor={{ false: '#2a1a45', true: VeluneTheme.colors.liveBadge }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </>
        )}

        {/* TAB 2: STREAM MODERATION */}
        {activeTab === 'streams' && (
          <>
            <Text style={styles.sectionHeader}>Active Broadcast Control</Text>
            <View style={styles.card}>
              {streams.map(item => (
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text style={styles.rowTitle}>{item.creatorName}</Text>
                      {item.reported && (
                        <View style={styles.flagBadge}>
                          <Text style={styles.flagText}>REPORTED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowSub}>{item.category} • {item.viewers} viewers</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: item.status === 'active' ? VeluneTheme.colors.liveBadge : VeluneTheme.colors.successGreen }
                    ]}
                    onPress={() => toggleStreamStatus(item.id)}
                  >
                    <Text style={styles.actionButtonText}>
                      {item.status === 'active' ? 'Terminate' : 'Unban'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {/* TAB 3: CREATOR PAYOUTS */}
        {activeTab === 'payouts' && (
          <>
            <Text style={styles.sectionHeader}>Creator Stripe Settlements</Text>
            <View style={styles.card}>
              {payouts.map(item => {
                const currentFee = item.grossRevenue * (platformCommission / 100);
                const currentNet = item.grossRevenue - currentFee;

                return (
                  <View key={item.id} style={styles.tableRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.rowTitle}>{item.creatorName}</Text>
                      <Text style={styles.rowSub}>
                        Gross: ${item.grossRevenue.toFixed(2)} | Fee ({platformCommission}%): ${currentFee.toFixed(2)}
                      </Text>
                      <Text style={styles.netPayoutText}>
                        Net: ${currentNet.toFixed(2)}
                      </Text>
                    </View>

                    {item.payoutStatus === 'pending' ? (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: VeluneTheme.colors.glowPurple }]}
                        onPress={() => processPayout(item.id)}
                      >
                        <Text style={styles.actionButtonText}>Pay Out</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidText}>PAID</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: VeluneTheme.colors.cardBorder,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: VeluneTheme.colors.goldPrimary,
    letterSpacing: 2,
  },
  adminSubtitle: {
    fontSize: 12,
    color: VeluneTheme.colors.textSecondary,
    marginTop: 2,
  },
  maintenanceBadge: {
    backgroundColor: VeluneTheme.colors.cardBackground,
    borderColor: VeluneTheme.colors.cardBorder,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  maintenanceText: {
    color: VeluneTheme.colors.goldSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: VeluneTheme.colors.cardBackground,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: VeluneTheme.colors.cardBorder,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: VeluneTheme.colors.glowPurple,
  },
  tabText: {
    color: VeluneTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabText: {
    color: VeluneTheme.colors.textPrimary,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: VeluneTheme.colors.textPrimary,
    marginBottom: 14,
    marginTop: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    fontSize: 11,
    color: VeluneTheme.colors.textSecondary,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: VeluneTheme.colors.goldPrimary,
    marginVertical: 6,
  },
  card: {
    backgroundColor: VeluneTheme.colors.cardBackground,
    borderColor: VeluneTheme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#221538',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: VeluneTheme.colors.textPrimary,
  },
  settingSub: {
    fontSize: 11,
    color: VeluneTheme.colors.textSecondary,
    marginTop: 2,
  },
  commissionControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VeluneTheme.colors.background,
    borderRadius: 8,
    padding: 4,
  },
  commissionBtn: {
    width: 28,
    height: 28,
    backgroundColor: VeluneTheme.colors.glowPurple,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  commissionValue: {
    color: VeluneTheme.colors.goldPrimary,
    fontWeight: '700',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#221538',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: VeluneTheme.colors.textPrimary,
  },
  rowSub: {
    fontSize: 11,
    color: VeluneTheme.colors.textSecondary,
    marginTop: 2,
  },
  netPayoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: VeluneTheme.colors.goldPrimary,
    marginTop: 4,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  flagBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 6,
    marginTop: 2,
  },
  flagText: {
    color: VeluneTheme.colors.liveBadge,
    fontSize: 9,
    fontWeight: '700',
  },
  paidBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  paidText: {
    color: VeluneTheme.colors.successGreen,
    fontWeight: '700',
    fontSize: 11,
  },
});
