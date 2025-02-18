/**
 * @fileoverview Application-wide constants and configuration.
 * @filepath app/constants.ts
 * 
 * Contains:
 * - Theme definitions and configuration
 * - Model configurations
 * - Font assets
 * - Storage keys
 * - UI style generators
 * 
 * @see {@link ./types.ts} for type definitions
 * @see {@link ./App.tsx} for context providers
 */

import { Model, ModelProvider } from './types'
import { Icon } from './src/components/Icons'  // Use as placeholder

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
    name: 'gpt-4o',
    label: 'gpt' as ModelProvider, 
    icon: null,  // Set initially as null
    displayName: 'GPT-4'
  },
  claude: { 
    name: 'claude-3-5-sonnet-latest',
    label: 'claude' as ModelProvider, 
    icon: null,
    displayName: 'Claude'
  },
  gemini: { 
    name: 'gemini-2.0-flash',
    label: 'gemini' as ModelProvider, 
    icon: null,
    displayName: 'Gemini'
  }
}

// Update models with icons after Icons are imported
import { OpenAIIcon, AnthropicIcon, GeminiIcon } from './src/components/Icons'
MODELS.gpt.icon = OpenAIIcon
MODELS.claude.icon = AnthropicIcon
MODELS.gemini.icon = GeminiIcon

/**
 * Theme Configuration
 */
const colors = {
  white: '#fff',
  black: '#000',
  gray: 'rgba(0, 0, 0, .5)',
  lightWhite: 'rgba(255, 255, 255, .5)',
  blueTintColor: '#0281ff',
  lightPink: '#F7B5CD'
}

/**
 * Font configuration and assets
 */
export const FONTS = {
  'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
  'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
  'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
  'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
  'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
  'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
  'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
  'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
  'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf')
}

const fontStyles = {
  regularFont: 'Geist-Regular',
  lightFont: 'Geist-Light',
  boldFont: 'Geist-Bold',
  mediumFont: 'Geist-Medium',
  blackFont: 'Geist-Black',
  semiBoldFont: 'Geist-SemiBold',
  thinFont: 'Geist-Thin',
  ultraLightFont: 'Geist-UltraLight',
  ultraBlackFont: 'Geist-UltraBlack',
}

type BaseTheme = {
  name: string;
  label: string;
  textColor: string;
  secondaryTextColor: string;
  mutedForegroundColor: string;
  backgroundColor: string;
  placeholderTextColor: string;
  secondaryBackgroundColor: string;
  borderColor: string;
  tintColor: string;
  tintTextColor: string;
  tabBarActiveTintColor: string;
  tabBarInactiveTintColor: string;
  regularFont: string;
  lightFont: string;
  boldFont: string;
  mediumFont: string;
  blackFont: string;
  semiBoldFont: string;
  thinFont: string;
  ultraLightFont: string;
  ultraBlackFont: string;
}

type ThemeType = {
  light: BaseTheme;
  dark: BaseTheme;
  miami: BaseTheme;
  vercel: BaseTheme;
}

// Define dark theme first
const dark: BaseTheme = {
  ...fontStyles,
  name: 'Dark',
  label: 'dark',
  textColor: colors.white,
  secondaryTextColor: colors.black,
  mutedForegroundColor: colors.lightWhite,
  backgroundColor: colors.black,
  placeholderTextColor: colors.lightWhite,
  secondaryBackgroundColor: colors.white,
  borderColor: 'rgba(255, 255, 255, .2)',
  tintColor: colors.blueTintColor,
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.blueTintColor,
  tabBarInactiveTintColor: colors.lightWhite,
} as const

// Then define THEMES using the type
export const THEMES: ThemeType = {
  light: {
    ...fontStyles,
    name: 'Light',
    label: 'light',
    textColor: colors.black,
    secondaryTextColor: colors.white,
    mutedForegroundColor: colors.gray,
    backgroundColor: colors.white,
    placeholderTextColor: colors.gray,
    secondaryBackgroundColor: colors.black,
    borderColor: 'rgba(0, 0, 0, .15)',
    tintColor: colors.blueTintColor,
    tintTextColor: colors.white,
    tabBarActiveTintColor: colors.black,
    tabBarInactiveTintColor: colors.gray,
  },
  dark,
  miami: {
    ...fontStyles,
    ...dark,  // Use dark instead of THEMES.dark
    name: 'Miami',
    label: 'miami',
    backgroundColor: '#231F20',
    tintColor: colors.lightPink,
    tintTextColor: '#231F20',
    tabBarActiveTintColor: colors.lightPink,
  },
  vercel: {
    ...fontStyles,
    ...dark,  // Use dark instead of THEMES.dark
    name: 'Vercel',
    label: 'vercel',
    backgroundColor: colors.black,
    tintColor: '#171717',
    tintTextColor: colors.white,
    tabBarActiveTintColor: colors.white,
    secondaryTextColor: colors.white,
  }
} as const

/**
 * AsyncStorage keys used throughout the application
 */
export const STORAGE_KEYS = {
  CHAT_TYPE: 'rnai-chatType',
  THEME: 'rnai-theme'
}

/**
 * Default bottom sheet styles generator
 */
export const getBottomSheetStyles = (theme: typeof THEMES.light) => ({
  background: {
    paddingHorizontal: 24,
    backgroundColor: theme.backgroundColor
  },
  handle: {
    marginHorizontal: 15,
    backgroundColor: theme.backgroundColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, .3)'
  }
})