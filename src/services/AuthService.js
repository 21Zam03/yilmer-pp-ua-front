import { useUiStore } from "@/store/ui";
import apiClient from "./ApiClient";

const AuthService = {
  /**
   * Envía credenciales al backend para iniciar sesión.
   * @param {Object} credentials - { username, password }
   * @returns {Promise<SignInResponse>} respuesta sin token
   */
  async signIn(credentials) {
    const ui = useUiStore();
    try {
      const response = await apiClient.post('/api/auth/signIn', credentials);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || (error.request? "Servidor no disponible" : "Error inesperado");
      ui.setError(message);
      throw error;
    }
  },

  /**
   * Valida la sesión leyendo la cookie con el token.
   * @returns {Promise<UserLoggedResponse>} datos del usuario logueado o error 401
   */
  async validateSession() {
    try {
      const response = await apiClient.get('/api/auth/validate');
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  /**
   * Cierra la sesión eliminando cookies desde el backend.
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await apiClient.post('/api/auth/signOut');
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};

export default AuthService;
