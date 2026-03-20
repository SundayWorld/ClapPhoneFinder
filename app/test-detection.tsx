import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Clapperboard, Music, Volume2, Activity, CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ListeningIndicator } from '@/components/ListeningIndicator';
import { useDetection } from '@/contexts/DetectionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Audio } from 'expo-av';

export default function TestDetectionScreen() {
  const { testDetection, isListening, startListening, stopListening, lastDetection } = useDetection();
  const { settings } = useSettings();
  const [testResults, setTestResults] = useState<Array<{ type: string; time: string; success: boolean }>>([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    if (lastDetection && !lastDetection.includes('Test')) {
      const newResult = {
        type: lastDetection.includes('clap') ? 'Clap' : 'Whistle',
        time: new Date().toLocaleTimeString(),
        success: true,
      };
      setTestResults((prev) => [newResult, ...prev].slice(0, 5));
    }
  }, [lastDetection]);

  const handleTestClap = () => {
    testDetection('clap');
    setTestResults((prev) => [{
      type: 'Clap (Test)',
      time: new Date().toLocaleTimeString(),
      success: true,
    }, ...prev].slice(0, 5));
  };

  const handleTestWhistle = () => {
    testDetection('whistle');
    setTestResults((prev) => [{
      type: 'Whistle (Test)',
      time: new Date().toLocaleTimeString(),
      success: true,
    }, ...prev].slice(0, 5));
  };

  const playAlarmPreview = async () => {
    try {
      setIsPlayingPreview(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
        { volume: settings.alarmVolume }
      );
      
      await sound.playAsync();
      
      setTimeout(async () => {
        await sound.stopAsync();
        await sound.unloadAsync();
        setIsPlayingPreview(false);
      }, 3000);
    } catch (error) {
      console.error('Error playing preview:', error);
      setIsPlayingPreview(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Test Detection</Text>
          <Text style={styles.instructionText}>
            Clap or whistle now to test if the app detects your sounds correctly. 
            Make sure the detection settings are configured properly.
          </Text>
        </View>

        <View style={styles.indicatorContainer}>
          <ListeningIndicator isListening={isListening} size={120} />
          <Text style={styles.indicatorText}>
            {isListening ? 'Listening for sounds...' : 'Not listening'}
          </Text>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, isListening && styles.controlButtonActive]}
            onPress={isListening ? stopListening : startListening}
            activeOpacity={0.8}
          >
            <Activity size={24} color={Colors.text} />
            <Text style={styles.controlButtonText}>
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testButtonsContainer}>
          <Text style={styles.sectionTitle}>Manual Test</Text>
          <View style={styles.testButtonsRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestClap}
              activeOpacity={0.7}
            >
              <Clapperboard size={28} color={Colors.primary} />
              <Text style={styles.testButtonText}>Test Clap</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestWhistle}
              activeOpacity={0.7}
            >
              <Music size={28} color={Colors.purple} />
              <Text style={styles.testButtonText}>Test Whistle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, isPlayingPreview && styles.testButtonActive]}
              onPress={playAlarmPreview}
              activeOpacity={0.7}
              disabled={isPlayingPreview}
            >
              <Volume2 size={28} color={isPlayingPreview ? Colors.alert : Colors.yellow} />
              <Text style={styles.testButtonText}>
                {isPlayingPreview ? 'Playing...' : 'Test Alarm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {testResults.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.sectionTitle}>Recent Detections</Text>
            {testResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <CheckCircle size={18} color={Colors.active} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultType}>{result.type}</Text>
                  <Text style={styles.resultTime}>{result.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Detection Tips</Text>
          <Text style={styles.tipText}>
            • For best results, clap loudly and clearly{'\n'}
            • Whistle at a consistent pitch{'\n'}
            • Reduce background noise if possible{'\n'}
            • Adjust sensitivity in Finder Modes{'\n'}
            • Test in different environments
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  instructionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  instructionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  indicatorText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  controlsContainer: {
    marginBottom: 24,
  },
  controlButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  controlButtonActive: {
    backgroundColor: Colors.alert,
  },
  controlButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  testButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  testButtonActive: {
    backgroundColor: `${Colors.alert}20`,
  },
  testButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  resultsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultInfo: {
    marginLeft: 12,
    flex: 1,
  },
  resultType: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  resultTime: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  tipsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  tipsTitle: {
    color: Colors.yellow,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 22,
  },
});
