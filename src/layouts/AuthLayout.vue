<template>
  <div class="auth-page">
    <!-- Panel visual (izquierda) -->
    <div class="auth-visual">
      <div class="auth-visual-overlay"></div>
      <div class="auth-visual-content">
        <div class="auth-visual-brand">
          <img src="/logo-sunatgo.svg" alt="SunatGo" class="auth-visual-logo" />
          <span class="auth-visual-brand-name">SunatGo</span>
        </div>

        <h2 class="auth-visual-heading">
          Tu buzón SUNAT y tus clientes, <span class="auth-visual-accent">bajo control</span>.
        </h2>
        <p class="auth-visual-subtitle">
          Revisa notificaciones, gestiona clientes y mantente al día con SUNAT desde un solo lugar.
        </p>

        <div class="auth-visual-features">
          <div class="auth-visual-feature">
            <div class="auth-visual-feature-icon">
              <v-icon size="18" color="white">mdi-inbox-outline</v-icon>
            </div>
            <div class="min-w-0">
              <p class="auth-visual-feature-title">Buzón centralizado</p>
              <p class="auth-visual-feature-desc">Todas las notificaciones en un solo lugar.</p>
            </div>
          </div>
          <div class="auth-visual-feature">
            <div class="auth-visual-feature-icon">
              <v-icon size="18" color="white">mdi-account-group-outline</v-icon>
            </div>
            <div class="min-w-0">
              <p class="auth-visual-feature-title">Gestión de clientes</p>
              <p class="auth-visual-feature-desc">Ten a tus clientes siempre organizados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel del formulario (derecha) -->
    <div class="auth-form-side">
      <div class="auth-card">

        <!-- Marca compacta (solo visible en móvil, donde el panel visual se oculta) -->
        <div class="auth-mobile-brand">
          <img src="/logo-sunatgo.svg" alt="SunatGo" class="auth-mobile-brand-icon" />
          <span class="auth-mobile-brand-name">SunatGo</span>
        </div>

        <div class="auth-heading">
          <h1 class="auth-heading-title">Iniciar sesión</h1>
          <p class="auth-heading-subtitle">Ingresa tus datos para continuar</p>
        </div>

        <!-- Auth error banner -->
        <div v-if="authError" class="auth-error-banner">
          <v-icon icon="mdi-alert-circle" size="16" color="#C1481E" class="auth-error-icon" />
          <p class="auth-error-text">Usuario o contraseña incorrectos. Verifica tus datos e intenta de nuevo.</p>
        </div>

        <v-form @submit.prevent="handleLogin" class="auth-form">
          <!-- Usuario -->
          <div class="auth-field">
            <label class="auth-label">Usuario</label>
            <v-text-field
              v-model="username"
              placeholder="username..."
              prepend-inner-icon="mdi-account-outline"
              variant="outlined"
              density="comfortable"
              name="username"
              id="username"
              autocomplete="username"
              hide-details="auto"
              :error="touched.username && !username.trim()"
              :error-messages="touched.username && !username.trim() ? 'Ingresa tu usuario' : ''"
              @blur="touched.username = true"
              @update:model-value="authError = false"
              class="auth-input"
              color="primary"
            />
          </div>

          <!-- Contraseña -->
          <div class="auth-field">
            <div class="auth-field-header">
              <label class="auth-label">Contraseña</label>
              <a href="#" class="auth-forgot-link" @click.prevent>¿Olvidaste tu contraseña?</a>
            </div>
            <v-text-field
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              variant="outlined"
              density="comfortable"
              name="password"
              id="password"
              autocomplete="current-password"
              hide-details="auto"
              :error="touched.password && !password.trim()"
              :error-messages="touched.password && !password.trim() ? 'Ingresa tu contraseña' : ''"
              @click:append-inner="showPassword = !showPassword"
              @blur="touched.password = true"
              @update:model-value="authError = false"
              class="auth-input"
              color="primary"
            />
          </div>

          <!-- Submit -->
          <v-btn
            type="submit"
            block
            size="large"
            color="primary"
            :loading="loading"
            class="auth-submit-btn"
          >
            Ingresar
          </v-btn>
        </v-form>

        <p class="auth-footer">© 2026 desarrollado por el equipo de SunatGo</p>
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/AuthService';
import { useAuthStore } from '@/store/authStore';

export default {
  name: "LoginView",
  data() {
    return {
      username: "",
      password: "",
      showPassword: false,
      touched: { username: false, password: false },
      loading: false,
      authError: false
    };
  },
  methods: {
    async handleLogin() {
      this.touched.username = true;
      this.touched.password = true;
      this.authError = false;

      if (!this.username.trim() || !this.password.trim()) return;

      this.loading = true;
      try {
        const response = await AuthService.signIn({
          username: this.username,
          password: this.password,
        });
        if (response.status === 200) {
          // La cookie ya quedó puesta: se cargan los datos completos (roles/permisos) del usuario.
          await useAuthStore().fetchUser();
          this.$router.push('/dashboard');
        }
      } catch (err) {
        // Solo 401 es "credenciales incorrectas"; otros errores (servidor caído, etc.) ya se
        // muestran en el snackbar desde AuthService.
        this.authError = err.response?.status === 401;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
}

/* ===== Panel visual (izquierda) ===== */
.auth-visual {
  position: relative;
  flex: 1 1 52%;
  min-height: 100vh;
  display: none;
  background-image: url('/images/login/login-1.jpeg');
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

@media (min-width: 960px) {
  .auth-visual {
    display: flex;
    align-items: center;
  }
}

.auth-visual-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, rgba(7, 11, 26, 0.94) 0%, rgba(15, 23, 64, 0.88) 45%, rgba(7, 11, 26, 0.62) 100%);
}

.auth-visual-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  padding: 0 56px;
  margin: 0 auto;
  color: #fff;
}

.auth-visual-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}

.auth-visual-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.auth-visual-brand-name {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.auth-visual-heading {
  font-size: 2.35rem;
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -0.01em;
  margin-bottom: 18px;
}

.auth-visual-accent {
  color: #F5B942;
}

.auth-visual-subtitle {
  font-size: 0.9375rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.78);
  max-width: 380px;
  margin-bottom: 40px;
}

.auth-visual-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-visual-feature {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
}

.auth-visual-feature-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.12);
}

.auth-visual-feature-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
}

.auth-visual-feature-desc {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

/* ===== Panel del formulario (derecha) ===== */
.auth-form-side {
  flex: 1 1 48%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  background: linear-gradient(180deg, #DCE8FB 0%, #EFF4FD 55%, #F7FAFE 100%);
}

.auth-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px -12px rgba(30, 58, 143, 0.18);
  padding: 36px 28px;
}

@media (min-width: 600px) {
  .auth-card {
    padding: 40px 36px;
  }
}

.auth-mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 28px;
}

@media (min-width: 960px) {
  .auth-mobile-brand {
    display: none;
  }
}

.auth-mobile-brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.auth-mobile-brand-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.auth-heading {
  margin-bottom: 28px;
}

.auth-heading-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #14171C;
  line-height: 1.2;
}

.auth-heading-subtitle {
  font-size: 0.875rem;
  color: #6B6F76;
  margin-top: 6px;
}

.auth-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 20px;
  background: #FBEAE3;
}

.auth-error-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.auth-error-text {
  font-size: 0.8125rem;
  color: #C1481E;
  line-height: 1.4;
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.auth-field {
  margin-bottom: 18px;
}

.auth-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.auth-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #14171C;
  display: block;
  margin-bottom: 6px;
}

.auth-field-header .auth-label {
  margin-bottom: 0;
}

.auth-forgot-link {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.auth-forgot-link:hover {
  text-decoration: underline;
}

.auth-input :deep(.v-field) {
  border-radius: 10px;
}

.auth-submit-btn {
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
  height: 50px !important;
}

.auth-footer {
  font-size: 0.75rem;
  text-align: center;
  color: #6B6F76;
  margin-top: 28px;
}

</style>
