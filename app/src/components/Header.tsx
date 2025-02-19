/**
 * Application header component with navigation and action buttons.
 * 
 * @filepath app/src/components/Header.tsx
 */
import { StyleSheet, View, TouchableHighlight } from 'react-native';
import { useContext } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { ThemeContext, AppContext } from '../contexts';
import { THEMES, APP_CONFIG } from '../config';

export function Header() {
  const { theme } = useContext(ThemeContext)
  const {
    handlePresentModalPress,
    clearChat
  } = useContext(AppContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <TouchableHighlight
          style={styles.button}
          underlayColor={'transparent'}
          activeOpacity={0.6}
          onPress={handlePresentModalPress}
        >
          <FontAwesome6
            name="boxes-stacked"
            size={APP_CONFIG.UI.SIZES.ICON.MEDIUM}
            color={theme.textColor}
          />
        </TouchableHighlight>

        <FontAwesome6
          name="dove"
          size={APP_CONFIG.UI.SIZES.ICON.LARGE}
          color={theme.textColor}
        />

        <TouchableHighlight
          style={styles.button}
          underlayColor={'transparent'}
          activeOpacity={0.6}
          onPress={clearChat}
        >
          <Ionicons
            name="add-circle-outline"
            size={APP_CONFIG.UI.SIZES.ICON.MEDIUM}
            color={theme.textColor}
          />
        </TouchableHighlight>
      </View>
    </View>
  )
}

function getStyles(theme: typeof THEMES.light) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundColor,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
      paddingVertical: APP_CONFIG.UI.SPACING.MEDIUM,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: APP_CONFIG.UI.SPACING.MEDIUM,
    },
    button: {
      padding: APP_CONFIG.UI.SPACING.MEDIUM,
    }
  })
}