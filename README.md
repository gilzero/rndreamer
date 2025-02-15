# AI Chat Application - React Native AI (Simplified)

A modern, scalable chat application that provides a unified interface for multiple AI providers including OpenAI's GPT, Anthropic's Claude, and Google's Gemini models.

## Features

- 🤖 Multi-provider support (GPT, Claude, Gemini)
- 🔄 Real-time streaming responses
- ⚡ High-performance Express backend
- 🛡️ Built-in rate limiting and validation
- 🎨 Modern React Native frontend
- 📱 Cross-platform support (iOS & Android)
- 🔀 Metamorph™ - Smart Model Switching
  - Seamlessly switch between AI models mid-conversation
  - Choose to continue the current chat or start fresh
  - Visual indicators show which model generated each response
  - Perfect for comparing model responses or finding the best model for your task

## Metamorph™ - Smart Model Switching

The application features an innovative approach to switching between AI models:

1. **Flexible Conversation Flow**
   - Switch models at any time during a chat
   - Choose between continuing the current conversation or starting fresh
   - Preserve context when comparing different models' responses

2. **Clear Visual Feedback**
   - Each AI response is labeled with its model source
   - Easy to track which model generated which response
   - Helps understand model capabilities and differences

3. **User-Friendly Interface**
   - Simple model selection through a bottom sheet modal
   - Clear confirmation dialog with multiple options
   - Smooth transitions between models

4. **Use Cases**
   - Compare how different models handle the same prompt
   - Find the best model for specific types of questions
   - Seamlessly switch when one model is better suited for the current topic
   - Educational purposes: understand different models' capabilities

## Prerequisites

- Node.js >= 16
- npm
- React Native development environment setup
- API keys for the AI providers you plan to use

## Project Structure

```
.
├── app/                  # React Native application
│   ├── src/             # Source files
│   │   ├── screens/     # Screen components
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── ...
└── server/              # Express backend
    ├── src/
    │   ├── chat/        # Chat route handlers
    │   ├── config/      # Configuration
    │   └── services/    # Business logic
    └── ...
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install app dependencies
cd ../app
npm install
```

3. Configure environment variables:
```bash
# Server configuration
cd server
cp .env.example .env

# App configuration
cd ../app
cp .env.example .env
```

## Configuration

### Server Environment Variables

#### API Keys
```env
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-gemini-api-key
```

#### Model Configuration
```env
# OpenAI Models
OPENAI_MODEL_DEFAULT="gpt-4o"
OPENAI_MODEL_FALLBACK="gpt-4o-mini"

# Anthropic Models
ANTHROPIC_MODEL_DEFAULT="claude-3-5-sonnet-latest"
ANTHROPIC_MODEL_FALLBACK="claude-3-5-haiku-latest"

# Gemini Models
GEMINI_MODEL_DEFAULT="gemini-2.0-flash"
GEMINI_MODEL_FALLBACK="gemini-1.5-pro"
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=3600000     # 1 hour in milliseconds
RATE_LIMIT_MAX_REQUESTS=500      # 500 total requests per hour
GPT_RATE_LIMIT_MAX=200          # 200 GPT requests per hour
CLAUDE_RATE_LIMIT_MAX=200       # 200 Claude requests per hour
GEMINI_RATE_LIMIT_MAX=200       # 200 Gemini requests per hour
```

## Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the React Native app:
```bash
cd app
npm start
```

3. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android
```

## API Endpoints

### Chat Endpoints

- `POST /chat/gpt` - OpenAI GPT chat completion
- `POST /chat/claude` - Anthropic Claude chat completion
- `POST /chat/gemini` - Google Gemini chat completion

Request body format:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your message here"
    }
  ],
  "model": "optional-model-name"
}
```

## Rate Limiting

The application implements rate limiting to prevent abuse and ensure fair usage:

- Global limit: 500 requests per hour
- Per-provider limits: 200 requests per hour each
- Configurable through environment variables

## Roadmap

- [x] Add refactor with LangChain
- [ ] Add support for [Groq](https://groq.com)
- [ ] Add reasoning models
- [ ] Add web models (perplexity)
- [ ] Add dreamer watch model
- [ ] ...

## Dev Notes

(If install fails, perform a clean install / purge)

Use only npm. Remove Bun and Yarn.

When forking the project, perform a clean install. 
Delete the node_modules folder before reinstalling dependencies. 
Delete the .expo folder before reinstalling dependencies. 
Delete the dist folder before reinstalling dependencies. 
Delete the web-build folder before reinstalling dependencies. 
Delete lock files before reinstalling dependencies.

one liner command to clean install:

```bash
cd app
rm -rf node_modules .expo dist web-build package-lock.json yarn.lock && npm install
```

Navigate to the app directory:
Install metro-config:

```bash
cd app
npm install metro-config
```
