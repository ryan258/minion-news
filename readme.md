# AI Minion News Generator

This project uses the Ollama API to generate parody news stories in the style of Minions from Despicable Me. It takes current events, creates a news story, then transforms it into a humorous Minion-style parody.

## Features

- Generates a real news story about current events
- Transforms the news into a Minion-style parody
- Converts the parody into HTML format
- Provides a simple web interface to generate and display stories
- Logs all generated parody stories for future reference

## Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)
- Ollama API running locally or accessible via network

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/ai-minion-news-generator.git
   cd ai-minion-news-generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   API_URL=http://localhost:11434/api/generate
   MODEL_NAME=llama3.1:latest
   PORT=3000
   ```
   Adjust the `API_URL` and `MODEL_NAME` as needed for your Ollama setup.

4. Create a `logs` directory in the project root:
   ```
   mkdir logs
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```

2. Open a web browser and navigate to `http://localhost:3000`

3. Click the "Generate News Story" button to create a new Minion-style parody news article

4. Check the `logs` directory for saved parody stories

## Project Structure

- `app.js`: Main application file, sets up the Express server and handles API routes
- `fusion-chain.js`: Implements the FusionChain and MinimalChainable classes for multi-step AI processing
- `public/index.html`: Frontend HTML file for the web interface
- `logs/`: Directory containing logged parody stories

## How It Works

1. The app generates a real news story about current events using Ollama
2. It then transforms this story into a Minion-style parody
3. The parody story is logged to a file in the `logs` directory
4. The parody is converted into HTML format for display
5. The frontend displays the generated HTML content and provides a button to copy it

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.