// filepath: app/src/components/TypingIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { APP_CONFIG } from '../config';

interface TypingIndicatorProps {
  theme: any;
  typingDots: Animated.Value[];
  modelDisplayName: string;
}

export const TypingIndicator = React.memo(({ 
  theme, 
  typingDots,
  modelDisplayName 
}: TypingIndicatorProps) => {
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

const getStyles = (theme: any) => StyleSheet.create({
  typingIndicatorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  typingIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%',
  },
  modelIconContainer: {
    width: APP_CONFIG.UI.SIZES.TYPING_INDICATOR.WIDTH,
    height: APP_CONFIG.UI.SIZES.TYPING_INDICATOR.HEIGHT,
    borderRadius: 14,
    backgroundColor: theme.tintColor + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modelIcon: {
    color: theme.tintColor,
    fontSize: 14,
    fontFamily: theme.mediumFont,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.borderColor + '20',
  },
  typingDot: {
    width: APP_CONFIG.UI.SIZES.TYPING_INDICATOR.DOT_SIZE,
    height: APP_CONFIG.UI.SIZES.TYPING_INDICATOR.DOT_SIZE,
    borderRadius: 3,
    backgroundColor: theme.tintColor,
    marginHorizontal: 3,
  }
}); 