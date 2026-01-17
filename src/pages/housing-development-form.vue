<template>
  <div>
    <v-container fluid class="px-2 px-sm-6 py-4">
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        location="top right"
        timeout="4000"
      >
        {{ snackbar.message }}
        <template #actions>
          <v-btn variant="text" @click="snackbar.show = false">Tutup</v-btn>
        </template>
      </v-snackbar>
      <v-card
        class="mx-auto w-100 form-card"
        max-width="1200"
      >
        <!-- Header -->
        <v-card-title class="text-h5 text-center py-4">
          {{ isEditMode ? 'Edit Survei Perumahan' : 'Formulir Survey Perumahan' }}
        </v-card-title>

        <!-- Form Content -->
        <v-card-text>
          <v-form ref="formRef">
            <!-- Housing Development Cards -->
            <div v-if="housingDevelopments.length === 0">
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                Klik tombol "Tambah Perumahan" untuk mulai mengisi data.
              </v-alert>
            </div>

            <div
              v-for="(housing, index) in housingDevelopments"
              :key="housing.id"
              class="mb-6"
            >
              <v-card
                variant="outlined"
                class="pa-4"
              >
                <v-card-title class="d-flex align-center justify-space-between">
                  <span class="text-subtitle-1">
                    Perumahan #{{ index + 1 }}
                  </span>
                  <v-btn
                    v-if="!isEditMode && housingDevelopments.length > 1"
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeHousing(housing.id)"
                  >
                    <v-icon>mdi-delete</v-icon>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      Hapus Perumahan
                    </v-tooltip>
                  </v-btn>
                </v-card-title>

                <v-card-text>
                  <v-row>
                    <!-- Nama Perumahan -->
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="housing.namaPerumahan"
                        label="Nama Perumahan"
                        variant="outlined"
                      />
                    </v-col>

                    <!-- Nama Pengembang -->
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="housing.namaPengembang"
                        label="Nama Pengembang"
                        variant="outlined"
                      />
                    </v-col>

                    <!-- Luas Lahan -->
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        :model-value="housing.luasLahan"
                        label="Luas Lahan (m²)"
                        inputmode="decimal"
                        :min="AREA_MIN"
                        :max="AREA_MAX"
                        :hint="AREA_HINT"
                        persistent-hint
                        :rules="[rules.areaRange]"
                        variant="outlined"
                        @update:modelValue="(val) => { housing.luasLahan = sanitizeDecimal(val) }"
                      />
                    </v-col>

                    <!-- Jenis Perumahan -->
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-select
                        v-model="housing.jenisPerumahan"
                        label="Jenis Perumahan"
                        :items="jenisPerumahanOptions"
                        variant="outlined"
                      />
                    </v-col>

                    <!-- Koordinat -->
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="housing.koordinat"
                        label="Koordinat"
                        variant="outlined"
                        placeholder="contoh: -6.200000, 106.816666"
                      >
        <template #append-inner>
          <v-btn
            icon
            size="small"
            variant="text"
            :loading="locationLoading[housing.id]"
            :disabled="locationLoading[housing.id]"
            @click="openLocationPicker(housing)"
          >
                            <v-icon>mdi-crosshairs-gps</v-icon>
                            <v-tooltip
                              activator="parent"
                              location="top"
                            >
                              Gunakan Lokasi Saat Ini
                            </v-tooltip>
                          </v-btn>
                        </template>
                      </v-text-field>
                      <v-alert
                        v-if="locationMessages[housing.id]"
                        :type="locationMessageTypes[housing.id]"
                        variant="tonal"
                        density="compact"
                        class="mt-2"
                        closable
                        @click:close="locationMessages[housing.id] = ''"
                      >
                        {{ locationMessages[housing.id] }}
                      </v-alert>
                    </v-col>

                    <v-col cols="12">
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div class="text-subtitle-2">
                          Lokasi Administratif
                        </div>
                        <div class="d-flex align-center gap-2">
                          <v-chip
                            v-if="housing.locationOverride"
                            size="small"
                            color="warning"
                            variant="tonal"
                          >
                            Manual
                          </v-chip>
                          <v-btn
                            size="x-small"
                            variant="text"
                            prepend-icon="mdi-map-marker-edit"
                            @click="openManualLocationDialog(housing)"
                          >
                            Ubah Lokasi
                          </v-btn>
                          <v-btn
                            v-if="housing.locationOverride"
                            size="x-small"
                            variant="text"
                            color="primary"
                            prepend-icon="mdi-refresh"
                            @click="resetLocationOverride(housing)"
                          >
                            Reset Otomatis
                          </v-btn>
                        </div>
                      </div>
                      <v-row>
                        <v-col
                          cols="12"
                          md="6"
                        >
                          <v-text-field
                            :model-value="housing.location?.village?.name || ''"
                            label="Desa/Kelurahan"
                            variant="outlined"
                            readonly
                          />
                        </v-col>
                        <v-col
                          cols="12"
                          md="6"
                        >
                          <v-text-field
                            :model-value="housing.location?.district?.name || ''"
                            label="Kecamatan"
                            variant="outlined"
                            readonly
                          />
                        </v-col>
                        <v-col
                          cols="12"
                          md="6"
                        >
                          <v-text-field
                            :model-value="housing.location?.regency?.name || ''"
                            label="Kabupaten/Kota"
                            variant="outlined"
                            readonly
                          />
                        </v-col>
                        <v-col
                          cols="12"
                          md="6"
                        >
                          <v-text-field
                            :model-value="housing.location?.province?.name || ''"
                            label="Provinsi"
                            variant="outlined"
                            readonly
                          />
                        </v-col>
                      </v-row>
                    </v-col>

                    <!-- Jumlah Rumah Rencana -->
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        :model-value="housing.jumlahRumahRencana"
                        label="Jumlah Rumah Rencana (Unit)"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        :min="UNIT_MIN"
                        :max="UNIT_MAX"
                        :hint="UNIT_HINT"
                        persistent-hint
                        :rules="[rules.unitRange]"
                        variant="outlined"
                        @update:modelValue="(val) => { housing.jumlahRumahRencana = sanitizeDigits(val) }"
                      />
                    </v-col>

                    <!-- Foto Perumahan -->
                    <v-col cols="12">
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div class="text-subtitle-2">
                          Foto Perumahan
                        </div>
                        <v-chip
                          size="x-small"
                          variant="tonal"
                          color="primary"
                        >
                          {{ (housing.existingPhotos?.length || 0) + (housing.photos?.length || 0) }}/{{ MAX_DEV_PHOTOS }}
                        </v-chip>
                      </div>
                      <v-alert
                        type="info"
                        variant="tonal"
                        density="compact"
                        class="mb-3"
                      >
                        Unggah maksimal {{ MAX_DEV_PHOTOS }} foto. Ukuran tiap foto hingga {{ MAX_DEV_PHOTO_SIZE_MB }}MB.
                      </v-alert>
                      <div class="d-flex flex-wrap gap-3">
                        <div
                          v-for="(photo, photoIndex) in housing.existingPhotos"
                          :key="`existing-${housing.id}-${photo.id || photoIndex}`"
                          class="development-photo-card"
                        >
                          <v-img
                            :src="photo.url"
                            :alt="photo.name"
                            cover
                            height="120"
                            width="160"
                          />
                          <div class="text-caption text-truncate mt-1">
                            {{ photo.name }}
                          </div>
                        </div>
                        <div
                          v-for="(photo, photoIndex) in housing.photos"
                          :key="`new-${housing.id}-${photoIndex}`"
                          class="development-photo-card"
                        >
                          <v-img
                            :src="photo.url"
                            :alt="photo.name"
                            cover
                            height="120"
                            width="160"
                          >
                            <template #placeholder>
                              <div class="d-flex align-center justify-center fill-height">
                                <v-progress-circular indeterminate size="20" />
                              </div>
                            </template>
                          </v-img>
                          <div class="d-flex align-center justify-space-between mt-1">
                            <div class="text-caption text-truncate">
                              {{ photo.name }}
                            </div>
                            <v-btn
                              icon="mdi-close"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click="removeDevelopmentPhoto(housing, photoIndex)"
                            />
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            {{ formatFileSize(photo.size) }}
                          </div>
                        </div>
                        <v-btn
                          color="primary"
                          variant="outlined"
                          prepend-icon="mdi-camera"
                          :disabled="!canAddDevelopmentPhotos(housing)"
                          @click="triggerPhotoInput(housing.id)"
                        >
                          Tambah Foto
                        </v-btn>
                        <input
                          :ref="(el) => registerPhotoInput(housing.id, el)"
                          type="file"
                          multiple
                          accept="image/*"
                          class="file-input-hidden"
                          @change="(event) => handlePhotoInput(housing, event)"
                        >
                      </div>
                    </v-col>

                    <!-- Kebutuhan Jalan Akses -->
                    <v-col cols="12">
                      <v-switch
                        v-model="housing.kebutuhanJalanAkses"
                        label="Kebutuhan Jalan Akses Menuju Perumahan"
                        color="primary"
                      />
                    </v-col>

                    <!-- Detail Jalan Akses (jika ada) -->
                    <template v-if="housing.kebutuhanJalanAkses">
                      <v-col
                        cols="12"
                        md="6"
                      >
                        <v-text-field
                          :model-value="housing.panjangJalan"
                          label="Panjang Jalan (m)"
                          inputmode="decimal"
                          :min="ROAD_MIN"
                          :max="ROAD_MAX"
                          :hint="ROAD_HINT"
                          persistent-hint
                          :rules="[rules.roadRange]"
                          variant="outlined"
                          @update:modelValue="(val) => { housing.panjangJalan = sanitizeDecimal(val) }"
                        />
                      </v-col>

                      <v-col
                        cols="12"
                        md="6"
                      >
                        <v-select
                          v-model="housing.statusLahan"
                          label="Status Lahan"
                          :items="statusLahanOptions"
                          variant="outlined"
                        />
                      </v-col>
                    </template>
                  </v-row>
                </v-card-text>
              </v-card>
            </div>

            <!-- Add Housing Button -->
            <div
              v-if="!isEditMode"
              class="text-center mt-4 mb-4"
            >
              <v-btn
                color="primary"
                variant="outlined"
                prepend-icon="mdi-plus"
                @click="addHousing"
              >
                Tambah Perumahan
              </v-btn>
            </div>

            <!-- Summary -->
            <v-card
              v-if="housingDevelopments.length > 0"
              variant="tonal"
              color="info"
            >
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon class="mr-2">
                    mdi-information
                  </v-icon>
                  <span>Total {{ housingDevelopments.length }} perumahan telah ditambahkan</span>
                </div>
              </v-card-text>
            </v-card>
          </v-form>
        </v-card-text>

        <!-- Submit Button -->
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn
            color="success"
            :disabled="housingDevelopments.length === 0"
            :loading="isSubmitting"
            prepend-icon="mdi-check"
            @click="submitForm"
          >
            {{ isEditMode ? 'Simpan Perubahan' : 'Kirim Formulir' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
    <LocationPickerDialog
      v-model="locationPickerOpen"
      v-model:latitude="locationPickerLat"
      v-model:longitude="locationPickerLng"
      title="Pilih Lokasi Perumahan"
      @confirm="handleLocationPicked"
    />
    <v-dialog
      v-model="manualLocationDialogOpen"
      max-width="720"
    >
      <v-card>
        <v-card-title class="text-subtitle-1">
          Override Lokasi Manual
        </v-card-title>
        <v-card-text>
          <v-alert
            v-if="manualLocationError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
            closable
            @click:close="manualLocationError = ''"
          >
            {{ manualLocationError }}
          </v-alert>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-autocomplete
                v-model="manualLocation.province"
                label="Provinsi"
                :items="manualLocationOptions.provinces"
                :loading="manualLocationLoading.provinces"
                item-title="name"
                item-value="id"
                return-object
                clearable
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-autocomplete
                v-model="manualLocation.regency"
                label="Kabupaten/Kota"
                :items="manualLocationOptions.regencies"
                :loading="manualLocationLoading.regencies"
                :disabled="!manualLocation.province"
                item-title="name"
                item-value="id"
                return-object
                clearable
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-autocomplete
                v-model="manualLocation.district"
                label="Kecamatan"
                :items="manualLocationOptions.districts"
                :loading="manualLocationLoading.districts"
                :disabled="!manualLocation.regency"
                item-title="name"
                item-value="id"
                return-object
                clearable
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-autocomplete
                v-model="manualLocation.village"
                label="Desa/Kelurahan"
                :items="manualLocationOptions.villages"
                :loading="manualLocationLoading.villages"
                :disabled="!manualLocation.district"
                item-title="name"
                item-value="id"
                return-object
                clearable
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            variant="text"
            @click="manualLocationDialogOpen = false"
          >
            Batal
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="saveManualLocation"
          >
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { definePage } from 'unplugin-vue-router/runtime'
import { useRouter, useRoute } from 'vue-router'
import { housingDevelopmentAPI, locationAPI } from '@/services'
import { useMapDataStore } from '@/stores/mapData'
import LocationPickerDialog from '@/components/LocationPickerDialog.vue'
import { mapReverseGeocodeResponse, resolveLocationId } from '@/utils/locationUtils'

definePage({
  meta: {
    layout: 'dashboard'
  }
})

const router = useRouter()
const route = useRoute()
const mapDataStore = useMapDataStore()

const editDevelopmentId = computed(() => {
  return typeof route.query.edit === 'string' && route.query.edit.trim()
    ? route.query.edit
    : null
})
const isEditMode = computed(() => Boolean(editDevelopmentId.value))

// Form options
const jenisPerumahanOptions = [
  'Sederhana',
  'Menengah',
  'Mewah',
  'Campuran'
]

const statusLahanOptions = [
  'Sudah Diserahkan oleh Pemda',
  'Belum Diserahkan oleh Pemda'
]

const AREA_MIN = 1
const AREA_MAX = 1000000
const UNIT_MIN = 1
const UNIT_MAX = 5000
const ROAD_MIN = 0
const ROAD_MAX = 50000
const AREA_HINT = `${AREA_MIN}-${AREA_MAX} m2`
const UNIT_HINT = `${UNIT_MIN}-${UNIT_MAX}`
const ROAD_HINT = `${ROAD_MIN}-${ROAD_MAX} m`
const MAX_DEV_PHOTOS = 5
const MAX_DEV_PHOTO_SIZE_MB = 5
const MAX_DEV_PHOTO_SIZE = MAX_DEV_PHOTO_SIZE_MB * 1024 * 1024

const rules = {
  areaRange: (value) => {
    if (value === null || value === '') return true
    const num = Number(value)
    if (Number.isNaN(num)) return 'Nilai harus berupa angka'
    return (num >= AREA_MIN && num <= AREA_MAX) || `Luas lahan harus ${AREA_MIN}-${AREA_MAX}`
  },
  unitRange: (value) => {
    if (value === null || value === '') return true
    const num = Number(value)
    if (Number.isNaN(num)) return 'Nilai harus berupa angka'
    return (num >= UNIT_MIN && num <= UNIT_MAX) || `Jumlah rumah harus ${UNIT_MIN}-${UNIT_MAX}`
  },
  roadRange: (value) => {
    if (value === null || value === '') return true
    const num = Number(value)
    if (Number.isNaN(num)) return 'Nilai harus berupa angka'
    return (num >= ROAD_MIN && num <= ROAD_MAX) || `Panjang jalan harus ${ROAD_MIN}-${ROAD_MAX}`
  }
}

const sanitizeDigits = (value) => String(value ?? '').replace(/\D/g, '')

const sanitizeDecimal = (value) => {
  const normalized = String(value ?? '').replace(',', '.')
  const cleaned = normalized.replace(/[^0-9.]/g, '')
  const [whole, ...fractionParts] = cleaned.split('.')
  const fraction = fractionParts.join('')
  if (!whole && !fraction) return ''
  return fraction ? `${whole}.${fraction}` : whole
}

// Reactive state
const housingDevelopments = ref([])
const isSubmitting = ref(false)
const formRef = ref(null)
const locationLoading = ref({})
const locationMessages = ref({})
const locationMessageTypes = ref({})
const locationPickerOpen = ref(false)
const locationPickerLat = ref(null)
const locationPickerLng = ref(null)
const activeHousingId = ref(null)
const manualLocationDialogOpen = ref(false)
const manualLocationError = ref('')
const manualLocation = ref({
  province: null,
  regency: null,
  district: null,
  village: null
})
const manualLocationOptions = ref({
  provinces: [],
  regencies: [],
  districts: [],
  villages: []
})
const manualLocationLoading = ref({
  provinces: false,
  regencies: false,
  districts: false,
  villages: false
})
const isManualLocationSync = ref(false)
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})
const photoInputRefs = ref({})
let housingIdCounter = 0

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}
const SUCCESS_REDIRECT_DELAY_MS = 800

const formatFileSize = (bytes) => {
  const size = Number(bytes)
  if (!Number.isFinite(size)) return ''
  if (size < 1024) return `${size} B`
  const kb = size / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

const registerPhotoInput = (housingId, el) => {
  if (!housingId) return
  if (el) {
    photoInputRefs.value[housingId] = el
    return
  }
  if (photoInputRefs.value[housingId]) {
    delete photoInputRefs.value[housingId]
  }
}

const triggerPhotoInput = (housingId) => {
  const input = photoInputRefs.value[housingId]
  if (input?.click) {
    input.click()
  }
}

const canAddDevelopmentPhotos = (housing) => {
  const existingCount = (housing?.existingPhotos?.length || 0) + (housing?.photos?.length || 0)
  return existingCount < MAX_DEV_PHOTOS
}

const handlePhotoInput = (housing, event) => {
  if (!housing) return
  const input = event?.target
  const files = Array.from(input?.files || [])
  if (!files.length) {
    if (input) input.value = ''
    return
  }

  const currentCount = (housing.existingPhotos?.length || 0) + (housing.photos?.length || 0)
  let availableSlots = MAX_DEV_PHOTOS - currentCount
  if (availableSlots <= 0) {
    showSnackbar(`Maksimal ${MAX_DEV_PHOTOS} foto per perumahan.`, 'warning')
    if (input) input.value = ''
    return
  }

  if (!Array.isArray(housing.photos)) {
    housing.photos = []
  }

  let warning = ''
  files.forEach((file) => {
    if (availableSlots <= 0) {
      if (!warning) {
        warning = `Maksimal ${MAX_DEV_PHOTOS} foto per perumahan.`
      }
      return
    }
    if (!file.type || !file.type.startsWith('image/')) {
      if (!warning) {
        warning = 'File yang dipilih harus berupa gambar.'
      }
      return
    }
    if (file.size > MAX_DEV_PHOTO_SIZE) {
      if (!warning) {
        warning = `Ukuran ${file.name} melebihi ${MAX_DEV_PHOTO_SIZE_MB}MB.`
      }
      return
    }
    const url = URL.createObjectURL(file)
    housing.photos.push({
      file,
      url,
      name: file.name,
      size: file.size
    })
    availableSlots -= 1
  })

  if (warning) {
    showSnackbar(warning, 'warning')
  }

  if (input) input.value = ''
}

const removeDevelopmentPhoto = (housing, index) => {
  if (!housing?.photos?.length) return
  const removed = housing.photos.splice(index, 1)
  if (removed?.[0]?.url) {
    URL.revokeObjectURL(removed[0].url)
  }
}

const releaseDevelopmentPhotos = (housing) => {
  if (!housing?.photos?.length) return
  housing.photos.forEach((photo) => {
    if (photo?.url) {
      URL.revokeObjectURL(photo.url)
    }
  })
}

const extractFileName = (value) => {
  if (!value) return 'Foto'
  const parts = String(value).split('/')
  return parts[parts.length - 1] || 'Foto'
}

const resolvePhotoUrl = (photo) => {
  if (!photo) return ''
  const explicitUrl = photo?.fileUrl || photo?.fileURL || photo?.url
  if (explicitUrl) return explicitUrl
  const rawPath = photo?.filePath || photo?.file_path
  if (!rawPath) return ''
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')
  const normalized = String(rawPath).replace(/^\/+/, '').replace(/^uploads\//, '')
  const fileBase = baseUrl.endsWith('/api')
    ? `${baseUrl}/files/`
    : `${baseUrl}/api/files/`
  const cleaned = normalized.replace(/^api\/files\//, '').replace(/^files\//, '')
  return `${fileBase}${cleaned}`
}

const mapExistingDevelopmentPhotos = (photos) => {
  if (!Array.isArray(photos)) return []
  return photos
    .map((photo, index) => {
      const url = resolvePhotoUrl(photo)
      if (!url) return null
      return {
        id: photo?.id || null,
        url,
        name: extractFileName(url) || `Foto ${index + 1}`,
        size: Number(photo?.fileSize ?? photo?.file_size ?? 0) || null
      }
    })
    .filter(Boolean)
}

// Methods
const addHousing = () => {
  housingDevelopments.value.push({
    id: ++housingIdCounter,
    namaPerumahan: '',
    namaPengembang: '',
    luasLahan: '',
    jenisPerumahan: '',
    koordinat: '',
    jumlahRumahRencana: '',
    kebutuhanJalanAkses: false,
    panjangJalan: '',
    statusLahan: '',
    locationOverride: false,
    photos: [],
    existingPhotos: [],
    location: {
      province: null,
      regency: null,
      district: null,
      village: null
    }
  })
}

const removeHousing = (id) => {
  const index = housingDevelopments.value.findIndex(h => h.id === id)
  if (index > -1) {
    const housing = housingDevelopments.value[index]
    releaseDevelopmentPhotos(housing)
    housingDevelopments.value.splice(index, 1)
    // Clean up location loading state
    delete locationLoading.value[id]
    delete locationMessages.value[id]
    delete locationMessageTypes.value[id]
    delete photoInputRefs.value[id]
  }
}

const formatCoordinateString = (latitude, longitude) => {
  const latValue = Number(latitude)
  const lngValue = Number(longitude)
  const lat = Number.isFinite(latValue) ? latValue.toFixed(6) : ''
  const lng = Number.isFinite(lngValue) ? lngValue.toFixed(6) : ''
  return lat && lng ? `${lat}, ${lng}` : ''
}

const getHousingById = (id) => {
  return housingDevelopments.value.find((item) => item.id === id)
}

const ensureManualOption = (listKey, option) => {
  const optionId = resolveLocationId(option)
  if (!optionId) return null
  const list = manualLocationOptions.value[listKey]
  const existing = list.find((item) => item.id === optionId)
  if (existing) {
    return existing
  }
  const normalized = {
    id: optionId,
    name: option.name || option.label || option.title || option.text || option.nama || 'Tanpa Nama'
  }
  manualLocationOptions.value[listKey] = [...list, normalized]
  return normalized
}

const fetchManualProvinces = async () => {
  manualLocationLoading.value.provinces = true
  try {
    const response = await locationAPI.getProvinces()
    if (response.success && response.data?.provinces) {
      manualLocationOptions.value.provinces = response.data.provinces.map((province) => ({
        id: province.id,
        name: province.name,
        code: province.code
      }))
    }
  } catch (error) {
    console.error('Error fetching provinces:', error)
  } finally {
    manualLocationLoading.value.provinces = false
  }
}

const fetchManualRegencies = async (provinceId) => {
  if (!provinceId) return
  manualLocationLoading.value.regencies = true
  try {
    const response = await locationAPI.getRegencies(provinceId)
    if (response.success && response.data?.regencies) {
      manualLocationOptions.value.regencies = response.data.regencies.map((regency) => ({
        id: regency.id,
        name: regency.name,
        code: regency.code
      }))
    }
  } catch (error) {
    console.error('Error fetching regencies:', error)
  } finally {
    manualLocationLoading.value.regencies = false
  }
}

const fetchManualDistricts = async (regencyId) => {
  if (!regencyId) return
  manualLocationLoading.value.districts = true
  try {
    const response = await locationAPI.getDistricts(regencyId)
    if (response.success && response.data?.districts) {
      manualLocationOptions.value.districts = response.data.districts.map((district) => ({
        id: district.id,
        name: district.name,
        code: district.code
      }))
    }
  } catch (error) {
    console.error('Error fetching districts:', error)
  } finally {
    manualLocationLoading.value.districts = false
  }
}

const fetchManualVillages = async (districtId) => {
  if (!districtId) return
  manualLocationLoading.value.villages = true
  try {
    const response = await locationAPI.getVillages(districtId)
    if (response.success && response.data?.villages) {
      manualLocationOptions.value.villages = response.data.villages.map((village) => ({
        id: village.id,
        name: village.name,
        code: village.code
      }))
    }
  } catch (error) {
    console.error('Error fetching villages:', error)
  } finally {
    manualLocationLoading.value.villages = false
  }
}

const hydrateManualLocation = async (housing) => {
  isManualLocationSync.value = true
  manualLocationError.value = ''
  manualLocationOptions.value.regencies = []
  manualLocationOptions.value.districts = []
  manualLocationOptions.value.villages = []

  await fetchManualProvinces()

  const province = housing?.location?.province
  const regency = housing?.location?.regency
  const district = housing?.location?.district
  const village = housing?.location?.village

  if (province) {
    const normalizedProvince = ensureManualOption('provinces', province)
    manualLocation.value.province = normalizedProvince
    await fetchManualRegencies(resolveLocationId(normalizedProvince))
  } else {
    manualLocation.value.province = null
  }

  if (regency) {
    const normalizedRegency = ensureManualOption('regencies', regency)
    manualLocation.value.regency = normalizedRegency
    await fetchManualDistricts(resolveLocationId(normalizedRegency))
  } else {
    manualLocation.value.regency = null
  }

  if (district) {
    const normalizedDistrict = ensureManualOption('districts', district)
    manualLocation.value.district = normalizedDistrict
    await fetchManualVillages(resolveLocationId(normalizedDistrict))
  } else {
    manualLocation.value.district = null
  }

  if (village) {
    manualLocation.value.village = ensureManualOption('villages', village)
  } else {
    manualLocation.value.village = null
  }

  isManualLocationSync.value = false
}

const openManualLocationDialog = async (housing) => {
  if (!housing) return
  activeHousingId.value = housing.id
  manualLocation.value = {
    province: null,
    regency: null,
    district: null,
    village: null
  }
  await hydrateManualLocation(housing)
  manualLocationDialogOpen.value = true
}

const saveManualLocation = () => {
  const housing = getHousingById(activeHousingId.value)
  if (!housing) {
    manualLocationDialogOpen.value = false
    return
  }

  const { province, regency, district, village } = manualLocation.value
  if (!province || !regency || !district || !village) {
    manualLocationError.value = 'Mohon lengkapi provinsi hingga desa sebelum menyimpan.'
    return
  }

  housing.location = { province, regency, district, village }
  housing.locationOverride = true
  manualLocationDialogOpen.value = false
}

const resetLocationOverride = async (housing) => {
  if (!housing) return
  housing.locationOverride = false
  try {
    await syncLocationForHousing(housing)
    locationMessageTypes.value[housing.id] = 'success'
    locationMessages.value[housing.id] = 'Lokasi kembali disinkronkan otomatis.'
  } catch (error) {
    locationMessageTypes.value[housing.id] = 'error'
    locationMessages.value[housing.id] =
      error?.message || 'Gagal menyinkronkan ulang lokasi otomatis.'
  }
}

watch(
  () => manualLocation.value.province,
  async (province) => {
    if (isManualLocationSync.value) return
    manualLocationError.value = ''
    manualLocation.value.regency = null
    manualLocation.value.district = null
    manualLocation.value.village = null
    manualLocationOptions.value.regencies = []
    manualLocationOptions.value.districts = []
    manualLocationOptions.value.villages = []
    const provinceId = resolveLocationId(province)
    if (provinceId) {
      await fetchManualRegencies(provinceId)
    }
  }
)

watch(
  () => manualLocation.value.regency,
  async (regency) => {
    if (isManualLocationSync.value) return
    manualLocationError.value = ''
    manualLocation.value.district = null
    manualLocation.value.village = null
    manualLocationOptions.value.districts = []
    manualLocationOptions.value.villages = []
    const regencyId = resolveLocationId(regency)
    if (regencyId) {
      await fetchManualDistricts(regencyId)
    }
  }
)

watch(
  () => manualLocation.value.district,
  async (district) => {
    if (isManualLocationSync.value) return
    manualLocationError.value = ''
    manualLocation.value.village = null
    manualLocationOptions.value.villages = []
    const districtId = resolveLocationId(district)
    if (districtId) {
      await fetchManualVillages(districtId)
    }
  }
)

const openLocationPicker = (housing) => {
  if (!housing) return
  activeHousingId.value = housing.id
  locationMessages.value[housing.id] = ''
  locationMessageTypes.value[housing.id] = 'info'

  const coords = parseCoordinates(housing.koordinat)
  if (Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude)) {
    locationPickerLat.value = coords.latitude
    locationPickerLng.value = coords.longitude
    locationPickerOpen.value = true
    return
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    locationMessageTypes.value[housing.id] = 'error'
    locationMessages.value[housing.id] = 'Browser Anda tidak mendukung fitur geolokasi.'
    locationPickerLat.value = null
    locationPickerLng.value = null
    locationPickerOpen.value = true
    return
  }

  locationLoading.value[housing.id] = true
  navigator.geolocation.getCurrentPosition(
    ({ coords: position }) => {
      locationPickerLat.value = position.latitude
      locationPickerLng.value = position.longitude
      locationPickerOpen.value = true
      locationLoading.value[housing.id] = false
    },
    (error) => {
      locationLoading.value[housing.id] = false
      locationMessageTypes.value[housing.id] = 'error'

      let errorMessage = 'Gagal mengambil lokasi saat ini.'
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Izin lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser Anda.'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Informasi lokasi tidak tersedia. Silakan geser pin secara manual.'
          break
        case error.TIMEOUT:
          errorMessage = 'Waktu permintaan lokasi habis. Silakan coba lagi.'
          break
        default:
          errorMessage = 'Terjadi kesalahan saat mengambil lokasi.'
          break
      }

      locationMessages.value[housing.id] = errorMessage
      locationPickerLat.value = null
      locationPickerLng.value = null
      locationPickerOpen.value = true
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

const handleLocationPicked = async ({ latitude, longitude }) => {
  const housing = getHousingById(activeHousingId.value)
  if (!housing) return

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    locationMessageTypes.value[housing.id] = 'error'
    locationMessages.value[housing.id] = 'Koordinat tidak valid. Silakan pilih ulang di peta.'
    return
  }

  housing.koordinat = formatCoordinateString(latitude, longitude)
  locationLoading.value[housing.id] = true

  try {
    const locationResult = await reverseGeocode(latitude, longitude, housing.id)
    applyLocationToHousing(housing, locationResult)
    locationMessageTypes.value[housing.id] = 'success'
    locationMessages.value[housing.id] = 'Lokasi berhasil disinkronkan dari peta.'
  } catch (error) {
    console.error('Location sync error:', error)
    locationMessageTypes.value[housing.id] = 'error'
    locationMessages.value[housing.id] =
      error?.message || 'Gagal menyinkronkan lokasi berdasarkan titik peta.'
  } finally {
    locationLoading.value[housing.id] = false
  }
}

const applyLocationToHousing = (housing, locationResult) => {
  housing.location = {
    province: locationResult?.province || null,
    regency: locationResult?.regency || null,
    district: locationResult?.district || null,
    village: locationResult?.village || null
  }
  housing.locationOverride = false
}

const reverseGeocode = async (latitude, longitude, housingId) => {
  try {
    const response = await locationAPI.reverseGeocode(latitude, longitude)
    if (response.success && response.data) {
      const mapped = mapReverseGeocodeResponse(response.data)
      if (!mapped?.province?.id) {
        locationMessageTypes.value[housingId] = 'error'
        locationMessages.value[housingId] = 'Data lokasi tidak lengkap. Silakan pilih lokasi secara manual.'
        throw new Error('Data lokasi tidak lengkap.')
      }
      return mapped
    }

    if (response?.code === 'OUTSIDE_BOUNDARY') {
      locationMessageTypes.value[housingId] = 'error'
      locationMessages.value[housingId] = 'Lokasi di luar wilayah kerja.'
      throw new Error('Lokasi di luar wilayah kerja.')
    }

    locationMessageTypes.value[housingId] = 'error'
    locationMessages.value[housingId] =
      response?.message || 'Lokasi tidak ditemukan. Silakan pilih lokasi secara manual.'
    throw new Error(response?.message || 'Reverse geocode gagal.')
  } catch (error) {
    if (error?.code === 'OUTSIDE_BOUNDARY') {
      locationMessageTypes.value[housingId] = 'error'
      locationMessages.value[housingId] = 'Lokasi di luar wilayah kerja.'
    }
    if (!locationMessages.value[housingId]) {
      locationMessageTypes.value[housingId] = 'error'
      locationMessages.value[housingId] =
        error?.message || 'Lokasi tidak ditemukan. Silakan pilih lokasi secara manual.'
    }
    throw error
  }
}

const syncLocationForHousing = async (housing) => {
  const coords = parseCoordinates(housing.koordinat)
  if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
    locationMessageTypes.value[housing.id] = 'error'
    locationMessages.value[housing.id] = 'Koordinat tidak valid. Pastikan format: "lat, lng".'
    throw new Error('Koordinat tidak valid.')
  }
  const locationResult = await reverseGeocode(coords.latitude, coords.longitude, housing.id)
  if (housing.locationOverride) {
    const mismatch = (expected, actual) => {
      const expectedId = resolveLocationId(expected)
      const actualId = resolveLocationId(actual)
      return expectedId && actualId && expectedId !== actualId
    }

    if (
      mismatch(housing.location?.village, locationResult.village) ||
      mismatch(housing.location?.district, locationResult.district) ||
      mismatch(housing.location?.regency, locationResult.regency) ||
      mismatch(housing.location?.province, locationResult.province)
    ) {
      locationMessageTypes.value[housing.id] = 'error'
      locationMessages.value[housing.id] = 'Lokasi manual tidak sesuai dengan koordinat yang dipilih.'
      throw new Error('Lokasi manual tidak sesuai dengan koordinat yang dipilih.')
    }
    return
  }
  applyLocationToHousing(housing, locationResult)
}

const formatHousingTypeLabel = (value) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('sederhana')) return 'Sederhana'
  if (normalized.includes('menengah')) return 'Menengah'
  if (normalized.includes('mewah')) return 'Mewah'
  if (normalized.includes('campuran')) return 'Campuran'
  return ''
}

const mapHousingType = (value) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('sederhana')) return 'sederhana'
  if (normalized.includes('menengah')) return 'menengah'
  if (normalized.includes('mewah')) return 'mewah'
  return 'campuran'
}

const generateLocalId = () => {
  return `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const calculateTotalUnits = (developments) => {
  return developments.reduce((total, dev) => {
    return total + (parseInt(dev.jumlahRumahRencana) || 0)
  }, 0)
}

const parseCoordinates = (raw) => {
  if (!raw) {
    return { latitude: null, longitude: null }
  }
  const parts = String(raw).split(',').map((part) => part.trim())
  if (parts.length < 2) {
    return { latitude: null, longitude: null }
  }

  const latitude = parseFloat(parts[0])
  const longitude = parseFloat(parts[1])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { latitude: null, longitude: null }
  }

  return { latitude, longitude }
}

const buildDevelopmentPayload = (development) => {
  const coords = parseCoordinates(development.koordinat)
  const location = development.location || {}
  const now = new Date().toISOString()
  return {
    developmentName: development.namaPerumahan,
    developerName: development.namaPengembang || null,
    landArea: parseFloat(development.luasLahan) || 0,
    housingType: mapHousingType(development.jenisPerumahan),
    plannedUnitCount: parseInt(development.jumlahRumahRencana) || 0,
    latitude: coords.latitude,
    longitude: coords.longitude,
    hasRoadAccess: Boolean(development.kebutuhanJalanAkses),
    roadLengthMeters: development.kebutuhanJalanAkses
      ? parseFloat(development.panjangJalan) || 0
      : null,
    landStatus: development.kebutuhanJalanAkses ? development.statusLahan : null,
    villageId: resolveLocationId(location.village),
    districtId: resolveLocationId(location.district),
    regencyId: resolveLocationId(location.regency),
    provinceId: resolveLocationId(location.province),
    notes: null,
    status: 'submitted',
    submittedAt: now
  }
}

const appendDevelopmentPhotos = (formPayload, photos) => {
  if (!formPayload || !Array.isArray(photos)) return
  photos.forEach((photo) => {
    if (photo?.file instanceof File) {
      formPayload.append('developmentPhotos', photo.file, photo.file.name)
    }
  })
}

const buildDevelopmentRequest = (development) => {
  const payload = buildDevelopmentPayload(development)
  const photos = development?.photos || []
  const hasPhotos = photos.some((photo) => photo?.file instanceof File)
  if (!hasPhotos) {
    return payload
  }
  const formPayload = new FormData()
  formPayload.append('payload', JSON.stringify(payload))
  appendDevelopmentPhotos(formPayload, photos)
  return formPayload
}

const loadDevelopmentForEdit = async () => {
  if (!editDevelopmentId.value) return

  try {
    const response = await housingDevelopmentAPI.getDevelopment(editDevelopmentId.value)
    const development = response?.data?.development

    if (!development) {
      throw new Error('Data perumahan tidak ditemukan.')
    }

    housingIdCounter = 0
    housingDevelopments.value = [
      {
        id: ++housingIdCounter,
        namaPerumahan: development.developmentName || '',
        namaPengembang: development.developerName || '',
        luasLahan: development.landArea ?? '',
        jenisPerumahan: formatHousingTypeLabel(development.housingType),
        koordinat: formatCoordinateString(development.latitude, development.longitude),
        jumlahRumahRencana: development.plannedUnitCount ?? '',
        kebutuhanJalanAkses: Boolean(development.hasRoadAccess),
        panjangJalan: development.roadLengthMeters ?? '',
        statusLahan: development.landStatus || '',
        locationOverride: false,
        photos: [],
        existingPhotos: mapExistingDevelopmentPhotos(development.photos),
        location: {
          province: development.province || null,
          regency: development.regency || null,
          district: development.district || null,
          village: development.village || null
        }
      }
    ]
  } catch (error) {
    console.error('Error loading housing development for edit:', error)
    showSnackbar(error?.message || 'Gagal memuat data perumahan untuk diedit.', 'error')
  }
}

const buildLocalSubmission = (apiResponse) => {
  const now = new Date().toISOString()
  const firstHousing = housingDevelopments.value[0]
  const totalUnits = calculateTotalUnits(housingDevelopments.value)

  return {
    id: apiResponse?.data?.development?.id || generateLocalId(),
    status: 'submitted',
    developmentName: firstHousing?.namaPerumahan || '',
    developerName: firstHousing?.namaPengembang || '',
    housingType: firstHousing?.jenisPerumahan || '',
    totalUnits,
    submittedAt: now,
    reviewedAt: null,
    reviewer: null,
    housingDevelopments: housingDevelopments.value.map(dev => ({
      namaPerumahan: dev.namaPerumahan,
      namaPengembang: dev.namaPengembang,
      luasLahan: parseFloat(dev.luasLahan) || 0,
      jenisPerumahan: dev.jenisPerumahan,
      koordinat: dev.koordinat,
      jumlahRumahRencana: parseInt(dev.jumlahRumahRencana) || 0,
      kebutuhanJalanAkses: dev.kebutuhanJalanAkses || false,
      panjangJalan: dev.kebutuhanJalanAkses ? (parseFloat(dev.panjangJalan) || 0) : null,
      statusLahan: dev.kebutuhanJalanAkses ? dev.statusLahan : null
    }))
  }
}

const saveLocalSubmission = (submissionData) => {
  try {
    const existingData = localStorage.getItem('housing-development-submissions')
    let submissions = []
    
    if (existingData) {
      try {
        submissions = JSON.parse(existingData)
      } catch (error) {
        console.error('Error parsing existing submissions:', error)
        submissions = []
      }
    }

    submissions.push(submissionData)
    localStorage.setItem('housing-development-submissions', JSON.stringify(submissions))
  } catch (error) {
    console.error('Failed to cache housing development submission locally:', error)
  }
}

const submitForm = async () => {
  if (housingDevelopments.value.length === 0) {
    showSnackbar('Silakan tambahkan minimal 1 perumahan', 'warning')
    return
  }

  if (isEditMode.value && housingDevelopments.value.length !== 1) {
    showSnackbar('Edit perumahan hanya mendukung 1 data perumahan.', 'warning')
    return
  }

  // Validate required fields
  const hasEmptyFields = housingDevelopments.value.some(dev => {
    return !dev.namaPerumahan || !dev.namaPengembang || !dev.luasLahan || 
           !dev.jenisPerumahan || !dev.koordinat || !dev.jumlahRumahRencana
  })

  if (hasEmptyFields) {
    showSnackbar('Mohon lengkapi semua field yang wajib diisi untuk setiap perumahan', 'warning')
    return
  }

  isSubmitting.value = true
  try {
    const targetDevelopments = isEditMode.value
      ? [housingDevelopments.value[0]]
      : housingDevelopments.value

    for (const housing of targetDevelopments) {
      await syncLocationForHousing(housing)
    }

    if (isEditMode.value) {
      const requestPayload = buildDevelopmentRequest(targetDevelopments[0])
      const response = await housingDevelopmentAPI.updateDevelopment(editDevelopmentId.value, requestPayload)
      if (response?.success === false) {
        throw new Error(response.message || 'Gagal menyimpan perubahan perumahan.')
      }
      showSnackbar('Perubahan perumahan berhasil disimpan!', 'success')
    } else {
      let firstResponse = null
      for (const housing of housingDevelopments.value) {
        const requestPayload = buildDevelopmentRequest(housing)
        const response = await housingDevelopmentAPI.createDevelopment(requestPayload)
        if (response?.success === false) {
          throw new Error(response.message || 'Gagal mengirim data perumahan.')
        }
        if (!firstResponse) {
          firstResponse = response
        }
      }

      saveLocalSubmission(buildLocalSubmission(firstResponse))
      showSnackbar('Formulir survey perumahan berhasil dikirim!', 'success')
      resetForm()
    }

    mapDataStore.signalRefresh()
    await new Promise((resolve) => setTimeout(resolve, SUCCESS_REDIRECT_DELAY_MS))
    router.push('/housing-development-data')
  } catch (error) {
    console.error('Error submitting form:', error)
    showSnackbar(error?.message || 'Terjadi kesalahan saat submit form', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  housingDevelopments.value.forEach((housing) => {
    releaseDevelopmentPhotos(housing)
  })
  housingDevelopments.value = []
  housingIdCounter = 0
  locationLoading.value = {}
  locationMessages.value = {}
  locationMessageTypes.value = {}
  locationPickerOpen.value = false
  locationPickerLat.value = null
  locationPickerLng.value = null
  activeHousingId.value = null
  manualLocationDialogOpen.value = false
  manualLocationError.value = ''
  manualLocation.value = {
    province: null,
    regency: null,
    district: null,
    village: null
  }
  manualLocationOptions.value = {
    provinces: [],
    regencies: [],
    districts: [],
    villages: []
  }
  manualLocationLoading.value = {
    provinces: false,
    regencies: false,
    districts: false,
    villages: false
  }
  isManualLocationSync.value = false
  photoInputRefs.value = {}
  formRef.value?.resetValidation()
}

onMounted(async () => {
  if (isEditMode.value) {
    await loadDevelopmentForEdit()
  }
})
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}

.form-card {
  width: 100%;
}

.development-photo-card {
  width: 160px;
}

.development-photo-card :deep(.v-img) {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.file-input-hidden {
  display: none;
}

@media (max-width: 600px) {
  .form-card :deep(.v-card-title) {
    font-size: 1.1rem;
    text-align: left;
  }

  .form-card :deep(.v-card-text) {
    padding: 16px !important;
  }
}
</style>
