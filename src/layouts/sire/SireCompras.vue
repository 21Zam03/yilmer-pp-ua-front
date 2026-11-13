<template>
    <div class="sire-page">
        <div class="sire-content">
            <div>
                <h1 class="header-title">SIRE - Compras</h1>
                <p class="header-subtitle">
                    Registro de Compras Electrónico (RCE) de tus clientes.
                </p>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "SireCompras",
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

@media (min-width: 960px) {
    .sire-content {
        padding: 1.75rem 2rem;
    }
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
</style>
