import { useState } from 'react';
import { Icons } from './Icons';
import type { UserTier } from '../lib/auth';
import { canAccess } from '../lib/auth';
import UpgradePrompt from './UpgradePrompt';
import ReactMarkdown from 'react-markdown';

interface CoverLetterResult {
  coverLetter: string;
  highlightedConnections: {
    jdRequirement: string;
    cvExperience: string;
  }[];
}

interface CoverLetterProps {
  data: CoverLetterResult | null;
  tier: UserTier;
}

export default function CoverLetter({ data, tier }: CoverLetterProps) {
  const [copied, setCopied] = useState(false);

  // Feature gate: PRO+ only
  if (!canAccess('coverLetter', tier)) {
    return (
      <UpgradePrompt
        feature="Cover Letter Generation"
        description="Automatically generate a highly customized cover letter based on your CV and the target job description."
        requiredTier="pro"
      >
        {/* Blurred preview placeholder */}
        <div className="space-y-6 p-4">
          <div>
            <h2 className="text-lg font-black">Cover Letter</h2>
            <p className="text-[10px] text-gray-500 font-medium">AI-generated, personalized to the JD.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-3">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-200 rounded w-4/5" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </UpgradePrompt>
    );
  }

  if (!data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-4">
          <Icons.Mail size={24} />
        </div>
        <h3 className="text-sm font-bold mb-1">No Cover Letter Yet</h3>
        <p className="text-xs text-gray-400">Optimize a CV first to generate a custom cover letter.</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(data.coverLetter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black">Cover Letter</h2>
        <p className="text-[10px] text-gray-500 font-medium">AI-generated, personalized to the JD.</p>
      </div>

      {/* Cover Letter Content */}
      <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
        <div className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed text-gray-800">
          <ReactMarkdown>{data.coverLetter}</ReactMarkdown>
        </div>
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="w-full bg-blue-50 text-blue-700 py-2.5 rounded-lg text-xs font-bold border border-blue-100 flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
      >
        {copied ? (
          <><Icons.Check size={14} /> Copied!</>
        ) : (
          <><Icons.Copy size={14} /> Copy Cover Letter</>
        )}
      </button>

      {/* Highlighted Connections */}
      {data.highlightedConnections && data.highlightedConnections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Icons.Target size={14} className="text-blue-500" /> JD ↔ CV Connections
          </h3>
          <div className="space-y-2">
            {data.highlightedConnections.map((conn, idx) => (
              <div key={idx} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-[10px] font-bold text-blue-700 mb-1">JD: {typeof conn.jdRequirement === 'object' ? JSON.stringify(conn.jdRequirement) : String(conn.jdRequirement)}</p>
                <p className="text-[10px] text-blue-600">CV: {typeof conn.cvExperience === 'object' ? JSON.stringify(conn.cvExperience) : String(conn.cvExperience)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
