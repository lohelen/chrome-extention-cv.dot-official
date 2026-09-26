import { Icons } from './Icons';
import type { Project } from '../lib/storage';
import { useState } from 'react';

interface ProjectsListProps {
    projects: Project[];
    onSelect: (project: Project) => void;
    onDelete: (id: string) => void;
    onUpdateName: (id: string, newName: string) => void;
    selectedId?: string;
}

export default function ProjectsList({ projects, onSelect, onDelete, onUpdateName, selectedId }: ProjectsListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleStartEdit = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setEditingId(project.id);
        const currentTitle = typeof project.title === 'object' ? JSON.stringify(project.title) : project.title;
        setEditName(currentTitle);
    };

    const handleSaveEdit = (e?: React.MouseEvent, id?: string) => {
        if (e) e.stopPropagation();
        if (editingId && editName.trim()) {
            onUpdateName(editingId, editName.trim());
        }
        setEditingId(null);
    };
    if (projects.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-4">
                    <Icons.Folder size={24} />
                </div>
                <h3 className="text-sm font-bold mb-1">History Empty</h3>
                <p className="text-xs text-gray-400">Your optimized CVs will appear here once you save them.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-black">Saved Projects</h2>
            <div className="space-y-3">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => onSelect(project)}
                        className={`
                            p-4 rounded-xl border-2 transition-all cursor-pointer group
                            ${selectedId === project.id
                                ? 'border-black bg-gray-50'
                                : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                            }
                        `}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                {editingId === project.id ? (
                                    <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            className="text-sm font-black w-full bg-white border-2 border-blue-500 rounded px-2 py-0.5 outline-none focus:ring-0"
                                            autoFocus
                                        />
                                        <button onClick={(e) => handleSaveEdit(e)} className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                                            <Icons.Check size={14} />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors">
                                            <Icons.Trash size={14} className="opacity-0 w-0 h-0 hidden" />
                                            <span className="text-xs font-bold leading-none px-1">✕</span>
                                        </button>
                                    </div>
                                ) : (
                                    <h3 className="text-sm font-black mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                                        {typeof project.title === 'object' ? JSON.stringify(project.title) : project.title}
                                    </h3>
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    <span className="truncate max-w-[120px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                                        {typeof project.cvFileName === 'object' ? JSON.stringify(project.cvFileName) : project.cvFileName}
                                    </span>
                                    <span>•</span>
                                    <span className="text-gray-400">{new Date(project.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${selectedId === project.id ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                        {new Date(project.timestamp).toLocaleDateString()}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${selectedId === project.id ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {Number(project?.result?.atsSwot?.atsScore) || 0}% MATCH
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => handleStartEdit(e, project)}
                                    className={`p-1.5 rounded-md transition-all ${selectedId === project.id ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'}`}
                                >
                                    <Icons.Edit size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(project.id);
                                    }}
                                    className={`p-1.5 rounded-md transition-all ${selectedId === project.id ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                                >
                                    <Icons.Trash size={14} />
                                </button>
                                <Icons.ChevronRight size={14} className={selectedId === project.id ? 'text-gray-400' : 'text-gray-300 group-hover:text-black'} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
