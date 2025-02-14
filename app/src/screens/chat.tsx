/**
 * @fileoverview Main chat screen component that handles real-time messaging with AI models
 * Supports streaming responses, message history, and UI interactions like copying and clearing chat
 */

import React, { useEffect } from 'react'
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
} from 'react-native'
import 'react-native-get-random-values'
import { useContext, useState, useRef } from 'react'
import { ThemeContext, AppContext } from '../context'
import { v4 as uuid } from 'uuid'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ChatMessage, ChatState, ModelProvider } from '../../types'
import * as Clipboard from 'expo-clipboard'
import { useActionSheet } from '@expo/react-native-action-sheet'
import Markdown from '@ronradtke/react-native-markdown-display'
import { chatService } from '../services/chatService'

/**
 * Main Chat component that provides the chat interface and handles messaging logic.
 * Manages the chat state, handles user input, and coordinates with AI models for responses.
 * @component
 */
export function Chat() {
  // State Management
  /** Controls loading state during AI responses */
  const [loading, setLoading] = useState<boolean>(false)
  /** Manages current user input text */
  const [input, setInput] = useState<string>('')
  /** Maintains chat history and session information */
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    index: uuid()
  })

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
    setChatState({
      messages: [],
      index: uuid()
    })
    setInput('')
  }

  /**
   * Handles button press animation
   * @param scale - Animated value to control the scaling effect
   */
  const animateButton = (scale: Animated.Value) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start()
  }

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

    const newMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    }

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }))

    // Scroll to bottom after user message with a slight delay to ensure smooth animation
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setLoading(true)
    setInput('')

    // responseMap maintains the state of streaming responses for each message
    // This allows for efficient updates without re-rendering the entire message list
    // Each messageId maps to its accumulated content as tokens arrive
    const responseMap = new Map<string, string>();

    try {
      await chatService.streamChat(
        [...chatState.messages, newMessage],
        {
          provider: chatType.label,
          model: chatType.name,
          streaming: true
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
                  timestamp: Date.now()
                });
              }

              return {
                ...prev,
                messages
              };
            });

            // Implement debounced scrolling using requestAnimationFrame
            // This prevents excessive scroll updates while maintaining smooth UI
            if (scrollViewRef.current) {
              requestAnimationFrame(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              });
            }
          },
          onError: (error) => {
            console.error('Chat error:', error)
            setLoading(false)
          },
          onComplete: () => {
            setLoading(false)
            // Final scroll to ensure we're at the bottom
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      setLoading(false)
    }
  }

  /**
   * Renders individual chat messages with appropriate styling
   * Handles both user messages and AI responses with markdown support
   * @param item - Chat message to render
   */
  function renderItem({ item }: { item: ChatMessage }) {
    return (
      <Animated.View style={[styles.promptResponse]}>
        {item.role === 'user' ? (
          <View style={styles.promptTextContainer}>
            <View style={styles.promptTextWrapper}>
              <Text style={styles.promptText}>{item.content}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.textStyleContainer}>
            <Markdown style={styles.markdownStyle as any}>{item.content}</Markdown>
            <TouchableHighlight
              onPress={() => showClipboardActionsheet(item.content)}
              underlayColor={'transparent'}
            >
              <View style={styles.optionsIconWrapper}>
                <Ionicons
                  name="apps"
                  size={20}
                  color={theme.textColor + '90'}
                />
              </View>
            </TouchableHighlight>
          </View>
        )}
      </Animated.View>
    )
  }

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

  /** Flag indicating if any chat messages exist */
  const callMade = chatState.messages.length > 0

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
      keyboardVerticalOffset={110}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        ref={scrollViewRef}
        contentContainerStyle={[
          !callMade && styles.scrollContentContainer,
          { paddingBottom: 20 }
        ]}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
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
              />
              <TouchableHighlight
                onPress={() => {
                  animateButton(buttonScale)
                  chat()
                }}
                underlayColor={theme.tintColor + '90'}
                style={styles.midButtonContainer}
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
        {loading && <ActivityIndicator style={styles.loadingContainer} />}
      </ScrollView>
      {callMade && (
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.input}
            onChangeText={setInput}
            placeholder='Message'
            placeholderTextColor={theme.placeholderTextColor + '80'}
            value={input}
          />
          <TouchableHighlight
            underlayColor={'transparent'}
            activeOpacity={0.65}
            onPress={() => {
              animateButton(sendButtonScale)
              chat()
            }}
          >
            <Animated.View
              style={[
                styles.chatButton,
                {
                  transform: [{ scale: sendButtonScale }]
                }
              ]}
            >
              <Ionicons
                name="arrow-up-outline"
                size={20}
                color={theme.tintTextColor}
              />
            </Animated.View>
          </TouchableHighlight>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

/**
 * Generates styles for the chat component based on the current theme
 * @param theme - Current theme object containing color and font information
 * @returns StyleSheet object with all component styles
 */
const getStyles = (theme: any) => StyleSheet.create({
  optionsIconWrapper: {
    padding: 12,
    paddingTop: 10,
    alignItems: 'flex-end',
    opacity: 0.8
  },
  scrollContentContainer: {
    flex: 1,
    paddingTop: 20
  },
  chatDescription: {
    color: theme.textColor + '60',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 15,
    letterSpacing: 0.4,
    paddingHorizontal: 40,
    fontFamily: theme.regularFont,
    lineHeight: 24,
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
  loadingContainer: {
    marginTop: 25
  },
  promptResponse: {
    marginTop: 16,
    marginBottom: 8,
  },
  textStyleContainer: {
    borderWidth: 1,
    marginRight: 25,
    borderColor: theme.borderColor + '20',
    padding: 20,
    paddingBottom: 10,
    paddingTop: 10,
    margin: 10,
    borderRadius: 20,
    backgroundColor: theme.backgroundColor,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
    marginLeft: 28,
  },
  promptTextWrapper: {
    borderRadius: 20,
    borderTopRightRadius: 4,
    backgroundColor: theme.tintColor,
    shadowColor: theme.tintColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  promptText: {
    color: theme.tintTextColor,
    fontFamily: theme.mediumFont,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  chatButton: {
    marginRight: 14,
    padding: 14,
    borderRadius: 99,
    backgroundColor: theme.tintColor,
    shadowColor: theme.tintColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  chatInputContainer: {
    paddingTop: 5,
    borderColor: theme.borderColor,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    color: theme.textColor,
    marginHorizontal: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    paddingRight: 50,
    borderColor: theme.borderColor + '30',
    fontFamily: theme.mediumFont,
    backgroundColor: theme.backgroundColor,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1
  },
  markdownStyle: {
    body: {
      color: theme.textColor,
      fontFamily: theme.regularFont
    },
    paragraph: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    heading1: {
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginVertical: 5
    },
    heading2: {
      marginTop: 20,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginBottom: 5
    },
    heading3: {
      marginTop: 20,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading4: {
      marginTop: 10,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading5: {
      marginTop: 10,
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginBottom: 5
    },
    heading6: {
      color: theme.textColor,
      fontFamily: theme.mediumFont,
      marginVertical: 5
    },
    list_item: {
      marginTop: 7,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      fontSize: 16,
    },
    ordered_list_icon: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    bullet_list: {
      marginTop: 10
    },
    ordered_list: {
      marginTop: 7
    },
    bullet_list_icon: {
      color: theme.textColor,
      fontSize: 16,
      fontFamily: theme.regularFont
    },
    code_inline: {
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: theme.lightFont
    },
    hr: {
      backgroundColor: 'rgba(255, 255, 255, .1)',
      height: 1,
    },
    fence: {
      marginVertical: 5,
      padding: 10,
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: theme.regularFont
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: 'rgba(255, 255, 255, .2)',
      flexDirection: 'row',
    },
    table: {
      marginTop: 7,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, .2)',
      borderRadius: 3,
    },
    blockquote: {
      backgroundColor: '#312e2e',
      borderColor: '#CCC',
      borderLeftWidth: 4,
      marginLeft: 5,
      paddingHorizontal: 5,
      marginVertical: 5,
    },
  } as any,
})