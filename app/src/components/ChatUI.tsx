// filepath: app/src/components/ChatUI.tsx
// file description: chat input and message components
import React, { memo } from 'react';
import { View, TextInput, TouchableHighlight, StyleSheet, Animated, ActivityIndicator, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Markdown from '@ronradtke/react-native-markdown-display';
import { ChatMessage as ChatMessageType, APP_CONFIG } from '../config';

// ChatInput Component
interface ChatInputProps {
  input: string;
  loading: boolean;
  theme: any;
  inputOpacity: Animated.Value;
  sendButtonScale: Animated.Value;
  onChangeText: (text: string) => void;
  onSend: () => void;
}

export const ChatInput = memo(({
  input,
  loading,
  theme,
  inputOpacity,
  sendButtonScale,
  onChangeText,
  onSend
}: ChatInputProps) => {
  const styles = getStyles(theme);

  return (
    <View style={styles.chatInputContainer}>
      <Animated.View style={{ flex: 1, opacity: inputOpacity }}>
        <TextInput
          style={[styles.input, loading && styles.inputLoading]}
          onChangeText={onChangeText}
          placeholder={loading ? 'AI is thinking...' : 'Message'}
          placeholderTextColor={theme.placeholderTextColor + '80'}
          value={input}
          maxLength={APP_CONFIG.VALIDATION.MESSAGES.MAX_LENGTH}
          editable={!loading}
          accessible={true}
          accessibilityLabel="Message input field"
          accessibilityHint={loading ? "AI is generating response" : "Enter your message"}
        />
      </Animated.View>
      <TouchableHighlight
        underlayColor={'transparent'}
        activeOpacity={0.65}
        onPress={onSend}
        disabled={loading || !input.trim()}
        accessible={true}
        accessibilityLabel={loading ? "AI is responding" : "Send message"}
        accessibilityHint={loading ? "Please wait" : "Send your message to the AI"}
      >
        <Animated.View
          style={[
            styles.chatButton,
            loading && styles.chatButtonDisabled,
            { transform: [{ scale: sendButtonScale }] }
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.tintTextColor} />
          ) : (
            <Ionicons name="arrow-up-outline" size={APP_CONFIG.UI.SIZES.ICON.MEDIUM} color={theme.tintTextColor} />
          )}
        </Animated.View>
      </TouchableHighlight>
    </View>
  );
});

// ChatMessage Component
interface ChatMessageProps {
  item: ChatMessageType;
  theme: any;
  onPressOptions: (content: string) => void;
}

export const ChatMessage = memo(({ item, theme, onPressOptions }: ChatMessageProps) => {
  const styles = getStyles(theme);

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
          {item.model && (
            <View style={styles.modelIndicator}>
              <Text style={styles.modelName}>{item.model}</Text>
            </View>
          )}
          <Markdown style={styles.markdownStyle as any}>{item.content}</Markdown>
          <TouchableHighlight
            onPress={() => onPressOptions(item.content)}
            underlayColor={'transparent'}
            accessible={true}
            accessibilityLabel="Message options"
            accessibilityHint="Show options to copy message or clear chat"
          >
            <View style={styles.optionsIconWrapper}>
              <Ionicons name="apps" size={20} color={theme.textColor} />
            </View>
          </TouchableHighlight>
        </View>
      )}
    </Animated.View>
  );
});

// TypingIndicator Component
interface TypingIndicatorProps {
  theme: any;
  typingDots: Animated.Value[];
  modelDisplayName: string;
}

export const TypingIndicator = memo(({ theme, typingDots, modelDisplayName }: TypingIndicatorProps) => {
  const styles = getStyles(theme);

  return (
    <View style={styles.typingIndicatorContainer}>
      <View style={styles.typingIndicatorContent}>
        <View style={styles.modelIconContainer}>
          <Text style={styles.modelIcon}>{modelDisplayName[0]}</Text>
        </View>
        <View style={styles.dotsContainer}>
          {typingDots.map((dot, index) => (
            <Animated.View
              key={index}
              style={[
                styles.typingDot,
                {
                  opacity: dot,
                  transform: [{
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4]
                    })
                  }]
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

// Shared styles
const getStyles = (theme: any) => StyleSheet.create({
  // ChatInput styles
  chatInputContainer: {
    paddingTop: APP_CONFIG.UI.INPUT.PADDING.VERTICAL,
    borderColor: theme.borderColor,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: APP_CONFIG.UI.INPUT.PADDING.VERTICAL
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: APP_CONFIG.UI.INPUT.BORDER_RADIUS,
    color: theme.textColor,
    marginHorizontal: APP_CONFIG.UI.SPACING.MEDIUM,
    paddingVertical: APP_CONFIG.UI.SPACING.MEDIUM,
    paddingHorizontal: APP_CONFIG.UI.SPACING.XLARGE,
    paddingRight: 50,
    borderColor: theme.borderColor + '30',
    fontFamily: theme.mediumFont,
    backgroundColor: theme.backgroundColor,
  },
  inputLoading: {
    borderColor: theme.tintColor + '30',
  },
  chatButton: {
    marginRight: APP_CONFIG.UI.SPACING.MEDIUM,
    padding: APP_CONFIG.UI.SPACING.MEDIUM,
    borderRadius: 99,
    backgroundColor: theme.tintColor,
  },
  chatButtonDisabled: {
    backgroundColor: theme.tintColor + '50',
  },

  // ChatMessage styles
  promptResponse: {
    marginTop: APP_CONFIG.UI.SPACING.LARGE,
    marginBottom: APP_CONFIG.UI.SPACING.SMALL,
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
  modelIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    opacity: 0.7
  },
  modelName: {
    color: theme.textColor,
    fontSize: 12,
    fontFamily: theme.mediumFont,
    opacity: 0.8
  },
  optionsIconWrapper: {
    padding: APP_CONFIG.UI.SPACING.MEDIUM,
    paddingTop: 10,
    alignItems: 'flex-end',
    opacity: 0.8
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
    code_inline: {
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: theme.lightFont
    },
    fence: {
      marginVertical: 5,
      padding: 10,
      color: theme.secondaryTextColor,
      backgroundColor: theme.secondaryBackgroundColor,
      borderColor: 'rgba(255, 255, 255, .1)',
      fontFamily: theme.regularFont
    }
  } as any,

  // TypingIndicator styles
  typingIndicatorContainer: {
    paddingHorizontal: APP_CONFIG.UI.SPACING.XLARGE,
    paddingVertical: APP_CONFIG.UI.SPACING.MEDIUM,
  },
  typingIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },
  modelIconContainer: {
    width: APP_CONFIG.UI.SIZES.TYPING_INDICATOR.WIDTH,
    height: APP_CONFIG.UI.SIZES.TYPING_INDICATOR.HEIGHT,
    borderRadius: APP_CONFIG.UI.BORDER_RADIUS.LARGE,
    backgroundColor: theme.tintColor + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: APP_CONFIG.UI.SPACING.MEDIUM,
  },
  modelIcon: {
    color: theme.tintColor,
    fontSize: APP_CONFIG.UI.TYPOGRAPHY.SMALL,
    fontFamily: theme.mediumFont,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    borderRadius: APP_CONFIG.UI.BORDER_RADIUS.LARGE,
    paddingHorizontal: APP_CONFIG.UI.SPACING.MEDIUM,
    paddingVertical: APP_CONFIG.UI.SPACING.SMALL,
    borderWidth: 1,
    borderColor: theme.borderColor + '20',
  },
  typingDot: {
    width: APP_CONFIG.UI.SIZES.TYPING_INDICATOR.DOT_SIZE,
    height: APP_CONFIG.UI.SIZES.TYPING_INDICATOR.DOT_SIZE,
    borderRadius: APP_CONFIG.UI.BORDER_RADIUS.SMALL,
    backgroundColor: theme.tintColor,
    marginHorizontal: APP_CONFIG.UI.SPACING.TINY,
  }
}); 