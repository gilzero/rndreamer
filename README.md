

# React Native AI (Simplified)

Full stack framework for building cross-platform mobile AI apps supporting LLM real-time / streaming text and chat UIs, image services and natural language to images with multiple models, and image processing.

 



## Features

- LLM support for [OpenAI](https://openai.com/) ChatGPT, [Anthropic](https://anthropic.com) Claude, [Gemini](https://makersuite.google.com)
- Real-time / streaming responses from all providers
- Server proxy to easily enable authentication and authorization with auth provider of choice.


## Usage

### Running the app

Change into the app directory and run:

```sh
npm start
```

### Running the server

Change into the server directory and run:

```sh
npm run dev
```

### Environment variables

The server environment variables are available in `server/.env.example`. If already not present, update this file name to `.env` and configure server environment variables.


## Dev Notes

Use only npm. Remove Bun and Yarn.

When forking the project, perform a clean install.
Delete the node_modules folder before reinstalling dependencies.
Delete the .expo folder before reinstalling dependencies.
Delete the dist folder before reinstalling dependencies.
Delete the web-build folder before reinstalling dependencies.
Delete lock files before reinstalling dependencies.

one liner command to clean install:

```sh
cd app
rm -rf node_modules .expo dist web-build package-lock.json yarn.lock && npm install
```

Navigate to the app directory:
```sh
cd app
```

Install metro-config:
```sh
npm install metro-config
``` 



## Roadmap

- [x] Add refactor with LangChain
- [ ] Add support for [Groq](https://groq.com)
- [ ] Add reasoning models
- [ ] Add web models (perplexity)
- [ ] Add dreamer watch model
- [ ] ...

