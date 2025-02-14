import { AnthropicIcon } from './src/components/AnthropicIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { Model, ModelProvider } from './types'

export const DOMAIN = process.env.EXPO_PUBLIC_ENV === 'DEVELOPMENT' ?
  process.env.EXPO_PUBLIC_DEV_API_URL :
  process.env.EXPO_PUBLIC_PROD_API_URL

// Model names must match exactly with backend environment configuration
export const MODELS: Record<ModelProvider, Model> = {
  gpt: { 
    name: 'gpt-4o',  // Matches OPENAI_MODEL_DEFAULT
    label: 'gpt' as ModelProvider, 
    icon: OpenAIIcon,
    displayName: 'GPT-4'  // For display purposes only
  },
  claude: { 
    name: 'claude-3-5-sonnet-latest',  // Matches ANTHROPIC_MODEL_DEFAULT
    label: 'claude' as ModelProvider, 
    icon: AnthropicIcon,
    displayName: 'Claude'  // For display purposes only
  },
  gemini: { 
    name: 'gemini-2.0-flash',  // Matches GEMINI_MODEL_DEFAULT
    label: 'gemini' as ModelProvider, 
    icon: GeminiIcon,
    displayName: 'Gemini'  // For display purposes only
  }
}