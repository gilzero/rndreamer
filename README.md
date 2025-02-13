

# React Native AI

Full stack framework for building cross-platform mobile AI apps supporting LLM real-time / streaming text and chat UIs, image services and natural language to images with multiple models, and image processing.

![React Native AI](https://i.imgur.com/AOOgBM0.png)



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



## Configuring LLM Models



### On the server

Create a new file in the `server/src/chat` folder that corresponds to the model type you created in the mobile app. You can probably copy and re-use a lot of the streaming code from the other existing paths to get you started.

Next, update `server/src/chat/chatRouter` to use the new route.

