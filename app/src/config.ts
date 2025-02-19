/**
 * @fileoverview Core configuration and type definitions for the chat application.
 * @module config
 * 
 * This module serves as the central configuration hub for the chat application.
 * It provides strongly-typed configuration options, theme definitions, and UI constants
 * that ensure consistency across the application.
 * 
 * Key Features:
 * - Comprehensive type definitions for all configuration aspects
 * - Environment-aware API configurations
 * - Strongly-typed theme system with multiple themes
 * - Centralized UI constants for spacing, typography, and animations
 * - Network and cache configuration
 * - Model provider definitions and configurations
 * 
 * @example
 * import { APP_CONFIG, THEMES, MODELS } from './config';
 * 
 * // Using UI constants
 * const styles = {
 *   margin: APP_CONFIG.UI.SPACING.MEDIUM,
 *   fontSize: APP_CONFIG.UI.TYPOGRAPHY.BODY
 * };
 * 
 * // Using themes
 * const theme = THEMES.light;
 * 
 * // Using model configurations
 * const model = MODELS.gpt;
 */

import { SetStateAction, Dispatch } from 'react'
import { NumberProp } from 'react-native-svg'
import { OpenAIIcon, AnthropicIcon, GeminiIcon } from './components/Icons'

// ============= Configuration Types =============

/**
 * Network-related configuration types
 * @namespace NetworkConfig
 */
export namespace NetworkConfig {
  export type Timeouts = typeof APP_CONFIG.NETWORK.TIMEOUTS;
  export type Retry = typeof APP_CONFIG.NETWORK.RETRY;
  export type RateLimits = typeof APP_CONFIG.NETWORK.RATE_LIMITS;
}

/**
 * Validation-related configuration types
 * @namespace ValidationConfig
 */
export namespace ValidationConfig {
  export type Messages = typeof APP_CONFIG.VALIDATION.MESSAGES;
  export type Inputs = typeof APP_CONFIG.VALIDATION.INPUTS;
  export type Errors = typeof APP_CONFIG.ERRORS.VALIDATION;
}

/**
 * Error-related configuration types
 * @namespace ErrorConfig
 */
export namespace ErrorConfig {
  export type Validation = typeof APP_CONFIG.ERRORS.VALIDATION;
  export type Connection = typeof APP_CONFIG.ERRORS.CONNECTION;
  export type Cache = typeof APP_CONFIG.ERRORS.CACHE;
}

/**
 * Cache-related configuration types
 * @namespace CacheConfig
 */
export type CacheConfig = typeof APP_CONFIG.CACHE;

/**
 * Complete application configuration type
 */
export type AppConfig = typeof APP_CONFIG;

// ============= Message Types =============

/**
 * Represents the role of a message participant in the chat
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Base message interface for chat messages
 */
export interface ChatMessage {
  /** The role of the message sender */
  role: MessageRole;
  /** The content of the message */
  content: string;
  /** Optional timestamp of when the message was sent */
  timestamp?: number;
  /** Optional model identifier that generated the message */
  model?: string;
}

/**
 * Represents the state of a chat conversation
 */
export interface ChatState {
  /** Array of messages in the conversation */
  messages: ChatMessage[];
  /** Unique identifier for the conversation */
  index: string;
}

/**
 * OpenAI specific message types
 * @namespace OpenAI
 */
export namespace OpenAI {
  export interface UserHistory {
    user: string;
    assistant: string;
    fileIds?: string[];
  }

  export interface StateWithIndex {
    messages: Array<{
      user: string;
      assistant: string;
    }>;
    index: string;
  }

  export interface Message {
    role: MessageRole;
    content: string;
  }
}

// ============= Model Types =============

/**
 * Supported AI model providers
 */
// Provider values must match these literal types
const GPT_PROVIDER = 'gpt' as const;
const CLAUDE_PROVIDER = 'claude' as const;
const GEMINI_PROVIDER = 'gemini' as const;

export type ModelProvider = typeof GPT_PROVIDER | typeof CLAUDE_PROVIDER | typeof GEMINI_PROVIDER;

/**
 * Configuration for an AI model
 */
export interface Model {
  /** Provider of the model */
  label: ModelProvider;
  /** Icon component for the model */
  icon: React.ComponentType<any> | null;
  /** Display name for the UI */
  displayName: string;
}

// ============= Theme Types =============

/**
 * Base theme interface defining all required theme properties
 */
export interface Theme {
  /** Theme name for identification */
  name: string;
  /** Primary background color */
  backgroundColor: string;
  /** Primary text color */
  textColor: string;
  /** Accent color for interactive elements */
  tintColor: string;
  /** Text color for elements using tint color background */
  tintTextColor: string;
  /** Color for borders and dividers */
  borderColor: string;
  /** Active tab color */
  tabBarActiveTintColor: string;
  /** Inactive tab color */
  tabBarInactiveTintColor: string;
  /** Placeholder text color for inputs */
  placeholderTextColor: string;
  /** Secondary background color */
  secondaryBackgroundColor: string;
  /** Secondary text color */
  secondaryTextColor: string;
  /** Font family for regular text */
  regularFont: string;
  /** Font family for medium weight text */
  mediumFont: string;
  /** Font family for semi-bold text */
  semiBoldFont: string;
  /** Font family for bold text */
  boldFont: string;
  /** Font family for light text */
  lightFont: string;
}

// ============= Context Types =============

/**
 * Theme context interface for React context
 */
export interface ThemeContext {
  /** Current theme */
  theme: typeof THEMES.light;
  /** Current theme name */
  themeName: string;
  /** Function to update theme */
  setTheme: Dispatch<SetStateAction<typeof THEMES.light>>;
}

/**
 * Application context interface for React context
 */
export interface AppContext {
  /** Current chat model */
  chatType: Model;
  /** Function to update chat model */
  setChatType: Dispatch<SetStateAction<Model>>;
  /** Handler for presenting modal */
  handlePresentModalPress: () => void;
  /** Handler for closing modal */
  closeModal: () => void;
  /** Handler for clearing chat */
  clearChat: () => void;
  /** Reference to clear chat function */
  clearChatRef: React.MutableRefObject<(() => void) | undefined>;
}

// ============= Component Types =============

/**
 * Props for icon components
 */
export interface IconProps {
  /** Optional icon type */
  type?: string;
  /** Current theme */
  theme: Theme;
  /** Icon size */
  size?: NumberProp;
  /** Selected state */
  selected?: boolean;
  /** Additional props */
  [key: string]: any;
}

// ============= Configuration =============

/**
 * Application-wide configuration constants
 * @const
 */
export const APP_CONFIG = {
  /**
   * Network and API Configuration
   * @namespace NETWORK
   */
  NETWORK: {
    /** Timeout configurations in milliseconds */
    TIMEOUTS: {
      /** 30 seconds for general API requests */
      API_REQUEST: 30_000,
      /** 1 minute for streaming responses */
      STREAM: 60_000,
      /** 10 seconds for initial connection */
      CONNECTION: 10_000,
      /** 5 seconds for websocket operations */
      SOCKET: 5_000,
    },
    /** Retry configuration for failed requests */
    RETRY: {
      /** Maximum number of retry attempts */
      MAX_ATTEMPTS: 3,
      /** Base delay between retries in ms */
      BACKOFF_MS: 1_000,
      /** Maximum delay between retries */
      MAX_BACKOFF_MS: 5_000,
    },
    /** Rate limiting configuration */
    RATE_LIMITS: {
      /** Maximum requests per minute */
      REQUESTS_PER_MINUTE: 60,
      /** Maximum concurrent streams */
      CONCURRENT_STREAMS: 3,
    },
  },

  /**
   * Data Validation Configuration
   * @namespace VALIDATION
   */
  VALIDATION: {
    /** Message validation rules */
    MESSAGES: {
      /** Maximum characters per message */
      MAX_LENGTH: 4_000,
      /** Minimum characters per message */
      MIN_LENGTH: 1,
      /** Maximum messages in conversation history */
      MAX_HISTORY: 100,
    },
    /** Input validation rules */
    INPUTS: {
      /** Maximum file size (10MB in bytes) */
      MAX_FILE_SIZE: 10 * 1024 * 1024,
      /** Allowed file extensions */
      ALLOWED_FILE_TYPES: ['txt', 'pdf', 'doc', 'docx'] as const,
    },
  },

  /**
   * Cache Configuration
   * @namespace CACHE
   */
  CACHE: {
    /** Message time-to-live (24 hours in milliseconds) */
    MESSAGE_TTL: 24 * 60 * 60 * 1_000,
    /** Maximum cache size (50MB in bytes) */
    MAX_CACHE_SIZE: 50 * 1024 * 1024,
    /** Cache invalidation interval (1 hour in milliseconds) */
    INVALIDATION_INTERVAL: 60 * 60 * 1_000,
  },

  /**
   * Error Messages
   * @namespace ERRORS
   */
  ERRORS: {
    /** Validation error messages */
    VALIDATION: {
      EMPTY_MESSAGE: 'Message content cannot be empty',
      MESSAGE_TOO_LONG: (limit: number) => 
        `Message exceeds maximum length of ${limit} characters`,
      TOO_MANY_MESSAGES: (limit: number) => 
        `Conversation exceeds maximum of ${limit} messages`,
      INVALID_FILE_TYPE: (types: readonly string[]) => 
        `File type not supported. Allowed types: ${types.join(', ')}`,
      FILE_TOO_LARGE: (maxSize: number) => 
        `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`,
    },
    /** Connection error messages */
    CONNECTION: {
      TIMEOUT: 'Connection timeout',
      FAILED: 'Failed to establish connection',
      INVALID_MODEL: (model: string, supported: string[]) => 
        `Unsupported model type: ${model}. Must be one of: ${supported.join(', ')}`,
      RATE_LIMITED: 'Too many requests. Please try again later.',
      CONCURRENT_LIMIT: 'Maximum number of concurrent streams reached',
    },
    /** Cache error messages */
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
  label: ModelProvider, 
  displayName: string, 
  icon: React.ComponentType<any>
): Model {
  return { label, icon, displayName }
}

/**
 * AI model configurations for supported providers.
 */
// Default provider from environment variables
export const DEFAULT_PROVIDER = (process.env['EXPO_PUBLIC_DEFAULT_PROVIDER'] || GPT_PROVIDER) as ModelProvider;

// Provider names from environment variables with type safety
export const PROVIDERS = {
  GPT: (process.env['EXPO_PUBLIC_PROVIDER_GPT'] || GPT_PROVIDER) as typeof GPT_PROVIDER,
  CLAUDE: (process.env['EXPO_PUBLIC_PROVIDER_CLAUDE'] || CLAUDE_PROVIDER) as typeof CLAUDE_PROVIDER,
  GEMINI: (process.env['EXPO_PUBLIC_PROVIDER_GEMINI'] || GEMINI_PROVIDER) as typeof GEMINI_PROVIDER
} as const;

// Type-safe model configuration
export const MODELS = {
  [GPT_PROVIDER]: createModel(
    GPT_PROVIDER,
    'GPT-4',
    OpenAIIcon
  ),
  [CLAUDE_PROVIDER]: createModel(
    CLAUDE_PROVIDER,
    'Claude',
    AnthropicIcon
  ),
  [GEMINI_PROVIDER]: createModel(
    GEMINI_PROVIDER,
    'Gemini',
    GeminiIcon
  )
} as Record<ModelProvider, Model>;

// ============= Theme Configuration =============
/**
 * Color palette definitions
 * @const
 */
const COLORS = {
  /** Base colors */
  white: '#fff',
  black: '#000',
  /** Transparent colors */
  gray: 'rgba(0, 0, 0, .5)',
  lightWhite: 'rgba(255, 255, 255, .5)',
  /** Brand colors */
  blueTint: '#0281ff',
  lightPink: '#F7B5CD',
  /** Theme-specific colors */
  vercelGray: '#171717',
  miamiDark: '#231F20',
} as const;

/**
 * Font configuration and assets
 * @const
 */
export const FONTS = {
  /** Regular weight */
  'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
  /** Light weight */
  'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
  /** Bold weight */
  'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
  /** Medium weight */
  'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
  /** Black weight */
  'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
  /** Semi-bold weight */
  'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
  /** Thin weight */
  'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
  /** Ultra-light weight */
  'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
  /** Ultra-black weight */
  'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf')
} as const;

/**
 * Font style configuration
 * @const
 */
const FONT_STYLES = {
  regularFont: 'Geist-Regular',
  lightFont: 'Geist-Light',
  boldFont: 'Geist-Bold',
  mediumFont: 'Geist-Medium',
  blackFont: 'Geist-Black',
  semiBoldFont: 'Geist-SemiBold',
  thinFont: 'Geist-Thin',
  ultraLightFont: 'Geist-UltraLight',
  ultraBlackFont: 'Geist-UltraBlack',
} as const;

/**
 * Base theme interface extending font styles
 */
type BaseTheme = {
  /** Theme name for display */
  name: string;
  /** Theme identifier */
  label: string;
  /** Primary text color */
  textColor: string;
  /** Secondary text color */
  secondaryTextColor: string;
  /** Color for less prominent text */
  mutedForegroundColor: string;
  /** Primary background color */
  backgroundColor: string;
  /** Placeholder text color */
  placeholderTextColor: string;
  /** Secondary background color */
  secondaryBackgroundColor: string;
  /** Border color */
  borderColor: string;
  /** Accent color */
  tintColor: string;
  /** Text color on accent background */
  tintTextColor: string;
  /** Active tab color */
  tabBarActiveTintColor: string;
  /** Inactive tab color */
  tabBarInactiveTintColor: string;
} & typeof FONT_STYLES;

/**
 * Available theme variants
 */
type ThemeType = {
  light: BaseTheme;
  dark: BaseTheme;
  miami: BaseTheme;
  vercel: BaseTheme;
};

/**
 * Dark theme base configuration
 * @const
 */
const DARK_THEME: BaseTheme = {
  ...FONT_STYLES,
  name: 'Dark',
  label: 'dark',
  textColor: COLORS.white,
  secondaryTextColor: COLORS.black,
  mutedForegroundColor: COLORS.lightWhite,
  backgroundColor: COLORS.black,
  placeholderTextColor: COLORS.lightWhite,
  secondaryBackgroundColor: COLORS.white,
  borderColor: 'rgba(255, 255, 255, .2)',
  tintColor: COLORS.blueTint,
  tintTextColor: COLORS.white,
  tabBarActiveTintColor: COLORS.blueTint,
  tabBarInactiveTintColor: COLORS.lightWhite,
} as const;

/**
 * Theme configurations
 * @const
 */
export const THEMES: ThemeType = {
  /** Light theme */
  light: {
    ...FONT_STYLES,
    name: 'Light',
    label: 'light',
    textColor: COLORS.black,
    secondaryTextColor: COLORS.white,
    mutedForegroundColor: COLORS.gray,
    backgroundColor: COLORS.white,
    placeholderTextColor: COLORS.gray,
    secondaryBackgroundColor: COLORS.black,
    borderColor: 'rgba(0, 0, 0, .15)',
    tintColor: COLORS.blueTint,
    tintTextColor: COLORS.white,
    tabBarActiveTintColor: COLORS.black,
    tabBarInactiveTintColor: COLORS.gray,
  },
  /** Dark theme */
  dark: DARK_THEME,
  /** Miami theme - extends dark theme */
  miami: {
    ...FONT_STYLES,
    ...DARK_THEME,
    name: 'Miami',
    label: 'miami',
    backgroundColor: COLORS.miamiDark,
    tintColor: COLORS.lightPink,
    tintTextColor: COLORS.miamiDark,
    tabBarActiveTintColor: COLORS.lightPink,
  },
  /** Vercel theme - extends dark theme */
  vercel: {
    ...FONT_STYLES,
    ...DARK_THEME,
    name: 'Vercel',
    label: 'vercel',
    backgroundColor: COLORS.black,
    tintColor: COLORS.vercelGray,
    tintTextColor: COLORS.white,
    tabBarActiveTintColor: COLORS.white,
    tabBarInactiveTintColor: COLORS.lightWhite,
  }
} as const;

// ============= Settings Configuration =============

/**
 * Application settings configuration
 * @const
 */
export const SETTINGS_CONFIG = {
  /** Model parameter configurations */
  MODEL_PARAMS: {
    /** Temperature parameter for model output randomness */
    TEMPERATURE: {
      /** Default temperature value */
      DEFAULT: 0.7,
      /** Minimum allowed temperature */
      MIN: 0,
      /** Maximum allowed temperature */
      MAX: 1,
      /** Step size for temperature adjustment */
      STEP: 0.01
    },
    /** Maximum tokens parameter for model output length */
    MAX_TOKENS: {
      /** Default max tokens value */
      DEFAULT: 2000,
      /** Minimum allowed tokens */
      MIN: 100,
      /** Maximum allowed tokens */
      MAX: 8192,
      /** Step size for token adjustment */
      STEP: 100
    }
  },
  /** Local storage keys */
  STORAGE_KEYS: {
    /** Theme storage key */
    THEME: 'theme',
    /** Chat type storage key */
    CHAT_TYPE: 'chatType'
  }
} as const;

// ============= UI Style Generators =============

/**
 * Interface for bottom sheet style configuration
 */
interface BottomSheetStyles {
  /** Styles for the handle indicator */
  handleIndicator: {
    backgroundColor: string;
    width: number;
  };
  /** Styles for the handle container */
  handle: {
    backgroundColor: string;
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
  };
  /** Styles for the background */
  background: {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

/**
 * Generates theme-aware styles for bottom sheet component
 * @param theme - Current theme
 * @returns Bottom sheet styles configuration
 */
export function getBottomSheetStyles(theme: typeof THEMES.light): BottomSheetStyles {
  return {
    handleIndicator: {
      backgroundColor: theme.mutedForegroundColor,
      width: APP_CONFIG.UI.SIZES.ICON.MEDIUM,
    },
    handle: {
      backgroundColor: theme.backgroundColor,
      borderTopLeftRadius: APP_CONFIG.UI.BORDER_RADIUS.MEDIUM,
      borderTopRightRadius: APP_CONFIG.UI.BORDER_RADIUS.MEDIUM,
    },
    background: {
      backgroundColor: theme.backgroundColor,
      borderColor: theme.borderColor,
      borderWidth: 1,
      shadowColor: COLORS.black,
      shadowOffset: APP_CONFIG.UI.SHADOW.OFFSET.INVERTED,
      shadowOpacity: 0.1,
      shadowRadius: APP_CONFIG.UI.BORDER_RADIUS.SMALL,
      elevation: 5,
    },
  }
}
