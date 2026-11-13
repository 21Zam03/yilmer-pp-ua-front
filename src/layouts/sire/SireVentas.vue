<template>
    <div class="sire-page">
        <div class="sire-content">
            <!-- Header -->
            <div class="sire-header">
                <div>
                    <h1 class="header-title">SIRE - Ventas</h1>
                    <p class="header-subtitle">
                        Registro de Ventas e Ingresos Electrónico (RVIE): propuesta de SUNAT por cliente y periodo.
                    </p>
                </div>
                <div v-if="canRead" class="header-actions">
                    <v-menu location="bottom end">
                        <template #activator="{ props }">
                            <v-btn
                                v-bind="props"
                                variant="outlined"
                                class="text-none"
                                prepend-icon="mdi-microsoft-excel"
                                append-icon="mdi-chevron-down"
                                :loading="exporting"
                                :disabled="!selectedClient || resumen.cantidad === 0 || syncing"
                            >
                                Exportar a Excel
                            </v-btn>
                        </template>
                        <v-list density="compact" min-width="260">
                            <v-list-item
                                v-for="opcion in exportOptions"
                                :key="opcion.value"
                                :title="opcion.title"
                                :subtitle="opcion.subtitle"
                                :prepend-icon="opcion.icon"
                                @click="exportar(opcion.value)"
                            />
                        </v-list>
                    </v-menu>
                    <v-btn
                        v-if="canSync"
                        color="primary"
                        variant="flat"
                        class="text-none"
                        prepend-icon="mdi-cloud-sync-outline"
                        :loading="starting || syncing"
                        :disabled="!selectedClient || !periodo"
                        @click="sincronizar"
                    >
                        {{ ticket ? 'Volver a sincronizar' : 'Sincronizar con SUNAT' }}
                    </v-btn>
                </div>
            </div>

            <v-empty-state
                v-if="!canRead"
                icon="mdi-lock-outline"
                title="Sin acceso"
                text="Tu rol no tiene permiso para consultar el SIRE."
            />

            <template v-else>
                <!-- Selección de cliente y periodo -->
                <div class="filters-bar">
                    <v-autocomplete
                        v-model="selectedClient"
                        v-model:search="clientSearch"
                        :items="clientOptions"
                        :loading="loadingClients"
                        item-title="businessName"
                        item-value="ruc"
                        return-object
                        no-filter
                        label="Cliente"
                        placeholder="Busca por razón social o RUC"
                        prepend-inner-icon="mdi-domain"
                        variant="outlined"
                        density="compact"
                        color="primary"
                        hide-details
                        clearable
                        class="filters-bar-client"
                        no-data-text="No se encontraron clientes activos"
                    >
                        <template #item="{ props, item }">
                            <v-list-item v-bind="props" :subtitle="`RUC ${item.raw.ruc}`" />
                        </template>
                    </v-autocomplete>
                    <v-select
                        v-model="periodo"
                        :items="periodOptions"
                        item-title="title"
                        item-value="value"
                        label="Periodo"
                        prepend-inner-icon="mdi-calendar-month-outline"
                        variant="outlined"
                        density="compact"
                        color="primary"
                        hide-details
                        class="filters-bar-period"
                    />
                    <div class="filters-bar-divider d-none d-md-block"></div>
                    <v-text-field
                        v-model="searchKey"
                        placeholder="Comprador, documento, serie o número"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                        color="primary"
                        type="search"
                        class="filters-bar-search"
                        :disabled="!selectedClient"
                    />
                </div>

                <v-empty-state
                    v-if="!selectedClient"
                    icon="mdi-file-document-multiple-outline"
                    title="Selecciona un cliente"
                    text="Elige un cliente y un periodo para ver sus ventas sincronizadas desde el SIRE."
                />

                <template v-else>
                    <!-- Sincronización automática -->
                    <div class="auto-sync">
                        <div class="auto-sync-main">
                            <v-switch
                                :model-value="autoSync.activo"
                                :loading="savingAutoSync"
                                :disabled="!canSync || savingAutoSync || loadingAutoSync"
                                color="primary"
                                density="compact"
                                hide-details
                                inset
                                class="auto-sync-switch"
                                @update:model-value="guardarAutoSync($event, autoSyncIntervalo)"
                            />
                            <div class="min-w-0">
                                <p class="auto-sync-title">Sincronización automática</p>
                                <p class="auto-sync-text">{{ autoSyncText }}</p>
                            </div>
                        </div>
                        <v-select
                            :model-value="autoSyncIntervalo"
                            :items="intervalOptions"
                            item-title="title"
                            item-value="value"
                            label="Frecuencia"
                            prepend-inner-icon="mdi-timer-outline"
                            variant="outlined"
                            density="compact"
                            color="primary"
                            hide-details
                            class="auto-sync-interval"
                            :disabled="!canSync || savingAutoSync || loadingAutoSync"
                            @update:model-value="guardarAutoSync(autoSync.activo, $event)"
                        />
                    </div>
                    <v-alert
                        v-if="autoSync.ultimoError"
                        type="warning"
                        variant="tonal"
                        density="compact"
                        icon="mdi-timer-alert-outline"
                        class="sync-alert"
                    >
                        <div class="sync-alert-title">
                            {{ autoSync.activo
                                ? `Falló la última sincronización automática (${autoSync.erroresConsecutivos} de 3 intentos)`
                                : 'La sincronización automática se pausó tras 3 errores seguidos' }}
                        </div>
                        <div class="sync-alert-text">
                            {{ autoSync.ultimoError }}
                            <template v-if="!autoSync.activo && canSync"> Corrige el problema y vuelve a activarla.</template>
                        </div>
                    </v-alert>

                    <!-- Estado de la sincronización -->
                    <!-- Mientras carga sin ticket todavía no se sabe si el periodo se sincronizó: no mostrar nada. -->
                    <v-alert
                        v-if="syncStatus && !(loading && !ticket)"
                        :type="syncStatus.type"
                        :icon="syncStatus.icon"
                        variant="tonal"
                        density="compact"
                        class="sync-alert"
                    >
                        <div class="sync-alert-title">{{ syncStatus.title }}</div>
                        <div v-if="syncStatus.text" class="sync-alert-text">{{ syncStatus.text }}</div>
                        <v-progress-linear v-if="syncing" indeterminate color="primary" class="mt-2" rounded />
                    </v-alert>

                    <!-- Totales del periodo -->
                    <v-row class="stats-row" dense>
                        <v-col class="stat-col">
                            <v-card class="stat-card" variant="outlined" style="border-top-color: #2563EB">
                                <p class="stat-label">Comprobantes</p>
                                <p class="stat-value">{{ resumen.cantidad }}</p>
                            </v-card>
                        </v-col>
                        <v-col class="stat-col">
                            <v-card class="stat-card" variant="outlined" style="border-top-color: #6B6F76">
                                <p class="stat-label">Base imponible</p>
                                <p class="stat-value">{{ money(resumen.baseImponible) }}</p>
                            </v-card>
                        </v-col>
                        <v-col class="stat-col">
                            <v-card class="stat-card" variant="outlined" style="border-top-color: #B7791F">
                                <p class="stat-label">IGV</p>
                                <p class="stat-value">{{ money(resumen.igv) }}</p>
                            </v-card>
                        </v-col>
                        <v-col class="stat-col">
                            <v-card class="stat-card" variant="outlined" style="border-top-color: #1D8A4E">
                                <p class="stat-label">Importe total</p>
                                <p class="stat-value stat-value--green">{{ money(resumen.importeTotal) }}</p>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Tabla (desktop) -->
                    <v-data-table-server
                        class="sire-table d-none d-md-block"
                        :headers="headers"
                        :items="ventas"
                        :items-length="totalItems"
                        v-model:page="page"
                        v-model:items-per-page="itemsPerPage"
                        :loading="loading"
                        @update:options="loadVentas"
                    >
                        <template #item.fechaEmision="{ item }">
                            <span class="mono-text">{{ date(item.fechaEmision) }}</span>
                        </template>
                        <template #item.comprobante="{ item }">
                            <div class="doc-cell">
                                <v-chip size="small" variant="tonal" :color="tipoColor(item.tipoComprobante)" class="text-none">
                                    {{ tipoLabel(item.tipoComprobante) }}
                                </v-chip>
                                <span class="mono-text">{{ comprobante(item) }}</span>
                            </div>
                        </template>
                        <template #item.cliente="{ item }">
                            <div class="min-w-0">
                                <p class="buyer-name">{{ item.clienteNombre || '—' }}</p>
                                <p class="buyer-doc">{{ documento(item) }}</p>
                            </div>
                        </template>
                        <template #item.baseImponible="{ item }">
                            <span class="amount">{{ money(item.baseImponible) }}</span>
                        </template>
                        <template #item.igv="{ item }">
                            <span class="amount">{{ money(item.igv) }}</span>
                        </template>
                        <template #item.importeTotal="{ item }">
                            <span class="amount amount--total">{{ money(item.importeTotal) }}</span>
                        </template>
                        <template #no-data>
                            <v-empty-state
                                icon="mdi-receipt-text-outline"
                                :title="searchKey ? 'Sin resultados' : 'Sin ventas'"
                                :text="emptyText"
                            />
                        </template>
                        <template #bottom>
                            <div class="table-footer">
                                <div class="table-footer-info">
                                    <span>Filas por página</span>
                                    <v-select
                                        v-model="itemsPerPage"
                                        :items="[20, 50, 100]"
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

                    <!-- Cards (móvil) -->
                    <div class="d-md-none sire-mobile">
                        <v-empty-state
                            v-if="!loading && ventas.length === 0"
                            icon="mdi-receipt-text-outline"
                            :title="searchKey ? 'Sin resultados' : 'Sin ventas'"
                            :text="emptyText"
                        />

                        <v-card v-for="item in ventas" :key="item.ventaId" variant="outlined" class="venta-card">
                            <div class="venta-card-head">
                                <div class="doc-cell">
                                    <v-chip size="small" variant="tonal" :color="tipoColor(item.tipoComprobante)" class="text-none">
                                        {{ tipoLabel(item.tipoComprobante) }}
                                    </v-chip>
                                    <span class="mono-text">{{ comprobante(item) }}</span>
                                </div>
                                <span class="mono-text">{{ date(item.fechaEmision) }}</span>
                            </div>
                            <p class="buyer-name mt-2 truncate">{{ item.clienteNombre || '—' }}</p>
                            <p class="buyer-doc">{{ documento(item) }}</p>
                            <div class="venta-card-amounts">
                                <span>Base {{ money(item.baseImponible) }}</span>
                                <span>IGV {{ money(item.igv) }}</span>
                                <span class="amount--total">{{ money(item.importeTotal) }}</span>
                            </div>
                        </v-card>

                        <div v-if="ventas.length > 0" class="table-footer table-footer--mobile">
                            <span class="table-footer-info">{{ rangeStart }}–{{ rangeEnd }} de {{ totalItems }}</span>
                            <div class="table-footer-controls">
                                <v-btn icon="mdi-chevron-left" variant="text" density="comfortable" :disabled="page === 1" @click="page--" />
                                <span class="page-label">Página {{ page }} de {{ totalPages }}</span>
                                <v-btn icon="mdi-chevron-right" variant="text" density="comfortable" :disabled="page >= totalPages" @click="page++" />
                            </div>
                        </div>
                    </div>
                </template>
            </template>
        </div>
    </div>
</template>

<script>
import ClientService from '@/services/ClientService';
import SireService from '@/services/SireService';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/ui';

// El cron del backend revisa los tickets cada 60 s; consultar más seguido no acelera nada.
const POLL_INTERVAL_MS = 10000;
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const TIPOS_COMPROBANTE = {
    '01': { label: 'Factura', color: '#2455A4' },
    '03': { label: 'Boleta', color: '#7C4FB0' },
    '07': { label: 'Nota de crédito', color: '#B42318' },
    '08': { label: 'Nota de débito', color: '#B7791F' },
    '12': { label: 'Ticket', color: '#6B6F76' },
};
const DEFAULT_INTERVALO = 6;
const SIN_PROGRAMACION = { activo: false, intervaloHoras: null, proximaEjecucion: null, ultimaEjecucion: null, erroresConsecutivos: 0, ultimoError: null };
const TIPOS_DOCUMENTO ={ '0': 'Doc.', '1': 'DNI', '4': 'C.E.', '6': 'RUC', '7': 'Pasaporte', 'A': 'C.D.I.' };
const moneyFormat = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

// Últimos 36 meses, del más reciente al más antiguo. Valor en formato SUNAT: yyyyMM.
function buildPeriodOptions() {
    const now = new Date();
    const options = [];
    for (let i = 0; i < 36; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        options.push({ value: `${d.getFullYear()}${month}`, title: `${MESES[d.getMonth()]} ${d.getFullYear()}` });
    }
    return options;
}

export default {
    name: "SireVentas",
    data() {
        const periodOptions = buildPeriodOptions();
        return {
            authStore: useAuthStore(),

            clientOptions: [],
            clientSearch: null,
            clientSearchTimer: null,
            loadingClients: false,
            selectedClient: null,

            periodOptions,
            // Por defecto el mes anterior: el que normalmente se declara.
            periodo: periodOptions[1].value,

            searchKey: null,
            searchTimer: null,

            headers: [
                { title: 'Fecha', key: 'fechaEmision', sortable: false },
                { title: 'Comprobante', key: 'comprobante', sortable: false },
                { title: 'Comprador', key: 'cliente', sortable: false },
                { title: 'Base imponible', key: 'baseImponible', align: 'end', sortable: false },
                { title: 'IGV', key: 'igv', align: 'end', sortable: false },
                { title: 'Total', key: 'importeTotal', align: 'end', sortable: false },
            ],
            ventas: [],
            page: 1,
            itemsPerPage: 20,
            totalItems: 0,
            loading: false,
            // Descarta respuestas de una selección anterior (ej. el usuario cambió de cliente mientras cargaba).
            loadSeq: 0,

            resumen: { cantidad: 0, baseImponible: 0, igv: 0, importeTotal: 0 },
            ticket: null,
            starting: false,
            pollTimer: null,

            exporting: false,
            exportOptions: [
                { value: 'BOLETAS', title: 'Boletas', subtitle: 'Incluye sus notas de crédito y débito', icon: 'mdi-receipt-text-outline' },
                { value: 'FACTURAS', title: 'Facturas', subtitle: 'Incluye sus notas de crédito y débito', icon: 'mdi-file-document-outline' },
                { value: 'TODOS', title: 'Todos los comprobantes', subtitle: 'Todas las ventas del periodo', icon: 'mdi-file-table-outline' },
            ],

            intervalOptions: [1, 3, 6, 12, 24].map(h => ({ value: h, title: h === 1 ? 'Cada hora' : `Cada ${h} horas` })),
            autoSync: { ...SIN_PROGRAMACION },
            loadingAutoSync: false,
            savingAutoSync: false,
            autoSyncSeq: 0,
        }
    },
    computed: {
        canRead() {
            return this.authStore.hasPermission('SIRE_READ');
        },
        canSync() {
            return this.authStore.hasPermission('SIRE_SYNC');
        },
        syncing() {
            return !!this.ticket?.enProceso;
        },
        periodoLabel() {
            return this.periodOptions.find(p => p.value === this.periodo)?.title || this.periodo;
        },
        syncStatus() {
            const t = this.ticket;
            if (!t) {
                return {
                    type: 'info', icon: 'mdi-cloud-off-outline',
                    title: `${this.periodoLabel} aún no se ha sincronizado con SUNAT.`,
                    text: this.canSync ? 'Usa "Sincronizar con SUNAT" para descargar la propuesta de ventas.' : null,
                };
            }
            const when = this.dateTime(t.fechaActualizacion || t.fechaCreacion);
            switch (t.estado) {
                case 'PENDIENTE':
                case 'DESCARGANDO':
                    return {
                        type: 'info', icon: 'mdi-cloud-sync-outline',
                        title: t.estado === 'DESCARGANDO' ? 'Descargando el archivo de SUNAT…' : 'SUNAT está procesando la solicitud…',
                        // "Reintentando: ..." cuando SUNAT no respondió en el último intento.
                        text: t.mensaje || 'Puede tardar unos minutos. Puedes salir de esta pantalla; la sincronización continúa.',
                    };
                case 'COMPLETADO':
                    return {
                        type: 'success', icon: 'mdi-cloud-check-outline',
                        title: `Sincronizado el ${when}`,
                        // Con 0 ventas el backend deja el motivo en mensaje ("SUNAT no reporta ventas...").
                        text: t.mensaje || `${t.cantidadRegistros ?? 0} comprobantes descargados de SUNAT.`,
                    };
                case 'VACIO_SIN_MOVIMIENTOS':
                    return {
                        type: 'info', icon: 'mdi-cloud-check-outline',
                        title: `Sincronizado el ${when}`,
                        text: 'SUNAT no reporta ventas para este periodo.',
                    };
                case 'ERROR':
                    return {
                        type: 'error', icon: 'mdi-cloud-alert-outline',
                        title: `La última sincronización falló (${when})`,
                        text: t.mensaje,
                    };
                default:
                    return null;
            }
        },
        autoSyncIntervalo() {
            return this.autoSync.intervaloHoras || DEFAULT_INTERVALO;
        },
        autoSyncText() {
            // El backend siempre sincroniza el mes anterior, sin importar el periodo elegido en pantalla.
            const mesAnterior = this.periodOptions[1].title;
            if (!this.autoSync.activo) {
                return `Desactivada. Al activarla se sincroniza ${mesAnterior} (el mes anterior) con la frecuencia elegida.`;
            }
            const partes = [`Sincroniza ${mesAnterior} (el mes anterior)`];
            if (this.autoSync.proximaEjecucion) partes.push(`Próxima: ${this.dateTime(this.autoSync.proximaEjecucion)}`);
            partes.push(`Última: ${this.autoSync.ultimaEjecucion ? this.dateTime(this.autoSync.ultimaEjecucion) : 'aún no se ejecuta'}`);
            return partes.join(' · ');
        },
        emptyText() {
            if (this.searchKey) return 'No hay comprobantes que coincidan con tu búsqueda.';
            if (this.syncing) return 'Las ventas aparecerán aquí cuando termine la sincronización.';
            return this.ticket ? 'No hay ventas registradas para este periodo.' : 'Sincroniza el periodo para ver sus ventas.';
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
    },
    methods: {
        money(value) {
            return moneyFormat.format(Number(value ?? 0));
        },
        // "2026-09-05" -> "05/09/2026" sin pasar por Date (evita desfases de zona horaria).
        date(value) {
            if (!value) return '—';
            const [y, m, d] = value.split('-');
            return `${d}/${m}/${y}`;
        },
        dateTime(value) {
            if (!value) return '—';
            return new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
        },
        tipoLabel(tipo) {
            return TIPOS_COMPROBANTE[tipo]?.label || `Tipo ${tipo || '—'}`;
        },
        tipoColor(tipo) {
            return TIPOS_COMPROBANTE[tipo]?.color || '#6B6F76';
        },
        comprobante(item) {
            return [item.serie, item.numero].filter(Boolean).join('-') || '—';
        },
        documento(item) {
            if (!item.clienteNroDoc) return 'Sin documento';
            return `${TIPOS_DOCUMENTO[item.clienteTipoDoc] || 'Doc.'} ${item.clienteNroDoc}`;
        },

        async searchClients() {
            this.loadingClients = true;
            try {
                // Solo clientes activos: el backend no sincroniza clientes desactivados.
                const response = await ClientService.getClients(0, 20, this.clientSearch, true);
                this.clientOptions = response.content;
            } catch (error) {
                this.clientOptions = [];
            } finally {
                this.loadingClients = false;
            }
        },

        // Enlaces del dashboard: /sire/ventas?ruc=...&periodo=... abre directo ese cliente y periodo.
        async applyRouteQuery(reemplazar = false) {
            const { ruc, periodo } = this.$route.query;
            if (periodo && this.periodOptions.some(p => p.value === periodo)) {
                this.periodo = periodo;
            }
            if (!ruc) return;
            try {
                // Sin filtrar por activo: el enlace puede venir de un cliente que se desactivó después.
                const response = await ClientService.getClients(0, 5, ruc, null);
                const client = response.content.find(c => c.ruc === ruc);
                if (client && (reemplazar || !this.selectedClient) && client.ruc !== this.selectedClient?.ruc) {
                    this.clientOptions = [client, ...this.clientOptions.filter(c => c.ruc !== ruc)];
                    this.selectedClient = client;
                }
            } catch (error) {
                // El mensaje ya se mostró; el usuario puede elegir el cliente a mano.
            }
        },
        async loadVentas() {
            if (!this.selectedClient || !this.canRead) return;
            const seq = ++this.loadSeq;
            this.loading = true;
            try {
                const response = await SireService.getVentas(
                    this.selectedClient.ruc, this.periodo, this.searchKey, this.page - 1, this.itemsPerPage);
                if (seq !== this.loadSeq) return;
                this.ventas = response.ventas.content;
                this.totalItems = response.ventas.totalElements;
                this.resumen = response.resumen;
                this.ticket = response.ultimaSincronizacion;
                // Si se abre un periodo que alguien ya está sincronizando, se sigue su avance.
                if (this.syncing) this.startPolling();
            } catch (error) {
                if (seq !== this.loadSeq) return;
                this.ventas = [];
                this.totalItems = 0;
            } finally {
                if (seq === this.loadSeq) this.loading = false;
            }
        },
        reloadFromFirstPage() {
            if (this.page === 1) {
                this.loadVentas();
            } else {
                this.page = 1; // la tabla emite update:options y recarga
            }
        },

        async exportar(tipo) {
            this.exporting = true;
            try {
                const nombre = await SireService.exportarVentas(this.selectedClient.ruc, this.periodo, tipo);
                useUiStore().setSuccess(`Descargado ${nombre}`);
            } catch (error) {
                // El mensaje del backend (ej. "No hay boletas sincronizadas...") ya se mostró en el snackbar.
            } finally {
                this.exporting = false;
            }
        },
        async sincronizar() {
            this.starting = true;
            try {
                this.ticket = await SireService.sincronizarVentas(this.selectedClient.ruc, this.periodo);
                useUiStore().setSuccess('Sincronización iniciada. SUNAT puede tardar unos minutos.');
                if (this.syncing) {
                    this.startPolling();
                } else {
                    this.reloadFromFirstPage();
                }
            } catch (error) {
                // El mensaje del backend ya se mostró en el snackbar.
            } finally {
                this.starting = false;
            }
        },
        async loadAutoSync() {
            const seq = ++this.autoSyncSeq;
            this.autoSync = { ...SIN_PROGRAMACION };
            if (!this.selectedClient) return;
            this.loadingAutoSync = true;
            try {
                const programacion = await SireService.getProgramacionVentas(this.selectedClient.ruc);
                if (seq === this.autoSyncSeq) this.autoSync = programacion;
            } catch (error) {
                // El mensaje ya se mostró; queda como desactivada.
            } finally {
                if (seq === this.autoSyncSeq) this.loadingAutoSync = false;
            }
        },
        async guardarAutoSync(activo, intervaloHoras) {
            const seq = this.autoSyncSeq;
            this.savingAutoSync = true;
            try {
                const programacion = await SireService.guardarProgramacionVentas(this.selectedClient.ruc, !!activo, intervaloHoras);
                if (seq !== this.autoSyncSeq) return;
                this.autoSync = programacion;
                const ui = useUiStore();
                if (!activo) {
                    ui.setSuccess('Sincronización automática desactivada');
                } else {
                    const intervalo = this.intervalOptions.find(o => o.value === intervaloHoras)?.title.toLowerCase();
                    ui.setSuccess(`Sincronización automática activada: ${intervalo}`);
                }
            } catch (error) {
                // El mensaje del backend ya se mostró; el switch y el select siguen mostrando lo guardado.
            } finally {
                if (seq === this.autoSyncSeq) this.savingAutoSync = false;
            }
        },
        startPolling() {
            if (this.pollTimer) return;
            this.pollTimer = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
        },
        stopPolling() {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        },
        async poll() {
            this.pollTimer = null;
            const ticketId = this.ticket?.ticketId;
            if (!ticketId) return;
            try {
                const ticket = await SireService.getEstadoTicket(ticketId);
                // El usuario cambió de cliente/periodo mientras se consultaba.
                if (this.ticket?.ticketId !== ticketId) return;
                this.ticket = ticket;
                if (ticket.enProceso) {
                    this.startPolling();
                } else {
                    this.notifyFinished(ticket);
                    this.reloadFromFirstPage();
                }
            } catch (error) {
                // El error ya se mostró; se deja de consultar para no repetir el aviso cada 10 s.
            }
        },
        notifyFinished(ticket) {
            const ui = useUiStore();
            if (ticket.estado === 'COMPLETADO' && !ticket.cantidadRegistros) {
                ui.setWarning('Sincronización completada: SUNAT reporta 0 ventas para este periodo');
            } else if (ticket.estado === 'COMPLETADO') {
                ui.setSuccess(`Sincronización completada: ${ticket.cantidadRegistros} comprobantes`);
            } else if (ticket.estado === 'VACIO_SIN_MOVIMIENTOS') {
                ui.setWarning('SUNAT no reporta ventas para este periodo');
            } else if (ticket.estado === 'ERROR') {
                ui.setError(ticket.mensaje || 'La sincronización falló');
            }
        },
        resetVentas() {
            this.stopPolling();
            this.loadSeq++;
            this.ventas = [];
            this.totalItems = 0;
            this.ticket = null;
            this.resumen = { cantidad: 0, baseImponible: 0, igv: 0, importeTotal: 0 };
        },
    },
    mounted() {
        if (!this.canRead) return;
        this.applyRouteQuery();
        this.searchClients();
    },
    beforeUnmount() {
        this.stopPolling();
        clearTimeout(this.searchTimer);
        clearTimeout(this.clientSearchTimer);
    },
    watch: {
        // Al llegar desde una alerta estando ya en esta pantalla, el componente se reutiliza (no pasa por mounted).
        '$route.query'(query, previous) {
            if (this.canRead && (query.ruc !== previous?.ruc || query.periodo !== previous?.periodo)) {
                this.applyRouteQuery(true);
            }
        },
        clientSearch(value) {
            // Al elegir un cliente, el autocomplete pone su nombre como texto de búsqueda: no buscar de nuevo.
            if (this.selectedClient && value === this.selectedClient.businessName) return;
            clearTimeout(this.clientSearchTimer);
            this.clientSearchTimer = setTimeout(() => this.searchClients(), 300);
        },
        selectedClient(value, previous) {
            this.resetVentas();
            this.savingAutoSync = false;
            this.loadAutoSync();
            const hadSearch = !!this.searchKey;
            this.searchKey = null; // si tenía texto, su watcher recarga
            // Si antes no había cliente, la tabla se monta ahora y la primera carga la dispara su update:options.
            if (value && previous && !hadSearch) {
                this.reloadFromFirstPage();
            }
        },
        periodo() {
            this.resetVentas();
            this.reloadFromFirstPage();
        },
        searchKey() {
            clearTimeout(this.searchTimer);
            this.searchTimer = setTimeout(() => this.reloadFromFirstPage(), 400);
        },
    },
}
</script>

<style scoped>
.sire-page {
    min-height: 100%;
    background: #F7F7F5;
}

.sire-content {
    max-width: 90rem;
    margin: 0 auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

@media (min-width: 768px) {
    .sire-content {
        padding: 1.75rem 2rem;
    }
}

.sire-header {
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
    max-width: 34rem;
    color: #9AA0A8;
}

.header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
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

.filters-bar-client {
    flex: 2 1 280px;
    min-width: 240px;
}

.filters-bar-period {
    flex: 1 1 180px;
    max-width: 14rem;
}

.filters-bar-search {
    flex: 2 1 240px;
    min-width: 200px;
}

@media (max-width: 767.98px) {
    .filters-bar-client,
    .filters-bar-period,
    .filters-bar-search {
        flex: 1 1 100%;
        max-width: 100%;
        min-width: 0;
    }
}

.filters-bar-divider {
    width: 1px;
    align-self: stretch;
    background: #E1E1DC;
    margin: 0 0.125rem;
}

/* Sincronización automática */
.auto-sync {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem 1.25rem;
    flex-wrap: wrap;
    background: #fff;
    border: 1px solid #E1E1DC;
    border-radius: 0.625rem;
    padding: 0.5rem 0.875rem;
}

.auto-sync-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1 1 320px;
    min-width: 0;
}

.auto-sync-switch {
    flex: 0 0 auto;
}

.auto-sync-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: #14171C;
}

.auto-sync-text {
    font-size: 0.8125rem;
    color: #6B6F76;
}

.auto-sync-interval {
    flex: 0 1 13rem;
    min-width: 11rem;
}

@media (max-width: 767.98px) {
    .auto-sync-interval {
        flex: 1 1 100%;
    }
}

/* Estado de la sincronización */
.sync-alert {
    border-radius: 0.625rem;
}

.sync-alert-title {
    font-weight: 600;
    font-size: 0.875rem;
}

.sync-alert-text {
    font-size: 0.8125rem;
    margin-top: 0.125rem;
}

/* Totales */
.stats-row {
    row-gap: 0.75rem;
}

.stat-col {
    flex: 0 0 50%;
    max-width: 50%;
}

@media (min-width: 960px) {
    .stat-col {
        flex: 0 0 25%;
        max-width: 25%;
    }
}

.stat-card {
    padding: 0.875rem 1rem;
    background-color: #fff;
    border-color: #DED7D7;
    border-top-width: 3px;
    height: 100%;
}

.stat-label {
    font-size: 0.71875rem;
    font-weight: 600;
    color: #6B6F76;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 0.375rem;
    color: #14171C;
    font-variant-numeric: tabular-nums;
    word-break: break-word;
}

.stat-value--green {
    color: #1D8A4E;
}

/* Tabla */
.mono-text {
    font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
    font-size: 0.75rem;
    color: #6B6F76;
}

.sire-table {
    border: 1px solid #E1E1DC;
    border-radius: 0.625rem;
    overflow: hidden;
}

.sire-table :deep(.v-data-table__thead) {
    background-color: #e0f2ff;
}

.sire-table :deep(.v-data-table__th) {
    color: #0369a1;
    font-weight: 600;
}

.doc-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.buyer-name {
    font-weight: 500;
    color: #14171C;
}

.buyer-doc {
    font-size: 0.75rem;
    color: #9AA0A8;
}

.amount {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.amount--total {
    font-weight: 600;
    color: #14171C;
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
.sire-mobile {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
}

.venta-card {
    padding: 1rem;
    border-color: #DED7D7;
    background: #fff;
}

.venta-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.venta-card-amounts {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: #6B6F76;
    font-variant-numeric: tabular-nums;
}

.venta-card-amounts .amount--total {
    font-size: 0.9375rem;
}
</style>
