/**
 * @fileoverview Settings screen component that allows users to select and configure AI chat models.
 * Provides a UI for switching between different AI providers (GPT, Claude, Gemini) and manages model selection state.
 */

import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  ScrollView
} from 'react-native'
import { useContext } from 'react'
import { AppContext, ThemeContext } from '../context'
import {
  AnthropicIcon,
  OpenAIIcon,
  GeminiIcon
} from '../components/index'
import { IIconProps } from '../../types'
import { MODELS } from '../../constants'

/** Array of available AI models from constants */
const models = Object.values(MODELS)

/**
 * Settings component that provides model selection interface.
 * Allows users to switch between different AI providers and displays current selection.
 * @component
 */
export function Settings() {
  const { theme } = useContext(ThemeContext)
  const { chatType, setChatType } = useContext(AppContext)
  const styles = getStyles(theme)

  /**
   * Renders the appropriate icon component based on the AI model type
   * @param {IIconProps} props - Icon properties including type and style props
   * @returns {React.ReactElement} The corresponding icon component for the AI model
   */
  function renderIcon({
    type, props
  }: IIconProps) {
    const iconProps = {
      size: props['size'] as number,
      theme: props['theme'],
      selected: props['selected'] as boolean
    }
    
    if (type.includes('gpt')) {
      return <OpenAIIcon {...iconProps} />
    }
    if (type.includes('claude')) {
      return <AnthropicIcon {...iconProps} />
    }
    if (type.includes('gemini')) {
      return <GeminiIcon {...iconProps} />
    }
    return null; // Default return for unknown types
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.mainText}>Chat Model</Text>
      </View>
      <View style={styles.buttonContainer}>
        {
          models.map((model, index) => {
            return (
              <TouchableHighlight
                key={index}
                underlayColor='transparent'
                onPress={() => {
                  setChatType(model)
                }}
              >
                <View
                  style={{...styles.chatChoiceButton, ...getDynamicViewStyle(chatType.label, model.label, theme)}}
                >
                {
                  renderIcon({
                    type: model.label,
                    props: {
                      theme,
                      size: 18,
                      style: {marginRight: 8},
                      selected: chatType.label === model.label
                    }
                  })
                }
                <Text
                  style={{...styles.chatTypeText, ...getDynamicTextStyle(chatType.label, model.label, theme)}}
                >
                  { model.displayName }
                </Text>
              </View>
            </TouchableHighlight>
            )
          })
        }
      </View>
    </ScrollView>
  )
}

/**
 * Generates dynamic text styles based on selection state
 * @param {string} baseType - Currently selected model type
 * @param {string} type - Model type to compare against
 * @param {any} theme - Current theme object
 * @returns {object} Dynamic text style object
 */
function getDynamicTextStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      color: theme.tintTextColor,
    }
  } else return {}
}

/**
 * Generates dynamic view styles based on selection state
 * @param {string} baseType - Currently selected model type
 * @param {string} type - Model type to compare against
 * @param {any} theme - Current theme object
 * @returns {object} Dynamic view style object
 */
function getDynamicViewStyle(baseType:string, type:string, theme:any) {
  if (type === baseType) {
    return {
      backgroundColor: theme.tintColor
    }
  } else return {}
}

/**
 * Generates component styles based on current theme
 * @param {any} theme - Current theme object containing colors and fonts
 * @returns {StyleSheet} StyleSheet object with component styles
 */
const getStyles = (theme:any) => StyleSheet.create({
  contentContainer: {
    paddingBottom: 50
  },
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor
  },
  titleContainer: {
    marginTop: 25,
    marginBottom: 14,
    paddingHorizontal: 14
  },
  mainText: {
    color: theme.textColor,
    fontSize: 18,
    fontFamily: theme.boldFont
  },
  chatChoiceButton: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    alignItems: 'center'
  },
  chatTypeText: {
    color: theme.textColor,
    fontSize: 16,
    fontFamily: theme.mediumFont
  },
  buttonContainer: {
    marginBottom: 15
  }
})