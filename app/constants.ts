/**
 * @fileoverview Application-wide constants and configuration values.
 * @file-path app/constants.ts
 * 
 * This file defines core configuration constants used throughout the application,
 * including API endpoints and model configurations. It serves as a central
 * source of truth for application-wide settings.
 * 
 * Key Features:
 * - Environment-based API domain configuration
 * - AI model definitions and configurations
 * - Provider-specific model settings
 * 
 * @see {@link app/types.ts} for type definitions
 * @see {@link app/src/components} for model-specific icons
 */

import { AnthropicIcon } from './src/components/AnthropicIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { Model, ModelProvider } from './types'

/**
 * API domain configuration based on environment.
 * Switches between development and production URLs based on EXPO_PUBLIC_ENV.
 * 
 * @constant
 * @type {string}
 * 
 * Usage:
 * ```typescript
 * import { DOMAIN } from '../constants'
 * const apiUrl = `${DOMAIN}/api/chat`
 * ```
 */
export const DOMAIN = process.env['EXPO_PUBLIC_ENV'] === 'DEVELOPMENT' ?
  process.env['EXPO_PUBLIC_DEV_API_URL'] :
  process.env['EXPO_PUBLIC_PROD_API_URL']

/**
 * AI model configurations for supported providers.
 * Maps each provider to its specific model configuration.
 * Model names MUST match exactly with backend environment configuration.
 * 
 * Features for each model:
 * - name: Backend model identifier
 * - label: Provider type for routing
 * - icon: Visual representation component
 * - displayName: User-friendly name for UI
 * 
 * @constant
 * @type {Record<ModelProvider, Model>}
 * 
 * Usage:
 * ```typescript
 * import { MODELS } from '../constants'
 * const gptModel = MODELS.gpt
 * const modelName = gptModel.name // 'gpt-4o'
 * ```
 */
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