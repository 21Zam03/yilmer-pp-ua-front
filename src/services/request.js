import { useUiStore } from "@/store/ui";

/**
 * Muestra en el snackbar el mensaje de error del backend.
 * ErrorResponse = { status, message, detail }; los 401/403 de Spring Security traen { mensaje }.
 * Los 401 ya los maneja el interceptor de ApiClient (redirige al login).
 */
export function notifyError(error) {
  if (error.response?.status === 401) return;
  const ui = useUiStore();
  const data = error.response?.data;
  const message = data?.detail || data?.message || data?.mensaje
    || (error.request ? "Servidor no disponible" : "Error inesperado");
  ui.setError(message);
}

/** Ejecuta la llamada, devuelve response.data y, si falla, notifica el error y lo relanza. */
export async function request(call) {
  try {
    const response = await call();
    return response.data;
  } catch (error) {
    notifyError(error);
    throw error;
  }
}
