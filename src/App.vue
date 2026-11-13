<template>
  <v-app>
    <v-snackbar
      v-model="ui.showSnackbar"
      color="white"
      timeout="4000"
      location="top right"
      rounded="lg"
      elevation="0"
    >
      <div class="toast-row" :class="`toast-row--${ui.snackbarColor}`">
        <div class="toast-icon">
          <v-icon size="18" color="white">{{ toastIcon }}</v-icon>
        </div>
        <div class="toast-body">
          <p class="toast-title">{{ toastTitle }}</p>
          <p class="toast-message">{{ ui.message }}</p>
        </div>
        <button type="button" class="toast-close" aria-label="Cerrar" @click="ui.clearError">
          <v-icon size="16">mdi-close</v-icon>
        </button>
      </div>
    </v-snackbar>
    <v-overlay
        :model-value="ui.loading"
        class="d-flex align-center justify-center"
        persistent
      >
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        />
      </v-overlay>
    <router-view></router-view>
  </v-app>
</template>

<script>
import { useUiStore } from './store/ui';

  const TOAST_META = {
    success: { icon: 'mdi-check-circle', title: 'Éxito' },
    error: { icon: 'mdi-alert-circle', title: 'Error' },
    warning: { icon: 'mdi-alert', title: 'Atención' },
  };

  export default {
    name: "App",
    components: {},
    data() {
      return {
        ui: useUiStore(),
        drawer: true,
      }
    },
    computed: {
      toastIcon() {
        return TOAST_META[this.ui.snackbarColor]?.icon || 'mdi-information';
      },
      toastTitle() {
        return TOAST_META[this.ui.snackbarColor]?.title || 'Mensaje';
      },
    },
  }
</script>

<style scoped>
.toast-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 14px 14px 16px;
  position: relative;
}

.toast-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 3px;
  background: var(--toast-accent);
}

.toast-row--success {
  --toast-accent: rgb(var(--v-theme-success));
}

.toast-row--error {
  --toast-accent: rgb(var(--v-theme-error));
}

.toast-row--warning {
  --toast-accent: rgb(var(--v-theme-warning));
}

.toast-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--toast-accent);
  margin-left: 4px;
}

.toast-body {
  flex: 1 1 auto;
  min-width: 0;
  padding-top: 1px;
}

.toast-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #14171C;
  line-height: 1.3;
}

.toast-message {
  margin: 2px 0 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #565C66;
  line-height: 1.35;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #8A8F98;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  margin-top: 1px;
}

.toast-close:hover {
  background: #F1F1EF;
  color: #14171C;
}
</style>

<style>
.v-snackbar__wrapper {
  border-radius: 14px !important;
  box-shadow: 0 12px 28px -6px rgba(20, 23, 28, 0.16), 0 4px 10px rgba(20, 23, 28, 0.06) !important;
  min-width: 320px !important;
  max-width: 400px !important;
}

.v-snackbar__content {
  padding: 0 !important;
}
</style>
