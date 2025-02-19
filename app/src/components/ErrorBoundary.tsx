// filepath: app/src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEMES, APP_CONFIG } from '../config';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to your error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: APP_CONFIG.UI.SPACING.XLARGE,
    backgroundColor: THEMES.light.backgroundColor,
  },
  title: {
    fontSize: APP_CONFIG.UI.TYPOGRAPHY.XLARGE,
    fontWeight: 'bold',
    marginBottom: APP_CONFIG.UI.SPACING.MEDIUM,
    color: THEMES.light.textColor,
  },
  message: {
    textAlign: 'center',
    marginBottom: APP_CONFIG.UI.SPACING.XLARGE,
    color: THEMES.light.textColor,
  },
  button: {
    backgroundColor: THEMES.light.tintColor,
    padding: APP_CONFIG.UI.SPACING.MEDIUM,
    borderRadius: APP_CONFIG.UI.BORDER_RADIUS.SMALL,
  },
  buttonText: {
    color: '#fff',
    fontSize: APP_CONFIG.UI.TYPOGRAPHY.MEDIUM,
  },
});