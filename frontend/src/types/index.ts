export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_starter: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  faq_ids?: string[];
  found?: boolean;
  type?: 'faq' | 'smalltalk' | 'not_found' | 'user';
  feedback?: 'helpful' | 'not_helpful' | null;
  animated?: boolean;
  language?: 'english' | 'urdu_roman' | 'urdu_script';
}

export interface CitationItem {
  id: string;
  label: string;
  citations: number;
  is_top: boolean;
}

export interface CategoryItem {
  category: string;
  count: number;
}

export interface TimelineItem {
  time: string;
  total: number;
  answered: number;
  not_found: number;
}

export interface RecentQuestionItem {
  id: number;
  time: string;
  question: string;
  lang: string;
  type: string;
  found: boolean;
  citations: string[];
}

export interface MostCitedFAQ {
  id: string;
  question: string;
  category: string;
  citations: number;
}

export interface StatsData {
  total_questions: number;
  answered: number;
  not_found: number;
  chit_chat: number;
  answer_rate: number;
  helpful_count: number;
  not_helpful_count: number;
  satisfaction_rate: number;
  most_cited_faq: MostCitedFAQ | null;
  citations_chart: CitationItem[];
  categories_chart: CategoryItem[];
  timeline: TimelineItem[];
  recent_questions: RecentQuestionItem[];
}

export type LanguageMode = 'auto' | 'english' | 'urdu';
export type Theme = 'light' | 'dark';
export type NavPage = 'chat' | 'faqs' | 'stats' | 'about' | 'admin';
export type FAQCategory =
  | 'Labs'
  | 'Academics'
  | 'Library'
  | 'Exams'
  | 'Fees'
  | 'Projects'
  | 'Transport'
  | 'Help';
