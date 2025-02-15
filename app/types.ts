// @file-overview: types for the app
// @file-path: app/types.ts
import { SetStateAction, Dispatch } from 'react'

// Chat Message Types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: number;
}

export interface ChatState {
  messages: ChatMessage[];
  index: string;
}

// Model Types
export type ModelProvider = 'gpt' | 'claude' | 'gemini';

export interface Model {
  name: string;          // The actual model name used in API calls
  label: ModelProvider;  // Provider identifier
  icon: React.ComponentType<any>;
  displayName: string;   // User-friendly name for display
}

// Context Types
export interface IThemeContext {
  theme: {
    textColor: string;
    backgroundColor: string;
    tintColor: string;
    borderColor: string;
    placeholderTextColor: string;
    tintTextColor: string;
    secondaryTextColor: string;
    secondaryBackgroundColor: string;
    regularFont: string;
    mediumFont: string;
    boldFont: string;
    semiBoldFont: string;
    lightFont: string;
    tabBarActiveTintColor: string;
    tabBarInactiveTintColor: string;
  };
  themeName: string;
  setTheme: Dispatch<SetStateAction<any>>;
}

export interface IAppContext {
  chatType: Model;
  setChatType: Dispatch<SetStateAction<Model>>;
  handlePresentModalPress: () => void;
  closeModal: () => void;
  clearChat: () => void;
  clearChatRef: React.MutableRefObject<(() => void) | undefined>;
}

// Component Props Types
export interface IIconProps {
  type: string;
  props: Record<string, unknown>;
}

export interface IOpenAIMessages {
  role: MessageRole;
  content: string;
}

export interface IOpenAIUserHistory {
  user: string
  assistant: string
  fileIds?: any[]
}

export interface IOpenAIStateWithIndex {
  messages: Array<{
    user: string;
    assistant: string;
  }>;
  index: string;
}