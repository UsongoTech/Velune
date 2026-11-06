import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VeluneTheme } from './src/constants/theme';
import { VeluneStreamPlayer } from './src/components/VeluneStreamPlayer';
import VeluneDashboardScreen from './src/screens/VeluneDashboardScreen';
import VeluneOwnerAdminScreen from './src/screens/VeluneOwnerAdminScreen';

export default function App() {
  const [activeRole, setActiveRole] = useState<'fan' | 'creator' | 'admin'>('fan');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Role Switcher Header */}
      <View style={styles.roleBar}>
        <TouchableOpacity 
          style={[styles.roleBtn, activeRole === 'fan' && styles.activeBtn]}
          onPress={() => setActiveRole('fan')}
        >
          <Text style={styles.btnText}>Fan Stream</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.roleBtn, activeRole === 'creator' && styles.activeBtn]}
          onPress={() => setActiveRole('creator')}
        >
          <Text style={styles.btnText}>Creator</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleBtn, activeRole === 'admin' && styles.activeBtn]}
          onPress={() => setActiveRole('admin')}
        >
          <Text style={styles.btnText}>Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Role Screen View */}
      <View style={styles.content}>
        {activeRole === 'fan' && (
          <VeluneStreamPlayer 
            streamUrl="https://demo.unified-streaming.com/k8s/live/stable/hls/live-cbr-audio-video.m3u8"
            title="Azzbash — Live Studio Acoustic Session"
            creatorName="Azzbash"
            isLive={true}
          />
        )}
        {activeRole === 'creator' && <VeluneDashboardScreen />}
        {activeRole === 'admin' && <VeluneOwnerAdminScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VeluneTheme.colors.background,
  },
  roleBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: VeluneTheme.colors.cardBorder,
    backgroundColor: VeluneTheme.colors.cardBackground,
  },
  roleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeBtn: {
    backgroundColor: VeluneTheme.colors.glowPurple,
  },
  btnText: {
    color: VeluneTheme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
});
