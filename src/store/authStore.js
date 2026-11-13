import { defineStore } from 'pinia';
import AuthService from '../services/AuthService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
  }),
  getters: {
    // Ej. hasPermission('CLIENT_CREATE'). El backend valida igual; esto solo oculta acciones en la UI.
    hasPermission: (state) => (permission) => !!state.user?.permissions?.includes(permission),
  },
  actions: {
    async fetchUser() {
      try {
        const user = await AuthService.validateSession();
        this.user = user;
      } catch (err) {
        this.user = null;
      }
    },
    addUser(user) {
      this.user = user;
    },
    deleteUser() {
      this.user = null;
    }
  },
});