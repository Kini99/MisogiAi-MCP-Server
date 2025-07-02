import { v4 as uuidv4 } from 'uuid';
import { Document, SearchResult } from '../types.js';

export class DocumentStorage {
  private documents: Map<string, Document> = new Map();
  private analysisCache: Map<string, any> = new Map();

  constructor() {
    this.initializeSampleDocuments();
  }

  /**
   * Add a new document to storage
   */
  addDocument(documentData: {
    title: string;
    content: string;
    author?: string;
    category?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Document {
    const id = uuidv4();
    const now = new Date();
    
    const document: Document = {
      id,
      title: documentData.title,
      content: documentData.content,
      author: documentData.author,
      category: documentData.category,
      tags: documentData.tags || [],
      metadata: documentData.metadata || {},
      createdAt: now,
      updatedAt: now
    };

    this.documents.set(id, document);
    return document;
  }

  /**
   * Get a document by ID
   */
  getDocument(id: string): Document | null {
    return this.documents.get(id) || null;
  }

  /**
   * Get all documents
   */
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Search documents by content
   */
  searchDocuments(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

    for (const document of this.documents.values()) {
      const content = document.content.toLowerCase();
      const title = document.title.toLowerCase();
      
      let relevance = 0;
      const matchedTerms: string[] = [];

      for (const term of queryTerms) {
        const titleMatches = (title.match(new RegExp(term, 'g')) || []).length;
        const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
        
        if (titleMatches > 0 || contentMatches > 0) {
          relevance += titleMatches * 3 + contentMatches; // Title matches weighted more
          matchedTerms.push(term);
        }
      }

      if (relevance > 0) {
        // Create snippet
        const snippet = this.createSnippet(document.content, queryTerms);
        
        results.push({
          documentId: document.id,
          title: document.title,
          relevance,
          snippet,
          matchedTerms
        });
      }
    }

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Update document
   */
  updateDocument(id: string, updates: Partial<Document>): Document | null {
    const document = this.documents.get(id);
    if (!document) return null;

    const updatedDocument: Document = {
      ...document,
      ...updates,
      updatedAt: new Date()
    };

    this.documents.set(id, updatedDocument);
    this.analysisCache.delete(id); // Clear cached analysis
    
    return updatedDocument;
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.analysisCache.delete(id);
    }
    return deleted;
  }

  /**
   * Get documents by category
   */
  getDocumentsByCategory(category: string): Document[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.category === category);
  }

  /**
   * Get documents by author
   */
  getDocumentsByAuthor(author: string): Document[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.author === author);
  }

  /**
   * Get document count
   */
  getDocumentCount(): number {
    return this.documents.size;
  }

  /**
   * Cache analysis results
   */
  cacheAnalysis(documentId: string, analysis: any): void {
    this.analysisCache.set(documentId, analysis);
  }

  /**
   * Get cached analysis
   */
  getCachedAnalysis(documentId: string): any | null {
    return this.analysisCache.get(documentId) || null;
  }

  /**
   * Create snippet for search results
   */
  private createSnippet(content: string, queryTerms: string[]): string {
    const words = content.split(/\s+/);
    const maxLength = 150;
    
    // Find the best position to start the snippet
    let bestPosition = 0;
    let bestScore = 0;
    
    for (let i = 0; i < words.length; i++) {
      let score = 0;
      for (const term of queryTerms) {
        if (words[i].toLowerCase().includes(term)) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestPosition = i;
      }
    }

    // Create snippet around the best position
    const start = Math.max(0, bestPosition - 10);
    const end = Math.min(words.length, bestPosition + 15);
    const snippetWords = words.slice(start, end);
    
    let snippet = snippetWords.join(' ');
    if (snippet.length > maxLength) {
      snippet = snippet.substring(0, maxLength) + '...';
    }

    return snippet;
  }

  /**
   * Initialize with sample documents
   */
  private initializeSampleDocuments(): void {
    const sampleDocs = [
      {
        title: "The Future of AI",
        content: "Artificial Intelligence is transforming our world. From self-driving cars to virtual assistants, AI technologies are becoming increasingly integrated into our daily lives. The potential benefits are enormous, including improved healthcare and enhanced productivity.",
        author: "Dr. Sarah Chen",
        category: "Technology",
        tags: ["AI", "technology", "future"]
      },
      {
        title: "Climate Change Challenge",
        content: "Climate change represents one of the most pressing challenges of our time. Rising global temperatures and extreme weather events are clear indicators of the urgent need for action. We must transition to renewable energy sources.",
        author: "Prof. Michael Rodriguez",
        category: "Environment",
        tags: ["climate", "environment", "sustainability"]
      },
      {
        title: "The Joy of Cooking",
        content: "Cooking has always been my passion. There's something magical about transforming simple ingredients into delicious meals that bring people together. The kitchen is my happy place, where creativity meets tradition.",
        author: "Maria Garcia",
        category: "Lifestyle",
        tags: ["cooking", "food", "family"]
      },
      {
        title: "Digital Privacy",
        content: "Digital privacy has become a critical concern. Our personal information is constantly being collected and analyzed. We must be vigilant about protecting our digital footprint and demand better privacy protections.",
        author: "Alex Thompson",
        category: "Technology",
        tags: ["privacy", "digital", "security"]
      },
      {
        title: "Positive Thinking",
        content: "Positive thinking can have a profound impact on our lives. When we approach challenges with optimism, we're more likely to find solutions and achieve our goals. Research shows that optimistic people tend to be healthier and happier.",
        author: "Dr. Emily Watson",
        category: "Psychology",
        tags: ["positive thinking", "psychology", "wellness"]
      },
      {
        title: "Urban Development",
        content: "Cities are growing rapidly, presenting both opportunities and challenges. Green building practices and smart city technologies can help create more sustainable urban environments. The key is balancing growth with environmental protection.",
        author: "Urban Planning Institute",
        category: "Urban Development",
        tags: ["urban planning", "sustainability", "cities"]
      },
      {
        title: "Storytelling Art",
        content: "Storytelling is one of humanity's oldest forms of communication. From ancient myths to modern novels, stories have the ability to transport us and teach us valuable lessons. Good storytelling requires creativity and empathy.",
        author: "Creative Writing Collective",
        category: "Arts",
        tags: ["storytelling", "writing", "creativity"]
      },
      {
        title: "Mental Health",
        content: "Mental health is just as important as physical health. Millions of people struggle with conditions such as depression and anxiety. It's crucial that we break down barriers to mental health care and create supportive environments.",
        author: "Mental Health Foundation",
        category: "Health",
        tags: ["mental health", "wellness", "awareness"]
      },
      {
        title: "Social Media Evolution",
        content: "Social media has revolutionized how we connect and communicate. While it offers unprecedented opportunities for connection, it also presents challenges such as privacy concerns and misinformation. Understanding its evolution helps us navigate its benefits and drawbacks.",
        author: "Digital Trends Research",
        category: "Technology",
        tags: ["social media", "technology", "communication"]
      },
      {
        title: "Financial Literacy",
        content: "Financial literacy is essential for making informed decisions about money. Understanding concepts like budgeting and investing can help people avoid financial pitfalls. Many people lack basic financial education, which can lead to poor decisions.",
        author: "Financial Education Network",
        category: "Finance",
        tags: ["finance", "education", "money"]
      },
      {
        title: "Sleep Science",
        content: "Sleep is fundamental to our health and well-being. Research shows that sleep affects everything from our immune system to cognitive function. Poor sleep can contribute to various health problems. Prioritizing sleep is crucial for overall health.",
        author: "Sleep Research Institute",
        category: "Health",
        tags: ["sleep", "health", "wellness"]
      },
      {
        title: "Renewable Energy",
        content: "The transition to renewable energy is accelerating worldwide. Solar and wind energy are becoming increasingly cost-effective. This revolution is creating new jobs and helping combat climate change. The future holds promise for sustainable energy.",
        author: "Energy Research Center",
        category: "Environment",
        tags: ["renewable energy", "sustainability", "climate"]
      },
      {
        title: "Learning Psychology",
        content: "Understanding how people learn is crucial for effective education. Research has revealed important insights about memory and motivation. Different people learn in different ways. Active learning and meaningful feedback are among the most effective strategies.",
        author: "Educational Psychology Department",
        category: "Education",
        tags: ["learning", "psychology", "education"]
      },
      {
        title: "Digital Business",
        content: "Digital transformation is reshaping how businesses operate. Companies are adopting new technologies to improve efficiency and enhance customer experiences. Successful transformation requires cultural change and strategic vision.",
        author: "Business Technology Institute",
        category: "Business",
        tags: ["digital transformation", "business", "technology"]
      },
      {
        title: "Biodiversity Importance",
        content: "Biodiversity is essential for the health of our planet. The variety of species provides numerous benefits including clean air and food security. Human activities are causing unprecedented biodiversity loss. Protecting biodiversity is crucial for human well-being.",
        author: "Conservation Biology Society",
        category: "Environment",
        tags: ["biodiversity", "conservation", "environment"]
      }
    ];

    for (const docData of sampleDocs) {
      this.addDocument(docData);
    }
  }
} 