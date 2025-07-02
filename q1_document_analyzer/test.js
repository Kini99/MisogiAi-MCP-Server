#!/usr/bin/env node

// Simple test script to verify the MCP server functionality
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, 'dist', 'index.js');

if (!existsSync(distPath)) {
  console.error('❌ Build output not found. Please run "npm run build" first.');
  process.exit(1);
}

console.log('🧪 Testing MCP Document Analyzer Server...\n');

// Test the server by sending MCP requests
async function testServer() {
  const serverPath = distPath;
  
  try {
    // Start the server
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Test data
    const testRequests = [
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'list_documents',
          arguments: { limit: 5 }
        }
      }
    ];

    let responseCount = 0;

    server.stdout.on('data', (data) => {
      try {
        const response = JSON.parse(data.toString());
        console.log(`✅ Response ${++responseCount}:`, JSON.stringify(response, null, 2));
        
        if (responseCount >= 2) {
          console.log('\n🎉 Server test completed successfully!');
          server.kill();
          process.exit(0);
        }
      } catch (error) {
        console.log('Raw output:', data.toString());
      }
    });

    server.stderr.on('data', (data) => {
      console.log('Server stderr:', data.toString());
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    // Send test requests
    setTimeout(() => {
      testRequests.forEach((request, index) => {
        setTimeout(() => {
          server.stdin.write(JSON.stringify(request) + '\n');
        }, index * 1000);
      });
    }, 1000);

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ Test timeout');
      server.kill();
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testServer(); 