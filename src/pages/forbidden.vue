<template>
  <v-container
    fluid
    class="fill-height d-flex align-center justify-center"
  >
    <v-card
      max-width="560"
      class="pa-6 text-center"
      elevation="6"
    >
      <div class="d-flex justify-center align-center gap-3 mb-4">
        <v-img
          src="/pemprov-babel.svg"
          alt="Logo Pemprov Babel"
          width="48"
          height="48"
        />
        <v-divider vertical class="mx-1" />
        <v-img
          src="/favicon.ico"
          alt="Logo SIPALING PKP"
          width="44"
          height="44"
        />
      </div>
      <v-icon
        size="48"
        color="warning"
        class="mb-3"
      >
        mdi-shield-alert
      </v-icon>
      <h1 class="text-h5 font-weight-bold mb-2">
        403 Forbidden
      </h1>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ primaryMessage }}
      </p>
      <div
        v-if="secondaryMessage"
        class="text-body-2 text-medium-emphasis mb-4"
      >
        {{ secondaryMessage }}
      </div>
      <div class="d-flex flex-wrap justify-center gap-2 mb-4">
        <v-chip
          v-if="roleLabel"
          size="small"
          color="primary"
          variant="tonal"
        >
          Role: {{ roleLabel }}
        </v-chip>
        <v-chip
          v-if="fromPath"
          size="small"
          color="grey"
          variant="outlined"
        >
          Tujuan: {{ fromPath }}
        </v-chip>
      </div>
      <div class="d-flex flex-column flex-sm-row justify-center gap-3">
        <v-btn
          color="primary"
          to="/home"
        >
          Kembali ke Beranda
        </v-btn>
        <v-btn
          variant="outlined"
          to="/auth/signin"
        >
          Masuk Ulang
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { definePage } from 'unplugin-vue-router/runtime'
import { useAppStore } from '@/stores/app'

definePage({
  meta: {
    layout: 'forbidden',
  },
})

const appStore = useAppStore()
const route = useRoute()

const fromPath = computed(() => {
  const from = typeof route.query?.from === 'string' ? route.query.from : ''
  return from || ''
})

const roleLabel = computed(() => appStore.primaryRoleName || appStore.user?.userLevel || '')

const primaryMessage = computed(() => {
  if (!appStore.isAuthenticated) {
    return 'Silakan masuk terlebih dahulu untuk melihat konten ini.'
  }
  if (appStore.isMasyarakat) {
    return 'Akun masyarakat hanya dapat mengakses data miliknya sendiri.'
  }
  if (appStore.isAdminDesa) {
    return 'Akun admin desa hanya dapat mengakses data desa yang ditetapkan.'
  }
  if (appStore.isAdminKabupaten) {
    return 'Akun admin kabupaten hanya dapat mengakses data kabupaten yang ditetapkan.'
  }
  if (appStore.isVerifikator) {
    return 'Akun verifikator hanya dapat mengakses data untuk proses verifikasi.'
  }
  if (appStore.isSuperAdmin) {
    return 'Anda tidak memiliki izin spesifik untuk membuka halaman ini.'
  }
  return 'Anda tidak memiliki izin untuk mengakses halaman ini.'
})

const secondaryMessage = computed(() => {
  if (!appStore.isAuthenticated) {
    return 'Gunakan akun yang memiliki akses atau hubungi admin jika membutuhkan izin.'
  }
  return 'Hubungi administrator untuk meminta akses yang sesuai.'
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
