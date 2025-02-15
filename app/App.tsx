/**
 * @fileoverview Root application component that sets up the global app configuration.
 * @file-path app/App.tsx
 * Handles theme context, navigation, font loading, and bottom sheet modal management.
 */

import 'react-native-gesture-handler'
import './src/polyfills'
import { useState, useEffect, useRef, SetStateAction } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Main } from './src/main'
import { useFonts } from 'expo-font'
import { ThemeContext, AppContext } from './src/context'
import { lightTheme } from './src/theme'
import { MODELS } from './constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ChatModelModal } from './src/components/index'
import { Model, IThemeContext } from './types'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { StyleSheet, LogBox } from 'react-native'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

/**
 * Temporarily ignoring specific warnings:
 * 1. Image Picker Warning: This is kept as a placeholder for future implementation.
 *    When implementing image upload functionality:
 *    - Use result.canceled instead of result.cancelled
 *    - Example usage:
 *      const result = await ImagePicker.launchImageLibraryAsync();
 *      if (!result.canceled) {
 *        // Handle selected image
 *      }
 */
LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead'
])

/**
 * Root application component that initializes the app environment.
 * Manages global state, theme context, and navigation setup.
 * 
 * Features:
 * - Font loading and splash screen management
 * - Chat model selection and persistence
 * - Bottom sheet modal for model selection
 * - Theme context provider
 * - Navigation container
 * 
 * @returns {JSX.Element} The root application component
 */
export default function App() {
  const [chatType, setChatType] = useState<Model>(MODELS.gpt)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const clearChatRef = useRef<() => void>()
  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
    'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
    'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
    'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
    'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
    'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
    'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
    'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
    'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf')
  })

  useEffect(() => {
    configureStorage()
  }, [])

  useEffect(() => {
    async function hideSplashScreen() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync()
      }
    }
    hideSplashScreen()
  }, [fontsLoaded])

  /**
   * Loads persisted chat model selection from AsyncStorage.
   * Restores the last used chat model when the app starts.
   */
  async function configureStorage() {
    try {
      const _chatType = await AsyncStorage.getItem('rnai-chatType')
      if (_chatType) setChatType(JSON.parse(_chatType))
    } catch (err) {
      console.log('error configuring storage', err)
    }
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  /**
   * Closes the bottom sheet modal and updates visibility state.
   */
  function closeModal() {
    bottomSheetModalRef.current?.dismiss()
    setModalVisible(false)
  }

  /**
   * Toggles the bottom sheet modal visibility.
   * Handles both showing and hiding the modal.
   */
  function handlePresentModalPress() {
    if (modalVisible) {
      closeModal()
    } else {
      bottomSheetModalRef.current?.present()
      setModalVisible(true)
    }
  }

  /**
   * Updates the selected chat model and persists the selection.
   * Handles both direct model updates and state updater functions.
   * 
   * @param {SetStateAction<Model>} type - New model selection or update function
   */
  function _setChatType(type: SetStateAction<Model>) {
    setChatType(type)
    if (type instanceof Function) return
    AsyncStorage.setItem('rnai-chatType', JSON.stringify(type))
  }

  /**
   * Clears the current chat conversation.
   * Uses a ref to access the clear function from child components.
   */
  function clearChat() {
    clearChatRef.current?.()
  }

  const bottomSheetStyles = getBottomsheetStyles(lightTheme)

  if (!fontsLoaded) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContext.Provider
        value={{
          chatType,
          setChatType: _setChatType,
          handlePresentModalPress,
          closeModal,
          clearChat,
          clearChatRef
        }}
      >
        <ThemeContext.Provider value={{
          theme: lightTheme,
          themeName: 'light',
          setTheme: () => null
          }}>
          <ActionSheetProvider>
            <NavigationContainer>
              <Main />
            </NavigationContainer>
          </ActionSheetProvider>
          <BottomSheetModalProvider>
            <BottomSheetModal
                handleIndicatorStyle={bottomSheetStyles.handleIndicator}
                handleStyle={bottomSheetStyles.handle}
                backgroundStyle={bottomSheetStyles.background}
                ref={bottomSheetModalRef}
                enableDynamicSizing={true}
                backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1}/>}
                enableDismissOnClose
                enablePanDownToClose
                onDismiss={() => setModalVisible(false)}
              >
                <BottomSheetView>
                  <ChatModelModal
                    handlePresentModalPress={handlePresentModalPress}
                  />
                </BottomSheetView>
              </BottomSheetModal>
            </BottomSheetModalProvider>
        </ThemeContext.Provider>
      </AppContext.Provider>
    </GestureHandlerRootView>
  )
}

/**
 * Generates styles for the bottom sheet modal components.
 * Applies theme-aware styling to the bottom sheet elements.
 * 
 * @param {IThemeContext['theme']} theme - Current theme object
 * @returns {StyleSheet} Styles for bottom sheet components
 */
const getBottomsheetStyles = (theme: IThemeContext['theme']) => StyleSheet.create({
  background: {
    paddingHorizontal: 24,
    backgroundColor: theme.backgroundColor
  },
  handle: {
    marginHorizontal: 15,
    backgroundColor: theme.backgroundColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, .3)'
  }
})
