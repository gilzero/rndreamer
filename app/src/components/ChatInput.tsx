import React from 'react';
import { View, TextInput, TouchableHighlight, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MESSAGE_LIMITS } from '../utils/messageUtils';

interface ChatInputProps {
  input: string;
  loading: boolean;
  theme: any;
  inputOpacity: Animated.Value;
  sendButtonScale: Animated.Value;
  onChangeText: (text: string) => void;
  onSend: () => void;
}

export const ChatInput = React.memo(({
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
          maxLength={MESSAGE_LIMITS.MAX_MESSAGE_LENGTH}
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
            {
              transform: [{ scale: sendButtonScale }]
            }
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.tintTextColor} />
          ) : (
            <Ionicons name="arrow-up-outline" size={20} color={theme.tintTextColor} />
          )}
        </Animated.View>
      </TouchableHighlight>
    </View>
  );
});

const getStyles = (theme: any) => StyleSheet.create({
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
  },
  inputLoading: {
    borderColor: theme.tintColor + '30',
  },
  chatButton: {
    marginRight: 14,
    padding: 14,
    borderRadius: 99,
    backgroundColor: theme.tintColor,
  },
  chatButtonDisabled: {
    backgroundColor: theme.tintColor + '50',
  }
}); 