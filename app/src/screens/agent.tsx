// filepath: app/src/screens/agent.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ThemeContext } from '../contexts/AppContexts'
import { useContext } from 'react'
import { THEMES } from '../../constants'

export function Agent() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <Text style={styles.text}>AI Agents coming in next update, stay tuned! 🥷</Text>
    </View>
  )
}

const getStyles = (theme: typeof THEMES.light) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundColor
  },
  text: {
    color: theme.textColor,
    fontSize: 18,
    fontFamily: theme.mediumFont
  }
}) 