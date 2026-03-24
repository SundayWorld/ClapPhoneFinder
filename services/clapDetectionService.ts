import { Audio } from 'expo-av';

type ClapCallbacks = {
  onPatternDetected?: () => void;
};

class ClapDetectionService {
  private recording: Audio.Recording | null = null;
  private callbacks: ClapCallbacks = {};

  private noiseFloor = 0;
  private lastTriggerTime = 0;

  // 👏 Double clap tracking
  private lastClapTime = 0;
  private clapCount = 0;

  private readonly COOLDOWN = 1500;
  private readonly INTERVAL = 60;

  // 👖 Pocket detection
  private muffledCount = 0;

  // 🔋 control
  private isListening = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  // 🛡️ safety
  private isStarting = false;
  private isStopping = false;

  public setCallbacks(callbacks: ClapCallbacks) {
    this.callbacks = callbacks;
  }

  // ✅ FIXED START LISTENING (NO CRASH)
  public async startListening(): Promise<boolean> {
    if (this.isListening || this.isStarting) return true;

    this.isStarting = true;

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      // ✅ SAFE AUDIO MODE (ANDROID SAFE)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // ✅ USE EXPO PRESET (NO CRASH)
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        this.INTERVAL
      );

      this.recording = recording;
      this.isListening = true;

      this.startLoop();

      console.log('👏 ClapDetection Stable Started');
      return true;
    } catch (error) {
      console.log('ClapDetection Error:', error);
      return false;
    } finally {
      this.isStarting = false;
    }
  }

  private updateNoise(amplitude: number) {
    this.noiseFloor = this.noiseFloor * 0.92 + amplitude * 0.08;
  }

  private getThreshold() {
    return this.noiseFloor + 0.06;
  }

  // 📱 Pocket detection (muffled sound filter)
  private isMuffled(amp: number): boolean {
    if (amp < 0.02) {
      this.muffledCount++;
    } else {
      this.muffledCount = 0;
    }

    return this.muffledCount > 10;
  }

  // 👏 Detect clap spike
  private isClap(amp: number): boolean {
    return (
      amp > this.getThreshold() &&
      amp > this.noiseFloor * 1.8
    );
  }

  // 👏 Double clap logic
  private handleClap(now: number) {
    const gap = now - this.lastClapTime;

    if (gap < 400) {
      this.clapCount++;
    } else {
      this.clapCount = 1;
    }

    this.lastClapTime = now;

    if (this.clapCount === 2) {
      this.clapCount = 0;

      console.log('👏👏 Double Clap Detected');

      this.callbacks.onPatternDetected?.();
    }
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

          this.updateNoise(amp);

          // 📱 Ignore pocket muffled sounds
          if (this.isMuffled(amp)) return;

          const now = Date.now();

          const isClap = this.isClap(amp);

          if (isClap && now - this.lastTriggerTime > this.COOLDOWN) {
            this.lastTriggerTime = now;

            this.handleClap(now);
          }
        }
      } catch (error) {
        console.log('Loop Error:', error);
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

      this.clapCount = 0;
      this.muffledCount = 0;

      console.log('🛑 ClapDetection Stopped');
    } catch (error) {
      console.log('Stop Error:', error);
    } finally {
      this.isStopping = false;
    }
  }
}

export default ClapDetectionService;
