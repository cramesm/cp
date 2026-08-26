import { useState, useRef } from 'react';

export const useModals = () => {
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [feedbackConfig, setFeedbackConfig] = useState(null);
  const isExecutingRef = useRef(false);

  const showConfirm = ({ title, message, onConfirm, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    setConfirmConfig({
      title,
      message,
      type,
      confirmText,
      cancelText,
      isLoading: false,
      onConfirm: async () => {
        if (isExecutingRef.current) return;
        isExecutingRef.current = true;
        setConfirmConfig(prev => (prev ? { ...prev, isLoading: true } : prev));
        try {
          if (onConfirm) await onConfirm();
        } catch (err) {
          console.error(err);
        } finally {
          isExecutingRef.current = false;
          setConfirmConfig(null);
        }
      }
    });
  };

  const showFeedback = ({ title, message, type = 'error' }) => {
    setFeedbackConfig({ title, message, type });
  };

  const closeConfirm = () => {
    if (!isExecutingRef.current) setConfirmConfig(null);
  };
  
  const closeFeedback = () => setFeedbackConfig(null);

  return {
    confirmConfig,
    feedbackConfig,
    showConfirm,
    showFeedback,
    closeConfirm,
    closeFeedback,
  };
};
