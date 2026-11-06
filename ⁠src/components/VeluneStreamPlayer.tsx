import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  AppState,
  AppStateStatus,
  Alert,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

export const VeluneTheme = {
  colors: {
    background: '#0d0814',
    cardBackground: '#180e29',
    cardBorder: '#2a1a45',
    goldPrimary: '#f3d0a7',
    goldSecondary: '#e8a598',
    glowPurple: '#5c2282',
    textPrimary: '#f8fafc',
    textSecondary: '#9d8ec4',
    liveBadge: '#e11d48',
  },
};

const { width } = Dimensions.get('window');

interface VeluneStreamPlayerProps {
  streamUrl: string;
  creatorName: string;
  streamTitle: string;
  isLive?: boolean;
  onViewerCountChange?: (count: number) => void;
}

export default function VeluneStreamPlayer({
  streamUrl,
  creatorName,
  streamTitle,
  isLive = true,
}: VeluneStreamPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Background/Foreground App State Handling
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        videoRef.current?.pauseAsync();
        setIsPlaying(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // Handle Playback Status Updates
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setHasError(true);
        setIsLoading(false);
      }
      return;
    }

    const successStatus = status as AVPlaybackStatusSuccess;
    setIsLoading(successStatus.isBuffering);
    setIsPlaying(successStatus.isPlaying);
  };

  // Toggle Play / Pause
  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (err) {
      Alert.alert('Playback Error', 'Unable to toggle playback state.');
    }
  };

  // Toggle Mute / Unmute
  const toggleMute = async () => {
    if (!videoRef.current) return;
    try {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (err) {
      console.warn('Failed to toggle mute state:', err);
    }
  };

  // Retry Stream Loading on Error
  const retryStream = async () => {
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      try {
        await videoRef.current.loadAsync({ uri: streamUrl }, {}, false);
        await videoRef.current.playAsync();
      } catch (err) {
        setHasError(true);
        setIsLoading(false);
      }
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.playerContainer}
      onPress={() => setShowControls(!showControls)}
    >
      {/* EXPO VIDEO ENGINE */}
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        isMuted={isMuted}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        useNativeControls={false}
      />

      {/* LOADING SPINNER OVERLAY */}
      {isLoading && !hasError && (
        <View style={styles.overlayCenter}>
          <ActivityIndicator color={VeluneTheme.colors.goldPrimary} size="large" />
          <Text style={styles.loadingText}>Connecting to Velune Stream...</Text>
        </View>
      )}

      {/* ERROR / RETRY OVERLAY */}
      {hasError && (
        <View style={styles.overlayCenter}>
          <Text style={styles.errorTitle}>Stream Unavailable</Text>
          <Text style={styles.errorSub}>The broadcast manifest could not be loaded.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryStream}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PLAYER CONTROLS OVERLAY */}
      {showControls && !hasError && (
        <View style={styles.controlsOverlay}>
          {/* HEADER INFO */}
          <View style={styles.topBar}>
            <View style={styles.streamInfo}>
              <Text style={styles.creatorName}>{creatorName}</Text>
              <Text style={styles.streamTitle} numberOfLines={1}>{streamTitle}</Text>
            </View>

            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          {/* CENTER PLAY/PAUSE ACTION */}
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {/* BOTTOM AUDIO CONTROL BAR */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
              <Text style={styles.muteText}>{isMuted ? '🔇 Muted' : '🔊 Audio On'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    width: width,
    height: (width * 9) / 16, // 16:9 Aspect Ratio
    backgroundColor: VeluneTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 8, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: VeluneTheme.colors.goldPrimary,
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
  errorSub: {
    color: VeluneTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: VeluneTheme.colors.glowPurple,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: VeluneTheme.colors.goldSecondary,
  },
  retryText: {
    color: VeluneTheme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streamInfo: {
    flex: 1,
    marginRight: 12,
  },
  creatorName: {
    color: VeluneTheme.colors.goldPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  streamTitle: {
    color: VeluneTheme.colors.textPrimary,
    fontSize: 12,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VeluneTheme.colors.liveBadge,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 4,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  playButton: {
    alignSelf: 'center',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(243, 208, 167, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: VeluneTheme.colors.goldPrimary,
  },
  playIcon: {
    fontSize: 22,
    color: VeluneTheme.colors.goldPrimary,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  muteButton: {
    backgroundColor: 'rgba(24, 14, 41, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: VeluneTheme.colors.cardBorder,
  },
  muteText: {
    color: VeluneTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
});
