<template>
  <v-navigation-drawer
    color="backgroundcolor"
    v-model="drawerProxy"
    :permanent="$vuetify.display.mdAndUp"
    width="300"
  >
    <div class="flex items-center gap-3 px-4 py-5">
      <img src="/logo-sunatgo.svg" alt="SunatGo" class="w-9 h-9 rounded-lg" />
      <span class="text-xl font-bold text-white">SunatGo</span>
    </div>

    <v-list nav v-model:opened="openedGroups">
      <template v-for="item in menu" :key="item.group || item.to">
        <!-- Módulo con submódulos -->
        <v-list-group v-if="item.children" :value="item.group">
          <template #activator="{ props }">
            <v-list-item v-bind="props" :prepend-icon="item.icon" :title="item.title" />
          </template>

          <v-list-item
            v-for="child in item.children"
            :key="child.to"
            :prepend-icon="child.icon"
            :title="child.title"
            :to="child.to"
            router
          />
        </v-list-group>

        <!-- Módulo simple -->
        <v-list-item
          v-else
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          router
        />
      </template>
    </v-list>

    <template #append>
      <v-list nav>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Cerrar sesión"
          @click="logout"
        />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script>
import { useAuthStore } from '@/store/authStore';
import AuthService from '@/services/AuthService';

export default {
  name: 'SideMenu',

  props: {
    modelValue: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      menu: [
        { title: "Dashboard", icon: "mdi-view-dashboard", to: "/dashboard" },
        { title: "Buzón", icon: "mdi-inbox", to: "/buzon" },
        {
          title: "Clientes",
          icon: "mdi-account-group",
          group: "clientes",
          children: [
            { title: "Mis clientes", icon: "mdi-account-multiple-outline", to: "/clientes/ver-clientes" },
            { title: "Crear cliente", icon: "mdi-account-plus-outline", to: "/clientes/crear-clientes" },
          ],
        },
        {
          title: "SIRE",
          icon: "mdi-file-document-multiple-outline",
          group: "sire",
          children: [
            { title: "Ventas", icon: "mdi-cash-register", to: "/sire/ventas" },
            { title: "Compras", icon: "mdi-cart-outline", to: "/sire/compras" },
          ],
        },
      ],
      // Deja abierto el grupo de la ruta actual (ej. al recargar estando en /clientes/...).
      openedGroups: [this.$route.path.split('/')[1]],
    }
  },

  computed: {
    drawerProxy: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },

  methods: {
    async logout() {
      const authStore = useAuthStore();
      try {
        await AuthService.signOut();
        authStore.user = null;
        this.$router.push('/login');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    },
  },
}
</script>

<style scoped>
</style>
