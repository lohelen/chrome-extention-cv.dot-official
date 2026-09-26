import { Icons } from './Icons';

interface InterviewQAProps {
    questions: any[];
}

// Safely extract question text from either string or object format
function getQuestionText(q: any): string {
    if (typeof q === 'string') return q;
    if (q && typeof q === 'object') {
        // Handle {question: "...", category: "...", difficulty: "..."} format
        return q.question || q.text || q.content || JSON.stringify(q);
    }
    return String(q);
}

export default function InterviewQA({ questions }: InterviewQAProps) {
    if (!questions || questions.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-4">
                    <Icons.Message size={24} />
                </div>
                <h3 className="text-sm font-bold mb-1">No Questions Yet</h3>
                <p className="text-xs text-gray-400">Optimize a CV first to generate custom interview questions.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-black">Interview Preparation</h2>
                <p className="text-[10px] text-gray-500 font-medium">Predicted questions based on the JD.</p>
            </div>

            <div className="grid gap-4">
                {questions.map((question, idx) => {
                    const text = getQuestionText(question);
                    const category = typeof question === 'object' && question?.category ? question.category : null;
                    return (
                        <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex gap-3">
                                <span className="text-blue-500 font-black text-[10px] bg-blue-50 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                                <div className="flex-1">
                                    {category && (
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">{category}</span>
                                    )}
                                    <p className="text-xs text-gray-800 font-medium leading-relaxed">{text}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <Icons.Idea size={14} /> Tip
                </div>
                <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                    Try to answer these using the <strong>STAR method</strong> (Situation, Task, Action, Result) with the keywords identified!
                </p>
            </div>
        </div>
    );
}
