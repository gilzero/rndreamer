// filepath: app/src/components/ChatMessage.tsx
import React, { memo } from 'react';
import { View, Text, TouchableHighlight, StyleSheet, Animated } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ChatMessage as ChatMessageType } from '../../types';

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

const getStyles = (theme: any) => StyleSheet.create({
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
    padding: 12,
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
  } as any
}); 