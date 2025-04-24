// app.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { FusionChain, MinimalChainable } from './fusion-chain.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import helmet from 'helmet';
import winston from 'winston';

dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet());
app.use(express.static('public'));

const API_URL = process.env.API_URL;
const MODEL_NAME = process.env.MODEL_NAME;
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Used for file output
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) =>
          `[${timestamp}] ${level}: ${message}`
        )
      )
    }),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

async function callOllama(model, prompt) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    }),
  });

  if (!response.ok) {
    logger.error(`HTTP error! status: ${response.status}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const jsonResponse = await response.json();
  logger.info('Raw API response', { response: jsonResponse });

  return jsonResponse.response || '';
}

async function logParodyStory(story) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const mdFilename = `log_${timestamp}.md`;
  // Write markdown log only
  const mdContent = convertStoryToMarkdown(story);
  await fs.writeFile(path.join(__dirname, '..', 'logs', mdFilename), mdContent);
  logger.info('Parody story logged', { file: mdFilename });
}

// Converts a Minion parody story to markdown format
function convertStoryToMarkdown(story) {
  // Heuristic: Headline is first line, then paragraphs, then bullet points if present
  const lines = story.split(/\r?\n/).filter(Boolean);
  let md = '';
  if (lines.length > 0) {
    md += `# ${lines[0].replace(/^\*+\s*/, '')}\n\n`;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('* ')) {
        // Markdown bullet
        md += `- ${line.slice(2)}\n`;
      } else if (line.length > 0) {
        md += `${line}\n\n`;
      }
    }
  } else {
    md = story;
  }
  return md.trim() + '\n';
}

// Helper to load prompt from file
async function loadPrompt(filename) {
  const promptPath = path.join(__dirname, '..', 'prompt', filename);
  return (await fs.readFile(promptPath, 'utf8')).trim();
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-news', async (req, res) => {
  try {
    const context = { topic: "Current events" };
    // Load prompts and system instructions from prompt directory
    const newsPrompt = await loadPrompt('news_story.prompt.txt');
    const parodyPrompt = await loadPrompt('minion_parody.prompt.txt');
    const systemInstructions = await loadPrompt('system_instructions.txt');
    const htmlFormatPrompt = await loadPrompt('html_format.prompt.txt');
    // Combine system instructions and prompts
    const prompts = [systemInstructions, newsPrompt, parodyPrompt, htmlFormatPrompt];

    const result = await FusionChain.run(
      context,
      [MODEL_NAME],
      callOllama,
      prompts,
      async (outputs) => [outputs[outputs.length - 1], [1]],
      () => MODEL_NAME
    );

    const htmlContent = result.topResponse;
    const parodyStory = result.allPromptResponses[0][2]; // Still markdown version

    // Log the parody story (markdown)
    await logParodyStory(parodyStory);

    res.json({ htmlContent });
  } catch (error) {
    logger.error('Detailed error', { error });
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  }
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});