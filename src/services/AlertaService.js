import apiClient from "./ApiClient";
import { request } from "./request";

const BASE_PATH = '/api/alertas';

const AlertaService = {
  /**
   * Alertas más recientes primero. Requiere ALERT_READ.
   * @param {boolean|null} leida - false = solo no leídas, null = todas
   * @returns {Promise<{content: {id, clienteRuc, razonSocial, tipo, periodo, mensaje, leida, fechaCreacion}[], page, size, totalElements, totalPages}>}
   */
  getAlertas(leida, page, size) {
    return request(() => apiClient.get(BASE_PATH, { params: { leida, page, size } }));
  },

  /**
   * Se consulta en segundo plano cada cierto tiempo: si falla, no muestra el snackbar (sería repetitivo).
   * @returns {Promise<number>}
   */
  async getNoLeidasCount() {
    const response = await apiClient.get(`${BASE_PATH}/no-leidas/count`);
    return response.data.total;
  },

  marcarLeida(alertaId) {
    return request(() => apiClient.patch(`${BASE_PATH}/${alertaId}/leida`));
  },

  /** @returns {Promise<{marcadas: number}>} */
  marcarTodasLeidas() {
    return request(() => apiClient.patch(`${BASE_PATH}/leidas`));
  },
};

export default AlertaService;
