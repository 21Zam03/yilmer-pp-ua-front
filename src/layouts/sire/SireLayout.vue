<template>
    <router-view :key="$route.fullPath"></router-view>
</template>

<script>
    export default {
        name: "SireLayout",
    }
</script>

<style scoped>
</style>
