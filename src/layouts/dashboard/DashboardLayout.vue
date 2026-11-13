<template>
    <div class="dash-page">
        <div class="dash-content">
            <!-- Header -->
            <div class="dash-header">
                <div>
                    <h1 class="header-title">Dashboard</h1>
                    <p class="header-subtitle">
                        Resumen de tus clientes y del SIRE<template v-if="sire"> · ventas de {{ periodoLabel(sire.periodo) }}</template>.
                    </p>
                </div>
                <v-btn
                    v-if="canClients || canSire || canAlerts"
                    variant="outlined"
                    class="text-none"
                    prepend-icon="mdi-refresh"
                    :loading="loading"
                    @click="load"
                >
                    Actualizar
                </v-btn>
            </div>

            <v-empty-state
                v-if="!canClients && !canSire && !canAlerts"
                icon="mdi-view-dashboard-outline"
                title="Nada que mostrar"
                text="Tu rol no tiene acceso a los módulos de clientes ni del SIRE."
            />

            <template v-else>
                <!-- Indicadores -->
                <v-row class="stats-row" dense>
                    <template v-if="canClients">
                        <v-col class="stat-col">
                            <v-card class="stat-card" variant="outlined" style="border-top-color: #2563EB">
                                <p class="stat-label">Clientes activos</p>
                                <p class="stat-value">{{ clientes ? clientes.activos : '—' }}</p>
                                <p class="stat-hint">
                                    <template v-if="clientes">de {{ clientes.total }} registrados · {{ clientes.inactivos }} inactivos</template>
                                </p>
                            </v-card>
                        </v-col>
                        <v-col class="stat-col">
                            <v-card
                                class="stat-card stat-card--link"
                                variant="outlined"
                                :style="{ borderTopColor: sinCredenciales ? '#B7791F' : '#1D8A4E' }"
                                to="/clientes/ver-clientes"
                            >
                                <p class="stat-label">Sin credenciales API</p>
                                <p class="stat-value" :class="{ 'stat-value--warning': sinCredenciales }">
                                    {{ clientes ? clientes.activosSinCredencialesApi : '—' }}
                                </p>
                                <p class="stat-hint">
                                    <template v-if="clientes">
                                        {{ sinCredenciales ? 'Clientes activos que no pueden sincronizar el SIRE' : 'Todos los clientes activos pueden sincronizar' }}
                                    </template>
                                </p>
                            </v-card>
                        </v-col>
                    </template>
                    <template v-if="canSire">
                        <v-col class="stat-col">
                            <v-card class="stat-card" variant="outlined" style="border-top-color: #1D8A4E">
                                <p class="stat-label">Ventas {{ sire ? periodoLabel(sire.periodo) : '' }}</p>
                                <p class="stat-value stat-value--green">{{ sire ? money(sire.ventasPeriodo.importeTotal) : '—' }}</p>
                                <p class="stat-hint">
                                    <template v-if="sire">
                                        {{ sire.ventasPeriodo.cantidad }} comprobantes · {{ sire.clientesConVentas }} {{ sire.clientesConVentas === 1 ? 'cliente' : 'clientes' }}
                                    </template>
                                </p>
                            </v-card>
                        </v-col>
                        <v-col class="stat-col">
                            <v-card class="stat-card" variant="outlined" style="border-top-color: #6B6F76">
                                <p class="stat-label">IGV {{ sire ? periodoLabel(sire.periodo) : '' }}</p>
                                <p class="stat-value">{{ sire ? money(sire.ventasPeriodo.igv) : '—' }}</p>
                                <p class="stat-hint">
                                    <template v-if="sire">Base imponible {{ money(sire.ventasPeriodo.baseImponible) }}</template>
                                </p>
                            </v-card>
                        </v-col>
                    </template>
                </v-row>

                <!-- Alertas pendientes -->
                <v-card v-if="canAlerts" variant="outlined" class="panel">
                    <div class="panel-head">
                        <div>
                            <p class="panel-title">
                                Alertas pendientes
                                <span v-if="alertasStore.noLeidas" class="count-badge count-badge--error ml-1">{{ alertasStore.noLeidas }}</span>
                            </p>
                            <p class="panel-subtitle">Vencimientos próximos y días sin ventas. Las ves todas en la campana de arriba.</p>
                        </div>
                    </div>
                    <div v-if="alertas === null" class="panel-loading">
                        <v-progress-circular v-if="loading" indeterminate color="primary" />
                    </div>
                    <p v-else-if="alertas.length === 0" class="panel-empty">
                        <v-icon icon="mdi-check-circle-outline" color="#1D8A4E" size="18" class="mr-1" />
                        No hay alertas pendientes.
                    </p>
                    <div v-else class="list">
                        <router-link
                            v-for="a in alertas"
                            :key="a.id"
                            :to="alertaLink(a)"
                            class="list-item list-item--link"
                            @click="marcarAlertaLeida(a)"
                        >
                            <v-icon :icon="alertaTipo(a.tipo).icon" :color="alertaTipo(a.tipo).color" size="20" />
                            <div class="min-w-0 flex-1">
                                <p class="item-title truncate">{{ a.razonSocial || `RUC ${a.clienteRuc}` }}</p>
                                <p class="item-subtitle item-subtitle--clamp">{{ a.mensaje }}</p>
                            </div>
                            <span class="item-date">{{ haceCuanto(a.fechaCreacion) }}</span>
                        </router-link>
                        <p v-if="alertasStore.noLeidas > alertas.length" class="list-more">
                            y {{ alertasStore.noLeidas - alertas.length }} más
                        </p>
                    </div>
                </v-card>

                <template v-if="canSire">
                    <v-row dense class="row-gap">
                        <!-- Tendencia -->
                        <v-col cols="12" lg="8">
                            <v-card variant="outlined" class="panel">
                                <div class="panel-head">
                                    <div>
                                        <p class="panel-title">Ventas de los últimos 12 meses</p>
                                        <p class="panel-subtitle">Importe total de todos los clientes, según los periodos sincronizados.</p>
                                    </div>
                                    <v-btn-toggle v-model="trendView" density="compact" variant="outlined" divided mandatory class="trend-toggle">
                                        <v-btn value="chart" size="small" class="text-none" prepend-icon="mdi-chart-bar">Gráfico</v-btn>
                                        <v-btn value="table" size="small" class="text-none" prepend-icon="mdi-table">Tabla</v-btn>
                                    </v-btn-toggle>
                                </div>

                                <div v-if="!sire" class="panel-loading">
                                    <v-progress-circular v-if="loading" indeterminate color="primary" />
                                </div>
                                <v-empty-state
                                    v-else-if="!hasTrendData"
                                    icon="mdi-chart-bar"
                                    title="Aún no hay ventas sincronizadas"
                                    text="Sincroniza los periodos de tus clientes en SIRE → Ventas para ver la evolución."
                                    size="48"
                                />

                                <!-- Gráfico de barras (una sola serie: no lleva leyenda) -->
                                <div v-else-if="trendView === 'chart'" class="chart" @mouseleave="hoverIndex = null">
                                    <div class="chart-plot">
                                        <div class="chart-grid">
                                            <div v-for="tick in yTicks" :key="tick" class="chart-gridline" :style="{ bottom: `${tick / yMax * 100}%` }">
                                                <span class="chart-tick">{{ moneyCompact(tick) }}</span>
                                            </div>
                                        </div>
                                        <div class="chart-bars">
                                            <div
                                                v-for="(m, i) in sire.tendencia"
                                                :key="m.periodo"
                                                class="chart-col"
                                                :class="{ 'chart-col--active': hoverIndex === i }"
                                                tabindex="0"
                                                :aria-label="`${periodoLabel(m.periodo)}: ${money(m.importeTotal)}, ${m.cantidad} comprobantes`"
                                                @mouseenter="hoverIndex = i"
                                                @focus="hoverIndex = i"
                                                @blur="hoverIndex = null"
                                            >
                                                <div class="chart-bar" :style="{ height: barHeight(m) }"></div>
                                            </div>
                                        </div>
                                        <div
                                            v-if="hovered"
                                            class="chart-tooltip"
                                            :class="{ 'chart-tooltip--left': hoverIndex > sire.tendencia.length / 2 }"
                                            :style="{ left: `${(hoverIndex + 0.5) / sire.tendencia.length * 100}%` }"
                                        >
                                            <p class="tooltip-title">{{ periodoLabel(hovered.periodo) }}</p>
                                            <p class="tooltip-value">{{ money(hovered.importeTotal) }}</p>
                                            <p class="tooltip-text">{{ hovered.cantidad }} comprobantes</p>
                                            <p class="tooltip-text">
                                                {{ hovered.clientes === 0 ? 'Sin periodos sincronizados' : `${hovered.clientes} ${hovered.clientes === 1 ? 'cliente' : 'clientes'} con ventas` }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="chart-labels">
                                        <span v-for="m in sire.tendencia" :key="m.periodo" class="chart-label">{{ shortMonth(m.periodo) }}</span>
                                    </div>
                                </div>

                                <v-table v-else density="compact" class="trend-table">
                                    <thead>
                                        <tr>
                                            <th>Periodo</th>
                                            <th class="text-end">Comprobantes</th>
                                            <th class="text-end">Clientes</th>
                                            <th class="text-end">Importe total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="m in [...sire.tendencia].reverse()" :key="m.periodo">
                                            <td>{{ periodoLabel(m.periodo) }}</td>
                                            <td class="text-end amount">{{ m.cantidad }}</td>
                                            <td class="text-end amount">{{ m.clientes }}</td>
                                            <td class="text-end amount amount--total">{{ money(m.importeTotal) }}</td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </v-card>
                        </v-col>

                        <!-- Top clientes -->
                        <v-col cols="12" lg="4">
                            <v-card variant="outlined" class="panel">
                                <div class="panel-head">
                                    <div>
                                        <p class="panel-title">Top clientes</p>
                                        <p class="panel-subtitle">Por importe de ventas en {{ sire ? periodoLabel(sire.periodo) : 'el mes anterior' }}.</p>
                                    </div>
                                </div>
                                <div v-if="!sire" class="panel-loading">
                                    <v-progress-circular v-if="loading" indeterminate color="primary" />
                                </div>
                                <p v-else-if="sire.topClientes.length === 0" class="panel-empty">
                                    Ningún cliente tiene ventas sincronizadas de {{ periodoLabel(sire.periodo) }}.
                                </p>
                                <div v-else class="list">
                                    <router-link
                                        v-for="(c, i) in sire.topClientes"
                                        :key="c.ruc"
                                        :to="ventasLink(c.ruc, sire.periodo)"
                                        class="list-item list-item--link"
                                    >
                                        <span class="rank">{{ i + 1 }}</span>
                                        <div class="min-w-0 flex-1">
                                            <p class="item-title truncate">{{ c.razonSocial }}</p>
                                            <p class="item-subtitle">RUC {{ c.ruc }} · {{ c.cantidad }} comprobantes</p>
                                            <div class="share-track">
                                                <div class="share-bar" :style="{ width: share(c.importeTotal) }"></div>
                                            </div>
                                        </div>
                                        <span class="amount amount--total">{{ money(c.importeTotal) }}</span>
                                    </router-link>
                                </div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <v-row dense class="row-gap">
                        <!-- Sincronizaciones -->
                        <v-col cols="12" lg="6">
                            <v-card variant="outlined" class="panel">
                                <div class="panel-head">
                                    <div>
                                        <p class="panel-title">Sincronizaciones</p>
                                        <p class="panel-subtitle">Solicitudes a SUNAT de los últimos {{ sire ? sire.sincronizaciones.dias : 7 }} días.</p>
                                    </div>
                                </div>
                                <div v-if="!sire" class="panel-loading">
                                    <v-progress-circular v-if="loading" indeterminate color="primary" />
                                </div>
                                <template v-else>
                                    <div class="status-grid">
                                        <div v-for="s in syncStatuses" :key="s.key" class="status-item">
                                            <v-icon :icon="s.icon" :color="s.color" size="20" />
                                            <div>
                                                <p class="status-value">{{ sire.sincronizaciones[s.key] }}</p>
                                                <p class="status-label">{{ s.label }}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p class="section-label">
                                        Errores pendientes de revisar
                                        <span v-if="sire.sincronizaciones.totalErroresVigentes" class="count-badge count-badge--error">
                                            {{ sire.sincronizaciones.totalErroresVigentes }}
                                        </span>
                                    </p>
                                    <p v-if="sire.sincronizaciones.erroresVigentes.length === 0" class="panel-empty">
                                        <v-icon icon="mdi-check-circle-outline" color="#1D8A4E" size="18" class="mr-1" />
                                        No hay sincronizaciones con error sin resolver.
                                    </p>
                                    <div v-else class="list">
                                        <router-link
                                            v-for="e in sire.sincronizaciones.erroresVigentes"
                                            :key="e.ticketId"
                                            :to="ventasLink(e.ruc, e.periodo)"
                                            class="list-item list-item--link"
                                        >
                                            <v-icon icon="mdi-cloud-alert-outline" color="#B42318" size="20" />
                                            <div class="min-w-0 flex-1">
                                                <p class="item-title truncate">{{ e.razonSocial }} · {{ periodoLabel(e.periodo) }}</p>
                                                <p class="item-subtitle item-subtitle--clamp">{{ e.mensaje || 'Error sin detalle' }}</p>
                                            </div>
                                            <span class="item-date">{{ dateTime(e.fecha) }}</span>
                                        </router-link>
                                        <p v-if="sire.sincronizaciones.totalErroresVigentes > sire.sincronizaciones.erroresVigentes.length" class="list-more">
                                            y {{ sire.sincronizaciones.totalErroresVigentes - sire.sincronizaciones.erroresVigentes.length }} más
                                        </p>
                                    </div>
                                </template>
                            </v-card>
                        </v-col>

                        <!-- Sincronizaciones automáticas -->
                        <v-col cols="12" lg="6">
                            <v-card variant="outlined" class="panel">
                                <div class="panel-head">
                                    <div>
                                        <p class="panel-title">Sincronización automática</p>
                                        <p class="panel-subtitle">Clientes que sincronizan solos el mes anterior.</p>
                                    </div>
                                </div>
                                <div v-if="!sire" class="panel-loading">
                                    <v-progress-circular v-if="loading" indeterminate color="primary" />
                                </div>
                                <template v-else>
                                    <div class="status-grid status-grid--2">
                                        <div class="status-item">
                                            <v-icon icon="mdi-timer-sync-outline" color="#2563EB" size="20" />
                                            <div>
                                                <p class="status-value">{{ sire.programaciones.activas }}</p>
                                                <p class="status-label">Activas</p>
                                            </div>
                                        </div>
                                        <div class="status-item">
                                            <v-icon icon="mdi-timer-alert-outline" :color="sire.programaciones.pausadas ? '#B7791F' : '#9AA0A8'" size="20" />
                                            <div>
                                                <p class="status-value">{{ sire.programaciones.pausadas }}</p>
                                                <p class="status-label">Pausadas por errores</p>
                                            </div>
                                        </div>
                                    </div>

                                    <template v-if="sire.programaciones.pausadasLista.length">
                                        <p class="section-label">Pausadas</p>
                                        <div class="list">
                                            <router-link
                                                v-for="p in sire.programaciones.pausadasLista"
                                                :key="`pausada-${p.ruc}`"
                                                :to="ventasLink(p.ruc)"
                                                class="list-item list-item--link"
                                            >
                                                <v-icon icon="mdi-pause-circle-outline" color="#B7791F" size="20" />
                                                <div class="min-w-0 flex-1">
                                                    <p class="item-title truncate">{{ p.razonSocial }}</p>
                                                    <p class="item-subtitle item-subtitle--clamp">{{ p.ultimoError || 'Sin detalle del error' }}</p>
                                                </div>
                                            </router-link>
                                        </div>
                                    </template>

                                    <p class="section-label">Próximas ejecuciones</p>
                                    <p v-if="sire.programaciones.proximas.length === 0" class="panel-empty">
                                        Ningún cliente tiene la sincronización automática activa. Actívala desde SIRE → Ventas.
                                    </p>
                                    <div v-else class="list">
                                        <router-link
                                            v-for="p in sire.programaciones.proximas"
                                            :key="`proxima-${p.ruc}`"
                                            :to="ventasLink(p.ruc)"
                                            class="list-item list-item--link"
                                        >
                                            <v-icon icon="mdi-clock-outline" color="#6B6F76" size="20" />
                                            <div class="min-w-0 flex-1">
                                                <p class="item-title truncate">{{ p.razonSocial }}</p>
                                                <p class="item-subtitle">{{ intervalLabel(p.intervaloHoras) }}</p>
                                            </div>
                                            <span class="item-date">{{ relative(p.proximaEjecucion) }}</span>
                                        </router-link>
                                    </div>
                                </template>
                            </v-card>
                        </v-col>
                    </v-row>
                </template>
            </template>
        </div>
    </div>
</template>

<script>
import AlertaService from '@/services/AlertaService';
import DashboardService from '@/services/DashboardService';
import { useAlertasStore } from '@/store/alertasStore';
import { useAuthStore } from '@/store/authStore';
import { alertaLink, alertaTipo, haceCuanto } from '@/utils/alertas';

const ALERTAS_DASHBOARD = 5;

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
const moneyFormat = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const moneyCompactFormat = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', notation: 'compact', maximumFractionDigits: 1 });

// Escala "redonda" para el eje Y: 1, 2, 2.5 o 5 × 10^n.
function niceMax(value) {
    if (value <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(value)));
    const step = [1, 2, 2.5, 5, 10].find(s => s * exp >= value);
    return step * exp;
}

export default {
    name: "DashboardLayout",
    data() {
        return {
            authStore: useAuthStore(),
            alertasStore: useAlertasStore(),
            alertas: null,
            clientes: null,
            sire: null,
            loading: false,
            trendView: 'chart',
            hoverIndex: null,
            syncStatuses: [
                { key: 'enCurso', label: 'En curso', icon: 'mdi-cloud-sync-outline', color: '#2563EB' },
                { key: 'completados', label: 'Completadas', icon: 'mdi-cloud-check-outline', color: '#1D8A4E' },
                { key: 'vacios', label: 'Sin movimientos', icon: 'mdi-cloud-outline', color: '#6B6F76' },
                { key: 'errores', label: 'Con error', icon: 'mdi-cloud-alert-outline', color: '#B42318' },
            ],
        }
    },
    computed: {
        canClients() {
            return this.authStore.hasPermission('CLIENT_READ');
        },
        canSire() {
            return this.authStore.hasPermission('SIRE_READ');
        },
        canAlerts() {
            return this.authStore.hasPermission('ALERT_READ');
        },
        sinCredenciales() {
            return (this.clientes?.activosSinCredencialesApi ?? 0) > 0;
        },
        hasTrendData() {
            return !!this.sire?.tendencia.some(m => m.cantidad > 0);
        },
        yMax() {
            const max = Math.max(0, ...(this.sire?.tendencia || []).map(m => Number(m.importeTotal)));
            return niceMax(max);
        },
        yTicks() {
            return [0, 0.25, 0.5, 0.75, 1].map(f => this.yMax * f);
        },
        hovered() {
            return this.hoverIndex === null ? null : this.sire?.tendencia[this.hoverIndex];
        },
        topMax() {
            return Math.max(0, ...(this.sire?.topClientes || []).map(c => Number(c.importeTotal)));
        },
    },
    methods: {
        async load() {
            this.loading = true;
            // Cada sección se pide por separado: si una falla, la otra se muestra igual.
            const tareas = [];
            if (this.canClients) {
                tareas.push(DashboardService.getResumenClientes().then(r => { this.clientes = r; }).catch(() => {}));
            }
            if (this.canSire) {
                tareas.push(DashboardService.getResumenSire().then(r => { this.sire = r; }).catch(() => {}));
            }
            if (this.canAlerts) {
                tareas.push(AlertaService.getAlertas(false, 0, ALERTAS_DASHBOARD).then(r => { this.alertas = r.content; }).catch(() => {}));
                tareas.push(this.alertasStore.refreshCount());
            }
            await Promise.all(tareas);
            this.loading = false;
        },
        alertaLink,
        alertaTipo,
        haceCuanto,
        // El enlace navega igual; marcar como leída va en paralelo.
        marcarAlertaLeida(alerta) {
            this.alertasStore.descontar();
            AlertaService.marcarLeida(alerta.id).catch(() => this.alertasStore.refreshCount());
        },
        money(value) {
            return moneyFormat.format(Number(value ?? 0));
        },
        moneyCompact(value) {
            return moneyCompactFormat.format(value);
        },
        periodoLabel(periodo) {
            if (!periodo) return '';
            return `${MESES[Number(periodo.slice(4)) - 1]} ${periodo.slice(0, 4)}`;
        },
        // En enero se agrega el año para ubicar el cambio de año en el eje.
        shortMonth(periodo) {
            const mes = Number(periodo.slice(4));
            return mes === 1 ? `${MESES_CORTOS[0]} ${periodo.slice(2, 4)}` : MESES_CORTOS[mes - 1];
        },
        barHeight(m) {
            const value = Number(m.importeTotal);
            if (value <= 0) return '0';
            // Mínimo visible para que un mes con ventas pequeñas no desaparezca.
            return `max(3px, ${value / this.yMax * 100}%)`;
        },
        share(importe) {
            return this.topMax > 0 ? `${Number(importe) / this.topMax * 100}%` : '0';
        },
        dateTime(value) {
            if (!value) return '—';
            return new Date(value).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
        },
        relative(value) {
            if (!value) return '—';
            const minutos = Math.round((new Date(value) - Date.now()) / 60000);
            if (minutos <= 5) return 'En unos minutos';
            if (minutos < 60) return `En ${minutos} min`;
            const horas = Math.round(minutos / 60);
            return horas < 24 ? `En ${horas} h` : this.dateTime(value);
        },
        intervalLabel(horas) {
            return horas === 1 ? 'Cada hora' : `Cada ${horas} horas`;
        },
        ventasLink(ruc, periodo) {
            return { path: '/sire/ventas', query: periodo ? { ruc, periodo } : { ruc } };
        },
    },
    mounted() {
        this.load();
    },
}
</script>

<style scoped>
.dash-page {
    min-height: 100%;
    background: #F7F7F5;
}

.dash-content {
    max-width: 90rem;
    margin: 0 auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

@media (min-width: 768px) {
    .dash-content {
        padding: 1.75rem 2rem;
    }
}

.dash-header {
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
    color: #9AA0A8;
}

/* Indicadores */
.stats-row {
    row-gap: 0.75rem;
}

.stat-col {
    flex: 0 0 50%;
    max-width: 50%;
}

@media (min-width: 960px) {
    .stat-col {
        flex: 1 1 0;
        max-width: none;
    }
}

@media (max-width: 479.98px) {
    .stat-col {
        flex: 0 0 100%;
        max-width: 100%;
    }
}

.stat-card {
    padding: 0.875rem 1rem;
    background-color: #fff;
    border-color: #DED7D7;
    border-top-width: 3px;
    height: 100%;
}

.stat-card--link:hover {
    background-color: #FAFAF8;
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
    font-variant-numeric: tabular-nums;
    word-break: break-word;
}

.stat-value--green {
    color: #1D8A4E;
}

.stat-value--warning {
    color: #B7791F;
}

.stat-hint {
    font-size: 0.75rem;
    margin-top: 0.125rem;
    color: #9AA0A8;
    min-height: 1.125rem;
}

/* Paneles */
.row-gap {
    row-gap: 0.75rem;
}

.panel {
    background: #fff;
    border-color: #E1E1DC;
    border-radius: 0.625rem;
    padding: 1rem 1.125rem;
    height: 100%;
}

.panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
}

.panel-title {
    font-weight: 600;
    font-size: 0.9375rem;
    color: #14171C;
}

.panel-subtitle {
    font-size: 0.75rem;
    color: #9AA0A8;
    margin-top: 0.125rem;
}

.panel-loading {
    display: flex;
    justify-content: center;
    padding: 2.5rem 0;
}

.panel-empty {
    display: flex;
    align-items: center;
    font-size: 0.8125rem;
    color: #6B6F76;
    padding: 0.5rem 0;
}

.section-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.71875rem;
    font-weight: 600;
    color: #6B6F76;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin: 1.25rem 0 0.5rem;
}

.count-badge {
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 0 0.4rem;
    border-radius: 999px;
    letter-spacing: 0;
}

.count-badge--error {
    background: #FDECEA;
    color: #B42318;
}

/* Gráfico */
.chart {
    padding-left: 3.75rem;
}

.chart-plot {
    position: relative;
    height: 14rem;
}

.chart-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.chart-gridline {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px solid #EFEFEC;
}

.chart-gridline:first-child {
    border-top-color: #D5D5D0;
}

.chart-tick {
    position: absolute;
    right: calc(100% + 0.5rem);
    transform: translateY(-50%);
    font-size: 0.6875rem;
    color: #9AA0A8;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

.chart-bars {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: stretch;
}

.chart-col {
    flex: 1 1 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0 2px;
    cursor: default;
    outline: none;
}

.chart-col:focus-visible {
    box-shadow: inset 0 0 0 2px #93B4F5;
    border-radius: 4px;
}

.chart-col--active {
    background: rgba(37, 99, 235, 0.06);
}

.chart-bar {
    width: 100%;
    max-width: 2.25rem;
    background: #2563EB;
    border-radius: 4px 4px 0 0;
    transition: height 0.3s ease;
}

.chart-col--active .chart-bar {
    background: #1D4FC4;
}

.chart-labels {
    display: flex;
    margin-top: 0.375rem;
}

.chart-label {
    flex: 1 1 0;
    text-align: center;
    font-size: 0.6875rem;
    color: #6B6F76;
    white-space: nowrap;
}

@media (max-width: 599.98px) {
    .chart {
        padding-left: 3.25rem;
    }

    /* En pantallas angostas solo se rotulan los meses alternos. */
    .chart-label:nth-child(even) {
        visibility: hidden;
    }
}

.chart-tooltip {
    position: absolute;
    top: 0;
    transform: translateX(0.75rem);
    background: #14171C;
    color: #fff;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    pointer-events: none;
    white-space: nowrap;
    z-index: 2;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chart-tooltip--left {
    transform: translateX(calc(-100% - 0.75rem));
}

.tooltip-title {
    font-size: 0.71875rem;
    color: #C5C9CF;
}

.tooltip-value {
    font-size: 0.9375rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.tooltip-text {
    font-size: 0.71875rem;
    color: #C5C9CF;
}

.trend-table :deep(th) {
    font-weight: 600 !important;
    color: #6B6F76 !important;
}

/* Listas */
.list {
    display: flex;
    flex-direction: column;
}

.list-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.5rem;
    margin: 0 -0.5rem;
    border-radius: 0.5rem;
    color: inherit;
    text-decoration: none;
}

.list-item + .list-item {
    border-top: 1px solid #F1F1EE;
}

.list-item--link:hover {
    background: #F7F7F5;
}

.list-more {
    font-size: 0.75rem;
    color: #9AA0A8;
    padding-top: 0.375rem;
}

.rank {
    flex: 0 0 1.5rem;
    height: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #EEF3FD;
    color: #2455A4;
    font-size: 0.75rem;
    font-weight: 700;
}

.item-title {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #14171C;
}

.item-subtitle {
    font-size: 0.75rem;
    color: #9AA0A8;
}

.item-subtitle--clamp {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.item-date {
    font-size: 0.75rem;
    color: #6B6F76;
    white-space: nowrap;
}

.share-track {
    height: 4px;
    background: #F1F1EE;
    border-radius: 999px;
    margin-top: 0.375rem;
    overflow: hidden;
}

.share-bar {
    height: 100%;
    background: #2563EB;
    border-radius: 999px;
}

.amount {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.amount--total {
    font-weight: 600;
    color: #14171C;
    font-size: 0.8125rem;
}

/* Estados */
.status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
}

@media (min-width: 600px) {
    .status-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .status-grid--2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.status-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem 0.75rem;
    border: 1px solid #EFEFEC;
    border-radius: 0.5rem;
}

.status-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: #14171C;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
}

.status-label {
    font-size: 0.71875rem;
    color: #6B6F76;
}
</style>
