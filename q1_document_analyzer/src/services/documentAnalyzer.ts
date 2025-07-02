import Sentiment from 'sentiment';
import natural from 'natural';
import { 
  DocumentAnalysis, 
  SentimentResult, 
  KeywordResult, 
  ReadabilityResult, 
  DocumentStats 
} from '../types.js';

const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();
const stopWords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
]);

export class DocumentAnalyzer {
  
  /**
   * Analyze sentiment of text
   */
  analyzeSentiment(text: string): SentimentResult {
    const result = sentiment.analyze(text);
    
    let classification: 'positive' | 'negative' | 'neutral';
    if (result.comparative > 0.1) {
      classification = 'positive';
    } else if (result.comparative < -0.1) {
      classification = 'negative';
    } else {
      classification = 'neutral';
    }

    return {
      score: result.score,
      comparative: result.comparative,
      classification,
      positiveWords: result.positive,
      negativeWords: result.negative
    };
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text: string, limit: number = 10): KeywordResult[] {
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    const wordFreq: Map<string, number> = new Map();
    
    // Count word frequencies, excluding stop words
    for (const token of tokens) {
      if (token && token.length > 2 && !stopWords.has(token)) {
        wordFreq.set(token, (wordFreq.get(token) || 0) + 1);
      }
    }

    // Calculate importance score (frequency * word length)
    const keywords: KeywordResult[] = [];
    for (const [term, frequency] of wordFreq) {
      const importance = frequency * term.length;
      keywords.push({ term, frequency, importance });
    }

    // Sort by importance and return top results
    return keywords
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  /**
   * Calculate readability score using Flesch-Kincaid
   */
  calculateReadability(text: string): ReadabilityResult {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);

    let fleschKincaid = 0;
    if (sentences.length > 0 && words.length > 0) {
      fleschKincaid = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
    }

    let gradeLevel = 'College';
    if (fleschKincaid >= 90) gradeLevel = '5th grade';
    else if (fleschKincaid >= 80) gradeLevel = '6th grade';
    else if (fleschKincaid >= 70) gradeLevel = '7th grade';
    else if (fleschKincaid >= 60) gradeLevel = '8th-9th grade';
    else if (fleschKincaid >= 50) gradeLevel = '10th-12th grade';
    else if (fleschKincaid >= 30) gradeLevel = 'College';
    else gradeLevel = 'College graduate';

    let complexity: 'easy' | 'medium' | 'hard';
    if (fleschKincaid >= 70) complexity = 'easy';
    else if (fleschKincaid >= 50) complexity = 'medium';
    else complexity = 'hard';

    return {
      fleschKincaid: Math.round(fleschKincaid * 100) / 100,
      gradeLevel,
      complexity
    };
  }

  /**
   * Calculate basic document statistics
   */
  calculateStats(text: string): DocumentStats {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;

    const averageWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const vocabularyDiversity = words.length > 0 ? uniqueWords / words.length : 0;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 100) / 100,
      uniqueWords,
      vocabularyDiversity: Math.round(vocabularyDiversity * 1000) / 1000
    };
  }

  /**
   * Perform complete document analysis
   */
  analyzeDocument(documentId: string, text: string): DocumentAnalysis {
    const sentimentResult = this.analyzeSentiment(text);
    const keywords = this.extractKeywords(text);
    const readability = this.calculateReadability(text);
    const stats = this.calculateStats(text);

    return {
      documentId,
      sentiment: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        tokens: text.split(/\s+/),
        words: text.split(/\s+/),
        positive: sentimentResult.positiveWords,
        negative: sentimentResult.negativeWords,
        classification: sentimentResult.classification
      },
      keywords,
      readability,
      statistics: stats,
      analysisDate: new Date()
    };
  }

  /**
   * Count syllables in text (simplified algorithm)
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    for (const word of words) {
      if (word.length <= 3) {
        syllableCount += 1;
        continue;
      }

      // Remove common suffixes
      let processedWord = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      processedWord = processedWord.replace(/^y/, '');

      // Count vowel groups
      const matches = processedWord.match(/[aeiouy]{1,2}/g);
      syllableCount += matches ? matches.length : 1;
    }

    return syllableCount;
  }
} 