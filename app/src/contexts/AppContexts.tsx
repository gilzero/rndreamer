/**
 * Contexts for theme and app-wide state management.
 * 
 * @filepath app/src/contexts/AppContexts.tsx
 * @see {@link ../../config.ts} for context types
 * @see {@link ../../constants.ts} for theme and model definitions
 */
import { createContext } from 'react'
import { IThemeContext, IAppContext } from '../config'
import { THEMES, MODELS } from '../config'

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