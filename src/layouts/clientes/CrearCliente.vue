<template>
    <div class="client-page flex flex-col h-full">
        <!-- Header -->
        <div class="client-topbar px-6 pt-6 pb-5">
            <div class="client-topbar-inner">
                <p class="header-eyebrow">{{ isEdit ? 'Editar cliente' : 'Nuevo cliente' }}</p>
                <h1 class="header-title">{{ isEdit ? 'Editar cliente' : 'Registrar cliente' }}</h1>
                <p class="header-subtitle">
                    {{ isEdit ? 'Actualiza los datos del contribuyente y guarda los cambios' : 'Ingresa los datos del contribuyente y su acceso SOL para monitorear su buzón SUNAT' }}
                </p>
            </div>
        </div>

        <div class="client-content">
            <v-form ref="form" v-model="valid">
                <!-- ============================================================ -->
                <!-- Móvil: una sola columna -->
                <!-- ============================================================ -->
                <div class="d-md-none">
                    <div class="px-6 mt-4">
                        <div class="preview-card">
                            <div class="preview-avatar">{{ initials }}</div>
                            <div class="preview-info min-w-0">
                                <p class="preview-name truncate">{{ businessName || 'Razón social del cliente' }}</p>
                                <p class="preview-doc mono-text truncate">RUC {{ ruc || '— — — — — — — — — — —' }}</p>
                            </div>
                            <div class="preview-badges">
                                <span v-if="hasSolCredentials" class="preview-badge preview-badge--ok"><v-icon size="14">mdi-key-variant</v-icon></span>
                                <span v-if="phoneNumber" class="preview-badge"><v-icon size="14">mdi-phone</v-icon></span>
                                <span v-if="email" class="preview-badge"><v-icon size="14">mdi-email-outline</v-icon></span>
                            </div>
                        </div>
                    </div>

                    <div class="wizard-body px-6 mt-6">
                        <p class="section-label">Datos del contribuyente</p>

                        <div class="field-block">
                            <label class="field-label">RUC <span class="req">*</span></label>
                            <div class="doc-lookup-row">
                                <v-text-field
                                    v-model="ruc"
                                    variant="outlined"
                                    density="compact"
                                    color="primary"
                                    placeholder="20123456789"
                                    maxlength="11"
                                    class="mono-text flex-grow-1"
                                    :rules="[rules.required, rules.ruc]"
                                />
                                <v-btn icon color="primary" class="lookup-btn" :loading="looking" :disabled="!canLookup" @click="lookupRuc">
                                    <v-icon>mdi-magnify</v-icon>
                                </v-btn>
                            </div>
                            <div v-if="found" class="found-hint">
                                <v-icon size="14" color="primary">mdi-check-circle</v-icon>
                                <span>Datos encontrados en el padrón SUNAT</span>
                            </div>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Razón social <span class="req">*</span></label>
                            <v-text-field
                                v-model="businessName"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="Ej. Comercializadora Andina S.A.C."
                                :rules="[rules.required]"
                            />
                        </div>

                        <div class="field-block">
                            <div class="field-head">
                                <label class="field-label">Nombre comercial</label>
                                <span class="field-hint">Opcional</span>
                            </div>
                            <v-text-field
                                v-model="tradeName"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="Ej. Andina Market"
                            />
                        </div>

                        <div class="field-block">
                            <div class="field-head">
                                <label class="field-label">Dirección fiscal</label>
                                <span class="field-hint">Opcional</span>
                            </div>
                            <v-text-field
                                v-model="address"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="Av. Ejemplo 123, Lima"
                                prepend-inner-icon="mdi-map-marker-outline"
                                :rules="[rules.address]"
                            />
                        </div>

                        <p class="section-label mt-6">Acceso SUNAT (Clave SOL)</p>

                        <div class="sol-hint">
                            <v-icon size="16" color="primary">mdi-shield-lock-outline</v-icon>
                            <span>Se usa solo para leer el buzón electrónico del cliente.</span>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Usuario SOL <span class="req">*</span></label>
                            <v-text-field
                                v-model="solUser"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="USUARIO1"
                                prepend-inner-icon="mdi-account-key-outline"
                                class="mono-text"
                                :rules="[rules.required]"
                            />
                        </div>

                        <div class="field-block">
                            <div class="field-head">
                                <label class="field-label">Clave SOL <span v-if="!isEdit" class="req">*</span></label>
                                <span v-if="isEdit" class="field-hint">Vacía = conservar la actual</span>
                            </div>
                            <v-text-field
                                v-model="solPassword"
                                :type="showPassword ? 'text' : 'password'"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="••••••••"
                                prepend-inner-icon="mdi-lock-outline"
                                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                autocomplete="new-password"
                                :rules="[rules.solPassword]"
                                @click:append-inner="showPassword = !showPassword"
                            />
                        </div>

                        <div class="field-head mt-6">
                            <p class="section-label mb-0">Credenciales API SUNAT</p>
                            <span class="field-hint">Opcional</span>
                        </div>

                        <div class="sol-hint mt-2">
                            <v-icon size="16" color="primary">mdi-api</v-icon>
                            <span>Se generan en SUNAT Operaciones en Línea, en "Credenciales de API SUNAT". Se usan para consultar el SIRE.</span>
                        </div>

                        <div class="field-block">
                            <label class="field-label">Client ID</label>
                            <v-text-field
                                ref="apiIdMobile"
                                v-model="sunatClientId"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                prepend-inner-icon="mdi-identifier"
                                class="mono-text"
                                :rules="[rules.sunatClientId]"
                            />
                        </div>

                        <div class="field-block">
                            <div class="field-head">
                                <label class="field-label">Client Secret</label>
                                <span v-if="isEdit && hadSunatClientSecret" class="field-hint">Vacío = conservar el actual</span>
                            </div>
                            <v-text-field
                                ref="apiSecretMobile"
                                v-model="sunatClientSecret"
                                :type="showSecret ? 'text' : 'password'"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="••••••••"
                                prepend-inner-icon="mdi-key-outline"
                                :append-inner-icon="showSecret ? 'mdi-eye-off' : 'mdi-eye'"
                                autocomplete="new-password"
                                :rules="[rules.sunatClientSecret]"
                                @click:append-inner="showSecret = !showSecret"
                            />
                        </div>

                        <p class="section-label mt-6">Alertas</p>

                        <div class="field-block">
                            <v-switch
                                v-model="trabajaDomingos"
                                color="primary"
                                density="compact"
                                inset
                                hide-details
                                label="Trabaja domingos"
                            />
                            <p class="switch-hint">Si está apagado, los domingos sin ventas no se avisan como días sin ventas.</p>
                        </div>

                        <p class="section-label mt-6">Datos de contacto</p>

                        <div class="field-block">
                            <div class="field-head">
                                <label class="field-label">Persona de contacto</label>
                                <span class="field-hint">Opcional</span>
                            </div>
                            <v-text-field
                                v-model="contactName"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="Ej. María Fernanda Torres"
                                prepend-inner-icon="mdi-account-outline"
                            />
                        </div>

                        <div class="field-block">
                            <div class="field-head">
                                <label class="field-label">Número de contacto</label>
                                <span class="field-hint">Opcional</span>
                            </div>
                            <v-text-field
                                v-model="phoneNumber"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="999999999"
                                prepend-inner-icon="mdi-phone-outline"
                                :rules="[rules.phone]"
                            />
                        </div>

                        <div class="field-block">
                            <div class="field-head">
                                <label class="field-label">Correo</label>
                                <span class="field-hint">Opcional</span>
                            </div>
                            <v-text-field
                                v-model="email"
                                variant="outlined"
                                density="compact"
                                color="primary"
                                placeholder="example@gmail.com"
                                prepend-inner-icon="mdi-email-outline"
                                :rules="[rules.email]"
                            />
                        </div>
                    </div>
                </div>

                <!-- ============================================================ -->
                <!-- Escritorio: formulario a la izquierda, vista previa fija a la derecha -->
                <!-- ============================================================ -->
                <div class="d-none d-md-block wizard-desktop">
                    <div class="wizard-desktop-inner px-6 pt-6 pb-10">
                        <v-row dense>
                            <!-- Columna principal: formulario -->
                            <v-col cols="8">
                                <v-card variant="outlined" class="form-section">
                                    <p class="form-section-title">Datos del contribuyente</p>
                                    <v-row dense>
                                        <v-col cols="5">
                                            <div class="field-block">
                                                <label class="field-label">RUC <span class="req">*</span></label>
                                                <div class="doc-lookup-row">
                                                    <v-text-field
                                                        v-model="ruc"
                                                        variant="outlined"
                                                        density="compact"
                                                        color="primary"
                                                        placeholder="20123456789"
                                                        maxlength="11"
                                                        class="mono-text flex-grow-1"
                                                        :rules="[rules.required, rules.ruc]"
                                                    />
                                                    <v-btn icon color="primary" class="lookup-btn" :loading="looking" :disabled="!canLookup" @click="lookupRuc">
                                                        <v-icon>mdi-magnify</v-icon>
                                                    </v-btn>
                                                </div>
                                                <div v-if="found" class="found-hint">
                                                    <v-icon size="14" color="primary">mdi-check-circle</v-icon>
                                                    <span>Datos encontrados en el padrón SUNAT</span>
                                                </div>
                                            </div>
                                        </v-col>
                                        <v-col cols="7">
                                            <div class="field-block">
                                                <label class="field-label">Razón social <span class="req">*</span></label>
                                                <v-text-field
                                                    v-model="businessName"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="Ej. Comercializadora Andina S.A.C."
                                                    :rules="[rules.required]"
                                                />
                                            </div>
                                        </v-col>
                                    </v-row>

                                    <v-row dense>
                                        <v-col cols="5">
                                            <div class="field-block mb-0">
                                                <div class="field-head">
                                                    <label class="field-label">Nombre comercial</label>
                                                    <span class="field-hint">Opcional</span>
                                                </div>
                                                <v-text-field
                                                    v-model="tradeName"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="Ej. Andina Market"
                                                />
                                            </div>
                                        </v-col>
                                        <v-col cols="7">
                                            <div class="field-block mb-0">
                                                <div class="field-head">
                                                    <label class="field-label">Dirección fiscal</label>
                                                    <span class="field-hint">Opcional</span>
                                                </div>
                                                <v-text-field
                                                    v-model="address"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="Av. Ejemplo 123, Lima"
                                                    prepend-inner-icon="mdi-map-marker-outline"
                                                    :rules="[rules.address]"
                                                />
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card>

                                <v-card variant="outlined" class="form-section">
                                    <div class="form-section-head">
                                        <p class="form-section-title mb-0">Acceso SUNAT (Clave SOL)</p>
                                        <div class="sol-hint mb-0">
                                            <v-icon size="16" color="primary">mdi-shield-lock-outline</v-icon>
                                            <span>Se usa solo para leer el buzón electrónico del cliente.</span>
                                        </div>
                                    </div>
                                    <v-row dense>
                                        <v-col cols="6">
                                            <div class="field-block mb-0">
                                                <label class="field-label">Usuario SOL <span class="req">*</span></label>
                                                <v-text-field
                                                    v-model="solUser"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="USUARIO1"
                                                    prepend-inner-icon="mdi-account-key-outline"
                                                    class="mono-text"
                                                    :rules="[rules.required]"
                                                />
                                            </div>
                                        </v-col>
                                        <v-col cols="6">
                                            <div class="field-block mb-0">
                                                <div class="field-head">
                                <label class="field-label">Clave SOL <span v-if="!isEdit" class="req">*</span></label>
                                <span v-if="isEdit" class="field-hint">Vacía = conservar la actual</span>
                            </div>
                                                <v-text-field
                                                    v-model="solPassword"
                                                    :type="showPassword ? 'text' : 'password'"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="••••••••"
                                                    prepend-inner-icon="mdi-lock-outline"
                                                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                                    autocomplete="new-password"
                                                    :rules="[rules.solPassword]"
                                                    @click:append-inner="showPassword = !showPassword"
                                                />
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card>

                                <v-card variant="outlined" class="form-section">
                                    <div class="form-section-head">
                                        <p class="form-section-title mb-0">Credenciales API SUNAT <span class="field-hint text-none">(opcional)</span></p>
                                        <div class="sol-hint mb-0">
                                            <v-icon size="16" color="primary">mdi-api</v-icon>
                                            <span>Se generan en SOL, en "Credenciales de API SUNAT". Se usan para consultar el SIRE.</span>
                                        </div>
                                    </div>
                                    <v-row dense>
                                        <v-col cols="6">
                                            <div class="field-block mb-0">
                                                <label class="field-label">Client ID</label>
                                                <v-text-field
                                                    ref="apiIdDesktop"
                                                    v-model="sunatClientId"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                    prepend-inner-icon="mdi-identifier"
                                                    class="mono-text"
                                                    :rules="[rules.sunatClientId]"
                                                />
                                            </div>
                                        </v-col>
                                        <v-col cols="6">
                                            <div class="field-block mb-0">
                                                <div class="field-head">
                                                    <label class="field-label">Client Secret</label>
                                                    <span v-if="isEdit && hadSunatClientSecret" class="field-hint">Vacío = conservar el actual</span>
                                                </div>
                                                <v-text-field
                                                    ref="apiSecretDesktop"
                                                    v-model="sunatClientSecret"
                                                    :type="showSecret ? 'text' : 'password'"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="••••••••"
                                                    prepend-inner-icon="mdi-key-outline"
                                                    :append-inner-icon="showSecret ? 'mdi-eye-off' : 'mdi-eye'"
                                                    autocomplete="new-password"
                                                    :rules="[rules.sunatClientSecret]"
                                                    @click:append-inner="showSecret = !showSecret"
                                                />
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card>

                                <v-card variant="outlined" class="form-section">
                                    <p class="form-section-title">Alertas</p>
                                    <v-switch
                                        v-model="trabajaDomingos"
                                        color="primary"
                                        density="compact"
                                        inset
                                        hide-details
                                        label="Trabaja domingos"
                                    />
                                    <p class="switch-hint">
                                        Al sincronizar un periodo se avisa qué días no tuvieron ventas. Si está apagado, los domingos no cuentan.
                                    </p>
                                </v-card>

                                <v-card variant="outlined" class="form-section">
                                    <p class="form-section-title">Datos de contacto</p>
                                    <div class="field-block">
                                        <div class="field-head">
                                            <label class="field-label">Persona de contacto</label>
                                            <span class="field-hint">Opcional</span>
                                        </div>
                                        <v-text-field
                                            v-model="contactName"
                                            variant="outlined"
                                            density="compact"
                                            color="primary"
                                            placeholder="Ej. María Fernanda Torres"
                                            prepend-inner-icon="mdi-account-outline"
                                        />
                                    </div>

                                    <v-row dense>
                                        <v-col cols="6">
                                            <div class="field-block mb-0">
                                                <div class="field-head">
                                                    <label class="field-label">Número de contacto</label>
                                                    <span class="field-hint">Opcional</span>
                                                </div>
                                                <v-text-field
                                                    v-model="phoneNumber"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="999999999"
                                                    prepend-inner-icon="mdi-phone-outline"
                                                    :rules="[rules.phone]"
                                                />
                                            </div>
                                        </v-col>
                                        <v-col cols="6">
                                            <div class="field-block mb-0">
                                                <div class="field-head">
                                                    <label class="field-label">Correo</label>
                                                    <span class="field-hint">Opcional</span>
                                                </div>
                                                <v-text-field
                                                    v-model="email"
                                                    variant="outlined"
                                                    density="compact"
                                                    color="primary"
                                                    placeholder="example@gmail.com"
                                                    prepend-inner-icon="mdi-email-outline"
                                                    :rules="[rules.email]"
                                                />
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-card>
                            </v-col>

                            <!-- Columna lateral: vista previa + confirmación -->
                            <v-col cols="4">
                                <div class="wizard-sidebar">
                                    <div class="preview-card">
                                        <div class="preview-avatar">{{ initials }}</div>
                                        <div class="preview-info min-w-0">
                                            <p class="preview-name truncate">{{ businessName || 'Razón social del cliente' }}</p>
                                            <p class="preview-doc mono-text truncate">RUC {{ ruc || '— — — — — — — — — — —' }}</p>
                                        </div>
                                        <div class="preview-badges">
                                            <span v-if="hasSolCredentials" class="preview-badge preview-badge--ok"><v-icon size="14">mdi-key-variant</v-icon></span>
                                            <span v-if="phoneNumber" class="preview-badge"><v-icon size="14">mdi-phone</v-icon></span>
                                            <span v-if="email" class="preview-badge"><v-icon size="14">mdi-email-outline</v-icon></span>
                                        </div>
                                    </div>

                                    <v-card variant="outlined" class="summary-card">
                                        <p class="summary-card-title">{{ saveLabel }}</p>
                                        <p class="summary-card-desc">Revisa la vista previa antes de confirmar. Los campos con <span class="req">*</span> son obligatorios.</p>

                                        <ul class="checklist">
                                            <li :class="{ 'checklist-item--done': rucValid }">
                                                <v-icon size="16">{{ rucValid ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                                                RUC válido
                                            </li>
                                            <li :class="{ 'checklist-item--done': !!businessName }">
                                                <v-icon size="16">{{ businessName ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                                                Razón social
                                            </li>
                                            <li :class="{ 'checklist-item--done': hasSolCredentials }">
                                                <v-icon size="16">{{ hasSolCredentials ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                                                Credenciales SOL
                                            </li>
                                            <li :class="{ 'checklist-item--done': hasApiCredentials }">
                                                <v-icon size="16">{{ hasApiCredentials ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                                                Credenciales API SUNAT (opcional)
                                            </li>
                                        </ul>

                                        <v-btn
                                            block
                                            color="primary"
                                            class="text-none mt-3"
                                            :loading="saving"
                                            :disabled="!valid"
                                            prepend-icon="mdi-card-account-details-outline"
                                            @click="saveClient"
                                        >
                                            {{ saveLabel }}
                                        </v-btn>
                                        <v-btn
                                            block
                                            variant="text"
                                            class="text-none mt-1"
                                            @click="$router.push('/clientes/ver-clientes')"
                                        >
                                            Cancelar
                                        </v-btn>
                                    </v-card>
                                </div>
                            </v-col>
                        </v-row>
                    </div>
                </div>
            </v-form>
        </div>

        <div class="action-bar d-md-none">
            <v-btn
                class="action-save flex-grow-1"
                color="primary"
                size="large"
                :loading="saving"
                :disabled="!valid"
                prepend-icon="mdi-card-account-details-outline"
                @click="saveClient"
            >
                {{ saveLabel }}
            </v-btn>
        </div>
    </div>
</template>

<script>
import ClientService from '@/services/ClientService';
import { useUiStore } from '@/store/ui';

export default {
    name: "CrearCliente",
    data() {
        return {
            clientId: this.$route.params.id || null,
            hadSolPassword: false,
            ruc: null,
            businessName: null,
            tradeName: null,
            address: null,
            solUser: null,
            solPassword: null,
            showPassword: false,
            sunatClientId: null,
            sunatClientSecret: null,
            hadSunatClientSecret: false,
            showSecret: false,
            trabajaDomingos: false,
            contactName: null,
            phoneNumber: null,
            email: null,
            looking: false,
            found: false,
            saving: false,
            valid: false,

            rules: {
                required: value => !!value || 'Este campo es obligatorio',
                // Obligatoria al crear; al editar, vacía significa conservar la clave actual.
                solPassword: value => this.isEdit || !!value || 'Este campo es obligatorio',
                // Credenciales API opcionales, pero van en pareja: client_id vacío = sin API.
                sunatClientId: value => {
                    if (!value) return !this.sunatClientSecret || 'Ingresa el Client ID junto con el Client Secret';
                    return !/\s/.test(value.trim()) || 'El Client ID no puede contener espacios';
                },
                sunatClientSecret: value => !!value || !this.sunatClientId || (this.isEdit && this.hadSunatClientSecret) || 'Obligatorio si ingresas el Client ID',
                ruc: value => !value || /^(10|15|17|20)[0-9]{9}$/.test(value) || 'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20',
                email: value => {
                    if (!value) return true; // permite vacío
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Correo inválido';
                },
                phone: value => {
                    if (!value) return true; // opcional
                    return /^[0-9]{9}$/.test(value) || 'Debe tener 9 dígitos';
                },
                address: value => {
                    if (!value) return true; // opcional
                    return value.trim().length >= 5 || 'Ingresa una dirección más completa';
                }
            },
        }
    },
    computed: {
        isEdit() {
            return !!this.clientId;
        },
        saveLabel() {
            return this.isEdit ? 'Guardar cambios' : 'Guardar cliente';
        },
        hasSolCredentials() {
            return !!this.solUser && (!!this.solPassword || (this.isEdit && this.hadSolPassword));
        },
        hasApiCredentials() {
            return !!this.sunatClientId && (!!this.sunatClientSecret || (this.isEdit && this.hadSunatClientSecret));
        },
        initials() {
            if (!this.businessName || !this.businessName.trim()) return '?';
            return this.businessName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
        },
        rucValid() {
            return !!this.ruc && /^(10|15|17|20)[0-9]{9}$/.test(this.ruc);
        },
        canLookup() {
            return this.rucValid && !this.looking;
        }
    },
    methods: {
        // Aún no hay servicio de consulta RUC en el backend (padrón SUNAT).
        lookupRuc() {
            useUiStore().setWarning('La consulta de RUC estará disponible próximamente');
        },
        async loadClient() {
            try {
                const client = await ClientService.getClient(this.clientId);
                this.ruc = client.ruc;
                this.businessName = client.businessName;
                this.tradeName = client.tradeName;
                this.address = client.address;
                this.solUser = client.solUser;
                this.hadSolPassword = client.hasSolPassword;
                this.sunatClientId = client.sunatClientId;
                this.hadSunatClientSecret = client.hasSunatClientSecret;
                this.trabajaDomingos = !!client.trabajaDomingos;
                this.contactName = client.contactName;
                this.phoneNumber = client.phoneNumber;
                this.email = client.email;
            } catch (error) {
                // El error ya se mostró en el snackbar (ej. cliente no encontrado).
                this.$router.push('/clientes/ver-clientes');
            }
        },
        buildRequest() {
            return {
                ruc: this.ruc,
                businessName: this.businessName,
                tradeName: this.tradeName,
                address: this.address,
                solUser: this.solUser,
                solPassword: this.solPassword || null,
                sunatClientId: this.sunatClientId ? this.sunatClientId.trim() : null,
                sunatClientSecret: this.sunatClientSecret || null,
                trabajaDomingos: this.trabajaDomingos,
                contactName: this.contactName,
                phoneNumber: this.phoneNumber,
                email: this.email,
            };
        },
        async saveClient() {
            const { valid } = await this.$refs.form.validate();
            if (!valid) return;

            this.saving = true;
            try {
                if (this.isEdit) {
                    await ClientService.updateClient(this.clientId, this.buildRequest());
                    useUiStore().setSuccess('Cliente actualizado correctamente');
                } else {
                    await ClientService.createClient(this.buildRequest());
                    useUiStore().setSuccess('Cliente registrado correctamente');
                }
                this.$router.push('/clientes/ver-clientes');
            } catch (error) {
                // El mensaje del backend (RUC duplicado, validación, etc.) ya se mostró en el snackbar.
            } finally {
                this.saving = false;
            }
        },
        // Las reglas de Client ID y Client Secret dependen una de otra; Vuetify solo revalida el campo editado.
        revalidate(...refNames) {
            this.$nextTick(() => refNames.forEach(name => this.$refs[name]?.validate()));
        },
    },
    mounted() {
        if (this.isEdit) {
            this.loadClient();
        }
    },
    watch: {
        ruc() {
            this.found = false;
        },
        sunatClientId() {
            this.revalidate('apiSecretMobile', 'apiSecretDesktop');
        },
        sunatClientSecret() {
            this.revalidate('apiIdMobile', 'apiIdDesktop');
        },
    }
}
</script>

<style scoped>
.client-page {
    --ink: #14171C;
    --border: #E1E1DC;
    --muted: #6B6F76;
    background: #F7F7F5;
    min-height: 100%;
}

.client-topbar {
    border-bottom: 1px solid var(--border);
    background: #fff;
}

.client-topbar-inner {
    max-width: 90rem;
    margin: 0 auto;
}

.client-content {
    max-width: 90rem;
    margin: 0 auto;
    width: 100%;
    flex: 1 1 auto;
    overflow-y: auto;
}

.header-eyebrow {
    color: #9AA0A8;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.header-title {
    color: var(--ink);
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 0.25rem;
}

.header-subtitle {
    color: #9AA0A8;
    font-size: 0.85rem;
    margin-top: 0.25rem;
}

.wizard-desktop-inner {
    max-width: 90rem;
    margin: 0 auto;
}

.form-section {
    padding: 1.5rem;
    border-radius: 0.75rem;
    margin-bottom: 1.25rem;
    background: #fff;
    border-color: #DED7D7;
}

.form-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.1rem;
}

.form-section-title {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 1.1rem;
}

.switch-hint {
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 0.125rem;
}

.sol-hint {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: var(--muted);
    margin-bottom: 0.875rem;
}

.wizard-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: sticky;
    top: 1.5rem;
}

.summary-card {
    padding: 1.25rem;
    border-radius: 0.75rem;
    background: #fff;
    border-color: #DED7D7;
}

.summary-card-title {
    font-weight: 700;
    font-size: 1rem;
    color: var(--ink);
}

.summary-card-desc {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.35rem;
}

.checklist {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.checklist li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: #9AA0A8;
}

.checklist li.checklist-item--done {
    color: #1D8A4E;
    font-weight: 500;
}

.preview-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #fff;
    border: 1px dashed var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 1px 2px rgba(20, 23, 28, 0.06);
}

.preview-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    background: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-primary));
}

.preview-info {
    flex: 1 1 auto;
}

.preview-name {
    color: var(--ink);
    font-weight: 600;
}

.preview-doc {
    color: var(--muted);
    font-size: 0.75rem;
    margin-top: 0.125rem;
}

.mono-text {
    font-family: 'IBM Plex Mono', 'Courier New', monospace;
}

.preview-badges {
    display: flex;
    gap: 0.375rem;
    flex-shrink: 0;
}

.preview-badge {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F1EF;
    color: var(--muted);
}

.preview-badge--ok {
    background: #E4F6EC;
    color: #1D8A4E;
}

.section-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 0.75rem;
}

.wizard-body {
    padding-bottom: 1.5rem;
}

.field-block {
    margin-bottom: 1.1rem;
}

.field-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.375rem;
}

.field-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ink);
    display: block;
    margin-bottom: 0.375rem;
}

.field-head .field-label {
    margin-bottom: 0;
}

.req {
    color: rgb(var(--v-theme-error));
}

.field-hint {
    font-size: 0.75rem;
    color: var(--muted);
}

.doc-lookup-row {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}

.lookup-btn {
    margin-top: 2px;
}

.found-hint {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: rgb(var(--v-theme-primary));
}

.action-bar {
    flex-shrink: 0;
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: #fff;
    border-top: 1px solid var(--border);
}

.action-save {
    text-transform: none;
    font-weight: 600;
    border-radius: 0.5rem;
}
</style>
