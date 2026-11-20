// AskSE Competition & System Configuration
// Editable details for competition evaluation

export interface CompetitionConfig {
  appName: string;
  entryId: string;
  teamName: string;
  teamMembers: string[];
  repositoryUrl: string;
  llmApi: string;
  model: string;
  aiDevTools: string;
  adminPin: string;
  noticeText: string;
  notFoundMessage: string;
  aiUnavailableMessage: string;
  validationMessage: string;
  clearConfirmMessage: string;
  incorrectPinMessage: string;
}

export const APP_CONFIG: CompetitionConfig = {
  appName: 'AskSE',
  entryId: 'ASKSE-2026-001',
  teamName: 'Software Engineering Help Desk Team',
  teamMembers: [
    'Lead Engineer & AI Architect',
    'Full-Stack Developer & UI/UX',
    'Systems & Evaluation Specialist',
  ],
  repositoryUrl: 'https://github.com/zobiahassansial/vibejam-zobia-.git',
  llmApi: 'Ollama Local REST API (http://localhost:11434)',
  model: 'llama3.2:latest',
  aiDevTools: 'Ollama local inference, Prompt Engineering guardrails, FastAPI async engine',
  adminPin: '2026',
  noticeText: 'Answers are AI-generated from the department FAQ. Verify important information with the office.',
  notFoundMessage: 'Sorry, I could not find this in the department FAQ. Please email helpdesk@se.example.edu or visit Room 210.',
  aiUnavailableMessage: 'AI service unavailable. Check your connection or API key and try again.',
  validationMessage: 'Message must be 1 to 300 characters.',
  clearConfirmMessage: 'Clear all messages?',
  incorrectPinMessage: 'Incorrect PIN',
};

