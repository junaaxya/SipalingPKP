<template>
  <div>
    <v-card
      elevation="2"
      rounded="xl"
    >
      <v-card-title class="pa-6">
        <h2 class="text-h5 font-weight-bold">
          Users Management
        </h2>
        <v-spacer />
        <v-btn
          v-if="isSuperAdmin"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openAddUserDialog"
        >
          Tambah Pengguna
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-6 pt-0">
        <v-alert
          v-if="!isSuperAdmin"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          Hanya Super Admin yang dapat menambahkan akun pejabat.
        </v-alert>

        <v-alert
          v-if="usersError"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ usersError }}
        </v-alert>

        <v-row class="mb-4">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="searchQuery"
              label="Cari nama atau email"
              prepend-inner-icon="mdi-magnify"
              clearable
              variant="outlined"
              density="comfortable"
              @update:model-value="debouncedLoadUsers"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="roleFilter"
              label="Filter Role"
              :items="roleFilterOptions"
              item-title="title"
              item-value="value"
              clearable
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              label="Status"
              :items="statusFilterOptions"
              item-title="title"
              item-value="value"
              clearable
              variant="outlined"
              density="comfortable"
              @update:model-value="loadUsers"
            />
          </v-col>
          <v-col cols="12" md="1" class="d-flex align-center">
            <v-btn
              icon="mdi-refresh"
              variant="text"
              :loading="usersLoading"
              @click="loadUsers"
            />
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="displayUsers"
          :items-per-page="10"
          :loading="usersLoading"
          class="elevation-0"
        >
          <template #item.avatar="{ item }">
            <v-avatar size="32">
              <span class="text-subtitle-2">
                {{ item.initials }}
              </span>
            </v-avatar>
          </template>

          <template #item.status="{ item }">
            <v-chip
              :color="item.status === 'Aktif' ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template #item.role="{ item }">
            <v-chip
              color="primary"
              size="small"
              variant="tonal"
            >
              {{ item.role }}
            </v-chip>
          </template>

          <template #item.noKk="{ item }">
            {{ item.noKk }}
          </template>

          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              :disabled="!isSuperAdmin || item.roleKey === 'super_admin'"
              @click="editUser(item)"
            />
            <v-btn
              v-if="item.isActive"
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              :disabled="!isSuperAdmin || item.roleKey === 'super_admin'"
              @click="deleteUser(item)"
            />
            <v-btn
              v-else
              icon="mdi-check-circle"
              size="small"
              variant="text"
              color="success"
              :disabled="!isSuperAdmin || item.roleKey === 'super_admin'"
              @click="activateUser(item)"
            />
          </template>

          <template #no-data>
            <div class="text-center py-6 text-medium-emphasis">
              Belum ada akun pejabat yang terdaftar.
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog
      v-model="showAddUserDialog"
      max-width="720"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-account-plus</v-icon>
          {{ dialogTitle }}
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showAddUserDialog = false"
          />
        </v-card-title>

        <v-card-text>
          <v-alert
            v-if="addUserError"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ addUserError }}
          </v-alert>

          <v-form
            ref="addUserFormRef"
            v-model="addUserFormValid"
          >
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="addUserForm.fullName"
                  label="Nama Lengkap"
                  :rules="[rules.required, rules.fullName]"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="addUserForm.email"
                  label="Email"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  :disabled="isEditMode"
                />
              </v-col>
              <v-col cols="12" md="6" v-if="!isEditMode">
                <v-text-field
                  v-model="addUserForm.password"
                  label="Password"
                  :rules="[rules.required, rules.password]"
                  variant="outlined"
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  hint="Minimal 8 karakter, ada huruf besar, huruf kecil, angka, dan simbol."
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="addUserForm.role"
                  label="Role"
                  :items="roleOptions"
                  item-title="title"
                  item-value="value"
                  :rules="[rules.required]"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <div class="text-subtitle-2 mb-2">
              Scope Wilayah
            </div>
            <v-row>
              <v-col cols="12" md="4">
                <v-select
                  v-model="addUserForm.provinceId"
                  label="Provinsi"
                  :items="provinceOptions"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  :loading="locationsLoading.provinces"
                  :disabled="!isRoleSelected"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="addUserForm.regencyId"
                  label="Kabupaten"
                  :items="regencyOptions"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  :loading="locationsLoading.regencies"
                  :disabled="!addUserForm.provinceId || !isRoleSelected"
                  :rules="regencyRules"
                />
              </v-col>
              <v-col
                v-if="needsVillage"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="addUserForm.districtId"
                  label="Kecamatan"
                  :items="districtOptions"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  :loading="locationsLoading.districts"
                  :disabled="!needsDistrict"
                />
              </v-col>
              <v-col
                v-if="needsVillage"
                cols="12"
                md="4"
              >
                <v-select
                  v-model="addUserForm.villageId"
                  label="Desa"
                  :items="villageOptions"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  :loading="locationsLoading.villages"
                  :disabled="!canSelectVillage"
                  :rules="villageRules"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="showAddUserDialog = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="primary"
            :loading="addUserLoading"
            :disabled="!addUserFormValid"
            @click="submitAddUser"
          >
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="confirmDialog.show"
      max-width="420"
    >
      <v-card>
        <v-card-title class="text-subtitle-1">
          Konfirmasi Nonaktifkan
        </v-card-title>
        <v-card-text>
          Apakah Anda yakin ingin menonaktifkan akun
          <strong>{{ confirmDialog.user?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="confirmDialog.show = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="error"
            :loading="confirmDialog.loading"
            @click="confirmDeactivate"
          >
            Nonaktifkan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top"
      timeout="4000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { debounce } from 'lodash-es'
import { definePage } from 'unplugin-vue-router/runtime'
import { useAppStore } from '@/stores/app'
import { locationAPI, userAPI } from '@/services'

definePage({
  meta: {
    layout: 'dashboard'
  }
})

const appStore = useAppStore()

// Table headers
const headers = [
  { title: 'Avatar', key: 'avatar', sortable: false },
  { title: 'Nama', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Wilayah', key: 'location' },
  { title: 'Status', key: 'status' },
  { title: 'Aksi', key: 'actions', sortable: false }
]

const users = ref([])
const usersLoading = ref(false)
const usersError = ref('')
const searchQuery = ref('')
const roleFilter = ref(null)
const statusFilter = ref(null)
const isEditMode = ref(false)
const editingUserId = ref(null)
const isPrefilling = ref(false)
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})
const confirmDialog = reactive({
  show: false,
  loading: false,
  user: null,
})

const isSuperAdmin = computed(() => appStore.isSuperAdmin)
const canManageUsers = computed(() => appStore.isSuperAdmin || appStore.hasPermission('manage_users'))
const dialogTitle = computed(() => (isEditMode.value ? 'Edit Pengguna' : 'Tambah Pengguna'))
const showAddUserDialog = ref(false)
const addUserFormRef = ref(null)
const addUserFormValid = ref(false)
const addUserLoading = ref(false)
const addUserError = ref('')
const showPassword = ref(false)

const addUserForm = reactive({
  fullName: '',
  email: '',
  password: '',
  role: '',
  provinceId: '',
  regencyId: '',
  districtId: '',
  villageId: '',
})

const roleOptions = [
  { title: 'Admin Desa', value: 'admin_desa' },
  { title: 'Admin Kabupaten', value: 'admin_kabupaten' },
  { title: 'Verifikator', value: 'verifikator' },
]

const roleFilterOptions = [
  { title: 'Super Admin', value: 'super_admin' },
  { title: 'Admin Desa', value: 'admin_village' },
  { title: 'Admin Kabupaten', value: 'admin_regency' },
  { title: 'Verifikator', value: 'verifikator' },
  { title: 'Masyarakat', value: 'masyarakat' },
]

const statusFilterOptions = [
  { title: 'Aktif', value: true },
  { title: 'Nonaktif', value: false },
]

const provinces = ref([])
const regencies = ref([])
const districts = ref([])
const villages = ref([])

const locationsLoading = reactive({
  provinces: false,
  regencies: false,
  districts: false,
  villages: false,
})

const isRoleSelected = computed(() => !!addUserForm.role)
const needsVillage = computed(() => addUserForm.role === 'admin_desa')
const needsDistrict = computed(() => needsVillage.value && !!addUserForm.regencyId)
const canSelectVillage = computed(() => needsVillage.value && !!addUserForm.districtId)

const provinceOptions = computed(() => provinces.value)
const regencyOptions = computed(() => regencies.value)
const districtOptions = computed(() => districts.value)
const villageOptions = computed(() => villages.value)

const rules = {
  required: (value) => !!value || 'Wajib diisi',
  email: (value) =>
    !value || /.+@.+\..+/.test(value) || 'Format email tidak valid',
  fullName: (value) =>
    !value || /^[a-zA-Z\s\u00C0-\u017F.'-]+$/.test(value) || 'Nama hanya boleh huruf, spasi, atau tanda baca ringan.',
  password: (value) => {
    if (!value) return true
    if (value.length < 8) {
      return 'Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol.'
    }

    const hasUpper = /[A-Z]/.test(value)
    const hasLower = /[a-z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(value)

    if (hasUpper && hasLower && hasNumber && hasSymbol) {
      return true
    }

    return 'Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol.'
  },
}

const regencyRules = computed(() => (addUserForm.role ? [rules.required] : []))
const villageRules = computed(() => (needsVillage.value ? [rules.required] : []))

const showSnackbar = (message, color = 'success') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

const resolveUserErrorMessage = (error) => {
  const code = error?.code || error?.response?.data?.code
  const message = error?.message || error?.response?.data?.message || ''

  if (code === 'USER_EXISTS' || message.toLowerCase().includes('email')) {
    return 'Gagal membuat akun, email sudah terdaftar.'
  }
  if (code === 'SUPER_ADMIN_REQUIRED') {
    return 'Hanya Super Admin yang dapat menambahkan akun pejabat.'
  }
  if (code === 'INSUFFICIENT_PERMISSIONS') {
    return 'Anda tidak memiliki izin untuk melakukan aksi ini.'
  }
  if (typeof code === 'string' && code.startsWith('REGISTRY_')) {
    return 'Registrasi gagal. Silakan periksa data atau coba lagi.'
  }
  if (code === 'ROUTE_NOT_FOUND') {
    return 'Layanan tidak ditemukan. Coba muat ulang halaman.'
  }
  if (code === 'DATABASE_ERROR' || code === 'INTERNAL_ERROR') {
    return 'Koneksi database terputus. Coba lagi beberapa saat.'
  }
  if (code === 'VALIDATION_ERROR') {
    return 'Data tidak valid. Periksa kembali isian Anda.'
  }
  if (message) {
    return message
  }

  return 'Terjadi kesalahan. Silakan coba lagi.'
}

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin_regency: 'Admin Kabupaten',
  admin_village: 'Admin Desa',
  verifikator: 'Verifikator',
  masyarakat: 'Masyarakat',
}

const normalizeRoleKey = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (normalized === 'admin_desa') return 'admin_village'
  if (normalized === 'admin_kabupaten') return 'admin_regency'
  if (normalized === 'superadmin') return 'super_admin'
  return normalized
}

const toTitleCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getInitials = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return 'NA'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

const maskNoKk = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return '-'
  if (raw.length <= 6) return raw
  return `${raw.slice(0, 4)}${'*'.repeat(Math.max(0, raw.length - 6))}${raw.slice(-2)}`
}

const getLocationName = (location) => {
  if (!location) return ''
  return location.name || location.nama || ''
}

const toFormRole = (roleKey) => {
  if (roleKey === 'admin_village') return 'admin_desa'
  if (roleKey === 'admin_regency') return 'admin_kabupaten'
  if (roleKey === 'verifikator') return 'verifikator'
  return ''
}

const resolveRole = (user) => {
  const roleEntry = Array.isArray(user?.roles) && user.roles.length ? user.roles[0] : null
  const rawName = roleEntry?.name || roleEntry?.displayName || user?.roleNames?.[0] || ''
  let roleKey = normalizeRoleKey(roleEntry?.name || rawName)

  if (!roleKey) {
    if (user?.userLevel === 'citizen') {
      roleKey = 'masyarakat'
    } else if (user?.userLevel === 'village') {
      roleKey = 'admin_village'
    } else if (user?.userLevel === 'regency') {
      roleKey = 'admin_regency'
    } else if (user?.userLevel === 'province') {
      roleKey = 'super_admin'
    }
  }

  const label = ROLE_LABELS[roleKey] || roleEntry?.displayName || toTitleCase(rawName) || 'Masyarakat'
  return { roleKey, label }
}

const buildLocationLabel = (user, roleKey) => {
  const villageName = getLocationName(user?.assignedVillage)
  const districtName = getLocationName(user?.assignedDistrict)
  const regencyName = getLocationName(user?.assignedRegency)
  const provinceName = getLocationName(user?.assignedProvince)

  const parts = []
  if (villageName) parts.push(`Desa ${villageName}`)
  if (districtName) parts.push(`Kecamatan ${districtName}`)
  if (regencyName) parts.push(`Kabupaten ${regencyName}`)
  if (provinceName) parts.push(`Provinsi ${provinceName}`)

  if (parts.length) return parts.join(', ')
  if (roleKey === 'super_admin') return 'Semua Wilayah'
  if (user?.userLevel === 'citizen') return 'Pribadi'
  return '-'
}

const mapUser = (user) => {
  const { roleKey, label } = resolveRole(user)
  const name = user?.fullName || user?.name || '-'
  const email = user?.email || '-'
  const isActive = !!user?.isActive
  const nik = user?.familyCardNumber || user?.nik || user?.nikNumber || ''

  return {
    id: user?.id,
    name,
    email,
    role: label,
    roleKey,
    status: isActive ? 'Aktif' : 'Nonaktif',
    isActive,
    initials: getInitials(name || email),
    location: buildLocationLabel(user, roleKey),
    noKk: nik ? maskNoKk(nik) : '-',
  }
}

const displayUsers = computed(() => {
  let rows = users.value.map(mapUser)

  if (roleFilter.value) {
    rows = rows.filter((item) => item.roleKey === roleFilter.value)
  }

  if (statusFilter.value !== null && statusFilter.value !== undefined) {
    rows = rows.filter((item) => item.isActive === statusFilter.value)
  }

  return rows
})

const resetForm = () => {
  addUserForm.fullName = ''
  addUserForm.email = ''
  addUserForm.password = ''
  addUserForm.role = ''
  addUserForm.provinceId = ''
  addUserForm.regencyId = ''
  addUserForm.districtId = ''
  addUserForm.villageId = ''
  regencies.value = []
  districts.value = []
  villages.value = []
  addUserError.value = ''
  addUserFormValid.value = false
  isEditMode.value = false
  editingUserId.value = null
  isPrefilling.value = false
  addUserFormRef.value?.resetValidation()
}

const openAddUserDialog = () => {
  isEditMode.value = false
  editingUserId.value = null
  showAddUserDialog.value = true
}

const loadProvinces = async () => {
  locationsLoading.provinces = true
  try {
    const response = await locationAPI.getProvinces()
    provinces.value = response?.data?.provinces || response?.data || []
  } catch (error) {
    provinces.value = []
  } finally {
    locationsLoading.provinces = false
  }
}

const loadRegencies = async (provinceId) => {
  if (!provinceId) return
  locationsLoading.regencies = true
  try {
    const response = await locationAPI.getRegencies(provinceId)
    regencies.value = response?.data?.regencies || response?.data || []
  } catch (error) {
    regencies.value = []
  } finally {
    locationsLoading.regencies = false
  }
}

const loadDistricts = async (regencyId) => {
  if (!regencyId) return
  locationsLoading.districts = true
  try {
    const response = await locationAPI.getDistricts(regencyId)
    districts.value = response?.data?.districts || response?.data || []
  } catch (error) {
    districts.value = []
  } finally {
    locationsLoading.districts = false
  }
}

const loadVillages = async (districtId) => {
  if (!districtId) return
  locationsLoading.villages = true
  try {
    const response = await locationAPI.getVillages(districtId)
    villages.value = response?.data?.villages || response?.data || []
  } catch (error) {
    villages.value = []
  } finally {
    locationsLoading.villages = false
  }
}

const loadUsers = async () => {
  if (!canManageUsers.value) {
    users.value = []
    return
  }

  usersLoading.value = true
  usersError.value = ''

  try {
    const params = {}
    const query = searchQuery.value?.trim()

    if (query) {
      params.search = query
    }

    if (statusFilter.value !== null && statusFilter.value !== undefined) {
      params.isActive = statusFilter.value
    }

    const response = await userAPI.getStaffUsers(params)
    if (!response?.success) {
      usersError.value = response?.message || 'Gagal memuat data pengguna.'
      showSnackbar(resolveUserErrorMessage(response), 'error')
      users.value = []
      return
    }

    const rows = response?.data?.items || response?.data?.rows || response?.data?.users || response?.data || []
    users.value = Array.isArray(rows) ? rows : []
  } catch (error) {
    usersError.value = resolveUserErrorMessage(error)
    showSnackbar(usersError.value, 'error')
    users.value = []
  } finally {
    usersLoading.value = false
  }
}

const debouncedLoadUsers = debounce(() => {
  loadUsers()
}, 400)

const submitAddUser = async () => {
  if (!addUserFormRef.value) return
  const { valid } = await addUserFormRef.value.validate()
  if (!valid) return

  addUserLoading.value = true
  addUserError.value = ''
  try {
    const wasEdit = isEditMode.value && !!editingUserId.value
    const basePayload = {
      fullName: addUserForm.fullName,
      role: addUserForm.role,
      regencyId: addUserForm.regencyId || null,
      villageId: addUserForm.villageId || null,
    }
    const response = wasEdit
      ? await userAPI.updateStaffUser(editingUserId.value, basePayload)
      : await userAPI.createStaffUser({
        ...basePayload,
        email: addUserForm.email,
        password: addUserForm.password,
      })
    if (!response.success) {
      addUserError.value = response.message || 'Gagal menambahkan pengguna.'
      return
    }
    showAddUserDialog.value = false
    resetForm()
    showSnackbar(wasEdit ? 'Akun berhasil diperbarui.' : 'Akun berhasil dibuat.', 'success')
    await loadUsers()
  } catch (error) {
    if (Array.isArray(error?.errors) && error.errors.length) {
      addUserError.value = error.errors.map((item) => item.message).join(', ')
    } else {
      addUserError.value = resolveUserErrorMessage(error)
    }
    showSnackbar(addUserError.value, 'error')
  } finally {
    addUserLoading.value = false
  }
}

watch(showAddUserDialog, (value) => {
  if (value) {
    loadProvinces()
  } else {
    resetForm()
  }
})

watch(
  () => addUserForm.role,
  () => {
    if (isPrefilling.value) return
    addUserForm.provinceId = ''
    addUserForm.regencyId = ''
    addUserForm.districtId = ''
    addUserForm.villageId = ''
    regencies.value = []
    districts.value = []
    villages.value = []
  }
)

watch(
  () => addUserForm.provinceId,
  async (value) => {
    if (isPrefilling.value) return
    addUserForm.regencyId = ''
    addUserForm.districtId = ''
    addUserForm.villageId = ''
    regencies.value = []
    districts.value = []
    villages.value = []
    if (value) {
      await loadRegencies(value)
    }
  }
)

watch(
  () => addUserForm.regencyId,
  async (value) => {
    if (isPrefilling.value) return
    addUserForm.districtId = ''
    addUserForm.villageId = ''
    districts.value = []
    villages.value = []
    if (value && needsVillage.value) {
      await loadDistricts(value)
    }
  }
)

watch(
  () => addUserForm.districtId,
  async (value) => {
    if (isPrefilling.value) return
    addUserForm.villageId = ''
    villages.value = []
    if (value && needsVillage.value) {
      await loadVillages(value)
    }
  }
)

onMounted(() => {
  loadUsers()
})

// Methods
const editUser = async (user) => {
  const rawUser = users.value.find((item) => item.id === user.id)
  if (!rawUser) {
    showSnackbar('Data pengguna tidak ditemukan.', 'error')
    return
  }

  const { roleKey } = resolveRole(rawUser)
  const formRole = toFormRole(roleKey)
  if (!formRole) {
    showSnackbar('Role pengguna tidak didukung untuk diedit.', 'error')
    return
  }

  isPrefilling.value = true
  isEditMode.value = true
  editingUserId.value = rawUser.id
  addUserForm.fullName = rawUser.fullName || ''
  addUserForm.email = rawUser.email || ''
  addUserForm.password = ''
  addUserForm.role = formRole
  showAddUserDialog.value = true
  await loadProvinces()
  addUserForm.provinceId = rawUser.assignedProvinceId || ''
  if (addUserForm.provinceId) {
    await loadRegencies(addUserForm.provinceId)
  }
  addUserForm.regencyId = rawUser.assignedRegencyId || ''
  if (needsVillage.value && addUserForm.regencyId) {
    await loadDistricts(addUserForm.regencyId)
  }
  addUserForm.districtId = rawUser.assignedDistrictId || ''
  if (needsVillage.value && addUserForm.districtId) {
    await loadVillages(addUserForm.districtId)
  }
  addUserForm.villageId = rawUser.assignedVillageId || ''
  isPrefilling.value = false
}

const deleteUser = (user) => {
  confirmDialog.user = user
  confirmDialog.show = true
}

const confirmDeactivate = async () => {
  if (!confirmDialog.user) return
  confirmDialog.loading = true
  try {
    const response = await userAPI.deactivateUser(confirmDialog.user.id)
    if (!response?.success) {
      throw response
    }
    showSnackbar('Akun berhasil dinonaktifkan.', 'success')
    confirmDialog.show = false
    confirmDialog.user = null
    await loadUsers()
  } catch (error) {
    showSnackbar(resolveUserErrorMessage(error), 'error')
  } finally {
    confirmDialog.loading = false
  }
}

const activateUser = async (user) => {
  if (!user?.id) return
  try {
    const response = await userAPI.activateUser(user.id)
    if (!response?.success) {
      throw response
    }
    showSnackbar('Akun berhasil diaktifkan.', 'success')
    await loadUsers()
  } catch (error) {
    showSnackbar(resolveUserErrorMessage(error), 'error')
  }
}
</script>
