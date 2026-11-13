import apiClient from "./ApiClient";
import { notifyError, request } from "./request";

const BASE_PATH = '/api/sire';

const SireService = {
  /**
   * Ventas ya sincronizadas del periodo (lee la BD, no llama a SUNAT).
   * @param {string} ruc
   * @param {string} periodo - yyyyMM
   * @param {string|null} searchKey - nombre, documento, serie o número del comprador
   * @returns {Promise<{ruc, periodo, ultimaSincronizacion: TicketSire|null,
   *   resumen: {cantidad, baseImponible, igv, importeTotal},
   *   ventas: {content: VentaSire[], page, size, totalElements, totalPages}}>}
   */
  getVentas(ruc, periodo, searchKey, page, size) {
    return request(() => apiClient.get(`${BASE_PATH}/ventas`, {
      params: { ruc, periodo, searchKey: searchKey || null, page, size },
    }));
  },

  /**
   * Pide a SUNAT la propuesta del periodo (202 Accepted). Devuelve el ticket a consultar con getEstadoTicket;
   * si ya había una sincronización en curso para ese cliente y periodo, devuelve ese mismo ticket.
   */
  sincronizarVentas(ruc, periodo) {
    return request(() => apiClient.post(`${BASE_PATH}/ventas/sincronizar`, { ruc, periodo }));
  },

  /**
   * Descarga el Excel de ventas del periodo y lo guarda en el equipo.
   * @param {'BOLETAS'|'FACTURAS'|'TODOS'} tipo - las notas de crédito/débito van con el comprobante que modifican
   */
  async exportarVentas(ruc, periodo, tipo) {
    let response;
    try {
      response = await apiClient.get(`${BASE_PATH}/ventas/exportar`, {
        params: { ruc, periodo, tipo },
        responseType: 'blob',
      });
    } catch (error) {
      // Con responseType 'blob' el error del backend también llega como Blob: se pasa a JSON para mostrar su mensaje.
      if (error.response?.data instanceof Blob) {
        try {
          error.response.data = JSON.parse(await error.response.data.text());
        } catch (parseError) {
          // No era JSON: queda el mensaje genérico.
        }
      }
      notifyError(error);
      throw error;
    }

    const disposition = response.headers['content-disposition'] || '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    const nombre = match ? decodeURIComponent(match[1]) : `Ventas_${ruc}_${periodo}.xlsx`;

    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return nombre;
  },

  /**
   * Sincronización automática de ventas del cliente (siempre del mes anterior).
   * @returns {Promise<{ruc, tipo, activo, intervaloHoras: number|null, proximaEjecucion, ultimaEjecucion,
   *   erroresConsecutivos, ultimoError}>}
   */
  getProgramacionVentas(ruc) {
    return request(() => apiClient.get(`${BASE_PATH}/ventas/programacion`, { params: { ruc } }));
  },

  /** @param {number} intervaloHoras - 1, 3, 6, 12 o 24 */
  guardarProgramacionVentas(ruc, activo, intervaloHoras) {
    return request(() => apiClient.put(`${BASE_PATH}/ventas/programacion`, { ruc, activo, intervaloHoras }));
  },

  /** @returns {Promise<{ticketId, estado, enProceso, mensaje, cantidadRegistros, fechaActualizacion, ...}>} */
  getEstadoTicket(ticketId) {
    return request(() => apiClient.get(`${BASE_PATH}/tickets/${ticketId}/estado`));
  },
};

export default SireService;
