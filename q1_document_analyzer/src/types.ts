export interface Document {
  id: string;
  title: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface DocumentAnalysis {
  documentId: string;
  sentiment: {
    score: number;
    comparative: number;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
    classification: 'positive' | 'negative' | 'neutral';
  };
  keywords: Array<{
    term: string;
    frequency: number;
    importance: number;
  }>;
  readability: {
    fleschKincaid: number;
    gradeLevel: string;
    complexity: 'easy' | 'medium' | 'hard';
  };
  statistics: {
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    averageWordsPerSentence: number;
    uniqueWords: number;
    vocabularyDiversity: number;
  };
  analysisDate: Date;
}

export interface SentimentResult {
  score: number;
  comparative: number;
  classification: 'positive' | 'negative' | 'neutral';
  positiveWords: string[];
  negativeWords: string[];
}

export interface KeywordResult {
  term: string;
  frequency: number;
  importance: number;
}

export interface ReadabilityResult {
  fleschKincaid: number;
  gradeLevel: string;
  complexity: 'easy' | 'medium' | 'hard';
}

export interface DocumentStats {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  uniqueWords: number;
  vocabularyDiversity: number;
}

export interface SearchResult {
  documentId: string;
  title: string;
  relevance: number;
  snippet: string;
  matchedTerms: string[];
} 