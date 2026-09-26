export interface OptimizationResult {
    keywords: string[];
    jdSummary: string;
    interviewQuestions: string[];
    atsSwot: AtsSwotResult;
    coverLetter: CoverLetterResult | null;
    linkedInMessages: LinkedInMessage[] | null;
    sections: {
        title: string;
        originalContent: string;
        optimizedContent: string;
    }[];
}

export interface AtsSwotResult {
    atsScore: number;
    missingKeywords: string[];
    swot: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
}

export interface CoverLetterResult {
    coverLetter: string;
    highlightedConnections: {
        jdRequirement: string;
        cvExperience: string;
    }[];
}

export interface LinkedInMessage {
    style: string;
    label: string;
    message: string;
}

export interface Project {
    id: string;
    timestamp: number;
    title: string;
    jdText: string;
    cvFileName: string;
    result: OptimizationResult;
}

const STORAGE_KEY = 'cv_optimizer_projects';

export const saveProject = async (project: Project): Promise<void> => {
    const projects = await getProjects();
    const updatedProjects = [project, ...projects];
    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: updatedProjects }, () => {
            resolve();
        });
    });
};

export const updateProject = async (id: string, newTitle: string): Promise<Project[]> => {
    const projects = await getProjects();
    const updatedProjects = projects.map(p => p.id === id ? { ...p, title: newTitle } : p);
    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: updatedProjects }, () => {
            resolve(updatedProjects);
        });
    });
};

export const getProjects = async (): Promise<Project[]> => {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result: { [key: string]: any }) => {
            resolve(result[STORAGE_KEY] || []);
        });
    });
};

export const deleteProject = async (id: string): Promise<Project[]> => {
    const projects = await getProjects();
    const updatedProjects = projects.filter(p => p.id !== id);
    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: updatedProjects }, () => {
            resolve(updatedProjects);
        });
    });
};
