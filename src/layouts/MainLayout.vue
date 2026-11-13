<template>
    <v-layout class="border">
        <SideMenu v-model="drawer"/>
        <v-app-bar color="thirdBackgroundColor" elevation="0" class="border" density="comfortable">
            <v-app-bar-nav-icon v-if="!$vuetify.display.mdAndUp" @click="drawer = !drawer" />
            <v-spacer />
            <AlertasMenu v-if="authStore.hasPermission('ALERT_READ')" />
            <div v-if="authStore.user" class="flex items-center gap-2 pr-4">
                <v-icon>mdi-account-circle</v-icon>
                <div class="leading-tight">
                    <p class="text-sm font-semibold">{{ authStore.user.firstName }} {{ authStore.user.lastName }}</p>
                    <p class="text-xs text-gray-500">{{ authStore.user.roles?.join(', ') }}</p>
                </div>
            </div>
        </v-app-bar>
        <v-main scrollable>
            <router-view />
        </v-main>
    </v-layout>
</template>

<script>
import AlertasMenu from '@/components/common/AlertasMenu.vue';
import SideMenu from '@/components/common/SideMenu.vue';
import { useAuthStore } from '@/store/authStore';

export default {
    name: "MainLayout",
    components: {SideMenu, AlertasMenu},
    data() {
        return {
            drawer: true,
            authStore: useAuthStore(),
        }
    },
    mounted() {
        if (!this.$vuetify.display.mdAndUp) {
            this.drawer = false;
        }
    },
}
</script>

<style scoped>
</style>
