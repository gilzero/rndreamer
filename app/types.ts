/**
 * @fileoverview Core type definitions for the chat application.
 * @file-path app/types.ts
 * Contains type definitions for messages, models, contexts, and component props.
 */

import { SetStateAction, Dispatch } from 'react'

/**
 * Valid roles for chat messages in the application.
 * - user: Messages sent by the user
 * - assistant: Responses from the AI model
 * - system: System-level instructions or messages
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Structure for a single chat message.
 * Used throughout the application for message handling and display.
 */
export interface ChatMessage {
  /** The role of the message sender (user/assistant/system) */
  role: MessageRole;
  /** The actual content of the message */
  content: string;
  /** Optional timestamp for message ordering */
  timestamp?: number;
  /** Optional identifier for the AI model that generated the response */
  model?: string;
}

/**
 * State structure for chat conversations.
 * Used to maintain chat history and conversation context.
 */
export interface ChatState {
  /** Array of messages in the conversation */
  messages: ChatMessage[];
  /** Unique identifier for the conversation */
  index: string;
}

/**
 * Available AI model providers in the application.
 * Used for routing requests to the appropriate API endpoint.
 */
export type ModelProvider = 'gpt' | 'claude' | 'gemini';

/**
 * Configuration structure for AI models.
 * Defines the properties required for each supported model.
 */
export interface Model {
  /** API model identifier used when making requests */
  name: string;
  /** Provider identifier for routing and UI purposes */
  label: ModelProvider;
  /** React component for displaying the model's icon */
  icon: React.ComponentType<any>;
  /** User-friendly name shown in the UI */
  displayName: string;
}

/**
 * Theme context interface defining the application's theming system.
 * Provides consistent styling across the application.
 */
export interface IThemeContext {
  /** Theme configuration object containing all style properties */
  theme: {
    /** Primary text color */
    textColor: string;
    /** Primary background color */
    backgroundColor: string;
    /** Accent color for interactive elements */
    tintColor: string;
    /** Color for borders and dividers */
    borderColor: string;
    /** Color for placeholder text in inputs */
    placeholderTextColor: string;
    /** Text color for tinted/accented elements */
    tintTextColor: string;
    /** Secondary text color for less emphasis */
    secondaryTextColor: string;
    /** Secondary background color for contrast */
    secondaryBackgroundColor: string;
    /** Font family for regular text */
    regularFont: string;
    /** Font family for medium-weight text */
    mediumFont: string;
    /** Font family for bold text */
    boldFont: string;
    /** Font family for semi-bold text */
    semiBoldFont: string;
    /** Font family for light text */
    lightFont: string;
    /** Active tab color in tab navigation */
    tabBarActiveTintColor: string;
    /** Inactive tab color in tab navigation */
    tabBarInactiveTintColor: string;
  };
  /** Current theme identifier */
  themeName: string;
  /** Function to update the current theme */
  setTheme: Dispatch<SetStateAction<any>>;
}

/**
 * Application context interface for global state management.
 * Provides access to chat-related state and functions throughout the app.
 */
export interface IAppContext {
  /** Currently selected chat model */
  chatType: Model;
  /** Function to update the current chat model */
  setChatType: Dispatch<SetStateAction<Model>>;
  /** Function to show/hide the model selection modal */
  handlePresentModalPress: () => void;
  /** Function to close the model selection modal */
  closeModal: () => void;
  /** Function to clear the current chat history */
  clearChat: () => void;
  /** Reference to the clear chat function for external access */
  clearChatRef: React.MutableRefObject<(() => void) | undefined>;
}

/**
 * Props interface for icon components.
 * Used by model-specific icon components (OpenAI, Claude, Gemini).
 */
export interface IIconProps {
  /** Model type identifier */
  type: string;
  /** Additional props passed to the icon component */
  props: Record<string, unknown>;
}

/**
 * Message structure for OpenAI API communication.
 * Follows OpenAI's chat completion message format.
 */
export interface IOpenAIMessages {
  /** Message role (user/assistant/system) */
  role: MessageRole;
  /** Message content */
  content: string;
}

/**
 * Structure for OpenAI conversation history.
 * Used to maintain context in OpenAI chat completions.
 */
export interface IOpenAIUserHistory {
  /** User message in the conversation */
  user: string;
  /** Assistant's response */
  assistant: string;
  /** Optional array of file IDs for attachments */
  fileIds?: any[];
}

/**
 * Extended state structure for OpenAI conversations.
 * Includes conversation index for tracking purposes.
 */
export interface IOpenAIStateWithIndex {
  /** Array of message pairs in the conversation */
  messages: Array<{
    user: string;
    assistant: string;
  }>;
  /** Unique identifier for the conversation */
  index: string;
}