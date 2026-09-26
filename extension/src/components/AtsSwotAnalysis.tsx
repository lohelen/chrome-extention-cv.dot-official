import { Icons } from './Icons';
import type { AtsSwotResult } from '../lib/storage';

interface AtsSwotAnalysisProps {
    data: AtsSwotResult | null;
}

// Safely convert any value to a renderable string
function safeString(val: any): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    // Object or array — stringify it
    try { return JSON.stringify(val); } catch { return String(val); }
}

// Safely convert any value to an array of strings
function safeStringArray(val: any): string[] {
    if (!val) return [];
    if (!Array.isArray(val)) {
        // If it's an object with values, try extracting them
        if (typeof val === 'object') {
            try { return Object.values(val).map(v => safeString(v)); } catch { return [safeString(val)]; }
        }
        return [safeString(val)];
    }
    return val.map((item: any) => safeString(item));
}

export default function AtsSwotAnalysis({ data }: AtsSwotAnalysisProps) {
    if (!data) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-4">
                    <Icons.Chart size={24} />
                </div>
                <h3 className="text-sm font-bold mb-1">No Analysis Yet</h3>
                <p className="text-xs text-gray-400">Optimize a CV first to see your ATS Score and SWOT analysis.</p>
            </div>
        );
    }

    // Normalize all data safely
    const atsScore = typeof data.atsScore === 'number' ? data.atsScore : (Number(data.atsScore) || 0);
    const missingKeywords = safeStringArray(data.missingKeywords);
    const swot = data.swot || {} as any;
    const strengths = safeStringArray(swot.strengths);
    const weaknesses = safeStringArray(swot.weaknesses);
    const opportunities = safeStringArray(swot.opportunities);
    const threats = safeStringArray(swot.threats);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-black">Strategic Analysis</h2>
                <p className="text-[10px] text-gray-500 font-medium">ATS Score & SWOT assessment.</p>
            </div>

            {/* Score Card */}
            <div className="bg-black text-white p-6 rounded-2xl shadow-xl">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">ATS Optimization</p>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">{atsScore}</span>
                    <span className="text-gray-500 font-bold mb-1">/ 100</span>
                </div>
                <div className="mt-4 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${atsScore}%` }}></div>
                </div>
            </div>

            {/* Missing Keywords */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Icons.Warning size={14} className="text-amber-500" /> Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                    {missingKeywords.map((kw, idx) => (
                        <span key={idx} className="text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100 font-bold">
                            {kw}
                        </span>
                    ))}
                </div>
            </div>

            {/* SWOT Grid (Compact) */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <SwotSection title="Strengths" items={strengths} icon={<Icons.Check className="text-emerald-500" />} color="bg-emerald-50" textColor="text-emerald-700" />
                <SwotSection title="Weaknesses" items={weaknesses} icon={<Icons.Warning className="text-rose-500" />} color="bg-rose-50" textColor="text-rose-700" />
                <SwotSection title="Opportunities" items={opportunities} icon={<Icons.Idea className="text-blue-500" />} color="bg-blue-50" textColor="text-blue-700" />
                <SwotSection title="Threats" items={threats} icon={<Icons.Fast className="text-amber-500" />} color="bg-amber-50" textColor="text-amber-700" />
            </div>
        </div>
    );
}

function SwotSection({ title, items, icon, color, textColor }: { title: string; items: string[]; icon: React.ReactNode; color: string; textColor: string }) {
    return (
        <div className={`p-4 rounded-xl ${color} border border-black/5`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{title}</span>
            </div>
            <ul className="space-y-1.5">
                {items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-xs font-medium opacity-80 leading-snug">
                        <span className="mt-1 w-1 h-1 bg-current rounded-full flex-shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    )
}

