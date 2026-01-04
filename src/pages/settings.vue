<template>
  <v-container fluid>
    <v-card elevation="2" rounded="xl">
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="security">Keamanan</v-tab>
        <v-tab value="notifications">Notifikasi</v-tab>
        <v-tab
          v-if="canViewPrivacyTab"
          value="privacy"
        >
          Privasi
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-6">
        <v-window v-model="activeTab">
          <v-window-item value="security">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" rounded="lg">
                  <v-card-title class="px-4 py-3">
                    <h3 class="text-subtitle-1 font-weight-bold">
                      Ganti Password
                    </h3>
                  </v-card-title>
                  <v-card-text>
                    <v-form
                      ref="formRef"
                      v-model="valid"
                    >
                      <v-text-field
                        v-model="currentPassword"
                        :rules="currentPasswordRules"
                        :type="showCurrentPassword ? 'text' : 'password'"
                        label="Password Saat Ini"
                        variant="outlined"
                        class="mb-4"
                        prepend-inner-icon="mdi-lock"
                        :append-inner-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showCurrentPassword = !showCurrentPassword"
                      />

                      <v-text-field
                        v-model="newPassword"
                        :rules="newPasswordRules"
                        :type="showNewPassword ? 'text' : 'password'"
                        label="Password Baru"
                        variant="outlined"
                        class="mb-2"
                        prepend-inner-icon="mdi-lock-reset"
                        :append-inner-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showNewPassword = !showNewPassword"
                      />

                      <div class="mb-3">
                        <div class="d-flex align-center justify-space-between mb-1">
                          <span class="text-caption text-medium-emphasis">
                            Kekuatan Password: {{ strengthLabel }}
                          </span>
                          <span class="text-caption text-medium-emphasis">
                            {{ strengthScore }}/3
                          </span>
                        </div>
                        <v-progress-linear
                          :model-value="strengthPercent"
                          :color="strengthColor"
                          height="6"
                          rounded
                        />
                      </div>

                      <v-text-field
                        v-model="confirmPassword"
                        :rules="confirmPasswordRules"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        label="Konfirmasi Password Baru"
                        variant="outlined"
                        class="mb-4"
                        prepend-inner-icon="mdi-lock-check"
                        :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-inner="showConfirmPassword = !showConfirmPassword"
                      />

                      <v-btn
                        color="primary"
                        :loading="saving"
                        :disabled="!valid"
                        block
                        @click="handleChangePassword"
                      >
                        Simpan Password
                      </v-btn>
                    </v-form>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined" rounded="lg" class="mb-4">
                  <v-card-title class="px-4 py-3">
                    <h3 class="text-subtitle-1 font-weight-bold">
                      Two-Factor Authentication
                    </h3>
                  </v-card-title>
                  <v-card-text>
                    <v-switch
                      v-model="twoFactorEnabled"
                      color="primary"
                      :label="twoFactorEnabled ? 'Aktif' : 'Nonaktif'"
                      :loading="twoFactorLoading"
                      @update:model-value="handleToggleTwoFactor"
                    />
                    <p class="text-caption text-medium-emphasis">
                      Tingkatkan keamanan akun dengan verifikasi tambahan saat login.
                    </p>
                  </v-card-text>
                </v-card>

                <v-card variant="outlined" rounded="lg">
                  <v-card-title class="px-4 py-3">
                    <h3 class="text-subtitle-1 font-weight-bold">
                      Sesi Aktif
                    </h3>
                  </v-card-title>
                  <v-card-text>
                    <div v-if="sessionsLoading" class="text-body-2 text-medium-emphasis">
                      Memuat sesi...
                    </div>
                    <div v-else>
                      <v-list v-if="sessions.length">
                        <v-list-item
                          v-for="session in sessions"
                          :key="session.id"
                          class="px-0"
                        >
                          <template #prepend>
                            <v-icon :icon="getSessionIcon(session)" class="me-3" />
                          </template>
                          <v-list-item-title class="text-body-2 font-weight-medium">
                            {{ getSessionTitle(session) }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-caption text-medium-emphasis">
                            {{ getSessionSubtitle(session) }}
                          </v-list-item-subtitle>
                          <template #append>
                            <div class="d-flex align-center ga-2">
                              <v-chip
                                v-if="session.isCurrent"
                                color="success"
                                variant="tonal"
                                size="x-small"
                              >
                                Perangkat Ini
                              </v-chip>
                              <v-btn
                                size="x-small"
                                color="error"
                                variant="text"
                                @click="handleRevokeSession(session)"
                              >
                                Logout
                              </v-btn>
                            </div>
                          </template>
                        </v-list-item>
                      </v-list>
                      <div v-else class="text-body-2 text-medium-emphasis">
                        Tidak ada sesi aktif.
                      </div>
                    </div>
                    <v-btn
                      color="error"
                      variant="tonal"
                      class="mt-4"
                      :loading="revokeAllLoading"
                      @click="handleRevokeAllSessions"
                    >
                      Logout dari semua perangkat
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="notifications">
            <v-card variant="outlined" rounded="lg">
              <v-card-title class="px-4 py-3">
                <h3 class="text-subtitle-1 font-weight-bold">
                  Preferensi Notifikasi
                </h3>
              </v-card-title>
              <v-card-text>
                <v-alert
                  variant="tonal"
                  color="primary"
                  class="mb-4"
                >
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">
                      mdi-bell-check
                    </v-icon>
                    <span v-if="isStaffUser">
                      Notifikasi Verifikasi Data Baru
                    </span>
                    <span v-else>
                      Notifikasi Perubahan Status Bantuan
                    </span>
                  </div>
                </v-alert>
                <v-switch
                  v-model="notifEmail"
                  color="primary"
                  label="Notifikasi Email"
                />
                <v-switch
                  v-model="notifWhatsapp"
                  color="primary"
                  label="Notifikasi WhatsApp"
                />
                <div class="d-flex flex-wrap gap-2 mt-4">
                  <v-btn
                    color="primary"
                    :loading="notifSaving"
                    @click="handleSaveNotifications"
                  >
                    Simpan Preferensi
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item
            v-if="canViewPrivacyTab"
            value="privacy"
          >
            <v-card variant="outlined" rounded="lg">
              <v-card-title class="px-4 py-3">
                <h3 class="text-subtitle-1 font-weight-bold">
                  Privasi & Keamanan Data
                </h3>
              </v-card-title>
              <v-card-text>
                <v-switch
                  v-model="privacyMasking"
                  color="primary"
                  label="Masking data sensitif"
                />
                <v-switch
                  v-model="privacyAudit"
                  color="primary"
                  label="Catat aktivitas keamanan"
                />
                <p class="text-caption text-medium-emphasis">
                  Semua aktivitas penting dicatat untuk menjaga integritas data pemerintah.
                </p>
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3500"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { definePage } from 'unplugin-vue-router/runtime'
import { userAPI } from '@/services'
import { useAppStore } from '@/stores/app'

definePage({
  meta: {
    layout: 'dashboard'
  }
})

const formRef = ref(null)
const valid = ref(false)
const saving = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })
const activeTab = ref('security')
const sessions = ref([])
const sessionsLoading = ref(false)
const revokeAllLoading = ref(false)
const twoFactorEnabled = ref(false)
const twoFactorLoading = ref(false)
const notifEmail = ref(true)
const notifWhatsapp = ref(false)
const notifSaving = ref(false)
const privacyMasking = ref(true)
const privacyAudit = ref(true)

const appStore = useAppStore()
const isStaffUser = computed(() => !appStore.isMasyarakat)
const canViewPrivacyTab = computed(() => !appStore.isMasyarakat)

const currentPasswordRules = [
  v => !!v || 'Password saat ini wajib diisi'
]
const newPasswordRules = [
  v => !!v || 'Password baru wajib diisi',
  v => v.length >= 8 || 'Minimal 8 karakter',
  v => /\d/.test(v) || 'Harus mengandung angka'
]
const confirmPasswordRules = [
  v => !!v || 'Konfirmasi wajib diisi',
  v => v === newPassword.value || 'Konfirmasi tidak cocok'
]

const strengthScore = computed(() => {
  let score = 0
  if (newPassword.value.length >= 8) score += 1
  if (/\d/.test(newPassword.value)) score += 1
  if (/[A-Z]/.test(newPassword.value)) score += 1
  return score
})

const strengthPercent = computed(() => (strengthScore.value / 3) * 100)
const strengthLabel = computed(() => {
  if (strengthScore.value <= 1) return 'Lemah'
  if (strengthScore.value === 2) return 'Sedang'
  return 'Kuat'
})
const strengthColor = computed(() => {
  if (strengthScore.value <= 1) return 'error'
  if (strengthScore.value === 2) return 'warning'
  return 'success'
})

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID')
}

const getSessionIcon = (session) => {
  const deviceType = session?.client?.device?.type
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    return 'mdi-cellphone'
  }
  return 'mdi-laptop'
}

const getSessionTitle = (session) => {
  const browser =
    session?.client?.browser?.name ||
    session?.deviceInfo?.browser ||
    'Browser'
  const os =
    session?.client?.os?.name ||
    session?.deviceInfo?.os ||
    'OS'
  return `${browser} on ${os}`
}

const getSessionSubtitle = (session) => {
  const lastActive = formatDate(session?.lastActivityAt || session?.createdAt)
  const ipAddress = session?.ipAddress || '-'
  const location =
    session?.locationLabel ||
    session?.client?.location?.city ||
    session?.client?.location?.region ||
    session?.client?.location?.country ||
    null
  const parts = []
  if (location) {
    parts.push(location)
  }
  parts.push(ipAddress)
  parts.push(`Terakhir aktif ${lastActive}`)
  return parts.join(' · ')
}

const loadSessions = async () => {
  sessionsLoading.value = true
  try {
    const response = await userAPI.getSessions()
    if (response.success) {
      const payload = response.data?.sessions || response.data
      sessions.value = payload?.items || []
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      text: error.message || 'Gagal memuat sesi',
      color: 'error'
    }
  } finally {
    sessionsLoading.value = false
  }
}

const handleRevokeSession = async (session) => {
  if (!session?.id) return
  try {
    const response = await userAPI.revokeSession(session.id)
    if (response.success) {
      sessions.value = sessions.value.filter((item) => item.id !== session.id)
      snackbar.value = {
        show: true,
        text: response.message || 'Sesi berhasil dinonaktifkan',
        color: 'success'
      }
    } else {
      snackbar.value = {
        show: true,
        text: response.message || 'Gagal menonaktifkan sesi',
        color: 'error'
      }
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      text: error.message || 'Gagal menonaktifkan sesi',
      color: 'error'
    }
  }
}

const handleToggleTwoFactor = async (value) => {
  twoFactorLoading.value = true
  const result = await appStore.updateTwoFactor({ enabled: value })
  twoFactorLoading.value = false

  if (result.success) {
    twoFactorEnabled.value = Boolean(result.user?.twoFactorEnabled)
    snackbar.value = {
      show: true,
      text: 'Pengaturan 2FA diperbarui',
      color: 'success'
    }
  } else {
    twoFactorEnabled.value = !value
    snackbar.value = {
      show: true,
      text: result.error || 'Gagal memperbarui 2FA',
      color: 'error'
    }
  }
}

const loadNotificationPreferences = () => {
  notifEmail.value = Boolean(appStore.user?.notificationEmailEnabled)
  notifWhatsapp.value = Boolean(appStore.user?.notificationWhatsappEnabled)
}

const handleSaveNotifications = async () => {
  notifSaving.value = true
  const result = await appStore.updateNotificationPreferences({
    notificationEmailEnabled: notifEmail.value,
    notificationWhatsappEnabled: notifWhatsapp.value
  })
  notifSaving.value = false

  if (result.success) {
    snackbar.value = {
      show: true,
      text: 'Preferensi notifikasi disimpan',
      color: 'success'
    }
  } else {
    snackbar.value = {
      show: true,
      text: result.error || 'Gagal menyimpan preferensi notifikasi',
      color: 'error'
    }
  }
}

const handleRevokeAllSessions = async () => {
  revokeAllLoading.value = true
  try {
    const response = await userAPI.revokeAllSessions()
    if (response.success) {
      sessions.value = []
      snackbar.value = {
        show: true,
        text: response.message || 'Semua sesi berhasil dinonaktifkan',
        color: 'success'
      }
    } else {
      snackbar.value = {
        show: true,
        text: response.message || 'Gagal menonaktifkan sesi',
        color: 'error'
      }
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      text: error.message || 'Gagal menonaktifkan sesi',
      color: 'error'
    }
  } finally {
    revokeAllLoading.value = false
  }
}

const resetForm = () => {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

const handleChangePassword = async () => {
  const form = formRef.value
  if (form) {
    const { valid: isValid } = await form.validate()
    if (!isValid) return
  }

  saving.value = true
  try {
    const response = await userAPI.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })

    if (response.success) {
      resetForm()
      snackbar.value = {
        show: true,
        text: response.message || 'Password berhasil diperbarui',
        color: 'success'
      }
    } else {
      snackbar.value = {
        show: true,
        text: response.message || 'Gagal mengganti password',
        color: 'error'
      }
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      text: error.message || 'Gagal mengganti password',
      color: 'error'
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  twoFactorEnabled.value = Boolean(appStore.user?.twoFactorEnabled)
  loadNotificationPreferences()
  loadSessions()
})

watch(
  () => canViewPrivacyTab.value,
  (canView) => {
    if (!canView && activeTab.value === 'privacy') {
      activeTab.value = 'security'
    }
  },
  { immediate: true }
)
</script>
