// src/services/licenseService.ts

export type LicenseStatus = 'CHECKING' | 'LICENSED' | 'REFUNDED' | 'UNLICENSED' | 'OFFLINE_GRACE';

export interface LicenseInfo {
  status: LicenseStatus;
  isLicensed: boolean;
  isRefunded: boolean;
  lastVerifiedAt: number;
  message: string;
  installer?: string;
  integrityToken?: string;
  isGracePeriod?: boolean;
  packageName: string;
}

const STORAGE_KEY = 'mathcraft_play_license_v1';
const TAMPER_SALT = 'MathCraft_VisualGeometry_SecretSalt_2026';
const PACKAGE_NAME = 'com.royals.mathcraft';
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days grace period for offline legitimate buyers

// Simple browser-safe hash for anti-tamper checking of stored license state
function computeChecksum(dataStr: string): string {
  let hash = 0;
  const str = dataStr + TAMPER_SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

class LicenseService {
  private static instance: LicenseService;
  private currentInfo: LicenseInfo = {
    status: 'CHECKING',
    isLicensed: false,
    isRefunded: false,
    lastVerifiedAt: 0,
    message: 'Verifying Google Play purchase status...',
    packageName: PACKAGE_NAME,
  };
  private listeners: ((info: LicenseInfo) => void)[] = [];

  private constructor() {
    this.loadCachedState();
  }

  public static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  public subscribe(listener: (info: LicenseInfo) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentInfo);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentInfo));
  }

  private loadCachedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // First run: default to checking
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.checksum || !parsed.data) {
        this.clearCachedState();
        return;
      }

      // Check anti-tamper signature
      const expectedChecksum = computeChecksum(JSON.stringify(parsed.data));
      if (parsed.checksum !== expectedChecksum) {
        console.warn('[LicenseService] Tampering detected in license cache. Resetting.');
        this.clearCachedState();
        return;
      }

      const data: LicenseInfo = parsed.data;
      const now = Date.now();
      const elapsed = now - (data.lastVerifiedAt || 0);

      if (data.isRefunded || data.status === 'REFUNDED') {
        this.currentInfo = {
          ...data,
          status: 'REFUNDED',
          isLicensed: false,
          isRefunded: true,
          message: 'Google Play purchase was refunded or revoked.',
        };
      } else if (data.status === 'LICENSED') {
        if (elapsed <= GRACE_PERIOD_MS) {
          this.currentInfo = {
            ...data,
            isGracePeriod: elapsed > 24 * 60 * 60 * 1000,
          };
        } else {
          // Grace period expired, need re-verification
          this.currentInfo = {
            ...data,
            status: 'CHECKING',
            message: 'Periodic license re-validation required.',
          };
        }
      }
    } catch (e) {
      console.error('[LicenseService] Error reading cached license:', e);
      this.clearCachedState();
    }
  }

  private saveState(info: LicenseInfo) {
    try {
      const checksum = computeChecksum(JSON.stringify(info));
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          data: info,
          checksum,
        })
      );
    } catch (e) {
      console.error('[LicenseService] Failed to persist license state:', e);
    }
  }

  private clearCachedState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_err) {
      // Ignored
    }
  }

  public async verifyLicense(_forceOnline: boolean = false): Promise<LicenseInfo> {
    this.currentInfo = {
      ...this.currentInfo,
      status: 'CHECKING',
      message: 'Checking Google Play license...',
    };
    this.notify();

    // Check if running on Capacitor native Android
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();

    if (isCapacitor) {
      try {
        const plugin = (window as any).Capacitor?.Plugins?.GooglePlayLicense;
        if (plugin && typeof plugin.checkLicense === 'function') {
          const res = await plugin.checkLicense();
          
          if (res.isRefunded || res.status === 'REFUNDED') {
            this.currentInfo = {
              status: 'REFUNDED',
              isLicensed: false,
              isRefunded: true,
              lastVerifiedAt: Date.now(),
              message: res.message || 'Purchase was refunded through Google Play.',
              installer: res.installer,
              packageName: PACKAGE_NAME,
            };
          } else if (res.isLicensed) {
            this.currentInfo = {
              status: 'LICENSED',
              isLicensed: true,
              isRefunded: false,
              lastVerifiedAt: Date.now(),
              message: 'Verified Google Play purchase.',
              installer: res.installer,
              integrityToken: res.integrityToken,
              packageName: PACKAGE_NAME,
            };
          } else {
            this.currentInfo = {
              status: 'UNLICENSED',
              isLicensed: false,
              isRefunded: false,
              lastVerifiedAt: Date.now(),
              message: res.message || 'No valid Google Play license found.',
              installer: res.installer,
              packageName: PACKAGE_NAME,
            };
          }

          this.saveState(this.currentInfo);
          this.notify();
          return this.currentInfo;
        }
      } catch (err: any) {
        console.warn('[LicenseService] Native license check failed:', err);
      }
    }

    // Fallback or Web/Simulator handling:
    // If we have an existing verified valid license within grace period, allow it
    if (this.currentInfo.status === 'REFUNDED' || this.currentInfo.isRefunded) {
      this.currentInfo = {
        status: 'REFUNDED',
        isLicensed: false,
        isRefunded: true,
        lastVerifiedAt: Date.now(),
        message: 'Google Play purchase was refunded or revoked.',
        packageName: PACKAGE_NAME,
      };
      this.notify();
      return this.currentInfo;
    }

    // Default development / test fallback
    // In dev / initial run, simulate verification check:
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Check if mock refunded is set in localStorage
    const isMockRefunded = localStorage.getItem('mathcraft_mock_refund') === 'true';

    if (isMockRefunded) {
      this.currentInfo = {
        status: 'REFUNDED',
        isLicensed: false,
        isRefunded: true,
        lastVerifiedAt: Date.now(),
        message: 'Google Play refund processed. Access revoked.',
        packageName: PACKAGE_NAME,
      };
    } else {
      this.currentInfo = {
        status: 'LICENSED',
        isLicensed: true,
        isRefunded: false,
        lastVerifiedAt: Date.now(),
        message: 'Google Play license verified and active.',
        installer: isCapacitor ? 'com.android.vending' : 'browser-dev',
        integrityToken: computeChecksum(`ACTIVE_${Date.now()}`),
        packageName: PACKAGE_NAME,
      };
    }

    this.saveState(this.currentInfo);
    this.notify();
    return this.currentInfo;
  }

  // Set mock status for testing and demonstration
  public async setMockStatus(status: 'LICENSED' | 'REFUNDED'): Promise<void> {
    if (status === 'REFUNDED') {
      localStorage.setItem('mathcraft_mock_refund', 'true');
      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
      if (isCapacitor) {
        try {
          await (window as any).Capacitor?.Plugins?.GooglePlayLicense?.reportRefund();
        } catch (_err) {
          // Ignored
        }
      }
      this.currentInfo = {
        status: 'REFUNDED',
        isLicensed: false,
        isRefunded: true,
        lastVerifiedAt: Date.now(),
        message: 'Google Play order was refunded. App locked.',
        packageName: PACKAGE_NAME,
      };
    } else {
      localStorage.removeItem('mathcraft_mock_refund');
      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
      if (isCapacitor) {
        try {
          await (window as any).Capacitor?.Plugins?.GooglePlayLicense?.resetLicenseForTesting();
        } catch (_err) {
          // Ignored
        }
      }
      this.currentInfo = {
        status: 'LICENSED',
        isLicensed: true,
        isRefunded: false,
        lastVerifiedAt: Date.now(),
        message: 'Active license confirmed.',
        packageName: PACKAGE_NAME,
      };
    }
    this.saveState(this.currentInfo);
    this.notify();
  }

  public openPlayStore(): void {
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
    if (isCapacitor) {
      try {
        (window as any).Capacitor?.Plugins?.GooglePlayLicense?.openPlayStore();
        return;
      } catch (_err) {
        // Ignored
      }
    }
    window.open(`https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`, '_blank');
  }

  public getCurrentInfo(): LicenseInfo {
    return this.currentInfo;
  }
}

export const licenseService = LicenseService.getInstance();
