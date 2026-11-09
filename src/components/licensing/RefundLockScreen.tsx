// src/components/licensing/RefundLockScreen.tsx

import React, { useState } from 'react';
import {
  ShieldAlert,
  RotateCw,
  ShoppingBag,
  Mail,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { LicenseInfo, licenseService } from '../../services/licenseService';

interface RefundLockScreenProps {
  licenseInfo: LicenseInfo;
  onRefresh: () => void;
  isVerifying: boolean;
}

export const RefundLockScreen: React.FC<RefundLockScreenProps> = ({
  licenseInfo,
  onRefresh,
  isVerifying,
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('sumits7196@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const formattedDate = licenseInfo.lastVerifiedAt
    ? new Date(licenseInfo.lastVerifiedAt).toLocaleString()
    : 'Not yet verified';

  return (
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl select-none overflow-y-auto"
      style={{ touchAction: 'pan-y' }}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-red-500/30 rounded-3xl shadow-2xl shadow-red-950/50 p-5 sm:p-8 text-slate-100 flex flex-col items-center text-center">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Lock & Shield Icon */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/40 ring-4 ring-red-500/20 animate-pulse">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border-2 border-red-500 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>रिफंड या अमान्य लाइसेंस (License Revoked)</span>
        </div>

        {/* Title in Hindi & English */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          एक्सेस लॉक: ऐप का रिफंड लिया गया है
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-400 mb-6 max-w-md">
          Access Locked: Google Play Purchase Refunded
        </p>

        {/* Description Box */}
        <div className="w-full bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 mb-6 text-left text-xs sm:text-sm leading-relaxed space-y-2">
          <p className="text-slate-200">
            <strong className="text-red-400">प्रिय उपयोगकर्ता:</strong> यह MathCraft का पेड (सशुल्क) वर्ज़न है। Google Play रिकॉर्ड के अनुसार इस ऐप का रिफंड कर दिया गया है अथवा इस Google खाते पर सक्रिय लाइसेंस मौजूद नहीं है।
          </p>
          <p className="text-slate-400 text-xs">
            Since this purchase was refunded or revoked, further access to MathCraft: Visual Geometry is blocked. If you purchased this legitimately or bought it again, please tap <em>"Verify License"</em> below.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {/* Re-verify License Button */}
          <button
            onClick={onRefresh}
            disabled={isVerifying}
            className="w-full py-3.5 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <RotateCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'लाइसेंस जांच हो रही है...' : 'लाइसेंस पुनः जांचें (Verify License)'}</span>
          </button>

          {/* Open Google Play Store Button */}
          <button
            onClick={() => licenseService.openPlayStore()}
            className="w-full py-3 px-5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Google Play पर खरीदें (Buy on Play Store)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>

        {/* Diagnostic Accordion */}
        <div className="w-full mt-5 pt-4 border-t border-slate-800/80 text-left">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              तकनीकी विवरण एवं सहायता (Diagnostics & Help)
            </span>
            {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDiagnostics && (
            <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1.5">
              <div className="flex justify-between">
                <span>Application ID:</span>
                <span className="text-slate-200">{licenseInfo.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-red-400 font-bold">{licenseInfo.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Verified:</span>
                <span className="text-slate-300">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Installer:</span>
                <span className="text-slate-300">{licenseInfo.installer || 'system'}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Developer Support:</span>
                <button
                  onClick={handleCopyEmail}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Mail className="w-3 h-3" />
                  <span>{copiedEmail ? 'Copied!' : 'sumits7196@gmail.com'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Developer Sandbox Controls (Accessible for instant testing) */}
        <div className="mt-4 pt-3 w-full border-t border-dashed border-slate-800 flex flex-col items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Testing Simulator (परीक्षण मोड)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => licenseService.setMockStatus('LICENSED')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition cursor-pointer"
            >
              ✓ Simulate Licensed (सक्रिय)
            </button>
            <button
              onClick={() => licenseService.setMockStatus('REFUNDED')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition cursor-pointer"
            >
              🔒 Simulate Refunded (रिफंड)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
