<template>
    <div class="clients-page">
        <div class="clients-content">
            <!-- Header -->
            <div class="clients-header">
                <div>
                    <h1 class="header-title">Mis clientes</h1>
                    <p class="header-subtitle">
                        Gestiona los contribuyentes cuyo buzón SUNAT monitoreas. Tienes {{ stats.total }} clientes registrados.
                    </p>
                </div>
                <div class="header-actions">
                    <v-btn v-if="canCreate" color="primary" variant="flat" class="text-none" prepend-icon="mdi-plus" @click="addClient">
                        Registrar cliente
                    </v-btn>
                </div>
            </div>

            <!-- Stat cards -->
            <v-row class="stats-row" dense>
                <v-col class="stat-col">
                    <v-card class="stat-card" variant="outlined" style="border-top-color: #2563EB">
                        <p class="stat-label">Total clientes</p>
                        <p class="stat-value">{{ stats.total }}</p>
                    </v-card>
                </v-col>
                <v-col class="stat-col">
                    <v-card class="stat-card" variant="outlined" style="border-top-color: #1D8A4E">
                        <p class="stat-label">Activos</p>
                        <p class="stat-value stat-value--green">{{ stats.active }}</p>
                    </v-card>
                </v-col>
                <v-col class="stat-col">
                    <v-card class="stat-card" variant="outlined" style="border-top-color: #6B6F76">
                        <p class="stat-label">Inactivos</p>
                        <p class="stat-value stat-value--muted">{{ stats.inactive }}</p>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Filtros: todo en una misma barra en desktop; búsqueda + botón Filtros en móvil -->
            <v-row class="filters-row" dense align="center">
                <v-col cols="12" class="filters-desktop-only">
                    <div class="filters-bar">
                        <v-text-field
                            v-model="searchKey"
                            placeholder="Razón social, RUC o contacto"
                            prepend-inner-icon="mdi-magnify"
                            variant="outlined"
                            density="compact"
                            hide-details
                            clearable
                            color="primary"
                            type="search"
                            class="filters-bar-search"
                        />
                        <div class="filters-bar-divider"></div>
                        <v-select
                            v-model="clientStatus"
                            label="Estado del cliente"
                            variant="outlined"
                            density="compact"
                            :items="statusOptions"
                            item-title="title"
                            item-value="value"
                            color="primary"
                            hide-details
                            class="filters-bar-select"
                        />
                        <v-spacer />
                        <v-btn variant="text" size="small" class="text-none filters-bar-clear" prepend-icon="mdi-broom" @click="clearFilters">
                            Limpiar
                        </v-btn>
                    </div>
                </v-col>

                <!-- Búsqueda + acceso a filtros (móvil) -->
                <v-col cols="8" class="filters-mobile-only">
                    <v-text-field
                        v-model="searchKey"
                        placeholder="Razón social, RUC o contacto"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                        color="primary"
                        type="search"
                    />
                </v-col>
                <v-col cols="4" class="filters-mobile-only filters-mobile-btn-col">
                    <v-badge :content="activeFilterCount" :model-value="activeFilterCount > 0" color="primary" floating offset-x="8" offset-y="8">
                        <v-btn icon="mdi-tune-variant" variant="outlined" color="primary" @click="openFilters" />
                    </v-badge>
                </v-col>
            </v-row>

            <!-- Modal de filtros (móvil) -->
            <v-dialog v-model="isFilterOpen" max-width="480">
                <v-card rounded="lg">
                    <v-card-title class="text-h6">Filtros</v-card-title>
                    <v-divider />
                    <v-card-text class="pt-4 d-flex flex-column ga-4">
                        <v-select
                            v-model="clientStatusMobile"
                            label="Estado del cliente"
                            variant="outlined"
                            density="compact"
                            :items="statusOptions"
                            item-title="title"
                            item-value="value"
                            color="primary"
                            hide-details
                        />
                    </v-card-text>
                    <v-divider />
                    <v-card-actions>
                        <v-btn variant="text" prepend-icon="mdi-broom" class="text-none" @click="clearFilters">Limpiar</v-btn>
                        <v-spacer />
                        <v-btn variant="text" class="text-none" @click="isFilterOpen = false">Cancelar</v-btn>
                        <v-btn color="primary" variant="flat" class="text-none" @click="acceptFilters">Aplicar filtros</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Confirmación de activar / desactivar / eliminar -->
            <v-dialog v-model="confirm.open" max-width="420">
                <v-card rounded="lg">
                    <v-card-title class="text-h6">{{ confirm.title }}</v-card-title>
                    <v-card-text>{{ confirm.text }}</v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn variant="text" class="text-none" :disabled="confirm.loading" @click="confirm.open = false">Cancelar</v-btn>
                        <v-btn :color="confirm.color" variant="flat" class="text-none" :loading="confirm.loading" @click="runConfirm">
                            {{ confirm.action }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Tabla de clientes (desktop) -->
            <v-data-table-server
                class="clients-table d-none d-md-block"
                :headers="headers"
                :items="clients"
                :items-length="totalItems"
                v-model:page="page"
                v-model:items-per-page="itemsPerPage"
                :loading="loading"
                @update:options="loadClients"
            >
                <template #item.businessName="{ item }">
                    <div class="client-cell">
                        <span class="client-avatar">{{ initials(item.businessName) }}</span>
                        <div class="min-w-0">
                            <p class="client-name">{{ item.businessName }}</p>
                            <p class="client-tradename">{{ item.tradeName || '—' }}</p>
                        </div>
                    </div>
                </template>
                <template #item.ruc="{ item }">
                    <div class="doc-cell">
                        <v-chip size="small" variant="tonal" :color="rucTypeColor(item.ruc)" class="text-none">
                            {{ rucTypeLabel(item.ruc) }}
                        </v-chip>
                        <span class="mono-text">{{ item.ruc }}</span>
                    </div>
                </template>
                <template #item.contacto="{ item }">
                    <div class="contact-cell">
                        <span class="contact-line" :class="{ 'contact-line--muted': !item.phoneNumber }">
                            <v-icon size="12">mdi-phone-outline</v-icon> {{ item.phoneNumber || '—' }}
                        </span>
                        <span class="contact-line" :class="{ 'contact-line--muted': !item.email }">
                            <v-icon size="12">mdi-email-outline</v-icon> {{ item.email || '—' }}
                        </span>
                    </div>
                </template>
                <template #item.solUser="{ item }">
                    <div class="sol-cell">
                        <span class="mono-text">{{ item.solUser }}</span>
                        <v-icon v-if="item.hasSolPassword" size="14" color="#1D8A4E" title="Clave SOL registrada">mdi-key-variant</v-icon>
                    </div>
                </template>
                <template #item.enabled="{ item }">
                    <span class="status-pill" :class="item.enabled ? 'status-pill--active' : 'status-pill--inactive'">
                        <span class="status-dot"></span>
                        {{ item.enabled ? 'Activo' : 'Inactivo' }}
                    </span>
                </template>
                <template #item.actions="{ item }">
                    <v-menu v-if="hasAnyAction" location="bottom end">
                        <template #activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" density="comfortable" size="small" />
                        </template>
                        <v-list density="compact">
                            <v-list-item v-if="canUpdate" prepend-icon="mdi-pencil" title="Editar cliente" @click="editClient(item)" />
                            <v-list-item
                                v-if="canUpdate && item.enabled"
                                prepend-icon="mdi-account-off-outline"
                                title="Desactivar cliente"
                                @click="askStatus(item, false)"
                            />
                            <v-list-item v-else-if="canUpdate" prepend-icon="mdi-account-check-outline" title="Activar cliente" @click="askStatus(item, true)" />
                            <v-list-item v-if="canDelete" prepend-icon="mdi-delete-outline" title="Eliminar cliente" base-color="error" @click="askDelete(item)" />
                        </v-list>
                    </v-menu>
                </template>
                <template #no-data>
                    <v-empty-state
                        icon="mdi-account-group-outline"
                        title="Sin resultados"
                        text="No encontramos clientes que coincidan con tu búsqueda o filtros."
                    />
                </template>
                <template #bottom>
                    <div class="table-footer">
                        <div class="table-footer-info">
                            <span>Filas por página</span>
                            <v-select
                                v-model="itemsPerPage"
                                :items="[10, 25, 50]"
                                density="compact"
                                variant="outlined"
                                hide-details
                                class="page-size-select"
                            />
                            <span class="ml-2">{{ rangeStart }}–{{ rangeEnd }} de {{ totalItems }}</span>
                        </div>
                        <div class="table-footer-controls">
                            <v-btn icon="mdi-chevron-left" variant="text" density="comfortable" :disabled="page === 1" @click="page--" />
                            <span class="page-label">Página {{ page }} de {{ totalPages }}</span>
                            <v-btn icon="mdi-chevron-right" variant="text" density="comfortable" :disabled="page >= totalPages" @click="page++" />
                        </div>
                    </div>
                </template>
            </v-data-table-server>

            <!-- Cards de clientes (móvil) -->
            <div class="d-md-none clients-mobile">
                <v-empty-state
                    v-if="!loading && clients.length === 0"
                    icon="mdi-account-group-outline"
                    title="Sin resultados"
                    text="No encontramos clientes que coincidan con tu búsqueda o filtros."
                />

                <v-card v-for="item in clients" :key="item.clientId" variant="outlined" class="client-card">
                    <div class="client-card-head">
                        <div class="client-cell min-w-0">
                            <span class="client-avatar">{{ initials(item.businessName) }}</span>
                            <div class="min-w-0">
                                <p class="client-name truncate">{{ item.businessName }}</p>
                                <div class="doc-cell mt-1">
                                    <v-chip size="small" variant="tonal" :color="rucTypeColor(item.ruc)" class="text-none">
                                        {{ rucTypeLabel(item.ruc) }}
                                    </v-chip>
                                    <span class="mono-text">{{ item.ruc }}</span>
                                </div>
                            </div>
                        </div>
                        <v-menu v-if="hasAnyAction" location="bottom end">
                            <template #activator="{ props }">
                                <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" density="comfortable" size="small" />
                            </template>
                            <v-list density="compact">
                                <v-list-item v-if="canUpdate" prepend-icon="mdi-pencil" title="Editar cliente" @click="editClient(item)" />
                                <v-list-item
                                    v-if="canUpdate && item.enabled"
                                    prepend-icon="mdi-account-off-outline"
                                    title="Desactivar cliente"
                                    @click="askStatus(item, false)"
                                />
                                <v-list-item v-else-if="canUpdate" prepend-icon="mdi-account-check-outline" title="Activar cliente" @click="askStatus(item, true)" />
                                <v-list-item v-if="canDelete" prepend-icon="mdi-delete-outline" title="Eliminar cliente" base-color="error" @click="askDelete(item)" />
                            </v-list>
                        </v-menu>
                    </div>

                    <div class="client-card-footer">
                        <div class="contact-cell">
                            <span class="contact-line" :class="{ 'contact-line--muted': !item.phoneNumber }">
                                <v-icon size="12">mdi-phone-outline</v-icon> {{ item.phoneNumber || '—' }}
                            </span>
                            <span class="contact-line" :class="{ 'contact-line--muted': !item.email }">
                                <v-icon size="12">mdi-email-outline</v-icon> {{ item.email || '—' }}
                            </span>
                        </div>
                        <span class="status-pill" :class="item.enabled ? 'status-pill--active' : 'status-pill--inactive'">
                            <span class="status-dot"></span>
                            {{ item.enabled ? 'Activo' : 'Inactivo' }}
                        </span>
                    </div>
                </v-card>

                <div v-if="clients.length > 0" class="table-footer table-footer--mobile">
                    <div class="table-footer-info">
                        <v-select
                            v-model="itemsPerPage"
                            :items="[10, 25, 50]"
                            label="Filas por página"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="page-size-select"
                        />
                        <span class="ml-2">{{ rangeStart }}–{{ rangeEnd }} de {{ totalItems }}</span>
                    </div>
                    <div class="table-footer-controls">
                        <v-btn icon="mdi-chevron-left" variant="text" density="comfortable" :disabled="page === 1" @click="page--" />
                        <span class="page-label">Página {{ page }} de {{ totalPages }}</span>
                        <v-btn icon="mdi-chevron-right" variant="text" density="comfortable" :disabled="page >= totalPages" @click="page++" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import ClientService from '@/services/ClientService';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/ui';

export default {
    name: "Clientes",
    data() {
        return {
            authStore: useAuthStore(),
            searchKey: null,
            searchTimer: null,
            loading: false,
            isFilterOpen: false,

            statusOptions: [
                { title: 'Todos', value: null },
                { title: 'Activo', value: true },
                { title: 'Inactivo', value: false },
            ],
            clientStatus: null,
            clientStatusMobile: null,

            headers: [
                { title: 'Cliente', key: 'businessName', sortable: false },
                { title: 'RUC', key: 'ruc', sortable: false },
                { title: 'Contacto', key: 'contacto', sortable: false },
                { title: 'Usuario SOL', key: 'solUser', sortable: false },
                { title: 'Estado', key: 'enabled', sortable: false },
                { title: '', key: 'actions', align: 'end', sortable: false },
            ],
            clients: [],
            page: 1,
            itemsPerPage: 10,
            totalItems: 0,

            stats: { total: 0, active: 0, inactive: 0 },

            confirm: { open: false, loading: false, title: '', text: '', action: '', color: 'primary', run: null },
        }
    },
    computed: {
        canCreate() {
            return this.authStore.hasPermission('CLIENT_CREATE');
        },
        canUpdate() {
            return this.authStore.hasPermission('CLIENT_UPDATE');
        },
        canDelete() {
            return this.authStore.hasPermission('CLIENT_DELETE');
        },
        hasAnyAction() {
            return this.canUpdate || this.canDelete;
        },
        totalPages() {
            return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
        },
        rangeStart() {
            return this.totalItems === 0 ? 0 : (this.page - 1) * this.itemsPerPage + 1;
        },
        rangeEnd() {
            return Math.min(this.page * this.itemsPerPage, this.totalItems);
        },
        activeFilterCount() {
            return this.clientStatus !== null ? 1 : 0;
        },
    },
    methods: {
        initials(name) {
            if (!name || !name.trim()) return '?';
            return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
        },
        // RUC 10 = persona natural; 15/17/20 = no natural (jurídica, sucesiones, etc.).
        rucTypeLabel(ruc) {
            return ruc?.startsWith('10') ? 'Natural' : 'Jurídica';
        },
        rucTypeColor(ruc) {
            return ruc?.startsWith('10') ? '#2455A4' : '#7C4FB0';
        },
        addClient() {
            this.$router.push('/clientes/crear-clientes');
        },
        editClient(item) {
            this.$router.push(`/clientes/editar-cliente/${item.clientId}`);
        },
        async loadClients() {
            this.loading = true;
            try {
                const response = await ClientService.getClients(this.page - 1, this.itemsPerPage, this.searchKey, this.clientStatus);
                this.clients = response.content;
                this.totalItems = response.totalElements;
                // Si se borró el último elemento de la última página, retroceder una página.
                if (this.clients.length === 0 && this.page > 1) {
                    this.page = this.totalPages;
                }
            } catch (error) {
                this.clients = [];
                this.totalItems = 0;
            } finally {
                this.loading = false;
            }
        },
        async loadStats() {
            try {
                this.stats = await ClientService.getStats();
            } catch (error) {
                console.error('Error obteniendo estadísticas de clientes:', error);
            }
        },
        // Recarga desde la página 1; si ya se está en ella, el watcher de page no dispararía la carga.
        reloadFromFirstPage() {
            if (this.page === 1) {
                this.loadClients();
            } else {
                this.page = 1;
            }
        },
        askStatus(item, enabled) {
            this.confirm = {
                open: true,
                loading: false,
                title: enabled ? 'Activar cliente' : 'Desactivar cliente',
                text: enabled
                    ? `${item.businessName} volverá a estar activo y se seguirá monitoreando su buzón.`
                    : `${item.businessName} quedará inactivo y se dejará de monitorear su buzón. Podrás activarlo de nuevo cuando quieras.`,
                action: enabled ? 'Activar' : 'Desactivar',
                color: enabled ? 'primary' : 'warning',
                run: async () => {
                    await ClientService.updateStatus(item.clientId, enabled);
                    useUiStore().setSuccess(enabled ? 'Cliente activado' : 'Cliente desactivado');
                },
            };
        },
        askDelete(item) {
            this.confirm = {
                open: true,
                loading: false,
                title: 'Eliminar cliente',
                text: `Se eliminará definitivamente a ${item.businessName} (RUC ${item.ruc}) junto con sus credenciales SOL. Esta acción no se puede deshacer.`,
                action: 'Eliminar',
                color: 'error',
                run: async () => {
                    await ClientService.deleteClient(item.clientId);
                    useUiStore().setSuccess('Cliente eliminado');
                },
            };
        },
        async runConfirm() {
            this.confirm.loading = true;
            try {
                await this.confirm.run();
                this.confirm.open = false;
                this.loadClients();
                this.loadStats();
            } catch (error) {
                // El mensaje de error ya lo mostró ClientService.
            } finally {
                this.confirm.loading = false;
            }
        },
        openFilters() {
            this.clientStatusMobile = this.clientStatus;
            this.isFilterOpen = true;
        },
        clearFilters() {
            this.searchKey = null;
            this.clientStatus = null;
            this.clientStatusMobile = null;
            this.isFilterOpen = false;
        },
        acceptFilters() {
            this.clientStatus = this.clientStatusMobile;
            this.isFilterOpen = false;
        }
    },
    mounted() {
        this.loadStats();
        // En móvil la tabla está oculta pero igual emite update:options al montarse,
        // así que la primera carga la hace la propia tabla.
    },
    beforeUnmount() {
        clearTimeout(this.searchTimer);
    },
    watch: {
        // Búsqueda con debounce para no consultar al backend en cada tecla.
        searchKey() {
            clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(() => this.reloadFromFirstPage(), 400);
        },
        clientStatus() {
            this.reloadFromFirstPage();
        },
    }
}
</script>

<style scoped>
.clients-page {
    min-height: 100%;
    background: #F7F7F5;
}

/* Header */
.clients-content {
    max-width: 90rem;
    margin: 0 auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

@media (min-width: 768px) {
    .clients-content {
        padding: 1.75rem 2rem;
    }
}

.clients-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.25rem;
    flex-wrap: wrap;
}

.header-title {
    font-size: 1.375rem;
    font-weight: 600;
    color: #14171C;
    letter-spacing: -0.01em;
}

.header-subtitle {
    font-size: 0.8125rem;
    margin-top: 0.25rem;
    max-width: 30rem;
    color: #9AA0A8;
}

.header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

/* Stat cards */
.stats-row {
    row-gap: 0.75rem;
}

.stat-col {
    flex: 0 0 100%;
    max-width: 100%;
}

@media (min-width: 768px) {
    .stat-col {
        flex: 0 0 33.3333%;
        max-width: 33.3333%;
    }
}

.stat-card {
    padding: 0.875rem 1rem;
    background-color: #fff;
    border-color: #DED7D7;
    border-top-width: 3px;
}

@media (max-width: 767.98px) {
    .stat-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }
}

.stat-label {
    font-size: 0.71875rem;
    font-weight: 600;
    color: #6B6F76;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.stat-value {
    font-size: 1.375rem;
    font-weight: 700;
    margin-top: 0.375rem;
    color: #14171C;
}

@media (max-width: 767.98px) {
    .stat-value {
        margin-top: 0;
    }
}

.stat-value--green {
    color: #1D8A4E;
}

.stat-value--muted {
    color: #6B6F76;
}

/* Filtros */
.filters-bar {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex-wrap: wrap;
    background: #fff;
    border: 1px solid #E1E1DC;
    border-radius: 0.625rem;
    padding: 0.625rem 0.875rem;
}

.filters-bar-search {
    flex: 1 1 220px;
    min-width: 200px;
    max-width: 26rem;
}

.filters-bar-select {
    flex: 1 1 160px;
    max-width: 11rem;
}

.filters-bar-divider {
    width: 1px;
    align-self: stretch;
    background: #E1E1DC;
    margin: 0 0.125rem;
}

.filters-bar-clear {
    color: #6B6F76;
}

.filters-mobile-only {
    display: block;
}

.filters-mobile-btn-col {
    display: flex;
    justify-content: flex-end;
}

.filters-desktop-only {
    display: none;
}

@media (min-width: 768px) {
    .filters-mobile-only {
        display: none;
    }

    .filters-desktop-only {
        display: block;
    }
}

/* Tabla */
.mono-text {
    font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
    font-size: 0.75rem;
    color: #6B6F76;
}

.clients-table {
    border: 1px solid #E1E1DC;
    border-radius: 0.625rem;
    overflow: hidden;
}

.clients-table :deep(.v-data-table__thead) {
    background-color: #e0f2ff;
}

.clients-table :deep(.v-data-table__th) {
    color: #0369a1;
    font-weight: 600;
}

.client-cell {
    display: flex;
    align-items: center;
    gap: 0.625rem;
}

.client-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    background: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-primary));
}

.client-name {
    font-weight: 500;
    color: #14171C;
}

.client-tradename {
    font-size: 0.75rem;
    color: #9AA0A8;
}

.doc-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.sol-cell {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.contact-cell {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.75rem;
}

.contact-line {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: #14171C;
}

.contact-line--muted {
    color: #C7C9CC;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
}

.status-pill--active {
    color: #1D8A4E;
    background: #E4F6EC;
}

.status-pill--inactive {
    color: #6B6F76;
    background: #EEEEEC;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.table-footer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem;
}

@media (min-width: 640px) {
    .table-footer {
        flex-direction: row;
        align-items: center;
    }
}

.table-footer--mobile {
    padding: 0.5rem 0 1rem;
}

.table-footer-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6B6F76;
}

.page-size-select {
    max-width: 6.5rem;
}

.table-footer-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.page-label {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0 0.5rem;
    color: #14171C;
}

/* Cards móviles */
.clients-mobile {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
}

.client-card {
    padding: 1rem;
    border-color: #DED7D7;
    background: #fff;
}

.client-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.client-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.75rem;
}
</style>
