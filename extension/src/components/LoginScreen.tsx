import { useState } from 'react';
import { loginWithGoogle } from '../lib/auth';
import type { UserInfo } from '../lib/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: UserInfo) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-8">
      {/* Logo & Brand */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div 
          className="w-16 h-16 bg-[#FF4F00] text-[#FFF5EB] rounded-2xl flex items-center justify-center font-black text-4xl tracking-tighter shadow-xl" 
          style={{ fontFamily: 'Impact, sans-serif' }}
        >
          CV.
        </div>
        <div className="text-center mt-2">
          <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Impact, sans-serif' }}>CV.dot</h1>
          <p className="text-xs text-gray-400 font-medium mt-1">AI-Powered Career Toolkit</p>
        </div>
      </div>

      {/* Features Preview */}
      <div className="w-full max-w-xs space-y-3 mb-10">
        <FeatureRow emoji="✨" text="Optimize your CV with AI" />
        <FeatureRow emoji="📊" text="ATS Score & SWOT Analysis" />
        <FeatureRow emoji="💬" text="Mock Interview Questions" />
        <FeatureRow emoji="📝" text="Cover Letter Generation" tag="PRO" />
        <FeatureRow emoji="🔗" text="LinkedIn Outreach Templates" tag="PREMIUM" />
      </div>

      {/* Login Button */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className={`
          w-full max-w-xs py-3.5 rounded-xl font-bold text-sm
          flex items-center justify-center gap-3 transition-all
          ${loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-black text-white hover:bg-gray-800 shadow-xl shadow-gray-200 active:scale-[0.98]'
          }
        `}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <GoogleIcon />
            Sign in with Google
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 mt-3 text-center max-w-xs">{error}</p>
      )}

      {/* Footer */}
      <p className="text-[9px] text-gray-300 mt-8">
        By signing in, you agree to our Terms of Service
      </p>
    </div>
  );
}

function FeatureRow({ emoji, text, tag }: { emoji: string; text: string; tag?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl">
      <span className="text-base">{emoji}</span>
      <span className="text-xs font-medium text-gray-700 flex-1">{text}</span>
      {tag && (
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
          tag === 'PRO' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
        }`}>
          {tag}
        </span>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
