/**
 * @fileoverview Provides React Context providers for theme and app-wide state management.
 * Contains the theme context for styling and the app context for chat-related functionality.
 * 
 * This file sets up two main context providers:
 * 1. ThemeContext: Manages theme-related state and switching
 * 2. AppContext: Manages chat-related state and functionality
 * 
 * @see {@link ../theme.ts} for theme definitions
 * @see {@link ../types.ts} for type definitions
 * @see {@link ../screens/settings.tsx} for theme switching implementation
 */

import { createContext } from 'react'
import { IThemeContext, IAppContext } from '../types'
import { MODELS } from '../constants'

/**
 * Context for managing theme-related state across the application.
 * Provides access to the current theme configuration and theme switching functionality.
 * 
 * Theme Properties:
 * - Colors (text, background, tint, etc.)
 * - Fonts (regular, medium, bold, etc.)
 * - UI element styles (borders, shadows, etc.)
 * 
 * Usage:
 * const { theme, setTheme, themeName } = useContext(ThemeContext)
 * 
 * @see {@link ../theme.ts} for available themes
 * @see {@link ../screens/settings.tsx} for theme selection UI
 */
const ThemeContext = createContext<IThemeContext>({
  /** Current theme configuration with colors, fonts, and other styling properties */
  theme: {
    textColor: '',
    backgroundColor: '',
    tintColor: '',
    borderColor: '',
    placeholderTextColor: '',
    tintTextColor: '',
    secondaryTextColor: '',
    secondaryBackgroundColor: '',
    regularFont: '',
    mediumFont: '',
    boldFont: '',
    semiBoldFont: '',
    lightFont: '',
    tabBarActiveTintColor: '',
    tabBarInactiveTintColor: ''
  },
  /** Function to update the current theme */
  setTheme: () => null,
  /** Name of the currently active theme */
  themeName: ''
})

/**
 * Context for managing application-wide state and functionality.
 * Handles chat model selection, modal management, and chat history.
 * 
 * Features:
 * - Chat model selection and configuration
 * - Modal state management
 * - Chat history clearing
 * 
 * Error Handling:
 * - Model switching errors are handled in the modal
 * - Chat clearing includes confirmation
 * - Prevents clearing during active chats
 * 
 * Usage:
 * const { chatType, setChatType, clearChat } = useContext(AppContext)
 * 
 * @see {@link ../components/ChatModelModal.tsx} for model selection UI
 * @see {@link ../screens/chat.tsx} for chat implementation
 * @see {@link ../services/chatService.ts} for chat model integration
 */
const AppContext = createContext<IAppContext>({
  /** Currently selected chat model configuration */
  chatType: MODELS.gpt,
  /** Function to update the selected chat model */
  setChatType: () => null,
  /** Function to show the model selection modal */
  handlePresentModalPress: () => null,
  /** Function to close the model selection modal */
  closeModal: () => null,
  /** Function to clear the current chat history */
  clearChat: () => null,
  /** Ref to the clear chat function for external access */
  clearChatRef: { current: undefined }
})

export {
  ThemeContext, AppContext
}