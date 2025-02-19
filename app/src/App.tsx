/**
 * @fileoverview Root application component that sets up the global app configuration.
 * @filepath app/App.tsx
 * 
 * Handles:
 * - Theme context and provider
 * - App-wide context and provider
 * - Navigation setup
 * - Font loading
 * - Bottom sheet modal management
 * 
 * @see {@link ./constants.ts} for theme definitions
 * @see {@link ./types.ts} for type definitions
 */

import 'react-native-gesture-handler';
import { ReadableStream } from 'web-streams-polyfill';

// Add ReadableStream polyfill for streaming functionality
if (typeof global.ReadableStream === 'undefined') {
  (global as any).ReadableStream = ReadableStream;
}

import { useState, useEffect, useRef, SetStateAction } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';

import { MainNavigator } from './navigation';
import { Model, MODELS, THEMES, FONTS, getBottomSheetStyles, APP_CONFIG, DEFAULT_PROVIDER, ModelProvider } from './config';
import { AIModelsModal } from './components/index';
import { ThemeContext, AppContext } from './contexts';
import { ErrorBoundary } from './components';

const { STORAGE_KEYS } = APP_CONFIG;

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
 * Extract context initialization logic
 * @returns {Object} - An object containing chatType, setChatType, currentTheme, and setCurrentTheme
 */
const useAppConfiguration = () => {
  const defaultProvider = DEFAULT_PROVIDER as ModelProvider;
  const [chatType, setChatType] = useState<Model>(MODELS[defaultProvider] || MODELS.gpt);
  const [currentTheme, setCurrentTheme] = useState(THEMES.light);
  
  useEffect(() => {
    async function loadConfiguration() {
      try {
        const [savedChatType, savedTheme] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.CHAT_TYPE),
          AsyncStorage.getItem(STORAGE_KEYS.THEME)
        ]);
        
        if (savedChatType) setChatType(JSON.parse(savedChatType));
        if (savedTheme) setCurrentTheme(JSON.parse(savedTheme));
      } catch (err) {
        console.error('Failed to load configuration:', err);
      }
    }
    
    loadConfiguration();
  }, []);

  return { chatType, setChatType, currentTheme, setCurrentTheme };
};

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
const App: React.FC = () => {
  const { chatType, setChatType, currentTheme, setCurrentTheme } = useAppConfiguration();
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const clearChatRef = useRef<() => void>()
  const [fontsLoaded] = useFonts(FONTS)

  useEffect(() => {
    async function hideSplashScreen() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync()
      }
    }
    hideSplashScreen()
  }, [fontsLoaded])

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
    AsyncStorage.setItem(STORAGE_KEYS.CHAT_TYPE, JSON.stringify(type))
  }

  /**
   * Updates the current theme and persists the selection.
   */
  const _setCurrentTheme = (theme: SetStateAction<typeof THEMES.light>) => {
    setCurrentTheme(theme)
    if (theme instanceof Function) return
    AsyncStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme))
  }

  /**
   * Clears the current chat conversation.
   * Uses a ref to access the clear function from child components.
   */
  function clearChat() {
    clearChatRef.current?.()
  }

  const bottomSheetStyles = getBottomSheetStyles(currentTheme)

  if (!fontsLoaded) return null
  return (
    <ErrorBoundary>
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
            theme: currentTheme,
            themeName: currentTheme.name,
            setTheme: _setCurrentTheme
          }}>
            <ActionSheetProvider>
              <NavigationContainer>
                <MainNavigator />
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
                  <AIModelsModal
                    handlePresentModalPress={handlePresentModalPress}
                  />
                </BottomSheetView>
              </BottomSheetModal>
            </BottomSheetModalProvider>
          </ThemeContext.Provider>
        </AppContext.Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}

export default App
