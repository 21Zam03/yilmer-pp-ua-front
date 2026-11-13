<template>
    <v-menu
        v-model="open"
        location="bottom end"
        offset="8"
        :close-on-content-click="false"
        max-width="420"
    >
        <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" class="mr-1" :aria-label="ariaLabel">
                <v-badge v-if="noLeidas > 0" :content="badgeText" color="error" offset-x="-2" offset-y="-2">
                    <v-icon>mdi-bell-outline</v-icon>
                </v-badge>
                <v-icon v-else>mdi-bell-outline</v-icon>
            </v-btn>
        </template>

        <v-card class="alertas-card">
            <div class="alertas-head">
                <p class="alertas-title">Alertas</p>
                <v-btn
                    v-if="noLeidas > 0"
                    variant="text"
                    size="small"
                    color="primary"
                    class="text-none"
                    :loading="markingAll"
                    @click="marcarTodas"
                >
                    Marcar todas como leídas
                </v-btn>
            </div>

            <div class="alertas-filter">
                <v-chip-group v-model="filtro" mandatory selected-class="text-primary" @update:model-value="load">
                    <v-chip value="no-leidas" size="small" variant="outlined" filter>No leídas ({{ noLeidas }})</v-chip>
                    <v-chip value="todas" size="small" variant="outlined" filter>Todas</v-chip>
                </v-chip-group>
            </div>

            <v-divider />

            <div class="alertas-body">
                <div v-if="loading && alertas.length === 0" class="alertas-empty">
                    <v-progress-circular indeterminate color="primary" size="24" />
                </div>
                <div v-else-if="alertas.length === 0" class="alertas-empty">
                    <v-icon icon="mdi-bell-check-outline" size="32" color="#9AA0A8" />
                    <p>{{ filtro === 'no-leidas' ? 'No tienes alertas pendientes.' : 'Aún no hay alertas.' }}</p>
                </div>
                <template v-else>
                    <button
                        v-for="a in alertas"
                        :key="a.id"
                        type="button"
                        class="alerta-item"
                        :class="{ 'alerta-item--unread': !a.leida }"
                        @click="abrir(a)"
                    >
                        <v-icon :icon="tipo(a.tipo).icon" :color="tipo(a.tipo).color" size="20" class="alerta-icon" />
                        <div class="min-w-0 flex-1">
                            <p class="alerta-meta">
                                <span>{{ tipo(a.tipo).label }}</span>
                                <span>·</span>
                                <span class="truncate">{{ a.razonSocial || `RUC ${a.clienteRuc}` }}</span>
                            </p>
                            <p class="alerta-mensaje">{{ a.mensaje }}</p>
                            <p class="alerta-fecha">{{ hace(a.fechaCreacion) }}</p>
                        </div>
                        <span v-if="!a.leida" class="alerta-dot" aria-label="No leída"></span>
                    </button>
                    <p v-if="total > alertas.length" class="alertas-more">
                        Mostrando las {{ alertas.length }} más recientes de {{ total }}.
                    </p>
                </template>
            </div>
        </v-card>
    </v-menu>
</template>

<script>
import AlertaService from '@/services/AlertaService';
import { useAlertasStore } from '@/store/alertasStore';
import { useUiStore } from '@/store/ui';
import { alertaLink, alertaTipo, haceCuanto } from '@/utils/alertas';

// Las alertas se generan en jobs del backend (8 a. m., al terminar una sincronización): no hace falta consultar seguido.
const POLL_INTERVAL_MS = 60000;
const PAGE_SIZE = 15;

export default {
    name: 'AlertasMenu',
    data() {
        return {
            alertasStore: useAlertasStore(),
            open: false,
            filtro: 'no-leidas',
            alertas: [],
            total: 0,
            loading: false,
            markingAll: false,
            pollTimer: null,
        };
    },
    computed: {
        noLeidas() {
            return this.alertasStore.noLeidas;
        },
        badgeText() {
            return this.noLeidas > 99 ? '99+' : String(this.noLeidas);
        },
        ariaLabel() {
            return this.noLeidas > 0 ? `Alertas: ${this.noLeidas} sin leer` : 'Alertas';
        },
    },
    methods: {
        tipo: alertaTipo,
        hace: haceCuanto,
        async refreshCount() {
            // Si la pestaña no está visible no se consulta; se actualiza al volver (visibilitychange).
            if (document.visibilityState === 'hidden') return;
            await this.alertasStore.refreshCount();
        },
        async load() {
            this.loading = true;
            try {
                const response = await AlertaService.getAlertas(this.filtro === 'no-leidas' ? false : null, 0, PAGE_SIZE);
                this.alertas = response.content;
                this.total = response.totalElements;
            } catch (error) {
                // El mensaje ya se mostró en el snackbar.
            } finally {
                this.loading = false;
            }
        },
        async abrir(alerta) {
            this.open = false;
            if (!alerta.leida) {
                alerta.leida = true;
                this.alertasStore.descontar();
                AlertaService.marcarLeida(alerta.id).catch(() => this.refreshCount());
            }
            this.$router.push(alertaLink(alerta));
        },
        async marcarTodas() {
            this.markingAll = true;
            try {
                const { marcadas } = await AlertaService.marcarTodasLeidas();
                this.alertasStore.reset();
                this.alertas.forEach(a => { a.leida = true; });
                useUiStore().setSuccess(marcadas === 1 ? '1 alerta marcada como leída' : `${marcadas} alertas marcadas como leídas`);
                if (this.filtro === 'no-leidas') {
                    this.alertas = [];
                    this.total = 0;
                }
            } catch (error) {
                // El mensaje ya se mostró en el snackbar.
            } finally {
                this.markingAll = false;
            }
        },
        onVisibilityChange() {
            if (document.visibilityState === 'visible') this.refreshCount();
        },
    },
    watch: {
        open(value) {
            if (value) {
                this.refreshCount();
                this.load();
            }
        },
    },
    mounted() {
        this.refreshCount();
        this.pollTimer = setInterval(() => this.refreshCount(), POLL_INTERVAL_MS);
        document.addEventListener('visibilitychange', this.onVisibilityChange);
    },
    beforeUnmount() {
        clearInterval(this.pollTimer);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
    },
};
</script>

<style scoped>
.alertas-card {
    width: min(420px, calc(100vw - 32px));
    border-radius: 0.75rem;
}

.alertas-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem 0.25rem;
}

.alertas-title {
    font-weight: 600;
    font-size: 0.9375rem;
    color: #14171C;
}

.alertas-filter {
    padding: 0 0.75rem 0.25rem;
}

.alertas-body {
    max-height: min(26rem, 70vh);
    overflow-y: auto;
}

.alertas-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    font-size: 0.8125rem;
    color: #6B6F76;
    text-align: center;
}

.alerta-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #F1F1EE;
    background: #fff;
    cursor: pointer;
}

.alerta-item:hover,
.alerta-item:focus-visible {
    background: #F7F7F5;
    outline: none;
}

.alerta-item--unread {
    background: #F5F8FF;
}

.alerta-icon {
    margin-top: 0.125rem;
}

.alerta-meta {
    display: flex;
    gap: 0.25rem;
    font-size: 0.71875rem;
    font-weight: 600;
    color: #6B6F76;
    min-width: 0;
}

.alerta-mensaje {
    font-size: 0.8125rem;
    color: #14171C;
    margin-top: 0.125rem;
}

.alerta-item:not(.alerta-item--unread) .alerta-mensaje {
    color: #6B6F76;
}

.alerta-fecha {
    font-size: 0.71875rem;
    color: #9AA0A8;
    margin-top: 0.25rem;
}

.alerta-dot {
    flex: 0 0 8px;
    width: 8px;
    height: 8px;
    margin-top: 0.375rem;
    border-radius: 999px;
    background: #2563EB;
}

.alertas-more {
    font-size: 0.75rem;
    color: #9AA0A8;
    text-align: center;
    padding: 0.625rem 1rem;
}
</style>
