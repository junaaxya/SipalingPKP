<template>
  <v-main class="forbidden-layout">
    <router-view />
  </v-main>
</template>

<script setup>
</script>

<style scoped>
.forbidden-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f9fc 0%, #e9eef6 100%);
}
</style>
