import { Icons } from './Icons';

interface UpgradePromptProps {
  feature: string;
  description: string;
  requiredTier: 'pro' | 'premium';
  /** Optional: blurred preview content behind the overlay */
  children?: React.ReactNode;
}

export default function UpgradePrompt({ feature, description, requiredTier, children }: UpgradePromptProps) {
  const tierLabel = requiredTier === 'pro' ? 'PRO' : 'PREMIUM';
  const tierColor = requiredTier === 'pro' ? 'blue' : 'purple';
  const price = requiredTier === 'pro' ? '$9.99' : '$14.99';

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred Preview Content */}
      {children && (
        <div className="pointer-events-none select-none blur-[6px] opacity-50">
          {children}
        </div>
      )}

      {/* Lock Overlay */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 ${children ? '' : 'min-h-[60vh]'}`}>
        <div className={`w-14 h-14 bg-${tierColor}-50 rounded-2xl flex items-center justify-center mb-4`}>
          <Icons.Lock size={28} className={`text-${tierColor}-400`} />
        </div>

        <h3 className="text-base font-black text-gray-800 mb-1 text-center">{feature}</h3>
        <p className="text-xs text-gray-400 text-center max-w-[240px] mb-5 leading-relaxed">
          {description}
        </p>

        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4
          ${tierColor === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}
        `}>
          {tierLabel} Feature
        </span>

        <button
          onClick={() => {
            // Open Gumroad or pricing page
            window.open('https://www.cv-dot.com/', '_blank');
          }}
          className={`px-6 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] shadow-lg
            ${tierColor === 'blue'
              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
            }
          `}
        >
          Upgrade to {tierLabel} — {price}/mo
        </button>
      </div>
    </div>
  );
}
