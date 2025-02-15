import {
  StyleSheet, View, TouchableHighlight
} from 'react-native'
import { useContext } from 'react'
import { ThemeContext, AppContext } from '../../src/context'
import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

export function Header() {
  const { theme } = useContext(ThemeContext)
  const {
    handlePresentModalPress,
    clearChat
  } = useContext(AppContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <TouchableHighlight
        style={styles.leftButtonContainer}
        underlayColor={'transparent'}
        activeOpacity={0.6}
        onPress={handlePresentModalPress}
      >
        <FontAwesome6
          name="boxes-stacked"
          size={22}
          color={theme.textColor}
        />
      </TouchableHighlight>

      <FontAwesome6
        name="dove"
        size={28}
        color={theme.textColor}
      />

      <TouchableHighlight
        style={styles.rightButtonContainer}
        underlayColor={'transparent'}
        activeOpacity={0.6}
        onPress={clearChat}
      >
        <Ionicons
          name="add-circle-outline"
          size={24}
          color={theme.textColor}
        />
      </TouchableHighlight>
    </View>
  )
}

function getStyles(theme:any) {
  return StyleSheet.create({
    leftButtonContainer: {
      position: 'absolute',
      left: 15,
      padding: 15
    },
    rightButtonContainer: {
      position: 'absolute',
      right: 15,
      padding: 15
    },
    container: {
      paddingVertical: 15,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor
    }
  })
}