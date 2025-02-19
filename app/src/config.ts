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

// ============= Configuration Types =============
// Network Configuration Types
export type NetworkTimeouts = typeof APP_CONFIG.NETWORK.TIMEOUTS;
export type NetworkRetry = typeof APP_CONFIG.NETWORK.RETRY;
export type NetworkRateLimits = typeof APP_CONFIG.NETWORK.RATE_LIMITS;

// Validation Configuration Types
export type ValidationMessages = typeof APP_CONFIG.VALIDATION.MESSAGES;
export type ValidationInputs = typeof APP_CONFIG.VALIDATION.INPUTS;

// Cache Configuration Types
export type CacheConfig = typeof APP_CONFIG.CACHE;

// Error Configuration Types
export type ValidationErrors = typeof APP_CONFIG.ERRORS.VALIDATION;
export type ConnectionErrors = typeof APP_CONFIG.ERRORS.CONNECTION;
export type CacheErrors = typeof APP_CONFIG.ERRORS.CACHE;

// Complete Configuration Type
export type AppConfig = typeof APP_CONFIG;

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
  /**
   * Network and API Configuration
   * 
   * Settings for API endpoints, timeouts, retries, and other network-related configurations
   */
  NETWORK: {
    // Timeouts in milliseconds
    TIMEOUTS: {
      API_REQUEST: 30000,    // 30 seconds for general API requests
      STREAM: 60000,         // 1 minute for streaming responses
      CONNECTION: 10000,     // 10 seconds for initial connection
      SOCKET: 5000,          // 5 seconds for websocket operations
    },
    // Retry configuration
    RETRY: {
      MAX_ATTEMPTS: 3,      // Maximum number of retry attempts
      BACKOFF_MS: 1000,     // Base delay between retries in ms
      MAX_BACKOFF_MS: 5000, // Maximum delay between retries
    },
    // Rate limiting
    RATE_LIMITS: {
      REQUESTS_PER_MINUTE: 60,
      CONCURRENT_STREAMS: 3,
    },
  },

  /**
   * Data Validation Configuration
   * 
   * Constants for input validation, data limits, and sanitization
   */
  VALIDATION: {
    MESSAGES: {
      MAX_LENGTH: 4000,     // Maximum characters per message
      MIN_LENGTH: 1,        // Minimum characters per message
      MAX_HISTORY: 100,     // Maximum messages in conversation history
    },
    INPUTS: {
      MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
      ALLOWED_FILE_TYPES: ['txt', 'pdf', 'doc', 'docx'],
    },
  },

  /**
   * Cache Configuration
   * 
   * Settings for client-side caching behavior
   */
  CACHE: {
    MESSAGE_TTL: 24 * 60 * 60 * 1000,  // 24 hours in milliseconds
    MAX_CACHE_SIZE: 50 * 1024 * 1024,   // 50MB in bytes
    INVALIDATION_INTERVAL: 60 * 60 * 1000, // 1 hour in milliseconds
  },

  /**
   * Error Messages
   * 
   * Centralized error messages for consistent error handling
   */
  ERRORS: {
    VALIDATION: {
      EMPTY_MESSAGE: 'Message content cannot be empty',
      MESSAGE_TOO_LONG: (limit: number) => `Message exceeds maximum length of ${limit} characters`,
      TOO_MANY_MESSAGES: (limit: number) => `Conversation exceeds maximum of ${limit} messages`,
      INVALID_FILE_TYPE: (types: string[]) => `File type not supported. Allowed types: ${types.join(', ')}`,
      FILE_TOO_LARGE: (maxSize: number) => `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
    },
    CONNECTION: {
      TIMEOUT: 'Connection timeout',
      FAILED: 'Failed to establish connection',
      INVALID_MODEL: (model: string, supported: string[]) => `Unsupported model type: ${model}. Must be one of: ${supported.join(', ')}`,
      RATE_LIMITED: 'Too many requests. Please try again later.',
      CONCURRENT_LIMIT: 'Maximum number of concurrent streams reached',
    },
    CACHE: {
      STORAGE_FULL: 'Local storage is full. Please clear some space.',
      INVALID_CACHE: 'Cache data is corrupted or invalid',
    },
  },
  /**
   * UI Configuration System
   * 
   * A centralized configuration system for consistent UI styling across the application.
   * All UI-related constants should be defined here to maintain a single source of truth.
   * 
   * Usage:
   * ```typescript
   * import { APP_CONFIG } from '../config';
   * 
   * // Spacing
   * marginBottom: APP_CONFIG.UI.SPACING.MEDIUM
   * 
   * // Typography
   * fontSize: APP_CONFIG.UI.TYPOGRAPHY.BODY
   * 
   * // Animations
   * duration: APP_CONFIG.UI.ANIMATION.DURATION.MEDIUM
   * ```
   */
  UI: {
    /**
     * Spacing Scale
     * 
     * Consistent spacing values for margins, padding, and layout.
     * Uses an 8-point grid system for harmonious spacing:
     * - TINY: 4px (half-step)
     * - SMALL: 8px (base)
     * - MEDIUM: 12px (1.5x)
     * - LARGE: 16px (2x)
     * - XLARGE: 24px (3x)
     * - XXLARGE: 32px (4x)
     */
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
    /**
     * Typography Scale
     * 
     * Standardized font sizes for consistent text hierarchy:
     * - SMALL: 13px (captions, helper text)
     * - BODY: 15px (default body text)
     * - MEDIUM: 16px (emphasized body)
     * - LARGE: 18px (subtitles)
     * - XLARGE: 20px (small headers)
     * - TITLE: 24px (main headers)
     */
    TYPOGRAPHY: {
      SMALL: 13,
      BODY: 15,
      MEDIUM: 16,
      LARGE: 18,
      XLARGE: 20,
      TITLE: 24,
    },
    /**
     * Border Radius Scale
     * 
     * Consistent border radius values for UI elements:
     * - SMALL: 4px (subtle rounding)
     * - MEDIUM: 8px (default rounding)
     * - LARGE: 12px (emphasized rounding)
     * - PILL: 24px (pill-shaped elements)
     */
    BORDER_RADIUS: {
      SMALL: 4,
      MEDIUM: 8,
      LARGE: 12,
      PILL: 24,
    },
    /**
     * Animation Configuration
     * 
     * Standardized animation values for consistent motion design:
     * 
     * DURATION:
     * - FAST: 100ms (micro-interactions)
     * - MEDIUM: 200ms (standard transitions)
     * - SLOW: 300ms (emphasized transitions)
     * - VERY_SLOW: 400ms (major transitions)
     * 
     * DELAY:
     * - DEFAULT: 100ms (standard delay)
     * - LONG: 200ms (emphasized delay)
     * 
     * EASING:
     * - DEFAULT: Basic easing
     * - IN_OUT: Smooth acceleration/deceleration
     * - BOUNCE: Playful bouncy effect
     */
    ANIMATION: {
      DURATION: {
        FAST: 100,
        MEDIUM: 200,
        SLOW: 300,
        VERY_SLOW: 400
      },
      DELAY: {
        DEFAULT: 100,
        LONG: 200
      },
      EASING: {
        DEFAULT: 'ease',
        IN_OUT: 'ease-in-out',
        BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    },
    /**
     * Input Component Configuration
     * 
     * Standard styling for input elements:
     * - BORDER_RADIUS: Consistent with design system
     * - PADDING: Comfortable spacing for text input
     * - HEIGHT: Standard input height for good touch targets
     */
    INPUT: {
      BORDER_RADIUS: 24,
      PADDING: {
        VERTICAL: 5,
        HORIZONTAL: 12
      },
      HEIGHT: 44
    },
    /**
     * Component Size Configurations
     * 
     * Standardized sizes for various UI components:
     * 
     * ICON:
     * - SMALL: 16px (inline icons)
     * - MEDIUM: 20px (default icons)
     * - LARGE: 24px (emphasized icons)
     * 
     * TYPING_INDICATOR:
     * - WIDTH/HEIGHT: Standard dimensions
     * - DOT_SIZE: Size of typing animation dots
     */
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

// ============= Settings Configuration =============
export const SETTINGS_CONFIG = {
  MODEL_PARAMS: {
    TEMPERATURE: {
      DEFAULT: 0.7,
      MIN: 0,
      MAX: 1,
      STEP: 0.01
    },
    MAX_TOKENS: {
      DEFAULT: 2000,
      MIN: 100,
      MAX: 8192,
      STEP: 100
    }
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
