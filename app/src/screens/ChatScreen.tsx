/**
 * @fileoverview Main chat screen component that handles real-time messaging with AI models
 * @filepath app/src/screens/ChatScreen.tsx
 * 
 * Supports streaming responses, message history, and UI interactions like copying and clearing chat
 *
 * DEV NOTE: Streaming Implementation
 * 
 * This component is designed to exclusively use streaming for chat interactions.
 * We enforce streaming mode (streaming: true) in all chat calls as it provides:
 * - Immediate response feedback through token-by-token updates
 * - Smooth UI transitions with typing indicators
 * - Better user engagement through real-time message building
 * 
 * The component includes dedicated handling for streaming responses:
 * - responseMap for managing streaming message state
 * - Real-time token processing via onToken callback
 * - Connection status management and error handling
 * 
 * Non-streaming implementation is intentionally omitted as streaming is our
 * preferred approach for optimal user experience.
 */

import React, { useEffect, useCallback, useContext, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  KeyboardAvoidingView, 
  StyleSheet, 
  TouchableHighlight, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  FlatList, 
  Keyboard, 
  Animated, 
  Easing 
} from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { ThemeContext, AppContext } from '../contexts';
import { ChatMessage, ChatState, APP_CONFIG } from '../config';
import { chatService } from '../services';
import { ChatError, validateMessage, getFirstNCharsOrLess } from '../utils';
import { ChatMessage as ChatMessageComponent, ChatInput, TypingIndicator } from '../components/ChatUI';

/**
 * Main Chat component that provides the chat interface and handles messaging logic.
 * Manages the chat state, handles user input, and coordinates with AI models for responses.
 * @component
 */
export function ChatScreen() {
  // State Management
  /** Controls loading state during AI responses */
  const [loading, setLoading] = useState<boolean>(false)
  /** Manages current user input text */
  const [input, setInput] = useState<string>('')
  /** Tracks whether any chat messages have been made */
  const [callMade, setCallMade] = useState<boolean>(false)
  /** Maintains chat history and session information */
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    index: uuid()
  })
  /** Tracks the current connection status */
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting' | null>(null)
  /** Animation value for fade transition */
  const fadeAnim = useRef(new Animated.Value(1)).current
  /** Animation value for input loading */
  const inputOpacity = useRef(new Animated.Value(1)).current
  /** Controls typing indicator dots animation */
  const typingDots = useRef<Animated.Value[]>([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  // Refs and Hooks
  /** Reference for auto-scrolling the chat view */
  const scrollViewRef = useRef<ScrollView | null>(null)
  const { showActionSheetWithOptions } = useActionSheet()
  /** Animation value for general button scaling */
  const buttonScale = useRef(new Animated.Value(1)).current
  /** Animation value specific to send button scaling */
  const sendButtonScale = useRef(new Animated.Value(1)).current

  // Context
  const { theme } = useContext(ThemeContext)
  const { chatType, clearChatRef } = useContext(AppContext)
  const styles = getStyles(theme)

  /**
   * Sets up the clear chat functionality through the ref passed from parent
   */
  useEffect(() => {
    if (clearChatRef) {
      clearChatRef.current = handleClearChat
    }
    return () => {
      if (clearChatRef) {
        clearChatRef.current = undefined
      }
    }
  }, [])

  /**
   * Clears the entire chat history and resets input
   * Prevents clearing during active loading state
   */
  function handleClearChat() {
    if (loading) return
    
    // Start fade out animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: APP_CONFIG.UI.ANIMATION.DURATION.MEDIUM,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: APP_CONFIG.UI.ANIMATION.DURATION.SLOW,
        delay: APP_CONFIG.UI.ANIMATION.DELAY.DEFAULT,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      })
    ]).start()

    // Reset state after slight delay to sync with animation
    setTimeout(() => {
      setChatState({
        messages: [],
        index: uuid()
      })
      setInput('')
      setCallMade(false)
    }, 200)
  }

  /**
   * Handles button press animation
   * @param scale - Animated value to control the scaling effect
   */
  const animateButton = (scale: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: APP_CONFIG.UI.ANIMATION.DURATION.FAST,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: APP_CONFIG.UI.ANIMATION.DURATION.FAST,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start()
  }

  /**
   * Shows error toast message with appropriate styling based on error type
   * @param error - Error object from chat service
   */
  const showErrorToast = (error: ChatError) => {
    const errorMessages: Record<string, string> = {
      'PARSE_ERROR': 'Failed to process AI response',
      'STREAM_ERROR': 'Connection interrupted',
      'REQUEST_ERROR': 'Failed to connect to chat service',
      'HTTP_ERROR': 'Server error occurred',
      'UNKNOWN_ERROR': 'An unexpected error occurred'
    };

    Toast.show({
      type: 'error',
      text1: errorMessages[error.code] || 'Error',
      text2: error.message,
      position: 'bottom',
      visibilityTime: 4000,
    });
  };

  /**
   * Shows connection status toast message
   * @param status - Current connection status
   */
  const showConnectionToast = (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => {
    const statusMessages: Record<string, { text1: string; text2: string; type: string }> = {
      'connecting': {
        text1: 'Connecting...',
        text2: 'Establishing connection to chat service',
        type: 'info'
      },
      'connected': {
        text1: 'Connected',
        text2: 'Successfully connected to chat service',
        type: 'success'
      },
      'disconnected': {
        text1: 'Connection Lost',
        text2: 'Attempting to reconnect...',
        type: 'error'
      },
      'reconnecting': {
        text1: 'Reconnecting...',
        text2: 'Attempting to restore connection',
        type: 'info'
      }
    };

    const message = statusMessages[status];
    if (message) {
      Toast.show({
        type: message.type as any,
        text1: message.text1,
        text2: message.text2,
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  };

  /**
   * Extract message validation logic
   * @param input - User input text
   * @param chatState - Current chat state
   * @returns - Validated message and all messages
   */
  const validateAndPrepareMessage = (input: string, chatState: ChatState) => {
    const messages = [...chatState.messages, {
      role: 'user' as const,
      content: getFirstNCharsOrLess(input),
      timestamp: Date.now()
    }];

    const newMessage = messages[messages.length - 1]!;  // Add non-null assertion
    validateMessage(newMessage);  // Validate new message

    return messages;
  };

  /**
   * Handles input loading animation
   * @param isLoading - Boolean indicating whether input is loading
   */
  const animateInputLoading = (isLoading: boolean) => {
    Animated.timing(inputOpacity, {
      toValue: isLoading ? 0.5 : 1,
      duration: APP_CONFIG.UI.ANIMATION.DURATION.MEDIUM,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Animates the typing indicator dots in sequence
   */
  const animateTypingDots = () => {
    const createDotAnimation = (dot: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(dot, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]);
    };

    Animated.loop(
      Animated.stagger(200, [
        createDotAnimation(typingDots[0]!),
        createDotAnimation(typingDots[1]!),
        createDotAnimation(typingDots[2]!)
      ])
    ).start();
  };

  /**
   * Main chat handling function that:
   * 1. Processes user input
   * 2. Updates chat state
   * 3. Manages streaming response from AI
   * 4. Handles UI updates during streaming
   */
  async function chat() {
    if (!input.trim()) return
    animateButton(sendButtonScale)
    Keyboard.dismiss()

    // Set callMade to true when starting a new chat
    if (!callMade) {
      setCallMade(true)
    }

    try {
      const messages = validateAndPrepareMessage(input, chatState);
      
      setChatState(prev => ({
        ...prev,
        messages
      }));

      // Scroll to bottom after user message using the native scroll behavior
      scrollToBottom()

      setLoading(true)
      setInput('')
      animateInputLoading(true)
      animateTypingDots() // Start typing animation

      // responseMap maintains the state of streaming responses for each message
      // This allows for efficient updates without re-rendering the entire message list
      // Each messageId maps to its accumulated content as tokens arrive
      const responseMap = new Map<string, string>();

      await chatService.streamChat( // Use the streaming chat method
        messages,
        {
          provider: chatType.label,
          model: chatType.name,
          streaming: true // Always set to true for streaming response (no toggle for now)
        },
        {
          // Handle incoming tokens from the streaming response
          onToken: (token, messageId) => {
            // Accumulate tokens for the current message
            const currentContent = responseMap.get(messageId) || '';
            const newContent = currentContent + token;
            responseMap.set(messageId, newContent);

            // Update the chat state with the new content
            setChatState(prev => {
              const messages = [...prev.messages];
              const lastMessage = messages[messages.length - 1];
              
              // Update existing assistant message or create new one
              if (lastMessage?.role === 'assistant') {
                messages[messages.length - 1] = {
                  ...lastMessage,
                  content: newContent
                };
              } else {
                messages.push({
                  role: 'assistant',
                  content: newContent,
                  timestamp: Date.now(),
                  model: chatType.displayName
                });
              }

              return {
                ...prev,
                messages
              };
            });

            // Use requestAnimationFrame for smooth scrolling during streaming
            requestAnimationFrame(scrollToBottom);
          },
          onError: (error) => {
            console.error('Chat error:', error)
            setLoading(false)
            animateInputLoading(false)
            if (error instanceof ChatError) {
              showErrorToast(error)
            } else {
              showErrorToast(new ChatError('An unexpected error occurred', 'UNKNOWN_ERROR'))
            }
          },
          onComplete: () => {
            setLoading(false)
            animateInputLoading(false)
            // Final scroll using the native scroll behavior
            scrollToBottom()
          },
          onConnectionStatus: (status) => {
            setConnectionStatus(status)
            showConnectionToast(status)
          }
        }
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      setLoading(false)
      animateInputLoading(false)
      if (error instanceof ChatError) {
        showErrorToast(error)
      } else if (error instanceof Error) {
        showErrorToast(new ChatError(error.message, 'UNKNOWN_ERROR'))
      } else {
        showErrorToast(new ChatError('Failed to send message', 'UNKNOWN_ERROR'))
      }
    }
  }

  /**
   * Handles scrolling to the bottom of the chat
   * Uses native scroll behavior for smooth animation
   */
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => (
    <ChatMessageComponent 
      item={item} 
      theme={theme}
      onPressOptions={showClipboardActionsheet}
    />
  ), [theme, showClipboardActionsheet]);

  /**
   * Copies given text to clipboard
   * @param text - Text to copy
   */
  async function copyToClipboard(text: string) {
    await Clipboard.setStringAsync(text)
  }

  /**
   * Shows action sheet with options to copy text or clear chat
   * @param text - Text to copy if copy option is selected
   */
  async function showClipboardActionsheet(text: string) {
    const cancelButtonIndex = 2
    showActionSheetWithOptions({
      options: ['Copy to clipboard', 'Clear chat', 'cancel'],
      cancelButtonIndex
    }, selectedIndex => {
      if (selectedIndex === 0) {
        copyToClipboard(text)
      }
      if (selectedIndex === 1) {
        handleClearChat()
      }
    })
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      {connectionStatus === 'reconnecting' && (
        <View style={styles.connectionStatusBar}>
          <ActivityIndicator size="small" color={theme.tintTextColor} />
          <Text style={styles.connectionStatusText}>Reconnecting...</Text>
        </View>
      )}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          keyboardShouldPersistTaps='handled'
          ref={scrollViewRef}
          contentContainerStyle={[
            !callMade && styles.scrollContentContainer,
            { paddingBottom: 20 }
          ]}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        >
          {!callMade ? (
            <View style={styles.midChatInputWrapper}>
              <View style={styles.midChatInputContainer}>
                <TextInput
                  onChangeText={setInput}
                  style={styles.midInput}
                  placeholder='Message'
                  placeholderTextColor={theme.placeholderTextColor + '80'}
                  autoCorrect={true}
                  maxLength={APP_CONFIG.VALIDATION.MESSAGES.MAX_LENGTH}
                  accessible={true}
                  accessibilityLabel="Message input field"
                  accessibilityHint="Enter your message to the AI"
                />
                <TouchableHighlight
                  onPress={() => {
                    animateButton(buttonScale)
                    chat()
                  }}
                  underlayColor={theme.tintColor + '90'}
                  style={styles.midButtonContainer}
                  accessible={true}
                  accessibilityLabel={`Start ${chatType.displayName} Chat`}
                  accessibilityHint="Begins a new chat session with the AI"
                >
                  <Animated.View 
                    style={[
                      styles.midButtonStyle,
                      {
                        transform: [{ scale: buttonScale }]
                      }
                    ]}
                  >
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={22}
                      color={theme.tintTextColor}
                      style={styles.midButtonIcon}
                    />
                    <Text style={styles.midButtonText}>
                      Start {chatType.displayName} Chat
                    </Text>
                  </Animated.View>
                </TouchableHighlight>
                <Text style={styles.chatDescription}>
                  It's time to prompt...
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={chatState.messages}
              renderItem={renderItem}
              scrollEnabled={false}
              keyExtractor={(_, index) => `${chatType.label}-${index}`}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={5}
            />
          )}
          {loading && (
            <TypingIndicator 
              theme={theme}
              typingDots={typingDots}
              modelDisplayName={chatType.displayName}
            />
          )}
          {loading && <ActivityIndicator style={styles.loadingContainer} />}
        </ScrollView>
      </Animated.View>
      {callMade && (
        <ChatInput
          input={input}
          loading={loading}
          theme={theme}
          inputOpacity={inputOpacity}
          sendButtonScale={sendButtonScale}
          onChangeText={setInput}
          onSend={() => {
            if (!loading && input.trim()) {
              animateButton(sendButtonScale);
              chat();
            }
          }}
        />
      )}
      <Toast />
    </KeyboardAvoidingView>
  )
}

/**
 * Generates styles for the chat component based on the current theme
 * @param theme - Current theme object containing color and font information
 * @returns StyleSheet object with all component styles
 */
const getStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1
  },
  scrollContentContainer: {
    flex: 1,
    paddingTop: 20
  },
  loadingContainer: {
    marginTop: 25
  },
  connectionStatusBar: {
    backgroundColor: theme.tintColor + '90',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  connectionStatusText: {
    color: theme.tintTextColor,
    marginLeft: 8,
    fontFamily: theme.mediumFont,
    fontSize: 14,
  },
  midInput: {
    marginBottom: 20,
    borderWidth: 1,
    paddingHorizontal: 25,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    color: theme.textColor,
    borderColor: theme.borderColor + '30',
    fontFamily: theme.mediumFont,
    backgroundColor: theme.backgroundColor,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  midButtonContainer: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: theme.tintColor,
    shadowColor: theme.tintColor,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  midButtonStyle: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midButtonIcon: {
    marginRight: 14,
  },
  midButtonText: {
    color: theme.tintTextColor,
    fontFamily: theme.boldFont,
    fontSize: 17,
    letterSpacing: 0.4,
  },
  midChatInputWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midChatInputContainer: {
    width: '100%',
    paddingTop: 5,
    paddingBottom: 5
  },
  chatDescription: {
    color: theme.textColor,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 15,
    letterSpacing: 0.4,
    paddingHorizontal: 40,
    fontFamily: theme.regularFont,
    lineHeight: 24,
  },
})