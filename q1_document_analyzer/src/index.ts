#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DocumentAnalyzer } from './services/documentAnalyzer.js';
import { DocumentStorage } from './services/documentStorage.js';

class DocumentAnalyzerServer {
  private server: Server;
  private documentAnalyzer: DocumentAnalyzer;
  private documentStorage: DocumentStorage;

  constructor() {
    this.server = new Server(
      {
        name: 'document-analyzer-server',
        version: '1.0.0',
      }
    );

    this.documentAnalyzer = new DocumentAnalyzer();
    this.documentStorage = new DocumentStorage();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_document',
            description: 'Perform complete analysis of a document including sentiment, keywords, readability, and statistics',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'The ID of the document to analyze'
                }
              },
              required: ['document_id']
            }
          },
          {
            name: 'get_sentiment',
            description: 'Analyze the sentiment of any text (positive/negative/neutral)',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'The text to analyze for sentiment'
                }
              },
              required: ['text']
            }
          },
          {
            name: 'extract_keywords',
            description: 'Extract top keywords from text with frequency and importance scores',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'The text to extract keywords from'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of keywords to return (default: 10)',
                  default: 10
                }
              },
              required: ['text']
            }
          },
          {
            name: 'add_document',
            description: 'Add a new document to the storage with metadata',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Document title'
                },
                content: {
                  type: 'string',
                  description: 'Document content'
                },
                author: {
                  type: 'string',
                  description: 'Document author (optional)'
                },
                category: {
                  type: 'string',
                  description: 'Document category (optional)'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Document tags (optional)'
                }
              },
              required: ['title', 'content']
            }
          },
          {
            name: 'search_documents',
            description: 'Search documents by content and return relevant results',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to find relevant documents'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'list_documents',
            description: 'List all available documents with basic information',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of documents to return (default: 20)',
                  default: 20
                }
              }
            }
          },
          {
            name: 'get_document',
            description: 'Get a specific document by ID',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'The ID of the document to retrieve'
                }
              },
              required: ['document_id']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_document':
            return await this.handleAnalyzeDocument(args as { document_id: string });
          case 'get_sentiment':
            return await this.handleGetSentiment(args as { text: string });
          case 'extract_keywords':
            return await this.handleExtractKeywords(args as { text: string; limit?: number });
          case 'add_document':
            return await this.handleAddDocument(args as {
              title: string;
              content: string;
              author?: string;
              category?: string;
              tags?: string[];
            });
          case 'search_documents':
            return await this.handleSearchDocuments(args as { query: string });
          case 'list_documents':
            return await this.handleListDocuments(args as { limit?: number });
          case 'get_document':
            return await this.handleGetDocument(args as { document_id: string });
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });
  }

  private async handleAnalyzeDocument(args: { document_id: string }) {
    const document = this.documentStorage.getDocument(args.document_id);
    if (!document) {
      throw new Error(`Document with ID ${args.document_id} not found`);
    }

    let analysis = this.documentStorage.getCachedAnalysis(args.document_id);
    if (!analysis) {
      analysis = this.documentAnalyzer.analyzeDocument(args.document_id, document.content);
      this.documentStorage.cacheAnalysis(args.document_id, analysis);
    }

    return {
      content: [
        {
          type: 'text',
          text: this.formatAnalysisResult(analysis, document)
        }
      ]
    };
  }

  private async handleGetSentiment(args: { text: string }) {
    const sentiment = this.documentAnalyzer.analyzeSentiment(args.text);
    
    return {
      content: [
        {
          type: 'text',
          text: `Sentiment Analysis Results:
• Classification: ${sentiment.classification}
• Score: ${sentiment.score}
• Comparative Score: ${sentiment.comparative.toFixed(3)}
• Positive Words: ${sentiment.positiveWords.join(', ') || 'None'}
• Negative Words: ${sentiment.negativeWords.join(', ') || 'None'}`
        }
      ]
    };
  }

  private async handleExtractKeywords(args: { text: string; limit?: number }) {
    const keywords = this.documentAnalyzer.extractKeywords(args.text, args.limit || 10);
    
    const keywordText = keywords.map(kw => 
      `• "${kw.term}" (frequency: ${kw.frequency}, importance: ${kw.importance.toFixed(2)})`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Top ${keywords.length} Keywords:\n${keywordText}`
        }
      ]
    };
  }

  private async handleAddDocument(args: {
    title: string;
    content: string;
    author?: string;
    category?: string;
    tags?: string[];
  }) {
    const document = this.documentStorage.addDocument(args);
    
    return {
      content: [
        {
          type: 'text',
          text: `Document added successfully!
• ID: ${document.id}
• Title: ${document.title}
• Author: ${document.author || 'Unknown'}
• Category: ${document.category || 'Uncategorized'}
• Tags: ${document.tags?.join(', ') || 'None'}
• Created: ${document.createdAt.toISOString()}`
        }
      ]
    };
  }

  private async handleSearchDocuments(args: { query: string }) {
    const results = this.documentStorage.searchDocuments(args.query);
    
    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No documents found matching "${args.query}"`
          }
        ]
      };
    }

    const resultsText = results.map((result, index) => 
      `${index + 1}. ${result.title} (ID: ${result.documentId})
   Relevance: ${result.relevance}
   Snippet: ${result.snippet}
   Matched Terms: ${result.matchedTerms.join(', ')}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} documents matching "${args.query}":\n\n${resultsText}`
        }
      ]
    };
  }

  private async handleListDocuments(args: { limit?: number }) {
    const documents = this.documentStorage.getAllDocuments();
    const limit = args.limit || 20;
    const limitedDocs = documents.slice(0, limit);
    
    const docsText = limitedDocs.map((doc, index) => 
      `${index + 1}. ${doc.title}
   ID: ${doc.id}
   Author: ${doc.author || 'Unknown'}
   Category: ${doc.category || 'Uncategorized'}
   Tags: ${doc.tags?.join(', ') || 'None'}
   Word Count: ${doc.content.split(/\s+/).length}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available Documents (showing ${limitedDocs.length} of ${documents.length}):\n\n${docsText}`
        }
      ]
    };
  }

  private async handleGetDocument(args: { document_id: string }) {
    const document = this.documentStorage.getDocument(args.document_id);
    if (!document) {
      throw new Error(`Document with ID ${args.document_id} not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Document Details:
• ID: ${document.id}
• Title: ${document.title}
• Author: ${document.author || 'Unknown'}
• Category: ${document.category || 'Uncategorized'}
• Tags: ${document.tags?.join(', ') || 'None'}
• Created: ${document.createdAt.toISOString()}
• Updated: ${document.updatedAt.toISOString()}
• Word Count: ${document.content.split(/\s+/).length}

Content:
${document.content}`
        }
      ]
    };
  }

  private formatAnalysisResult(analysis: any, document: any): string {
    return `Document Analysis Results for "${document.title}"

📊 BASIC STATISTICS:
• Word Count: ${analysis.statistics.wordCount}
• Sentence Count: ${analysis.statistics.sentenceCount}
• Paragraph Count: ${analysis.statistics.paragraphCount}
• Average Words per Sentence: ${analysis.statistics.averageWordsPerSentence}
• Unique Words: ${analysis.statistics.uniqueWords}
• Vocabulary Diversity: ${analysis.statistics.vocabularyDiversity}

😊 SENTIMENT ANALYSIS:
• Classification: ${analysis.sentiment.classification}
• Score: ${analysis.sentiment.score}
• Comparative Score: ${analysis.sentiment.comparative.toFixed(3)}
• Positive Words: ${analysis.sentiment.positive.join(', ') || 'None'}
• Negative Words: ${analysis.sentiment.negative.join(', ') || 'None'}

🔑 TOP KEYWORDS:
${analysis.keywords.map((kw: any, index: number) => 
  `${index + 1}. "${kw.term}" (frequency: ${kw.frequency}, importance: ${kw.importance.toFixed(2)})`
).join('\n')}

📖 READABILITY:
• Flesch-Kincaid Score: ${analysis.readability.fleschKincaid}
• Grade Level: ${analysis.readability.gradeLevel}
• Complexity: ${analysis.readability.complexity}

📅 Analysis Date: ${analysis.analysisDate.toISOString()}`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Document Analyzer MCP Server started');
  }
}

const server = new DocumentAnalyzerServer();
server.run().catch(console.error); 