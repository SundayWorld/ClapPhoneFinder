import { Audio } from 'expo-av';

type WhistleCallbacks = {
  onWhistleDetected?: () => void;
};

class WhistleDetectionService {
  private recording: Audio.Recording | null = null;
  private callbacks: WhistleCallbacks = {};

  private history: number[] = [];
  private lastTriggerTime = 0;

  private readonly COOLDOWN = 1500;
  private readonly HISTORY_SIZE = 15;
  private readonly INTERVAL = 60;

  // 🔋 control
  private isListening = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  // 🛡️ safety
  private isStarting = false;
  private isStopping = false;

  public setCallbacks(callbacks: WhistleCallbacks) {
    this.callbacks = callbacks;
  }

  // ✅ FIXED START (NO CRASH)
  public async startListening(): Promise<boolean> {
    if (this.isListening || this.isStarting) return true;

    this.isStarting = true;

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      // ✅ SAFE AUDIO MODE
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // ✅ USE EXPO SAFE PRESET
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        this.INTERVAL
      );

      this.recording = recording;
      this.isListening = true;

      this.startLoop();

      console.log('🎯 WhistleDetection Stable Started');
      return true;
    } catch (error) {
      console.log('WhistleDetection Error:', error);
      return false;
    } finally {
      this.isStarting = false;
    }
  }

  // 🧠 Improved detection logic
  private detectWhistle(): boolean {
    if (this.history.length < 6) return false;

    const avg =
      this.history.reduce((a, b) => a + b, 0) / this.history.length;

    const variance =
      this.history.reduce((a, b) => a + Math.pow(b - avg, 2), 0) /
      this.history.length;

    // 🎯 Tuned thresholds (stable)
    return avg > 0.065 && variance < 0.0025;
  }

  private startLoop() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(async () => {
      if (!this.recording || !this.isListening) return;

      try {
        const status = await this.recording.getStatusAsync();

        if (!status.isRecording) return;

        if ('metering' in status && status.metering !== undefined) {
          const amp = Math.max(0, (status.metering + 60) / 60);

          this.history.push(amp);

          if (this.history.length > this.HISTORY_SIZE) {
            this.history.shift();
          }

          const now = Date.now();

          const isWhistle = this.detectWhistle();

          // 🔒 Cooldown protection
          if (isWhistle && now - this.lastTriggerTime > this.COOLDOWN) {
            this.lastTriggerTime = now;

            console.log('🎯 Whistle Detected');

            this.callbacks.onWhistleDetected?.();

            // 🔥 Reset after detection
            this.history = [];
          }
        }
      } catch (error) {
        console.log('Whistle Loop Error:', error);
      }
    }, this.INTERVAL);
  }

  public async stopListening() {
    if (this.isStopping) return;

    this.isStopping = true;
    this.isListening = false;

    try {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      if (this.recording) {
        try {
          const status = await this.recording.getStatusAsync();

          if (status.isRecording) {
            await this.recording.stopAndUnloadAsync();
          }
        } catch {}

        this.recording = null;
      }

      this.history = [];

      console.log('🛑 WhistleDetection Stopped');
    } catch (error) {
      console.log('Stop Error:', error);
    } finally {
      this.isStopping = false;
    }
  }
}

export default WhistleDetectionService;
