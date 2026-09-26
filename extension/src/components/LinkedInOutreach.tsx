import { useState } from 'react';
import { Icons } from './Icons';
import type { UserTier } from '../lib/auth';
import { canAccess } from '../lib/auth';
import UpgradePrompt from './UpgradePrompt';

interface LinkedInMessage {
  style: string;
  label: string;
  message: string;
}

interface LinkedInOutreachProps {
  messages: LinkedInMessage[] | null;
  tier: UserTier;
  jobTitle?: string;
  company?: string;
}

export default function LinkedInOutreach({ messages, tier, jobTitle, company }: LinkedInOutreachProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Feature gate: Premium only
  if (!canAccess('linkedInOutreach', tier)) {
    return (
      <UpgradePrompt
        feature="LinkedIn Outreach Templates"
        description="Auto-generate professional LinkedIn messages to reach out to hiring managers after applying."
        requiredTier="premium"
      >
        {/* Blurred preview placeholder */}
        <div className="space-y-6 p-4">
          <div>
            <h2 className="text-lg font-black">LinkedIn Outreach</h2>
            <p className="text-[10px] text-gray-500 font-medium">Follow-up message templates.</p>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-3 bg-gray-200 rounded w-4/5" />
            </div>
          ))}
        </div>
      </UpgradePrompt>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-4">
          <Icons.Send size={24} />
        </div>
        <h3 className="text-sm font-bold mb-1">No Messages Yet</h3>
        <p className="text-xs text-gray-400">Optimize a CV first to generate LinkedIn outreach messages.</p>
      </div>
    );
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const styleColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    professional: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-600' },
    achievement: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-600' },
    enthusiastic: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', badge: 'bg-purple-100 text-purple-600' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black">LinkedIn Outreach</h2>
        <p className="text-[10px] text-gray-500 font-medium">
          {jobTitle && company
            ? `Templates for: ${jobTitle} at ${company}`
            : 'Follow-up message templates based on your application.'
          }
        </p>
      </div>

      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
        <Icons.Idea size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
          Replace <strong>[Name]</strong> with the hiring manager's name before sending. Find them on the company's LinkedIn page.
        </p>
      </div>

      <div className="space-y-4">
        {messages.map((msg, idx) => {
          const colors = styleColors[msg.style] || styleColors.professional;
          const rawMessage = typeof msg.message === 'object' ? JSON.stringify(msg.message) : String(msg.message);
          const suffix = "\n\nIf you need more information about me please let me know. Looking forward to hearing from your company. Have a nice day.\nBest, [name]";
          const displayMessage = rawMessage.endsWith(suffix.trim()) ? rawMessage : rawMessage + suffix;
          return (
            <div key={idx} className={`${colors.bg} p-4 rounded-xl border ${colors.border} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-widest ${colors.badge} px-2 py-0.5 rounded-md`}>
                  {typeof msg.label === 'object' ? JSON.stringify(msg.label) : String(msg.label)}
                </span>
              </div>
              <p className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                {displayMessage}
              </p>
              <button
                onClick={() => handleCopy(displayMessage, idx)}
                className={`w-full py-2 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1.5 transition-all
                  ${copiedIdx === idx
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : `bg-white ${colors.text} ${colors.border} hover:opacity-80`
                  }
                `}
              >
                {copiedIdx === idx ? (
                  <><Icons.Check size={12} /> Copied!</>
                ) : (
                  <><Icons.Copy size={12} /> Copy Message</>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
