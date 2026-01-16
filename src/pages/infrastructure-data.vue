<template>
  <div>
    <!-- Loading Overlay -->
    <v-overlay :model-value="isLoading" class="align-center justify-center">
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>

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
      <!-- Header Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card variant="flat" class="border">
            <v-card-title
              class="d-flex flex-column flex-sm-row align-center align-sm-start pa-4 pa-sm-6"
            >
              <v-icon
                :size="$vuetify.display.mobile ? '32' : '48'"
                class="mr-sm-4 mb-3 mb-sm-0"
                color="primary"
              >
                mdi-city
              </v-icon>

              <div class="text-center text-sm-left">
                <h2 class="text-h6 text-sm-h5 font-weight-bold mb-1">
                  Data Survei Infrastruktur
                </h2>
                <p
                  class="text-caption text-sm-subtitle-1 text-medium-emphasis mb-0"
                >
                  Kelola dan tinjau formulir survei infrastruktur yang telah
                  diajukan
                </p>
              </div>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>

      <!-- Location Filters Info -->
      <v-row v-if="currentLocationFilters.length > 0" class="mb-4">
        <v-col cols="12">
          <v-alert type="info" variant="tonal" class="mb-0">
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
                v-if="
                  !locationFiltersLoading && currentLocationFilters.length === 0
                "
                class="text-caption text-medium-emphasis"
              >
                Tidak ada filter lokasi
              </span>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Statistics Cards (Expandable) -->
      <v-row v-if="Object.keys(submissionCounts).length > 0" class="mb-6">
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
                  {{ showAllFilters ? "mdi-filter-remove" : "mdi-filter" }}
                </v-icon>
                <v-tooltip activator="parent" location="top">
                  {{
                    showAllFilters
                      ? "Sembunyikan Filter"
                      : "Tampilkan Semua Filter"
                  }}
                </v-tooltip>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <!-- Search Form (Always Visible) -->
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="searchQuery"
                    label="Cari Nama Desa/Kelurahan"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    clearable
                    @input="debouncedSearch"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-btn
                    color="primary"
                    variant="outlined"
                    :loading="isLoading"
                    class="mr-2"
                    @click="refreshData"
                  >
                    <v-icon start> mdi-refresh </v-icon>
                    Muat Ulang
                  </v-btn>
                  <v-btn
                    v-if="hasActiveFilters"
                    color="secondary"
                    variant="outlined"
                    @click="clearFilters"
                  >
                    <v-icon start> mdi-filter-off </v-icon>
                    Hapus
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Additional Filters (Expandable) -->
              <v-expand-transition>
                <div v-show="showAllFilters">
                  <v-divider class="my-4" />
                  <v-row>
                    <v-col cols="12" md="3">
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
                    <v-col cols="12" md="3">
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
                    <v-col cols="12" md="3">
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
                    <v-col cols="12" md="3">
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
                      v-if="canCreateInfrastructure"
                      color="primary"
                      to="/infrastructure-form"
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
              <v-icon class="mr-2"> mdi-table </v-icon>
              Survei
              <v-spacer />
              <div class="d-flex flex-wrap align-center gap-2">
                <v-btn
                  v-if="canExportInfrastructure"
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-file-excel"
                  @click="openExportDialog"
                >
                  Ekspor Excel
                </v-btn>
                <v-chip color="primary" variant="tonal">
                  {{ pagination.totalItems }} Total
                </v-chip>
              </div>
            </v-card-title>

            <div ref="tableWrapperRef" class="data-table-wrapper">
              <v-data-table-server
                :headers="headers"
                :items="submissions"
                :loading="isLoading"
                :items-per-page="pagination.itemsPerPage"
                :items-per-page-options="itemsPerPageOptions"
                :page="pagination.currentPage"
                :items-length="pagination.totalItems"
                class="elevation-0 data-table"
                density="compact"
                mobile-breakpoint="960"
                :row-props="getRowProps"
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

                <!-- Village Name Column -->
                <template #item.villageName="{ item }">
                  <div>
                    <div
                      class="font-weight-medium"
                      v-html="
                        highlightText(item.villageName || 'N/A', searchQuery)
                      "
                    ></div>
                  </div>
                </template>

                <!-- Population Column -->
                <template #item.population="{ item }">
                  <div class="text-body-2">
                    {{ item.population || "N/A" }}
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
                      {{ item.reviewer.fullName || "N/A" }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDate(item.reviewedAt) }}
                    </div>
                  </div>
                  <div v-else class="text-caption text-medium-emphasis">
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
                      <v-tooltip activator="parent" location="top">
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
                      <v-tooltip activator="parent" location="top">
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
                      <v-tooltip activator="parent" location="top">
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
                      <v-tooltip activator="parent" location="top">
                        Tolak
                      </v-tooltip>
                    </v-btn>

                    <v-btn
                      v-if="canHardDelete"
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="openDeleteDialog(item)"
                    >
                      <v-icon>mdi-delete</v-icon>
                      <v-tooltip activator="parent" location="top">
                        Hapus Permanen
                      </v-tooltip>
                    </v-btn>
                  </div>
                </template>

                <!-- Empty State -->
                <template #no-data>
                  <div class="text-center py-8">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">
                      mdi-city-off-outline
                    </v-icon>
                    <h3 class="text-h6 text-medium-emphasis mb-2">
                      Tidak Ada Data Infrastruktur Ditemukan
                    </h3>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                      Tidak ada pengajuan survei infrastruktur yang sesuai
                      dengan filter Anda.
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
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Export Dialog -->
      <v-dialog v-model="exportDialogOpen" max-width="760">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2"> mdi-file-excel </v-icon>
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

            <div class="text-subtitle-2 mb-2">Cakupan Data</div>
            <v-radio-group v-model="exportScope">
              <v-radio label="Semua Data" value="all" />
              <v-radio label="Data yang Difilter" value="filtered" />
            </v-radio-group>

            <v-divider class="my-4" />

            <div class="text-subtitle-2 mb-2">
              Kategori Kolom (Infrastruktur)
            </div>
            <v-checkbox
              v-model="exportAllCategories"
              label="Semua Kategori"
              hide-details
            />
            <v-row>
              <v-col
                v-for="category in infrastructureExportCategories"
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
            <v-btn variant="outlined" @click="exportDialogOpen = false">
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
      <v-dialog v-model="showDetailDialog" max-width="1200" scrollable>
        <v-card v-if="selectedSubmission">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2"> mdi-file-document-outline </v-icon>
            Detail Survei Infrastruktur
            <v-spacer />
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="showDetailDialog = false"
            />
          </v-card-title>

          <v-card-text>
            <v-tabs v-model="activeTab" color="primary">
              <v-tab value="profil">
                <v-icon start> mdi-office-building-outline </v-icon>
                Profil Desa/Kelurahan
              </v-tab>

              <v-tab value="pendidikan">
                <v-icon start> mdi-school-outline </v-icon>
                Sarana Pendidikan
              </v-tab>

              <v-tab value="kesehatan">
                <v-icon start> mdi-hospital-building </v-icon>
                Sarana Kesehatan
              </v-tab>

              <v-tab value="peribadatan">
                <v-icon start> mdi-mosque </v-icon>
                Sarana Peribadatan
              </v-tab>

              <v-tab value="listrik">
                <v-icon start> mdi-lightning-bolt </v-icon>
                Jaringan Listrik
              </v-tab>

              <v-tab value="air-bersih">
                <v-icon start> mdi-water </v-icon>
                Jaringan Air Bersih
              </v-tab>

              <v-tab value="telepon">
                <v-icon start> mdi-phone </v-icon>
                Jaringan Telepon
              </v-tab>

              <v-tab value="transportasi">
                <v-icon start> mdi-bus </v-icon>
                Jaringan Transportasi
              </v-tab>

              <v-tab value="perniagaan">
                <v-icon start> mdi-store </v-icon>
                Sarana Perniagaan
              </v-tab>

              <v-tab value="pelayanan-umum">
                <v-icon start> mdi-office-building </v-icon>
                Sarana Pelayanan Umum
              </v-tab>

              <v-tab value="rekreasi">
                <v-icon start> mdi-stadium </v-icon>
                Sarana Rekreasi & Olahraga
              </v-tab>

              <v-tab value="pemakaman">
                <v-icon start> mdi-cross </v-icon>
                Sarana Pemakaman
              </v-tab>

              <v-tab value="pertamanan">
                <v-icon start> mdi-tree </v-icon>
                Sarana Pertamanan & RTH
              </v-tab>

              <v-tab value="parkir">
                <v-icon start> mdi-parking </v-icon>
                Sarana Parkir
              </v-tab>

              <v-tab value="gas">
                <v-icon start> mdi-gas-station </v-icon>
                Jaringan Gas
              </v-tab>

              <v-tab value="pemadam-kebakaran">
                <v-icon start> mdi-fire-truck </v-icon>
                Pemadam Kebakaran
              </v-tab>

              <v-tab value="penerangan-jalan">
                <v-icon start> mdi-lightbulb </v-icon>
                Penerangan Jalan Umum
              </v-tab>
            </v-tabs>

            <v-tabs-window v-model="activeTab">
              <!-- Profil Desa/Kelurahan -->
              <v-tabs-window-item value="profil">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Nama Desa/Kelurahan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.profil?.namaDesa || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah Penduduk
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.profil?.jumlahPenduduk
                                    ? selectedSubmission.profil.jumlahPenduduk.toLocaleString(
                                        "id-ID"
                                      )
                                    : "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah KK
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.profil?.jumlahKK
                                    ? selectedSubmission.profil.jumlahKK.toLocaleString(
                                        "id-ID"
                                      )
                                    : "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah Rumah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.profil?.jumlahRumah
                                    ? selectedSubmission.profil.jumlahRumah.toLocaleString(
                                        "id-ID"
                                      )
                                    : "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Pendidikan -->
              <v-tabs-window-item value="pendidikan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(
                                item, index
                              ) in selectedSubmission.pendidikan"
                              :key="`pendidikan-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.pendidikan?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Kesehatan -->
              <v-tabs-window-item value="kesehatan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(
                                item, index
                              ) in selectedSubmission.kesehatan"
                              :key="`kesehatan-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.kesehatan?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Peribadatan -->
              <v-tabs-window-item value="peribadatan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(
                                item, index
                              ) in selectedSubmission.peribadatan"
                              :key="`peribadatan-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.peribadatan?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Jaringan Listrik -->
              <v-tabs-window-item value="listrik">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Tercakup Seluruh Desa/Kelurahan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.listrik
                                    ?.tercakupSeluruhDesa ||
                                  selectedSubmission.jaringanListrik
                                    ?.tercakupSeluruhWilayah
                                    ? "Ya"
                                    : "Tidak"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Wilayah Belum Terjangkau
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.listrik
                                    ?.wilayahBelumTerjangkau ||
                                  selectedSubmission.jaringanListrik
                                    ?.wilayahBelumTerjangkau ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Jaringan Air Bersih -->
              <v-tabs-window-item value="air-bersih">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah SPAM
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.airBersih?.jumlahSpam ||
                                  selectedSubmission.jaringanAirBersih
                                    ?.jumlahSPAM ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Jaringan Telepon -->
              <v-tabs-window-item value="telepon">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah Operator
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.telepon?.jumlahOperator ||
                                  selectedSubmission.jaringanTelepon
                                    ?.jumlahOperator ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Wilayah Belum Terjangkau
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.telepon
                                    ?.wilayahBelumTerjangkau ||
                                  selectedSubmission.jaringanTelepon
                                    ?.wilayahBelumTerjangkau ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Jaringan Transportasi -->
              <v-tabs-window-item value="transportasi">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Layanan Angkutan Umum
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                <v-chip
                                  v-for="layanan in selectedSubmission
                                    .jaringanTransportasi
                                    ?.layananAngkutanUmum ||
                                  selectedSubmission.transportasi
                                    ?.layananAngkutanUmum ||
                                  []"
                                  :key="layanan"
                                  size="small"
                                  class="mr-1 mb-1"
                                >
                                  {{ layanan }}
                                </v-chip>
                                <span
                                  v-if="
                                    !selectedSubmission.jaringanTransportasi
                                      ?.layananAngkutanUmum &&
                                    !selectedSubmission.transportasi
                                      ?.layananAngkutanUmum
                                  "
                                  >N/A</span
                                >
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.jaringanTransportasi
                                  ?.layananLainnya ||
                                selectedSubmission.transportasi?.layananLainnya
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.jaringanTransportasi
                                  ?.layananLainnya ||
                                selectedSubmission.transportasi?.layananLainnya
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Layanan Lainnya
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.jaringanTransportasi
                                    ?.layananLainnya ||
                                  selectedSubmission.transportasi
                                    ?.layananLainnya ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Perniagaan/Perbelanjaan -->
              <v-tabs-window-item value="perniagaan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(
                                item, index
                              ) in selectedSubmission.perniagaan"
                              :key="`perniagaan-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.perniagaan?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Pelayanan Umum dan Pemerintahan -->
              <v-tabs-window-item value="pelayanan-umum">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(
                                item, index
                              ) in selectedSubmission.pelayananUmum"
                              :key="`pelayanan-umum-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.pelayananUmum?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Rekreasi dan Olahraga -->
              <v-tabs-window-item value="rekreasi">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(
                                item, index
                              ) in selectedSubmission.rekreasi"
                              :key="`rekreasi-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.rekreasi?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Pemakaman -->
              <v-tabs-window-item value="pemakaman">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(
                                item, index
                              ) in selectedSubmission.pemakaman"
                              :key="`pemakaman-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.pemakaman?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Pertamanan dan Ruang Terbuka Hijau (RTH) -->
              <v-tabs-window-item value="pertamanan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(
                                item, index
                              ) in selectedSubmission.pertamanan"
                              :key="`pertamanan-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.pertamanan?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Sarana Parkir -->
              <v-tabs-window-item value="parkir">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item
                              v-for="(item, index) in selectedSubmission.parkir"
                              :key="`parkir-${index}`"
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                {{ formatFacilityLabel(item) }}
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item
                              v-if="!selectedSubmission.parkir?.length"
                            >
                              <v-list-item-title class="text-medium-emphasis">
                                Belum ada sarana terdaftar
                              </v-list-item-title>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Jaringan Gas -->
              <v-tabs-window-item value="gas">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah Agen Gas di Desa/Kelurahan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.jaringanGas
                                    ?.jumlahAgenGas || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Pemadam Kebakaran -->
              <v-tabs-window-item value="pemadam-kebakaran">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Mobil Damkar (Unit)
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.pemadamKebakaran
                                    ?.mobilDamkar || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Pengelola
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.pemadamKebakaran
                                    ?.pengelola || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                APAR (Unit)
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.pemadamKebakaran?.APAR ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Penerangan Jalan Umum (PJU) -->
              <v-tabs-window-item value="penerangan-jalan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah Lampu Jalan yang Dikelola Pemerintah
                                Desa/Kelurahan (Unit)
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.peneranganJalan
                                    ?.jumlahLampuJalan || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              v-if="
                canReviewSubmission(selectedSubmission) &&
                canApproveStatus(selectedSubmission)
              "
              color="success"
              variant="elevated"
              @click="reviewSubmission(selectedSubmission, 'approved')"
            >
              Setujui
            </v-btn>
            <v-btn
              v-if="
                canReviewSubmission(selectedSubmission) &&
                canRejectStatus(selectedSubmission)
              "
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
      <v-dialog v-model="showReviewDialog" max-width="600">
        <v-card>
          <v-card-title> Tinjau Pengajuan </v-card-title>

          <v-card-text>
            <v-form ref="reviewFormRef" v-model="reviewFormValid">
              <v-alert
                v-if="reviewData.status === 'rejected'"
                type="warning"
                variant="tonal"
                class="mb-4"
              >
                Alasan penolakan wajib diisi agar pengajuan dapat
                ditindaklanjuti.
              </v-alert>
              <v-select
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

      <!-- Delete Dialog -->
      <v-dialog v-model="deleteDialog.show" max-width="520">
        <v-card>
          <v-card-title class="text-h6 font-weight-bold">
            Hapus Data Permanen
          </v-card-title>
          <v-card-text>
            <div class="mb-2">
              Anda akan menghapus data survei infrastruktur secara permanen.
            </div>
            <div class="text-body-2 text-medium-emphasis">
              Tindakan ini akan menghapus data terkait dan titik lokasi di peta.
            </div>
            <div v-if="deleteDialog.item" class="mt-3 text-body-2">
              <strong>Desa/Kelurahan:</strong>
              {{ deleteDialog.item.villageName || "-" }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="outlined" @click="closeDeleteDialog">
              Batal
            </v-btn>
            <v-btn
              color="error"
              :loading="deleteDialog.loading"
              @click="confirmDelete"
            >
              Hapus Permanen
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch, nextTick } from "vue";
import { definePage } from "unplugin-vue-router/runtime";
import { useRouter, useRoute } from "vue-router";
import { exportAPI, facilityAPI, locationAPI } from "@/services";
import { useAppStore } from "@/stores/app";
import { useMapDataStore } from "@/stores/mapData";
import {
  buildMetaRows,
  exportToExcel,
  getColumnsForCategories,
  getExportCategories,
} from "@/utils/exportUtils";
import { debounce } from "lodash-es";

definePage({
  meta: {
    layout: "dashboard",
  },
});

const appStore = useAppStore();
const mapStore = useMapDataStore();
const router = useRouter();
const route = useRoute();

// Reactive state
const isLoading = ref(false);
const searchQuery = ref("");
const focusedRowId = ref(null);
const tableWrapperRef = ref(null);
const showDetailDialog = ref(false);
const showReviewDialog = ref(false);
const selectedSubmission = ref(null);
const activeTab = ref("profil");
const reviewFormValid = ref(false);
const reviewFormRef = ref(null);
const submissions = ref([]);
const expandedStatistics = ref([]); // For expansion panel (empty = collapsed)
const showAllFilters = ref(false); // For showing/hiding additional filters
const exportDialogOpen = ref(false);
const exportScope = ref("all");
const exportLoading = ref(false);
const exportError = ref("");
const snackbar = ref({
  show: false,
  message: "",
  color: "error",
});
const deleteDialog = reactive({
  show: false,
  item: null,
  loading: false,
});
const infrastructureExportCategories = getExportCategories("facility");
const exportCategoryIds = ref(
  infrastructureExportCategories.map((category) => category.id)
);
const exportAllCategories = computed({
  get: () =>
    exportCategoryIds.value.length === infrastructureExportCategories.length,
  set: (value) => {
    exportCategoryIds.value = value
      ? infrastructureExportCategories.map((category) => category.id)
      : [];
  },
});

// Filter location state
const filterLocation = ref({
  province: null,
  regency: null,
  district: null,
  village: null,
});

const filterProvinceOptions = ref([]);
const filterRegencyOptions = ref([]);
const filterDistrictOptions = ref([]);
const filterVillageOptions = ref([]);

const filterLocationLoading = reactive({
  provinces: false,
  regencies: false,
  districts: false,
  villages: false,
});

// Review form data
const reviewData = ref({
  status: "",
  reviewNotes: "",
});
const statistics = ref(null);
const statisticsLoading = ref(false);
const statisticsCacheKey = ref("");

// Pagination
const pagination = ref({
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 20,
  hasNextPage: false,
  hasPrevPage: false,
});

// Filters
const filters = ref({
  status: null,
});

// Table headers
const headers = [
  { title: "ID", key: "id", sortable: false, width: "120px" },
  { title: "Status", key: "status", sortable: false, width: "120px" },
  {
    title: "Nama Desa/Kelurahan",
    key: "villageName",
    sortable: false,
    width: "200px",
  },
  {
    title: "Jumlah Penduduk",
    key: "population",
    sortable: false,
    width: "150px",
  },
  {
    title: "Tanggal Diajukan",
    key: "submittedAt",
    sortable: false,
    width: "150px",
  },
  { title: "Peninjau", key: "reviewer", sortable: false, width: "150px" },
  { title: "Aksi", key: "actions", sortable: false, width: "120px" },
];
const itemsPerPageOptions = [10, 20, 50, 100];

const showSnackbar = (message, color = "error") => {
  snackbar.value = {
    show: true,
    message,
    color,
  };
};

const getFocusIdFromRoute = () => {
  const rawValue = route.query.focusId;
  if (Array.isArray(rawValue)) {
    return rawValue[0] ? String(rawValue[0]).trim() : null;
  }
  if (rawValue === null || rawValue === undefined) return null;
  const normalized = String(rawValue).trim();
  return normalized.length ? normalized : null;
};

const getRowProps = ({ item }) => ({
  class:
    item?.id && item.id === focusedRowId.value
      ? "data-table-row--focused"
      : undefined,
  "data-row-id": item?.id || undefined,
});

// Computed properties
const canExportInfrastructure = computed(() =>
  appStore.hasPermission("export_infrastructure")
);
const canHardDelete = computed(() => appStore.isSuperAdmin);
const canCreateInfrastructure = computed(
  () =>
    !appStore.isVerifikator &&
    !appStore.isAdminKabupaten &&
    appStore.hasPermission("facility:create")
);
const resolveStatus = (status, verificationStatus = null) => {
  const normalizedStatus = String(status || "").toLowerCase();
  const normalizedVerification = String(verificationStatus || "").toLowerCase();

  if (!normalizedStatus && normalizedVerification === "pending") {
    return "submitted";
  }
  if (normalizedStatus === "draft" && normalizedVerification === "pending") {
    return "submitted";
  }
  if (normalizedStatus === "pending") return "submitted";
  if (normalizedVerification === "rejected") return "rejected";
  if (
    normalizedVerification === "verified" ||
    normalizedStatus === "approved"
  ) {
    return "approved";
  }
  if (["verified", "reviewed", "under_review"].includes(normalizedStatus)) {
    return "under_review";
  }
  return normalizedStatus || "draft";
};

const resolveItemStatus = (item) =>
  resolveStatus(item?.status, item?.verificationStatus);

const submissionCounts = computed(() => {
  const rawCounts = statistics.value?.statusBreakdown || {};
  const counts = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  };
  if (Object.keys(rawCounts).length) {
    Object.entries(rawCounts).forEach(([status, count]) => {
      const normalized = resolveStatus(status);
      counts[normalized] = (counts[normalized] || 0) + Number(count || 0);
    });
  } else {
    submissions.value.forEach((submission) => {
      const status = resolveItemStatus(submission);
      counts[status] = (counts[status] || 0) + 1;
    });
  }
  return counts;
});

const canReview = computed(
  () =>
    appStore.hasAnyRole(["verifikator", "super_admin"]) ||
    appStore.hasAnyPermission(["facility:verify", "facility:approve"])
);

const isWithinScope = (item) => {
  if (appStore.isSuperAdmin || appStore.isVerifikator || canReview.value) {
    return true;
  }
  const location = {
    villageId: item?.village?.id || item?.villageId,
    districtId: item?.district?.id || item?.districtId,
    regencyId: item?.regency?.id || item?.regencyId,
    provinceId: item?.province?.id || item?.provinceId,
  };

  if (appStore.user?.assignedVillageId) {
    return location.villageId === appStore.user.assignedVillageId;
  }
  if (appStore.user?.assignedDistrictId) {
    return location.districtId === appStore.user.assignedDistrictId;
  }
  if (appStore.user?.assignedRegencyId) {
    return location.regencyId === appStore.user.assignedRegencyId;
  }
  if (appStore.user?.assignedProvinceId) {
    return location.provinceId === appStore.user.assignedProvinceId;
  }
  return true;
};

const canReviewSubmission = (item) => canReview.value && isWithinScope(item);
const canApproveStatus = (item) =>
  ["submitted", "under_review"].includes(resolveItemStatus(item));
const canRejectStatus = (item) =>
  ["submitted", "under_review"].includes(resolveItemStatus(item));
const canEditSubmission = (item) =>
  canReviewSubmission(item) &&
  ["submitted", "under_review"].includes(resolveItemStatus(item)) &&
  (appStore.hasPermission("facility:update") ||
    appStore.hasAnyRole(["verifikator", "super_admin"]));

// Computed property to check if there are active filters
const hasActiveFilters = computed(() => {
  return !!(
    filterLocation.value.province ||
    filterLocation.value.regency ||
    filterLocation.value.district ||
    filterLocation.value.village ||
    searchQuery.value
  );
});

// Location filter names (fetched from API)
const currentLocationFilters = ref([]);
const locationFiltersLoading = ref(false);

// Fetch location names from API
const loadLocationFilters = async () => {
  const userData = localStorage.getItem("user-data");
  if (!userData) {
    currentLocationFilters.value = [];
    return;
  }

  try {
    const user = JSON.parse(userData);
    const filterList = [];
    locationFiltersLoading.value = true;

    // Fetch province name
    if (user.assignedProvinceId) {
      try {
        const response = await locationAPI.getProvince(user.assignedProvinceId);
        if (response.success && response.data?.province) {
          filterList.push(`Provinsi: ${response.data.province.name}`);
        } else {
          filterList.push(`Provinsi: ${user.assignedProvinceId}`);
        }
      } catch (error) {
        console.error("Error fetching province:", error);
        filterList.push(`Provinsi: ${user.assignedProvinceId}`);
      }
    }

    // Fetch regency name
    if (user.assignedRegencyId) {
      try {
        const response = await locationAPI.getRegency(user.assignedRegencyId);
        if (response.success && response.data?.regency) {
          filterList.push(`Kabupaten/Kota: ${response.data.regency.name}`);
        } else {
          filterList.push(`Kabupaten/Kota: ${user.assignedRegencyId}`);
        }
      } catch (error) {
        console.error("Error fetching regency:", error);
        filterList.push(`Kabupaten/Kota: ${user.assignedRegencyId}`);
      }
    }

    // Fetch district name
    if (user.assignedDistrictId) {
      try {
        const response = await locationAPI.getDistrict(user.assignedDistrictId);
        if (response.success && response.data?.district) {
          filterList.push(`Kecamatan: ${response.data.district.name}`);
        } else {
          filterList.push(`Kecamatan: ${user.assignedDistrictId}`);
        }
      } catch (error) {
        console.error("Error fetching district:", error);
        filterList.push(`Kecamatan: ${user.assignedDistrictId}`);
      }
    }

    // Fetch village name
    if (user.assignedVillageId) {
      try {
        const response = await locationAPI.getVillage(user.assignedVillageId);
        if (response.success && response.data?.village) {
          filterList.push(`Kelurahan: ${response.data.village.name}`);
        } else {
          filterList.push(`Kelurahan: ${user.assignedVillageId}`);
        }
      } catch (error) {
        console.error("Error fetching village:", error);
        filterList.push(`Kelurahan: ${user.assignedVillageId}`);
      }
    }

    currentLocationFilters.value = filterList;
  } catch (error) {
    console.error("Error parsing user data for location filters:", error);
    currentLocationFilters.value = [];
  } finally {
    locationFiltersLoading.value = false;
  }
};

// Options
const reviewStatusOptions = [
  { title: "Disetujui", value: "approved" },
  { title: "Ditolak", value: "rejected" },
];

// Validation rules
const rules = {
  required: (value) => !!value || "Field is required",
};

const reviewNotesRules = computed(() => {
  if (reviewData.value.status === "rejected") {
    return [rules.required];
  }
  return [];
});

// Methods
const buildQueryParams = (override = {}) => ({
  page: pagination.value.currentPage,
  limit: pagination.value.itemsPerPage,
  status: filters.value.status || undefined,
  provinceId: filterLocation.value.province?.id,
  regencyId: filterLocation.value.regency?.id,
  districtId: filterLocation.value.district?.id,
  villageId: filterLocation.value.village?.id,
  ...override,
});

const buildStatisticsParams = (params = {}) => {
  const payload = {
    provinceId: params.provinceId,
    regencyId: params.regencyId,
    districtId: params.districtId,
    villageId: params.villageId,
  };
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );
};

const loadStatistics = async (params = {}) => {
  const statsParams = buildStatisticsParams(params);
  const cacheKey = JSON.stringify(statsParams);
  if (cacheKey === statisticsCacheKey.value) {
    return;
  }
  statisticsCacheKey.value = cacheKey;
  statisticsLoading.value = true;
  try {
    const response = await facilityAPI.getStatistics(statsParams);
    if (response?.success) {
      statistics.value = response.data || null;
    } else {
      statistics.value = null;
    }
  } catch (error) {
    console.error("Error loading infrastructure statistics:", error);
    statistics.value = null;
  } finally {
    statisticsLoading.value = false;
  }
};

const getReviewerInfo = (user) => {
  if (!user) return null;
  return {
    fullName: user.fullName || user.name || user.email || "N/A",
    email: user.email || "",
  };
};

const mapSurveyListItem = (survey) => ({
  id: survey.id,
  status: survey.status,
  verificationStatus: survey.verificationStatus,
  villageName: survey.village?.name || "N/A",
  population: survey.villageInfo?.populationCount ?? null,
  submittedAt: survey.submittedAt || survey.createdAt || null,
  reviewedAt: survey.verifiedAt || null,
  reviewer: getReviewerInfo(survey.verifier),
  location: {
    province: survey.province,
    regency: survey.regency,
    district: survey.district,
    village: survey.village,
  },
});

const normalizeFacilityList = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: item.id,
      type: item.type || "",
      name: item.name || "",
    }))
    .filter((item) => item.name);
};

const formatFacilityLabel = (item) => {
  if (!item) return "";
  const type = item.type ? `${item.type} - ` : "";
  return `${type}${item.name || ""}`.trim();
};

const parseVillageInfoValue = (notes, label) => {
  if (!notes) return null;
  const pattern = new RegExp(`${label}\\s*:\\s*([^|]+)`, "i");
  const match = String(notes).match(pattern);
  return match ? match[1].trim() : null;
};

const parseNumericNote = (notes, label) => {
  const raw = parseVillageInfoValue(notes, label);
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return Number(digits);
};

const buildTransportServices = (transportation) => {
  if (!transportation) return [];
  const services = [];
  if (transportation.busRouteCount) services.push("Bus");
  if (transportation.angkotRouteCount) services.push("Angkot");
  if (transportation.otherTransportCount) {
    services.push("Lainnya (misalnya perahu, kapal laut)");
  }
  return services;
};

const mapSurveyDetail = (survey) => ({
  id: survey.id,
  status: survey.status,
  verificationStatus: survey.verificationStatus,
  submittedAt: survey.submittedAt || survey.createdAt || null,
  reviewedAt: survey.verifiedAt || null,
  reviewer: getReviewerInfo(survey.verifier),
  profil: {
    namaDesa: survey.village?.name || "",
    jumlahPenduduk: survey.villageInfo?.populationCount ?? null,
    jumlahKK:
      parseNumericNote(survey.villageInfo?.notes, "Jumlah KK") ??
      survey.villageInfo?.householdCount ??
      null,
    jumlahRumah:
      parseNumericNote(survey.villageInfo?.notes, "Jumlah Rumah") ??
      survey.villageInfo?.houseCount ??
      null,
  },
  pendidikan: normalizeFacilityList(survey.education),
  kesehatan: normalizeFacilityList(survey.health),
  peribadatan: normalizeFacilityList(survey.religious),
  listrik: {
    tercakupSeluruhDesa: survey.electricity?.isFullCoverage ?? null,
    wilayahBelumTerjangkau: survey.electricity?.uncoveredDusunCount ?? null,
  },
  jaringanListrik: {
    tercakupSeluruhWilayah: survey.electricity?.isFullCoverage ?? null,
    wilayahBelumTerjangkau: survey.electricity?.uncoveredDusunCount ?? null,
  },
  airBersih: {
    jumlahSpam: survey.water?.spamCount ?? null,
  },
  jaringanAirBersih: {
    jumlahSPAM: survey.water?.spamCount ?? null,
  },
  telepon: {
    jumlahOperator: survey.telecom?.operatorCount ?? null,
    wilayahBelumTerjangkau: survey.telecom?.uncoveredDusunCount ?? null,
  },
  jaringanTelepon: {
    jumlahOperator: survey.telecom?.operatorCount ?? null,
    wilayahBelumTerjangkau: survey.telecom?.uncoveredDusunCount ?? null,
  },
  transportasi: {
    layananAngkutanUmum: buildTransportServices(survey.transportation),
    layananLainnya: survey.transportation?.otherTransportType || null,
  },
  jaringanTransportasi: {
    layananAngkutanUmum: buildTransportServices(survey.transportation),
    layananLainnya: survey.transportation?.otherTransportType || null,
  },
  perniagaan: normalizeFacilityList(survey.commercial),
  pelayananUmum: normalizeFacilityList(survey.publicServices),
  rekreasi: normalizeFacilityList(survey.recreation),
  pemakaman: normalizeFacilityList(survey.cemetery),
  pertamanan: normalizeFacilityList(survey.greenSpace),
  parkir: normalizeFacilityList(survey.parking),
  jaringanGas: {
    jumlahAgenGas: survey.gas?.gasAgentCount ?? null,
  },
  pemadamKebakaran: {
    mobilDamkar: survey.fireDepartment?.fireTruckCount ?? null,
    pengelola: survey.fireDepartment?.fireManager || null,
    APAR: survey.fireDepartment?.aparCount ?? null,
  },
  peneranganJalan: {
    jumlahLampuJalan: survey.streetLighting?.streetLightCount ?? null,
  },
});

const loadData = async () => {
  isLoading.value = true;
  try {
    const params = buildQueryParams({ search: searchQuery.value.trim() });

    await loadStatistics(params);
    const response = await facilityAPI.getSurveys(params);
    if (response?.success === false) {
      throw new Error(response.message || "Gagal memuat data survei.");
    }
    const result = response?.data || {};
    const surveys = result.surveys || [];
    submissions.value = surveys.map(mapSurveyListItem);

    const paginationData = result.pagination || {};
    pagination.value = {
      currentPage:
        paginationData.currentPage ||
        paginationData.page ||
        pagination.value.currentPage,
      totalPages: paginationData.totalPages || paginationData.pages || 0,
      totalItems: paginationData.totalItems || paginationData.total || 0,
      itemsPerPage:
        paginationData.itemsPerPage ||
        paginationData.limit ||
        pagination.value.itemsPerPage,
      hasNextPage:
        paginationData.hasNextPage ?? paginationData.hasNext ?? false,
      hasPrevPage:
        paginationData.hasPrevPage ?? paginationData.hasPrev ?? false,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    submissions.value = [];
    pagination.value = {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 20,
      hasNextPage: false,
      hasPrevPage: false,
    };
  } finally {
    isLoading.value = false;
  }
};

const applyFocusFromRoute = async () => {
  const focusId = getFocusIdFromRoute();
  if (!focusId) return false;

  focusedRowId.value = focusId;
  let focusQuery = "";

  try {
    const response = await facilityAPI.getSurvey(focusId);
    const survey = response?.data?.survey;
    focusQuery =
      survey?.village?.name ||
      survey?.villageName ||
      survey?.location?.village?.name ||
      "";
  } catch (error) {
    console.error("Error loading focus survey:", error);
  }

  if (focusQuery) {
    searchQuery.value = focusQuery;
  }
  pagination.value.currentPage = 1;
  await loadData();
  await scrollToSearchResult();
  return true;
};

const highlightText = (text, query) => {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery || !text) return text;
  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return String(text).replace(
    regex,
    '<mark class="bg-yellow-lighten-3 font-weight-bold">$1</mark>'
  );
};

const scrollToSearchResult = async () => {
  await nextTick();
  const wrapper = tableWrapperRef.value;
  if (!wrapper) return;
  if (focusedRowId.value) {
    const focusedRow = wrapper.querySelector(
      `[data-row-id="${focusedRowId.value}"]`
    );
    if (focusedRow) {
      focusedRow.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }
  const normalizedQuery = String(searchQuery.value || "").trim();
  const match = normalizedQuery
    ? wrapper.querySelector("mark.bg-yellow-lighten-3")
    : null;
  if (match) {
    match.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
};

const debouncedSearch = debounce(async () => {
  pagination.value.currentPage = 1;
  await loadData();
  await scrollToSearchResult();
}, 500);

const applyFilters = () => {
  pagination.value.currentPage = 1;
  loadData();
};

// Mock location data for filters (same as form.vue)
const mockLocationData = {
  provinces: [
    { id: "prov-dki", name: "DKI Jakarta" },
    { id: "prov-jabar", name: "Jawa Barat" },
    { id: "prov-banten", name: "Banten" },
  ],
  regencies: {
    "prov-dki": [
      { id: "reg-jaksel", name: "Kota Jakarta Selatan" },
      { id: "reg-jakbar", name: "Kota Jakarta Barat" },
      { id: "reg-jakpus", name: "Kota Jakarta Pusat" },
    ],
    "prov-jabar": [
      { id: "reg-bandung", name: "Kabupaten Bandung" },
      { id: "reg-bekasi", name: "Kabupaten Bekasi" },
      { id: "reg-bogor", name: "Kabupaten Bogor" },
    ],
    "prov-banten": [
      { id: "reg-tangerang", name: "Kabupaten Tangerang" },
      { id: "reg-serang", name: "Kabupaten Serang" },
      { id: "reg-lebak", name: "Kabupaten Lebak" },
    ],
  },
  districts: {
    "reg-jaksel": [
      { id: "dist-kebayoran", name: "Kebayoran Baru" },
      { id: "dist-pesanggrahan", name: "Pesanggrahan" },
    ],
    "reg-jakbar": [
      { id: "dist-cengkareng", name: "Cengkareng" },
      { id: "dist-palmerah", name: "Palmerah" },
    ],
    "reg-jakpus": [
      { id: "dist-gambir", name: "Gambir" },
      { id: "dist-senen", name: "Senen" },
    ],
    "reg-bandung": [
      { id: "dist-cileunyi", name: "Kecamatan Cileunyi" },
      { id: "dist-dayeuhkolot", name: "Kecamatan Dayeuhkolot" },
    ],
    "reg-bekasi": [
      { id: "dist-tambun", name: "Kecamatan Tambun" },
      { id: "dist-cikarang", name: "Kecamatan Cikarang" },
    ],
    "reg-bogor": [
      { id: "dist-cibinong", name: "Kecamatan Cibinong" },
      { id: "dist-dramaga", name: "Kecamatan Dramaga" },
    ],
    "reg-tangerang": [
      { id: "dist-balaraja", name: "Kecamatan Balaraja" },
      { id: "dist-cikupa", name: "Kecamatan Cikupa" },
    ],
    "reg-serang": [
      { id: "dist-anyar", name: "Kecamatan Anyar" },
      { id: "dist-cinangka", name: "Kecamatan Cinangka" },
    ],
    "reg-lebak": [
      { id: "dist-panggarangan", name: "Kecamatan Panggarangan" },
      { id: "dist-sajira", name: "Kecamatan Sajira" },
    ],
  },
  villages: {
    "dist-kebayoran": [
      { id: "vill-senayan", name: "Kelurahan Senayan" },
      { id: "vill-gandaria", name: "Kelurahan Kramat Pela" },
    ],
    "dist-pesanggrahan": [
      { id: "vill-bintaro", name: "Kelurahan Bintaro" },
      { id: "vill-urt", name: "Kelurahan Ulujami" },
    ],
    "dist-cengkareng": [
      { id: "vill-cengkareng", name: "Kelurahan Cengkareng" },
      { id: "vill-kapuk", name: "Kelurahan Kapuk" },
    ],
    "dist-palmerah": [
      { id: "vill-palmerah", name: "Kelurahan Palmerah" },
      { id: "vill-kemanggisan", name: "Kelurahan Kemanggisan" },
    ],
    "dist-gambir": [
      { id: "vill-gambir", name: "Kelurahan Gambir" },
      { id: "vill-cideng", name: "Kelurahan Cideng" },
    ],
    "dist-senen": [
      { id: "vill-senen", name: "Kelurahan Senen" },
      { id: "vill-kwitang", name: "Kelurahan Kwitang" },
    ],
    "dist-cileunyi": [
      { id: "vill-cileunyi", name: "Kelurahan Cileunyi" },
      { id: "vill-cikeruh", name: "Kelurahan Cikeruh" },
    ],
    "dist-dayeuhkolot": [
      { id: "vill-dayeuhkolot", name: "Kelurahan Dayeuhkolot" },
      { id: "vill-cilampeni", name: "Kelurahan Cilampeni" },
    ],
    "dist-tambun": [
      { id: "vill-tambun", name: "Kelurahan Tambun" },
      { id: "vill-tambun-selatan", name: "Kelurahan Tambun Selatan" },
    ],
    "dist-cikarang": [
      { id: "vill-cikarang", name: "Kelurahan Cikarang" },
      { id: "vill-cikarang-baru", name: "Kelurahan Cikarang Baru" },
    ],
    "dist-cibinong": [
      { id: "vill-cibinong", name: "Kelurahan Cibinong" },
      { id: "vill-cibinong-ngasem", name: "Kelurahan Cibinong Ngasem" },
    ],
    "dist-dramaga": [
      { id: "vill-dramaga", name: "Kelurahan Dramaga" },
      { id: "vill-citeureup", name: "Kelurahan Citeureup" },
    ],
    "dist-balaraja": [
      { id: "vill-balaraja", name: "Kelurahan Balaraja" },
      { id: "vill-talagasari", name: "Kelurahan Talagasari" },
    ],
    "dist-cikupa": [
      { id: "vill-cikupa", name: "Kelurahan Cikupa" },
      { id: "vill-budi", name: "Kelurahan Budi Mulya" },
    ],
    "dist-anyar": [
      { id: "vill-anyar", name: "Kelurahan Anyar" },
      { id: "vill-kadubeureum", name: "Kelurahan Kadubeureum" },
    ],
    "dist-cinangka": [
      { id: "vill-cinangka", name: "Kelurahan Cinangka" },
      { id: "vill-bantarwangi", name: "Kelurahan Bantarwangi" },
    ],
    "dist-panggarangan": [
      { id: "vill-panggarangan", name: "Kelurahan Panggarangan" },
      { id: "vill-sogong", name: "Kelurahan Sogong" },
    ],
    "dist-sajira": [
      { id: "vill-sajira", name: "Kelurahan Sajira" },
      { id: "vill-parungsari", name: "Kelurahan Parungsari" },
    ],
  },
};

// Fetch functions for filter location
const fetchFilterProvinces = async () => {
  filterLocationLoading.provinces = true;
  try {
    const response = await locationAPI.getProvinces();
    if (response.success && response.data?.provinces) {
      filterProvinceOptions.value = response.data.provinces.map((province) => ({
        id: province.id,
        name: province.name,
        code: province.code,
      }));
    } else {
      // Fallback to mock data if API fails
      console.warn("Failed to fetch provinces from API, using mock data");
      filterProvinceOptions.value = mockLocationData.provinces;
    }
  } catch (error) {
    console.error("Error fetching provinces:", error);
    // Fallback to mock data on error
    filterProvinceOptions.value = mockLocationData.provinces;
  } finally {
    filterLocationLoading.provinces = false;
  }
};

const fetchFilterRegencies = async (provinceId) => {
  if (!provinceId) return;
  filterLocationLoading.regencies = true;
  try {
    const response = await locationAPI.getRegencies(provinceId);
    if (response.success && response.data?.regencies) {
      filterRegencyOptions.value = response.data.regencies.map((regency) => ({
        id: regency.id,
        name: regency.name,
        code: regency.code,
        type: regency.type,
      }));
    } else {
      // Fallback to mock data if API fails
      console.warn("Failed to fetch regencies from API, using mock data");
      filterRegencyOptions.value = mockLocationData.regencies[provinceId] ?? [];
    }
  } catch (error) {
    console.error("Error fetching regencies:", error);
    // Fallback to mock data on error
    filterRegencyOptions.value = mockLocationData.regencies[provinceId] ?? [];
  } finally {
    filterLocationLoading.regencies = false;
  }
};

const fetchFilterDistricts = async (regencyId) => {
  if (!regencyId) return;
  filterLocationLoading.districts = true;
  try {
    const response = await locationAPI.getDistricts(regencyId);
    if (response.success && response.data?.districts) {
      filterDistrictOptions.value = response.data.districts.map((district) => ({
        id: district.id,
        name: district.name,
        code: district.code,
      }));
    } else {
      // Fallback to mock data if API fails
      console.warn("Failed to fetch districts from API, using mock data");
      filterDistrictOptions.value = mockLocationData.districts[regencyId] ?? [];
    }
  } catch (error) {
    console.error("Error fetching districts:", error);
    // Fallback to mock data on error
    filterDistrictOptions.value = mockLocationData.districts[regencyId] ?? [];
  } finally {
    filterLocationLoading.districts = false;
  }
};

const fetchFilterVillages = async (districtId) => {
  if (!districtId) return;
  filterLocationLoading.villages = true;
  try {
    const response = await locationAPI.getVillages(districtId);
    if (response.success && response.data?.villages) {
      filterVillageOptions.value = response.data.villages.map((village) => ({
        id: village.id,
        name: village.name,
        code: village.code,
      }));
    } else {
      // Fallback to mock data if API fails
      console.warn("Failed to fetch villages from API, using mock data");
      filterVillageOptions.value = mockLocationData.villages[districtId] ?? [];
    }
  } catch (error) {
    console.error("Error fetching villages:", error);
    // Fallback to mock data on error
    filterVillageOptions.value = mockLocationData.villages[districtId] ?? [];
  } finally {
    filterLocationLoading.villages = false;
  }
};

// Watchers for cascaded filter location dropdowns
watch(
  () => filterLocation.value.province,
  async (province) => {
    filterLocation.value.regency = null;
    filterLocation.value.district = null;
    filterLocation.value.village = null;
    filterRegencyOptions.value = [];
    filterDistrictOptions.value = [];
    filterVillageOptions.value = [];
    if (province?.id) {
      await fetchFilterRegencies(province.id);
    }
    applyFilters();
  }
);

watch(
  () => filterLocation.value.regency,
  async (regency) => {
    filterLocation.value.district = null;
    filterLocation.value.village = null;
    filterDistrictOptions.value = [];
    filterVillageOptions.value = [];
    if (regency?.id) {
      await fetchFilterDistricts(regency.id);
    }
    applyFilters();
  }
);

watch(
  () => filterLocation.value.district,
  async (district) => {
    filterLocation.value.village = null;
    filterVillageOptions.value = [];
    if (district?.id) {
      await fetchFilterVillages(district.id);
    }
    applyFilters();
  }
);

watch(
  () => filterLocation.value.village,
  () => {
    applyFilters();
  }
);

// Handle filter location change manually
const handleFilterLocationChange = () => {
  applyFilters();
};

const clearFilters = () => {
  filters.value.status = null;
  searchQuery.value = "";
  filterLocation.value = {
    province: null,
    regency: null,
    district: null,
    village: null,
  };
  filterRegencyOptions.value = [];
  filterDistrictOptions.value = [];
  filterVillageOptions.value = [];
  pagination.value.currentPage = 1;
  loadData();
};

const openExportDialog = () => {
  exportError.value = "";
  exportDialogOpen.value = true;
};

const buildExportParams = () => {
  const params = {
    status: filters.value.status || undefined,
    provinceId: filterLocation.value.province?.id,
    regencyId: filterLocation.value.regency?.id,
    districtId: filterLocation.value.district?.id,
    villageId: filterLocation.value.village?.id,
  };

  Object.keys(params).forEach((key) => {
    if (
      params[key] === undefined ||
      params[key] === null ||
      params[key] === ""
    ) {
      delete params[key];
    }
  });

  return params;
};

const buildExportFilterSummary = () => {
  if (exportScope.value === "all") {
    return "Semua data";
  }

  const parts = [];
  if (filters.value.status) {
    parts.push(`Status: ${getStatusLabel(filters.value.status)}`);
  }
  if (filterLocation.value.village?.name) {
    parts.push(`Kelurahan: ${filterLocation.value.village.name}`);
  }
  if (filterLocation.value.district?.name) {
    parts.push(`Kecamatan: ${filterLocation.value.district.name}`);
  }
  if (filterLocation.value.regency?.name) {
    parts.push(`Kabupaten: ${filterLocation.value.regency.name}`);
  }
  if (filterLocation.value.province?.name) {
    parts.push(`Provinsi: ${filterLocation.value.province.name}`);
  }

  return parts.length ? parts.join(" | ") : "Tidak ada filter";
};

const handleExport = async () => {
  exportError.value = "";
  if (!exportCategoryIds.value.length) {
    exportError.value = "Pilih minimal satu kategori kolom.";
    return;
  }

  exportLoading.value = true;
  try {
    const params = exportScope.value === "filtered" ? buildExportParams() : {};
    const response = await exportAPI.getData("facility", {
      ...params,
      format: "json",
    });
    if (response?.success === false) {
      throw new Error(response.message || "Gagal memuat data ekspor.");
    }
    const rows = response?.data?.items || [];

    if (!rows.length) {
      exportError.value = "Data ekspor kosong.";
      return;
    }

    const columns = getColumnsForCategories(
      infrastructureExportCategories,
      exportCategoryIds.value
    );
    const metaRows = buildMetaRows({
      title: "Ekspor Data Survei Infrastruktur",
      scopeLabel:
        exportScope.value === "all"
          ? "Semua Data"
          : exportScope.value === "filtered"
          ? "Data yang Difilter"
          : "Semua Data",
      filterSummary: buildExportFilterSummary(),
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    await exportToExcel({
      sheetName: "Infrastruktur",
      fileName: `export-infrastruktur-${dateStamp}.xlsx`,
      columns,
      rows,
      metaRows,
    });
    exportDialogOpen.value = false;
  } catch (error) {
    console.error("Export error:", error);
    exportError.value = error?.message || "Terjadi kesalahan saat ekspor.";
  } finally {
    exportLoading.value = false;
  }
};

const refreshData = () => {
  loadData();
};

const handlePageChange = (page) => {
  pagination.value.currentPage = page;
  loadData();
};

const handleItemsPerPageChange = (itemsPerPage) => {
  pagination.value.itemsPerPage = itemsPerPage;
  pagination.value.currentPage = 1;
  loadData();
};

const markUnderReview = async (item) => {
  if (!item?.id) return;
  if (!canReviewSubmission(item)) return;
  if (resolveItemStatus(item) !== "submitted") return;

  try {
    await facilityAPI.verifySurvey(item.id, {
      status: "under_review",
      reviewNotes: "",
    });
    await loadData();
  } catch (error) {
    console.error("Error marking under review:", error);
  }
};

const viewSubmission = async (item) => {
  showDetailDialog.value = true;
  activeTab.value = "profil";
  selectedSubmission.value = null;
  isLoading.value = true;
  try {
    const response = await facilityAPI.getSurvey(item.id);
    if (response?.success === false) {
      throw new Error(response.message || "Gagal memuat detail survei.");
    }
    const survey = response?.data?.survey;
    if (!survey) {
      throw new Error("Data survei tidak ditemukan.");
    }
    selectedSubmission.value = mapSurveyDetail(survey);
    await markUnderReview(item);
  } catch (error) {
    console.error("Error loading submission detail:", error);
    showSnackbar(error?.message || "Gagal memuat detail survei.", "error");
    showDetailDialog.value = false;
  } finally {
    isLoading.value = false;
  }
};

const goToEditForm = (item) => {
  if (!item?.id) return;
  router.push({ path: "/infrastructure-form", query: { edit: item.id } });
};

const reviewSubmission = (item, status) => {
  selectedSubmission.value = item;
  if (status === "rejected") {
    reviewData.value = {
      status,
      reviewNotes: "",
    };
    reviewFormValid.value = false;
    showReviewDialog.value = true;
    return;
  }
  submitReviewDirect(item, status);
};

const submitReviewDirect = async (item, status) => {
  if (!item?.id) return;
  isLoading.value = true;
  try {
    const response = await facilityAPI.verifySurvey(item.id, {
      status,
      reviewNotes: "",
    });
    if (response?.success === false) {
      throw new Error(response.message || "Gagal memproses survei.");
    }
    await loadData();
    if (status === "approved") {
      await mapStore.fetchInfrastruktur();
    }
  } catch (error) {
    console.error("Error reviewing submission:", error);
    showSnackbar(error?.message || "Gagal memproses survei.", "error");
  } finally {
    isLoading.value = false;
  }
};

const submitReview = async () => {
  if (!reviewFormRef.value) return;
  const { valid } = await reviewFormRef.value.validate();
  if (!valid) return;
  if (!selectedSubmission.value?.id) return;

  isLoading.value = true;
  try {
    const status = reviewData.value.status;
    const response = await facilityAPI.verifySurvey(
      selectedSubmission.value.id,
      reviewData.value
    );
    if (response?.success === false) {
      throw new Error(response.message || "Gagal memproses survei.");
    }
    showReviewDialog.value = false;
    await loadData();
    if (status === "approved") {
      await mapStore.fetchInfrastruktur();
    }
  } catch (error) {
    console.error("Error reviewing submission:", error);
    showSnackbar(error?.message || "Gagal memproses survei.", "error");
  } finally {
    isLoading.value = false;
  }
};

const openDeleteDialog = (submission) => {
  deleteDialog.item = submission;
  deleteDialog.show = true;
};

const closeDeleteDialog = () => {
  deleteDialog.show = false;
  deleteDialog.item = null;
  deleteDialog.loading = false;
};

const confirmDelete = async () => {
  if (!deleteDialog.item?.id || deleteDialog.loading) return;
  deleteDialog.loading = true;
  try {
    const response = await facilityAPI.deleteSurvey(deleteDialog.item.id);
    if (response.success) {
      showSnackbar("Data survei berhasil dihapus permanen.", "success");
      closeDeleteDialog();
      await loadData();
      await mapStore.fetchInfrastruktur();
      mapStore.signalRefresh();
    } else {
      showSnackbar(response.message || "Gagal menghapus data.", "error");
    }
  } catch (error) {
    showSnackbar(error?.message || "Gagal menghapus data.", "error");
  } finally {
    deleteDialog.loading = false;
  }
};

// Utility functions
const getStatusColor = (status) => {
  if (!status) return "grey";
  const colors = {
    draft: "grey",
    submitted: "blue",
    verified: "amber",
    under_review: "amber",
    approved: "green",
    rejected: "red",
  };
  return colors[status] || "grey";
};

const getStatusIcon = (status) => {
  if (!status) return "mdi-help-circle";
  const icons = {
    draft: "mdi-file-outline",
    submitted: "mdi-file-send-outline",
    verified: "mdi-file-eye-outline",
    under_review: "mdi-file-eye-outline",
    approved: "mdi-file-check-outline",
    rejected: "mdi-file-remove-outline",
  };
  return icons[status] || "mdi-help-circle";
};

const getStatusLabel = (status) => {
  if (!status) return "Tidak Dikenal";
  const labels = {
    draft: "Draft",
    submitted: "Diajukan",
    verified: "Dalam Review",
    under_review: "Dalam Review",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  return labels[status] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const formatTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Time";
  }
};

// Lifecycle
onMounted(async () => {
  try {
    await fetchFilterProvinces();
    await loadLocationFilters();
    const handledFocus = await applyFocusFromRoute();
    if (!handledFocus) {
      await loadData();
    }
  } catch (error) {
    console.error("Error in onMounted:", error);
  }
});

// Watch for filter changes
watch(
  () => filters.value.status,
  () => {
    applyFilters();
  }
);
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}

.data-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  min-width: 720px;
}

.data-table-row--focused {
  background-color: rgba(255, 235, 59, 0.18);
}

@media (max-width: 600px) {
  .v-card-title {
    row-gap: 8px;
  }

  .data-table {
    min-width: 640px;
  }
}
</style>
