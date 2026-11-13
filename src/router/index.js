import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout.vue";
import BuzonLayout from "@/layouts/buzon/BuzonLayout.vue";
import ClientesLayout from "@/layouts/clientes/ClientesLayout.vue";
import Clientes from "@/layouts/clientes/Clientes.vue";
import CrearCliente from "@/layouts/clientes/CrearCliente.vue";
import SireLayout from "@/layouts/sire/SireLayout.vue";
import SireVentas from "@/layouts/sire/SireVentas.vue";
import SireCompras from "@/layouts/sire/SireCompras.vue";
import { useAuthStore } from "@/store/authStore";

const routes = [
    {
      path: '/login',
      name: 'login',
      component: AuthLayout,
    },
    {
      path: '/',
      component: MainLayout,
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        { path: "dashboard", name: "dashboard", component: DashboardLayout },
        { path: "buzon", name: "buzon", component: BuzonLayout },
        {
          path: "clientes",
          name: "clientes",
          component: ClientesLayout,
          redirect: "/clientes/ver-clientes",
          children: [
            { path: "ver-clientes", name: "ver-clientes", component: Clientes },
            { path: "crear-clientes", name: "crear-clientes", component: CrearCliente },
            { path: "editar-cliente/:id", name: "editar-cliente", component: CrearCliente },
          ]
        },
        {
          path: "sire",
          name: "sire",
          component: SireLayout,
          redirect: "/sire/ventas",
          children: [
            { path: "ventas", name: "sire-ventas", component: SireVentas },
            { path: "compras", name: "sire-compras", component: SireCompras },
          ]
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  const isLogin = to.path === '/login'

  // 🔥 SOLO valida sesión si NO estás en login
  if (!authStore.user && !isLogin) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      // ignorar error
    }
  }

  // 🔐 Ruta protegida
  if (to.meta.requiresAuth && !authStore.user) {
    return '/login'
  }

  // 🚫 Usuario logueado intentando ir al login
  if (isLogin && authStore.user) {
    return '/dashboard'
  }
})

export default router
