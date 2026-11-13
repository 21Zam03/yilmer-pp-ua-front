import axios from "axios";
import { API_BASE_URL } from "../config";
import { useUiStore } from "../store/ui";
import router from "@/router";
import { useAuthStore } from "@/store/authStore";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  //timeout: 15000,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const ui = useUiStore();
  ui.showSpinner();
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const ui = useUiStore();
    ui.hideSpinner();
    return response;
  },
  (error) => {
    const ui = useUiStore();
    const authStore = useAuthStore();
    ui.hideSpinner();
    
    const is401 = error.response?.status === 401;
    const isAuthMe = error.config?.url?.includes("/auth/me");
    const isValidate = error.config?.url?.includes("/api/auth/validate");
    
    if (is401 && !isAuthMe && !isValidate) {
      authStore.deleteUser();
      //console.log("Sesión expirada");
      router.push("/login");
    }

    return Promise.reject(error);
  }
);

export default apiClient;