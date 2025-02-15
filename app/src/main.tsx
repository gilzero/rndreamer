/**
 * @fileoverview Main application component that sets up the navigation structure and global UI elements.
 * Implements bottom tab navigation, theme-aware toast notifications, and safe area handling.
 * 
 * @see {@link ../context.tsx} for theme and app-wide state management
 * @see {@link ../screens/chat.tsx} for the main chat interface
 * @see {@link ../screens/settings.tsx} for the settings interface
 */

import { useContext } from 'react';
import { StyleSheet, View} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Chat, Settings } from './screens'
import { Header } from './components'
import FeatherIcon from '@expo/vector-icons/Feather'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { ThemeContext } from './context'
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

const Tab = createBottomTabNavigator()

/**
 * Generates theme-aware toast configurations for the application.
 * Provides styled toast components that adapt to the current theme.
 * 
 * Toast Types:
 * - success: Used for successful operations (e.g., message sent, settings saved)
 * - error: Used for error notifications (e.g., validation errors, network issues)
 * 
 * Error Display:
 * - text1: Short error title or type (e.g., "Connection Error")
 * - text2: Detailed error message
 * 
 * @param {object} theme - Current theme object containing colors and fonts
 * @returns {object} Toast configuration object with styled toast components
 * 
 * @see {@link ../services/chatService.ts} for error generation
 * @see {@link ../utils.ts} for validation error types
 */
function ToastConfig({ theme }: { theme: any }) {
  return {
    /**
     * Success toast component with theme-aware styling.
     * Used to display successful operation notifications.
     * 
     * Usage:
     * Toast.show({
     *   type: 'success',
     *   text1: 'Success Title',
     *   text2: 'Success message details'
     * })
     */
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: theme.tintColor,
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontFamily: theme.semiBoldFont,
          color: theme.textColor
        }}
        text2Style={{
          fontSize: 14,
          fontFamily: theme.regularFont,
          color: theme.textColor
        }}
      />
    ),
    /**
     * Error toast component with theme-aware styling and error-specific accents.
     * Used to display validation errors, network issues, and other error states.
     * 
     * Common Error Types:
     * - Validation errors (from MessageValidationError)
     * - Network connectivity issues
     * - API response errors
     * - Stream connection errors
     * 
     * Usage:
     * Toast.show({
     *   type: 'error',
     *   text1: 'Error Type',
     *   text2: 'Detailed error message'
     * })
     */
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: '#FF5252',
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontFamily: theme.semiBoldFont,
          color: theme.textColor
        }}
        text2Style={{
          fontSize: 14,
          fontFamily: theme.regularFont,
          color: theme.textColor
        }}
      />
    )
  }
};

/**
 * Main navigation component that implements the bottom tab navigation.
 * Handles screen navigation and applies theme-aware styling to the tab bar.
 */
function MainComponent() {
  const insets = useSafeAreaInsets()
  const { theme } = useContext(ThemeContext)
  const styles = getStyles({ theme, insets })
  
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.tabBarActiveTintColor,
          tabBarInactiveTintColor: theme.tabBarInactiveTintColor,
          tabBarStyle: {
            borderTopWidth: 0,
            backgroundColor: theme.backgroundColor,
            height: 85,
            paddingTop: 12,
            paddingBottom: insets.bottom + 8
          },
          tabBarLabelStyle: {
            paddingBottom: 6,
            fontSize: 12,
            fontFamily: theme.mediumFont
          }
        }}
      >
        <Tab.Screen
          name="Chat"
          component={Chat}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="message-circle"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{
            header: () => <Header />,
            tabBarIcon: ({ color, size }) => (
              <FeatherIcon
                name="sliders"
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

/**
 * Root component of the application.
 * Sets up the SafeAreaProvider and global toast notifications.
 */
export function Main() {
  const { theme } = useContext(ThemeContext)
  return (
    <SafeAreaProvider>
      <MainComponent />
      <Toast config={ToastConfig({ theme })} />
    </SafeAreaProvider>
  )
}

/**
 * Generates styles for the container component based on theme and safe area insets.
 * 
 * @param {object} theme - Current theme object containing colors and styling properties
 * @param {object} insets - Safe area insets for proper layout padding
 * @returns {object} StyleSheet object with container styles
 */
const getStyles = ({ theme, insets } : { theme: any, insets: any}) => StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },
})
