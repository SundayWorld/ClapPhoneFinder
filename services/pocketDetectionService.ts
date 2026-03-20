import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import { Platform } from 'react-native';

export interface PocketDetectionConfig {
  enabled: boolean;
  proximityThreshold: number;
  lightThreshold: number;
  motionThreshold: number;
}

export interface PocketDetectorCallbacks {
  onPocketStateChange: (isInPocket: boolean) => void;
  onSensorData?: (data: SensorData) => void;
}

export interface SensorData {
  proximity: number;
  lightLevel: number;
  motionMagnitude: number;
  isInPocket: boolean;
}

interface PocketState {
  isInPocket: boolean;
  proximityTriggered: boolean;
  lightTriggered: boolean;
  motionTriggered: boolean;
  lastMotionTime: number;
  stationaryTime: number;
}

class PocketDetectionService {
  private config: PocketDetectionConfig;
  private callbacks: PocketDetectorCallbacks | null = null;
  private state: PocketState = {
    isInPocket: false,
    proximityTriggered: false,
    lightTriggered: false,
    motionTriggered: false,
    lastMotionTime: 0,
    stationaryTime: 0,
  };
  
  private accelerometerSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;
  private sensorPollingInterval: ReturnType<typeof setInterval> | null = null;
  private lastAccelerometerData: AccelerometerMeasurement | null = null;
  private motionHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;
  private readonly STATIONARY_THRESHOLD_MS = 2000;
  private readonly SENSOR_POLL_INTERVAL_MS = 500;
  
  // Web and simulator fallbacks
  private isSimulatingPocket = false;
  private simulationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: PocketDetectionConfig) {
    this.config = config;
  }

  public updateConfig(config: Partial<PocketDetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  public setCallbacks(callbacks: PocketDetectorCallbacks) {
    this.callbacks = callbacks;
  }

  private updateMotionHistory(magnitude: number) {
    this.motionHistory.push(magnitude);
    if (this.motionHistory.length > this.HISTORY_SIZE) {
      this.motionHistory.shift();
    }
  }

  private calculateAverageMotion(): number {
    if (this.motionHistory.length === 0) return 0;
    return this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length;
  }

  private async checkSensors(): Promise<Partial<SensorData>> {
    // Check if running on web or simulator where sensors may not be available
    if (Platform.OS === 'web') {
      return this.checkWebSensors();
    }

    try {
      // Check accelerometer availability
      const isAccelerometerAvailable = await Accelerometer.isAvailableAsync();
      
      if (!isAccelerometerAvailable) {
        // Fallback: assume not in pocket if sensors unavailable
        return {
          proximity: 0,
          lightLevel: 100,
          motionMagnitude: 1,
          isInPocket: false,
        };
      }

      // Calculate motion from accelerometer data
      let motionMagnitude = 0;
      if (this.lastAccelerometerData) {
        const { x, y, z } = this.lastAccelerometerData;
        motionMagnitude = Math.sqrt(x * x + y * y + z * z);
      }

      this.updateMotionHistory(motionMagnitude);
      const avgMotion = this.calculateAverageMotion();

      // Detect stationary state
      const now = Date.now();
      const isStationary = avgMotion < this.config.motionThreshold;
      
      if (isStationary) {
        if (this.state.stationaryTime === 0) {
          this.state.stationaryTime = now;
        }
      } else {
        this.state.stationaryTime = 0;
        this.state.lastMotionTime = now;
      }

      const stationaryDuration = now - this.state.stationaryTime;
      const isLongStationary = this.state.stationaryTime > 0 && stationaryDuration > this.STATIONARY_THRESHOLD_MS;

      // Simulate proximity based on device orientation and motion
      // When stationary and face down (z-axis close to -1), likely in pocket
      let proximity = 0;
      if (this.lastAccelerometerData) {
        const { z } = this.lastAccelerometerData;
        // z close to -1 means face down, z close to 1 means face up
        proximity = z < -0.7 ? 1 : 0;
      }

      // Simulate light level based on proximity and motion
      // In pocket = low light, not in pocket = higher light
      const lightLevel = (proximity === 1 && isLongStationary) ? 5 : 100;

      return {
        proximity,
        lightLevel,
        motionMagnitude: avgMotion,
        isInPocket: false, // Will be calculated in evaluatePocketState
      };
    } catch (error) {
      console.error('PocketDetection: Sensor check error:', error);
      return {
        proximity: 0,
        lightLevel: 100,
        motionMagnitude: 1,
        isInPocket: false,
      };
    }
  }

  private checkWebSensors(): Partial<SensorData> {
    // Web doesn't have access to these sensors, return default values
    return {
      proximity: 0,
      lightLevel: 100,
      motionMagnitude: 1,
      isInPocket: false,
    };
  }

  private evaluatePocketState(sensorData: Partial<SensorData>): boolean {
    const proximityTriggered = (sensorData.proximity ?? 0) >= this.config.proximityThreshold;
    const lightTriggered = (sensorData.lightLevel ?? 100) < this.config.lightThreshold;
    const motionTriggered = (sensorData.motionMagnitude ?? 1) < this.config.motionThreshold;

    this.state.proximityTriggered = proximityTriggered;
    this.state.lightTriggered = lightTriggered;
    this.state.motionTriggered = motionTriggered;

    // Device is in pocket if:
    // 1. Face down (high proximity) OR
    // 2. Low light AND stationary for a period
    const isInPocket = proximityTriggered || (lightTriggered && motionTriggered);

    return isInPocket;
  }

  private async pollSensors() {
    if (!this.config.enabled) {
      if (this.state.isInPocket) {
        this.state.isInPocket = false;
        this.callbacks?.onPocketStateChange(false);
      }
      return;
    }

    const sensorData = await this.checkSensors();
    const isInPocket = this.evaluatePocketState(sensorData);

    if (isInPocket !== this.state.isInPocket) {
      this.state.isInPocket = isInPocket;
      this.callbacks?.onPocketStateChange(isInPocket);
    }

    this.callbacks?.onSensorData?.({
      proximity: sensorData.proximity ?? 0,
      lightLevel: sensorData.lightLevel ?? 100,
      motionMagnitude: sensorData.motionMagnitude ?? 1,
      isInPocket,
    });
  }

  public async startMonitoring(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // Setup accelerometer
      const isAccelerometerAvailable = await Accelerometer.isAvailableAsync();
      
      if (isAccelerometerAvailable) {
        Accelerometer.setUpdateInterval(200);
        
        this.accelerometerSubscription = Accelerometer.addListener((data) => {
          this.lastAccelerometerData = data;
        });
      } else {
        console.warn('PocketDetection: Accelerometer not available');
      }

      // Start sensor polling
      this.sensorPollingInterval = setInterval(() => {
        void this.pollSensors();
      }, this.SENSOR_POLL_INTERVAL_MS);

      // Initial sensor check
      void this.pollSensors();

      console.log('PocketDetection: Started monitoring');
      return true;
    } catch (error) {
      console.error('PocketDetection: Error starting monitoring:', error);
      return false;
    }
  }

  public stopMonitoring(): void {
    // Stop accelerometer
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }

    // Stop polling
    if (this.sensorPollingInterval) {
      clearInterval(this.sensorPollingInterval);
      this.sensorPollingInterval = null;
    }

    // Clear simulation
    if (this.simulationTimeout) {
      clearTimeout(this.simulationTimeout);
      this.simulationTimeout = null;
    }

    // Reset state
    this.state = {
      isInPocket: false,
      proximityTriggered: false,
      lightTriggered: false,
      motionTriggered: false,
      lastMotionTime: 0,
      stationaryTime: 0,
    };
    this.motionHistory = [];
    this.lastAccelerometerData = null;
    this.isSimulatingPocket = false;

    console.log('PocketDetection: Stopped monitoring');
  }

  public isInPocket(): boolean {
    return this.state.isInPocket;
  }

  public getState(): PocketState {
    return { ...this.state };
  }

  // For testing purposes - simulate pocket state
  public simulatePocketState(isInPocket: boolean, durationMs: number = 5000): void {
    this.isSimulatingPocket = isInPocket;
    this.state.isInPocket = isInPocket;
    this.callbacks?.onPocketStateChange(isInPocket);

    if (this.simulationTimeout) {
      clearTimeout(this.simulationTimeout);
    }

    if (durationMs > 0) {
      this.simulationTimeout = setTimeout(() => {
        this.isSimulatingPocket = false;
        this.state.isInPocket = false;
        this.callbacks?.onPocketStateChange(false);
      }, durationMs);
    }
  }

  // Manual check for immediate pocket state
  public async checkPocketStateNow(): Promise<boolean> {
    await this.pollSensors();
    return this.state.isInPocket;
  }
}

export default PocketDetectionService;
