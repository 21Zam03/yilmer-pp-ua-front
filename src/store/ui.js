import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    loading: false,
    showSnackbar: false,
    message: null,
    snackbarColor: "error"
  }),
  actions: {
    showSpinner() {
      this.loading = true;
    },
    hideSpinner() {
      this.loading = false;
    },
    setError(message) {
      this.message = message;
      this.snackbarColor = "error";
      this.showSnackbar = true;
    },

    setSuccess(message) {
      this.message = message;
      this.snackbarColor = "success";
      this.showSnackbar = true;
    },

    setWarning(message) {
      this.message = message;
      this.snackbarColor = "warning";
      this.showSnackbar = true;
    },

    clearError() {
      this.message = null;
      this.showSnackbar = false;
    }
  },
});