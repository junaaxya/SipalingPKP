<template>
  <div>
    <!-- Loading Overlay -->
    <v-overlay :model-value="isLoading" class="align-center justify-center">
      <v-progress-circular color="primary" indeterminate size="64" />
    </v-overlay>

    <v-snackbar
      v-model="searchErrorSnackbar"
      color="error"
      location="top right"
      timeout="5000"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2"> mdi-alert-circle </v-icon>
        <span>{{ searchErrorMessage }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" @click="searchErrorSnackbar = false">
          Tutup
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="exportErrorSnackbar"
      color="error"
      location="top right"
      timeout="5000"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2"> mdi-alert-circle </v-icon>
        <span>{{ exportErrorMessage }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" @click="exportErrorSnackbar = false">
          Tutup
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="exportInfoSnackbar"
      color="info"
      location="top right"
      timeout="4000"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2"> mdi-information </v-icon>
        <span>{{ exportInfoMessage }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" @click="exportInfoSnackbar = false">
          Tutup
        </v-btn>
      </template>
    </v-snackbar>

    <div v-if="isMasyarakat">
      <v-card class="mb-6" elevation="2" rounded="xl">
        <v-card-text class="pa-6 pa-md-8">
          <div
            class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between"
          >
            <div class="mb-4 mb-md-0">
              <h1 class="text-h5 text-md-h4 font-weight-bold mb-2">
                Selamat datang, {{ userProfile.name }}
              </h1>
              <p class="text-body-2 text-md-body-1 text-medium-emphasis">
                Pantau progres verifikasi dan riwayat survei yang sudah Anda kirim.
              </p>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-row class="mb-6">
        <v-col cols="12" md="5">
          <v-card elevation="2" rounded="xl" class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-progress-check</v-icon>
              Progres Verifikasi
            </v-card-title>
            <v-card-text>
              <v-progress-circular
                v-if="masyarakatLoading"
                indeterminate
                size="28"
                width="3"
                color="primary"
                class="mb-2"
              />
              <div
                v-else-if="!latestSubmission"
                class="text-body-2 text-medium-emphasis"
              >
                Belum ada pengajuan survei yang dikirim.
              </div>
              <div v-else>
                <div class="text-caption text-medium-emphasis mb-3">
                  Pengajuan terbaru: {{ latestSubmissionTitle }}
                </div>
                <v-stepper
                  :model-value="progressStep"
                  alt-labels
                  class="elevation-0"
                  direction="vertical"
                >
                  <v-stepper-header>
                    <v-stepper-item
                      v-for="stage in progressStages"
                      :key="stage.value"
                      :value="stage.value"
                      :complete="progressStep > stage.value"
                      :title="stage.title"
                      color="primary"
                    />
                  </v-stepper-header>
                </v-stepper>
                <v-alert
                  v-if="latestSubmission?.status === 'rejected'"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="mt-3"
                >
                  Ditolak: {{ latestSubmissionNote }}
                </v-alert>
                <v-alert
                  v-else-if="latestSubmission?.status === 'approved'"
                  type="success"
                  variant="tonal"
                  density="compact"
                  class="mt-3"
                >
                  Disetujui.
                  <span v-if="latestSubmissionNote && latestSubmissionNote !== '-'">
                    Catatan: {{ latestSubmissionNote }}
                  </span>
                </v-alert>
                <v-alert
                  v-else-if="latestSubmission?.status === 'reviewed'"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mt-3"
                >
                  Pengajuan sedang diverifikasi.
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="7">
          <v-card elevation="2" rounded="xl" class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-clipboard-text</v-icon>
              Riwayat Survei Anda
            </v-card-title>
            <v-card-text>
              <v-progress-circular
                v-if="masyarakatLoading"
                indeterminate
                size="28"
                width="3"
                color="primary"
              />
              <v-table v-else-if="masyarakatSubmissions.length" density="compact">
                <thead>
                  <tr>
                    <th class="text-left">Tanggal</th>
                    <th class="text-left">Pengajuan</th>
                    <th class="text-left">Status</th>
                    <th class="text-left">Catatan Verifikator</th>
                    <th class="text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="submission in masyarakatSubmissions"
                    :key="submission.id"
                  >
                    <td>
                      {{ formatSubmissionDate(submission.submittedAt || submission.createdAt) }}
                    </td>
                    <td>
                      {{ submission.householdOwner?.ownerName || 'Pengajuan Rumah' }}
                    </td>
                    <td>
                      <v-chip
                        size="x-small"
                        :color="getSubmissionStatusColor(submission.status)"
                        variant="tonal"
                      >
                        {{ getSubmissionStatusLabel(submission.status) }}
                      </v-chip>
                    </td>
                    <td class="text-body-2 text-medium-emphasis">
                      {{ getSubmissionNote(submission) }}
                    </td>
                    <td>
                      <v-btn
                        v-if="submission.status === 'rejected'"
                        color="error"
                        size="small"
                        variant="flat"
                        class="text-none"
                        @click="handleFixSubmission(submission)"
                      >
                        Perbaiki Data
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <v-sheet
                v-else
                class="pa-6 text-center"
                rounded="lg"
                color="grey-lighten-4"
              >
                <v-icon
                  size="56"
                  color="primary"
                  class="mb-3"
                >
                  mdi-home-account
                </v-icon>
                <div class="text-body-1 font-weight-medium mb-2">
                  Belum ada survei yang dikirim.
                </div>
                <div class="text-body-2 text-medium-emphasis mb-4">
                  Mulai isi survei rumah Anda agar proses verifikasi bisa berjalan.
                </div>
                <v-btn
                  color="primary"
                  size="large"
                  class="text-none"
                  @click="handleStartSurvey"
                >
                  Mulai Isi Survei Rumah Anda
                </v-btn>
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div v-else>
    <!-- Welcome Section -->
    <v-card class="mb-6" elevation="2" rounded="xl">
      <v-card-text class="pa-6 pa-md-8">
        <div
          class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between"
        >
          <div class="mb-4 mb-md-0">
            <h1 class="text-h5 text-md-h4 font-weight-bold mb-2">
              Selamat datang kembali, {{ userProfile.name }}!
            </h1>
            <p class="text-body-2 text-md-body-1 text-medium-emphasis">
              Berikut yang terjadi di dashboard SIPALING PKP hari ini.
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-row v-if="isAdminDesa" class="mb-6">
      <v-col cols="12" md="8">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-clipboard-check</v-icon>
            Progres Data Warga Desa
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="item in villageStatusSummary"
                :key="item.key"
                cols="12"
                sm="6"
                md="3"
              >
                <v-card
                  :color="item.color"
                  variant="tonal"
                  class="text-center"
                >
                  <v-card-text>
                    <div class="text-h4 font-weight-bold">
                      {{ item.count }}
                    </div>
                    <div class="text-subtitle-2">
                      {{ item.label }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card elevation="2" rounded="xl" class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">
              mdi-account-multiple-check
            </v-icon>
            Warga Belum Terdata
          </v-card-title>
          <v-card-text>
            <v-progress-circular
              v-if="isLoading"
              indeterminate
              size="28"
              width="3"
              color="primary"
              class="mb-2"
            />
            <div
              v-else-if="unregisteredHouseholds === null"
              class="text-body-2 text-medium-emphasis"
            >
              Database kependudukan desa belum tersedia.
            </div>
            <div v-else>
              <div class="text-h4 font-weight-bold">
                {{ formatNumber(unregisteredHouseholds) }}
              </div>
              <div class="text-caption text-medium-emphasis mt-2">
                Terdata: {{ formatNumber(housingCount) }} dari
                {{ formatNumber(villageHouseholdCount) }} KK.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" lg="3">
        <v-card
          elevation="2"
          rounded="xl"
          class="h-100 cursor-pointer"
          :class="{ 'hover-elevation': stat.route }"
          @click="stat.route && $router.push(stat.route)"
        >
          <v-card-text class="pa-4 pa-md-6">
            <div class="d-flex align-center justify-space-between">
              <div class="flex-grow-1">
                <p class="text-body-2 text-medium-emphasis mb-1">
                  {{ stat.title }}
                </p>
                <h2 class="text-h4 text-md-h3 font-weight-bold">
                  <v-progress-circular
                    v-if="stat.loading"
                    indeterminate
                    size="24"
                    width="2"
                    class="mr-2"
                  />
                  <span v-else>{{ stat.value }}</span>
                </h2>
                <div v-if="stat.description" class="d-flex align-center mt-2">
                  <v-icon size="small" class="mr-1" color="primary">
                    mdi-information-outline
                  </v-icon>
                  <span class="text-caption text-medium-emphasis">
                    {{ stat.description }}
                  </span>
                </div>
                <div
                  v-if="stat.breakdown"
                  class="d-flex flex-wrap gap-2 mt-3"
                >
                  <v-chip size="x-small" color="success" variant="tonal">
                    Disetujui {{ formatNumber(stat.breakdown.verified) }}
                  </v-chip>
                  <v-chip size="x-small" color="warning" variant="tonal">
                    Pending {{ formatNumber(stat.breakdown.pending) }}
                  </v-chip>
                  <v-chip size="x-small" color="error" variant="tonal">
                    Ditolak {{ formatNumber(stat.breakdown.rejected) }}
                  </v-chip>
                </div>
              </div>
              <v-avatar
                :color="stat.color"
                size="48"
                size-md="56"
                variant="tonal"
                class="ml-3"
              >
                <v-icon :color="stat.color" size="24" size-md="28">
                  {{ stat.icon }}
                </v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="!isMasyarakat" class="mb-4">
      <v-col cols="12">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-filter</v-icon>
            Filter Wilayah & Tahun
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col v-if="showProvinceFilter" cols="12" sm="6" md="3">
                <v-select
                  v-model="dashboardFilters.provinceId"
                  :items="provinceOptions"
                  item-title="name"
                  item-value="id"
                  label="Provinsi"
                  density="comfortable"
                  variant="outlined"
                  :loading="dashboardFilterLoading"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="dashboardFilters.regencyId"
                  :items="regencyOptions"
                  item-title="name"
                  item-value="id"
                  label="Kabupaten / Kota"
                  density="comfortable"
                  variant="outlined"
                  :loading="dashboardFilterLoading"
                  :disabled="appStore.isAdminKabupaten || appStore.isAdminDesa"
                  :clearable="showProvinceFilter"
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="dashboardFilters.districtId"
                  :items="districtOptions"
                  item-title="name"
                  item-value="id"
                  label="Kecamatan"
                  density="comfortable"
                  variant="outlined"
                  :loading="dashboardFilterLoading"
                  :disabled="appStore.isAdminDesa || !dashboardFilters.regencyId"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="dashboardFilters.villageId"
                  :items="villageOptions"
                  item-title="name"
                  item-value="id"
                  label="Desa / Kelurahan"
                  density="comfortable"
                  variant="outlined"
                  :loading="dashboardFilterLoading"
                  :disabled="appStore.isAdminDesa || !dashboardFilters.districtId"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="dashboardFilters.surveyYear"
                  :items="yearOptions"
                  label="Tahun Survei"
                  density="comfortable"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>
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
            <span class="mr-2">Statistik difilter berdasarkan lokasi:</span>
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

    <!-- Map Section -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="2" rounded="xl" class="map-section-card">
          <!-- Header -->
          <v-card-title class="pa-6 pb-0">
            <div
              class="d-flex align-center justify-space-between flex-wrap gap-3"
            >
              <div>
                <div class="d-flex align-center gap-2 mb-1">
                  <v-icon color="primary" size="28"
                    >mdi-map-marker-radius</v-icon
                  >
                  <h3 class="text-h6 font-weight-bold mb-0">
                    Peta Lokasi Data
                  </h3>
                </div>
                <p class="text-caption text-medium-emphasis ml-9 mb-0">
                  Visualisasi lokasi survei dengan filter interaktif
                </p>
              </div>

              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="tonal"
                    color="primary"
                    prepend-icon="mdi-file-excel"
                    class="text-none"
                    :loading="exportLoading"
                  >
                    Ekspor Data
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    :disabled="exportLoading"
                    @click="handleExport()"
                  >
                    <v-list-item-title>Ekspor Data (Excel)</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </v-card-title>

          <v-divider class="mt-4 mx-6" />

          <!-- Filter Controls -->
          <v-card-text class="pa-6">
            <!-- Filter Grid -->
            <v-row dense class="mb-4">
              <!-- Filter Lokasi -->
              <v-col cols="12" sm="6" md="4">
                <v-card
                  variant="outlined"
                  class="filter-card pa-4"
                  rounded="lg"
                >
                  <div class="filter-header mb-3">
                    <v-icon size="20" color="primary" class="mr-2"
                      >mdi-map-marker-multiple</v-icon
                    >
                    <span class="text-body-2 font-weight-medium"
                      >Filter Lokasi</span
                    >
                  </div>
                  <v-select
                    v-model="selectedLocationFilters"
                    :items="locationFilterOptions"
                    item-title="label"
                    item-value="value"
                    multiple
                    chips
                    variant="outlined"
                    density="comfortable"
                    placeholder="Pilih jenis lokasi"
                    hide-details
                    closable-chips
                  >
                    <template #chip="{ props, item }">
                      <v-chip v-bind="props" size="small" label>
                        {{ item.title }}
                      </v-chip>
                    </template>
                  </v-select>
                </v-card>
              </v-col>

              <!-- Layer GIS -->
              <v-col cols="12" sm="6" md="4">
                <v-card
                  variant="outlined"
                  class="filter-card pa-4"
                  rounded="lg"
                >
                  <div class="filter-header mb-3">
                    <v-icon size="20" color="primary" class="mr-2"
                      >mdi-layers-triple</v-icon
                    >
                    <span class="text-body-2 font-weight-medium"
                      >Layer GIS</span
                    >
                    <v-spacer />
                    <v-chip
                      v-if="activeLayerCount > 0"
                      size="x-small"
                      color="primary"
                      variant="flat"
                      class="ml-2"
                    >
                      {{ activeLayerCount }}
                    </v-chip>
                  </div>

                  <v-menu
                    v-model="layerMenu"
                    :close-on-content-click="false"
                    location="bottom"
                    max-width="420"
                  >
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        variant="outlined"
                        block
                        class="justify-space-between text-none px-4"
                        height="40"
                      >
                        <span class="text-body-2">
                          {{
                            activeLayerCount
                              ? `${activeLayerCount} Layer Dipilih`
                              : "Pilih Layer"
                          }}
                        </span>
                        <v-icon size="20">
                          {{
                            layerMenu ? "mdi-chevron-up" : "mdi-chevron-down"
                          }}
                        </v-icon>
                      </v-btn>
                    </template>

                    <v-card rounded="lg" elevation="8">
                      <!-- Search Header -->
                      <v-card-text class="pa-4 pb-3">
                        <v-text-field
                          v-model="layerSearch"
                          density="comfortable"
                          variant="outlined"
                          prepend-inner-icon="mdi-magnify"
                          placeholder="Cari layer..."
                          hide-details
                          clearable
                        />

                        <div
                          class="d-flex align-center justify-space-between mt-3"
                        >
                          <span class="text-caption text-medium-emphasis">
                            {{ activeLayerCount }} dari
                            {{ getTotalLayerCount() }} layer aktif
                          </span>
                          <v-switch
                            v-model="autoFitEnabled"
                            density="compact"
                            inset
                            hide-details
                            color="primary"
                            class="ml-2"
                          >
                            <template #label>
                              <span class="text-caption">Auto Zoom</span>
                            </template>
                          </v-switch>
                        </div>
                      </v-card-text>

                      <v-divider />

                      <!-- Layer List -->
                      <div class="layer-scroll-container">
                        <v-expansion-panels variant="accordion" multiple flat>
                          <v-expansion-panel
                            v-for="category in filteredLayerEntries"
                            :key="category.key"
                            elevation="0"
                          >
                            <v-expansion-panel-title class="px-4">
                              <div class="d-flex align-center">
                                <v-icon size="18" class="mr-2"
                                  >mdi-folder-outline</v-icon
                                >
                                <span class="text-body-2 font-weight-medium">{{
                                  category.label
                                }}</span>
                                <v-chip
                                  size="x-small"
                                  variant="tonal"
                                  class="ml-2"
                                >
                                  {{ category.layers.length }}
                                </v-chip>
                              </div>
                            </v-expansion-panel-title>

                            <v-expansion-panel-text class="pa-0">
                              <v-list density="compact" class="py-0">
                                <v-list-item
                                  v-for="layer in category.layers"
                                  :key="layer.id"
                                  class="px-4"
                                >
                                  <template #prepend>
                                    <v-checkbox-btn
                                      :model-value="layer.active"
                                      :disabled="layer.loading"
                                      color="primary"
                                      @update:model-value="
                                        toggleLayer(category.key, layer.id)
                                      "
                                    />
                                  </template>

                                  <v-list-item-title class="text-body-2">
                                    {{ layer.label }}
                                  </v-list-item-title>

                                  <template #append>
                                    <v-progress-circular
                                      v-if="layer.loading"
                                      indeterminate
                                      size="16"
                                      width="2"
                                      color="primary"
                                    />
                                  </template>
                                </v-list-item>
                              </v-list>
                            </v-expansion-panel-text>
                          </v-expansion-panel>
                        </v-expansion-panels>

                        <!-- Empty State -->
                        <div
                          v-if="!filteredLayerEntries.length"
                          class="text-center py-8"
                        >
                          <v-icon size="48" color="grey-lighten-1" class="mb-2">
                            mdi-layers-off-outline
                          </v-icon>
                          <p class="text-body-2 text-medium-emphasis">
                            Tidak ada layer yang ditemukan
                          </p>
                        </div>
                      </div>
                    </v-card>
                  </v-menu>
                </v-card>
              </v-col>

              <!-- Pencarian Cepat -->
              <v-col cols="12" sm="12" md="4">
                <v-card
                  variant="outlined"
                  class="filter-card pa-4"
                  rounded="lg"
                >
                  <div class="filter-header mb-3">
                    <v-icon size="20" color="primary" class="mr-2"
                      >mdi-map-search</v-icon
                    >
                    <span class="text-body-2 font-weight-medium"
                      >Pencarian Lokasi</span
                    >
                  </div>

                  <v-autocomplete
                    v-model="searchSelection"
                    v-model:search="searchQuery"
                    v-model:menu="searchMenu"
                    :items="filteredSearchItems"
                    item-title="name"
                    item-value="id"
                    return-object
                    variant="outlined"
                    density="comfortable"
                    placeholder="Cari desa, kecamatan, kabupaten..."
                    :loading="searchLoading"
                    :error="Boolean(searchErrorMessage)"
                    :no-data-text="
                      searchLoading ? 'Memuat...' : 'Tidak ada hasil'
                    "
                    clearable
                    hide-details
                    @focus="ensureSearchIndex"
                    @update:model-value="handleSearchSelect"
                    @keydown.enter.prevent="handleSearchEnter"
                  >
                    <template #prepend-inner>
                      <v-icon size="20" color="grey">mdi-magnify</v-icon>
                    </template>

                    <template #item="{ props, item }">
                      <v-list-item v-bind="props" class="px-4">
                        <template #prepend>
                          <v-avatar size="32" color="primary" variant="tonal">
                            <v-icon size="18">
                              {{ getSearchIcon(item?.raw?.category) }}
                            </v-icon>
                          </v-avatar>
                        </template>

                        <v-list-item-title
                          class="text-body-2 font-weight-medium"
                          v-html="highlightSearchText(item?.raw?.name)"
                        />

                        <v-list-item-subtitle class="text-caption">
                          {{ formatSearchSubtitle(item?.raw) }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </template>

                    <template #no-data>
                      <div class="pa-4 text-center">
                        <v-icon size="40" color="grey-lighten-1" class="mb-2">
                          mdi-map-marker-question-outline
                        </v-icon>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                          {{
                            searchLoading
                              ? "Memuat indeks lokasi..."
                              : searchQuery
                              ? "Lokasi tidak ditemukan"
                              : "Ketik nama lokasi"
                          }}
                        </p>
                      </div>
                    </template>
                  </v-autocomplete>
                </v-card>
              </v-col>
            </v-row>

          </v-card-text>

          <!-- Map Container -->
          <v-card-text class="pa-6 pt-0">
            <v-card
              variant="outlined"
              rounded="lg"
              class="map-container-wrapper"
            >
              <div class="map-wrapper">
                <div ref="mapRef" class="map-container" />

                <!-- Legend -->
                <div
                  v-if="legendEntries.length"
                  class="map-legend elevation-4"
                  :class="{
                    'map-legend-left': legendPinnedLeft,
                    'map-legend-collapsed': legendCollapsed,
                  }"
                >
                  <div class="legend-header">
                    <div class="d-flex align-center">
                      <v-icon size="16" class="mr-2"
                        >mdi-format-list-bulleted</v-icon
                      >
                      <span class="text-caption font-weight-bold">LEGEND</span>
                    </div>
                    <div class="legend-actions">
                      <v-btn
                        icon
                        size="x-small"
                        variant="text"
                        density="comfortable"
                        :color="legendPinnedLeft ? 'primary' : 'default'"
                        @click="legendPinnedLeft = !legendPinnedLeft"
                      >
                        <v-icon size="16">
                          {{ legendPinnedLeft ? "mdi-pin" : "mdi-pin-outline" }}
                        </v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        size="x-small"
                        variant="text"
                        density="comfortable"
                        @click="legendCollapsed = !legendCollapsed"
                      >
                        <v-icon size="16">
                          {{
                            legendCollapsed
                              ? "mdi-chevron-up"
                              : "mdi-chevron-down"
                          }}
                        </v-icon>
                      </v-btn>
                    </div>
                  </div>

                  <v-divider v-show="!legendCollapsed" class="my-2" />

                  <div v-show="!legendCollapsed" class="legend-body">
                    <div
                      v-for="entry in legendEntries"
                      :key="entry.key"
                      class="legend-item"
                    >
                      <span
                        class="legend-swatch"
                        :style="legendSwatchStyle(entry.style)"
                      />
                      <span class="text-caption">
                        {{ entry.label }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Statistics Charts -->
    <v-row class="mt-6">
      <!-- Chart: Rumah Layak Huni vs Tidak Layak Huni -->
      <v-col cols="12" md="6">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="pa-6 pb-0">
            <h3 class="text-h6 font-weight-bold">
              Persentase Rumah Layak Huni
            </h3>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              Distribusi status kelayakan rumah
            </p>
          </v-card-title>
          <v-card-text class="pa-6">
            <div class="chart-container">
              <canvas ref="housingChartRef" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="!isMasyarakat" cols="12" md="6">
        <template v-if="showActivityWidget">
          <v-card elevation="2" rounded="xl">
            <v-card-title class="pa-6 pb-0">
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-history</v-icon>
                <h3 class="text-h6 font-weight-bold mb-0">
                  Log Aktivitas Terbaru
                </h3>
              </div>
              <p class="text-caption text-medium-emphasis mt-1 mb-0">
                5 aktivitas terakhir yang tercatat
              </p>
            </v-card-title>
            <v-card-text class="pa-6">
              <v-progress-circular
                v-if="activityLogsLoading"
                indeterminate
                size="28"
                width="3"
                color="primary"
                class="mb-2"
              />
              <v-alert
                v-else-if="activityLogsError"
                type="error"
                variant="tonal"
                density="compact"
              >
                {{ activityLogsError }}
              </v-alert>
              <v-table v-else-if="activityLogs.length" density="compact">
                <thead>
                  <tr>
                    <th class="text-left">Aksi</th>
                    <th class="text-left">Pengguna</th>
                    <th class="text-left">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in activityLogs" :key="log.id">
                    <td class="text-body-2">
                      {{ formatAuditAction(log.action) }}
                    </td>
                    <td class="text-body-2">{{ log.userName }}</td>
                    <td class="text-caption text-medium-emphasis">
                      {{ formatSubmissionDate(log.createdAt || log.created_at) }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
              <v-alert v-else type="info" variant="tonal" density="compact">
                Belum ada aktivitas yang tercatat.
              </v-alert>
            </v-card-text>
          </v-card>

        </template>

        <v-card v-else-if="isVerifikator" elevation="2" rounded="xl">
          <v-card-title class="pa-6 pb-0">
            <div class="d-flex align-center">
              <v-icon color="warning" class="mr-2">mdi-timer-sand</v-icon>
              <h3 class="text-h6 font-weight-bold mb-0">Antrean Prioritas</h3>
            </div>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              5 laporan paling lama menunggu verifikasi
            </p>
          </v-card-title>
          <v-card-text class="pa-6">
            <v-progress-circular
              v-if="verificationQueueLoading"
              indeterminate
              size="28"
              width="3"
              color="warning"
              class="mb-2"
            />
            <v-list v-else-if="priorityQueueItems.length" density="compact">
              <v-list-item
                v-for="submission in priorityQueueItems"
                :key="submission.id"
              >
                <template #prepend>
                  <v-icon color="warning">mdi-alert-circle-outline</v-icon>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ submission.householdOwner?.ownerName || "Pengajuan Rumah" }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption text-medium-emphasis">
                  Masuk
                  {{
                    formatSubmissionDate(
                      submission.submittedAt || submission.createdAt
                    )
                  }}
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    class="text-none"
                    @click="openVerificationQueue(submission)"
                  >
                    Tinjau
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal" density="compact">
              Tidak ada antrean prioritas saat ini.
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card v-else-if="isAdminDesa" elevation="2" rounded="xl">
          <v-card-title class="pa-6 pb-0">
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-home-analytics</v-icon>
              <h3 class="text-h6 font-weight-bold mb-0">
                Ringkasan Kondisi Bangunan
              </h3>
            </div>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              Komponen dominan berdasarkan data rumah desa Anda
            </p>
          </v-card-title>
          <v-card-text class="pa-6">
            <v-progress-circular
              v-if="buildingSummaryLoading"
              indeterminate
              size="28"
              width="3"
              color="primary"
              class="mb-2"
            />
            <div
              v-else-if="!buildingSummaryTotal"
              class="text-body-2 text-medium-emphasis"
            >
              Belum ada data bangunan untuk ditampilkan.
            </div>
            <div v-else class="chart-container">
              <canvas ref="buildingChartRef" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="isAdminKabupaten" cols="12">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="pa-6 pb-0">
            <h3 class="text-h6 font-weight-bold">
              Perbandingan Data per Kecamatan
            </h3>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              Ringkasan status pengajuan di setiap kecamatan
            </p>
          </v-card-title>
          <v-card-text class="pa-6">
            <div
              v-if="!districtLabels.length"
              class="text-body-2 text-medium-emphasis"
            >
              Belum ada data kecamatan untuk ditampilkan.
            </div>
            <div v-else class="chart-container">
              <canvas ref="districtChartRef" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Chart: Data Masuk per Bulan -->
      <v-col cols="12">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="pa-6 pb-0">
            <h3 class="text-h6 font-weight-bold">Data Masuk per Bulan</h3>
            <p class="text-caption text-medium-emphasis mt-1 mb-0">
              Tren pengajuan survei dari berbagai jenis form
            </p>
          </v-card-title>
          <v-card-text class="pa-6">
            <div class="chart-container">
              <canvas ref="monthlyChartRef" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="2" rounded="xl">
          <v-card-title class="pa-6 pb-0">
            <h3 class="text-h6 font-weight-bold">Aksi Cepat</h3>
          </v-card-title>

          <v-card-text class="pa-6">
            <v-row>
              <v-col
                v-for="action in quickActions"
                :key="action.title"
                cols="12"
                sm="6"
                md="4"
              >
                <v-card
                  variant="outlined"
                  rounded="lg"
                  class="pa-4 text-center cursor-pointer"
                  hover
                  @click="handleQuickAction(action)"
                >
                  <v-icon :color="action.color" size="32" class="mb-3">
                    {{ action.icon }}
                  </v-icon>
                  <h4 class="text-body-1 font-weight-medium mb-1">
                    {{ action.title }}
                  </h4>
                  <p class="text-caption text-medium-emphasis">
                    {{ action.description }}
                  </p>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  nextTick,
  watch,
  onBeforeUnmount,
} from "vue";
import { definePage } from "unplugin-vue-router/runtime";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useHousingStore } from "@/stores/housing";
import {
  housingAPI,
  facilityAPI,
  housingDevelopmentAPI,
  exportAPI,
  locationAPI,
  userAPI,
} from "@/services";
import { useMapLayersStore } from "@/stores/mapLayers";
import { useMapUiStore } from "@/stores/mapUi";
import * as L from "leaflet";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Filler,
  DoughnutController,
  LineController,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Filler,
  DoughnutController,
  LineController
);

const donutCenterLabelPlugin = {
  id: "donutCenterLabel",
  afterDraw(chart, _args, pluginOptions) {
    if (chart.config.type !== "doughnut") return;
    const options = pluginOptions || {};
    const value = Number(options.value || 0);
    const total = Number(options.total || 0);
    const label = options.label || "";
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    const text = `${percent}% ${label}`.trim();

    if (!text || !chart.chartArea) return;

    const { ctx, chartArea } = chart;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.font = `600 ${options.fontSize || 16}px ${options.fontFamily || "sans-serif"}`;
    ctx.fillStyle = options.color || "#2E7D32";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, centerX, centerY);
    ctx.restore();
  },
};

ChartJS.register(donutCenterLabelPlugin);

definePage({
  meta: {
    layout: "dashboard",
  },
});

const router = useRouter();
const appStore = useAppStore();
const housingStore = useHousingStore();

// Reactive state
const isLoading = ref(false);
const housingCount = ref(0);
const infrastructureCount = ref(0);
const housingDevelopmentCount = ref(0);
const rumahLayakHuni = ref(0);
const rumahTidakLayakHuni = ref(0);
const monthlyLabels = ref([]);
const monthlyHousingCounts = ref([]);
const monthlyInfrastructureCounts = ref([]);
const monthlyHousingDevelopmentCounts = ref([]);
const districtLabels = ref([]);
const districtApprovedCounts = ref([]);
const districtPendingCounts = ref([]);
const districtRejectedCounts = ref([]);
const housingStatusSummary = ref({ verified: 0, pending: 0, rejected: 0 });
const infrastructureStatusSummary = ref({ verified: 0, pending: 0, rejected: 0 });
const developmentStatusSummary = ref({ verified: 0, pending: 0, rejected: 0 });
const totalStatusSummary = ref({ verified: 0, pending: 0, rejected: 0 });
const villageStatusCounts = ref({
  submitted: 0,
  reviewed: 0,
  approved: 0,
  rejected: 0,
  draft: 0
});
const mapRef = ref(null);
const mapInstance = ref(null);
const mapLayersStore = useMapLayersStore();
const mapUiStore = useMapUiStore();
const searchHighlightLayer = L.layerGroup();
const geoJsonLayerCache = new Map();
const markerLayers = {
  housing: L.layerGroup(),
  "housing-development": L.layerGroup(),
  infrastructure: L.layerGroup(),
};
const isMasyarakat = computed(() => appStore.isMasyarakat);
const isAdminDesa = computed(() => appStore.isAdminDesa);
const isAdminKabupaten = computed(() => appStore.isAdminKabupaten);
const isVerifikator = computed(() => appStore.isVerifikator);
const isSuperAdmin = computed(() => appStore.isSuperAdmin);
const masyarakatSubmissions = ref([]);
const masyarakatLoading = ref(false);
const verificationQueue = ref([]);
const verificationQueueLoading = ref(false);
const activityLogs = ref([]);
const activityLogsLoading = ref(false);
const activityLogsError = ref("");
const buildingSummaryLoading = ref(false);
const buildingSummaryCounts = ref({
  floor: 0,
  wall: 0,
  roof: 0,
});
const villageHouseholdCount = ref(null);
const unregisteredHouseholds = computed(() => {
  if (villageHouseholdCount.value === null || villageHouseholdCount.value === undefined) {
    return null;
  }
  const missing = Number(villageHouseholdCount.value) - Number(housingCount.value || 0);
  return Math.max(missing, 0);
});

const progressStages = [
  { value: 1, title: "Data Terkirim" },
  { value: 2, title: "Sedang Diverifikasi" },
  { value: 3, title: "Disetujui/Diterbitkan" },
];

const latestSubmission = computed(() => masyarakatSubmissions.value[0] || null);
const latestSubmissionNote = computed(() => {
  const submission = latestSubmission.value;
  if (!submission) return "-";
  return (
    submission.reviewNotes ||
    submission.verificationNotes ||
    submission.reviewerNotes ||
    submission.notes ||
    "-"
  );
});
const latestSubmissionTitle = computed(() => {
  const ownerName = latestSubmission.value?.householdOwner?.ownerName;
  return ownerName || "Pengajuan Rumah";
});

const progressStep = computed(() => {
  const status = latestSubmission.value?.status;
  if (status === "approved") return 3;
  if (status === "reviewed" || status === "under_review") return 2;
  if (status === "submitted") return 1;
  if (status === "rejected") return 2;
  return 1;
});

// Chart refs
const housingChartRef = ref(null);
const monthlyChartRef = ref(null);
const districtChartRef = ref(null);
const buildingChartRef = ref(null);
let housingChart = null;
let monthlyChart = null;
let districtChart = null;
let buildingChart = null;
let scaleControl = null;
let searchDebounceTimer = null;
let searchPopup = null;

const mapFilters = ref([
  {
    type: "housing",
    label: "Rumah Masyarakat",
    enabled: true,
  },
  {
    type: "housing-development",
    label: "Perumahan oleh Pengembang",
    enabled: true,
  },
  {
    type: "infrastructure",
    label: "Infrastruktur Desa",
    enabled: true,
  },
]);

const locationFilterOptions = [
  { label: "Rumah Masyarakat", value: "housing" },
  { label: "Perumahan oleh Pengembang", value: "housing-development" },
  { label: "Infrastruktur Desa", value: "infrastructure" },
];

const selectedLocationFilters = ref(
  locationFilterOptions.map((option) => option.value)
);

const dashboardFilters = ref({
  provinceId: null,
  regencyId: null,
  districtId: null,
  villageId: null,
  surveyYear: new Date().getFullYear(),
});
const dashboardFiltersReady = ref(false);
const dashboardFilterLoading = ref(false);
const provinceOptions = ref([]);
const regencyOptions = ref([]);
const districtOptions = ref([]);
const villageOptions = ref([]);
const dashboardFilterDebounceMs = 500;
let dashboardFilterDebounceTimer = null;

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, index) => currentYear - index);
});

const showProvinceFilter = computed(() =>
  appStore.isSuperAdmin || appStore.isVerifikator
);

const showActivityWidget = computed(() => isSuperAdmin.value || isAdminKabupaten.value);

const loadProvinceOptions = async () => {
  try {
    const response = await locationAPI.getProvinces();
    const provinces = response?.data?.provinces || response?.data || [];
    provinceOptions.value = provinces.map((item) => ({
      id: item.id,
      name: item.name,
    }));
  } catch (error) {
    provinceOptions.value = [];
  }
};

const loadRegencyOptions = async (provinceId) => {
  if (!provinceId) {
    regencyOptions.value = [];
    return;
  }
  try {
    const response = await locationAPI.getRegencies(provinceId);
    const regencies = response?.data?.regencies || response?.data || [];
    regencyOptions.value = regencies.map((item) => ({
      id: item.id,
      name: item.name,
    }));
  } catch (error) {
    regencyOptions.value = [];
  }
};

const loadDistrictOptions = async (regencyId) => {
  if (!regencyId) {
    districtOptions.value = [];
    return;
  }
  try {
    const response = await locationAPI.getDistricts(regencyId);
    const districts = response?.data?.districts || response?.data || [];
    districtOptions.value = districts.map((item) => ({
      id: item.id,
      name: item.name,
    }));
  } catch (error) {
    districtOptions.value = [];
  }
};

const loadVillageOptions = async (districtId) => {
  if (!districtId) {
    villageOptions.value = [];
    return;
  }
  try {
    const response = await locationAPI.getVillages(districtId);
    const villages = response?.data?.villages || response?.data || [];
    villageOptions.value = villages.map((item) => ({
      id: item.id,
      name: item.name,
    }));
  } catch (error) {
    villageOptions.value = [];
  }
};

const initializeDashboardFilters = async () => {
  const user = appStore.user || {};
  dashboardFilterLoading.value = true;

  if (appStore.isSuperAdmin || appStore.isVerifikator) {
    await loadProvinceOptions();
    if (!dashboardFilters.value.provinceId) {
      dashboardFilters.value.provinceId =
        user.assignedProvinceId || provinceOptions.value[0]?.id || null;
    }
  } else if (user.assignedProvinceId) {
    dashboardFilters.value.provinceId = user.assignedProvinceId;
  }

  if (appStore.isAdminKabupaten || appStore.isAdminDesa) {
    if (user.assignedRegencyId) {
      regencyOptions.value = [
        {
          id: user.assignedRegencyId,
          name: user.assignedRegency?.name || user.assignedRegencyName || "Kabupaten",
        },
      ];
      dashboardFilters.value.regencyId = user.assignedRegencyId;
    }
  } else if (dashboardFilters.value.provinceId) {
    await loadRegencyOptions(dashboardFilters.value.provinceId);
  }

  if (dashboardFilters.value.regencyId) {
    await loadDistrictOptions(dashboardFilters.value.regencyId);
  }

  if (appStore.isAdminDesa && user.assignedDistrictId) {
    dashboardFilters.value.districtId = user.assignedDistrictId;
  }

  if (dashboardFilters.value.districtId) {
    await loadVillageOptions(dashboardFilters.value.districtId);
  }

  if (appStore.isAdminDesa && user.assignedVillageId) {
    dashboardFilters.value.villageId = user.assignedVillageId;
  }

  dashboardFiltersReady.value = true;
  dashboardFilterLoading.value = false;
};

const layerMenu = ref(false);
const autoFitEnabled = ref(true);
const legendCollapsed = ref(false);
const legendPinnedLeft = ref(true);
const layerSearch = ref("");
const searchSelection = ref(mapUiStore.lastSearchSelection);
const searchQuery = ref(mapUiStore.lastSearchQuery || "");
const searchMenu = ref(false);
const searchErrorSnackbar = ref(false);
const exportErrorSnackbar = ref(false);
const exportInfoSnackbar = ref(false);
const exportErrorMessage = ref("");
const exportInfoMessage = ref("");
const exportLoading = ref(false);
const searchDebounceMs = 300;
const MAX_SEARCH_SUGGESTIONS = 50;

const activeLayerCount = computed(() => {
  let count = 0;
  Object.values(mapLayersStore.availableLayers).forEach((category) => {
    category.layers.forEach((layer) => {
      if (layer.active) {
        count += 1;
      }
    });
  });
  return count;
});

const getTotalLayerCount = () => {
  let total = 0;
  Object.values(mapLayersStore.availableLayers).forEach((category) => {
    total += category.layers.length;
  });
  return total;
};

const toggleLayer = (categoryKey, layerId) => {
  mapLayersStore.toggleLayer(categoryKey, layerId);
};

const filteredLayerEntries = computed(() => {
  const query = layerSearch.value.trim().toLowerCase();
  const entries = [];

  Object.entries(mapLayersStore.availableLayers).forEach(([key, category]) => {
    const filteredLayers = query
      ? category.layers.filter((layer) => {
          const label = layer.label?.toLowerCase() || "";
          const id = layer.id?.toLowerCase() || "";
          return label.includes(query) || id.includes(query);
        })
      : category.layers;

    if (filteredLayers.length) {
      entries.push({
        key,
        label: category.label,
        layers: filteredLayers,
      });
    }
  });

  return entries;
});

const searchItems = computed(() => mapUiStore.searchIndex);
const searchLoading = computed(() => mapUiStore.searchIndexLoading);
const searchErrorMessage = computed(() => mapUiStore.searchIndexError);

const searchCategoryIcons = {
  desa: "mdi-home-city-outline",
  kecamatan: "mdi-map-marker-radius",
  kabupaten: "mdi-city",
};

const searchZoomLevels = {
  desa: 15,
  kecamatan: 13,
  kabupaten: 11,
};

const ensureSearchIndex = async () => {
  await mapUiStore.loadSearchIndex();
};

const normalizeSearchText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildSearchHaystack = (item) => {
  const name = item?.name || "";
  const parent = item?.parent || "";
  return normalizeSearchText(`${name} ${parent}`);
};

const getSearchIcon = (category) =>
  searchCategoryIcons[category] || "mdi-map-marker";

const formatSearchSubtitle = (item) => {
  if (!item) {
    return "";
  }

  const parts = [];
  if (item.categoryLabel) {
    parts.push(item.categoryLabel);
  }
  if (item.parent) {
    parts.push(item.parent);
  }

  return parts.join(" - ");
};

const highlightSearchText = (value) => {
  const text = String(value || "");
  const queryRaw = String(searchQuery.value || "").trim();
  if (!queryRaw) {
    return escapeHtml(text);
  }

  const textLower = text.toLowerCase();
  const queryLower = queryRaw.toLowerCase();
  const index = textLower.indexOf(queryLower);
  if (index < 0) {
    return escapeHtml(text);
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + queryRaw.length);
  const after = text.slice(index + queryRaw.length);
  return `${escapeHtml(before)}<strong>${escapeHtml(match)}</strong>${escapeHtml(after)}`;
};

const scoreSearchEntry = (entry, query) => {
  const name = normalizeSearchText(entry?.name);
  if (name === query) {
    return 0;
  }
  if (name.startsWith(query)) {
    return 1;
  }

  const haystack = buildSearchHaystack(entry);
  if (haystack.startsWith(query)) {
    return 2;
  }

  return 3;
};

const filteredSearchItems = computed(() => {
  const query = normalizeSearchText(searchQuery.value);
  if (!query) {
    return [];
  }

  const items = searchItems.value || [];
  const matches = items.filter((entry) =>
    buildSearchHaystack(entry).includes(query)
  );

  return matches
    .sort((a, b) => {
      const scoreA = scoreSearchEntry(a, query);
      const scoreB = scoreSearchEntry(b, query);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return (a.name || "").length - (b.name || "").length;
    })
    .slice(0, MAX_SEARCH_SUGGESTIONS);
});

const findSearchMatch = (query) => {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return null;
  }

  const ranked = filteredSearchItems.value;
  if (ranked.length) {
    return ranked[0];
  }

  const items = searchItems.value || [];
  return items.find((entry) => buildSearchHaystack(entry).includes(normalized));
};

const legendEntries = computed(() => {
  const entries = [];

  Object.entries(mapLayersStore.availableLayers).forEach(
    ([categoryKey, category]) => {
      category.layers.forEach((layer) => {
        if (layer.active) {
          const style = GIS_STANDARDS[categoryKey]?.[layer.id] || {
            color: "#546E7A",
            weight: 2,
            opacity: 0.9,
          };

          entries.push({
            key: `${categoryKey}-${layer.id}`,
            label: layer.label,
            style,
          });
        }
      });
    }
  );

  return entries;
});

// User profile
const userProfile = computed(() => {
  return {
    name: appStore.user?.fullName || "User",
    role: appStore.primaryRoleName || "User",
  };
});

const priorityQueueItems = computed(() => {
  const submittedOnly = verificationQueue.value.filter(
    (item) => String(item?.status || "") === "submitted"
  );
  return [...submittedOnly]
    .sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.createdAt || 0);
      const dateB = new Date(b.submittedAt || b.createdAt || 0);
      return dateA - dateB;
    })
    .slice(0, 5);
});

const buildingSummaryTotal = computed(() => {
  const summary = buildingSummaryCounts.value || {};
  return (summary.floor || 0) + (summary.wall || 0) + (summary.roof || 0);
});

// Computed property for current location filters
// Location filter names (fetched from API)
const currentLocationFilters = ref([]);
const locationFiltersLoading = ref(false);

// Fetch location names from API
const loadLocationFilters = async () => {
  const params = getDashboardFilterParams();
  if (!Object.keys(params).length) {
    currentLocationFilters.value = [];
    return;
  }

  try {
    const filterList = [];
    locationFiltersLoading.value = true;

    // Fetch province name
    if (params.provinceId) {
      try {
        const response = await locationAPI.getProvince(params.provinceId);
        if (response.success && response.data?.province) {
          filterList.push(`Provinsi: ${response.data.province.name}`);
        } else {
          filterList.push(`Provinsi: ${params.provinceId}`);
        }
      } catch (error) {
        console.error("Error fetching province:", error);
        filterList.push(`Provinsi: ${params.provinceId}`);
      }
    }

    // Fetch regency name
    if (params.regencyId) {
      try {
        const response = await locationAPI.getRegency(params.regencyId);
        if (response.success && response.data?.regency) {
          filterList.push(`Kabupaten/Kota: ${response.data.regency.name}`);
        } else {
          filterList.push(`Kabupaten/Kota: ${params.regencyId}`);
        }
      } catch (error) {
        console.error("Error fetching regency:", error);
        filterList.push(`Kabupaten/Kota: ${params.regencyId}`);
      }
    }

    // Fetch district name
    if (params.districtId) {
      try {
        const response = await locationAPI.getDistrict(params.districtId);
        if (response.success && response.data?.district) {
          filterList.push(`Kecamatan: ${response.data.district.name}`);
        } else {
          filterList.push(`Kecamatan: ${params.districtId}`);
        }
      } catch (error) {
        console.error("Error fetching district:", error);
        filterList.push(`Kecamatan: ${params.districtId}`);
      }
    }

    // Fetch village name
    if (params.villageId) {
      try {
        const response = await locationAPI.getVillage(params.villageId);
        if (response.success && response.data?.village) {
          filterList.push(`Kelurahan: ${response.data.village.name}`);
        } else {
          filterList.push(`Kelurahan: ${params.villageId}`);
        }
      } catch (error) {
        console.error("Error fetching village:", error);
        filterList.push(`Kelurahan: ${params.villageId}`);
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

// Get location parameters from user session
const getLocationParams = () => {
  const user = appStore.user || {};
  const locationParams = {};

  if (appStore.isSuperAdmin || appStore.isVerifikator) {
    return locationParams;
  }

  if (user.assignedProvinceId) {
    locationParams.provinceId = user.assignedProvinceId;
  }
  if (user.assignedRegencyId) {
    locationParams.regencyId = user.assignedRegencyId;
  }
  if (user.assignedDistrictId) {
    locationParams.districtId = user.assignedDistrictId;
  }
  if (user.assignedVillageId) {
    locationParams.villageId = user.assignedVillageId;
  }

  return locationParams;
};

const getDashboardFilterParams = () => {
  const filters = dashboardFilters.value || {};
  const params = {};
  if (filters.provinceId) params.provinceId = filters.provinceId;
  if (filters.regencyId) params.regencyId = filters.regencyId;
  if (filters.districtId) params.districtId = filters.districtId;
  if (filters.villageId) params.villageId = filters.villageId;
  if (filters.surveyYear) params.surveyYear = filters.surveyYear;

  if (appStore.isSuperAdmin || appStore.isVerifikator) {
    return params;
  }

  const enforced = getLocationParams();
  return { ...params, ...enforced };
};

const villageStatusSummary = computed(() => [
  {
    key: "submitted",
    label: "Terkirim",
    color: "info",
    count: villageStatusCounts.value.submitted || 0
  },
  {
    key: "reviewed",
    label: "Pending",
    color: "warning",
    count: villageStatusCounts.value.reviewed || 0
  },
  {
    key: "approved",
    label: "Disetujui",
    color: "success",
    count: villageStatusCounts.value.approved || 0
  },
  {
    key: "rejected",
    label: "Ditolak",
    color: "error",
    count: villageStatusCounts.value.rejected || 0
  }
]);

// Stats data
const stats = computed(() => [
  {
    title: "Data Rumah Masyarakat",
    value: formatNumber(housingCount.value),
    description: "Total pengajuan survei rumah masyarakat",
    breakdown: housingStatusSummary.value,
    color: "primary",
    icon: "mdi-home-search",
    loading: isLoading.value,
    route: "/housing-data",
  },
  {
    title: "Data Infrastruktur",
    value: formatNumber(infrastructureCount.value),
    description: "Total pengajuan survei infrastruktur",
    breakdown: infrastructureStatusSummary.value,
    color: "info",
    icon: "mdi-city",
    loading: isLoading.value,
    route: "/infrastructure-data",
  },
  {
    title: "Data Perumahan",
    value: formatNumber(housingDevelopmentCount.value),
    description: "Total pengajuan survei perumahan",
    breakdown: developmentStatusSummary.value,
    color: "success",
    icon: "mdi-home-group",
    loading: isLoading.value,
    route: "/housing-development-data",
  },
  {
    title: "Total Pengajuan",
    value: formatNumber(
      housingCount.value +
        infrastructureCount.value +
        housingDevelopmentCount.value
    ),
    description: "Semua pengajuan survei",
    breakdown: totalStatusSummary.value,
    color: "warning",
    icon: "mdi-file-document-multiple",
    loading: isLoading.value,
  },
  {
    title: "Rumah Layak Huni",
    value: formatNumber(rumahLayakHuni.value),
    description: "Total rumah layak huni",
    color: "success",
    icon: "mdi-home",
    loading: isLoading.value,
  },
  {
    title: "Rumah Tidak Layak Huni",
    value: formatNumber(rumahTidakLayakHuni.value),
    description: "Total rumah tidak layak huni",
    color: "error",
    icon: "mdi-home-alert",
    loading: isLoading.value,
  },
]);

// Quick actions
const baseQuickActions = [
  {
    title: "Survei Rumah Masyarakat",
    description: "Ajukan survey rumah masyarakat baru",
    icon: "mdi-file-document-edit",
    color: "primary",
    route: "/form",
    permission: "housing:create",
  },
  {
    title: "Survei Infrastruktur",
    description: "Ajukan survey infrastruktur",
    icon: "mdi-city",
    color: "info",
    route: "/infrastructure-form",
    permission: "facility:create",
  },
  {
    title: "Survei Perumahan",
    description: "Ajukan survey perumahan",
    icon: "mdi-home-group",
    color: "success",
    route: "/housing-development-form",
    permission: "housing_development:create",
  },
];

const quickActions = computed(() =>
  baseQuickActions.filter((action) => {
    if (appStore.isVerifikator) {
      return false;
    }
    if (action.permission) {
      const permissions = Array.isArray(action.permission)
        ? action.permission
        : [action.permission];
      if (
        appStore.isAdminKabupaten &&
        permissions.some((permission) =>
          ["housing:create", "facility:create"].includes(permission)
        )
      ) {
        return false;
      }
      return appStore.hasAnyPermission(permissions);
    }
    return true;
  })
);

// Methods
const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString("id-ID");
};

const submissionStatusLabels = {
  draft: "Draft",
  submitted: "Terkirim",
  under_review: "Dalam Tinjauan",
  reviewed: "Diverifikasi",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const submissionStatusColors = {
  draft: "grey",
  submitted: "info",
  under_review: "warning",
  reviewed: "warning",
  approved: "success",
  rejected: "error",
};

const getSubmissionStatusLabel = (status) =>
  submissionStatusLabels[status] || "Status";

const getSubmissionStatusColor = (status) =>
  submissionStatusColors[status] || "primary";

const getSubmissionNote = (submission) => {
  if (!submission) return "-";
  return (
    submission.reviewNotes ||
    submission.verificationNotes ||
    submission.reviewerNotes ||
    submission.notes ||
    "-"
  );
};

const formatAuditAction = (action) => {
  if (!action) return "-";
  return String(action).replace(/_/g, " ");
};

const formatSubmissionDate = (value) => {
  if (!value) return "Tanggal tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const buildMonthKeys = (totalMonths = 6) => {
  const keys = [];
  const now = new Date();
  for (let i = totalMonths - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return keys;
};

const formatMonthLabels = (monthKeys) => {
  return monthKeys.map((key) => {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  });
};

const normalizeMonthlySeries = (monthlyData, monthKeys) => {
  if (!monthlyData?.labels || !Array.isArray(monthlyData.labels)) {
    return monthKeys.map(() => 0);
  }
  const dataMap = new Map();
  monthlyData.labels.forEach((label, index) => {
    const count = Number(monthlyData.counts?.[index] || 0);
    dataMap.set(label, count);
  });
  return monthKeys.map((key) => dataMap.get(key) || 0);
};

const normalizeStatusBreakdown = (statusBreakdown) => {
  const normalized = {
    submitted: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
  };
  Object.entries(statusBreakdown || {}).forEach(([status, count]) => {
    const key = String(status || "").toLowerCase();
    const value = Number(count || 0);
    if (key === "submitted") normalized.submitted += value;
    else if (["reviewed", "under_review", "verified"].includes(key))
      normalized.reviewed += value;
    else if (key === "approved") normalized.approved += value;
    else if (key === "rejected") normalized.rejected += value;
    else if (key === "draft") normalized.draft += value;
  });
  return normalized;
};

const normalizeStatusSummary = (statusSummary, statusBreakdown) => {
  if (statusSummary) {
    return {
      verified: Number(statusSummary.verified || 0),
      pending: Number(statusSummary.pending || 0),
      rejected: Number(statusSummary.rejected || 0),
    };
  }
  const normalized = normalizeStatusBreakdown(statusBreakdown);
  return {
    verified: normalized.approved || 0,
    pending: (normalized.submitted || 0) + (normalized.reviewed || 0),
    rejected: normalized.rejected || 0,
  };
};

const loadStatistics = async () => {
  isLoading.value = true;
  try {
    const locationParams = getDashboardFilterParams();
    const defaultMonthKeys = buildMonthKeys();
    const [housingResult, facilityResult, developmentResult] =
      await Promise.allSettled([
        housingAPI.getStatistics(locationParams),
        facilityAPI.getStatistics(locationParams),
        housingDevelopmentAPI.getStatistics(locationParams),
      ]);

    const housingStats =
      housingResult.status === "fulfilled" && housingResult.value?.success
        ? housingResult.value.data
        : null;
    const facilityStats =
      facilityResult.status === "fulfilled" && facilityResult.value?.success
        ? facilityResult.value.data
        : null;
    const developmentStats =
      developmentResult.status === "fulfilled" && developmentResult.value?.success
        ? developmentResult.value.data
        : null;

    housingCount.value =
      housingStats?.total ??
      housingStats?.totalSubmissions ??
      0;
    infrastructureCount.value =
      facilityStats?.total ?? facilityStats?.totalSurveys ?? 0;
    housingDevelopmentCount.value =
      developmentStats?.total ?? developmentStats?.totalDevelopments ?? 0;

    const normalizedStatus = normalizeStatusBreakdown(
      housingStats?.statusBreakdown
    );
    villageStatusCounts.value = normalizedStatus;
    housingStatusSummary.value = normalizeStatusSummary(
      housingStats?.statusSummary,
      housingStats?.statusBreakdown
    );
    infrastructureStatusSummary.value = normalizeStatusSummary(
      facilityStats?.statusSummary,
      facilityStats?.statusBreakdown
    );
    developmentStatusSummary.value = normalizeStatusSummary(
      developmentStats?.statusSummary,
      developmentStats?.statusBreakdown
    );
    totalStatusSummary.value = {
      verified:
        housingStatusSummary.value.verified
        + infrastructureStatusSummary.value.verified
        + developmentStatusSummary.value.verified,
      pending:
        housingStatusSummary.value.pending
        + infrastructureStatusSummary.value.pending
        + developmentStatusSummary.value.pending,
      rejected:
        housingStatusSummary.value.rejected
        + infrastructureStatusSummary.value.rejected
        + developmentStatusSummary.value.rejected,
    };

    const livableCount = housingStats?.livableCount || 0;
    const housingTotal =
      housingStats?.total ?? housingStats?.totalSubmissions ?? 0;
    rumahLayakHuni.value = livableCount;
    rumahTidakLayakHuni.value = Math.max(housingTotal - livableCount, 0);

    const resolveMonthKeys = (candidates, fallback) => {
      for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) {
          return candidate;
        }
      }
      return fallback;
    };

    const monthKeys = resolveMonthKeys(
      [
        housingStats?.monthlySubmissions?.labels,
        facilityStats?.monthlySubmissions?.labels,
        developmentStats?.monthlySubmissions?.labels,
      ],
      defaultMonthKeys
    );

    monthlyLabels.value = formatMonthLabels(monthKeys);
    monthlyHousingCounts.value = normalizeMonthlySeries(
      housingStats?.monthlySubmissions,
      monthKeys
    );
    monthlyInfrastructureCounts.value = normalizeMonthlySeries(
      facilityStats?.monthlySubmissions,
      monthKeys
    );
    monthlyHousingDevelopmentCounts.value = normalizeMonthlySeries(
      developmentStats?.monthlySubmissions,
      monthKeys
    );

    if (isAdminKabupaten.value) {
      const breakdown = Array.isArray(housingStats?.districtBreakdown)
        ? housingStats.districtBreakdown
        : [];
      districtLabels.value = breakdown.map((entry) => entry.districtName || "-");
      districtApprovedCounts.value = breakdown.map((entry) =>
        Number(entry.approved || 0)
      );
      districtPendingCounts.value = breakdown.map((entry) =>
        Number(entry.pending || 0)
      );
      districtRejectedCounts.value = breakdown.map((entry) =>
        Number(entry.rejected || 0)
      );
    } else {
      districtLabels.value = [];
      districtApprovedCounts.value = [];
      districtPendingCounts.value = [];
      districtRejectedCounts.value = [];
    }

    const householdCount = facilityStats?.villageInfo?.householdCount;
    villageHouseholdCount.value =
      householdCount === null || householdCount === undefined
        ? null
        : Number(householdCount);

    if (isAdminDesa.value) {
      await loadBuildingSummary();
    }

  } catch (error) {
    console.error("Error loading statistics:", error);
    housingCount.value = 0;
    infrastructureCount.value = 0;
    housingDevelopmentCount.value = 0;
    rumahLayakHuni.value = 0;
    rumahTidakLayakHuni.value = 0;
    villageStatusCounts.value = {
      submitted: 0,
      reviewed: 0,
      approved: 0,
      rejected: 0,
      draft: 0,
    };
    const fallbackKeys = buildMonthKeys();
    monthlyLabels.value = formatMonthLabels(fallbackKeys);
    monthlyHousingCounts.value = fallbackKeys.map(() => 0);
    monthlyInfrastructureCounts.value = fallbackKeys.map(() => 0);
    monthlyHousingDevelopmentCounts.value = fallbackKeys.map(() => 0);
    districtLabels.value = [];
    districtApprovedCounts.value = [];
    districtPendingCounts.value = [];
    districtRejectedCounts.value = [];
    buildingSummaryCounts.value = { floor: 0, wall: 0, roof: 0 };
    housingStatusSummary.value = { verified: 0, pending: 0, rejected: 0 };
    infrastructureStatusSummary.value = { verified: 0, pending: 0, rejected: 0 };
    developmentStatusSummary.value = { verified: 0, pending: 0, rejected: 0 };
    totalStatusSummary.value = { verified: 0, pending: 0, rejected: 0 };
    villageHouseholdCount.value = null;
  } finally {
    isLoading.value = false;
  }
};

const loadMasyarakatSubmissions = async () => {
  if (!isMasyarakat.value) {
    return;
  }

  masyarakatLoading.value = true;
  try {
    const response = await housingStore.getSubmissions({
      page: 1,
      limit: 10,
      createdBy: appStore.user?.id,
    });
    if (!response?.success) {
      throw new Error(response?.error || "Gagal memuat riwayat survei.");
    }
    const submissions = response?.submissions || [];
    masyarakatSubmissions.value = [...submissions].sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.createdAt || 0);
      const dateB = new Date(b.submittedAt || b.createdAt || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error loading masyarakat submissions:", error);
    masyarakatSubmissions.value = [];
  } finally {
    masyarakatLoading.value = false;
  }
};

const loadVerificationQueue = async () => {
  if (!isVerifikator.value) {
    return;
  }

  verificationQueueLoading.value = true;
  try {
    const response = await housingAPI.getSubmissions({
      page: 1,
      limit: 50,
    });

    if (!response?.success) {
      throw new Error(response?.message || "Gagal memuat antrean verifikasi.");
    }

    const rows = response?.data?.submissions?.rows || response?.data?.rows || [];
    const pendingItems = rows.filter((item) =>
      ["submitted", "under_review", "reviewed"].includes(
        String(item?.status || "")
      )
    );
    verificationQueue.value = [...pendingItems]
      .sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0);
        const dateB = new Date(b.submittedAt || b.createdAt || 0);
        return dateA - dateB;
      })
      .slice(0, 6);
  } catch (error) {
    console.error("Error loading verification queue:", error);
    verificationQueue.value = [];
  } finally {
    verificationQueueLoading.value = false;
  }
};

const loadActivityLogs = async () => {
  if (!showActivityWidget.value) {
    return;
  }

  activityLogsLoading.value = true;
  activityLogsError.value = "";
  try {
    const response = await userAPI.getAuditLogs({ page: 1, limit: 5 });
    if (!response?.success) {
      throw new Error(response?.message || "Gagal memuat log aktivitas.");
    }
    const logs = response?.data?.items || response?.data?.rows || [];
    activityLogs.value = logs.map((log) => ({
      ...log,
      userName: log.user?.fullName || appStore.user?.fullName || "-",
    }));
  } catch (error) {
    console.error("Error loading activity logs:", error);
    activityLogsError.value = error?.message || "Gagal memuat log aktivitas.";
    activityLogs.value = [];
  } finally {
    activityLogsLoading.value = false;
  }
};

const loadBuildingSummary = async () => {
  if (!isAdminDesa.value) {
    return;
  }

  buildingSummaryLoading.value = true;
  try {
    const locationParams = getDashboardFilterParams();
    const response = await housingAPI.getSubmissions({
      page: 1,
      limit: 0,
      status: "approved",
      ...locationParams,
    });

    if (!response?.success) {
      throw new Error(response?.message || "Gagal memuat data bangunan.");
    }

    const rows = response?.data?.submissions?.rows || response?.data?.rows || [];
    const summary = { floor: 0, wall: 0, roof: 0 };
    rows.forEach((submission) => {
      const houseData = submission.houseData || {};
      if (houseData.floorMaterial) summary.floor += 1;
      if (houseData.wallMaterial) summary.wall += 1;
      if (houseData.roofMaterial) summary.roof += 1;
    });
    buildingSummaryCounts.value = summary;
  } catch (error) {
    console.error("Error loading building summary:", error);
    buildingSummaryCounts.value = { floor: 0, wall: 0, roof: 0 };
  } finally {
    buildingSummaryLoading.value = false;
  }
};

// Parse coordinates from string format "lat, lng"
const parseCoordinates = (coordString) => {
  if (!coordString) return null;

  try {
    const parts = coordString.split(",").map((part) => part.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (error) {
    console.error("Error parsing coordinates:", error);
  }

  return null;
};

const toLatLng = (coords) => {
  if (!coords) {
    return null;
  }

  const lat = parseFloat(coords.lat);
  const lng = parseFloat(coords.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return [lat, lng];
};

// Get coordinates for housing data (mock implementation)
const getCoordinatesForHousing = (item) => {
  if (item.householdOwner?.latitude && item.householdOwner?.longitude) {
    return {
      lat: item.householdOwner.latitude,
      lng: item.householdOwner.longitude,
    };
  }

  return null;
};

const normalizeLocationId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return String(
    value.id || value.value || value.kode || value.code || value._id || ""
  );
};

const matchesLocationParams = (location, params) => {
  if (!params) {
    return true;
  }

  const locationData = location || {};

  if (params.provinceId) {
    const provinceId = normalizeLocationId(locationData.province);
    if (!provinceId || provinceId !== String(params.provinceId)) {
      return false;
    }
  }
  if (params.regencyId) {
    const regencyId = normalizeLocationId(locationData.regency);
    if (!regencyId || regencyId !== String(params.regencyId)) {
      return false;
    }
  }
  if (params.districtId) {
    const districtId = normalizeLocationId(locationData.district);
    if (!districtId || districtId !== String(params.districtId)) {
      return false;
    }
  }
  if (params.villageId) {
    const villageId = normalizeLocationId(locationData.village);
    if (!villageId || villageId !== String(params.villageId)) {
      return false;
    }
  }

  return true;
};

const getInfrastructureCoordinates = (item) => {
  if (!item) {
    return null;
  }

  const readPair = (latValue, lngValue) => {
    const lat = parseFloat(latValue);
    const lng = parseFloat(lngValue);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
    return null;
  };

  const location = item.location || {};

  let coords =
    readPair(location.latitude, location.longitude) ||
    readPair(location.lat, location.lng) ||
    readPair(item.latitude, item.longitude) ||
    readPair(item.lat, item.lng);

  if (coords) {
    return coords;
  }

  if (typeof item.koordinat === "string") {
    return parseCoordinates(item.koordinat);
  }

  if (typeof location.koordinat === "string") {
    return parseCoordinates(location.koordinat);
  }

  const candidate = item.coordinates || location.coordinates;
  if (typeof candidate === "string") {
    return parseCoordinates(candidate);
  }

  if (Array.isArray(candidate) && candidate.length >= 2) {
    const lat = parseFloat(candidate[0]);
    const lng = parseFloat(candidate[1]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  if (candidate && typeof candidate === "object") {
    coords = readPair(
      candidate.lat ?? candidate.latitude,
      candidate.lng ?? candidate.longitude
    );
    if (coords) {
      return coords;
    }
  }

  return null;
};

// Create markers on map
// Ganti function createMarkers yang lama dengan yang ini:

const createMarkers = (
  housingData,
  housingDevelopmentData,
  infrastructureData
) => {
  if (!mapInstance.value) {
    return;
  }

  // Bersihkan layer yang ada
  markerLayers.housing.clearLayers();
  markerLayers["housing-development"].clearLayers();
  markerLayers.infrastructure.clearLayers();

  const markerColors = {
    housing: "#1976D2",     // Biru
    "housing-development": "#4CAF50", // Hijau
    infrastructure: "#00ACC1", // Cyan
  };

  // --- SOLUSI PERFORMA: Gunakan circleMarker (Canvas) ---
  // Fungsi ini membuat titik ringan menggunakan renderer Canvas
  const createOptimizedMarker = (latLng, color) => {
    return L.circleMarker(latLng, {
      radius: 5,            // Ukuran titik (kecil agar tidak menumpuk)
      fillColor: color,     // Warna titik
      color: "#ffffff",     // Warna garis tepi (putih)
      weight: 1,            // Tebal garis tepi
      opacity: 1,
      fillOpacity: 0.8,     // Transparansi isi
      // PENTING: Memaksa menggunakan Canvas renderer yang sudah diset di initializeMap
      renderer: mapInstance.value.getRenderer(mapInstance.value) 
    });
  };

  // 1. Render Rumah Masyarakat
  if (mapFilters.value.find((filter) => filter.type === "housing")?.enabled) {
    housingData.forEach((item) => {
      const coordinates = getCoordinatesForHousing(item);
      const latLng = toLatLng(coordinates);

      if (latLng) {
        // Gunakan fungsi optimized marker
        const marker = createOptimizedMarker(latLng, markerColors.housing);

        // Bind Popup (isi info saat diklik)
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 150px;">
            <h3 style="margin: 0 0 6px 0; font-size: 14px; color: ${markerColors.housing}; border-bottom: 1px solid #eee; padding-bottom: 4px;">
              🏠 Rumah Masyarakat
            </h3>
            <div style="margin-bottom: 4px;"><strong>Pemilik:</strong> ${item.householdOwner?.ownerName || "Tidak ada"}</div>
            <div style="margin-bottom: 4px;"><strong>Alamat:</strong> ${item.householdOwner?.houseNumber || "-"}, RT ${item.householdOwner?.rt || "-"} / RW ${item.householdOwner?.rw || "-"}</div>
            <div style="margin-bottom: 4px;"><strong>Kelurahan:</strong> ${item.householdOwner?.village?.name || "-"}</div>
            <div><strong>Status:</strong> ${item.status || "-"}</div>
          </div>
        `);

        markerLayers.housing.addLayer(marker);
      }
    });
  }

  // 2. Render Perumahan Pengembang
  if (mapFilters.value.find((filter) => filter.type === "housing-development")?.enabled) {
    housingDevelopmentData.forEach((item) => {
      let coordinates = item.coordinates;

      // Handle jika data memiliki sub-unit housingDevelopments
      if (item.housingDevelopments && Array.isArray(item.housingDevelopments)) {
        item.housingDevelopments.forEach((housing) => {
          if (housing.koordinat) {
            coordinates = parseCoordinates(housing.koordinat);
            const latLng = toLatLng(coordinates);
            if (latLng) {
              const marker = createOptimizedMarker(latLng, markerColors["housing-development"]);

              marker.bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; min-width: 150px;">
                  <h3 style="margin: 0 0 6px 0; font-size: 14px; color: ${markerColors["housing-development"]}; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                    🏢 Perumahan
                  </h3>
                  <div style="margin-bottom: 4px;"><strong>Nama:</strong> ${housing.namaPerumahan || item.developmentName || "-"}</div>
                  <div style="margin-bottom: 4px;"><strong>Pengembang:</strong> ${housing.namaPengembang || "-"}</div>
                  <div style="margin-bottom: 4px;"><strong>Jenis:</strong> ${housing.jenisPerumahan || "-"}</div>
                  <div><strong>Unit:</strong> ${housing.jumlahRumahRencana || "-"}</div>
                </div>
              `);

              markerLayers["housing-development"].addLayer(marker);
            }
          }
        });
      } else if (coordinates) {
        // Handle data flat
        if (typeof coordinates === "string") {
          coordinates = parseCoordinates(coordinates);
        }
        const latLng = toLatLng(coordinates);
        if (latLng) {
          const marker = createOptimizedMarker(latLng, markerColors["housing-development"]);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 150px;">
              <h3 style="margin: 0 0 6px 0; font-size: 14px; color: ${markerColors["housing-development"]}; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                🏢 Perumahan
              </h3>
              <div><strong>Nama:</strong> ${item.developmentName || "-"}</div>
            </div>
          `);

          markerLayers["housing-development"].addLayer(marker);
        }
      }
    });
  }

  // 3. Render Infrastruktur
  if (mapFilters.value.find((filter) => filter.type === "infrastructure")?.enabled) {
    (infrastructureData || []).forEach((item) => {
      const coordinates = getInfrastructureCoordinates(item);
      const latLng = toLatLng(coordinates);

      if (latLng) {
        const marker = createOptimizedMarker(latLng, markerColors.infrastructure);

        const villageName = item.profil?.namaDesa || item.villageName || item.location?.village?.name || "Tidak ada";
        const submittedAt = item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("id-ID") : "-";

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 150px;">
            <h3 style="margin: 0 0 6px 0; font-size: 14px; color: ${markerColors.infrastructure}; border-bottom: 1px solid #eee; padding-bottom: 4px;">
              🏗️ Infrastruktur
            </h3>
            <div style="margin-bottom: 4px;"><strong>Desa:</strong> ${villageName}</div>
            <div style="margin-bottom: 4px;"><strong>Status:</strong> ${item.status || "-"}</div>
            <div><strong>Tanggal:</strong> ${submittedAt}</div>
          </div>
        `);

        markerLayers.infrastructure.addLayer(marker);
      }
    });
  }

  // Fit Bounds (Auto Zoom ke data)
  const bounds = L.latLngBounds([]);
  let hasBounds = false;

  Object.values(markerLayers).forEach((layerGroup) => {
    layerGroup.eachLayer((layer) => {
      if (layer.getLatLng) {
        bounds.extend(layer.getLatLng());
        hasBounds = true;
      }
    });
  });

  if (hasBounds) {
    mapInstance.value.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
  }
};

// Load map data for markers
const loadMapData = async () => {
  // Jika user adalah masyarakat, tidak perlu memuat peta dashboard ini
  if (isMasyarakat.value) {
    return;
  }

  try {
    // 1. Ambil Parameter Filter
    const locationParams = getDashboardFilterParams();
    
    const mapQueryParams = {
      page: 1,
      limit: 1000, // OPTIMASI: Batasi 1000 per kategori agar tidak terlalu berat
      status: 'approved',
      ...locationParams
    };

    console.time("LoadMapData"); // Debugging waktu load

    // 2. REQUEST PARALEL (OPTIMASI UTAMA)
    // Mengambil ke-3 data secara bersamaan, bukan satu per satu
    const [housingRes, devRes, infraRes] = await Promise.all([
      housingAPI.getSubmissions(mapQueryParams).catch(err => {
        console.error("Gagal load housing:", err);
        return { success: false };
      }),
      housingDevelopmentAPI.getDevelopments(mapQueryParams).catch(err => {
        console.error("Gagal load developments:", err);
        return { success: false };
      }),
      facilityAPI.getSurveys(mapQueryParams).catch(err => {
        console.error("Gagal load infrastruktur:", err);
        return { success: false };
      })
    ]);

    // 3. Proses Data Rumah Masyarakat
    let housingData = [];
    if (housingRes?.success) {
      housingData = housingRes.data?.submissions?.rows || 
                    housingRes.data?.submissions || [];
    }

    // 4. Proses Data Perumahan Pengembang
    let housingDevelopmentData = [];
    if (devRes?.success) {
      const rows = devRes.data?.developments?.rows || devRes.data?.developments || [];
      
      // Mapping data agar ringan
      housingDevelopmentData = rows.map(item => ({
        id: item.id,
        developmentName: item.developmentName,
        developerName: item.developerName,
        housingType: item.housingType,
        coordinates: { 
          lat: parseFloat(item.latitude), 
          lng: parseFloat(item.longitude) 
        },
        location: {
            village: item.village?.name,
            district: item.district?.name,
            regency: item.regency?.name
        },
        // Ambil properti yang perlu saja untuk popup, jangan pakai spread (...item)
        // agar memori browser tidak penuh jika objeknya besar
        jumlahRumahRencana: item.jumlahRumahRencana
      }));
    }

    // 5. Proses Data Infrastruktur
    let infrastructureData = [];
    if (infraRes?.success) {
      infrastructureData = infraRes.data?.surveys?.rows || infraRes.data?.surveys || [];
    }

    console.timeEnd("LoadMapData"); // Lihat durasi di console browser

    // 6. Render ke Peta
    await nextTick();
    initializeMap();
    createMarkers(housingData, housingDevelopmentData, infrastructureData);
    
  } catch (error) {
    console.error("Error fatal saat memuat peta:", error);
  }
};

watch(
  () => dashboardFilters.value.provinceId,
  async (value, previous) => {
    if (!dashboardFiltersReady.value || !showProvinceFilter.value) {
      return;
    }
    if (!value || value === previous) {
      return;
    }
    dashboardFilters.value.regencyId = null;
    dashboardFilters.value.districtId = null;
    dashboardFilters.value.villageId = null;
    await loadRegencyOptions(value);
  }
);

watch(
  () => dashboardFilters.value.regencyId,
  async (value, previous) => {
    if (!dashboardFiltersReady.value) {
      return;
    }
    if (!value || value === previous) {
      return;
    }
    dashboardFilters.value.districtId = null;
    dashboardFilters.value.villageId = null;
    await loadDistrictOptions(value);
  }
);

watch(
  () => dashboardFilters.value.districtId,
  async (value, previous) => {
    if (!dashboardFiltersReady.value) {
      return;
    }
    if (!value || value === previous) {
      return;
    }
    dashboardFilters.value.villageId = null;
    await loadVillageOptions(value);
  }
);

watch(
  dashboardFilters,
  () => {
    if (!dashboardFiltersReady.value || isMasyarakat.value) {
      return;
    }
    if (dashboardFilterDebounceTimer) {
      clearTimeout(dashboardFilterDebounceTimer);
    }
    dashboardFilterDebounceTimer = setTimeout(async () => {
      await loadStatistics();
      await loadLocationFilters();
      await loadMapData();
    }, dashboardFilterDebounceMs);
  },
  { deep: true }
);

// Watchers for map filter selections
watch(selectedLocationFilters, (newSelection) => {
  const activeValues =
    newSelection.length > 0
      ? new Set(newSelection)
      : new Set(locationFilterOptions.map((option) => option.value));

  mapFilters.value.forEach((filter) => {
    filter.enabled = activeValues.has(filter.type);
  });

  loadMapData();
});

watch(
  () => mapUiStore.mapResizeToken,
  () => {
    if (mapInstance.value) {
      mapInstance.value.invalidateSize({ animate: false });
    }
  }
);

const MAP_PANES = {
  polygons: "pane-polygons",
  lines: "pane-lines",
  boundaries: "pane-boundaries",
  points: "pane-points",
  search: "pane-search",
};

const initMapPanes = (map) => {
  const panes = [
    { name: MAP_PANES.polygons, zIndex: 400 },
    { name: MAP_PANES.lines, zIndex: 450 },
    { name: MAP_PANES.boundaries, zIndex: 500 },
    { name: MAP_PANES.points, zIndex: 550 },
    { name: MAP_PANES.search, zIndex: 650 },
  ];

  panes.forEach(({ name, zIndex }) => {
    if (!map.getPane(name)) {
      map.createPane(name);
    }
    const pane = map.getPane(name);
    if (pane) {
      pane.style.zIndex = zIndex;
      pane.style.pointerEvents = "auto";
    }
  });
};

// Initialize Leaflet map
const initializeMap = () => {
  if (mapInstance.value || !mapRef.value) {
    return;
  }

  mapInstance.value = L.map(mapRef.value, {
    zoomControl: true,
    attributionControl: true,
    renderer: L.canvas(),
  }).setView([-2.5, 118], 5);

  initMapPanes(mapInstance.value);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mapInstance.value);

  scaleControl = L.control
    .scale({
      position: "bottomleft",
      metric: true,
      imperial: false,
    })
    .addTo(mapInstance.value);

  markerLayers.housing.addTo(mapInstance.value);
  markerLayers["housing-development"].addTo(mapInstance.value);
  markerLayers.infrastructure.addTo(mapInstance.value);
  searchHighlightLayer.addTo(mapInstance.value);

  syncGeoJsonLayers();
};

const webMercatorToLatLng = (x, y) => {
  const radius = 6378137;
  const lon = (x / radius) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / radius)) - Math.PI / 2) * (180 / Math.PI);
  return [lat, lon];
};

const utmToLatLng = (easting, northing, zoneNumber, isSouthernHemisphere) => {
  const a = 6378137;
  const e = 0.0818191908;
  const e1sq = (e * e) / (1 - e * e);
  const k0 = 0.9996;
  const x = easting - 500000;
  let y = northing;

  if (isSouthernHemisphere) {
    y -= 10000000;
  }

  const m = y / k0;
  const mu =
    m /
    (a *
      (1 -
        Math.pow(e, 2) / 4 -
        (3 * Math.pow(e, 4)) / 64 -
        (5 * Math.pow(e, 6)) / 256));
  const e1 = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e));

  const j1 = (3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32;
  const j2 = (21 * Math.pow(e1, 2)) / 16 - (55 * Math.pow(e1, 4)) / 32;
  const j3 = (151 * Math.pow(e1, 3)) / 96;
  const j4 = (1097 * Math.pow(e1, 4)) / 512;

  const fp =
    mu +
    j1 * Math.sin(2 * mu) +
    j2 * Math.sin(4 * mu) +
    j3 * Math.sin(6 * mu) +
    j4 * Math.sin(8 * mu);

  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);

  const c1 = e1sq * cosFp * cosFp;
  const t1 = tanFp * tanFp;
  const r1 = (a * (1 - e * e)) / Math.pow(1 - e * e * sinFp * sinFp, 1.5);
  const n1 = a / Math.sqrt(1 - e * e * sinFp * sinFp);
  const d = x / (n1 * k0);

  const q1 = (n1 * tanFp) / r1;
  const q2 = (d * d) / 2;
  const q3 =
    ((5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * e1sq) * Math.pow(d, 4)) / 24;
  const q4 =
    ((61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * e1sq - 3 * c1 * c1) *
      Math.pow(d, 6)) /
    720;
  const lat = fp - q1 * (q2 - q3 + q4);

  const q5 = d;
  const q6 = ((1 + 2 * t1 + c1) * Math.pow(d, 3)) / 6;
  const q7 =
    ((5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * e1sq + 24 * t1 * t1) *
      Math.pow(d, 5)) /
    120;
  const lon = (q5 - q6 + q7) / cosFp;

  const lonOrigin = (zoneNumber - 1) * 6 - 180 + 3;

  return [lat * (180 / Math.PI), lonOrigin + lon * (180 / Math.PI)];
};

const coordsToLatLng = (coords) => {
  if (!coords || coords.length < 2) {
    return L.latLng(0, 0);
  }

  const x = Number(coords[0]);
  const y = Number(coords[1]);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return L.latLng(0, 0);
  }

  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return L.latLng(y, x);
  }

  if (Math.abs(x) > 2000000) {
    const [lat, lon] = webMercatorToLatLng(x, y);
    return L.latLng(lat, lon);
  }

  if (Math.abs(y) > 2000000) {
    const [lat, lon] = utmToLatLng(x, y, 48, true);
    return L.latLng(lat, lon);
  }

  return L.latLng(y, x);
};

const layerPopupFields = [
  "NAMOBJ",
  "DESA",
  "KAB_KOTA",
  "KECAMATAN",
  "PROVINSI",
  "KRB03_",
  "KRB02_",
  "KRB01_",
];

const GIS_STANDARDS = {
  administrasi: {
    batas_kabupaten: { color: "#000000", weight: 2.5, opacity: 1 },
    batas_kecamatan: {
      color: "#4D4D4D",
      weight: 1.5,
      opacity: 0.8,
      dashArray: "8, 4",
    },
    batas_desa: {
      color: "#808080",
      weight: 1,
      opacity: 0.7,
      dashArray: "4, 4",
    },
  },
  infrastruktur: {
    jalan_kolektor_primer_1: { color: "#FF8C00", weight: 2.5, opacity: 1 },
    jalan_kolektor_primer_2: { color: "#FF8C00", weight: 2, opacity: 1 },
    jalan_jalan_lokal: { color: "#C0C0C0", weight: 1, opacity: 1 },
  },
  tata_ruang: {
    rtrw_hutan_lindung: {
      fillColor: "#006400",
      fillOpacity: 0.6,
      color: "#004000",
      weight: 1,
    },
    rtrw_hutan_konservasi: {
      fillColor: "#1B5E20",
      fillOpacity: 0.55,
      color: "#0B3D0B",
      weight: 1,
    },
    rtrw_hutan_produksi: {
      fillColor: "#2E7D32",
      fillOpacity: 0.5,
      color: "#1B5E20",
      weight: 1,
    },
    rtrw_kawasan_lindung_darat: {
      fillColor: "#2E7D32",
      fillOpacity: 0.4,
      color: "#1B5E20",
      weight: 1,
    },
    rtrw_kawasan_lindung_resapan_air: {
      fillColor: "#4DB6AC",
      fillOpacity: 0.45,
      color: "#00897B",
      weight: 1,
    },
    rtrw_kawasan_rawan_erosi_dan_tanah_longsor: {
      fillColor: "#8B4513",
      fillOpacity: 0.5,
      color: "#5D2E0C",
      weight: 1,
    },
    rtrw_sempadan_pantai: {
      fillColor: "#00FFFF",
      fillOpacity: 0.5,
      color: "#00CED1",
      weight: 1,
    },
    rtrw_sempadan_sungai: {
      fillColor: "#4FC3F7",
      fillOpacity: 0.45,
      color: "#0288D1",
      weight: 1,
    },
    rtrw_sempadan_danau: {
      fillColor: "#81D4FA",
      fillOpacity: 0.45,
      color: "#039BE5",
      weight: 1,
    },
  },
  bencana: {
    banjir_bandang_tinggi: {
      fillColor: "#0000FF",
      fillOpacity: 0.6,
      color: "#00008B",
      weight: 1,
    },
    banjir_tinggi: {
      fillColor: "#0000FF",
      fillOpacity: 0.6,
      color: "#00008B",
      weight: 1,
    },
    tanah_longsor_tinggi: {
      fillColor: "#8B4513",
      fillOpacity: 0.6,
      color: "#5D2E0C",
      weight: 1,
    },
    kebakaran_hutan_tinggi: {
      fillColor: "#FF4500",
      fillOpacity: 0.6,
      color: "#8B0000",
      weight: 1,
    },
    kekeringan_tinggi: {
      fillColor: "#FBC02D",
      fillOpacity: 0.5,
      color: "#F57F17",
      weight: 1,
    },
    cuaca_ekstrem_tinggi: {
      fillColor: "#7E57C2",
      fillOpacity: 0.5,
      color: "#5E35B1",
      weight: 1,
    },
    gelombang_abrasi_tinggi: {
      fillColor: "#00ACC1",
      fillOpacity: 0.5,
      color: "#00838F",
      weight: 1,
    },
  },
};

const buildPopupContent = (properties) => {
  if (!properties) {
    return null;
  }

  const rows = layerPopupFields
    .filter((key) => properties[key])
    .map((key) => `<div><strong>${key}:</strong> ${properties[key]}</div>`);

  if (!rows.length) {
    return null;
  }

  return `<div style="min-width: 180px;">${rows.join("")}</div>`;
};

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== "string") {
    return `rgba(84, 110, 122, ${alpha})`;
  }

  const clean = hex.replace("#", "").trim();
  if (![3, 6].includes(clean.length)) {
    return `rgba(84, 110, 122, ${alpha})`;
  }

  const expand =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : clean;

  const r = parseInt(expand.slice(0, 2), 16);
  const g = parseInt(expand.slice(2, 4), 16);
  const b = parseInt(expand.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ensureLayerInteractivity = (layerInstance) => {
  if (!layerInstance) {
    return;
  }

  layerInstance.options = layerInstance.options || {};
  layerInstance.options.interactive = true;

  const element = layerInstance.getElement?.();
  if (element?.style) {
    element.style.pointerEvents = "auto";
  }
};

const legendSwatchStyle = (style) => {
  const weight = Math.max(style.weight ?? 2, 1);
  const fillOpacity = style.fillOpacity ?? 0;
  const fillColor = style.fillColor || style.color || "#546E7A";

  return {
    borderColor: style.color || "#546E7A",
    borderWidth: `${weight}px`,
    borderStyle: style.dashArray ? "dashed" : "solid",
    backgroundColor: fillOpacity
      ? hexToRgba(fillColor, fillOpacity)
      : "transparent",
  };
};

const clearSearchHighlight = () => {
  searchHighlightLayer.clearLayers();
};

const clearSearchPopup = () => {
  if (searchPopup && mapInstance.value) {
    mapInstance.value.closePopup(searchPopup);
  }
  searchPopup = null;
};

const stripBoundaryPrefix = (value) =>
  String(value || "")
    .replace(
      /^(KAB\.?|KABUPATEN|KOTA|KEC\.?|KECAMATAN|DESA|KEL\.?|KELURAHAN)\s*/i,
      ""
    )
    .trim();

const parseDesaParent = (parentText) => {
  if (!parentText) {
    return { district: "", regency: "" };
  }

  const cleaned = String(parentText).replace(/\s+/g, " ").trim();
  const parts = cleaned.split(",").map((part) => stripBoundaryPrefix(part));
  return {
    district: parts[0] || "",
    regency: parts[1] || "",
  };
};

const buildSearchPopupContent = (item) => {
  const name = item?.name || "-";
  if (item?.category === "desa") {
    const { district, regency } = parseDesaParent(item.parent);
    const districtLabel = district || "-";
    const regencyLabel = regency || "-";
    return `Desa: ${name} | Kecamatan: ${districtLabel} | Kabupaten: ${regencyLabel}`;
  }
  if (item?.category === "kecamatan") {
    const regencyLabel = item.parent || "-";
    return `Kecamatan: ${name} | Kabupaten: ${regencyLabel}`;
  }
  if (item?.category === "kabupaten") {
    return `Kabupaten: ${name}`;
  }
  return `Lokasi: ${name}`;
};

const addSearchHighlight = (latlng, category) => {
  if (!mapInstance.value || !latlng) {
    return;
  }

  const pulseIcon = L.divIcon({
    className: "search-marker",
    html: '<div class="search-pulse"></div><div class="search-dot"></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const marker = L.marker(latlng, { icon: pulseIcon, pane: MAP_PANES.search });
  const radius =
    category === "desa" ? 200 : category === "kecamatan" ? 800 : 2000;
  const halo = L.circle(latlng, {
    radius,
    color: "#1976D2",
    weight: 2,
    opacity: 0.6,
    fillOpacity: 0.08,
    pane: MAP_PANES.search,
  });

  searchHighlightLayer.addLayer(halo);
  searchHighlightLayer.addLayer(marker);
};

const boundaryLayerConfig = {
  desa: {
    category: "administrasi",
    layerId: "batas_desa",
    properties: ["DESA", "WADMKD", "NAMOBJ"],
  },
  kecamatan: {
    category: "administrasi",
    layerId: "batas_kecamatan",
    properties: ["KECAMATAN", "WADMKC", "NAMOBJ"],
  },
  kabupaten: {
    category: "administrasi",
    layerId: "batas_kabupaten",
    properties: ["KAB_KOTA", "WADMKK", "NAMOBJ"],
  },
};

const normalizeBoundaryText = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(
      /\b(PROVINSI|PROV|KABUPATEN|KAB|KOTA|KECAMATAN|KEC|DESA|KELURAHAN|KEL)\b/g,
      " "
    )
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getFeatureCenter = (feature) => {
  const bounds = L.latLngBounds([]);

  const walkCoords = (coords) => {
    if (!Array.isArray(coords)) {
      return;
    }

    if (
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      bounds.extend(coordsToLatLng(coords));
      return;
    }

    coords.forEach((child) => walkCoords(child));
  };

  walkCoords(feature?.geometry?.coordinates);

  return bounds.isValid() ? bounds.getCenter() : null;
};

const findClosestBoundaryFeature = (features, targetLatLng) => {
  if (!targetLatLng) {
    return null;
  }

  let closestFeature = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  features.forEach((feature) => {
    const center = getFeatureCenter(feature);
    if (!center) {
      return;
    }
    const distance = center.distanceTo(targetLatLng);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestFeature = feature;
    }
  });

  return closestFeature;
};

const findBoundaryFeature = (item, layerDataOverride = null) => {
  const category = item?.category;
  const config = boundaryLayerConfig[category];
  if (!config) {
    return null;
  }

  const layerData =
    layerDataOverride ||
    mapLayersStore.loadedData?.[config.category]?.[config.layerId];
  if (!layerData?.features?.length) {
    return null;
  }

  const target = normalizeBoundaryText(item.name);
  const { district, regency } =
    category === "desa" ? parseDesaParent(item.parent) : {};
  const targetDistrict = normalizeBoundaryText(district);
  const targetRegency = normalizeBoundaryText(regency);
  const targetParent = normalizeBoundaryText(item.parent);

  const matchesName = (feature) => {
    const props = feature?.properties || {};
    return config.properties.some(
      (key) => normalizeBoundaryText(props[key]) === target
    );
  };

  const exactMatch =
    layerData.features.find((feature) => {
      if (!matchesName(feature)) {
        return false;
      }

      const props = feature?.properties || {};

      if (category === "desa") {
        const districtMatch = normalizeBoundaryText(props.KECAMATAN);
        const regencyMatch = normalizeBoundaryText(props.KAB_KOTA);
        if (targetDistrict && districtMatch !== targetDistrict) {
          return false;
        }
        if (targetRegency && regencyMatch !== targetRegency) {
          return false;
        }
      }

      if (category === "kecamatan") {
        const regencyMatch = normalizeBoundaryText(props.KAB_KOTA);
        if (targetParent && regencyMatch !== targetParent) {
          return false;
        }
      }

      return true;
    }) || null;

  if (exactMatch) {
    return exactMatch;
  }

  const nameMatches = layerData.features.filter((feature) =>
    matchesName(feature)
  );

  if (nameMatches.length <= 1) {
    return nameMatches[0] || null;
  }

  const lat = Number(item?.lat);
  const lng = Number(item?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const closest = findClosestBoundaryFeature(
      nameMatches,
      L.latLng(lat, lng)
    );
    if (closest) {
      return closest;
    }
  }

  return nameMatches[0] || null;
};

const addSearchBoundary = (item, layerDataOverride = null) => {
  const feature = findBoundaryFeature(item, layerDataOverride);
  if (!feature || !mapInstance.value) {
    return;
  }

  const boundaryLayer = L.geoJSON(feature, {
    pane: MAP_PANES.search,
    interactive: true,
    coordsToLatLng,
    style: {
      color: "#1E88E5",
      weight: 2.5,
      fillColor: "#90CAF9",
      fillOpacity: 0.15,
      dashArray: "6, 4",
    },
    onEachFeature: (featureItem, layerInstance) => {
      ensureLayerInteractivity(layerInstance);
    },
  });

  searchHighlightLayer.addLayer(boundaryLayer);
};

const resolveSearchItem = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return searchItems.value.find((entry) => entry.id === value) || null;
  }
  if (value?.raw) {
    return value.raw;
  }
  return value;
};

const handleSearchSelect = async (value) => {
  const item = resolveSearchItem(value);
  if (!item || !mapInstance.value) {
    return;
  }

  searchQuery.value = item.name;
  searchMenu.value = false;

  const lat = Number(item.lat);
  const lng = Number(item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return;
  }

  const category = item.category || "desa";
  const zoom = Number.isFinite(item.zoom)
    ? item.zoom
    : searchZoomLevels[category] || 12;
  const latlng = L.latLng(lat, lng);

  mapInstance.value.flyTo(latlng, zoom, { duration: 1.2 });
  clearSearchHighlight();
  clearSearchPopup();
  addSearchHighlight(latlng, category);

  const popupContent = buildSearchPopupContent(item);
  if (popupContent) {
    searchPopup = L.popup({
      closeButton: true,
      autoClose: true,
      className: "search-popup",
    })
      .setLatLng(latlng)
      .setContent(popupContent)
      .openOn(mapInstance.value);
  }

  const boundaryConfig = boundaryLayerConfig[category];
  if (boundaryConfig) {
    const layerData = await mapLayersStore.loadLayerData(
      boundaryConfig.category,
      boundaryConfig.layerId
    );
    addSearchBoundary(item, layerData);
  }
};

const handleSearchEnter = async () => {
  const query = normalizeSearchText(searchQuery.value);
  if (!query) {
    return;
  }

  if (!mapUiStore.searchIndexLoaded && !mapUiStore.searchIndexLoading) {
    await ensureSearchIndex();
  }

  const match = findSearchMatch(query);
  if (!match) {
    return;
  }

  searchSelection.value = match;
  await handleSearchSelect(match);
};

const exportTypeMap = {
  housing: "housing",
  "housing-development": "housing-development",
  infrastruktur: "facility",
};

const exportLabelMap = {
  housing: "Laporan_RTLH",
  facility: "Laporan_Infrastruktur",
  "housing-development": "Laporan_Perumahan",
};

const sanitizeFilenamePart = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");

const findOptionName = (options, id) =>
  options.find((item) => item.id === id)?.name || id;

const buildExportFilename = (exportType, params) => {
  const label = exportLabelMap[exportType] || "Laporan_Ekspor";
  const year = params?.surveyYear ? sanitizeFilenamePart(params.surveyYear) : "";
  const villageName = params?.villageId
    ? findOptionName(villageOptions.value, params.villageId)
    : null;
  const districtName = params?.districtId
    ? findOptionName(districtOptions.value, params.districtId)
    : null;
  const regencyName = params?.regencyId
    ? findOptionName(regencyOptions.value, params.regencyId)
    : null;
  const provinceName = params?.provinceId
    ? findOptionName(provinceOptions.value, params.provinceId)
    : null;

  let scopeLabel = "";
  if (villageName) {
    scopeLabel = `Desa_${sanitizeFilenamePart(villageName)}`;
  } else if (districtName) {
    scopeLabel = `Kecamatan_${sanitizeFilenamePart(districtName)}`;
  } else if (regencyName) {
    scopeLabel = `Kabupaten_${sanitizeFilenamePart(regencyName)}`;
  } else if (provinceName) {
    scopeLabel = `Provinsi_${sanitizeFilenamePart(provinceName)}`;
  }

  const parts = [label, scopeLabel, year].filter(Boolean);
  return `${parts.join("_") || label}.xlsx`;
};

const handleExport = async () => {
  const activeFilters =
    selectedLocationFilters.value.length > 0
      ? selectedLocationFilters.value
      : locationFilterOptions.map((option) => option.value);
  if (!activeFilters.length) {
    exportErrorMessage.value = "Pilih minimal satu filter untuk ekspor.";
    exportErrorSnackbar.value = true;
    return;
  }

  if (activeFilters.length > 1) {
    exportErrorMessage.value = "Pilih satu filter agar ekspor lebih jelas.";
    exportErrorSnackbar.value = true;
    return;
  }

  const typeKey = activeFilters[0];
  const exportType = exportTypeMap[typeKey];
  if (!exportType) {
    exportErrorMessage.value = "Jenis ekspor tidak dikenali.";
    exportErrorSnackbar.value = true;
    return;
  }

  exportLoading.value = true;
  exportErrorMessage.value = "";
  exportInfoMessage.value = "";
  exportInfoSnackbar.value = false;

  try {
    const exportParams = getDashboardFilterParams();
    if (
      exportParams.regencyId &&
      !exportParams.districtId &&
      !exportParams.villageId
    ) {
      exportInfoMessage.value =
        "Ekspor wilayah kabupaten dapat memakan waktu. Mohon tunggu.";
      exportInfoSnackbar.value = true;
    }

    const blob = await exportAPI.download(exportType, exportParams);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildExportFilename(exportType, exportParams);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    exportErrorMessage.value =
      error?.message || "Gagal mengekspor data. Coba lagi.";
    exportErrorSnackbar.value = true;
  } finally {
    exportLoading.value = false;
  }
};

watch(searchQuery, (value) => {
  const normalized = value || "";
  if (!normalized) {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
    mapUiStore.setSearchQuery("");
    return;
  }

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = setTimeout(() => {
    mapUiStore.setSearchQuery(normalized);
    if (!mapUiStore.searchIndexLoaded) {
      ensureSearchIndex();
    }
  }, searchDebounceMs);
});

watch(searchSelection, (value) => {
  const resolved = resolveSearchItem(value);
  mapUiStore.setSearchSelection(resolved);
  if (!resolved) {
    clearSearchHighlight();
    clearSearchPopup();
  }
});

watch(searchErrorMessage, (value) => {
  searchErrorSnackbar.value = Boolean(value);
});

const resolveLayerStyle = (categoryKey, layerId, feature) => {
  const geometryType = feature?.geometry?.type;
  const isPolygon =
    geometryType === "Polygon" || geometryType === "MultiPolygon";

  const categoryStyles = GIS_STANDARDS[categoryKey] || {};
  const baseStyle = categoryStyles[layerId] || {
    color: "#546E7A",
    weight: 2,
    opacity: 0.9,
  };

  const fillColor = baseStyle.fillColor || baseStyle.color;
  const fillOpacity = isPolygon ? baseStyle.fillOpacity ?? 0.2 : 0;

  return {
    color: baseStyle.color,
    weight: baseStyle.weight ?? 2,
    opacity: baseStyle.opacity ?? 0.9,
    fillColor: isPolygon ? fillColor : baseStyle.color,
    fillOpacity,
    dashArray: baseStyle.dashArray,
  };
};

const resolveLayerPane = (categoryKey, layerId) => {
  if (categoryKey === "administrasi") {
    return MAP_PANES.boundaries;
  }

  if (categoryKey === "tata_ruang" || categoryKey === "bencana") {
    return MAP_PANES.polygons;
  }

  if (categoryKey === "infrastruktur") {
    if (layerId === "infrastruktur_desa") {
      return MAP_PANES.points;
    }
    return MAP_PANES.lines;
  }

  return MAP_PANES.polygons;
};

const getLayerKey = (categoryKey, layerId) => `${categoryKey}:${layerId}`;

const syncGeoJsonLayers = () => {
  if (!mapInstance.value) {
    return;
  }

  Object.entries(mapLayersStore.availableLayers).forEach(
    ([categoryKey, category]) => {
      category.layers.forEach((layer) => {
        const layerKey = getLayerKey(categoryKey, layer.id);
        const data = mapLayersStore.loadedData[categoryKey]?.[layer.id];
        const existingLayer = geoJsonLayerCache.get(layerKey);

        if (layer.active && data) {
          if (!existingLayer) {
            const geoLayer = L.geoJSON(data, {
              pane: resolveLayerPane(categoryKey, layer.id),
              coordsToLatLng,
              style: (feature) =>
                resolveLayerStyle(categoryKey, layer.id, feature),
              pointToLayer: (feature, latlng) => {
                const style = resolveLayerStyle(categoryKey, layer.id, feature);
                return L.circleMarker(latlng, {
                  radius: 5,
                  color: style.color,
                  weight: 1,
                  fillColor: style.fillColor || style.color,
                  fillOpacity: 0.8,
                  pane: MAP_PANES.points,
                });
              },
              onEachFeature: (feature, layerInstance) => {
                const popupContent = buildPopupContent(feature?.properties);
                if (popupContent) {
                  layerInstance.bindPopup(popupContent);
                }
              },
            });

            geoLayer.addTo(mapInstance.value);
            geoJsonLayerCache.set(layerKey, geoLayer);

            const bounds = geoLayer.getBounds();
            if (
              autoFitEnabled.value &&
              bounds &&
              bounds.isValid &&
              bounds.isValid()
            ) {
              mapInstance.value.fitBounds(bounds, { padding: [20, 20] });
            }
          }
        } else if (existingLayer) {
          mapInstance.value.removeLayer(existingLayer);
          geoJsonLayerCache.delete(layerKey);
        }
      });
    }
  );
};

const activeLayerKeys = computed(() => {
  const keys = [];

  Object.entries(mapLayersStore.availableLayers).forEach(
    ([categoryKey, category]) => {
      category.layers.forEach((layer) => {
        if (layer.active) {
          keys.push(getLayerKey(categoryKey, layer.id));
        }
      });
    }
  );

  return keys.sort();
});

const loadedLayerKeys = computed(() => {
  const keys = [];

  Object.entries(mapLayersStore.loadedData).forEach(([categoryKey, layers]) => {
    Object.keys(layers || {}).forEach((layerId) => {
      keys.push(getLayerKey(categoryKey, layerId));
    });
  });

  return keys.sort();
});

watch(
  [activeLayerKeys, loadedLayerKeys],
  () => {
    syncGeoJsonLayers();
  },
  { flush: "post" }
);

const handleQuickAction = (action) => {
  if (action.route) {
    router.push(action.route);
  }
};

const openVerificationQueue = (submission) => {
  if (!submission?.id) {
    router.push("/housing-data");
    return;
  }
  router.push({ path: "/housing-data", query: { focusId: submission.id } });
};

const handleFixSubmission = (submission) => {
  if (!submission?.id) return;
  router.push({ path: "/form", query: { editId: submission.id } });
};

const handleStartSurvey = () => {
  router.push("/form");
};

// Initialize charts
const initCharts = () => {
  // Wait for DOM to be ready
  if (!housingChartRef.value || !monthlyChartRef.value) {
    console.warn("Chart refs not ready yet, skipping initialization");
    return;
  }

  // Destroy existing charts if they exist
  if (housingChart) {
    try {
      housingChart.destroy();
    } catch (e) {
      console.warn("Error destroying housing chart:", e);
    }
    housingChart = null;
  }
  if (monthlyChart) {
    try {
      monthlyChart.destroy();
    } catch (e) {
      console.warn("Error destroying monthly chart:", e);
    }
    monthlyChart = null;
  }
  if (districtChart) {
    try {
      districtChart.destroy();
    } catch (e) {
      console.warn("Error destroying district chart:", e);
    }
    districtChart = null;
  }
  if (buildingChart) {
    try {
      buildingChart.destroy();
    } catch (e) {
      console.warn("Error destroying building chart:", e);
    }
    buildingChart = null;
  }

  // Clear canvas
  const housingCanvas = housingChartRef.value;
  const monthlyCanvas = monthlyChartRef.value;
  const districtCanvas = districtChartRef.value;
  const buildingCanvas = buildingChartRef.value;

  if (housingCanvas) {
    // Remove any existing Chart.js instance from canvas
    if (ChartJS.getChart(housingCanvas)) {
      ChartJS.getChart(housingCanvas)?.destroy();
    }
  }
  if (monthlyCanvas) {
    // Remove any existing Chart.js instance from canvas
    if (ChartJS.getChart(monthlyCanvas)) {
      ChartJS.getChart(monthlyCanvas)?.destroy();
    }
  }
  if (districtCanvas) {
    if (ChartJS.getChart(districtCanvas)) {
      ChartJS.getChart(districtCanvas)?.destroy();
    }
  }
  if (buildingCanvas) {
    if (ChartJS.getChart(buildingCanvas)) {
      ChartJS.getChart(buildingCanvas)?.destroy();
    }
  }

  // Housing Status Chart (Pie Chart)
  if (housingChartRef.value) {
    try {
      // Ensure we have data to display
      const layakHuni = rumahLayakHuni.value || 0;
      const tidakLayakHuni = rumahTidakLayakHuni.value || 0;
      const housingTotal = layakHuni + tidakLayakHuni;

      if (layakHuni === 0 && tidakLayakHuni === 0) {
        console.warn("No housing data available for chart");
      }

      housingChart = new ChartJS(housingChartRef.value, {
        type: "doughnut",
        data: {
          labels: ["Layak Huni", "Tidak Layak Huni"],
          datasets: [
            {
              data: [layakHuni, tidakLayakHuni],
              backgroundColor: ["#43A047", "#E53935"],
              borderColor: ["#43A047", "#E53935"],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            donutCenterLabel: {
              value: layakHuni,
              total: housingTotal,
              label: "Layak",
              color: "#2E7D32",
              fontSize: 16,
            },
            legend: {
              position: "bottom",
              labels: {
                padding: 15,
                font: {
                  size: 12,
                },
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage =
                    total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return `${label}: ${value.toLocaleString(
                    "id-ID"
                  )} (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error creating housing chart:", error);
    }
  }

  // Monthly Submission Chart (Line Chart)
  if (monthlyChartRef.value) {
    try {
      const labels =
        monthlyLabels.value.length > 0
          ? monthlyLabels.value
          : formatMonthLabels(buildMonthKeys());
      const monthlyHousingData =
        monthlyHousingCounts.value.length > 0
          ? monthlyHousingCounts.value
          : labels.map(() => 0);
      const monthlyInfrastructureData =
        monthlyInfrastructureCounts.value.length > 0
          ? monthlyInfrastructureCounts.value
          : labels.map(() => 0);
      const monthlyHousingDevelopmentData =
        monthlyHousingDevelopmentCounts.value.length > 0
          ? monthlyHousingDevelopmentCounts.value
          : labels.map(() => 0);

      monthlyChart = new ChartJS(monthlyChartRef.value, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Rumah Masyarakat",
              data: monthlyHousingData,
              borderColor: "#1976D2",
              backgroundColor: "rgba(25, 118, 210, 0.1)",
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              label: "Infrastruktur",
              data: monthlyInfrastructureData,
              borderColor: "#00ACC1",
              backgroundColor: "rgba(0, 172, 193, 0.1)",
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
            {
              label: "Perumahan",
              data: monthlyHousingDevelopmentData,
              borderColor: "#4CAF50",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              position: "top",
              labels: {
                padding: 15,
                font: {
                  size: 12,
                },
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${
                    context.dataset.label
                  }: ${context.parsed.y.toLocaleString("id-ID")} pengajuan`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 5,
                callback: function (value) {
                  return value.toLocaleString("id-ID");
                },
              },
              title: {
                display: true,
                text: "Jumlah Pengajuan",
              },
            },
            x: {
              title: {
                display: true,
                text: "Bulan",
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error creating monthly chart:", error);
    }
  }

  // Building Summary Chart (Horizontal Bar)
  if (buildingChartRef.value) {
    try {
      const summary = buildingSummaryCounts.value || {};
      const labels = ["Lantai", "Dinding", "Atap"];
      const counts = [
        Number(summary.floor || 0),
        Number(summary.wall || 0),
        Number(summary.roof || 0),
      ];

      buildingChart = new ChartJS(buildingChartRef.value, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Jumlah Rumah",
              data: counts,
              backgroundColor: ["#1E88E5", "#43A047", "#FB8C00"],
              borderRadius: 8,
              barThickness: 14,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.parsed.x.toLocaleString("id-ID")} rumah`,
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
              grid: {
                color: "rgba(0,0,0,0.05)",
              },
            },
            y: {
              grid: {
                display: false,
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error creating building summary chart:", error);
    }
  }

  // District Breakdown Chart (Stacked Bar)
  if (districtChartRef.value && districtLabels.value.length > 0) {
    try {
      const labels = districtLabels.value;
      const approvedData =
        districtApprovedCounts.value.length > 0
          ? districtApprovedCounts.value
          : labels.map(() => 0);
      const pendingData =
        districtPendingCounts.value.length > 0
          ? districtPendingCounts.value
          : labels.map(() => 0);
      const rejectedData =
        districtRejectedCounts.value.length > 0
          ? districtRejectedCounts.value
          : labels.map(() => 0);

      districtChart = new ChartJS(districtChartRef.value, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Disetujui",
              data: approvedData,
              backgroundColor: "#43A047",
            },
            {
              label: "Pending",
              data: pendingData,
              backgroundColor: "#FFC107",
            },
            {
              label: "Ditolak",
              data: rejectedData,
              backgroundColor: "#E53935",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                padding: 12,
                font: {
                  size: 12,
                },
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ${context.parsed.y.toLocaleString(
                    "id-ID"
                  )}`;
                },
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: {
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return value.toLocaleString("id-ID");
                },
              },
              title: {
                display: true,
                text: "Jumlah Pengajuan",
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error creating district chart:", error);
    }
  }
};

// Watch for data changes to update charts - but only after initial load
const isInitialLoad = ref(true);
watch(
  [
    rumahLayakHuni,
    rumahTidakLayakHuni,
    monthlyLabels,
    monthlyHousingCounts,
    monthlyInfrastructureCounts,
    monthlyHousingDevelopmentCounts,
    districtLabels,
    districtApprovedCounts,
    districtPendingCounts,
    districtRejectedCounts,
    housingCount,
    infrastructureCount,
    housingDevelopmentCount,
    buildingSummaryCounts,
  ],
  () => {
    // Skip watch on initial load - charts will be initialized in onMounted
    if (isInitialLoad.value) {
      isInitialLoad.value = false;
      return;
    }
    // Use setTimeout to ensure DOM is ready after data change
    setTimeout(() => {
      initCharts();
    }, 200);
  },
  { flush: "post" }
);

// Lifecycle
onMounted(async () => {
  console.log("Home page mounted");
  await loadMasyarakatSubmissions();
  if (isMasyarakat.value) {
    return;
  }
  await initializeDashboardFilters();
  await loadStatistics();
  if (isVerifikator.value) {
    await loadVerificationQueue();
  }
  if (showActivityWidget.value) {
    await loadActivityLogs();
  }
  await loadLocationFilters();
  await nextTick();
  initializeMap();
  await loadMapData();
  // Initialize charts after data is loaded
  // Use setTimeout to ensure DOM and refs are ready
  await nextTick();
  setTimeout(() => {
    initCharts();
    isInitialLoad.value = false;
  }, 500);
});

onBeforeUnmount(() => {
  // Cleanup charts
  if (housingChart) {
    housingChart.destroy();
    housingChart = null;
  }
  if (monthlyChart) {
    monthlyChart.destroy();
    monthlyChart = null;
  }
  if (districtChart) {
    districtChart.destroy();
    districtChart = null;
  }
  if (buildingChart) {
    buildingChart.destroy();
    buildingChart = null;
  }
  clearSearchHighlight();
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
  geoJsonLayerCache.clear();
  if (mapInstance.value) {
    mapInstance.value.remove();
    mapInstance.value = null;
  }
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.hover-elevation {
  transition: box-shadow 0.2s ease-in-out;
}

.hover-elevation:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

.map-container {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
}

.map-wrapper {
  position: relative;
}

.map-legend {
  position: absolute;
  right: 16px;
  bottom: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: min(260px, 42vw);
  max-width: 260px;
  z-index: 1001;
  pointer-events: auto;
}

.map-legend-left {
  left: 16px;
  right: auto;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.legend-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-body {
  max-height: 220px;
  overflow-y: auto;
}

.map-legend-collapsed {
  padding-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-swatch {
  width: 28px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
  box-sizing: border-box;
}

.auto-fit-toggle {
  margin-right: -4px;
}

.gap-2 {
  gap: 8px;
}

.layer-menu-body {
  max-height: 340px;
  overflow-y: auto;
}

:deep(.search-marker) {
  position: relative;
  width: 32px;
  height: 32px;
}

:deep(.search-pulse) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(25, 118, 210, 0.65);
  background: rgba(25, 118, 210, 0.15);
  transform: translate(-50%, -50%);
  animation: search-pulse 1.8s ease-out infinite;
}

:deep(.search-dot) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1976d2;
  border: 2px solid #ffffff;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

@keyframes search-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0.6;
  }
  70% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0;
  }
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

@media (min-width: 960px) {
  .chart-container {
    height: 350px;
  }
}

.map-section-card {
  overflow: hidden;
}

/* Filter Cards */
.filter-card {
  height: 100%;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
}

.filter-card:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-header {
  display: flex;
  align-items: center;
  min-height: 28px;
}

/* Layer Menu Improvements */
.layer-scroll-container {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}

.layer-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.layer-scroll-container::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.layer-scroll-container::-webkit-scrollbar-thumb {
  background: #bdbdbd;
  border-radius: 3px;
}

.layer-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #9e9e9e;
}

/* Map Container */
.map-container-wrapper {
  overflow: hidden;
  background: #f5f5f5;
}

.map-wrapper {
  position: relative;
  width: 100%;
}

.map-container {
  width: 100%;
  height: 550px;
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f5f5 100%);
  position: relative;
}

/* Legend Styling */
.map-legend {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 240px;
  z-index: 1001;
  pointer-events: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.map-legend-left {
  left: 12px;
  right: auto;
}

.map-legend-collapsed {
  padding-bottom: 10px;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 0;
}

.legend-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.legend-body {
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}

.legend-body::-webkit-scrollbar {
  width: 4px;
}

.legend-body::-webkit-scrollbar-track {
  background: transparent;
}

.legend-body::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 2px;
}

.legend-body::-webkit-scrollbar-thumb:hover {
  background: #bdbdbd;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 4px 0;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-swatch {
  width: 32px;
  height: 16px;
  border-radius: 4px;
  display: inline-block;
  flex-shrink: 0;
  box-sizing: border-box;
}

/* Print-specific styles removed */

/* Responsive Design */
@media (max-width: 960px) {
  .map-container {
    height: 450px;
  }

  .filter-card {
    margin-bottom: 0;
  }
}

@media (max-width: 600px) {
  .map-container {
    height: 380px;
  }

  .map-legend {
    right: 8px;
    bottom: 8px;
    max-width: 200px;
    padding: 10px;
  }

  .map-legend-left {
    left: 8px;
  }

  .legend-body {
    max-height: 200px;
  }
}

/* Search Marker Animation */
:deep(.search-marker) {
  position: relative;
  width: 32px;
  height: 32px;
}

:deep(.search-pulse) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(25, 118, 210, 0.7);
  background: rgba(25, 118, 210, 0.2);
  transform: translate(-50%, -50%);
  animation: search-pulse 1.8s ease-out infinite;
}

:deep(.search-dot) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1976D2;
  border: 2px solid #ffffff;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:deep(.map-marker-wrapper) {
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.map-marker) {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  color: #ffffff;
}

:deep(.map-marker .mdi) {
  font-size: 16px;
  line-height: 1;
}

@keyframes search-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0.7;
  }
  70% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0;
  }
}
</style>
