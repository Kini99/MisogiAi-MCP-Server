#!/usr/bin/env node

// Demo script to showcase the Document Analyzer functionality
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distServicesPath = join(__dirname, 'dist', 'services');

if (!existsSync(distServicesPath)) {
  console.error('❌ Build output not found. Please run "npm run build" first.');
  process.exit(1);
}

// Use compiled JS files from dist/
import { DocumentAnalyzer } from './dist/services/documentAnalyzer.js';
import { DocumentStorage } from './dist/services/documentStorage.js';

console.log('🎯 MCP Document Analyzer Demo\n');

async function runDemo() {
  const analyzer = new DocumentAnalyzer();
  const storage = new DocumentStorage();

  console.log('📚 Sample Documents Available:');
  const documents = storage.getAllDocuments();
  documents.slice(0, 3).forEach((doc, index) => {
    console.log(`${index + 1}. ${doc.title} (${doc.category})`);
  });
  console.log(`... and ${documents.length - 3} more documents\n`);

  // Demo 1: Sentiment Analysis
  console.log('😊 DEMO 1: Sentiment Analysis');
  const testText = "I absolutely love this new technology! It's amazing and makes everything so much better.";
  const sentiment = analyzer.analyzeSentiment(testText);
  console.log(`Text: "${testText}"`);
  console.log(`Sentiment: ${sentiment.classification} (score: ${sentiment.score})`);
  console.log(`Positive words: ${sentiment.positiveWords.join(', ')}`);
  console.log(`Negative words: ${sentiment.negativeWords.join(', ')}\n`);

  // Demo 2: Keyword Extraction
  console.log('🔑 DEMO 2: Keyword Extraction');
  const keywordText = "Artificial Intelligence is rapidly transforming our world. From self-driving cars to virtual assistants, AI technologies are becoming increasingly integrated into our daily lives.";
  const keywords = analyzer.extractKeywords(keywordText, 5);
  console.log(`Text: "${keywordText}"`);
  console.log('Top keywords:');
  keywords.forEach((kw, index) => {
    console.log(`${index + 1}. "${kw.term}" (frequency: ${kw.frequency}, importance: ${kw.importance.toFixed(2)})`);
  });
  console.log();

  // Demo 3: Readability Analysis
  console.log('📖 DEMO 3: Readability Analysis');
  const readabilityText = "The Flesch-Kincaid readability tests are readability tests designed to indicate how difficult a passage in English is to understand. There are two tests, the Flesch Reading-Ease, and the Flesch-Kincaid Grade Level.";
  const readability = analyzer.calculateReadability(readabilityText);
  console.log(`Text: "${readabilityText}"`);
  console.log(`Flesch-Kincaid Score: ${readability.fleschKincaid}`);
  console.log(`Grade Level: ${readability.gradeLevel}`);
  console.log(`Complexity: ${readability.complexity}\n`);

  // Demo 4: Document Statistics
  console.log('📊 DEMO 4: Document Statistics');
  const stats = analyzer.calculateStats(readabilityText);
  console.log(`Word Count: ${stats.wordCount}`);
  console.log(`Sentence Count: ${stats.sentenceCount}`);
  console.log(`Paragraph Count: ${stats.paragraphCount}`);
  console.log(`Average Words per Sentence: ${stats.averageWordsPerSentence}`);
  console.log(`Unique Words: ${stats.uniqueWords}`);
  console.log(`Vocabulary Diversity: ${stats.vocabularyDiversity}\n`);

  // Demo 5: Complete Document Analysis
  console.log('🎯 DEMO 5: Complete Document Analysis');
  const sampleDoc = documents[0];
  const analysis = analyzer.analyzeDocument(sampleDoc.id, sampleDoc.content);
  console.log(`Document: "${sampleDoc.title}"`);
  console.log(`Sentiment: ${analysis.sentiment.classification}`);
  console.log(`Readability: ${analysis.readability.gradeLevel} (${analysis.readability.complexity})`);
  console.log(`Top Keywords: ${analysis.keywords.slice(0, 3).map(kw => kw.term).join(', ')}`);
  console.log(`Word Count: ${analysis.statistics.wordCount}\n`);

  // Demo 6: Document Search
  console.log('🔍 DEMO 6: Document Search');
  const searchResults = storage.searchDocuments('technology');
  console.log(`Search results for "technology": ${searchResults.length} documents found`);
  searchResults.slice(0, 2).forEach((result, index) => {
    console.log(`${index + 1}. ${result.title} (relevance: ${result.relevance})`);
    console.log(`   Snippet: ${result.snippet}`);
  });
  console.log();

  console.log('✅ Demo completed successfully!');
  console.log('\n💡 To use with Claude Desktop:');
  console.log('1. Build the project: npm run build');
  console.log('2. Add the server to Claude Desktop configuration');
  console.log('3. Restart Claude Desktop');
  console.log('4. Ask Claude to analyze documents or perform sentiment analysis!');
}

runDemo().catch(console.error); 