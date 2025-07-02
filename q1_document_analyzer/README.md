# MCP Document Analyzer Server

A comprehensive Model Context Protocol (MCP) server that provides advanced document analysis capabilities including sentiment analysis, keyword extraction, readability scoring, and document management.

## Features

### 📊 Document Analysis
- **Sentiment Analysis**: Analyze text for positive, negative, or neutral sentiment
- **Keyword Extraction**: Extract top keywords with frequency and importance scores
- **Readability Scoring**: Calculate Flesch-Kincaid readability scores and grade levels
- **Basic Statistics**: Word count, sentence count, paragraph count, and vocabulary diversity

### 📚 Document Management
- **Document Storage**: Store and manage documents with metadata
- **Search Functionality**: Search documents by content with relevance scoring
- **Document Listing**: List and browse available documents
- **Caching**: Intelligent caching of analysis results for performance

### 🔧 MCP Tools
The server provides the following MCP tools:

1. **`analyze_document`** - Complete document analysis
2. **`get_sentiment`** - Sentiment analysis for any text
3. **`extract_keywords`** - Keyword extraction with configurable limits
4. **`add_document`** - Add new documents to storage
5. **`search_documents`** - Search documents by content
6. **`list_documents`** - List available documents
7. **`get_document`** - Retrieve specific documents

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup
1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd q1_document_analyzer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Running the Server
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

### Integration with Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Developer → Edit Config
3. Add the following configuration:

```json
{
  "mcpServers": {
    "document-analyzer": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

4. Restart Claude Desktop
5. The document analyzer tools will be available in Claude

## Sample Documents

The server comes pre-loaded with 15+ sample documents covering various topics:
- Technology (AI, Digital Privacy, Social Media)
- Environment (Climate Change, Renewable Energy, Biodiversity)
- Health (Mental Health, Sleep Science)
- Business (Digital Transformation)
- Education (Learning Psychology, Financial Literacy)
- Arts (Storytelling)
- Lifestyle (Cooking)
- And more...

## API Reference

### analyze_document
Performs complete analysis of a document.

**Parameters:**
- `document_id` (string, required): The ID of the document to analyze

**Returns:** Complete analysis including sentiment, keywords, readability, and statistics

### get_sentiment
Analyzes sentiment of any text.

**Parameters:**
- `text` (string, required): The text to analyze

**Returns:** Sentiment classification, score, and word lists

### extract_keywords
Extracts top keywords from text.

**Parameters:**
- `text` (string, required): The text to analyze
- `limit` (number, optional): Maximum keywords to return (default: 10)

**Returns:** List of keywords with frequency and importance scores

### add_document
Adds a new document to storage.

**Parameters:**
- `title` (string, required): Document title
- `content` (string, required): Document content
- `author` (string, optional): Document author
- `category` (string, optional): Document category
- `tags` (array, optional): Document tags

**Returns:** Document details with generated ID

### search_documents
Searches documents by content.

**Parameters:**
- `query` (string, required): Search query

**Returns:** List of matching documents with relevance scores

### list_documents
Lists available documents.

**Parameters:**
- `limit` (number, optional): Maximum documents to return (default: 20)

**Returns:** List of documents with basic information

### get_document
Retrieves a specific document.

**Parameters:**
- `document_id` (string, required): Document ID

**Returns:** Complete document details and content

## Technical Details

### Architecture
- **TypeScript**: Full type safety and modern JavaScript features
- **MCP SDK**: Official Model Context Protocol SDK for server implementation
- **Natural Language Processing**: Uses `natural` library for text processing
- **Sentiment Analysis**: Uses `sentiment` library for sentiment scoring
- **Readability**: Custom Flesch-Kincaid implementation

### Performance Features
- **Caching**: Analysis results are cached to avoid recomputation
- **Efficient Search**: Optimized search algorithm with relevance scoring
- **Memory Management**: Efficient data structures for document storage

### Dependencies
- `@modelcontextprotocol/sdk`: MCP server implementation
- `natural`: Natural language processing utilities
- `sentiment`: Sentiment analysis library
- `uuid`: Unique ID generation
- `typescript`: Type safety and compilation

## Examples

### Using with Claude

Once integrated with Claude Desktop, you can ask questions like:

- "Analyze the sentiment of this text: 'I love this new technology!'"
- "What are the top keywords in the document about AI?"
- "Search for documents about climate change"
- "Add a new document about machine learning"
- "Show me all available documents"
- "What's the readability score of the technology document?"

### Sample Analysis Output

```
Document Analysis Results for "The Future of AI"

📊 BASIC STATISTICS:
• Word Count: 45
• Sentence Count: 3
• Paragraph Count: 1
• Average Words per Sentence: 15.0
• Unique Words: 35
• Vocabulary Diversity: 0.778

😊 SENTIMENT ANALYSIS:
• Classification: positive
• Score: 3
• Comparative Score: 0.067
• Positive Words: transforming, integrated, benefits, improved, enhanced
• Negative Words: None

🔑 TOP KEYWORDS:
1. "artificial" (frequency: 1, importance: 9.00)
2. "intelligence" (frequency: 1, importance: 12.00)
3. "technologies" (frequency: 1, importance: 12.00)
4. "healthcare" (frequency: 1, importance: 10.00)
5. "productivity" (frequency: 1, importance: 12.00)

📖 READABILITY:
• Flesch-Kincaid Score: 65.2
• Grade Level: 8th-9th grade
• Complexity: medium

📅 Analysis Date: 2024-01-15T10:30:00.000Z
```
      