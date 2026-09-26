import { useState } from 'react';
import { Icons } from './Icons';

export default function ReportBug() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        if (!message.trim()) return;

        const subject = encodeURIComponent('CV. Extension Bug Report');
        const body = encodeURIComponent(
            `Bug Report from CV. Extension\n` +
            `---\n` +
            `${message}\n` +
            `---\n` +
            `Version: 2.0.0\n` +
            `Time: ${new Date().toISOString()}\n` +
            `UserAgent: ${navigator.userAgent}`
        );

        window.open(`mailto:loting2425@gmail.com?subject=${subject}&body=${body}`, '_blank');
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setIsOpen(false);
            setMessage('');
        }, 2000);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-14 right-4 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors underline cursor-pointer z-50"
            >
                Report Bug
            </button>
        );
    }

    return (
        <div className="fixed bottom-14 right-3 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1.5">
                    <Icons.Warning size={10} className="text-amber-500" /> Report a Bug
                </span>
                <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
            </div>
            <div className="p-3 space-y-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue..."
                    className="w-full h-20 text-xs p-2 border border-gray-200 rounded-lg resize-none outline-none focus:border-gray-400 transition-all"
                    autoFocus
                />
                <button
                    onClick={handleSend}
                    disabled={!message.trim() || sent}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all
                        ${sent
                            ? 'bg-green-50 text-green-600 border border-green-200'
                            : !message.trim()
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800'
                        }
                    `}
                >
                    {sent ? (
                        <><Icons.Check size={10} /> Sent!</>
                    ) : (
                        <><Icons.Send size={10} /> Send Report</>
                    )}
                </button>
            </div>
        </div>
    );
}
