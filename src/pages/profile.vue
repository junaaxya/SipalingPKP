<template>
  <v-container fluid>
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card elevation="2" rounded="xl" class="pa-4">
          <div class="d-flex flex-column flex-md-row align-center justify-space-between">
            <div class="d-flex align-center ga-3">
              <div class="profile-avatar">
                <v-avatar size="64" color="primary">
                  <v-img
                    v-if="avatarUrl"
                    :src="avatarUrl"
                    cover
                  />
                  <span
                    v-else
                    class="text-h6 font-weight-bold text-white"
                  >
                    {{ initials }}
                  </span>
                </v-avatar>
                <v-btn
                  icon
                  size="x-small"
                  color="primary"
                  class="avatar-edit"
                  :loading="avatarUploading"
                  @click="triggerAvatarSelect"
                >
                  <v-icon size="16">mdi-camera</v-icon>
                </v-btn>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  class="d-none"
                  @change="handleAvatarSelected"
                />
              </div>
              <div>
                <div class="text-h6 font-weight-bold">
                  {{ fullName || '-' }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ maskedEmail }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ userLevelLabel }}
                </div>
              </div>
            </div>
            <v-chip color="primary" variant="tonal" class="mt-3 mt-md-0">
              {{ roleLabel }}
            </v-chip>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="7">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="pa-6">
            <h3 class="text-subtitle-1 font-weight-bold">
              Data Identitas
            </h3>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <v-form
              ref="formRef"
              v-model="valid"
            >
              <v-text-field
                v-model="fullName"
                :rules="nameRules"
                label="Nama Lengkap"
                variant="outlined"
                class="mb-4"
                prepend-inner-icon="mdi-account"
                required
              />
              <v-text-field
                :model-value="maskedEmail"
                label="Email"
                variant="outlined"
                class="mb-4"
                prepend-inner-icon="mdi-email"
                readonly
              />
              <v-text-field
                v-model="nikDisplay"
                :label="identityLabel"
                :placeholder="identityPlaceholder"
                variant="outlined"
                class="mb-4"
                prepend-inner-icon="mdi-card-account-details-outline"
                :readonly="identityReadonly"
                inputmode="numeric"
                pattern="[0-9]*"
              />
              <v-text-field
                v-if="!appStore.isMasyarakat"
                :model-value="jobTitleValue"
                label="Jabatan"
                variant="outlined"
                class="mb-4"
                prepend-inner-icon="mdi-badge-account-outline"
                readonly
              />
              <v-text-field
                :model-value="userLevelLabel"
                label="Pangkat/Jabatan"
                variant="outlined"
                class="mb-4"
                prepend-inner-icon="mdi-briefcase-account-outline"
                readonly
              />
              <v-text-field
                v-model="phoneDisplay"
                :rules="phoneRules"
                label="Nomor Telepon"
                variant="outlined"
                class="mb-2"
                prepend-inner-icon="mdi-phone"
                inputmode="tel"
              />
              <div class="d-flex flex-wrap gap-2">
                <v-btn
                  color="primary"
                  :loading="saving"
                  :disabled="!valid || !isDirty"
                  @click="handleSave"
                >
                  Simpan Perubahan
                </v-btn>
                <v-btn
                  variant="text"
                  :disabled="!isDirty"
                  @click="resetForm"
                >
                  Batal
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="pa-6">
            <h3 class="text-subtitle-1 font-weight-bold">
              Data Wilayah Tugas
            </h3>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <v-list density="compact" class="pa-0">
              <v-list-item
                v-for="item in workContextItems"
                :key="item.label"
              >
                <v-list-item-title class="text-caption text-medium-emphasis">
                  {{ item.label }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2">
                  {{ item.value }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card elevation="2" rounded="xl" class="mt-4">
          <v-card-title class="pa-6">
            <h3 class="text-subtitle-1 font-weight-bold">
              Ringkasan Keamanan Akun
            </h3>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <v-row class="mb-2">
              <v-col cols="12" md="7">
                <div class="text-caption text-medium-emphasis">Status 2FA</div>
                <v-chip
                  :color="twoFactorEnabled ? 'success' : 'grey'"
                  variant="tonal"
                  class="mt-1"
                >
                  {{ twoFactorEnabled ? 'Aktif' : 'Tidak Aktif' }}
                </v-chip>
              </v-col>
              <v-col cols="12" md="5" class="d-flex align-center justify-end">
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  to="/settings"
                >
                  Pengaturan
                </v-btn>
              </v-col>
            </v-row>
            <v-divider class="my-3" />
            <v-list density="compact" class="pa-0">
              <v-list-item>
                <v-list-item-title class="text-caption text-medium-emphasis">
                  Kontak Verifikasi
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2 text-wrap">
                  {{ maskedEmail }} | {{ contactPhone }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="activitySummary">
                <v-list-item-title class="text-caption text-medium-emphasis">
                  Ringkasan Aktivitas
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2 text-wrap activity-summary">
                  {{ activitySummary }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
import { ref, computed, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { definePage } from 'unplugin-vue-router/runtime'
import { useAppStore } from '@/stores/app'
import { userAPI, housingAPI, facilityAPI, housingDevelopmentAPI } from '@/services'

definePage({
  meta: {
    layout: 'dashboard'
  }
})

const appStore = useAppStore()

const formRef = ref(null)
const valid = ref(false)
const saving = ref(false)
const avatarInput = ref(null)
const avatarUploading = ref(false)
const fullName = ref('')
const phone = ref('')
const nik = ref('')
const initialProfile = ref({ fullName: '', phone: '', nik: '' })
const snackbar = ref({ show: false, text: '', color: 'success' })
const activityCounts = ref({
  housing: null,
  facility: null,
  development: null
})

const nameRules = [
  v => !!v || 'Nama wajib diisi',
  v => v.length >= 2 || 'Nama minimal 2 karakter'
]

const sanitizeDigits = (value, maxLength = null) => {
  const cleaned = String(value ?? '').replace(/\D/g, '')
  if (maxLength) return cleaned.slice(0, maxLength)
  return cleaned
}

const normalizePhoneDigits = (value) => {
  let digits = sanitizeDigits(value)
  if (!digits) return ''
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`
  } else if (digits.startsWith('8')) {
    digits = `62${digits}`
  }
  return digits
}

const formatIdentityNumber = (value) => {
  const raw = String(value || '')
  if (!raw) return ''
  if (raw.includes('*')) return raw
  const digits = sanitizeDigits(raw, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1-')
}

const formatPhoneNumber = (value) => {
  const normalized = normalizePhoneDigits(value)
  if (!normalized) return ''
  if (!normalized.startsWith('62')) {
    const groups = normalized.match(/.{1,4}/g) || []
    return groups.join('-')
  }
  const rest = normalized.slice(2)
  const groups = rest.match(/.{1,4}/g) || []
  return `+62 ${groups.join('-')}`
}

const phoneRules = [
  v => !v || sanitizeDigits(v).length <= 20 || 'Nomor telepon maksimal 20 karakter',
  v => {
    const digits = normalizePhoneDigits(v)
    if (!digits) return true
    return /^62\\d{7,12}$/.test(digits) || 'Gunakan format Indonesia (contoh: 08xx atau +62 8xx)'
  }
]

const maskEmail = (value) => {
  if (!value) return '-'
  const [name, domain] = String(value).split('@')
  if (!domain) return value
  const prefix = name.slice(0, 2) || name.slice(0, 1)
  const maskedName = `${prefix}***`
  return `${maskedName}@${domain}`
}

const resolveFileUrl = (rawValue) => {
  if (!rawValue) return ''
  const raw = String(rawValue).replace(/\\/g, '/')
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const apiRoot = baseUrl.replace(/\/api$/i, '')
  const rebasePath = (path) => (apiRoot ? `${apiRoot}${path}` : path)

  if (/^https?:\/\//i.test(raw) || raw.startsWith('blob:')) {
    try {
      const url = new URL(raw)
      if (url.pathname.startsWith('/api/files/')) {
        return rebasePath(url.pathname)
      }
      if (url.pathname.startsWith('/files/')) {
        return rebasePath(`/api${url.pathname}`)
      }
    } catch {
      return raw
    }
    return raw
  }

  if (raw.startsWith('/api/files/') || raw.startsWith('api/files/')) {
    const path = raw.startsWith('/') ? raw : `/${raw}`
    return rebasePath(path)
  }
  if (raw.startsWith('/files/') || raw.startsWith('files/')) {
    const path = raw.startsWith('/') ? raw : `/${raw}`
    return rebasePath(`/api${path}`)
  }
  const prefix = baseUrl ? `${baseUrl}/files/` : '/api/files/'
  return `${prefix}${raw.replace(/^\/+/, '')}`
}

const maskNoKk = (value) => {
  if (!value) return '-'
  const digits = String(value).replace(/\\D/g, '')
  if (digits.length < 6) return `${digits.slice(0, 2)}***`
  return `${digits.slice(0, 4)}**********${digits.slice(-2)}`
}

const maskedEmail = computed(() => {
  const raw = appStore.user?.email || ''
  if (!raw) return '-'
  return raw.includes('*') ? raw : maskEmail(raw)
})
const identityNumberRaw = computed(() => (
  appStore.user?.familyCardNumber
  || appStore.user?.nik
  || appStore.user?.nikNumber
  || ''
))
const identityLabel = computed(() => (
  appStore.isMasyarakat ? 'No. KK' : 'NIK'
))
const identityPlaceholder = computed(() => (
  appStore.isMasyarakat ? 'No. KK' : 'NIK'
))
const identityReadonly = computed(() => Boolean(appStore.user?.familyCardNumber))
const nikDisplay = computed({
  get: () => formatIdentityNumber(nik.value),
  set: (value) => {
    nik.value = sanitizeDigits(value, 16)
  }
})
const phoneDisplay = computed({
  get: () => formatPhoneNumber(phone.value),
  set: (value) => {
    phone.value = sanitizeDigits(value)
  }
})
const jobTitleValue = computed(() => (
  appStore.user?.jobTitle
  || appStore.primaryRoleName
  || roleLabel.value
  || '-'
))
const initials = computed(() => {
  const name = fullName.value || appStore.user?.fullName || ''
  if (!name) return '-'
  const parts = name.split(' ').filter(Boolean)
  const first = parts[0]?.[0] || ''
  const second = parts[1]?.[0] || ''
  return `${first}${second}`.toUpperCase()
})
const roleLabel = computed(() => {
  const rawRole = appStore.roleNames?.[0]
    || appStore.user?.roles?.[0]?.name
    || appStore.user?.roles?.[0]?.displayName
    || 'pengguna'
  const normalized = String(rawRole).toLowerCase().replace(/[\s-]+/g, '_')
  const roleMap = {
    super_admin: 'Super Admin',
    verifikator: 'Verifikator',
    admin_kabupaten: 'Admin Kabupaten',
    admin_desa: 'Admin Desa',
    masyarakat: 'Masyarakat'
  }
  return roleMap[normalized] || String(rawRole)
})
const userLevelLabel = computed(() => {
  const level = String(appStore.user?.userLevel || '').toLowerCase()
  const levelMap = {
    province: 'Pejabat Provinsi',
    regency: 'Pejabat Kabupaten',
    district: 'Pejabat Kecamatan',
    village: 'Perangkat Desa',
    citizen: 'Masyarakat'
  }
  return levelMap[level] || '-'
})
const assignedProvince = computed(() => appStore.user?.assignedProvince?.name || '-')
const assignedRegency = computed(() => appStore.user?.assignedRegency?.name || '-')
const assignedDistrict = computed(() => appStore.user?.assignedDistrict?.name || '-')
const assignedVillage = computed(() => appStore.user?.assignedVillage?.name || '-')
const twoFactorEnabled = computed(() => Boolean(appStore.user?.twoFactorEnabled))
const contactPhone = computed(() => {
  const raw = phone.value || appStore.user?.phone || ''
  return raw ? formatPhoneNumber(raw) : '-'
})
const avatarSource = computed(() => (
  appStore.user?.avatarUrl
  || appStore.user?.avatar_url
  || appStore.user?.avatar
  || appStore.user?.profilePhotoUrl
  || appStore.user?.photoUrl
  || ''
))
const avatarUrl = computed(() => resolveFileUrl(avatarSource.value))

const workContextItems = computed(() => {
  if (appStore.isMasyarakat) {
    return [{ label: 'Status', value: 'Masyarakat Umum' }]
  }

  if (appStore.isSuperAdmin || appStore.isVerifikator) {
    return [{ label: 'Cakupan Wilayah', value: 'Seluruh Provinsi Bangka Belitung' }]
  }

  const items = []
  if (assignedProvince.value !== '-') {
    items.push({ label: 'Provinsi', value: assignedProvince.value })
  }
  if (assignedRegency.value !== '-') {
    items.push({ label: 'Kabupaten/Kota', value: assignedRegency.value })
  }
  if (assignedDistrict.value !== '-' && appStore.user?.userLevel !== 'regency') {
    items.push({ label: 'Kecamatan', value: assignedDistrict.value })
  }
  if (assignedVillage.value !== '-' && appStore.user?.userLevel === 'village') {
    items.push({ label: 'Desa/Kelurahan', value: assignedVillage.value })
  }
  return items.length ? items : [{ label: 'Wilayah', value: '-' }]
})

const activitySummary = computed(() => {
  const fallbackTotal = appStore.user?.stats?.totalSubmissions ?? appStore.user?.submissionCount
  const housingCount = activityCounts.value.housing
  const facilityCount = activityCounts.value.facility
  const developmentCount = activityCounts.value.development
  const parts = [housingCount, facilityCount, developmentCount].filter((value) => typeof value === 'number')
  const total = parts.length ? parts.reduce((sum, value) => sum + value, 0) : fallbackTotal

  if (!total && total !== 0) return ''
  if (!parts.length) return `Total data yang Anda input: ${total}`

  return `Total data yang Anda input: ${total} (Rumah ${housingCount ?? 0} · Infrastruktur ${facilityCount ?? 0} · Perumahan ${developmentCount ?? 0})`
})

const isDirty = computed(() => (
  fullName.value !== initialProfile.value.fullName
  || phone.value !== initialProfile.value.phone
  || nik.value !== initialProfile.value.nik
))

const loadProfile = async () => {
  try {
    const response = await userAPI.getProfile()
    if (response.success) {
      const user = response.data?.user || response.data
      if (user) {
        appStore.user = user
      }
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      text: error.message || 'Gagal memuat profil',
      color: 'error'
    }
  }

  fullName.value = appStore.user?.fullName || ''
  phone.value = sanitizeDigits(appStore.user?.phone || '')
  nik.value = identityNumberRaw.value || ''
  initialProfile.value = { fullName: fullName.value, phone: phone.value, nik: nik.value }
}

const resetForm = () => {
  fullName.value = initialProfile.value.fullName
  phone.value = initialProfile.value.phone
  nik.value = initialProfile.value.nik
}

const handleSave = async () => {
  const form = formRef.value
  if (form) {
    const { valid: isValid } = await form.validate()
    if (!isValid) return
  }

  saving.value = true
  const sanitizedNik = sanitizeDigits(nik.value, 16)
  const sanitizedPhone = sanitizeDigits(phone.value)
  const payload = {
    fullName: fullName.value.trim(),
    phone: sanitizedPhone
  }
  if (!identityReadonly.value && sanitizedNik) {
    payload.familyCardNumber = sanitizedNik
  }

  const result = await appStore.updateProfile(payload)
  saving.value = false

  if (result.success) {
    initialProfile.value = {
      fullName: fullName.value,
      phone: phone.value,
      nik: nik.value
    }
    snackbar.value = {
      show: true,
      text: 'Profil berhasil diperbarui',
      color: 'success'
    }
  } else {
    snackbar.value = {
      show: true,
      text: result.error || 'Gagal memperbarui profil',
      color: 'error'
    }
  }
}

const triggerAvatarSelect = () => {
  if (avatarUploading.value) return
  avatarInput.value?.click()
}

const handleAvatarSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type || !file.type.startsWith('image/')) {
    snackbar.value = {
      show: true,
      text: 'Format file harus berupa gambar',
      color: 'error'
    }
    event.target.value = ''
    return
  }

  avatarUploading.value = true
  const result = await appStore.updateProfileAvatar(file)
  avatarUploading.value = false
  event.target.value = ''

  if (result.success) {
    snackbar.value = {
      show: true,
      text: 'Foto profil berhasil diperbarui',
      color: 'success'
    }
  } else {
    snackbar.value = {
      show: true,
      text: result.error || 'Gagal memperbarui foto profil',
      color: 'error'
    }
  }
}

const extractTotal = (response) => {
  const data = response?.data || {}
  const pagination = data.pagination || {}
  return (
    pagination.totalItems
    ?? pagination.total
    ?? pagination.totalCount
    ?? data.total
    ?? data.totalItems
    ?? null
  )
}

const loadActivitySummary = async () => {
  if (!appStore.user?.id) return
  try {
    const params = { createdBy: appStore.user.id, page: 1, limit: 1 }
    const [housingResponse, facilityResponse, developmentResponse] = await Promise.all([
      housingAPI.getSubmissions(params),
      facilityAPI.getSurveys(params),
      housingDevelopmentAPI.getDevelopments(params)
    ])

    const housingTotal = extractTotal(housingResponse)
    const facilityTotal = extractTotal(facilityResponse)
    const developmentTotal = extractTotal(developmentResponse)

    activityCounts.value = {
      housing: typeof housingTotal === 'number' ? housingTotal : null,
      facility: typeof facilityTotal === 'number' ? facilityTotal : null,
      development: typeof developmentTotal === 'number' ? developmentTotal : null
    }
  } catch (error) {
    // Silently ignore to avoid blocking profile load
  }
}

onMounted(async () => {
  await loadProfile()
  await loadActivitySummary()
})

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return window.confirm('Perubahan belum disimpan. Yakin ingin meninggalkan halaman?')
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.profile-avatar {
  position: relative;
}

.avatar-edit {
  position: absolute;
  bottom: -6px;
  right: -6px;
}

.activity-summary {
  white-space: normal;
  word-break: break-word;
}
</style>
