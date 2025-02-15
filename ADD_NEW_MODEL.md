# Adding a New Model Provider

This guide outlines the process of adding a new AI model provider to the application.

## File Structure Overview

```
📦 Project Root
├── 📂 app
│   ├── 📂 src
│   │   ├── 📂 components
│   │   │   ├── [Provider]Icon.tsx       # New provider icon
│   │   │   ├── ChatModelModal.tsx       # Update with new model
│   │   ├── 📂 screens
│   │   │   ├── chat.tsx                 # Update chat interface
│   │   │   ├── settings.tsx             # Update settings
│   │   ├── context.tsx                  # Update app context
│   │   ├── theme.ts                     # Add theme support
│   │   └── services
│   │       └── chatService.ts           # Add provider service
│   ├── constants.ts                     # Add provider constants
│   └── types.ts                         # Add provider types
└── 📂 server
    ├── 📂 src
    │   ├── 📂 chat
    │   │   ├── [provider].ts            # New provider handler
    │   │   └── chatRouter.ts            # Update router
    │   ├── 📂 config
    │   │   └── rateLimit.ts             # Add rate limits
    │   └── 📂 services
    │       └── langchainService.ts      # Update LangChain
    └── .env.example                     # Add env variables
```

## Frontend Changes

### 1. Components (`/app/src/components/`)

#### New Files:
- `[Provider]Icon.tsx`: Provider icon component

#### Update Existing:
- `ChatModelModal.tsx`: Add provider to model selection
  - Add icon
  - Configure selection logic
  - Add provider capabilities

### 2. Core Configuration

#### Update:
- `constants.ts`:
  ```typescript
  {
    name: '[default-model-name]',
    label: '[provider]',
    icon: [Provider]Icon,
    displayName: '[Display Name]'
  }
  ```
- `types.ts`:
  ```typescript
  export type ModelProvider = 'existing' | '[provider]';
  ```

### 3. Screens (`/app/src/screens/`)

#### Update:
- `settings.tsx`:
  - Add provider options
  - Configure settings
  - Update UI
- `chat.tsx`:
  - Add message handling
  - Configure streaming
  - Update UI elements

### 4. Services and Context

#### Update:
- `context.tsx`: Add provider context
- `theme.ts`: Add provider theming
- `chatService.ts`: Add provider API integration

## Backend Changes

### 1. Chat Handler (`/server/src/chat/`)

#### New Files:
- `[provider].ts`: Provider route handler

#### Update Existing:
- `chatRouter.ts`:
  ```typescript
  import { [provider] } from './[provider]';
  router.post('/[provider]', [provider]Limiter, [provider]);
  ```

### 2. Configuration (`/server/src/config/`)

#### Update:
- `rateLimit.ts`:
  ```typescript
  export const RATE_LIMITS = {
    [PROVIDER]_MAX: Number(process.env.[PROVIDER]_RATE_LIMIT_MAX || 200),
  };
  ```

### 3. Environment Variables

Add to `.env.example` and `.env`:
```bash
# Provider API Configuration
[PROVIDER]_API_KEY=""
[PROVIDER]_MODEL_DEFAULT="[default-model]"
[PROVIDER]_MODEL_FALLBACK="[fallback-model]"

# Provider Settings
[PROVIDER]_TEMPERATURE=0.3
[PROVIDER]_MAX_TOKENS=8192

# Rate Limiting
[PROVIDER]_RATE_LIMIT_MAX=200
```

## Integration Checklist

### Frontend
- [ ] Create provider icon
- [ ] Add provider to constants
- [ ] Update TypeScript types
- [ ] Configure model selection
- [ ] Update settings screen
- [ ] Implement chat features
- [ ] Add theme support
- [ ] Configure service layer

### Backend
- [ ] Create provider handler
- [ ] Update router
- [ ] Configure rate limiting
- [ ] Add environment variables
- [ ] Update LangChain service
- [ ] Implement error handling

### Testing
- [ ] Provider API connection
- [ ] Model switching
- [ ] Settings functionality
- [ ] Streaming responses
- [ ] Rate limiting
- [ ] Error scenarios
- [ ] UI/UX flow
- [ ] Theme compatibility

## Best Practices

1. **Consistency**
   - Follow existing naming conventions
   - Match current UI patterns
   - Use consistent error handling

2. **Type Safety**
   - Add proper TypeScript types
   - Update existing type definitions
   - Validate API responses

3. **Error Handling**
   - Implement proper error states
   - Add user feedback
   - Handle edge cases

4. **Performance**
   - Add loading states
   - Optimize state updates
   - Configure proper caching

5. **Documentation**
   - Update API documentation
   - Add code comments
   - Update README

## Questions?

For questions or concerns, please:
1. Check existing implementations
2. Review the codebase
3. Open an issue
4. Start a discussion

---
Last updated: February 2025