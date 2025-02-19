/**
 * @fileoverview Core configuration and type definitions for the chat application.
 * @filepath app/src/config.ts
 * 
 * Contains:
 * - Type definitions for messages, models, contexts, and component props
 * - Theme definitions and configuration
 * - Model configurations
 * - Font assets
 * - Storage keys
 * - UI style generators
 */

import { SetStateAction, Dispatch } from 'react'
import { NumberProp } from 'react-native-svg'
import { OpenAIIcon, AnthropicIcon, GeminiIcon } from './components/Icons'

// ============= Core Message Types =============
export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: MessageRole
  content: string
  timestamp?: number
  model?: string
}

export interface ChatState {
  messages: ChatMessage[]
  index: string
}

export interface IOpenAIUserHistory {
  user: string
  assistant: string
  fileIds?: any[]
}

export interface IOpenAIStateWithIndex {
  messages: Array<{
    user: string
    assistant: string
  }>
  index: string
}

export interface IOpenAIMessages {
  role: MessageRole
  content: string
}

// ============= Model & Provider Types =============
export type ModelProvider = 'gpt' | 'claude' | 'gemini'

export interface Model {
  name: string
  label: ModelProvider
  icon: React.ComponentType<any> | null
  displayName: string
}

// ============= Context Types =============
export interface IThemeContext {
  theme: typeof THEMES.light
  themeName: string
  setTheme: Dispatch<SetStateAction<typeof THEMES.light>>
}

export interface IAppContext {
  chatType: Model
  setChatType: Dispatch<SetStateAction<Model>>
  handlePresentModalPress: () => void
  closeModal: () => void
  clearChat: () => void
  clearChatRef: React.MutableRefObject<(() => void) | undefined>
}

// ============= Icon & Visual Types =============
export interface IconProps {
  type?: string;
  theme: Theme;
  size?: NumberProp;
  selected?: boolean;
  [key: string]: any;
}

export interface Theme {
  name: string;
  backgroundColor: string;
  textColor: string;
  tintColor: string;
  tintTextColor: string;
  borderColor: string;
  tabBarActiveTintColor: string;
  tabBarInactiveTintColor: string;
  placeholderTextColor: string;
  secondaryBackgroundColor: string;
  secondaryTextColor: string;
  regularFont: string;
  mediumFont: string;
  semiBoldFont: string;
  boldFont: string;
  lightFont: string;
}

// ============= Configuration =============

/**
 * Application-wide configuration constants
 */
export const APP_CONFIG = {
  // Error messages
  ERRORS: {
    VALIDATION: {
      EMPTY_MESSAGE: 'Message content cannot be empty',
      MESSAGE_TOO_LONG: (limit: number) => `Message exceeds maximum length of ${limit} characters`,
      TOO_MANY_MESSAGES: (limit: number) => `Conversation exceeds maximum of ${limit} messages`,
    },
    CONNECTION: {
      TIMEOUT: 'Connection timeout',
      FAILED: 'Failed to establish connection',
      INVALID_MODEL: (model: string, supported: string[]) => `Unsupported model type: ${model}. Must be one of: ${supported.join(', ')}`,
    },
  },
  // UI Configuration
  UI: {
    // Common spacing values
    SPACING: {
      TINY: 4,
      SMALL: 8,
      MEDIUM: 12,
      LARGE: 16,
      XLARGE: 20,
      XXLARGE: 24,
      HUGE: 32,
      SECTION: 40,
    },
    // Typography scale
    TYPOGRAPHY: {
      SMALL: 13,
      BODY: 15,
      MEDIUM: 16,
      LARGE: 18,
      XLARGE: 20,
      TITLE: 24,
    },
    // Border radius values
    BORDER_RADIUS: {
      SMALL: 4,
      MEDIUM: 8,
      LARGE: 12,
      PILL: 24,
    },
    // Animation timings
    ANIMATION: {
      FAST: 100,
      MEDIUM: 200,
      SLOW: 300,
      VERY_SLOW: 400,
      DEFAULT_DELAY: 100
    },
    // Common component sizes
    SIZES: {
      ICON: {
        SMALL: 18,
        MEDIUM: 22,
        LARGE: 28
      },
      TYPING_INDICATOR: {
        WIDTH: 28,
        HEIGHT: 28,
        DOT_SIZE: 6
      }
    },
    // Shadow configurations
    SHADOW: {
      OFFSET: {
        DEFAULT: { width: 0, height: 4 },
        SMALL: { width: 0, height: 2 },
        INVERTED: { width: 0, height: -4 }
      }
    }
  },
  // SSE Connection settings
  SSE: {
    MAX_RETRIES: 3,
    INITIAL_RETRY_DELAY: 1000, // 1 second
    STREAM_TIMEOUT: 60000, // 1 minute timeout for entire stream
  },
  
  // Message validation limits
  MESSAGE_LIMITS: {
    MAX_MESSAGE_LENGTH: Number(process.env['EXPO_PUBLIC_MAX_MESSAGE_LENGTH'] || 24000),
    MAX_MESSAGES_IN_CONTEXT: Number(process.env['EXPO_PUBLIC_MAX_MESSAGES_IN_CONTEXT'] || 50),
    MIN_MESSAGE_LENGTH: Number(process.env['EXPO_PUBLIC_MIN_MESSAGE_LENGTH'] || 1)
  },

  // Local storage keys
  STORAGE_KEYS: {
    THEME: 'theme',
    CHAT_TYPE: 'chatType'
  }
} as const;

/**
 * API domain configuration based on environment.
 */
export const DOMAIN = process.env['EXPO_PUBLIC_ENV'] === 'DEVELOPMENT' ?
  process.env['EXPO_PUBLIC_DEV_API_URL'] :
  process.env['EXPO_PUBLIC_PROD_API_URL']

/**
 * Helper function to create model configurations
 */
function createModel(
  name: string, 
  label: ModelProvider, 
  displayName: string, 
  icon: React.ComponentType<any>
): Model {
  return { name, label, icon, displayName }
}

/**
 * AI model configurations for supported providers.
 */
export const MODELS: Record<ModelProvider, Model> = {
  gpt: createModel('gpt-4o', 'gpt', 'GPT-4', OpenAIIcon),
  claude: createModel('claude-3-5-sonnet-latest', 'claude', 'Claude', AnthropicIcon),
  gemini: createModel('gemini-2.0-flash', 'gemini', 'Gemini', GeminiIcon)
}

// ============= Theme Configuration =============
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
} & typeof fontStyles;

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
    ...dark,
    name: 'Miami',
    label: 'miami',
    backgroundColor: '#231F20',
    tintColor: colors.lightPink,
    tintTextColor: '#231F20',
    tabBarActiveTintColor: colors.lightPink,
  },
  vercel: {
    ...fontStyles,
    ...dark,
    name: 'Vercel',
    label: 'vercel',
    backgroundColor: colors.black,
    tintColor: '#171717',
    tintTextColor: colors.white,
    tabBarActiveTintColor: colors.white,
    tabBarInactiveTintColor: colors.lightWhite,
  }
}

// ============= UI Style Generators =============
export function getBottomSheetStyles(theme: typeof THEMES.light) {
  return {
    handleIndicator: {
      backgroundColor: theme.mutedForegroundColor,
      width: 40,
    },
    handle: {
      backgroundColor: theme.backgroundColor,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
    },
    background: {
      backgroundColor: theme.backgroundColor,
      borderColor: theme.borderColor,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
  }
}
