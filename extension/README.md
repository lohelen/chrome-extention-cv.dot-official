# CV.dot — AI-Powered Career Toolkit

CV.dot is a modern Chrome Extension designed to help job seekers optimize their resumes, analyze job descriptions, and prepare for interviews using advanced AI.

## Project Structure
- `src/`: React + TypeScript source code.
- `public/`: Static assets and extension manifest.
- `dist/`: Production-ready build (Load this in Chrome Developer Mode).

## Plans & Features

### 🟠 Free Plan
*   **Core AI CV Optimization**: Automatically tailor your CV keywords and structure to match specific Job Descriptions.
*   **ATS Match & SWOT Analysis**: Real-time analysis of resume compatibility, highlighting key strengths and gaps.
*   **Interview Preparation**: AI-generated interview questions based on your optimized profile.
*   **Web Job Extraction**: Quickly pull JD text from LinkedIn and Indeed with a single click.
*   **Local Project History**: Save and manage your optimization history locally within your browser.

### 🔵 Pro Plan
*   **Includes all Free features**.
*   **AI Cover Letter Generator**: Custom, job-specific cover letters professionally written to match your optimized CV.
*   **Priority Logic**: Enhanced AI prompts for more nuanced and high-quality optimizations.

### 🟣 Premium Plan (Full Experience)
*   **Includes all Pro features**.
*   **LinkedIn Outreach Templates**: Specialized message templates with professional closing sign-offs for effective networking.
*   **Claude Deep Sync**: Seamlessly auto-generate optimized content by connecting your Canva CV template via free Claude in one click.
*   **Priority Processing**: High-priority AI generation speeds for all features.

## Installation
1. Run `npm run build` to generate the `dist` folder.
2. Go to `chrome://extensions/` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `dist` folder in this project.
