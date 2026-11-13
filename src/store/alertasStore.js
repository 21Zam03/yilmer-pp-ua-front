import { defineStore } from 'pinia';
import AlertaService from '@/services/AlertaService';

// Contador de alertas no leídas compartido por la campana y el Dashboard.
export const useAlertasStore = defineStore('alertas', {
  state: () => ({
    noLeidas: 0,
  }),
  actions: {
    async refreshCount() {
      try {
        this.noLeidas = await AlertaService.getNoLeidasCount();
      } catch (error) {
        // Silencioso: es una consulta de fondo y el 401 ya lo maneja el interceptor.
      }
    },
    // Actualización optimista al marcar una alerta: no espera a la siguiente consulta.
    descontar(cantidad = 1) {
      this.noLeidas = Math.max(0, this.noLeidas - cantidad);
    },
    reset() {
      this.noLeidas = 0;
    },
  },
});
