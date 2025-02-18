import { Model, ModelProvider } from '../../types';

/**
 * Mapping of model keywords to their respective providers
 */
const MODEL_PROVIDER_MAP: Record<string, ModelProvider> = {
  'gpt': 'gpt',
  'gemini': 'gemini',
  'claude': 'claude'
} as const;

export function getChatType(type: Model): ModelProvider {
  const label = type.label.toLowerCase();
  
  for (const [keyword, provider] of Object.entries(MODEL_PROVIDER_MAP)) {
    if (label.includes(keyword)) return provider;
  }
  
  const supportedModels = Object.keys(MODEL_PROVIDER_MAP).join(', ');
  throw new Error(`Unsupported model type: ${type.label}. Must be one of: ${supportedModels}`);
} 