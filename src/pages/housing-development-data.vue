<template>
  <div>
    <!-- Loading Overlay -->
    <v-overlay
      :model-value="isLoading"
      class="align-center justify-center"
    >
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      />
    </v-overlay>

    <v-container fluid>
      <!-- Header Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon
                class="mr-3"
                color="primary"
              >
                mdi-home-group
              </v-icon>
              <div>
                <h2 class="text-h5">
                  Data Survei Perumahan Oleh Pengembang
                </h2>
                <p class="text-subtitle-1 text-medium-emphasis mb-0">
                  Kelola dan tinjau formulir survei perumahan oleh pengembang yang telah diajukan
                </p>
              </div>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>

      <!-- Location Filters Info -->
      <v-row 
        v-if="currentLocationFilters.length > 0"
        class="mb-4"
      >
        <v-col cols="12">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-0"
          >
            <template #prepend>
              <v-icon>mdi-map-marker</v-icon>
            </template>
            <div class="d-flex align-center">
              <span class="mr-2">Data difilter berdasarkan lokasi:</span>
              <v-progress-circular
                v-if="locationFiltersLoading"
                indeterminate
                size="16"
                width="2"
                class="mr-2"
              />
              <v-chip
                v-for="filter in currentLocationFilters"
                :key="filter"
                size="small"
                color="primary"
                variant="outlined"
                class="mr-1"
              >
                {{ filter }}
              </v-chip>
              <span
                v-if="!locationFiltersLoading && currentLocationFilters.length === 0"
                class="text-caption text-medium-emphasis"
              >
                Tidak ada filter lokasi
              </span>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Statistics Cards (Expandable) -->
      <v-row 
        v-if="Object.keys(submissionCounts).length > 0"
        class="mb-6"
      >
        <v-col cols="12">
          <v-expansion-panels v-model="expandedStatistics">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <span class="text-h6">Statistik</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col
                    v-for="(count, status) in submissionCounts"
                    :key="status"
                    cols="12"
                    sm="6"
                    md="3"
                  >
                    <v-card
                      :color="getStatusColor(status)"
                      variant="tonal"
                      class="text-center"
                    >
                      <v-card-text>
                        <v-icon
                          :color="getStatusColor(status)"
                          size="48"
                          class="mb-2"
                        >
                          {{ getStatusIcon(status) }}
                        </v-icon>
                        <div class="text-h4 font-weight-bold">
                          {{ count }}
                        </div>
                        <div class="text-subtitle-1 text-capitalize">
                          {{ getStatusLabel(status) }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>

      <!-- Filters and Actions -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              Filter & Pencarian
              <v-spacer />
              <v-btn
                icon
                variant="text"
                size="small"
                @click="showAllFilters = !showAllFilters"
              >
                <v-icon>
                  {{ showAllFilters ? 'mdi-filter-remove' : 'mdi-filter' }}
                </v-icon>
                <v-tooltip
                  activator="parent"
                  location="top"
                >
                  {{ showAllFilters ? 'Sembunyikan Filter' : 'Tampilkan Semua Filter' }}
                </v-tooltip>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <!-- Search Form (Always Visible) -->
              <v-row>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-text-field
                    v-model="searchQuery"
                    label="Cari Nama Perumahan"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    clearable
                    @input="debouncedSearch"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-btn
                    color="primary"
                    variant="outlined"
                    :loading="isLoading"
                    class="mr-2"
                    @click="refreshData"
                  >
                    <v-icon start>
                      mdi-refresh
                    </v-icon>
                    Muat Ulang
                  </v-btn>
                  <v-btn
                    v-if="hasActiveFilters"
                    color="secondary"
                    variant="outlined"
                    @click="clearFilters"
                  >
                    <v-icon start>
                      mdi-filter-off
                    </v-icon>
                    Hapus
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Additional Filters (Expandable) -->
              <v-expand-transition>
                <div v-show="showAllFilters">
                  <v-divider class="my-4" />
                  <v-row>
                    <v-col
                      cols="12"
                      md="3"
                    >
                      <v-select
                        v-model="filterLocation.province"
                        label="Provinsi"
                        :items="filterProvinceOptions"
                        :loading="filterLocationLoading.provinces"
                        item-title="name"
                        item-value="id"
                        return-object
                        clearable
                        variant="outlined"
                        density="compact"
                        @update:model-value="handleFilterLocationChange"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="3"
                    >
                      <v-select
                        v-model="filterLocation.regency"
                        label="Kabupaten / Kota"
                        :items="filterRegencyOptions"
                        :loading="filterLocationLoading.regencies"
                        :disabled="!filterLocation.province"
                        item-title="name"
                        item-value="id"
                        return-object
                        clearable
                        variant="outlined"
                        density="compact"
                        @update:model-value="handleFilterLocationChange"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="3"
                    >
                      <v-select
                        v-model="filterLocation.district"
                        label="Kecamatan"
                        :items="filterDistrictOptions"
                        :loading="filterLocationLoading.districts"
                        :disabled="!filterLocation.regency"
                        item-title="name"
                        item-value="id"
                        return-object
                        clearable
                        variant="outlined"
                        density="compact"
                        @update:model-value="handleFilterLocationChange"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="3"
                    >
                      <v-select
                        v-model="filterLocation.village"
                        label="Kelurahan"
                        :items="filterVillageOptions"
                        :loading="filterLocationLoading.villages"
                        :disabled="!filterLocation.district"
                        item-title="name"
                        item-value="id"
                        return-object
                        clearable
                        variant="outlined"
                        density="compact"
                        @update:model-value="handleFilterLocationChange"
                      />
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>

              <!-- Action Buttons Row -->
              <v-row>
                <v-col cols="12">
                  <div class="d-flex align-center justify-end">
                    <v-btn
                      v-if="canCreateDevelopment"
                      color="primary"
                      to="/housing-development-form"
                      prepend-icon="mdi-plus"
                    >
                      Form Baru
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Submissions Table -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex flex-wrap align-center">
              <v-icon class="mr-2">
                mdi-table
              </v-icon>
              Survei
              <v-spacer />
              <div class="d-flex flex-wrap align-center gap-2">
                <v-btn
                  v-if="canExportDevelopment"
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-file-excel"
                  @click="openExportDialog"
                >
                  Ekspor Excel
                </v-btn>
                <v-chip
                  color="primary"
                  variant="tonal"
                >
                  {{ pagination.totalItems }} Total
                </v-chip>
              </div>
            </v-card-title>

            <v-data-table-server
              :headers="headers"
              :items="submissions"
              :loading="isLoading"
              :items-per-page="pagination.itemsPerPage"
              :items-per-page-options="itemsPerPageOptions"
              :page="pagination.currentPage"
              :items-length="pagination.totalItems"
              class="elevation-0"
              @update:page="handlePageChange"
              @update:items-per-page="handleItemsPerPageChange"
            >
              <!-- Status Column -->
              <template #item.status="{ item }">
                <v-chip
                  :color="getStatusColor(resolveItemStatus(item))"
                  variant="tonal"
                  size="small"
                >
                  <v-icon
                    :icon="getStatusIcon(resolveItemStatus(item))"
                    start
                    size="small"
                  />
                  {{ getStatusLabel(resolveItemStatus(item)) }}
                </v-chip>
              </template>

              <!-- Development Name Column -->
              <template #item.developmentName="{ item }">
                <div>
                  <div class="font-weight-medium">
                    {{ item.developmentName || 'N/A' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.developerName || 'N/A' }}
                  </div>
                </div>
              </template>

              <!-- Housing Type Column -->
              <template #item.housingType="{ item }">
                <v-chip
                  size="small"
                  variant="outlined"
                >
                  {{ item.housingType || 'N/A' }}
                </v-chip>
              </template>

              <!-- Total Units Column -->
              <template #item.totalUnits="{ item }">
                <div class="text-body-2">
                  {{ item.totalUnits || 'N/A' }} Unit
                </div>
              </template>

              <!-- Submitted Date Column -->
              <template #item.submittedAt="{ item }">
                <div>
                  <div class="text-body-2">
                    {{ formatDate(item.submittedAt) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(item.submittedAt) }}
                  </div>
                </div>
              </template>

              <!-- Reviewer Column -->
              <template #item.reviewer="{ item }">
                <div v-if="item.reviewer">
                  <div class="text-body-2">
                    {{ item.reviewer.fullName || 'N/A' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDate(item.reviewedAt) }}
                  </div>
                </div>
                <div
                  v-else
                  class="text-caption text-medium-emphasis"
                >
                  Belum ditinjau
                </div>
              </template>

              <!-- Actions Column -->
              <template #item.actions="{ item }">
                <div class="d-flex align-center">
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    color="primary"
                    @click="viewSubmission(item)"
                  >
                    <v-icon>mdi-eye</v-icon>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      Tinjau Detail
                    </v-tooltip>
                  </v-btn>

                  <v-btn
                    v-if="canEditSubmission(item)"
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                    @click="goToEditForm(item)"
                  >
                    <v-icon>mdi-pencil</v-icon>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      Edit Data
                    </v-tooltip>
                  </v-btn>
                  
                  <v-btn
                    v-if="canReviewSubmission(item) && canApproveStatus(item)"
                    icon="mdi-check-circle"
                    size="small"
                    variant="text"
                    color="success"
                    @click="reviewSubmission(item, 'approved')"
                  >
                    <v-icon>mdi-check-circle</v-icon>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      Setujui
                    </v-tooltip>
                  </v-btn>

                  <v-btn
                    v-if="canReviewSubmission(item) && canRejectStatus(item)"
                    icon="mdi-close-circle"
                    size="small"
                    variant="text"
                    color="error"
                    @click="reviewSubmission(item, 'rejected')"
                  >
                    <v-icon>mdi-close-circle</v-icon>
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      Tolak
                    </v-tooltip>
                  </v-btn>
                </div>
              </template>

              <!-- Empty State -->
              <template #no-data>
                <div class="text-center py-8">
                  <v-icon
                    size="64"
                    color="grey-lighten-1"
                    class="mb-4"
                  >
                    mdi-home-group-remove-outline
                  </v-icon>
                  <h3 class="text-h6 text-medium-emphasis mb-2">
                    Tidak Ada Data Perumahan Ditemukan
                  </h3>
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    Tidak ada pengajuan survei perumahan yang sesuai dengan filter Anda.
                  </p>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    @click="clearFilters"
                  >
                    Hapus Filter
                  </v-btn>
                </div>
              </template>
            </v-data-table-server>
          </v-card>
        </v-col>
      </v-row>

      <!-- Export Dialog -->
      <v-dialog
        v-model="exportDialogOpen"
        max-width="760"
      >
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">
              mdi-file-excel
            </v-icon>
            Ekspor Excel
            <v-spacer />
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="exportDialogOpen = false"
            />
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="exportError"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="exportError = ''"
            >
              {{ exportError }}
            </v-alert>

            <div class="text-subtitle-2 mb-2">
              Cakupan Data
            </div>
            <v-radio-group v-model="exportScope">
              <v-radio
                label="Semua Data"
                value="all"
              />
              <v-radio
                label="Data yang Difilter"
                value="filtered"
              />
            </v-radio-group>

            <v-divider class="my-4" />

            <div class="text-subtitle-2 mb-2">
              Kategori Kolom (Perumahan)
            </div>
            <v-checkbox
              v-model="exportAllCategories"
              label="Semua Kategori"
              hide-details
            />
            <v-row>
              <v-col
                v-for="category in housingDevelopmentExportCategories"
                :key="category.id"
                cols="12"
                sm="6"
                md="4"
              >
                <v-checkbox
                  v-model="exportCategoryIds"
                  :value="category.id"
                  :label="category.label"
                  hide-details
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              variant="outlined"
              @click="exportDialogOpen = false"
            >
              Batal
            </v-btn>
            <v-btn
              color="primary"
              :loading="exportLoading"
              @click="handleExport"
            >
              Ekspor
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Submission Detail Dialog -->
      <v-dialog
        v-model="showDetailDialog"
        max-width="1200"
        scrollable
      >
        <v-card v-if="selectedSubmission">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">
              mdi-file-document-outline
            </v-icon>
            Detail Survei Perumahan
            <v-spacer />
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="showDetailDialog = false"
            />
          </v-card-title>

          <v-card-text>
            <div
              v-if="selectedSubmission.housingDevelopments && selectedSubmission.housingDevelopments.length > 0"
              class="mt-4"
            >
              <v-card
                v-for="(housing, index) in selectedSubmission.housingDevelopments"
                :key="index"
                variant="outlined"
                class="mb-4"
              >
                <v-card-title class="text-subtitle-1">
                  Perumahan #{{ index + 1 }}
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Nama Perumahan</v-list-item-title>
                          <v-list-item-subtitle>{{ housing.namaPerumahan || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Nama Pengembang</v-list-item-title>
                          <v-list-item-subtitle>{{ housing.namaPengembang || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Luas Lahan</v-list-item-title>
                          <v-list-item-subtitle>{{ housing.luasLahan || 'N/A' }} m²</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Jenis Perumahan</v-list-item-title>
                          <v-list-item-subtitle>{{ housing.jenisPerumahan || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title>Koordinat</v-list-item-title>
                          <v-list-item-subtitle>{{ housing.koordinat || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Jumlah Rumah Rencana</v-list-item-title>
                          <v-list-item-subtitle>{{ housing.jumlahRumahRencana || 'N/A' }} Unit</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                          <v-list-item-title>Kebutuhan Jalan Akses</v-list-item-title>
                          <v-list-item-subtitle>{{ housing.kebutuhanJalanAkses ? 'Ada' : 'Tidak Ada' }}</v-list-item-subtitle>
                        </v-list-item>
                        <template v-if="housing.kebutuhanJalanAkses">
                          <v-list-item>
                            <v-list-item-title>Panjang Jalan</v-list-item-title>
                            <v-list-item-subtitle>{{ housing.panjangJalan || 'N/A' }} m</v-list-item-subtitle>
                          </v-list-item>
                          <v-list-item>
                            <v-list-item-title>Status Lahan</v-list-item-title>
                            <v-list-item-subtitle>{{ housing.statusLahan || 'N/A' }}</v-list-item-subtitle>
                          </v-list-item>
                        </template>
                      </v-list>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </div>
            <div
              v-else
              class="text-center py-8"
            >
              <p class="text-body-1 text-medium-emphasis">
                Tidak ada data perumahan tersedia
              </p>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              v-if="canReviewSubmission(selectedSubmission) && canApproveStatus(selectedSubmission)"
              color="success"
              variant="elevated"
              @click="reviewSubmission(selectedSubmission, 'approved')"
            >
              Setujui
            </v-btn>
            <v-btn
              v-if="canReviewSubmission(selectedSubmission) && canRejectStatus(selectedSubmission)"
              color="error"
              variant="outlined"
              @click="reviewSubmission(selectedSubmission, 'rejected')"
            >
              Tolak
            </v-btn>
            <v-btn
              color="primary"
              variant="outlined"
              @click="showDetailDialog = false"
            >
              Tutup
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Review Dialog -->
      <v-dialog
        v-model="showReviewDialog"
        max-width="600"
      >
        <v-card>
          <v-card-title>
            Tinjau Pengajuan
          </v-card-title>
          
          <v-card-text>
            <v-form
              ref="reviewFormRef"
              v-model="reviewFormValid"
            >
              <v-alert
                v-if="reviewData.status === 'rejected'"
                type="warning"
                variant="tonal"
                class="mb-4"
              >
                Alasan penolakan wajib diisi agar pengajuan dapat ditindaklanjuti.
              </v-alert>
              <v-select
                v-if="reviewData.status !== 'rejected'"
                v-model="reviewData.status"
                label="Status Tinjauan"
                :items="reviewStatusOptions"
                :rules="[rules.required]"
                variant="outlined"
              />
              
              <v-textarea
                v-model="reviewData.reviewNotes"
                label="Catatan Tinjauan"
                placeholder="Tambahkan komentar tinjauan Anda..."
                variant="outlined"
                rows="4"
                :rules="reviewNotesRules"
              />
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="secondary"
              variant="outlined"
              @click="showReviewDialog = false"
            >
              Batal
            </v-btn>
            <v-btn
              color="primary"
              :disabled="!reviewFormValid"
              :loading="isLoading"
              @click="submitReview"
            >
              Kirim Tinjauan
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { definePage } from 'unplugin-vue-router/runtime'
import { useRouter } from 'vue-router'
import { exportAPI, housingDevelopmentAPI, locationAPI } from '@/services'
import { useAppStore } from '@/stores/app'
import { useMapDataStore } from '@/stores/mapData'
import {
  buildMetaRows,
  exportToExcel,
  getColumnsForCategories,
  getExportCategories
} from '@/utils/exportUtils'
import { debounce } from 'lodash-es'

definePage({
  meta: {
    layout: 'dashboard'
  }
})

const appStore = useAppStore()
const mapStore = useMapDataStore()
const router = useRouter()

// Reactive state
const isLoading = ref(false)
const searchQuery = ref('')
const showDetailDialog = ref(false)
const showReviewDialog = ref(false)
const selectedSubmission = ref(null)
const reviewFormValid = ref(false)
const reviewFormRef = ref(null)
const submissions = ref([])
const expandedStatistics = ref([]) // For expansion panel (empty = collapsed)
const showAllFilters = ref(false) // For showing/hiding additional filters
const exportDialogOpen = ref(false)
const exportScope = ref('all')
const exportLoading = ref(false)
const exportError = ref('')
const housingDevelopmentExportCategories = getExportCategories('housing-development')
const exportCategoryIds = ref(housingDevelopmentExportCategories.map((category) => category.id))
const exportAllCategories = computed({
  get: () => exportCategoryIds.value.length === housingDevelopmentExportCategories.length,
  set: (value) => {
    exportCategoryIds.value = value
      ? housingDevelopmentExportCategories.map((category) => category.id)
      : []
  }
})

// Filter location state
const filterLocation = ref({
  province: null,
  regency: null,
  district: null,
  village: null
})

const filterProvinceOptions = ref([])
const filterRegencyOptions = ref([])
const filterDistrictOptions = ref([])
const filterVillageOptions = ref([])

const filterLocationLoading = reactive({
  provinces: false,
  regencies: false,
  districts: false,
  villages: false
})

// Review form data
const reviewData = ref({
  status: '',
  reviewNotes: ''
})
const statistics = ref(null)
const statisticsLoading = ref(false)
const statisticsCacheKey = ref('')

// Pagination
const pagination = ref({
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 20,
  hasNextPage: false,
  hasPrevPage: false
})

// Filters
const filters = ref({
  status: null
})

// Table headers
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '120px' },
  { title: 'Status', key: 'status', sortable: false, width: '120px' },
  { title: 'Nama Perumahan', key: 'developmentName', sortable: false, width: '250px' },
  { title: 'Jenis Perumahan', key: 'housingType', sortable: false, width: '150px' },
  { title: 'Total Unit', key: 'totalUnits', sortable: false, width: '120px' },
  { title: 'Tanggal Diajukan', key: 'submittedAt', sortable: false, width: '150px' },
  { title: 'Peninjau', key: 'reviewer', sortable: false, width: '150px' },
  { title: 'Aksi', key: 'actions', sortable: false, width: '120px' }
]
const itemsPerPageOptions = [10, 20, 50, 100]

// Computed properties
const resolveStatus = (status, verificationStatus = null) => {
  const normalizedStatus = String(status || '').toLowerCase()
  const normalizedVerification = String(verificationStatus || '').toLowerCase()

  if (!normalizedStatus && normalizedVerification === 'pending') return 'submitted'
  if (normalizedStatus === 'draft' && normalizedVerification === 'pending') return 'submitted'
  if (normalizedStatus === 'pending') return 'submitted'
  if (normalizedVerification === 'rejected') return 'rejected'
  if (normalizedVerification === 'verified' || normalizedStatus === 'approved') {
    return 'approved'
  }
  if (['verified', 'reviewed', 'under_review'].includes(normalizedStatus)) {
    return 'under_review'
  }
  return normalizedStatus || 'draft'
}

const resolveItemStatus = (item) =>
  resolveStatus(item?.status, item?.verificationStatus)

const submissionCounts = computed(() => {
  const rawCounts = statistics.value?.statusBreakdown || {}
  const counts = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0
  }
  if (Object.keys(rawCounts).length) {
    Object.entries(rawCounts).forEach(([status, count]) => {
      const normalized = resolveStatus(status)
      counts[normalized] = (counts[normalized] || 0) + Number(count || 0)
    })
  } else {
    submissions.value.forEach(submission => {
      const status = resolveItemStatus(submission)
      counts[status] = (counts[status] || 0) + 1
    })
  }
  return counts
})

const canExportDevelopment = computed(() =>
  appStore.hasPermission('export_development')
)
const canCreateDevelopment = computed(() =>
  !appStore.isVerifikator && appStore.hasPermission('housing_development:create')
)

const canReview = computed(() =>
  appStore.hasAnyRole(['verifikator', 'super_admin'])
  || appStore.hasAnyPermission(['housing_development:verify', 'housing_development:approve'])
)

const isWithinScope = (item) => {
  if (appStore.isSuperAdmin || appStore.isVerifikator || canReview.value) {
    return true
  }
  const location = {
    villageId: item?.village?.id || item?.villageId,
    districtId: item?.district?.id || item?.districtId,
    regencyId: item?.regency?.id || item?.regencyId,
    provinceId: item?.province?.id || item?.provinceId
  }

  if (appStore.user?.assignedVillageId) {
    return location.villageId === appStore.user.assignedVillageId
  }
  if (appStore.user?.assignedDistrictId) {
    return location.districtId === appStore.user.assignedDistrictId
  }
  if (appStore.user?.assignedRegencyId) {
    return location.regencyId === appStore.user.assignedRegencyId
  }
  if (appStore.user?.assignedProvinceId) {
    return location.provinceId === appStore.user.assignedProvinceId
  }
  return true
}

const canReviewSubmission = (item) => canReview.value && isWithinScope(item)
const canApproveStatus = (item) => ['submitted', 'under_review'].includes(resolveItemStatus(item))
const canRejectStatus = (item) => ['submitted', 'under_review'].includes(resolveItemStatus(item))
const canEditSubmission = (item) =>
  canReviewSubmission(item)
  && ['submitted', 'under_review'].includes(resolveItemStatus(item))
  && (
    appStore.hasPermission('housing_development:update')
    || appStore.hasAnyRole(['verifikator', 'super_admin'])
  )

// Computed property to check if there are active filters
const hasActiveFilters = computed(() => {
  return !!(
    filterLocation.value.province ||
    filterLocation.value.regency ||
    filterLocation.value.district ||
    filterLocation.value.village ||
    searchQuery.value
  )
})

// Location filter names (fetched from API)
const currentLocationFilters = ref([])
const locationFiltersLoading = ref(false)

// Fetch location names from API
const loadLocationFilters = async () => {
  const userData = localStorage.getItem('user-data')
  if (!userData) {
    currentLocationFilters.value = []
    return
  }
  
  try {
    const user = JSON.parse(userData)
    const filterList = []
    locationFiltersLoading.value = true
    
    // Fetch province name
    if (user.assignedProvinceId) {
      try {
        const response = await locationAPI.getProvince(user.assignedProvinceId)
        if (response.success && response.data?.province) {
          filterList.push(`Provinsi: ${response.data.province.name}`)
        } else {
          filterList.push(`Provinsi: ${user.assignedProvinceId}`)
        }
      } catch (error) {
        console.error('Error fetching province:', error)
        filterList.push(`Provinsi: ${user.assignedProvinceId}`)
      }
    }
    
    // Fetch regency name
    if (user.assignedRegencyId) {
      try {
        const response = await locationAPI.getRegency(user.assignedRegencyId)
        if (response.success && response.data?.regency) {
          filterList.push(`Kabupaten/Kota: ${response.data.regency.name}`)
        } else {
          filterList.push(`Kabupaten/Kota: ${user.assignedRegencyId}`)
        }
      } catch (error) {
        console.error('Error fetching regency:', error)
        filterList.push(`Kabupaten/Kota: ${user.assignedRegencyId}`)
      }
    }
    
    // Fetch district name
    if (user.assignedDistrictId) {
      try {
        const response = await locationAPI.getDistrict(user.assignedDistrictId)
        if (response.success && response.data?.district) {
          filterList.push(`Kecamatan: ${response.data.district.name}`)
        } else {
          filterList.push(`Kecamatan: ${user.assignedDistrictId}`)
        }
      } catch (error) {
        console.error('Error fetching district:', error)
        filterList.push(`Kecamatan: ${user.assignedDistrictId}`)
      }
    }
    
    // Fetch village name
    if (user.assignedVillageId) {
      try {
        const response = await locationAPI.getVillage(user.assignedVillageId)
        if (response.success && response.data?.village) {
          filterList.push(`Kelurahan: ${response.data.village.name}`)
        } else {
          filterList.push(`Kelurahan: ${user.assignedVillageId}`)
        }
      } catch (error) {
        console.error('Error fetching village:', error)
        filterList.push(`Kelurahan: ${user.assignedVillageId}`)
      }
    }
    
    currentLocationFilters.value = filterList
  } catch (error) {
    console.error('Error parsing user data for location filters:', error)
    currentLocationFilters.value = []
  } finally {
    locationFiltersLoading.value = false
  }
}

// Options
const reviewStatusOptions = [
  { title: 'Disetujui', value: 'approved' },
  { title: 'Ditolak', value: 'rejected' }
]

// Validation rules
const rules = {
  required: (value) => !!value || 'Field is required'
}

const reviewNotesRules = computed(() => {
  if (reviewData.value.status === 'rejected') {
    return [rules.required]
  }
  return []
})

// Methods
const buildQueryParams = (override = {}) => ({
  page: pagination.value.currentPage,
  limit: pagination.value.itemsPerPage,
  status: filters.value.status || undefined,
  provinceId: filterLocation.value.province?.id,
  regencyId: filterLocation.value.regency?.id,
  districtId: filterLocation.value.district?.id,
  villageId: filterLocation.value.village?.id,
  ...override
})

const buildStatisticsParams = (params = {}) => {
  const payload = {
    provinceId: params.provinceId,
    regencyId: params.regencyId,
    districtId: params.districtId,
    villageId: params.villageId
  }
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
  )
}

const loadStatistics = async (params = {}) => {
  const statsParams = buildStatisticsParams(params)
  const cacheKey = JSON.stringify(statsParams)
  if (cacheKey === statisticsCacheKey.value) {
    return
  }
  statisticsCacheKey.value = cacheKey
  statisticsLoading.value = true
  try {
    const response = await housingDevelopmentAPI.getStatistics(statsParams)
    if (response?.success) {
      statistics.value = response.data || null
    } else {
      statistics.value = null
    }
  } catch (error) {
    console.error('Error loading housing development statistics:', error)
    statistics.value = null
  } finally {
    statisticsLoading.value = false
  }
}

const housingTypeLabels = {
  sederhana: 'Sederhana',
  menengah: 'Menengah',
  mewah: 'Mewah',
  campuran: 'Campuran'
}

const formatHousingType = (value) => {
  if (!value) return 'N/A'
  const key = String(value).toLowerCase()
  return housingTypeLabels[key] || value
}

const getReviewerInfo = (user) => {
  if (!user) return null
  return {
    fullName: user.fullName || user.name || user.email || 'N/A',
    email: user.email || ''
  }
}

const formatCoordinates = (latitude, longitude) => {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return ''
  }
  return `${lat}, ${lng}`
}

const buildHousingDetailItem = (development) => ({
  namaPerumahan: development.developmentName || '',
  namaPengembang: development.developerName || '',
  luasLahan: development.landArea ?? null,
  jenisPerumahan: formatHousingType(development.housingType),
  koordinat: formatCoordinates(development.latitude, development.longitude),
  jumlahRumahRencana: development.plannedUnitCount ?? null,
  kebutuhanJalanAkses: Boolean(development.hasRoadAccess),
  panjangJalan: development.roadLengthMeters ?? null,
  statusLahan: development.landStatus || null
})

const mapDevelopmentListItem = (development) => ({
  id: development.id,
  developmentName: development.developmentName || '',
  developerName: development.developerName || '',
  housingType: formatHousingType(development.housingType),
  totalUnits: development.plannedUnitCount ?? null,
  status: development.status,
  verificationStatus: development.verificationStatus,
  submittedAt: development.submittedAt || development.createdAt || null,
  reviewedAt: development.verifiedAt || null,
  reviewer: getReviewerInfo(development.verifier),
  location: {
    province: development.province,
    regency: development.regency,
    district: development.district,
    village: development.village
  }
})

const mapDevelopmentDetail = (development) => ({
  ...mapDevelopmentListItem(development),
  housingDevelopments: [buildHousingDetailItem(development)]
})

const loadData = async () => {
  isLoading.value = true
  try {
    const query = searchQuery.value.trim()
    const shouldClientSearch = Boolean(query)
    const params = shouldClientSearch
      ? buildQueryParams({ page: 1, limit: 1000 })
      : buildQueryParams()

    await loadStatistics(params)
    const response = await housingDevelopmentAPI.getDevelopments(params)
    if (response?.success === false) {
      throw new Error(response.message || 'Gagal memuat data perumahan.')
    }
    const result = response?.data || {}
    const developments = result.developments || []
    let mapped = developments.map(mapDevelopmentListItem)

    if (shouldClientSearch) {
      const normalized = query.toLowerCase()
      mapped = mapped.filter((item) => {
        return (
          (item.developmentName || '').toLowerCase().includes(normalized)
          || (item.developerName || '').toLowerCase().includes(normalized)
          || (item.housingType || '').toLowerCase().includes(normalized)
        )
      })
    }

    if (shouldClientSearch) {
      const totalItems = mapped.length
      const totalPages = Math.max(
        1,
        Math.ceil(totalItems / pagination.value.itemsPerPage)
      )
      const currentPage = Math.min(pagination.value.currentPage, totalPages)
      const startIndex = (currentPage - 1) * pagination.value.itemsPerPage
      const endIndex = startIndex + pagination.value.itemsPerPage
      submissions.value = mapped.slice(startIndex, endIndex)
      pagination.value = {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: pagination.value.itemsPerPage,
        hasNextPage: endIndex < totalItems,
        hasPrevPage: startIndex > 0
      }
    } else {
      submissions.value = mapped
      const paginationData = result.pagination || {}
      pagination.value = {
        currentPage:
          paginationData.currentPage
          || paginationData.page
          || pagination.value.currentPage,
        totalPages: paginationData.totalPages || paginationData.pages || 0,
        totalItems: paginationData.totalItems || paginationData.total || 0,
        itemsPerPage:
          paginationData.itemsPerPage
          || paginationData.limit
          || pagination.value.itemsPerPage,
        hasNextPage:
          paginationData.hasNextPage ?? paginationData.hasNext ?? false,
        hasPrevPage:
          paginationData.hasPrevPage ?? paginationData.hasPrev ?? false
      }
    }
  } catch (error) {
    console.error('Error loading data:', error)
    submissions.value = []
    pagination.value = {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 20,
      hasNextPage: false,
      hasPrevPage: false
    }
  } finally {
    isLoading.value = false
  }
}

const debouncedSearch = debounce(() => {
  pagination.value.currentPage = 1
  loadData()
}, 500)

// Mock location data for filters (same as form.vue)
const mockLocationData = {
  provinces: [
    { id: 'prov-dki', name: 'DKI Jakarta' },
    { id: 'prov-jabar', name: 'Jawa Barat' },
    { id: 'prov-banten', name: 'Banten' }
  ],
  regencies: {
    'prov-dki': [
      { id: 'reg-jaksel', name: 'Kota Jakarta Selatan' },
      { id: 'reg-jakbar', name: 'Kota Jakarta Barat' },
      { id: 'reg-jakpus', name: 'Kota Jakarta Pusat' }
    ],
    'prov-jabar': [
      { id: 'reg-bandung', name: 'Kabupaten Bandung' },
      { id: 'reg-bekasi', name: 'Kabupaten Bekasi' },
      { id: 'reg-bogor', name: 'Kabupaten Bogor' }
    ],
    'prov-banten': [
      { id: 'reg-tangerang', name: 'Kabupaten Tangerang' },
      { id: 'reg-serang', name: 'Kabupaten Serang' },
      { id: 'reg-lebak', name: 'Kabupaten Lebak' }
    ]
  },
  districts: {
    'reg-jaksel': [
      { id: 'dist-kebayoran', name: 'Kebayoran Baru' },
      { id: 'dist-pesanggrahan', name: 'Pesanggrahan' }
    ],
    'reg-jakbar': [
      { id: 'dist-cengkareng', name: 'Cengkareng' },
      { id: 'dist-palmerah', name: 'Palmerah' }
    ],
    'reg-jakpus': [
      { id: 'dist-gambir', name: 'Gambir' },
      { id: 'dist-senen', name: 'Senen' }
    ],
    'reg-bandung': [
      { id: 'dist-cileunyi', name: 'Kecamatan Cileunyi' },
      { id: 'dist-dayeuhkolot', name: 'Kecamatan Dayeuhkolot' }
    ],
    'reg-bekasi': [
      { id: 'dist-tambun', name: 'Kecamatan Tambun' },
      { id: 'dist-cikarang', name: 'Kecamatan Cikarang' }
    ],
    'reg-bogor': [
      { id: 'dist-cibinong', name: 'Kecamatan Cibinong' },
      { id: 'dist-dramaga', name: 'Kecamatan Dramaga' }
    ],
    'reg-tangerang': [
      { id: 'dist-balaraja', name: 'Kecamatan Balaraja' },
      { id: 'dist-cikupa', name: 'Kecamatan Cikupa' }
    ],
    'reg-serang': [
      { id: 'dist-anyar', name: 'Kecamatan Anyar' },
      { id: 'dist-cinangka', name: 'Kecamatan Cinangka' }
    ],
    'reg-lebak': [
      { id: 'dist-panggarangan', name: 'Kecamatan Panggarangan' },
      { id: 'dist-sajira', name: 'Kecamatan Sajira' }
    ]
  },
  villages: {
    'dist-kebayoran': [
      { id: 'vill-senayan', name: 'Kelurahan Senayan' },
      { id: 'vill-gandaria', name: 'Kelurahan Kramat Pela' }
    ],
    'dist-pesanggrahan': [
      { id: 'vill-bintaro', name: 'Kelurahan Bintaro' },
      { id: 'vill-urt', name: 'Kelurahan Ulujami' }
    ],
    'dist-cengkareng': [
      { id: 'vill-cengkareng', name: 'Kelurahan Cengkareng' },
      { id: 'vill-kapuk', name: 'Kelurahan Kapuk' }
    ],
    'dist-palmerah': [
      { id: 'vill-palmerah', name: 'Kelurahan Palmerah' },
      { id: 'vill-kemanggisan', name: 'Kelurahan Kemanggisan' }
    ],
    'dist-gambir': [
      { id: 'vill-gambir', name: 'Kelurahan Gambir' },
      { id: 'vill-cideng', name: 'Kelurahan Cideng' }
    ],
    'dist-senen': [
      { id: 'vill-senen', name: 'Kelurahan Senen' },
      { id: 'vill-kwitang', name: 'Kelurahan Kwitang' }
    ],
    'dist-cileunyi': [
      { id: 'vill-cileunyi', name: 'Kelurahan Cileunyi' },
      { id: 'vill-cikeruh', name: 'Kelurahan Cikeruh' }
    ],
    'dist-dayeuhkolot': [
      { id: 'vill-dayeuhkolot', name: 'Kelurahan Dayeuhkolot' },
      { id: 'vill-cilampeni', name: 'Kelurahan Cilampeni' }
    ],
    'dist-tambun': [
      { id: 'vill-tambun', name: 'Kelurahan Tambun' },
      { id: 'vill-tambun-selatan', name: 'Kelurahan Tambun Selatan' }
    ],
    'dist-cikarang': [
      { id: 'vill-cikarang', name: 'Kelurahan Cikarang' },
      { id: 'vill-cikarang-baru', name: 'Kelurahan Cikarang Baru' }
    ],
    'dist-cibinong': [
      { id: 'vill-cibinong', name: 'Kelurahan Cibinong' },
      { id: 'vill-cibinong-ngasem', name: 'Kelurahan Cibinong Ngasem' }
    ],
    'dist-dramaga': [
      { id: 'vill-dramaga', name: 'Kelurahan Dramaga' },
      { id: 'vill-citeureup', name: 'Kelurahan Citeureup' }
    ],
    'dist-balaraja': [
      { id: 'vill-balaraja', name: 'Kelurahan Balaraja' },
      { id: 'vill-talagasari', name: 'Kelurahan Talagasari' }
    ],
    'dist-cikupa': [
      { id: 'vill-cikupa', name: 'Kelurahan Cikupa' },
      { id: 'vill-budi', name: 'Kelurahan Budi Mulya' }
    ],
    'dist-anyar': [
      { id: 'vill-anyar', name: 'Kelurahan Anyar' },
      { id: 'vill-kadubeureum', name: 'Kelurahan Kadubeureum' }
    ],
    'dist-cinangka': [
      { id: 'vill-cinangka', name: 'Kelurahan Cinangka' },
      { id: 'vill-bantarwangi', name: 'Kelurahan Bantarwangi' }
    ],
    'dist-panggarangan': [
      { id: 'vill-panggarangan', name: 'Kelurahan Panggarangan' },
      { id: 'vill-sogong', name: 'Kelurahan Sogong' }
    ],
    'dist-sajira': [
      { id: 'vill-sajira', name: 'Kelurahan Sajira' },
      { id: 'vill-parungsari', name: 'Kelurahan Parungsari' }
    ]
  }
}

// Fetch functions for filter location
const fetchFilterProvinces = async () => {
  filterLocationLoading.provinces = true
  try {
    const response = await locationAPI.getProvinces()
    if (response.success && response.data?.provinces) {
      filterProvinceOptions.value = response.data.provinces.map(province => ({
        id: province.id,
        name: province.name,
        code: province.code
      }))
    } else {
      // Fallback to mock data if API fails
      console.warn('Failed to fetch provinces from API, using mock data')
      filterProvinceOptions.value = mockLocationData.provinces
    }
  } catch (error) {
    console.error('Error fetching provinces:', error)
    // Fallback to mock data on error
    filterProvinceOptions.value = mockLocationData.provinces
  } finally {
    filterLocationLoading.provinces = false
  }
}

const fetchFilterRegencies = async (provinceId) => {
  if (!provinceId) return
  filterLocationLoading.regencies = true
  try {
    const response = await locationAPI.getRegencies(provinceId)
    if (response.success && response.data?.regencies) {
      filterRegencyOptions.value = response.data.regencies.map(regency => ({
        id: regency.id,
        name: regency.name,
        code: regency.code,
        type: regency.type
      }))
    } else {
      // Fallback to mock data if API fails
      console.warn('Failed to fetch regencies from API, using mock data')
      filterRegencyOptions.value = mockLocationData.regencies[provinceId] ?? []
    }
  } catch (error) {
    console.error('Error fetching regencies:', error)
    // Fallback to mock data on error
    filterRegencyOptions.value = mockLocationData.regencies[provinceId] ?? []
  } finally {
    filterLocationLoading.regencies = false
  }
}

const fetchFilterDistricts = async (regencyId) => {
  if (!regencyId) return
  filterLocationLoading.districts = true
  try {
    const response = await locationAPI.getDistricts(regencyId)
    if (response.success && response.data?.districts) {
      filterDistrictOptions.value = response.data.districts.map(district => ({
        id: district.id,
        name: district.name,
        code: district.code
      }))
    } else {
      // Fallback to mock data if API fails
      console.warn('Failed to fetch districts from API, using mock data')
      filterDistrictOptions.value = mockLocationData.districts[regencyId] ?? []
    }
  } catch (error) {
    console.error('Error fetching districts:', error)
    // Fallback to mock data on error
    filterDistrictOptions.value = mockLocationData.districts[regencyId] ?? []
  } finally {
    filterLocationLoading.districts = false
  }
}

const fetchFilterVillages = async (districtId) => {
  if (!districtId) return
  filterLocationLoading.villages = true
  try {
    const response = await locationAPI.getVillages(districtId)
    if (response.success && response.data?.villages) {
      filterVillageOptions.value = response.data.villages.map(village => ({
        id: village.id,
        name: village.name,
        code: village.code
      }))
    } else {
      // Fallback to mock data if API fails
      console.warn('Failed to fetch villages from API, using mock data')
      filterVillageOptions.value = mockLocationData.villages[districtId] ?? []
    }
  } catch (error) {
    console.error('Error fetching villages:', error)
    // Fallback to mock data on error
    filterVillageOptions.value = mockLocationData.villages[districtId] ?? []
  } finally {
    filterLocationLoading.villages = false
  }
}

// Watchers for cascaded filter location dropdowns
watch(
  () => filterLocation.value.province,
  async (province) => {
    filterLocation.value.regency = null
    filterLocation.value.district = null
    filterLocation.value.village = null
    filterRegencyOptions.value = []
    filterDistrictOptions.value = []
    filterVillageOptions.value = []
    if (province?.id) {
      await fetchFilterRegencies(province.id)
    }
    applyFilters()
  }
)

watch(
  () => filterLocation.value.regency,
  async (regency) => {
    filterLocation.value.district = null
    filterLocation.value.village = null
    filterDistrictOptions.value = []
    filterVillageOptions.value = []
    if (regency?.id) {
      await fetchFilterDistricts(regency.id)
    }
    applyFilters()
  }
)

watch(
  () => filterLocation.value.district,
  async (district) => {
    filterLocation.value.village = null
    filterVillageOptions.value = []
    if (district?.id) {
      await fetchFilterVillages(district.id)
    }
    applyFilters()
  }
)

watch(
  () => filterLocation.value.village,
  () => {
    applyFilters()
  }
)

// Handle filter location change manually
const handleFilterLocationChange = () => {
  applyFilters()
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadData()
}

const clearFilters = () => {
  filters.value.status = null
  searchQuery.value = ''
  filterLocation.value = {
    province: null,
    regency: null,
    district: null,
    village: null
  }
  filterRegencyOptions.value = []
  filterDistrictOptions.value = []
  filterVillageOptions.value = []
  pagination.value.currentPage = 1
  loadData()
}

const openExportDialog = () => {
  exportError.value = ''
  exportDialogOpen.value = true
}

const buildExportParams = () => {
  const params = {
    status: filters.value.status || undefined,
    provinceId: filterLocation.value.province?.id,
    regencyId: filterLocation.value.regency?.id,
    districtId: filterLocation.value.district?.id,
    villageId: filterLocation.value.village?.id
  }

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined || params[key] === null || params[key] === '') {
      delete params[key]
    }
  })

  return params
}

const buildExportFilterSummary = () => {
  if (exportScope.value === 'all') {
    return 'Semua data'
  }

  const parts = []
  if (filters.value.status) {
    parts.push(`Status: ${getStatusLabel(filters.value.status)}`)
  }
  if (filterLocation.value.village?.name) {
    parts.push(`Kelurahan: ${filterLocation.value.village.name}`)
  }
  if (filterLocation.value.district?.name) {
    parts.push(`Kecamatan: ${filterLocation.value.district.name}`)
  }
  if (filterLocation.value.regency?.name) {
    parts.push(`Kabupaten: ${filterLocation.value.regency.name}`)
  }
  if (filterLocation.value.province?.name) {
    parts.push(`Provinsi: ${filterLocation.value.province.name}`)
  }

  return parts.length ? parts.join(' | ') : 'Tidak ada filter'
}

const handleExport = async () => {
  exportError.value = ''
  if (!exportCategoryIds.value.length) {
    exportError.value = 'Pilih minimal satu kategori kolom.'
    return
  }

  exportLoading.value = true
  try {
    const params = exportScope.value === 'filtered' ? buildExportParams() : {}
    const response = await exportAPI.getData('housing-development', { ...params, format: 'json' })
    if (response?.success === false) {
      throw new Error(response.message || 'Gagal memuat data ekspor.')
    }
    const rows = response?.data?.items || []

    if (!rows.length) {
      exportError.value = 'Data ekspor kosong.'
      return
    }

    const columns = getColumnsForCategories(housingDevelopmentExportCategories, exportCategoryIds.value)
    const metaRows = buildMetaRows({
      title: 'Ekspor Data Survei Perumahan',
      scopeLabel: exportScope.value === 'all'
        ? 'Semua Data'
        : exportScope.value === 'filtered'
          ? 'Data yang Difilter'
          : 'Semua Data',
      filterSummary: buildExportFilterSummary()
    })

    const dateStamp = new Date().toISOString().slice(0, 10)
    await exportToExcel({
      sheetName: 'Perumahan',
      fileName: `export-perumahan-${dateStamp}.xlsx`,
      columns,
      rows,
      metaRows
    })
    exportDialogOpen.value = false
  } catch (error) {
    console.error('Export error:', error)
    exportError.value = error?.message || 'Terjadi kesalahan saat ekspor.'
  } finally {
    exportLoading.value = false
  }
}

const refreshData = () => {
  loadData()
}

const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadData()
}

const handleItemsPerPageChange = (itemsPerPage) => {
  pagination.value.itemsPerPage = itemsPerPage
  pagination.value.currentPage = 1
  loadData()
}

const markUnderReview = async (item) => {
  if (!item?.id) return
  if (!canReviewSubmission(item)) return
  if (resolveItemStatus(item) !== 'submitted') return

  try {
    await housingDevelopmentAPI.verifyDevelopment(item.id, {
      status: 'under_review',
      reviewNotes: ''
    })
    await loadData()
  } catch (error) {
    console.error('Error marking under review:', error)
  }
}

const viewSubmission = async (item) => {
  showDetailDialog.value = true
  selectedSubmission.value = null
  isLoading.value = true
  try {
    const response = await housingDevelopmentAPI.getDevelopment(item.id)
    if (response?.success === false) {
      throw new Error(response.message || 'Gagal memuat detail perumahan.')
    }
    const development = response?.data?.development
    if (!development) {
      throw new Error('Data perumahan tidak ditemukan.')
    }
    selectedSubmission.value = mapDevelopmentDetail(development)
    await markUnderReview(item)
  } catch (error) {
    console.error('Error loading development detail:', error)
    alert(error?.message || 'Gagal memuat detail perumahan.')
    showDetailDialog.value = false
  } finally {
    isLoading.value = false
  }
}

const goToEditForm = (item) => {
  if (!item?.id) return
  router.push({ path: '/housing-development-form', query: { edit: item.id } })
}

const reviewSubmission = (item, status) => {
  selectedSubmission.value = item
  if (status === 'rejected') {
    reviewData.value = {
      status,
      reviewNotes: ''
    }
    reviewFormValid.value = false
    showReviewDialog.value = true
    return
  }
  submitReviewDirect(item, status)
}

const submitReviewDirect = async (item, status) => {
  if (!item?.id) return
  isLoading.value = true
  try {
    const response = await housingDevelopmentAPI.verifyDevelopment(item.id, {
      status,
      reviewNotes: ''
    })
    if (response?.success === false) {
      throw new Error(response.message || 'Gagal memverifikasi perumahan.')
    }
    selectedSubmission.value = null
    reviewData.value = { status: '', reviewNotes: '' }
    await loadData()
    if (status === 'approved') {
      await mapStore.fetchHousingDevelopment()
    }
  } catch (error) {
    console.error('Error reviewing submission:', error)
    alert(error?.message || 'Gagal memverifikasi perumahan.')
  } finally {
    isLoading.value = false
  }
}

const submitReview = async () => {
  if (!reviewFormRef.value) return
  const { valid } = await reviewFormRef.value.validate()
  if (!valid) return
  if (!selectedSubmission.value?.id) return
  
  isLoading.value = true
  try {
    const status = reviewData.value.status
    const response = await housingDevelopmentAPI.verifyDevelopment(
      selectedSubmission.value.id,
      reviewData.value
    )
    if (response?.success === false) {
      throw new Error(response.message || 'Gagal memverifikasi perumahan.')
    }
    showReviewDialog.value = false
    selectedSubmission.value = null
    reviewData.value = { status: '', reviewNotes: '' }
    await loadData()
    if (status === 'approved') {
      await mapStore.fetchHousingDevelopment()
    }
  } catch (error) {
    console.error('Error reviewing submission:', error)
    alert(error?.message || 'Gagal memverifikasi perumahan.')
  } finally {
    isLoading.value = false
  }
}

// Utility functions
const getStatusColor = (status) => {
  if (!status) return 'grey'
  const colors = {
    draft: 'grey',
    submitted: 'blue',
    under_review: 'amber',
    approved: 'green',
    rejected: 'red'
  }
  return colors[status] || 'grey'
}

const getStatusIcon = (status) => {
  if (!status) return 'mdi-help-circle'
  const icons = {
    draft: 'mdi-file-outline',
    submitted: 'mdi-file-send-outline',
    under_review: 'mdi-file-clock-outline',
    approved: 'mdi-file-check-outline',
    rejected: 'mdi-file-remove-outline'
  }
  return icons[status] || 'mdi-help-circle'
}

const getStatusLabel = (status) => {
  if (!status) return 'Tidak Dikenal'
  const labels = {
    draft: 'Draft',
    submitted: 'Diajukan',
    under_review: 'Dalam Tinjauan',
    approved: 'Disetujui',
    rejected: 'Ditolak'
  }
  return labels[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Invalid Date'
  }
}

const formatTime = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid Time'
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await fetchFilterProvinces()
    await loadLocationFilters()
    loadData()
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})

// Watch for filter changes
watch(() => filters.value.status, () => {
  applyFilters()
})

</script>

<style scoped>
.v-card {
  border-radius: 8px;
}
</style>
