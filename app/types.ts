/**
 * @fileoverview Core type definitions for the chat application.
 * @filepath app/types.ts
 *
 * Contains type definitions for messages, models, contexts, and component props.
 *
 */

import { SetStateAction, Dispatch } from 'react'
import { NumberProp } from 'react-native-svg'
import { THEMES } from './constants'

/**
 * Core Message Types
 */
export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: MessageRole
  content: string
  timestamp?: number
  model?: string
}

/**
 * Chat State & History Types
 */
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

/**
 * Model & Provider Types
 */
export type ModelProvider = 'gpt' | 'claude' | 'gemini'

export interface Model {
  name: string
  label: ModelProvider
  icon: React.ComponentType<any> | null
  displayName: string
}

/**
 * Context Types
 */
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

/**
 * Icon & Visual Types
 */
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