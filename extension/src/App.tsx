import { useState, useEffect, useCallback } from 'react';
import CVOptimizer from './components/CVOptimizer';
import InterviewQA from './components/InterviewQA';
import AtsSwotAnalysis from './components/AtsSwotAnalysis';
import ProjectsList from './components/ProjectsList';
import CoverLetter from './components/CoverLetter';
import LinkedInOutreach from './components/LinkedInOutreach';
import LoginScreen from './components/LoginScreen';
import ReportBug from './components/ReportBug';
import Settings from './components/Settings';
import { getProjects, saveProject, deleteProject, updateProject } from './lib/storage';
import type { OptimizationResult, Project } from './lib/storage';
import { optimizeCV, generateInterviewQuestions, analyzeAtsSwot, generateCoverLetter, generateLinkedInMessages } from './lib/gemini';
import { parseFile } from './lib/fileParser';
import { Icons } from './components/Icons';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getUser, logout, canAccess } from './lib/auth';
import type { UserInfo, UserTier } from './lib/auth';

type TabKey = 'optimizer' | 'interview' | 'ats-swot' | 'cover-letter' | 'linkedin' | 'projects' | 'settings';

export default function App() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('optimizer');
  const [jdText, setJdText] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const tier: UserTier = user?.tier || 'free';

  // Check auth on mount
  useEffect(() => {
    getUser().then((u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const loadData = useCallback(async () => {
    const savedProjects = await getProjects();
    setProjects(savedProjects);
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [loadData, user]);

  // Expose save to projects globally for sub-components
  useEffect(() => {
    (window as any)._saveProject = async (project: Project) => {
      await saveProject(project);
      await loadData();
      alert('Project saved successfully!');
    };
    return () => {
      delete (window as any)._saveProject;
    };
  }, [loadData]);

  const handleOptimize = async () => {
    if (!jdText.trim()) {
      setError('Please enter a job description');
      return;
    }
    if (!cvFile) {
      setError('Please upload your CV');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Parse CV
      const cvText = await parseFile(cvFile);

      // Guard: parseFile returned null or empty string
      if (!cvText || cvText.trim().length === 0) {
        throw new Error(
          'We could not extract any text from your CV. ' +
          'This usually means the PDF is image-based (e.g. exported from Canva or Figma). ' +
          'Please try saving your CV as a Word (.docx) file instead.'
        );
      }

      // Generate a unique runId for batch quota deduction
      const runId = crypto.randomUUID();

      // 2. Build task list based on tier
      const tasks: Promise<any>[] = [
        optimizeCV(jdText, cvText, '', user?.email, runId),
        generateInterviewQuestions(jdText, '', user?.email, runId),
        analyzeAtsSwot(jdText, cvText, '', user?.email, runId),
      ];

      // Only generate cover letter for PRO+ (saves API tokens)
      if (canAccess('coverLetter', tier)) {
        tasks.push(generateCoverLetter(jdText, cvText, user?.email, runId));
      } else {
        tasks.push(Promise.resolve(null));
      }

      // Only generate LinkedIn messages for Premium
      if (canAccess('linkedInOutreach', tier)) {
        tasks.push(generateLinkedInMessages(jdText, cvText, user?.email, runId));
      } else {
        tasks.push(Promise.resolve(null));
      }

      const [optimizationResult, interviewQuestions, atsSwot, coverLetterResult, linkedInResult] = await Promise.all(tasks);

      // 3. Combine results
      const combinedResult: OptimizationResult = {
        ...optimizationResult,
        interviewQuestions,
        atsSwot,
        coverLetter: coverLetterResult || null,
        linkedInMessages: linkedInResult || null,
      };

      setResult(combinedResult);
    } catch (err) {
      console.error('Optimization error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during optimization');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCvFile(null);
    setError(null);
    setJdText('');
    setSelectedProjectId(null);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project.id);
    setResult(project.result);
    setJdText(project.jdText);
    setCvFile(null);
    setActiveTab('optimizer');
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const updated = await deleteProject(id);
      setProjects(updated);
      if (selectedProjectId === id) {
        handleReset();
      }
    }
  };

  const handleUpdateProjectName = async (id: string, newName: string) => {
    const updated = await updateProject(id, newName);
    setProjects(updated);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    handleReset();
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  // Login screen
  if (!user) {
    return <LoginScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-white text-black font-sans selection:bg-blue-100">
      {/* Dynamic Header */}
      <header className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* New Logo style based on reference image */}
          <div className="w-10 h-10 bg-[#FF4F00] text-[#FFF5EB] rounded-xl flex items-center justify-center font-black text-xl tracking-tighter shadow-md" style={{ fontFamily: 'Impact, sans-serif' }}>
            CV.
          </div>
          <div className="flex flex-col -gap-1 ml-1">
            <span className="text-sm font-black tracking-tight" style={{ fontFamily: 'Impact, sans-serif' }}>CV.dot</span>
            <span className="text-[8px] font-bold text-blue-600 tracking-widest uppercase">{tier} plan</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <NavIcon active={activeTab === 'optimizer'} onClick={() => setActiveTab('optimizer')} icon={<Icons.Edit size={14} />} title="Optimize" />
            <NavIcon active={activeTab === 'ats-swot'} onClick={() => setActiveTab('ats-swot')} icon={<Icons.Chart size={14} />} title="Analysis" />
            <NavIcon active={activeTab === 'interview'} onClick={() => setActiveTab('interview')} icon={<Icons.Message size={14} />} title="Interview" />
            <NavIcon active={activeTab === 'cover-letter'} onClick={() => setActiveTab('cover-letter')} icon={<Icons.Mail size={14} />} title="Cover Letter" locked={!canAccess('coverLetter', tier)} />
            <NavIcon active={activeTab === 'linkedin'} onClick={() => setActiveTab('linkedin')} icon={<Icons.Send size={14} />} title="LinkedIn" locked={!canAccess('linkedInOutreach', tier)} />
            <NavIcon active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<Icons.Folder size={14} />} title="History" />
            <NavIcon active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Icons.Settings size={14} />} title="Settings" />
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <ErrorBoundary>
          <div className="p-4 pb-12 max-w-lg mx-auto">
            {activeTab === 'optimizer' ? (
              <div className="space-y-6">
                <CVOptimizer
                  jdText={jdText}
                  onJdChange={setJdText}
                  cvFile={cvFile}
                  onCvFileChange={setCvFile}
                  onOptimize={handleOptimize}
                  loading={loading}
                  error={error}
                  result={result}
                  onReset={handleReset}
                  tier={tier}
                />
              </div>
            ) : activeTab === 'ats-swot' ? (
              <AtsSwotAnalysis data={result?.atsSwot || null} />
            ) : activeTab === 'interview' ? (
              <InterviewQA questions={result?.interviewQuestions || []} />
            ) : activeTab === 'cover-letter' ? (
              <CoverLetter data={result?.coverLetter || null} tier={tier} />
            ) : activeTab === 'linkedin' ? (
              <LinkedInOutreach messages={result?.linkedInMessages || null} tier={tier} />
            ) : activeTab === 'settings' ? (
              <Settings 
                email={user.email} 
                tier={tier} 
                onSignOut={handleLogout} 
                onTierUpdate={(newTier) => setUser({ ...user, tier: newTier })}
              />
            ) : (
              <ProjectsList
                projects={projects}
                onSelect={handleSelectProject}
                onDelete={handleDeleteProject}
                onUpdateName={handleUpdateProjectName}
                selectedId={selectedProjectId || undefined}
              />
            )}
          </div>
        </ErrorBoundary>
      </main>

      {/* Report Bug Floating Button */}
      <ReportBug />

      {/* Footer / Status */}
      <footer className="px-4 py-2 border-t border-gray-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            {user.email}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-medium text-gray-300">V2.0.0</span>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-gray-300 hover:text-red-500 transition-colors"
          >
            <Icons.LogOut size={12} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function NavIcon({ active, onClick, icon, title, locked }: any) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        relative p-2 rounded-lg transition-all duration-200
        ${active ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-white'}
      `}
    >
      {icon}
      {locked && (
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full flex items-center justify-center">
          <Icons.Lock size={6} className="text-white" />
        </div>
      )}
    </button>
  );
}
