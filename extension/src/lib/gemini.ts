import type { OptimizationResult, AtsSwotResult, CoverLetterResult, LinkedInMessage } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse {
    success: boolean;
    data: any;
    quota?: {
        limit: number;
        remaining: number;
        reset: string;
    };
    error?: string;
}

async function callGateway(action: string, jdText: string, cvText?: string, userEmail?: string, runId?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/gateway`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action,
            jdText,
            cvText,
            userEmail,
            runId,
        }),
    });

    const result: ApiResponse = await response.json();

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error(`Daily quota exceeded. Please try again tomorrow. (Resets: ${result.quota?.reset || 'unknown'})`);
        }
        if (response.status === 503) {
            throw new Error('Service is currently under maintenance. Please try again later.');
        }
        if (response.status === 403) {
            throw new Error(result.error || 'This feature requires a higher subscription tier.');
        }
        throw new Error(result.error || 'Request failed');
    }

    // Store quota info if available
    if (result.quota) {
        console.log(`API Quota: ${result.quota.remaining}/${result.quota.limit} remaining`);
    }

    return result.data;
}

export async function optimizeCV(
    jdText: string,
    cvText: string,
    _apiKey: string, // Keep signature for compatibility, but ignore
    userEmail?: string,
    runId?: string
): Promise<Omit<OptimizationResult, 'interviewQuestions' | 'atsSwot' | 'coverLetter' | 'linkedInMessages'>> {
    console.log(`[optimizeCV] cvText length: ${cvText.length}`);
    if (!cvText || cvText.trim().length === 0) {
        throw new Error("The uploaded CV appears to have no readable text. Please try another file or a Word document.");
    }

    try {
        return await callGateway('optimize', jdText, cvText, userEmail, runId);
    } catch (error: any) {
        console.error('Optimization error:', error);
        throw error;
    }
}

export async function generateInterviewQuestions(
    jdText: string,
    _apiKey: string, // Keep signature for compatibility, but ignore
    userEmail?: string,
    runId?: string
): Promise<string[]> {
    try {
        return await callGateway('interview', jdText, undefined, userEmail, runId);
    } catch (error: any) {
        console.error('Interview questions error:', error);
        throw error;
    }
}

export async function analyzeAtsSwot(
    jdText: string,
    cvText: string,
    _apiKey: string, // Keep signature for compatibility, but ignore
    userEmail?: string,
    runId?: string
): Promise<AtsSwotResult> {
    try {
        return await callGateway('ats-swot', jdText, cvText, userEmail, runId);
    } catch (error: any) {
        console.error('ATS SWOT error:', error);
        throw error;
    }
}

export async function generateCoverLetter(
    jdText: string,
    cvText: string,
    userEmail?: string,
    runId?: string
): Promise<CoverLetterResult> {
    try {
        return await callGateway('cover-letter', jdText, cvText, userEmail, runId);
    } catch (error: any) {
        console.error('Cover letter error:', error);
        throw error;
    }
}

export async function generateLinkedInMessages(
    jdText: string,
    cvText: string,
    userEmail?: string,
    runId?: string
): Promise<LinkedInMessage[]> {
    try {
        return await callGateway('linkedin-outreach', jdText, cvText, userEmail, runId);
    } catch (error: any) {
        console.error('LinkedIn outreach error:', error);
        throw error;
    }
}
