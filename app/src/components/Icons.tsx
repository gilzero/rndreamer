// filepath: app/src/components/Icons.tsx
import Svg, { Path, G } from 'react-native-svg';
import { IconProps } from '../../types';
import { Theme } from '../../types';
import React from 'react';

// Define a default theme value for the Icon component
const defaultTheme: Theme = {
  name: 'light',
  backgroundColor: '#fff',
  textColor: '#000',
  tintColor: '#0281ff',
  tintTextColor: '#fff',
  borderColor: '#eee',
  tabBarActiveTintColor: '#0281ff',
  tabBarInactiveTintColor: '#999',
  placeholderTextColor: '#999',
  secondaryBackgroundColor: '#f5f5f5',
  secondaryTextColor: '#666',
  regularFont: 'Geist-Regular',
  mediumFont: 'Geist-Medium',
  semiBoldFont: 'Geist-SemiBold',
  boldFont: 'Geist-Bold',
  lightFont: 'Geist-Light'
};

/**
 * Icon components for the application.
 * Includes model-specific icons and generic app icons.
 * 
 * @see {@link ../../constants.ts} for theme types
 * @see {@link ../../types.ts} for icon props
 */

/**
 * Generic app icon component
 * @param size - Icon size in pixels (default: 100)
 * @param fill - Icon fill color (default: 'black')
 */
export function Icon({
  size = 100,
  fill = 'black',
  theme = defaultTheme,
  selected,
  ...props
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1200 1200" {...props}>
      <G>
        <Path fill={fill} d="m632.62 175.12 236.62 744h216.75z"/>
        <Path fill={fill} d="m609.38 163.88v755.25h240.38z"/>
        <Path fill={fill} d="m590.62 919.12v-755.25l-240.38 755.25z"/>
        <Path fill={fill} d="m114 919.12h216.75l236.62-744z"/>
        <Path fill={fill} d="m106.88 937.88h221.25v98.25h-221.25z"/>
        <Path fill={fill} d="m346.88 937.88h243.75v93.75h-243.75z"/>
        <Path fill={fill} d="m609.38 937.88h243.75v93.75h-243.75z"/>
        <Path fill={fill} d="m871.88 937.88h221.25v98.25h-221.25z"/>
      </G>
    </Svg>
  )
}

/**
 * AI Model Provider Icons
 * These icons are used to represent different AI model providers in the UI
 */

/**
 * Add proper typing for icon props
 */
interface BaseIconProps extends IconProps {
  size?: number;
  theme: Theme;
  selected?: boolean;
}

/**
 * Extract common icon logic
 */
const BaseModelIcon: React.FC<BaseIconProps> = ({ 
  size = 24,
  theme,
  selected,
  children,
  ...props
}) => {
  return (
    <Svg
      width={size}
      height={size}
      {...props}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child as React.ReactElement, {
          fill: selected ? theme.tintTextColor : theme.textColor
        })
      )}
    </Svg>
  );
};

/**
 * OpenAI's GPT model icon
 * @param size - Icon size in pixels (default: 24)
 * @param theme - Current theme object for colors
 * @param selected - Whether the icon is in selected state
 */
export const OpenAIIcon: React.FC<BaseIconProps> = (props) => (
  <BaseModelIcon {...props}>
    <Path
      d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.7664.7664 0 0 0-.3927-.6765zm.0662-4.4944a4.4992 4.4992 0 0 1 .0615 1.6464l-.142-.0852-4.7782-2.7582a.7712.7712 0 0 0-.7806 0L7.8532 9.3277V7.0001a.071.071 0 0 1 .038-.052l4.8303-2.7865a4.504 4.504 0 0 1 6.1408 1.6464zM12.2921.6035a4.4944 4.4944 0 0 1 2.8764 1.0408l-.142.0852L10.2482 4.488a.7948.7948 0 0 0-.3927.6813v6.7369l-2.02-1.1685a.0804.0804 0 0 1-.038-.0615V4.6035a4.504 4.504 0 0 1 4.4945-4.4944zm4.4945 7.872a.7759.7759 0 0 0-.3879-.6765L10.5842 4.488l2.02-1.1685a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4992 4.4992 0 0 1 2.0201 3.696 4.4944 4.4944 0 0 1-2.7913 3.9498z"
      fill={props.selected ? props.theme.tintTextColor : props.theme.textColor}
    />
  </BaseModelIcon>
);

/**
 * Anthropic's Claude model icon
 * @param size - Icon size in pixels (default: 24)
 * @param theme - Current theme object for colors
 * @param selected - Whether the icon is in selected state
 */
export function AnthropicIcon({
  size = 24,
  theme,
  selected,
  ...props
}: IconProps) {
  const fill = selected ? theme.tintTextColor : theme.textColor
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 46 32"
    >
      <Path
        d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264Zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668Z"
        fill={fill}
      />
    </Svg>
  )
}

/**
 * Google's Gemini model icon
 * @param size - Icon size in pixels (default: 24)
 * @param theme - Current theme object for colors
 * @param selected - Whether the icon is in selected state
 */
export function GeminiIcon({
  size = 24,
  theme,
  selected,
  ...props
}: IconProps) {
  const fill = selected ? theme.tintTextColor : theme.textColor
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 73 73"
    >
      <G>
        <Path
          fill={fill}
          d="M36.3745 72.7592C33.5275 53.9722 18.7819 39.2266 -0.00512695 36.3796C18.7819 33.5327 33.5275 18.787 36.3745 0C39.2214 18.787 53.9671 33.5327 72.7541 36.3796C53.9671 39.2266 39.2214 53.9722 36.3745 72.7592Z"
        />
      </G>
    </Svg>
  )
}
