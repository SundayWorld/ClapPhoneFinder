import { Audio } from 'expo-av';

export interface ClapDetectionConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  clapCount: number;
  backgroundNoiseFilter: boolean;
}

export interface ClapDetectorCallbacks {
  onClapDetected: (clapNumber: number) => void;
  onPatternDetected: () => void;
  onAmplitudeUpdate?: (amplitude: number) => void;
}

interface ClapState {
  lastClapTime: number;
  clapCount: number;
  isListening: boolean;
}

class ClapDetectionService {
  private recording: Audio.Recording | null = null;
  private config: ClapDetectionConfig;
  private callbacks: ClapDetectorCallbacks | null = null;
  private state: ClapState = {
    lastClapTime: 0,
    clapCount: 0,
    isListening: false,
  };
  private analysisInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CLAP_WINDOW_MS = 2000;
  private readonly MIN_CLAP_INTERVAL_MS = 150;
  private amplitudeHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;
  private baseNoiseLevel = 0;

  constructor(config: ClapDetectionConfig) {
    this.config = config;
  }

  public updateConfig(config: Partial<ClapDetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  public setCallbacks(callbacks: ClapDetectorCallbacks) {
    this.callbacks = callbacks;
  }

  private getThreshold(): number {
    const baseThreshold = this.config.backgroundNoiseFilter ? 0.12 : 0.08;
    const sensitivityMultiplier = 
      this.config.sensitivity === 'high' ? 0.6 : 
      this.config.sensitivity === 'low' ? 1.4 : 1;
    return baseThreshold * sensitivityMultiplier;
  }

  private calculateDynamicThreshold(): number {
    if (this.amplitudeHistory.length < 5) {
      return this.getThreshold();
    }
    const avgNoise = this.amplitudeHistory.reduce((a, b) => a + b, 0) / this.amplitudeHistory.length;
    const dynamicThreshold = Math.max(this.getThreshold(), avgNoise * 2.5);
    return dynamicThreshold;
  }

  private updateAmplitudeHistory(amplitude: number) {
    this.amplitudeHistory.push(amplitude);
    if (this.amplitudeHistory.length > this.HISTORY_SIZE) {
      this.amplitudeHistory.shift();
    }
  }

  private detectClap(amplitude: number): boolean {
    const threshold = this.calculateDynamicThreshold();
    
    this.updateAmplitudeHistory(amplitude);
    
    if (this.callbacks?.onAmplitudeUpdate) {
      this.callbacks.onAmplitudeUpdate(amplitude);
    }

    return amplitude > threshold;
  }

  private handleClapDetection() {
    const now = Date.now();
    
    if (now - this.state.lastClapTime < this.MIN_CLAP_INTERVAL_MS) {
      return;
    }

    if (now - this.state.lastClapTime > this.CLAP_WINDOW_MS) {
      this.state.clapCount = 1;
    } else {
      this.state.clapCount++;
    }

    this.state.lastClapTime = now;

    if (this.callbacks) {
      this.callbacks.onClapDetected(this.state.clapCount);
    }

    if (this.state.clapCount >= this.config.clapCount) {
      this.state.clapCount = 0;
      if (this.callbacks) {
        this.callbacks.onPatternDetected();
      }
    }
  }

  public async startListening(): Promise<boolean> {
    if (this.state.isListening) {
      return true;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('ClapDetection: Microphone permission denied');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;
      this.state.isListening = true;
      this.amplitudeHistory = [];

      this.startAnalysis();

      console.log('ClapDetection: Started listening');
      return true;
    } catch (error) {
      console.error('ClapDetection: Error starting listening:', error);
      return false;
    }
  }

  private startAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    this.analysisInterval = setInterval(async () => {
      if (!this.recording || !this.state.isListening) return;

      try {
        const status = await this.recording.getStatusAsync();
        
        if (!status.isRecording) return;

        const metering = (status as { metering?: number }).metering;
        
        if (metering !== undefined && metering !== -160) {
          const normalizedAmplitude = this.normalizeMetering(metering);
          
          if (this.detectClap(normalizedAmplitude)) {
            this.handleClapDetection();
          }
        }
      } catch (error) {
        console.error('ClapDetection: Analysis error:', error);
      }
    }, 50);
  }

  private normalizeMetering(metering: number): number {
    const minDb = -60;
    const maxDb = 0;
    const clampedMetering = Math.max(minDb, Math.min(maxDb, metering));
    return (clampedMetering - minDb) / (maxDb - minDb);
  }

  public stopListening(): void {
    this.state.isListening = false;

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    if (this.recording) {
      try {
        void this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('ClapDetection: Error stopping recording:', error);
      }
      this.recording = null;
    }

    this.state.clapCount = 0;
    this.state.lastClapTime = 0;
    this.amplitudeHistory = [];

    console.log('ClapDetection: Stopped listening');
  }

  public isActive(): boolean {
    return this.state.isListening;
  }

  public getCurrentClapCount(): number {
    return this.state.clapCount;
  }

  public resetClapCount(): void {
    this.state.clapCount = 0;
    this.state.lastClapTime = 0;
  }
}

export default ClapDetectionService;
