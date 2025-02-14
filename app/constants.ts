import { AnthropicIcon } from './src/components/AnthropicIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { Model, ModelProvider } from './types'

export const DOMAIN = process.env.EXPO_PUBLIC_ENV === 'DEVELOPMENT' ?
  process.env.EXPO_PUBLIC_DEV_API_URL :
  process.env.EXPO_PUBLIC_PROD_API_URL

export const MODELS: Record<ModelProvider, Model> = {
  gpt: { name: 'GPT-4', label: 'gpt' as ModelProvider, icon: OpenAIIcon },
  claude: { name: 'Claude', label: 'claude' as ModelProvider, icon: AnthropicIcon },
  gemini: { name: 'Gemini', label: 'gemini' as ModelProvider, icon: GeminiIcon }
}