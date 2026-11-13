import apiClient from "./ApiClient";
import { request } from "./request";

const BASE_PATH = '/api/dashboard';

const DashboardService = {
  /** Requiere CLIENT_READ. @returns {Promise<{total, activos, inactivos, activosSinCredencialesApi}>} */
  getResumenClientes() {
    return request(() => apiClient.get(`${BASE_PATH}/clientes`));
  },

  /**
   * Requiere SIRE_READ. Ventas del mes anterior (todos los clientes), tendencia de 12 meses,
   * sincronizaciones de los últimos 7 días y programaciones automáticas.
   * @returns {Promise<{periodo, ventasPeriodo, clientesConVentas, topClientes, tendencia, sincronizaciones, programaciones}>}
   */
  getResumenSire() {
    return request(() => apiClient.get(`${BASE_PATH}/sire`));
  },
};

export default DashboardService;
