/**
 * Contexts for theme and app-wide state management.
 * 
 * @filepath app/src/contexts/AppContexts.tsx
 */
import { createContext } from 'react'
import { 
  ThemeContext as IThemeContext, 
  AppContext as IAppContext,
  THEMES, 
  MODELS 
} from '../config'

export const ThemeContext = createContext<IThemeContext>({
  theme: THEMES.light,
  setTheme: () => null,
  themeName: ''
})

export const AppContext = createContext<IAppContext>({
  chatType: MODELS.gpt,
  setChatType: () => null,
  handlePresentModalPress: () => null,
  closeModal: () => null,
  clearChat: () => null,
  clearChatRef: { current: undefined }
}) 