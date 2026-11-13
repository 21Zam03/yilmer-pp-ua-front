<template>
    <!-- key: "crear" y "editar" usan el mismo componente; sin esto Vue lo reutiliza y el formulario conserva datos. -->
    <router-view :key="$route.fullPath"></router-view>
</template>

<script>
    export default {
        name: "ClientesLayout",
    }
</script>

<style scoped>
</style>
