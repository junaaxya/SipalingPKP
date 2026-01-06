<template>
  <div>
    <!-- Loading Overlay -->
    <v-overlay :model-value="isLoading" class="align-center justify-center">
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>

    <v-container fluid class="px-2 px-sm-6 py-4">
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
                mdi-home-search
              </v-icon>

              <div class="text-center text-sm-left">
                <h2 class="text-h6 text-sm-h5 font-weight-bold mb-1">
                  Data Survei Rumah Masyarakat
                </h2>
                <p
                  class="text-tiny-mobile text-sm-subtitle-1 text-medium-emphasis mb-0"
                >
                  Kelola dan tinjau formulir survei rumah masyarakat yang telah
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
                    label="Cari Nama Pemilik"
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
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="filters.status"
                        label="Status"
                        :items="statusOptions"
                        clearable
                        variant="outlined"
                        density="compact"
                        @update:model-value="applyFilters"
                      />
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-select
                        v-model="filters.housingStatus"
                        label="Status Rumah"
                        :items="housingStatusOptions"
                        clearable
                        variant="outlined"
                        density="compact"
                        @update:model-value="applyFilters"
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
                      v-if="canCreateHousing"
                      color="primary"
                      to="/form"
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
                  v-if="canExportHousing"
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

            <div class="data-table-wrapper">
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

                <!-- Status Layak Huni Column -->
                <template #item.isLivable="{ item }">
                  <v-chip
                    :color="item.isLivable ? 'success' : 'error'"
                    variant="tonal"
                    size="small"
                  >
                    <v-icon
                      :icon="
                        item.isLivable ? 'mdi-home-check' : 'mdi-home-alert'
                      "
                      start
                      size="small"
                    />
                    {{
                      item.isLivable !== undefined && item.isLivable !== null
                        ? item.isLivable
                          ? "Layak Huni"
                          : "Tidak Layak Huni"
                        : "N/A"
                    }}
                  </v-chip>
                </template>

                <!-- Owner Name Column -->
                <template #item.ownerName="{ item }">
                  <div>
                    <div class="font-weight-medium">
                      {{ item.householdOwner?.ownerName || "N/A" }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ item.householdOwner?.headOfFamilyName || "N/A" }}
                    </div>
                  </div>
                </template>

                <!-- No KK Column -->
                <template #item.familyCardNumber="{ item }">
                  <span class="text-body-2">
                    {{ formatNoKk(getNoKkValue(item)) }}
                  </span>
                </template>

                <!-- Address Column -->
                <template #item.address="{ item }">
                  <div>
                    <div class="text-body-2">
                      {{ item.householdOwner?.houseNumber || "N/A" }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      RT {{ item.householdOwner?.rt || "N/A" }} / RW
                      {{ item.householdOwner?.rw || "N/A" }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ item.householdOwner?.village?.name || "N/A" }}
                    </div>
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
                      color="warning"
                      @click="openEditDialog(item)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                      <v-tooltip activator="parent" location="top">
                        Edit Form
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
                  </div>
                </template>

                <!-- Empty State -->
                <template #no-data>
                  <div class="text-center py-8">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">
                      mdi-home-search-outline
                    </v-icon>
                    <h3 class="text-h6 text-medium-emphasis mb-2">
                      Tidak Ada Data Survei Ditemukan
                    </h3>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                      Tidak ada pengajuan survei rumah masyarakat yang sesuai
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

            <div class="text-subtitle-2 mb-2">Kategori Kolom (Data Rumah)</div>
            <v-checkbox
              v-model="exportAllCategories"
              label="Semua Kategori"
              hide-details
            />
            <v-row>
              <v-col
                v-for="category in housingExportCategories"
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
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2"> mdi-file-document-outline </v-icon>
            Detail Survei Rumah Masyarakat
            <v-spacer />
            <v-btn
              v-if="selectedSubmission && canEditSubmission(selectedSubmission)"
              color="warning"
              variant="tonal"
              class="mr-2"
              @click="openEditDialog(selectedSubmission)"
            >
              <v-icon start> mdi-pencil </v-icon>
              Edit Sambil Tinjau
            </v-btn>
            <v-btn icon="mdi-close" variant="text" @click="closeDetailDialog" />
          </v-card-title>

          <v-card-text v-if="!selectedSubmission && isLoading">
            <div class="d-flex align-center justify-center py-12">
              <v-progress-circular color="primary" indeterminate size="64" />
            </div>
          </v-card-text>

          <v-card-text v-else-if="selectedSubmission">
            <v-row class="mb-4">
              <v-col cols="12" md="7">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="d-flex flex-wrap align-center mb-3">
                      <v-chip
                        :color="
                          getStatusColor(resolveItemStatus(selectedSubmission))
                        "
                        variant="tonal"
                        class="mr-2 mb-2"
                      >
                        <v-icon
                          :icon="
                            getStatusIcon(resolveItemStatus(selectedSubmission))
                          "
                          start
                          size="small"
                        />
                        {{
                          getStatusLabel(resolveItemStatus(selectedSubmission))
                        }}
                      </v-chip>
                      <v-chip
                        v-if="selectedSubmission.reviewNotes"
                        color="red"
                        variant="tonal"
                        class="mb-2"
                      >
                        Ada catatan penolakan
                      </v-chip>
                    </div>
                    <v-row>
                      <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">
                          Tanggal Diajukan
                        </div>
                        <div class="text-body-1">
                          {{ formatDate(selectedSubmission.submittedAt) }}
                        </div>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">
                          Verifikator
                        </div>
                        <div class="text-body-1">
                          {{
                            selectedSubmission.reviewer?.fullName ||
                            "Belum ditinjau"
                          }}
                        </div>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">
                          Lokasi
                        </div>
                        <div class="text-body-1">
                          {{
                            selectedSubmission.householdOwner?.village?.name ||
                            "N/A"
                          }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{
                            selectedSubmission.householdOwner?.district?.name ||
                            "N/A"
                          }},
                          {{
                            selectedSubmission.householdOwner?.regency?.name ||
                            "N/A"
                          }}
                        </div>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <div class="text-caption text-medium-emphasis">
                          Koordinat
                        </div>
                        <div class="text-body-1">
                          {{
                            selectedSubmission.householdOwner?.latitude ||
                            "N/A"
                          }},
                          {{
                            selectedSubmission.householdOwner?.longitude ||
                            "N/A"
                          }}
                        </div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="5">
                <v-card variant="outlined">
                  <v-card-title class="text-subtitle-1">
                    Foto Bukti Lapangan
                  </v-card-title>
                  <v-card-text>
                    <v-row v-if="detailPhotos.length">
                      <v-col cols="12">
                        <v-img
                          :src="detailPhotos[0].url"
                          height="220"
                          cover
                          class="rounded-lg"
                        />
                        <div class="text-caption mt-1">
                          {{ detailPhotos[0].label }}
                        </div>
                      </v-col>
                      <v-col
                        v-for="photo in detailPhotos.slice(1)"
                        :key="photo.id"
                        cols="6"
                      >
                        <v-img
                          :src="photo.url"
                          height="140"
                          cover
                          class="rounded-lg"
                        />
                        <div class="text-caption mt-1">
                          {{ photo.label }}
                        </div>
                      </v-col>
                    </v-row>
                    <div v-else class="text-caption text-medium-emphasis">
                      Belum ada foto dokumentasi.
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1 d-flex align-center">
                <v-icon size="18" class="mr-2">
                  mdi-timeline-text-outline
                </v-icon>
                Riwayat Survei Warga
              </v-card-title>
              <v-card-text>
                <div
                  v-if="submissionHistoryLoading"
                  class="d-flex align-center justify-center py-6"
                >
                  <v-progress-circular
                    color="primary"
                    indeterminate
                    size="32"
                  />
                </div>
                <div
                  v-else-if="submissionHistoryError"
                  class="text-caption text-error"
                >
                  {{ submissionHistoryError }}
                </div>
                <div
                  v-else-if="!submissionHistory.length"
                  class="text-caption text-medium-emphasis"
                >
                  Belum ada riwayat survei untuk warga ini.
                </div>
                <v-timeline v-else align="start" density="compact">
                  <v-timeline-item
                    v-for="item in submissionHistory"
                    :key="item.id"
                    :dot-color="getStatusColor(resolveItemStatus(item))"
                    size="small"
                  >
                    <template #opposite>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatDate(item.submittedAt || item.createdAt) }}
                      </div>
                    </template>
                    <div class="d-flex flex-wrap align-center mb-2">
                      <v-chip
                        :color="getStatusColor(resolveItemStatus(item))"
                        variant="tonal"
                        class="mr-2 mb-2"
                      >
                        {{ getStatusLabel(resolveItemStatus(item)) }}
                      </v-chip>
                      <v-chip
                        v-if="item.id === selectedSubmission?.id"
                        color="primary"
                        variant="tonal"
                        class="mb-2"
                      >
                        Data Aktif
                      </v-chip>
                    </div>
                    <div class="text-body-2">
                      <div class="text-caption text-medium-emphasis">
                        Ringkasan Kondisi Rumah
                      </div>
                      <div v-if="item.houseData">
                        <div>
                          Jenis Rumah:
                          {{
                            formatHouseType(item.houseData.houseType) || "N/A"
                          }}
                        </div>
                        <div>
                          Luas Bangunan:
                          {{ item.houseData.buildingArea || "N/A" }}
                        </div>
                        <div>
                          Luas Tanah: {{ item.houseData.landArea || "N/A" }}
                        </div>
                        <div>
                          Material Lantai:
                          {{
                            formatFloorMaterial(item.houseData.floorMaterial) ||
                            "N/A"
                          }}
                        </div>
                        <div>
                          Material Dinding:
                          {{
                            formatWallMaterial(item.houseData.wallMaterial) ||
                            "N/A"
                          }}
                        </div>
                        <div>
                          Material Atap:
                          {{
                            formatRoofMaterial(item.houseData.roofMaterial) ||
                            "N/A"
                          }}
                        </div>
                      </div>
                      <div v-else class="text-caption text-medium-emphasis">
                        Data rumah belum tersedia.
                      </div>
                    </div>
                    <div
                      v-if="item.reviewNotes"
                      class="text-caption text-error mt-2"
                    >
                      Catatan: {{ item.reviewNotes }}
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>

            <v-tabs v-model="activeTab" color="primary">
              <v-tab value="pengisi">
                <v-icon start> mdi-account </v-icon>
                Data Pengisi
              </v-tab>

              <v-tab value="pemilik">
                <v-icon start> mdi-account-outline </v-icon>
                Data Pemilik
              </v-tab>

              <v-tab value="rumah">
                <v-icon start> mdi-home </v-icon>
                Data Rumah
              </v-tab>

              <v-tab value="bangunan">
                <v-icon start> mdi-hammer-wrench </v-icon>
                Bahan Bangunan
              </v-tab>

              <v-tab value="kesehatan">
                <v-icon start> mdi-water </v-icon>
                Akses Air Bersih
              </v-tab>

              <v-tab value="sanitasi">
                <v-icon start> mdi-toilet </v-icon>
                Akses Sanitasi
              </v-tab>

              <v-tab value="persampahan">
                <v-icon start> mdi-delete </v-icon>
                Akses Persampahan
              </v-tab>

              <v-tab value="jalan">
                <v-icon start> mdi-road </v-icon>
                Akses Jalan
              </v-tab>

              <v-tab value="energi">
                <v-icon start> mdi-lightning-bolt </v-icon>
                Akses Energi
              </v-tab>
            </v-tabs>

            <v-tabs-window v-model="activeTab">
              <!-- Data Pengisi -->
              <v-tabs-window-item value="pengisi">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Nama
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.formRespondent?.name ||
                                  selectedSubmission.respondent?.name ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Email
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.formRespondent?.email ||
                                  selectedSubmission.respondent?.email ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jabatan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatPosition(
                                    selectedSubmission.formRespondent
                                      ?.position ||
                                      selectedSubmission.respondent?.position
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.formRespondent
                                      ?.positionOther ||
                                    selectedSubmission.respondent?.positionOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.formRespondent
                                      ?.positionOther ||
                                    selectedSubmission.respondent?.positionOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                No. Telp
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.formRespondent?.phone ||
                                  selectedSubmission.respondent?.phone ||
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

              <!-- Data Pemilik -->
              <v-tabs-window-item value="pemilik">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Nama Pemilik Rumah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.ownerName || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                No. Telp
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.ownerPhone || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Nama Kepala Keluarga
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.headOfFamilyName || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                No. Telp Kepala Keluarga
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.headOfFamilyPhone || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Usia
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.headOfFamilyAge
                                    ? `${selectedSubmission.householdOwner.headOfFamilyAge} tahun`
                                    : "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                No. KK
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.familyCardNumber || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah KK dalam 1 Rumah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.totalFamilyMembers || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Alamat
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.houseNumber || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                RT/RW
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                RT
                                {{
                                  selectedSubmission.householdOwner?.rt || "N/A"
                                }}
                                / RW
                                {{
                                  selectedSubmission.householdOwner?.rw || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Kode Pos
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.postalCode || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Lokasi
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner?.village
                                    ?.name || "N/A"
                                }},
                                {{
                                  selectedSubmission.householdOwner?.district
                                    ?.name || "N/A"
                                }},
                                {{
                                  selectedSubmission.householdOwner?.regency
                                    ?.name || "N/A"
                                }},
                                {{
                                  selectedSubmission.householdOwner?.province
                                    ?.name || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Pendidikan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatEducationLevel(
                                    selectedSubmission.householdOwner
                                      ?.educationLevel
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.householdOwner
                                      ?.educationLevelOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.householdOwner
                                      .educationLevelOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Pekerjaan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatOccupation(
                                    selectedSubmission.householdOwner
                                      ?.occupation
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Besar Penghasilan/Pengeluaran per Bulan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.monthlyIncome
                                    ? `Rp ${parseFloat(
                                        selectedSubmission.householdOwner
                                          .monthlyIncome || 0
                                      ).toLocaleString("id-ID")}`
                                    : "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Status Kepemilikan Tanah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatLandOwnership(
                                    selectedSubmission.householdOwner
                                      ?.landOwnershipStatus
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Status Kepemilikan Rumah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatHouseOwnership(
                                    selectedSubmission.householdOwner
                                      ?.houseOwnershipStatus
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Pernah Menerima Bantuan Perumahan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.hasReceivedHousingAssistance
                                    ? `Ya, Tahun ${
                                        selectedSubmission.householdOwner
                                          .housingAssistanceYear || ""
                                      }`
                                    : "Belum Pernah"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Teregistrasi dalam Kriteria Miskin
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.householdOwner
                                    ?.isRegisteredAsPoor
                                    ? selectedSubmission.householdOwner
                                        .poorRegistrationAttachment || "Ya"
                                    : "Tidak"
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

              <!-- Data Rumah -->
              <v-tabs-window-item value="rumah">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Luas Bangunan (m²)
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.houseData?.buildingArea ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Luas Tanah (m²)
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.houseData?.landArea ||
                                  "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Memiliki IMB/PBG
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.houseData
                                    ?.hasBuildingPermit
                                    ? "Ya"
                                    : "Tidak"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jenis Rumah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatHouseType(
                                    selectedSubmission.houseData?.houseType
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah Penghuni dalam 1 Rumah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.houseData
                                    ?.totalOccupants || "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Status Layak Huni
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.isLivable !== undefined
                                    ? selectedSubmission.isLivable
                                      ? "Layak Huni"
                                      : "Tidak Layak Huni"
                                    : "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Photo Gallery for Rumah -->
                  <v-row
                    v-if="
                      selectedSubmission.houseData?.photos &&
                      selectedSubmission.houseData.photos.length > 0
                    "
                    class="mt-4"
                  >
                    <v-col cols="12">
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          Dokumentasi Rumah
                        </v-card-title>
                        <v-card-text>
                          <v-row>
                            <v-col
                              v-for="(photo, index) in selectedSubmission
                                .houseData.photos"
                              :key="index"
                              cols="12"
                              sm="6"
                              md="4"
                            >
                              <v-img
                                :src="getPhotoUrl(photo)"
                                height="200"
                                cover
                                class="rounded-lg"
                              />
                              <div class="text-caption mt-1">
                                {{ getPhotoLabel(photo, "Rumah") }}
                              </div>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Bahan Bangunan -->
              <v-tabs-window-item value="bangunan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Lantai
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatFloorMaterial(
                                    selectedSubmission.houseData?.floorMaterial
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Dinding
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatWallMaterial(
                                    selectedSubmission.houseData?.wallMaterial
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.houseData
                                      ?.wallMaterialOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.houseData
                                      .wallMaterialOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Atap
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatRoofMaterial(
                                    selectedSubmission.houseData?.roofMaterial
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.houseData
                                      ?.roofMaterialOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.houseData
                                      .roofMaterialOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Photo Gallery for Bangunan -->
                  <v-row
                    v-if="
                      selectedSubmission.houseData?.photos &&
                      selectedSubmission.houseData.photos.length > 0
                    "
                    class="mt-4"
                  >
                    <v-col cols="12">
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          Dokumentasi Material Bangunan
                        </v-card-title>
                        <v-card-text>
                          <v-row>
                            <v-col
                              v-for="(photo, index) in selectedSubmission
                                .houseData.photos"
                              :key="index"
                              cols="12"
                              sm="6"
                              md="4"
                            >
                              <v-img
                                :src="getPhotoUrl(photo)"
                                height="200"
                                cover
                                class="rounded-lg"
                              />
                              <div class="text-caption mt-1">
                                {{ getPhotoLabel(photo, "Bangunan") }}
                              </div>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Akses Air Bersih -->
              <v-tabs-window-item value="kesehatan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Sumber Air untuk Kebutuhan MCK
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatWaterSource(
                                    selectedSubmission.waterAccess
                                      ?.sanitationWaterSource
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.waterAccess
                                      ?.sanitationWaterSourceOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.waterAccess
                                      .sanitationWaterSourceOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.waterAccess
                                  ?.sanitationWaterSource === 'sumur_bor' &&
                                selectedSubmission.waterAccess
                                  ?.sanitationWaterDepth
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.waterAccess
                                  ?.sanitationWaterSource === 'sumur_bor' &&
                                selectedSubmission.waterAccess
                                  ?.sanitationWaterDepth
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Kedalaman Sumur Bor (m)
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.waterAccess
                                    .sanitationWaterDepth
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Lokasi Sumber Air
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatWaterLocation(
                                    selectedSubmission.waterAccess
                                      ?.sanitationWaterLocation
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Sumber Air untuk Kebutuhan Minum/Memasak
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatWaterSource(
                                    selectedSubmission.waterAccess
                                      ?.drinkingWaterSource
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.waterAccess
                                      ?.drinkingWaterSourceOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.waterAccess
                                      .drinkingWaterSourceOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.waterAccess
                                  ?.drinkingWaterSource === 'sumur_bor' &&
                                selectedSubmission.waterAccess
                                  ?.drinkingWaterDepth
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.waterAccess
                                  ?.drinkingWaterSource === 'sumur_bor' &&
                                selectedSubmission.waterAccess
                                  ?.drinkingWaterDepth
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Kedalaman Sumur Bor untuk Minum (m)
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.waterAccess
                                    .drinkingWaterDepth
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Photo Gallery for Kesehatan -->
                  <v-row
                    v-if="
                      selectedSubmission.waterAccess?.photos &&
                      selectedSubmission.waterAccess.photos.length > 0
                    "
                    class="mt-4"
                  >
                    <v-col cols="12">
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          Dokumentasi Akses Air Bersih
                        </v-card-title>
                        <v-card-text>
                          <v-row>
                            <v-col
                              v-for="(photo, index) in selectedSubmission
                                .waterAccess.photos"
                              :key="index"
                              cols="12"
                              sm="6"
                              md="4"
                            >
                              <v-img
                                :src="getPhotoUrl(photo)"
                                height="200"
                                cover
                                class="rounded-lg"
                              />
                              <div class="text-caption mt-1">
                                {{ getPhotoLabel(photo, "Air Bersih") }}
                              </div>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Akses Sanitasi -->
              <v-tabs-window-item value="sanitasi">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Kepemilikan Jamban
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatToiletOwnership(
                                    selectedSubmission.sanitationAccess
                                      ?.toiletOwnership
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.toiletOwnership !== 'tidak_memiliki' &&
                                selectedSubmission.sanitationAccess?.toiletCount
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.toiletOwnership !== 'tidak_memiliki' &&
                                selectedSubmission.sanitationAccess?.toiletCount
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jumlah Jamban yang Dimiliki
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.sanitationAccess
                                    .toiletCount
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jenis Closet
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatToiletType(
                                    selectedSubmission.sanitationAccess
                                      ?.toiletType
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jenis Tangki Septic
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatSepticTankType(
                                    selectedSubmission.sanitationAccess
                                      ?.septicTankType
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.septicTankType &&
                                selectedSubmission.sanitationAccess
                                  .septicTankType !== 'tidak_memiliki' &&
                                selectedSubmission.sanitationAccess
                                  ?.septicTankYear
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.septicTankType &&
                                selectedSubmission.sanitationAccess
                                  .septicTankType !== 'tidak_memiliki' &&
                                selectedSubmission.sanitationAccess
                                  ?.septicTankYear
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Tahun Pembuatan Tangki Septic
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.sanitationAccess
                                    .septicTankYear
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.hasSepticPumping !== null &&
                                selectedSubmission.sanitationAccess
                                  ?.hasSepticPumping !== undefined
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.hasSepticPumping !== null &&
                                selectedSubmission.sanitationAccess
                                  ?.hasSepticPumping !== undefined
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Apakah Tangki Septic Pernah Dilakukan Penyedotan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.sanitationAccess
                                    .hasSepticPumping
                                    ? "Ya"
                                    : "Tidak"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.hasSepticPumping &&
                                selectedSubmission.sanitationAccess
                                  ?.septicPumpingYear
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.hasSepticPumping &&
                                selectedSubmission.sanitationAccess
                                  ?.septicPumpingYear
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Tahun Penyedotan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.sanitationAccess
                                    .septicPumpingYear
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.hasSepticPumping &&
                                selectedSubmission.sanitationAccess
                                  ?.septicPumpingService
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.sanitationAccess
                                  ?.hasSepticPumping &&
                                selectedSubmission.sanitationAccess
                                  ?.septicPumpingService
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jasa Sedot Tinja yang Digunakan
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatSepticPumpingService(
                                    selectedSubmission.sanitationAccess
                                      .septicPumpingService
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Pengaliran Air Limbah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatWastewaterDisposal(
                                    selectedSubmission.sanitationAccess
                                      ?.wastewaterDisposal
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Photo Gallery for Sanitasi -->
                  <v-row
                    v-if="
                      selectedSubmission.sanitationAccess?.photos &&
                      selectedSubmission.sanitationAccess.photos.length > 0
                    "
                    class="mt-4"
                  >
                    <v-col cols="12">
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          Dokumentasi Akses Sanitasi
                        </v-card-title>
                        <v-card-text>
                          <v-row>
                            <v-col
                              v-for="(photo, index) in selectedSubmission
                                .sanitationAccess.photos"
                              :key="index"
                              cols="12"
                              sm="6"
                              md="4"
                            >
                              <v-img
                                :src="getPhotoUrl(photo)"
                                height="200"
                                cover
                                class="rounded-lg"
                              />
                              <div class="text-caption mt-1">
                                {{ getPhotoLabel(photo, "Sanitasi") }}
                              </div>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Akses Persampahan -->
              <v-tabs-window-item value="persampahan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Telah Terdapat Akses Pengangkutan Sampah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.wasteManagement
                                    ?.hasWasteCollection !== null &&
                                  selectedSubmission.wasteManagement
                                    ?.hasWasteCollection !== undefined
                                    ? selectedSubmission.wasteManagement
                                        .hasWasteCollection
                                      ? "Ya"
                                      : "Tidak"
                                    : "N/A"
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.wasteManagement
                                  ?.hasWasteCollection &&
                                selectedSubmission.wasteManagement
                                  ?.wasteCollectionManager
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.wasteManagement
                                  ?.hasWasteCollection &&
                                selectedSubmission.wasteManagement
                                  ?.wasteCollectionManager
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Pengelola Pengangkutan Sampah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatWasteCollectionManager(
                                    selectedSubmission.wasteManagement
                                      .wasteCollectionManager
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.wasteManagement
                                      ?.wasteCollectionManagerOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.wasteManagement
                                      .wasteCollectionManagerOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                selectedSubmission.wasteManagement
                                  ?.hasWasteCollection === false &&
                                selectedSubmission.wasteManagement
                                  ?.wasteDisposalMethod
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                selectedSubmission.wasteManagement
                                  ?.hasWasteCollection === false &&
                                selectedSubmission.wasteManagement
                                  ?.wasteDisposalMethod
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Bagaimana Pengelolaan Sampah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatWasteDisposalMethod(
                                    selectedSubmission.wasteManagement
                                      .wasteDisposalMethod
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.wasteManagement
                                      ?.wasteDisposalLocation
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.wasteManagement
                                      .wasteDisposalLocation
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Photo Gallery for Persampahan -->
                  <v-row
                    v-if="
                      selectedSubmission.wasteManagement?.photos &&
                      selectedSubmission.wasteManagement.photos.length > 0
                    "
                    class="mt-4"
                  >
                    <v-col cols="12">
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          Dokumentasi Pengelolaan Sampah
                        </v-card-title>
                        <v-card-text>
                          <v-row>
                            <v-col
                              v-for="(photo, index) in selectedSubmission
                                .wasteManagement.photos"
                              :key="index"
                              cols="12"
                              sm="6"
                              md="4"
                            >
                              <v-img
                                :src="getPhotoUrl(photo)"
                                height="200"
                                cover
                                class="rounded-lg"
                              />
                              <div class="text-caption mt-1">
                                {{ getPhotoLabel(photo, "Persampahan") }}
                              </div>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Akses Jalan -->
              <v-tabs-window-item value="jalan">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jenis Jalan Akses Menuju Rumah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatRoadType(
                                    selectedSubmission.roadAccess?.roadType
                                  )
                                }}
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider class="my-3" />
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Jenis Konstruksi Jalan Akses
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatRoadConstruction(
                                    selectedSubmission.roadAccess
                                      ?.roadConstruction
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.roadAccess
                                      ?.roadConstructionOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.roadAccess
                                      .roadConstructionOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Photo Gallery for Jalan -->
                  <v-row
                    v-if="
                      selectedSubmission.roadAccess?.photos &&
                      selectedSubmission.roadAccess.photos.length > 0
                    "
                    class="mt-4"
                  >
                    <v-col cols="12">
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          Dokumentasi Akses Jalan
                        </v-card-title>
                        <v-card-text>
                          <v-row>
                            <v-col
                              v-for="(photo, index) in selectedSubmission
                                .roadAccess.photos"
                              :key="index"
                              cols="12"
                              sm="6"
                              md="4"
                            >
                              <v-img
                                :src="getPhotoUrl(photo)"
                                height="200"
                                cover
                                class="rounded-lg"
                              />
                              <div class="text-caption mt-1">
                                {{ getPhotoLabel(photo, "Akses Jalan") }}
                              </div>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>

              <!-- Akses Energi -->
              <v-tabs-window-item value="energi">
                <v-container class="mt-4">
                  <v-row>
                    <v-col cols="12" md="12">
                      <v-card variant="outlined">
                        <v-card-text>
                          <v-list density="comfortable">
                            <v-list-item>
                              <v-list-item-title class="font-weight-bold mb-2">
                                Sumber Listrik di Rumah
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  formatElectricitySource(
                                    selectedSubmission.energyAccess
                                      ?.electricitySource
                                  )
                                }}
                                <span
                                  v-if="
                                    selectedSubmission.energyAccess
                                      ?.electricitySourceOther
                                  "
                                >
                                  -
                                  {{
                                    selectedSubmission.energyAccess
                                      .electricitySourceOther
                                  }}
                                </span>
                              </v-list-item-subtitle>
                            </v-list-item>
                            <v-divider
                              v-if="
                                (selectedSubmission.energyAccess
                                  ?.electricitySource === 'pln_sendiri' ||
                                  selectedSubmission.energyAccess
                                    ?.electricitySource === 'pln_menumpang') &&
                                selectedSubmission.energyAccess?.plnCapacity
                              "
                              class="my-3"
                            />
                            <v-list-item
                              v-if="
                                (selectedSubmission.energyAccess
                                  ?.electricitySource === 'pln_sendiri' ||
                                  selectedSubmission.energyAccess
                                    ?.electricitySource === 'pln_menumpang') &&
                                selectedSubmission.energyAccess?.plnCapacity
                              "
                            >
                              <v-list-item-title class="font-weight-bold mb-2">
                                Kapasitas Listrik (Watt)
                              </v-list-item-title>
                              <v-list-item-subtitle class="text-h6">
                                {{
                                  selectedSubmission.energyAccess.plnCapacity
                                }}
                                Watt
                              </v-list-item-subtitle>
                            </v-list-item>
                          </v-list>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Photo Gallery for Energi -->
                  <v-row
                    v-if="
                      selectedSubmission.energyAccess?.photos &&
                      selectedSubmission.energyAccess.photos.length > 0
                    "
                    class="mt-4"
                  >
                    <v-col cols="12">
                      <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1">
                          Dokumentasi Akses Energi
                        </v-card-title>
                        <v-card-text>
                          <v-row>
                            <v-col
                              v-for="(photo, index) in selectedSubmission
                                .energyAccess.photos"
                              :key="index"
                              cols="12"
                              sm="6"
                              md="4"
                            >
                              <v-img
                                :src="getPhotoUrl(photo)"
                                height="200"
                                cover
                                class="rounded-lg"
                              />
                              <div class="text-caption mt-1">
                                {{ getPhotoLabel(photo, "Akses Energi") }}
                              </div>
                            </v-col>
                          </v-row>
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
              color="primary"
              variant="outlined"
              @click="closeDetailDialog"
            >
              Tutup
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Edit Dialog (Verifier) -->
      <v-dialog v-model="showEditDialog" max-width="720" scrollable>
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="warning"> mdi-pencil </v-icon>
            Edit Data Survei
          </v-card-title>

          <v-card-text>
            <v-alert type="info" variant="tonal" class="mb-4">
              Simpan perubahan akan menandai data sebagai
              <strong>Ditinjau</strong>.
            </v-alert>
            <v-form ref="editFormRef" v-model="editFormValid">
              <v-expansion-panels multiple>
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    Data Pengisi
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.formRespondent.name"
                          label="Nama"
                          :rules="[rules.required]"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.formRespondent.email"
                          label="Email"
                          type="email"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.formRespondent.phone"
                          label="No. Telp"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.formRespondent.position"
                          label="Jabatan"
                          :items="positionOptions"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col
                        v-if="editForm.formRespondent.position === 'lainnya'"
                        cols="12"
                      >
                        <v-text-field
                          v-model="editForm.formRespondent.positionOther"
                          label="Jabatan Lainnya"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <v-expansion-panel>
                  <v-expansion-panel-title>
                    Pemilik & Lokasi
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.ownerName"
                          label="Nama Pemilik"
                          :rules="[rules.required]"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.ownerPhone"
                          label="No. Telp Pemilik"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.headOfFamilyName"
                          label="Nama Kepala Keluarga"
                          :rules="[rules.required]"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.headOfFamilyPhone"
                          label="No. Telp Kepala Keluarga"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="editForm.householdOwner.headOfFamilyAge"
                          label="Usia Kepala Keluarga"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="editForm.householdOwner.familyCardNumber"
                          label="No. KK"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="editForm.householdOwner.totalFamilyMembers"
                          label="Jumlah KK dalam 1 Rumah"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.houseNumber"
                          label="Alamat"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="3">
                        <v-text-field
                          v-model="editForm.householdOwner.rt"
                          label="RT"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="3">
                        <v-text-field
                          v-model="editForm.householdOwner.rw"
                          label="RW"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.latitude"
                          label="Latitude"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.longitude"
                          label="Longitude"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.householdOwner.provinceId"
                          label="Provinsi"
                          :items="filterProvinceOptions"
                          item-title="name"
                          item-value="id"
                          :loading="filterLocationLoading.provinces"
                          variant="outlined"
                          :rules="[rules.required]"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.householdOwner.regencyId"
                          label="Kabupaten / Kota"
                          :items="filterRegencyOptions"
                          item-title="name"
                          item-value="id"
                          :loading="filterLocationLoading.regencies"
                          :disabled="!editForm.householdOwner.provinceId"
                          variant="outlined"
                          :rules="[rules.required]"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.householdOwner.districtId"
                          label="Kecamatan"
                          :items="filterDistrictOptions"
                          item-title="name"
                          item-value="id"
                          :loading="filterLocationLoading.districts"
                          :disabled="!editForm.householdOwner.regencyId"
                          variant="outlined"
                          :rules="[rules.required]"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.householdOwner.villageId"
                          label="Kelurahan"
                          :items="filterVillageOptions"
                          item-title="name"
                          item-value="id"
                          :loading="filterLocationLoading.villages"
                          :disabled="!editForm.householdOwner.districtId"
                          variant="outlined"
                          :rules="[rules.required]"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.householdOwner.educationLevel"
                          label="Pendidikan"
                          :items="educationLevelOptions"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col
                        v-if="
                          editForm.householdOwner.educationLevel === 'lainnya'
                        "
                        cols="12"
                        md="6"
                      >
                        <v-text-field
                          v-model="editForm.householdOwner.educationLevelOther"
                          label="Pendidikan Lainnya"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.occupation"
                          label="Pekerjaan"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="editForm.householdOwner.monthlyIncome"
                          label="Penghasilan Bulanan"
                          type="number"
                          prefix="Rp"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.householdOwner.landOwnershipStatus"
                          label="Status Kepemilikan Tanah"
                          :items="landOwnershipOptions"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.householdOwner.houseOwnershipStatus"
                          label="Status Kepemilikan Rumah"
                          :items="houseOwnershipOptions"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="
                            editForm.householdOwner.hasReceivedHousingAssistance
                          "
                          label="Pernah Menerima Bantuan Perumahan"
                          :items="yesNoOptions"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col
                        v-if="
                          editForm.householdOwner.hasReceivedHousingAssistance
                        "
                        cols="12"
                        md="6"
                      >
                        <v-text-field
                          v-model="
                            editForm.householdOwner.housingAssistanceYear
                          "
                          label="Tahun Bantuan"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="editForm.householdOwner.isRegisteredAsPoor"
                          label="Kriteria Miskin"
                          :items="yesNoOptions"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col
                        v-if="editForm.householdOwner.isRegisteredAsPoor"
                        cols="12"
                        md="6"
                      >
                        <v-text-field
                          v-model="
                            editForm.householdOwner.poorRegistrationAttachment
                          "
                          label="Keterangan Kriteria Miskin"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="secondary"
              variant="outlined"
              @click="closeEditDialog"
            >
              Batal
            </v-btn>
            <v-btn
              color="primary"
              :loading="isLoading"
              :disabled="!editFormValid"
              @click="submitEditForm"
            >
              Simpan & Tandai Ditinjau
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Review Dialog -->
      <v-dialog v-model="showReviewDialog" max-width="600">
        <v-card>
          <v-card-title>
            {{ reviewDialogTitle }}
          </v-card-title>

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
                v-if="reviewData.status !== 'rejected'"
                v-model="reviewData.status"
                label="Status Tinjauan"
                :items="reviewStatusOptions"
                :rules="[rules.required]"
                variant="outlined"
              />

              <v-textarea
                v-model="reviewData.reviewNotes"
                label="Review Notes"
                placeholder="Tuliskan alasan penolakan..."
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
              Kirim Review
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from "vue";
import { definePage } from "unplugin-vue-router/runtime";
import { useHousingStore } from "@/stores/housing";
import { useAppStore } from "@/stores/app";
import { useMapDataStore } from "@/stores/mapData";
import { exportAPI, housingAPI, locationAPI } from "@/services";
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

const housingStore = useHousingStore();
const appStore = useAppStore();
const mapStore = useMapDataStore();

// Reactive state
const isLoading = ref(false);
const searchQuery = ref("");
const showDetailDialog = ref(false);
const showReviewDialog = ref(false);
const showEditDialog = ref(false);
const selectedSubmission = ref(null);
const submissionHistory = ref([]);
const submissionHistoryLoading = ref(false);
const submissionHistoryError = ref("");
const activeTab = ref("pengisi");
const reviewFormValid = ref(false);
const reviewFormRef = ref(null);
const editFormValid = ref(false);
const editFormRef = ref(null);
const expandedStatistics = ref([]); // For expansion panel ([] = collapsed, [0] = expanded)
const showAllFilters = ref(false); // For showing/hiding additional filters
const exportDialogOpen = ref(false);
const exportScope = ref("all");
const exportLoading = ref(false);
const exportError = ref("");
const housingExportCategories = getExportCategories("housing");
const exportCategoryIds = ref(
  housingExportCategories.map((category) => category.id)
);
const exportAllCategories = computed({
  get: () => exportCategoryIds.value.length === housingExportCategories.length,
  set: (value) => {
    exportCategoryIds.value = value
      ? housingExportCategories.map((category) => category.id)
      : [];
  },
});

const createEmptyEditForm = () => ({
  formRespondent: {
    name: "",
    email: "",
    phone: "",
    position: "",
    positionOther: "",
  },
  householdOwner: {
    ownerName: "",
    ownerPhone: "",
    headOfFamilyName: "",
    headOfFamilyPhone: "",
    headOfFamilyAge: null,
    familyCardNumber: "",
    totalFamilyMembers: null,
    houseNumber: "",
    rt: "",
    rw: "",
    provinceId: null,
    regencyId: null,
    districtId: null,
    villageId: null,
    latitude: null,
    longitude: null,
    educationLevel: "",
    educationLevelOther: "",
    occupation: "",
    monthlyIncome: null,
    landOwnershipStatus: "",
    houseOwnershipStatus: "",
    hasReceivedHousingAssistance: null,
    housingAssistanceYear: null,
    isRegisteredAsPoor: null,
    poorRegistrationAttachment: "",
  },
});

const normalizeText = (value) => {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const normalized = String(value).trim();
  return normalized.length === 12 ? normalized : undefined;
};

const normalizeEmail = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(normalized) ? normalized : undefined;
};

const normalizeEnum = (value, allowedValues) => {
  if (!allowedValues || !allowedValues.length) return undefined;
  return allowedValues.includes(value) ? value : undefined;
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const normalizeBoolean = (value) =>
  typeof value === "boolean" ? value : undefined;

const pickDefined = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

const editForm = ref(createEmptyEditForm());
const statistics = ref(null);
const statisticsLoading = ref(false);
const statisticsCacheKey = ref("");

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
const editLocationSyncing = ref(false);

// Review form data
const reviewData = ref({
  status: "",
  reviewNotes: "",
});

// Table headers
const headers = [
  { title: "ID", key: "id", sortable: false, width: "120px" },
  { title: "Status", key: "status", sortable: false, width: "120px" },
  {
    title: "Status Layak Huni",
    key: "isLivable",
    sortable: false,
    width: "140px",
  },
  { title: "Nama Pemilik", key: "ownerName", sortable: false, width: "200px" },
  { title: "No KK", key: "familyCardNumber", sortable: false, width: "160px" },
  { title: "Alamat", key: "address", sortable: false, width: "150px" },
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

// Computed properties
const submissions = computed(() => housingStore.submissions || []);
const pagination = computed(
  () =>
    housingStore.pagination || {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 20,
      hasNextPage: false,
      hasPrevPage: false,
    }
);
const resolveStatus = (status, verificationStatus = null) => {
  const normalizedStatus = String(status || "").toLowerCase();
  const normalizedVerification = String(verificationStatus || "").toLowerCase();

  if (normalizedStatus === "history") return "history";
  if (normalizedVerification === "rejected") return "rejected";
  if (normalizedVerification === "verified" || normalizedStatus === "approved")
    return "approved";
  if (["reviewed", "under_review", "verified"].includes(normalizedStatus))
    return "under_review";
  return normalizedStatus || "draft";
};

const resolveItemStatus = (item) =>
  resolveStatus(item?.status, item?.verificationStatus);

const getPhotoUrl = (photo) => {
  if (!photo) return "";
  const raw =
    typeof photo === "string"
      ? photo
      : photo.url || photo.fileUrl || photo.filePath || photo.file_path || "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("blob:")) return raw;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const apiRoot = baseUrl.replace(/\/api$/i, "");
  const normalized = String(raw).replace(/\\/g, "/");
  if (
    normalized.startsWith("/api/files/") ||
    normalized.startsWith("api/files/")
  ) {
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${apiRoot}${path}`;
  }
  if (normalized.startsWith("/files/") || normalized.startsWith("files/")) {
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${apiRoot}/api${path}`;
  }
  const prefix = baseUrl ? `${baseUrl}/files/` : "/api/files/";
  return `${prefix}${normalized.replace(/^\/+/, "")}`;
};

const getPhotoLabel = (photo, fallback) => {
  if (photo?.caption) return photo.caption;
  return fallback;
};

const detailPhotos = computed(() => {
  const submission = selectedSubmission.value;
  if (!submission) return [];
  const sources = [
    { label: "Rumah", photos: submission.houseData?.photos },
    { label: "Air Bersih", photos: submission.waterAccess?.photos },
    { label: "Sanitasi", photos: submission.sanitationAccess?.photos },
    { label: "Persampahan", photos: submission.wasteManagement?.photos },
    { label: "Akses Jalan", photos: submission.roadAccess?.photos },
    { label: "Akses Energi", photos: submission.energyAccess?.photos },
  ];

  const collected = [];
  sources.forEach(({ label, photos }) => {
    if (!Array.isArray(photos)) return;
    photos.forEach((photo, index) => {
      const url = getPhotoUrl(photo);
      if (!url) return;
      collected.push({
        id: `${label}-${photo?.id || index}`,
        url,
        label: getPhotoLabel(photo, label),
      });
    });
  });

  return collected;
});

const submissionCounts = computed(() => {
  const rawCounts =
    statistics.value?.statusBreakdown || housingStore.submissionCounts || {};
  const counts = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  };

  Object.entries(rawCounts).forEach(([status, count]) => {
    const normalized = resolveStatus(status);
    counts[normalized] = (counts[normalized] || 0) + Number(count || 0);
  });

  return counts;
});
const canReview = computed(() =>
  appStore.hasAnyRole(["verifikator", "super_admin"])
);
const canEdit = computed(
  () =>
    appStore.hasPermission("housing:update") ||
    appStore.hasAnyRole(["verifikator", "super_admin"])
);
const filters = computed(() => housingStore.filters || {});

const isWithinScope = (item) => {
  if (appStore.isSuperAdmin || appStore.isVerifikator) {
    return true;
  }
  const owner = item?.householdOwner || {};
  const location = {
    villageId: owner.village?.id || owner.villageId,
    districtId: owner.district?.id || owner.districtId,
    regencyId: owner.regency?.id || owner.regencyId,
    provinceId: owner.province?.id || owner.provinceId,
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
const canEditSubmission = (item) =>
  canEdit.value &&
  isWithinScope(item) &&
  ["submitted", "under_review"].includes(resolveItemStatus(item));
const canApproveStatus = (item) =>
  ["submitted", "under_review"].includes(resolveItemStatus(item));
const canRejectStatus = (item) =>
  ["submitted", "under_review"].includes(resolveItemStatus(item));

// Computed property to check if there are active filters
const hasActiveFilters = computed(() => {
  return !!(
    filters.value.status ||
    filters.value.housingStatus ||
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
const statusOptions = [
  { title: "Draft", value: "draft" },
  { title: "Diajukan", value: "submitted" },
  { title: "Dalam Review", value: "under_review" },
  { title: "Disetujui", value: "approved" },
  { title: "Ditolak", value: "rejected" },
];

const yesNoOptions = [
  { title: "Ya", value: true },
  { title: "Tidak", value: false },
];

const positionOptions = [
  { title: "Perangkat Desa/Kelurahan", value: "perangkat_desa" },
  { title: "Pemilik Rumah", value: "pemilik_rumah" },
  { title: "Lainnya", value: "lainnya" },
];

const educationLevelOptions = [
  { title: "Tidak Sekolah", value: "tidak_sekolah" },
  { title: "SD/Sederajat", value: "sd" },
  { title: "SMP/Sederajat", value: "smp" },
  { title: "SMA/Sederajat", value: "sma" },
  { title: "Diploma", value: "diploma" },
  { title: "Sarjana", value: "sarjana" },
  { title: "Pascasarjana", value: "magister" },
  { title: "Doktor", value: "doktor" },
  { title: "Lainnya", value: "lainnya" },
];

const positionValues = positionOptions.map((option) => option.value);
const educationLevelValues = educationLevelOptions.map(
  (option) => option.value
);

const landOwnershipOptions = [
  { title: "Milik Sendiri", value: "milik_sendiri" },
  { title: "Bukan Milik Sendiri", value: "bukan_milik_sendiri" },
];

const houseOwnershipOptions = [
  { title: "Milik Sendiri", value: "milik_sendiri" },
  { title: "Sewa", value: "sewa" },
  { title: "Menumpang", value: "menumpang" },
];

const landOwnershipValues = landOwnershipOptions.map((option) => option.value);
const houseOwnershipValues = houseOwnershipOptions.map(
  (option) => option.value
);

const reviewStatusOptions = [
  { title: "Disetujui", value: "approved" },
  { title: "Ditolak", value: "rejected" },
];

const housingStatusOptions = [
  { title: "Layak Huni", value: "layak_huni" },
  { title: "Tidak Layak Huni", value: "tidak_layak_huni" },
];

// Validation rules
const rules = {
  required: (value) => !!value || "Field is required",
};

const reviewDialogTitle = computed(() =>
  reviewData.value.status === "rejected"
    ? "Review Notes Penolakan"
    : "Tinjau Pengajuan"
);

const reviewNotesRules = computed(() => {
  if (reviewData.value.status === "rejected") {
    return [rules.required];
  }
  return [];
});

const buildStatisticsParams = (params = {}) =>
  pickDefined({
    provinceId: params.provinceId,
    regencyId: params.regencyId,
    districtId: params.districtId,
    villageId: params.villageId,
  });

const loadStatistics = async (params = {}) => {
  const statsParams = buildStatisticsParams(params);
  const cacheKey = JSON.stringify(statsParams);
  if (cacheKey === statisticsCacheKey.value) {
    return;
  }
  statisticsCacheKey.value = cacheKey;
  statisticsLoading.value = true;
  try {
    const response = await housingAPI.getStatistics(statsParams);
    if (response?.success) {
      statistics.value = response.data || null;
    } else {
      statistics.value = null;
    }
  } catch (error) {
    console.error("Error loading housing statistics:", error);
    statistics.value = null;
  } finally {
    statisticsLoading.value = false;
  }
};

// Methods
const loadData = async () => {
  isLoading.value = true;
  try {
    console.log("Loading housing data...");

    // Get user's assigned location IDs from localStorage
    const userData = localStorage.getItem("user-data");
    let locationParams = {};

    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log("User data from localStorage:", user);

        // Add location parameters based on assigned location IDs
        if (user.assignedProvinceId) {
          locationParams.provinceId = user.assignedProvinceId;
          console.log("Added provinceId filter:", user.assignedProvinceId);
        }
        if (user.assignedRegencyId) {
          locationParams.regencyId = user.assignedRegencyId;
          console.log("Added regencyId filter:", user.assignedRegencyId);
        }
        if (user.assignedDistrictId) {
          locationParams.districtId = user.assignedDistrictId;
          console.log("Added districtId filter:", user.assignedDistrictId);
        }
        if (user.assignedVillageId) {
          locationParams.villageId = user.assignedVillageId;
          console.log("Added villageId filter:", user.assignedVillageId);
        }

        console.log("Location parameters to send:", locationParams);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }

    // Merge location params with existing filters
    const currentFilters = filters.value || {};
    const queryParams = {
      ...currentFilters,
      ...locationParams,
    };

    // Remove housingStatus from params if exists (already mapped to isLivable in applyFilters)
    if (queryParams.housingStatus !== undefined) {
      delete queryParams.housingStatus;
    }

    // Ensure isLivable is only sent if it has a value (true or false)
    // Remove it if undefined/null to avoid sending ?isLivable=undefined
    if (queryParams.isLivable === undefined || queryParams.isLivable === null) {
      delete queryParams.isLivable;
    }

    // Add filter location if selected
    if (filterLocation.value.province?.id) {
      queryParams.provinceId = filterLocation.value.province.id;
    }
    if (filterLocation.value.regency?.id) {
      queryParams.regencyId = filterLocation.value.regency.id;
    }
    if (filterLocation.value.district?.id) {
      queryParams.districtId = filterLocation.value.district.id;
    }
    if (filterLocation.value.village?.id) {
      queryParams.villageId = filterLocation.value.village.id;
    }

    console.log("Final query parameters:", queryParams);

    await loadStatistics(queryParams);
    const result = await housingStore.getSubmissions(queryParams);
    console.log("Load result:", result);
    console.log("Submissions after load:", housingStore.submissions);
    console.log("Submission counts:", housingStore.submissionCounts);

    // If API call fails, ensure empty state is shown
    if (!result.success) {
      console.error(
        "Failed to load submissions:",
        result.error || result.message
      );
      // Clear submissions to show empty state
      housingStore.submissions = [];
      housingStore.pagination = {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  } catch (error) {
    console.error("Error loading data:", error);
    console.log("Housing store state:", housingStore);
    // Clear submissions to show empty state instead of mock data
    housingStore.submissions = [];
    housingStore.pagination = {
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

const refreshData = () => {
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

watch(
  () => editForm.value.householdOwner.provinceId,
  async (provinceId) => {
    if (!showEditDialog.value || editLocationSyncing.value) return;
    editForm.value.householdOwner.regencyId = null;
    editForm.value.householdOwner.districtId = null;
    editForm.value.householdOwner.villageId = null;
    filterRegencyOptions.value = [];
    filterDistrictOptions.value = [];
    filterVillageOptions.value = [];
    if (provinceId) {
      await fetchFilterRegencies(provinceId);
    }
  }
);

watch(
  () => editForm.value.householdOwner.regencyId,
  async (regencyId) => {
    if (!showEditDialog.value || editLocationSyncing.value) return;
    editForm.value.householdOwner.districtId = null;
    editForm.value.householdOwner.villageId = null;
    filterDistrictOptions.value = [];
    filterVillageOptions.value = [];
    if (regencyId) {
      await fetchFilterDistricts(regencyId);
    }
  }
);

watch(
  () => editForm.value.householdOwner.districtId,
  async (districtId) => {
    if (!showEditDialog.value || editLocationSyncing.value) return;
    editForm.value.householdOwner.villageId = null;
    filterVillageOptions.value = [];
    if (districtId) {
      await fetchFilterVillages(districtId);
    }
  }
);

watch(
  () => showEditDialog.value,
  (isOpen) => {
    if (!isOpen) {
      resetEditForm();
    }
  }
);

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

const applyFilters = () => {
  const filterData = {
    status: filters.value.status,
  };

  // Map housingStatus filter to isLivable boolean
  if (filters.value.housingStatus) {
    if (filters.value.housingStatus === "layak_huni") {
      filterData.isLivable = true;
    } else if (filters.value.housingStatus === "tidak_layak_huni") {
      filterData.isLivable = false;
    }
  }

  // Add location filters if selected
  if (filterLocation.value.province?.id) {
    filterData.provinceId = filterLocation.value.province.id;
  }
  if (filterLocation.value.regency?.id) {
    filterData.regencyId = filterLocation.value.regency.id;
  }
  if (filterLocation.value.district?.id) {
    filterData.districtId = filterLocation.value.district.id;
  }
  if (filterLocation.value.village?.id) {
    filterData.villageId = filterLocation.value.village.id;
  }

  housingStore.setFilters(filterData);
  loadData();
};

const clearFilters = () => {
  housingStore.clearFilters();
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
  loadData();
};

const openExportDialog = () => {
  exportError.value = "";
  exportDialogOpen.value = true;
};

const buildExportParams = () => {
  const params = {
    status: filters.value.status,
  };

  if (filters.value.housingStatus) {
    if (filters.value.housingStatus === "layak_huni") {
      params.isLivable = true;
    } else if (filters.value.housingStatus === "tidak_layak_huni") {
      params.isLivable = false;
    }
  }

  if (filterLocation.value.province?.id) {
    params.provinceId = filterLocation.value.province.id;
  }
  if (filterLocation.value.regency?.id) {
    params.regencyId = filterLocation.value.regency.id;
  }
  if (filterLocation.value.district?.id) {
    params.districtId = filterLocation.value.district.id;
  }
  if (filterLocation.value.village?.id) {
    params.villageId = filterLocation.value.village.id;
  }

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
  if (filters.value.housingStatus) {
    parts.push(
      `Status Rumah: ${
        filters.value.housingStatus === "layak_huni"
          ? "Layak Huni"
          : "Tidak Layak Huni"
      }`
    );
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
    const response = await exportAPI.getData("housing", {
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
      housingExportCategories,
      exportCategoryIds.value
    );
    const metaRows = buildMetaRows({
      title: "Ekspor Data Survei Rumah Masyarakat",
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
      sheetName: "Rumah Masyarakat",
      fileName: `export-rumah-${dateStamp}.xlsx`,
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

const handlePageChange = (page) => {
  housingStore.setPagination(page);
  loadData();
};

const handleItemsPerPageChange = (itemsPerPage) => {
  housingStore.pagination.itemsPerPage = itemsPerPage;
  housingStore.pagination.currentPage = 1;
  loadData();
};

const markUnderReview = async (submission) => {
  if (!submission?.id) return;
  if (!canReviewSubmission(submission)) return;
  if (resolveItemStatus(submission) !== "submitted") return;

  try {
    await housingStore.reviewSubmission(submission.id, {
      status: "under_review",
      reviewNotes: "",
    });
    await loadData();
  } catch (error) {
    console.error("Error marking under review:", error);
  }
};

const loadSubmissionHistory = async (ownerId) => {
  submissionHistory.value = [];
  submissionHistoryError.value = "";

  if (!ownerId) return;

  submissionHistoryLoading.value = true;
  try {
    const result = await housingStore.getSubmissionHistoryByOwner(ownerId);
    if (result.success) {
      submissionHistory.value = Array.isArray(result.history)
        ? result.history
        : [];
      return;
    }
    submissionHistoryError.value =
      result.error || "Gagal memuat riwayat survei.";
  } catch (error) {
    console.error("Error loading submission history:", error);
    submissionHistoryError.value =
      error?.message || "Gagal memuat riwayat survei.";
  } finally {
    submissionHistoryLoading.value = false;
  }
};

const viewSubmission = async (submission) => {
  try {
    isLoading.value = true;
    showDetailDialog.value = true;
    activeTab.value = "pengisi";
    // Clear previous submission while loading
    selectedSubmission.value = null;

    // Load full submission details from API
    const result = await housingStore.getSubmission(submission.id);

    if (result.success && result.submission) {
      // Store already handles the response structure and returns the submission object
      selectedSubmission.value = result.submission;
    } else {
      // If API call fails, use the submission from list
      console.error("Failed to load submission details:", result.error);
      selectedSubmission.value = submission;
    }
    await markUnderReview(submission);
    const ownerId =
      selectedSubmission.value?.householdOwner?.id ||
      selectedSubmission.value?.householdOwnerId;
    await loadSubmissionHistory(ownerId);
  } catch (error) {
    console.error("Error loading submission details:", error);
    // Fallback to the submission from list
    selectedSubmission.value = submission;
  } finally {
    isLoading.value = false;
  }
};

const closeDetailDialog = () => {
  showDetailDialog.value = false;
  // Reset state after dialog closes
  setTimeout(() => {
    selectedSubmission.value = null;
    activeTab.value = "pengisi";
    submissionHistory.value = [];
    submissionHistoryError.value = "";
    submissionHistoryLoading.value = false;
  }, 300); // Wait for dialog close animation
};

const resetEditForm = () => {
  editForm.value = createEmptyEditForm();
  editFormValid.value = false;
};

const hydrateEditForm = async (submission) => {
  if (!submission) return;

  const respondent = submission.formRespondent || {};
  const owner = submission.householdOwner || {};

  editLocationSyncing.value = true;
  editForm.value = {
    formRespondent: {
      name: respondent.name || "",
      email: respondent.email || "",
      phone: respondent.phone || "",
      position: respondent.position || "",
      positionOther: respondent.positionOther || "",
    },
    householdOwner: {
      ownerName: owner.ownerName || "",
      ownerPhone: owner.ownerPhone || "",
      headOfFamilyName: owner.headOfFamilyName || "",
      headOfFamilyPhone: owner.headOfFamilyPhone || "",
      headOfFamilyAge: owner.headOfFamilyAge ?? null,
      familyCardNumber: owner.familyCardNumber || "",
      totalFamilyMembers: owner.totalFamilyMembers ?? null,
      houseNumber: owner.houseNumber || "",
      rt: owner.rt || "",
      rw: owner.rw || "",
      provinceId: owner.province?.id || owner.provinceId || null,
      regencyId: owner.regency?.id || owner.regencyId || null,
      districtId: owner.district?.id || owner.districtId || null,
      villageId: owner.village?.id || owner.villageId || null,
      latitude: owner.latitude ?? null,
      longitude: owner.longitude ?? null,
      educationLevel: owner.educationLevel || "",
      educationLevelOther: owner.educationLevelOther || "",
      occupation: owner.occupation || "",
      monthlyIncome: owner.monthlyIncome ?? null,
      landOwnershipStatus: owner.landOwnershipStatus || "",
      houseOwnershipStatus: owner.houseOwnershipStatus || "",
      hasReceivedHousingAssistance: owner.hasReceivedHousingAssistance ?? null,
      housingAssistanceYear: owner.housingAssistanceYear ?? null,
      isRegisteredAsPoor: owner.isRegisteredAsPoor ?? null,
      poorRegistrationAttachment: owner.poorRegistrationAttachment || "",
    },
  };

  if (editForm.value.householdOwner.provinceId) {
    await fetchFilterRegencies(editForm.value.householdOwner.provinceId);
  }
  if (editForm.value.householdOwner.regencyId) {
    await fetchFilterDistricts(editForm.value.householdOwner.regencyId);
  }
  if (editForm.value.householdOwner.districtId) {
    await fetchFilterVillages(editForm.value.householdOwner.districtId);
  }
  editLocationSyncing.value = false;
};

const openEditDialog = async (submission) => {
  if (!submission?.id) return;
  isLoading.value = true;
  showEditDialog.value = true;
  try {
    resetEditForm();
    const result = await housingStore.getSubmission(submission.id);
    const fullSubmission = result?.success ? result.submission : submission;
    selectedSubmission.value = fullSubmission;
    await hydrateEditForm(fullSubmission);
  } catch (error) {
    console.error("Failed to load submission for edit:", error);
  } finally {
    isLoading.value = false;
  }
};

const closeEditDialog = () => {
  showEditDialog.value = false;
  resetEditForm();
};

const buildEditPayload = () => {
  const respondentRaw = editForm.value.formRespondent || {};
  const ownerRaw = editForm.value.householdOwner || {};
  const originalOwner = selectedSubmission.value?.householdOwner || {};

  const formRespondent = pickDefined({
    name: normalizeText(respondentRaw.name),
    email: normalizeEmail(respondentRaw.email),
    phone: normalizeText(respondentRaw.phone),
    position: normalizeEnum(respondentRaw.position, positionValues),
    positionOther:
      respondentRaw.position === "lainnya"
        ? normalizeText(respondentRaw.positionOther)
        : undefined,
  });

  const locationPayload = pickDefined({
    provinceId: normalizeId(ownerRaw.provinceId),
    regencyId: normalizeId(ownerRaw.regencyId),
    districtId: normalizeId(ownerRaw.districtId),
    villageId: normalizeId(ownerRaw.villageId),
    latitude: normalizeNumber(ownerRaw.latitude),
    longitude: normalizeNumber(ownerRaw.longitude),
  });

  const originalLocation = {
    provinceId: normalizeId(
      originalOwner.province?.id || originalOwner.provinceId
    ),
    regencyId: normalizeId(
      originalOwner.regency?.id || originalOwner.regencyId
    ),
    districtId: normalizeId(
      originalOwner.district?.id || originalOwner.districtId
    ),
    villageId: normalizeId(
      originalOwner.village?.id || originalOwner.villageId
    ),
    latitude: normalizeNumber(originalOwner.latitude),
    longitude: normalizeNumber(originalOwner.longitude),
  };

  const locationChanged = Object.keys(locationPayload).some(
    (key) => locationPayload[key] !== originalLocation[key]
  );

  const householdOwner = pickDefined({
    ownerName: normalizeText(ownerRaw.ownerName),
    ownerPhone: normalizeText(ownerRaw.ownerPhone),
    headOfFamilyName: normalizeText(ownerRaw.headOfFamilyName),
    headOfFamilyPhone: normalizeText(ownerRaw.headOfFamilyPhone),
    headOfFamilyAge: normalizeNumber(ownerRaw.headOfFamilyAge),
    familyCardNumber: normalizeText(ownerRaw.familyCardNumber),
    totalFamilyMembers: normalizeNumber(ownerRaw.totalFamilyMembers),
    houseNumber: normalizeText(ownerRaw.houseNumber),
    rt: normalizeText(ownerRaw.rt),
    rw: normalizeText(ownerRaw.rw),
    ...(locationChanged ? locationPayload : {}),
    educationLevel: normalizeEnum(
      ownerRaw.educationLevel,
      educationLevelValues
    ),
    educationLevelOther:
      ownerRaw.educationLevel === "lainnya"
        ? normalizeText(ownerRaw.educationLevelOther)
        : undefined,
    occupation: normalizeText(ownerRaw.occupation),
    monthlyIncome: normalizeNumber(ownerRaw.monthlyIncome),
    landOwnershipStatus: normalizeEnum(
      ownerRaw.landOwnershipStatus,
      landOwnershipValues
    ),
    houseOwnershipStatus: normalizeEnum(
      ownerRaw.houseOwnershipStatus,
      houseOwnershipValues
    ),
    hasReceivedHousingAssistance: normalizeBoolean(
      ownerRaw.hasReceivedHousingAssistance
    ),
    housingAssistanceYear: ownerRaw.hasReceivedHousingAssistance
      ? normalizeNumber(ownerRaw.housingAssistanceYear)
      : undefined,
    isRegisteredAsPoor: normalizeBoolean(ownerRaw.isRegisteredAsPoor),
    poorRegistrationAttachment: ownerRaw.isRegisteredAsPoor
      ? normalizeText(ownerRaw.poorRegistrationAttachment)
      : undefined,
  });

  return pickDefined({
    formRespondent: Object.keys(formRespondent).length
      ? formRespondent
      : undefined,
    householdOwner: Object.keys(householdOwner).length
      ? householdOwner
      : undefined,
  });
};

const submitEditForm = async () => {
  if (!editFormRef.value || !selectedSubmission.value?.id) return;

  const { valid } = await editFormRef.value.validate();
  if (!valid) return;

  isLoading.value = true;
  try {
    const payload = buildEditPayload();
    const result = await housingStore.updateSubmission(
      selectedSubmission.value.id,
      payload
    );
    if (result.success) {
      showEditDialog.value = false;
      await loadData();
    }
  } catch (error) {
    console.error("Error updating submission:", error);
  } finally {
    isLoading.value = false;
  }
};

const reviewSubmission = (submission, status) => {
  selectedSubmission.value = submission;
  if (status === "rejected") {
    reviewData.value = {
      status: status,
      reviewNotes: "",
    };
    reviewFormValid.value = false;
    showReviewDialog.value = true;
    return;
  }
  submitReviewDirect(submission, status);
};

const submitReviewDirect = async (submission, status) => {
  if (!submission?.id) return;
  isLoading.value = true;
  try {
    const result = await housingStore.reviewSubmission(submission.id, {
      status,
      reviewNotes: "",
    });
    if (result.success) {
      selectedSubmission.value = null;
      reviewData.value = { status: "", reviewNotes: "" };
      await loadData();
      if (status === "approved") {
        await mapStore.fetchHousing();
      }
    }
  } catch (error) {
    console.error("Error submitting review:", error);
  } finally {
    isLoading.value = false;
  }
};

const submitReview = async () => {
  if (!reviewFormRef.value) return;

  const { valid } = await reviewFormRef.value.validate();
  if (!valid) return;

  isLoading.value = true;
  try {
    const status = reviewData.value.status;
    const result = await housingStore.reviewSubmission(
      selectedSubmission.value.id,
      reviewData.value
    );

    if (result.success) {
      showReviewDialog.value = false;
      selectedSubmission.value = null;
      reviewData.value = { status: "", reviewNotes: "" };
      await loadData(); // Refresh the list
      if (status === "approved") {
        await mapStore.fetchHousing();
      }
    }
  } catch (error) {
    console.error("Error submitting review:", error);
  } finally {
    isLoading.value = false;
  }
};

// Debounced search
const debouncedSearch = debounce(() => {
  // Implement search functionality here
  // For now, just refresh data with location parameters
  loadData();
}, 500);

// Utility functions
const getStatusColor = (status) => {
  if (!status) return "grey";
  const colors = {
    draft: "grey",
    submitted: "blue",
    reviewed: "amber",
    under_review: "amber",
    approved: "green",
    rejected: "red",
    history: "blue-grey",
  };
  return colors[status] || "grey";
};

const getStatusIcon = (status) => {
  if (!status) return "mdi-file-document-outline";
  const icons = {
    draft: "mdi-file-outline",
    submitted: "mdi-file-send-outline",
    reviewed: "mdi-file-eye-outline",
    under_review: "mdi-file-eye-outline",
    approved: "mdi-file-check-outline",
    rejected: "mdi-file-remove-outline",
    history: "mdi-history",
  };
  return icons[status] || "mdi-file-document-outline";
};

const getStatusLabel = (status) => {
  if (!status) return "Tidak Dikenal";
  const labels = {
    draft: "Draft",
    submitted: "Diajukan",
    reviewed: "Dalam Review",
    under_review: "Dalam Review",
    approved: "Disetujui",
    rejected: "Ditolak",
    history: "Riwayat",
  };
  return labels[status] || status;
};

const canViewFullPii = computed(() => appStore.hasPermission("view_full_pii"));

const canCreateHousing = computed(
  () =>
    !appStore.isVerifikator &&
    !appStore.isAdminKabupaten &&
    appStore.hasPermission("housing:create")
);

const canExportHousing = computed(() =>
  appStore.hasPermission("export_housing")
);

const getNoKkValue = (item) => {
  const owner = item?.householdOwner || {};
  return (
    owner.familyCardNumber ||
    owner.nik ||
    owner.nationalId ||
    owner.identityNumber ||
    owner.idNumber ||
    owner.ktpNumber ||
    owner.noKtp ||
    ""
  );
};

const formatNoKk = (value) => {
  if (!value) return "N/A";
  if (canViewFullPii.value) return value;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "N/A";
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}${"*".repeat(Math.max(digits.length - 2, 1))}`;
  }
  const head = digits.slice(0, 4);
  const tail = digits.slice(-2);
  return `${head}${"*".repeat(digits.length - 6)}${tail}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("id-ID");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

const formatTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "N/A";
  }
};

// Helper functions to format enum values to Indonesian labels
const formatPosition = (value) => {
  if (!value) return "N/A";
  const mapping = {
    perangkat_desa: "Perangkat Desa/Kelurahan",
    pemilik_rumah: "Pemilik Rumah",
    lainnya: "Lainnya",
  };
  return mapping[value] || value;
};

const formatEducationLevel = (value) => {
  if (!value) return "N/A";
  const mapping = {
    tidak_sekolah: "Tidak Sekolah",
    sd: "SD/Sederajat",
    smp: "SMP/Sederajat",
    sma: "SMA/Sederajat",
    diploma: "Diploma",
    sarjana: "Sarjana",
    magister: "Pascasarjana",
    lainnya: "Lainnya",
  };
  return mapping[value] || value;
};

const formatOccupation = (value) => {
  if (!value) return "N/A";
  // Occupation is usually a string, return as is
  return value;
};

const formatLandOwnership = (value) => {
  if (!value) return "N/A";
  const mapping = {
    milik_sendiri: "Milik Sendiri",
    bukan_milik_sendiri: "Bukan Milik Sendiri",
  };
  return mapping[value] || value;
};

const formatHouseOwnership = (value) => {
  if (!value) return "N/A";
  const mapping = {
    milik_sendiri: "Milik Sendiri",
    sewa: "Sewa",
    menumpang: "Menumpang",
  };
  return mapping[value] || value;
};

const formatHouseType = (value) => {
  if (!value) return "N/A";
  const mapping = {
    rumah_tapak: "Rumah Tapak",
    rumah_susun: "Rumah Susun",
    rumah_petak: "Rumah Petak",
    kos: "Kos",
  };
  return mapping[value] || value;
};

const formatFloorMaterial = (value) => {
  if (!value) return "N/A";
  const mapping = {
    tanah: "Tanah",
    keramik: "Keramik",
    rabat_semen: "Rabat Semen",
    papan: "Papan",
    kayu: "Kayu",
    bata: "Bata",
  };
  return mapping[value] || value;
};

const formatWallMaterial = (value) => {
  if (!value) return "N/A";
  const mapping = {
    tembok_tanpa_plester: "Tembok/Bata/Batako Tanpa Plester",
    tembok_dengan_plester: "Tembok Bata/Batako dengan Plester",
    papan: "Papan",
    anyaman_bambu: "Anyaman Bambu",
    lainnya: "Lainnya",
  };
  return mapping[value] || value;
};

const formatRoofMaterial = (value) => {
  if (!value) return "N/A";
  const mapping = {
    genteng_beton: "Genteng (Beton/Keramik)",
    seng_multiroof: "Seng/Multiroof",
    kayu_sirap: "Kayu/Sirap",
    asbes: "Asbes",
    lainnya: "Lainnya",
  };
  return mapping[value] || value;
};

const formatWaterSource = (value) => {
  if (!value) return "N/A";
  const mapping = {
    sumur_gali: "Sumur Gali",
    sumur_bor: "Sumur Bor",
    ledeng: "Ledeng",
    lainnya: "Sumber Air Lainnya",
  };
  return mapping[value] || value;
};

const formatWaterLocation = (value) => {
  if (!value) return "N/A";
  const mapping = {
    di_tanah_sendiri: "Di Dalam Tanah Sendiri",
    menumpang_tempat_lain: "Menumpang/Mengambil dari Tempat Lain",
  };
  return mapping[value] || value;
};

const formatToiletOwnership = (value) => {
  if (!value) return "N/A";
  const mapping = {
    milik_sendiri: "Milik Sendiri",
    jamban_bersama: "Jamban Bersama",
    tidak_memiliki: "Tidak Memiliki Jamban",
  };
  return mapping[value] || value;
};

const formatToiletType = (value) => {
  if (!value) return "N/A";
  const mapping = {
    cubluk: "Cubluk",
    leher_angsa_jongkok: "Leher Angsa (Jongkok)",
    leher_angsa_duduk: "Leher Angsa (Duduk)",
  };
  return mapping[value] || value;
};

const formatSepticTankType = (value) => {
  if (!value) return "N/A";
  const mapping = {
    biotank: "Biotank",
    tanki_permanen: "Tanki dengan Konstruksi Permanen",
    lubang_tanah: "Lubang Tanah",
    tidak_memiliki: "Tidak Memiliki Tanki",
  };
  return mapping[value] || value;
};

const formatSepticPumpingService = (value) => {
  if (!value) return "N/A";
  const mapping = {
    pemda: "Pemda",
    swasta_perorangan: "Swasta (Perorangan/Badan Usaha)",
  };
  return mapping[value] || value;
};

const formatWastewaterDisposal = (value) => {
  if (!value) return "N/A";
  const mapping = {
    jaringan_pipa: "Tergabung dalam Jaringan Pipa Pengolahan Air Limbah",
    tangki_septic: "Tergabung dalam Tangki Septic",
    drainase_sungai: "Langsung Dialirkan ke Drainase/Saluran/Sungai",
    resapan_tanah: "Ditampung dalam Lubang/Resapan ke Tanah",
  };
  return mapping[value] || value;
};

const formatWasteCollectionManager = (value) => {
  if (!value) return "N/A";
  const mapping = {
    pemda: "Pemda",
    pemdes: "Pemdes",
    lsm_kelompok_masyarakat: "LSM/Kelompok Masyarakat",
    swasta: "Lainnya",
  };
  return mapping[value] || value;
};

const formatWasteDisposalMethod = (value) => {
  if (!value) return "N/A";
  const mapping = {
    dibakar: "Dibakar",
    diolah_rumah: "Diolah di Rumah (Kompos/Ditimbun)",
    tempat_sampah_umum: "Dibuang ke Tempat Sampah Umum",
    dibuang_lainnya: "Dibuang di Tempat Lainnya",
  };
  return mapping[value] || value;
};

const formatRoadType = (value) => {
  if (!value) return "N/A";
  const mapping = {
    lebar_kurang_3_5m: "Jalan Lebar < 3,5 m",
    lebar_lebih_3_5m: "Jalan Lebar > 3,5 m",
    tidak_ada_akses:
      "Tidak Terdapat Jalan Akses/Melalui Perkarangan Orang Lain",
  };
  return mapping[value] || value;
};

const formatRoadConstruction = (value) => {
  if (!value) return "N/A";
  const mapping = {
    beton: "Jalan Beton",
    aspal: "Jalan Aspal",
    konblok: "Jalan Konblok",
    tanah_sirtu: "Jalan Tanah/Sirtu",
    lainnya: "Konstruksi Lainnya",
  };
  return mapping[value] || value;
};

const formatElectricitySource = (value) => {
  if (!value) return "N/A";
  const mapping = {
    pln_sendiri: "PLN Sendiri",
    pln_menumpang: "PLN Menumpang",
    tidak_ada: "Tidak Ada",
    lainnya: "Lainnya",
  };
  return mapping[value] || value;
};

// Lifecycle
onMounted(async () => {
  try {
    console.log("Housing Data page mounted");
    console.log("Housing store:", housingStore);
    console.log("Current submissions:", housingStore.submissions);
    await fetchFilterProvinces();
    await loadLocationFilters();
    loadData();
  } catch (error) {
    console.error("Error in onMounted:", error);
  }
});

// Watch for filter changes
watch(
  () => filters.value,
  async () => {
    try {
      await loadData();
    } catch (error) {
      console.error("Error in filter watch:", error);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-card {
  border-radius: 8px;
}

.v-chip {
  border-radius: 16px;
}

.data-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  min-width: 720px;
}

@media (max-width: 600px) {
  .v-card-title {
    row-gap: 8px;
  }

  .data-table {
    min-width: 640px;
  }
}
@media (max-width: 600px) {
  /* Judul (h2) dibuat lebih ringkas */
  h2.text-h6 {
    font-size: 0.875rem !important; /* Setara 14px */
    line-height: 1.1rem !important;
  }

  /* Deskripsi (p) dibuat sangat kecil */
  .text-tiny-mobile {
    font-size: 0.6rem !important; /* Setara 9.5px - 10px */
    line-height: 0.85rem !important; /* Jarak antar baris dirapatkan */
    letter-spacing: 0.01em !important;
    opacity: 0.8; /* Sedikit lebih tipis agar tidak terlalu 'berat' di mata */
  }

  /* Mengurangi padding card-title di mobile agar lebih hemat ruang */
  .v-card-title {
    padding: 12px !important;
  }
}
</style>
