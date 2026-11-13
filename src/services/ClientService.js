import apiClient from "./ApiClient";
import { request } from "./request";

const BASE_PATH = '/api/clients';

const ClientService = {
  /**
   * Lista paginada de clientes.
   * @param {number} page - página (base 0)
   * @param {number} size - filas por página
   * @param {string|null} searchKey - razón social, RUC, contacto, correo o teléfono
   * @param {boolean|null} active - true/false o null para todos
   * @returns {Promise<{content: ClientResponse[], page, size, totalElements, totalPages}>}
   */
  getClients(page, size, searchKey, active) {
    return request(() => apiClient.get(BASE_PATH, {
      params: { page, size, searchKey: searchKey || null, active },
    }));
  },

  /** @returns {Promise<{total, active, inactive}>} */
  getStats() {
    return request(() => apiClient.get(`${BASE_PATH}/stats`));
  },

  getClient(clientId) {
    return request(() => apiClient.get(`${BASE_PATH}/${clientId}`));
  },

  createClient(client) {
    return request(() => apiClient.post(BASE_PATH, client));
  },

  /** Si client.solPassword viene vacío, el backend conserva la clave SOL actual. */
  updateClient(clientId, client) {
    return request(() => apiClient.put(`${BASE_PATH}/${clientId}`, client));
  },

  updateStatus(clientId, enabled) {
    return request(() => apiClient.patch(`${BASE_PATH}/${clientId}/status`, null, { params: { enabled } }));
  },

  deleteClient(clientId) {
    return request(() => apiClient.delete(`${BASE_PATH}/${clientId}`));
  },
};

export default ClientService;
