<template>
  <div>
    <v-card
      elevation="2"
      rounded="xl"
    >
      <v-card-title class="pa-6">
        <h2 class="text-h5 font-weight-bold">
          Analytics Dashboard
        </h2>
      </v-card-title>

      <v-card-text class="pa-6 pt-0">
        <p class="text-body-1 text-medium-emphasis">
          Analytics dashboard coming soon...
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { definePage } from 'unplugin-vue-router/runtime'

definePage({
  meta: {
    layout: 'dashboard'
  }
})
</script>
