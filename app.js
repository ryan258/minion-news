// app.js
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { FusionChain, MinimalChainable } from './fusion-chain.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const API_URL = process.env.API_URL;
const MODEL_NAME = process.env.MODEL_NAME;
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const jsonResponse = await response.json();
  console.log('Raw API response:', JSON.stringify(jsonResponse, null, 2));

  return jsonResponse.response || '';
}

async function logParodyStory(story) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `log_${timestamp}.txt`;
  await fs.writeFile(path.join(__dirname, 'logs', filename), story);
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-news', async (req, res) => {
  try {
    const context = { topic: "Current events" };
    const prompts = [
      "Generate a brief news story about a recent {{topic}} event. Include a headline and a short paragraph. Do not include any meta-commentary or instructions.",
      "Using the following news story as inspiration, create a parody version in the style of the Minions from Despicable Me. Include silly words, banana references, and slapstick humor. Here's the original story: {{output[-1]}}",
      "Convert the following Minion parody news story into HTML format. Use appropriate HTML tags for the headline and paragraph. Also include a 'Read More' link (use '#' as the href). Here's the story to convert: {{output[-1]}}"
    ];

    const result = await FusionChain.run(
      context,
      [MODEL_NAME],
      callOllama,
      prompts,
      async (outputs) => [outputs[outputs.length - 1], [1]],
      () => MODEL_NAME
    );

    const htmlContent = result.topResponse;
    const parodyStory = result.allPromptResponses[0][1]; // Get the parody story before HTML conversion

    // Log the parody story
    await logParodyStory(parodyStory);

    res.json({ htmlContent });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});