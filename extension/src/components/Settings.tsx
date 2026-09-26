import { useState } from 'react';
import { Icons } from './Icons';
import type { UserTier } from '../lib/auth';
import { verifyLicenseKey } from '../lib/auth';

interface SettingsProps {
    email: string;
    tier: UserTier;
    onSignOut: () => void;
    onTierUpdate?: (newTier: UserTier) => void;
}

export default function Settings({ email, tier, onSignOut, onTierUpdate }: SettingsProps) {
    const [licenseKey, setLicenseKey] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleUpgrade = () => {
        // Lemon Squeezy Checkout URL (User can update this to their actual store URL)
        window.open('https://www.cv-dot.com/', '_blank');
    };

    const handleVerify = async () => {
        if (!licenseKey.trim()) return;
        
        setIsVerifying(true);
        setStatusMsg(null);

        try {
            const result = await verifyLicenseKey(email, licenseKey);
            if (result.success && result.tier) {
                setStatusMsg({ type: 'success', text: `Successfully activated ${result.tier} plan! ✅` });
                if (onTierUpdate) onTierUpdate(result.tier);
            } else {
                setStatusMsg({ type: 'error', text: result.error || 'Invalid license key' });
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: 'Connection failed' });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h2 className="text-lg font-black">Settings</h2>
                <p className="text-[10px] text-gray-500 font-medium">Manage your account and subscription.</p>
            </div>

            <div className="space-y-4">
                {/* Account Info */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
                    <div className="mb-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Account</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Icons.User size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-800">{email}</p>
                            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                                {tier} PLAN
                            </span>
                        </div>
                    </div>
                </div>

                {/* License Key Verification */}
                <div className="bg-white p-4 rounded-xl border-2 border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Activate License</span>
                        {tier === 'premium' && (
                            <span className="text-[9px] font-bold text-green-500 flex items-center gap-1">
                                <Icons.Check size={10} /> Active
                            </span>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter your License Key"
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value)}
                            disabled={isVerifying || tier === 'premium'}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black/5 transition-all font-mono"
                        />
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying || !licenseKey.trim() || tier === 'premium'}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                tier === 'premium'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800 disabled:opacity-50'
                            }`}
                        >
                            {isVerifying ? 'Wait...' : 'Verify'}
                        </button>
                    </div>

                    {statusMsg && (
                        <p className={`text-[10px] font-bold ${statusMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {statusMsg.text}
                        </p>
                    )}
                </div>

                {/* Upgrade Plan */}
                <div className="bg-black p-5 rounded-xl border border-gray-800 text-white flex flex-col items-start gap-3">
                    <div>
                        <h3 className="text-sm font-black flex items-center gap-2">
                            <Icons.Magic size={16} className="text-purple-400" /> Upgrade Your Plan
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Unlock premium AI features and limitless optimizations.</p>
                    </div>
                    <button
                        onClick={handleUpgrade}
                        disabled={tier === 'premium'}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all mt-1 ${
                            tier === 'premium' 
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                : 'bg-white text-black hover:bg-gray-200'
                        }`}
                    >
                        <Icons.Target size={14} /> {tier === 'premium' ? 'Current Plan' : 'Buy Now'}
                    </button>
                </div>

                {/* Log Out */}
                <button
                    onClick={onSignOut}
                    className="w-full py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                >
                    <Icons.LogOut size={16} /> Log Out
                </button>
            </div>
        </div>
    );
}
