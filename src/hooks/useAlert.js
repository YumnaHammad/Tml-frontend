import React, { useState } from 'react';
import AlertDialog from '../components/AlertDialog';

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null
  });

  const showAlert = ({
    title,
    message,
    type = 'warning',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    onConfirm = null
  }) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancel,
      onConfirm
    });
  };

  const showConfirm = ({
    title,
    message,
    confirmText = 'Yes',
    cancelText = 'No',
    onConfirm
  }) => {
    showAlert({
      title,
      message,
      type: 'warning',
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm
    });
  };

  const showSuccess = ({
    title = 'Success!',
    message,
    onConfirm = null
  }) => {
    showAlert({
      title,
      message,
      type: 'success',
      confirmText: 'OK',
      showCancel: false,
      onConfirm
    });
  };

  const showError = ({
    title = 'Error!',
    message,
    onConfirm = null
  }) => {
    showAlert({
      title,
      message,
      type: 'error',
      confirmText: 'OK',
      showCancel: false,
      onConfirm
    });
  };

  const showInfo = ({
    title = 'Information',
    message,
    onConfirm = null
  }) => {
    showAlert({
      title,
      message,
      type: 'info',
      confirmText: 'OK',
      showCancel: false,
      onConfirm
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const AlertComponent = () => {
    return React.createElement(AlertDialog, {
      isOpen: alertState.isOpen,
      onClose: hideAlert,
      title: alertState.title,
      message: alertState.message,
      type: alertState.type,
      confirmText: alertState.confirmText,
      cancelText: alertState.cancelText,
      showCancel: alertState.showCancel,
      onConfirm: alertState.onConfirm
    });
  };

  return {
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showInfo,
    hideAlert,
    AlertComponent
  };
};
