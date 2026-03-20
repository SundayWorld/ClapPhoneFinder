import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface WhistleDetectionConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  backgroundNoiseFilter: boolean;
}

export interface WhistleDetectorCallbacks {
  onWhistleDetected: () => void;
  onFrequencyUpdate?: (frequency: number) => void;
  onAmplitudeUpdate?: (amplitude: number) => void;
}

interface WhistleState {
  isListening: boolean;
  whistleStartTime: number;
  consecutiveWhistleFrames: number;
  lastWhistleTime: number;
}

interface AudioAnalysisResult {
  amplitude: number;
  isSustainedTone: boolean;
  frequencyEstimate: number;
}

class WhistleDetectionService {
  private recording: Audio.Recording | null = null;
  private config: WhistleDetectionConfig;
  private callbacks: WhistleDetectorCallbacks | null = null;
  private state: WhistleState = {
    isListening: false,
    whistleStartTime: 0,
    consecutiveWhistleFrames: 0,
    lastWhistleTime: 0,
  };
  private analysisInterval: ReturnType<typeof setInterval> | null = null;
  private readonly WHISTLE_DURATION_MS = 400;
  private readonly WHISTLE_COOLDOWN_MS = 1500;
  private readonly MIN_WHISTLE_FRAMES = 6;
  private amplitudeHistory: number[] = [];
  private readonly HISTORY_SIZE = 20;
  private varianceHistory: number[] = [];
  
  // Web Audio API for web platform
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private webAnimationFrame: number | null = null;

  constructor(config: WhistleDetectionConfig) {
    this.config = config;
  }

  public updateConfig(config: Partial<WhistleDetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  public setCallbacks(callbacks: WhistleDetectorCallbacks) {
    this.callbacks = callbacks;
  }

  private getThreshold(): number {
    const baseThreshold = this.config.backgroundNoiseFilter ? 0.15 : 0.1;
    const sensitivityMultiplier = 
      this.config.sensitivity === 'high' ? 0.7 : 
      this.config.sensitivity === 'low' ? 1.4 : 1;
    return baseThreshold * sensitivityMultiplier;
  }

  private getVarianceThreshold(): number {
    return this.config.sensitivity === 'high' ? 0.02 : 
           this.config.sensitivity === 'low' ? 0.08 : 0.04;
  }

  private updateAmplitudeHistory(amplitude: number) {
    this.amplitudeHistory.push(amplitude);
    if (this.amplitudeHistory.length > this.HISTORY_SIZE) {
      this.amplitudeHistory.shift();
    }
  }

  private calculateVariance(): number {
    if (this.amplitudeHistory.length < 5) return 1;
    const mean = this.amplitudeHistory.reduce((a, b) => a + b, 0) / this.amplitudeHistory.length;
    const squaredDiffs = this.amplitudeHistory.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / this.amplitudeHistory.length;
  }

  private analyzeAudioNative(metering: number): AudioAnalysisResult {
    const normalizedAmplitude = this.normalizeMetering(metering);
    this.updateAmplitudeHistory(normalizedAmplitude);

    const variance = this.calculateVariance();
    const threshold = this.getThreshold();
    
    // Whistles are characterized by:
    // 1. Sustained amplitude above threshold
    // 2. Low variance (steady tone)
    const isSustainedTone = normalizedAmplitude > threshold && variance < this.getVarianceThreshold();
    
    // Estimate frequency based on amplitude patterns (simplified)
    const frequencyEstimate = isSustainedTone ? 2000 + (variance * 10000) : 0;

    return {
      amplitude: normalizedAmplitude,
      isSustainedTone,
      frequencyEstimate,
    };
  }

  private normalizeMetering(metering: number): number {
    const minDb = -60;
    const maxDb = 0;
    const clampedMetering = Math.max(minDb, Math.min(maxDb, metering));
    return (clampedMetering - minDb) / (maxDb - minDb);
  }

  private handleWhistleDetection() {
    const now = Date.now();
    
    if (now - this.state.lastWhistleTime < this.WHISTLE_COOLDOWN_MS) {
      return;
    }

    this.state.lastWhistleTime = now;
    this.state.consecutiveWhistleFrames = 0;

    if (this.callbacks) {
      this.callbacks.onWhistleDetected();
    }
  }

  private processAnalysis(result: AudioAnalysisResult) {
    if (this.callbacks?.onAmplitudeUpdate) {
      this.callbacks.onAmplitudeUpdate(result.amplitude);
    }
    if (this.callbacks?.onFrequencyUpdate) {
      this.callbacks.onFrequencyUpdate(result.frequencyEstimate);
    }

    if (result.isSustainedTone) {
      if (this.state.consecutiveWhistleFrames === 0) {
        this.state.whistleStartTime = Date.now();
      }
      this.state.consecutiveWhistleFrames++;

      const duration = Date.now() - this.state.whistleStartTime;
      
      if (duration >= this.WHISTLE_DURATION_MS && 
          this.state.consecutiveWhistleFrames >= this.MIN_WHISTLE_FRAMES) {
        this.handleWhistleDetection();
      }
    } else {
      this.state.consecutiveWhistleFrames = 0;
    }
  }

  // Web Audio API implementation for frequency analysis
  private async startWebListening(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        console.error('WhistleDetection: Web Audio API not available');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });
      
      this.mediaStream = stream;
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.state.isListening = true;
      this.startWebAnalysis();
      
      console.log('WhistleDetection: Web listening started');
      return true;
    } catch (error) {
      console.error('WhistleDetection: Web audio error:', error);
      return false;
    }
  }

  private startWebAnalysis() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!this.state.isListening || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      this.analyser.getByteTimeDomainData(timeArray);

      // Calculate amplitude from time domain
      let sum = 0;
      for (let i = 0; i < timeArray.length; i++) {
        const value = (timeArray[i] - 128) / 128;
        sum += value * value;
      }
      const amplitude = Math.sqrt(sum / timeArray.length);

      // Find dominant frequency
      let maxValue = 0;
      let maxIndex = 0;
      
      // Focus on whistle frequency range (1000Hz - 4000Hz)
      const sampleRate = this.audioContext?.sampleRate || 44100;
      const minBin = Math.floor(1000 * bufferLength / (sampleRate / 2));
      const maxBin = Math.floor(4000 * bufferLength / (sampleRate / 2));
      
      for (let i = minBin; i < maxBin && i < bufferLength; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }

      const dominantFrequency = maxIndex * (sampleRate / 2) / bufferLength;
      const normalizedMax = maxValue / 255;

      // Whistle detection criteria
      const isInWhistleRange = dominantFrequency > 1000 && dominantFrequency < 4000;
      const hasSufficientAmplitude = amplitude > this.getThreshold();
      const hasPeakDominance = normalizedMax > 0.3;

      const isWhistle = isInWhistleRange && hasSufficientAmplitude && hasPeakDominance;

      this.processAnalysis({
        amplitude,
        isSustainedTone: isWhistle,
        frequencyEstimate: dominantFrequency,
      });

      if (this.callbacks?.onFrequencyUpdate) {
        this.callbacks.onFrequencyUpdate(dominantFrequency);
      }

      this.webAnimationFrame = requestAnimationFrame(analyze);
    };

    this.webAnimationFrame = requestAnimationFrame(analyze);
  }

  private stopWebListening() {
    if (this.webAnimationFrame) {
      cancelAnimationFrame(this.webAnimationFrame);
      this.webAnimationFrame = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  // Native implementation using expo-av
  private async startNativeListening(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('WhistleDetection: Microphone permission denied');
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
      this.varianceHistory = [];

      this.startNativeAnalysis();

      console.log('WhistleDetection: Native listening started');
      return true;
    } catch (error) {
      console.error('WhistleDetection: Error starting listening:', error);
      return false;
    }
  }

  private startNativeAnalysis() {
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
          const result = this.analyzeAudioNative(metering);
          this.processAnalysis(result);
        }
      } catch (error) {
        console.error('WhistleDetection: Analysis error:', error);
      }
    }, 50);
  }

  public async startListening(): Promise<boolean> {
    if (this.state.isListening) {
      return true;
    }

    this.state = {
      isListening: false,
      whistleStartTime: 0,
      consecutiveWhistleFrames: 0,
      lastWhistleTime: 0,
    };

    if (Platform.OS === 'web') {
      return this.startWebListening();
    } else {
      return this.startNativeListening();
    }
  }

  public stopListening(): void {
    this.state.isListening = false;

    if (Platform.OS === 'web') {
      this.stopWebListening();
    } else {
      if (this.analysisInterval) {
        clearInterval(this.analysisInterval);
        this.analysisInterval = null;
      }

      if (this.recording) {
        try {
          void this.recording.stopAndUnloadAsync();
        } catch (error) {
          console.error('WhistleDetection: Error stopping recording:', error);
        }
        this.recording = null;
      }
    }

    this.state.consecutiveWhistleFrames = 0;
    this.state.whistleStartTime = 0;
    this.amplitudeHistory = [];
    this.varianceHistory = [];

    console.log('WhistleDetection: Stopped listening');
  }

  public isActive(): boolean {
    return this.state.isListening;
  }
}

export default WhistleDetectionService;
