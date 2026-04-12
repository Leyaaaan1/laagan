import {useCallback} from 'react';
import {Alert} from 'react-native';
import {
  getErrorMessage,
  resolveErrorMessage,
} from '../utilities/validator/errorMessages';

/**
 * Hook for centralized error handling across the app
 */
export const useErrorHandler = () => {
  /**
   * Show alert error dialog
   */
  const showError = useCallback((title, message, onDismiss) => {
    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: onDismiss,
      },
    ]);
  }, []);

  /**
   * Show error from error object
   */
  const handleError = useCallback(
    (error, title = 'Error', onDismiss) => {
      const message = resolveErrorMessage(error);
      showError(title, message, onDismiss);
    },
    [showError],
  );

  /**
   * Show predefined error message
   */
  const showPredefinedError = useCallback(
    (category, key, title = 'Error', onDismiss) => {
      const message = getErrorMessage(category, key);
      showError(title, message, onDismiss);
    },
    [showError],
  );

  return {
    showError,
    handleError,
    showPredefinedError,
  };
};

export default useErrorHandler;
