export type UserTier = 'free' | 'pro' | 'premium';

export interface UserInfo {
  email: string;
  name: string;
  avatar: string;
  tier: UserTier;
}

const USER_STORAGE_KEY = 'cv_dot_user';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get stored user from chrome.storage.sync
 */
export async function getUser(): Promise<UserInfo | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([USER_STORAGE_KEY], (result: Record<string, any>) => {
      const user = result[USER_STORAGE_KEY] as UserInfo | undefined;
      resolve(user || null);
    });
  });
}

/**
 * Save user to chrome.storage.sync (persistent across devices)
 */
async function saveUser(user: UserInfo): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [USER_STORAGE_KEY]: user }, resolve);
  });
}

/**
 * Clear stored user (logout)
 */
export async function logout(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove([USER_STORAGE_KEY], () => {
      // Also revoke the cached auth token
      try {
        chrome.identity.clearAllCachedAuthTokens(() => resolve());
      } catch {
        resolve();
      }
    });
  });
}

/**
 * Login with Google via Chrome Identity API
 */
export async function loginWithGoogle(): Promise<UserInfo> {
  // 1. Get OAuth token from Chrome Identity API
  const token = await new Promise<string>((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (result: any) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError?.message || 'Auth failed'));
        return;
      }
      // Chrome MV3 returns { token } object or string depending on version
      const tokenStr = typeof result === 'string' ? result : result?.token;
      if (!tokenStr) {
        reject(new Error('No token received'));
        return;
      }
      resolve(tokenStr);
    });
  });

  // 2. Fetch Google user info
  const googleRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!googleRes.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const googleUser = await googleRes.json();
  const email = googleUser.email;
  const name = googleUser.name || '';
  const avatar = googleUser.picture || '';

  // 3. Register / fetch tier from backend
  const backendRes = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, avatar })
  });

  let tier: UserTier = 'free';
  if (backendRes.ok) {
    const data = await backendRes.json();
    tier = (data.tier as UserTier) || 'free';
  }

  // 4. Save to sync storage
  const user: UserInfo = { email, name, avatar, tier };
  await saveUser(user);

  return user;
}

/**
 * Refresh user tier from backend (call periodically or on app load)
 */
export async function refreshUserTier(email: string): Promise<UserTier> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      const data = await res.json();
      const tier = (data.tier as UserTier) || 'free';

      // Update stored user
      const user = await getUser();
      if (user) {
        user.tier = tier;
        await saveUser(user);
      }

      return tier;
    }
  } catch (err) {
    console.error('Failed to refresh tier:', err);
  }
  return 'free';
}

/**
 * Verify Lemon Squeezy license key via backend
 */
export async function verifyLicenseKey(email: string, licenseKey: string): Promise<{ success: boolean; tier?: UserTier; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, licenseKey })
    });

    if (res.ok) {
      const data = await res.json();
      const newTier = (data.tier as UserTier) || 'free';

      // Update local storage if successful
      const user = await getUser();
      if (user) {
        user.tier = newTier;
        await saveUser(user);
      }

      return { success: true, tier: newTier };
    } else {
      const errorData = await res.json();
      return { success: false, error: errorData.error || 'Verification failed' };
    }
  } catch (err) {
    console.error('License verification error:', err);
    return { success: false, error: 'Network error. Please try again later.' };
  }
}

/**
 * Check if a feature is accessible for the given tier
 */
export function canAccess(feature: 'coverLetter' | 'linkedInOutreach' | 'claudeSync', tier: UserTier): boolean {
  switch (feature) {
    case 'coverLetter':
      return tier === 'pro' || tier === 'premium';
    case 'linkedInOutreach':
    case 'claudeSync':
      return tier === 'premium';
    default:
      return true;
  }
}
