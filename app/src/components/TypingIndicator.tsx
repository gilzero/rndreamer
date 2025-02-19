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