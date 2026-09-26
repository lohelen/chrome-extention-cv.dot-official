import { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import { Icons } from './Icons';
import type { OptimizationResult } from '../lib/storage';
import type { UserTier } from '../lib/auth';
import { canAccess } from '../lib/auth';
import ReactMarkdown from 'react-markdown';

interface CVOptimizerProps {
    jdText: string;
    onJdChange: (text: string) => void;
    cvFile: File | null;
    onCvFileChange: (file: File | null) => void;
    onOptimize: () => void;
    loading: boolean;
    error: string | null;
    result: OptimizationResult | null;
    onReset: () => void;
    tier: UserTier;
}

export default function CVOptimizer({
    jdText,
    onJdChange,
    cvFile,
    onCvFileChange,
    onOptimize,
    loading,
    error,
    result,
    onReset,
    tier
}: CVOptimizerProps) {
    const [viewMode, setViewMode] = useState<'optimized' | 'original'>('optimized');
    const [copied, setCopied] = useState(false);
    const [copiedClaude, setCopiedClaude] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [progress, setProgress] = useState(0);

    // Auto-progress simulation
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (loading) {
            setProgress(0);
            timer = setInterval(() => {
                setProgress((prev) => {
                    const diff = Math.random() * 5 + 1; // Increase by 1-6%
                    return Math.min(prev + diff, 95); // Stop around 95% until done
                });
            }, 500);
        } else {
            setProgress(100);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [loading]);

    const getFullText = () => {
        return result?.sections
            .map(s => `${s.title}\n${s.optimizedContent.replace(/\*\*/g, '')}`)
            .join('\n\n') || '';
    };

    const handleCopyCV = () => {
        navigator.clipboard.writeText(getFullText()).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleCopyToClaude = async () => {
        const fullText = getFullText();
        const claudePrompt = `請幫我把這段 CV 修改進我的 Canva CV：\n\n${fullText}`;

        try {
            // Find Claude tab robustly
            const allTabs = await chrome.tabs.query({});
            const tabs = allTabs.filter(t => t.url && t.url.includes('claude.ai'));

            if (tabs.length > 0 && tabs[0].id) {
                const claudeTabId = tabs[0].id;
                
                // Copy to clipboard as a reliable fallback
                await navigator.clipboard.writeText(claudePrompt);
                setCopiedClaude(true);
                setTimeout(() => setCopiedClaude(false), 2000);

                // Focus the Claude tab
                await chrome.tabs.update(claudeTabId, { active: true });
                
                // Send message to content script to paste into Claude
                // Small delay to ensure tab is focused and content script is ready
                await new Promise(r => setTimeout(r, 500));
                chrome.tabs.sendMessage(claudeTabId, {
                    action: "PASTE_TO_CLAUDE",
                    text: claudePrompt
                });
            } else {
                // No Claude tab open - alert user
                alert("請先打開您的 Claude CV Project 分頁，然後再按一次「Copy to Claude」按鈕。");
            }
        } catch (err) {
            console.error('Copy to Claude error:', err);
            alert("發生錯誤，請稍後再試。");
        }
    };

    const handleSaveProject = () => {
        if (!showNameInput) {
            // First click: show name input with default name
            const defaultName = jdText.substring(0, 40).replace(/\n/g, ' ').trim() + (jdText.length > 40 ? '...' : '');
            setProjectName(defaultName);
            setShowNameInput(true);
            return;
        }
        // Second click: actually save
        (window as any)._saveProject?.({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            title: projectName || 'Untitled Project',
            jdText,
            cvFileName: cvFile?.name || 'Uploaded CV',
            result
        });
        setShowNameInput(false);
    };

    if (result) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Optimization Results</h2>
                    <button
                        onClick={onReset}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-1.5 hover:bg-red-100 transition-all"
                    >
                        <Icons.Trash size={12} /> Start Over
                    </button>
                </div>

                {/* Score Summary */}
                <div className="bg-black text-white p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">ATS Match Score</span>
                        <span className="text-xl font-black">{Number(result?.atsSwot?.atsScore) || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${Number(result?.atsSwot?.atsScore) || 0}%` }}></div>
                    </div>
                </div>

                {/* JD Summary */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-600">
                        <Icons.Target size={14} /> JD FOCUS
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed italic">"{typeof result.jdSummary === 'object' ? JSON.stringify(result.jdSummary) : result.jdSummary}"</p>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-2">
                    {result.keywords.map((kw, i) => {
                        const text = typeof kw === 'object' ? (kw as any)?.keyword || (kw as any)?.text || JSON.stringify(kw) : String(kw);
                        return (
                            <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 font-medium">
                                {text}
                            </span>
                        );
                    })}
                </div>

                {/* Sections View */}
                <div className="space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('optimized')}
                            className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${viewMode === 'optimized' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                        >
                            OPTIMIZED
                        </button>
                        <button
                            onClick={() => setViewMode('original')}
                            className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${viewMode === 'original' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                        >
                            ORIGINAL
                        </button>
                    </div>

                    {/* Copy Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopyCV}
                            className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-xs font-bold border border-blue-100 flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                        >
                            {copied ? (
                                <><Icons.Check size={14} /> Copied!</>
                            ) : (
                                <><Icons.Copy size={14} /> Copy New CV</>
                            )}
                        </button>

                        {/* Copy to Claude - Premium Only */}
                        {canAccess('claudeSync', tier) && (
                            <button
                                onClick={handleCopyToClaude}
                                className="flex-1 bg-purple-50 text-purple-700 py-2 rounded-lg text-xs font-bold border border-purple-100 flex items-center justify-center gap-2 hover:bg-purple-100 transition-all"
                            >
                                {copiedClaude ? (
                                    <><Icons.Check size={14} /> Copied!</>
                                ) : (
                                    <><Icons.Send size={14} /> Copy to Claude</>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="space-y-4 border-l-2 border-gray-100 pl-4 py-2">
                        {result.sections.map((section, idx) => (
                            <div key={idx} className="space-y-2">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    {typeof section.title === 'object' ? JSON.stringify(section.title) : section.title}
                                </h3>
                                <div className="cv-section-content prose prose-sm prose-slate max-w-none text-sm leading-relaxed text-gray-800">
                                    <ReactMarkdown>
                                        {viewMode === 'optimized' 
                                            ? (typeof section.optimizedContent === 'object' ? JSON.stringify(section.optimizedContent) : section.optimizedContent) 
                                            : (typeof section.originalContent === 'object' ? JSON.stringify(section.originalContent) : section.originalContent)}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save to Projects with editable name */}
                <div className="space-y-2">
                    {showNameInput && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Enter project name..."
                                className="flex-1 px-3 py-2 text-xs border-2 border-gray-200 rounded-lg focus:border-black focus:ring-0 outline-none transition-all"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveProject();
                                    if (e.key === 'Escape') setShowNameInput(false);
                                }}
                            />
                            <button
                                onClick={() => setShowNameInput(false)}
                                className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleSaveProject}
                        className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all text-sm"
                    >
                        <Icons.Folder size={16} /> {showNameInput ? 'Confirm Save' : 'Save to Projects'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-black flex items-center gap-2">
                    <Icons.File size={16} /> Job Description
                </label>
                <textarea
                    value={jdText}
                    onChange={(e) => onJdChange(e.target.value)}
                    placeholder="Paste the job requirements here..."
                    className="w-full h-40 p-3 text-sm border-2 border-gray-100 rounded-xl focus:border-black focus:ring-0 transition-all resize-none outline-none"
                />
                <button
                    onClick={async () => {
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        if (tab && tab.id) {
                            chrome.tabs.sendMessage(tab.id, { action: "GET_JD_TEXT" }, (response: { text: string }) => {
                                if (chrome.runtime.lastError) {
                                    alert("Unable to reach the webpage. Please make sure you are on a supported job site (LinkedIn or Indeed) and refresh the page.");
                                    return;
                                }
                                if (response && response.text) {
                                    onJdChange(response.text);
                                } else {
                                    alert("No job description found on this page. Try highlighting the text manually.");
                                }
                            });
                        }
                    }}
                    className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg text-xs font-bold border border-blue-100 flex items-center justify-center gap-2 hover:bg-blue-100"
                >
                    <Icons.Fast size={14} /> Auto-Extract JD from Webpage
                </button>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-black flex items-center gap-2">
                    <Icons.Edit size={16} /> Your Current CV
                </label>
                {cvFile ? (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-bold text-[10px]">CV</div>
                            <div>
                                <p className="text-xs font-bold truncate max-w-[150px]">{cvFile.name}</p>
                                <p className="text-[10px] text-gray-500">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button onClick={() => onCvFileChange(null)} className="text-gray-400 hover:text-red-500"><Icons.Trash size={14} /></button>
                    </div>
                ) : (
                    <FileUpload onFileSelect={onCvFileChange} disabled={loading} />
                )}
            </div>

            {error && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <Icons.Error className="text-red-500 mt-0.5" size={14} />
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="w-full space-y-3">
                    <button
                        disabled
                        className="w-full py-4 rounded-xl font-black bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200"
                    >
                        <Icons.Spinner className="animate-spin" size={18} />
                        <span>Optimizing...</span>
                    </button>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Analyzing Job Description & Generating Content...
                    </p>
                </div>
            ) : (
                <button
                    onClick={onOptimize}
                    disabled={!jdText || !cvFile}
                    className={`
                      w-full py-4 rounded-xl font-black text-white
                      flex items-center justify-center gap-2 transition-all
                      ${!jdText || !cvFile ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'bg-[#FF4F00] hover:bg-[#FF4F00]/90 shadow-xl shadow-[#FF4F00]/20'}
                    `}
                >
                    <Icons.Magic size={18} />
                    <span>Optimize My CV</span>
                </button>
            )}
        </div>
    );
}
