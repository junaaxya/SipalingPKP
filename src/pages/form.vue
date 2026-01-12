<template>
  <div>
    <v-container fluid class="px-2 px-sm-6 py-4">
      <v-snackbar
        v-model="photoToastOpen"
        :color="photoToastColor"
        location="top right"
        timeout="4000"
      >
        {{ photoToastMessage }}
        <template #actions>
          <v-btn variant="text" @click="photoToastOpen = false"> Tutup </v-btn>
        </template>
      </v-snackbar>

      <v-alert v-if="isEditMode" type="warning" variant="tonal" class="mb-4">
        <div class="text-body-2">
          Anda sedang memperbaiki data survei.
          <span v-if="editSubmissionNotes">
            Alasan penolakan: {{ editSubmissionNotes }}
          </span>
        </div>
      </v-alert>
      <v-card class="mx-auto w-100 form-card" max-width="1000">
        <!-- Header -->
        <v-card-title class="text-h6 text-sm-h5 text-center py-4">
          Formulir Survey Rumah Masyarakat
        </v-card-title>

        <!-- Progress Bar -->
        <v-card-text class="pb-0">
          <v-stepper
            v-model="currentStep"
            alt-labels
            class="elevation-0 form-stepper"
          >
            <v-stepper-header>
              <template v-for="(step, index) in steps" :key="index">
                <v-stepper-item
                  :complete="currentStep > index + 1"
                  :value="index + 1"
                  :title="step.title"
                  color="primary"
                />
                <v-divider v-if="index < steps.length - 1" />
              </template>
            </v-stepper-header>
          </v-stepper>
        </v-card-text>

        <!-- Form Content -->
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <!-- Step 1: Data Pengisi Formulir -->
            <div v-if="currentStep === 1">
              <h3 class="text-h6 mb-4">1. Data Pengisi Formulir</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.pengisi.nama"
                    label="Nama"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.pengisi.email"
                    label="Email"
                    :rules="[rules.email]"
                    type="email"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="formData.pengisi.jabatan"
                    label="Jabatan"
                    :items="jabatanOptions"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col v-if="formData.pengisi.jabatan === 'Lainnya'" cols="12">
                  <v-text-field
                    v-model="formData.pengisi.jabatanLainnya"
                    label="Jabatan Lainnya"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Step 2: Data Pemilik Rumah -->
            <div v-if="currentStep === 2">
              <h3 class="text-h6 mb-4">2. Data Pemilik Rumah</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.pemilik.nama"
                    label="Nama Pemilik Rumah"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="formatPhoneNumber(formData.pemilik.noTelp)"
                    label="No. Telp"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    :hint="PHONE_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.phone, rules.phoneLength]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.noTelp = sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.pemilik.namaKepalaKeluarga"
                    label="Nama Kepala Keluarga"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="
                      formatPhoneNumber(formData.pemilik.noTelpKepalaKeluarga)
                    "
                    label="No. Telp Kepala Keluarga"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    :hint="PHONE_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.phone, rules.phoneLength]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.noTelpKepalaKeluarga =
                          sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    :model-value="formData.pemilik.usia"
                    label="Usia"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="3"
                    :min="AGE_MIN"
                    :max="AGE_MAX"
                    :hint="AGE_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.age]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.usia = sanitizeDigits(val, 3);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    :model-value="formatNikNumber(formData.pemilik.noKK)"
                    label="No. KK"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="20"
                    :rules="[rules.required, rules.kkNumber]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.noKK = sanitizeDigits(val, 16);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    :model-value="formData.pemilik.jumlahKK"
                    label="Jumlah KK dalam 1 rumah"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    :min="KK_MIN"
                    :max="KK_MAX"
                    :hint="KK_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.kkRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.jumlahKK = sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
              </v-row>

              <v-row class="align-center mb-3">
                <v-col cols="12" md="6">
                  <h4 class="text-subtitle-1 mb-0">Alamat Rumah</h4>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="d-flex justify-end location-action-col"
                >
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-crosshairs-gps"
                    :loading="locationLoading.isSyncing"
                    class="location-action-btn"
                    @click="openLocationPicker"
                  >
                    Gunakan Lokasi Saat Ini
                  </v-btn>
                </v-col>
              </v-row>
              <v-alert
                v-if="locationSyncMessage"
                :type="locationSyncType"
                class="mb-4"
                density="compact"
                closable
                @click:close="locationSyncMessage = ''"
              >
                {{ locationSyncMessage }}
              </v-alert>
              <v-alert
                v-if="locationSelectError"
                type="error"
                class="mb-4"
                density="compact"
                closable
                @click:close="locationSelectError = ''"
              >
                {{ locationSelectError }}
              </v-alert>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.pemilik.latitude"
                    label="Latitude"
                    type="number"
                    step="any"
                    variant="outlined"
                    placeholder="contoh: -6.200000"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.pemilik.longitude"
                    label="Longitude"
                    type="number"
                    step="any"
                    variant="outlined"
                    placeholder="contoh: 106.816666"
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    v-model="formData.pemilik.province"
                    label="Provinsi"
                    :items="provinceOptions"
                    :loading="locationLoading.provinces"
                    item-title="name"
                    item-value="id"
                    return-object
                    clearable
                    :rules="[rules.required]"
                    variant="outlined"
                    hide-details="auto"
                    placeholder="Cari dan pilih provinsi"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    v-model="formData.pemilik.regency"
                    label="Kabupaten / Kota"
                    :items="regencyOptions"
                    :loading="locationLoading.regencies"
                    :disabled="!formData.pemilik.province"
                    item-title="name"
                    item-value="id"
                    return-object
                    clearable
                    :rules="[rules.required]"
                    variant="outlined"
                    hide-details="auto"
                    placeholder="Cari dan pilih kabupaten/kota"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    v-model="formData.pemilik.district"
                    label="Kecamatan"
                    :items="districtOptions"
                    :loading="locationLoading.districts"
                    :disabled="!formData.pemilik.regency"
                    item-title="name"
                    item-value="id"
                    return-object
                    clearable
                    :rules="[rules.required]"
                    variant="outlined"
                    hide-details="auto"
                    placeholder="Cari dan pilih kecamatan"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    v-model="formData.pemilik.village"
                    label="Kelurahan"
                    :items="villageOptions"
                    :loading="locationLoading.villages"
                    :disabled="!formData.pemilik.district"
                    item-title="name"
                    item-value="id"
                    return-object
                    clearable
                    :rules="[rules.required]"
                    variant="outlined"
                    hide-details="auto"
                    placeholder="Cari dan pilih kelurahan"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.pemilik.alamat"
                    label="Alamat"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-text-field
                    :model-value="formData.pemilik.rt"
                    label="RT"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="3"
                    :rules="[rules.required, rules.rtRw]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.rt = sanitizeDigits(val, 3);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-text-field
                    :model-value="formData.pemilik.rw"
                    label="RW"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="3"
                    :rules="[rules.required, rules.rtRw]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.rw = sanitizeDigits(val, 3);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="2">
                  <v-text-field
                    :model-value="formData.pemilik.postalCode"
                    label="Kode Pos"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="5"
                    hint="5 digit"
                    persistent-hint
                    :rules="[rules.postalCode]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.postalCode = sanitizeDigits(val, 5);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.pemilik.pendidikan"
                    label="Pendidikan"
                    :items="pendidikanOptions"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.pemilik.pekerjaan"
                    label="Pekerjaan"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="formData.pemilik.penghasilan"
                    label="Besar Penghasilan/Pengeluaran per Bulan"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    prefix="Rp"
                    :min="INCOME_MIN"
                    :max="INCOME_MAX"
                    :hint="INCOME_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.incomeRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.penghasilan = sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.pemilik.statusKepemilikanTanah"
                    label="Status Kepemilikan Tanah"
                    :items="['Milik Sendiri', 'Bukan Milik Sendiri']"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.pemilik.statusKepemilikanRumah"
                    label="Status Kepemilikan Rumah"
                    :items="['Milik Sendiri', 'Sewa', 'Menumpang']"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.pemilik.bantuanPerumahanStatus"
                    label="Pernah Menerima Bantuan Perumahan"
                    :items="['Ya', 'Tidak']"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="formData.pemilik.bantuanPerumahanStatus === 'Ya'"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    :model-value="formData.pemilik.bantuanPerumahanTahun"
                    label="Tahun Bantuan"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="4"
                    :hint="YEAR_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.year]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.pemilik.bantuanPerumahanTahun = sanitizeDigits(
                          val,
                          4
                        );
                      }
                    "
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="formData.pemilik.kriteriaMiskin"
                    label="Kriteria Miskin"
                    :items="['DTKS', 'SKTM Desa', 'Lainnya']"
                    variant="outlined"
                    clearable
                  />
                </v-col>
                <v-col
                  v-if="formData.pemilik.kriteriaMiskin === 'Lainnya'"
                  cols="12"
                >
                  <v-text-field
                    v-model="formData.pemilik.kriteriaMiskinLainnya"
                    label="Keterangan Kriteria Miskin"
                    variant="outlined"
                  />
                </v-col>
                <v-col v-if="formData.pemilik.kriteriaMiskin" cols="12">
                  <div class="mt-6">
                    <div
                      class="d-flex flex-column flex-sm-row flex-wrap align-start align-sm-center justify-space-between gap-2 mb-3"
                    >
                      <div>
                        <h4 class="text-subtitle-1 mb-1">
                          Berkas Kriteria Miskin
                        </h4>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                          Unggah bukti berkas kriteria miskin (maksimal
                          {{ MAX_IMAGES_PER_SECTION }} foto).
                        </p>
                      </div>
                      <div class="d-flex flex-wrap gap-2">
                        <v-btn
                          color="primary"
                          variant="outlined"
                          prepend-icon="mdi-camera"
                          class="mr-2"
                          :loading="imageProcessing.kemiskinan"
                          :disabled="
                            imageProcessing.kemiskinan ||
                            formData.kemiskinan.photos.length >=
                              MAX_IMAGES_PER_SECTION
                          "
                          @click="openImagePicker('kemiskinan', 'camera')"
                        >
                          Kamera
                        </v-btn>
                        <v-btn
                          color="primary"
                          variant="outlined"
                          prepend-icon="mdi-image-multiple"
                          :loading="imageProcessing.kemiskinan"
                          :disabled="
                            imageProcessing.kemiskinan ||
                            formData.kemiskinan.photos.length >=
                              MAX_IMAGES_PER_SECTION
                          "
                          @click="openImagePicker('kemiskinan', 'gallery')"
                        >
                          Galeri
                        </v-btn>
                      </div>
                    </div>

                    <v-row class="g-3">
                      <v-col
                        v-for="(photo, index) in formData.kemiskinan.photos"
                        :key="`kemiskinan-photo-${index}`"
                        cols="12"
                        sm="6"
                        md="4"
                      >
                        <v-card
                          class="upload-photo-card pa-4"
                          variant="outlined"
                          elevation="0"
                        >
                          <v-img
                            :src="photo.url"
                            height="160"
                            class="rounded-lg mb-3"
                            cover
                            :alt="photo.name"
                          />
                          <div
                            class="d-flex align-start align-sm-center justify-space-between gap-3"
                          >
                            <div class="text-truncate">
                              <p
                                class="text-body-2 font-weight-medium mb-0 text-truncate"
                                :title="photo.name"
                              >
                                {{ photo.name }}
                              </p>
                              <span class="text-caption text-medium-emphasis">
                                {{ formatFileSize(photo.size) }}
                              </span>
                            </div>
                            <v-btn
                              icon="mdi-close"
                              size="small"
                              variant="text"
                              color="error"
                              @click="removeImage('kemiskinan', index)"
                            />
                          </div>
                        </v-card>
                      </v-col>

                      <v-col
                        v-if="
                          formData.kemiskinan.photos.length <
                          MAX_IMAGES_PER_SECTION
                        "
                        cols="12"
                        sm="6"
                        md="4"
                      >
                        <v-card
                          class="upload-photo-placeholder pa-6 d-flex flex-column align-center justify-center"
                          variant="outlined"
                          tag="button"
                          type="button"
                          @click="openImagePicker('kemiskinan', 'gallery')"
                        >
                          <v-icon size="48" class="mb-3 text-primary">
                            mdi-image-plus
                          </v-icon>
                          <span
                            class="text-body-2 text-medium-emphasis text-center"
                          >
                            Tambah Foto
                          </span>
                          <span
                            class="text-caption text-medium-emphasis text-center mt-1"
                          >
                            Pilih dari galeri
                          </span>
                        </v-card>
                      </v-col>
                    </v-row>

                    <input
                      :ref="
                        (el) => registerUploadRef('kemiskinan', 'camera', el)
                      "
                      type="file"
                      accept="image/*"
                      capture="environment"
                      class="file-input-hidden"
                      @change="onImageSelected('kemiskinan', 'camera', $event)"
                    />
                    <input
                      :ref="
                        (el) => registerUploadRef('kemiskinan', 'gallery', el)
                      "
                      type="file"
                      accept="image/*"
                      class="file-input-hidden"
                      multiple
                      @change="onImageSelected('kemiskinan', 'gallery', $event)"
                    />

                    <v-alert
                      v-if="imageErrors.kemiskinan"
                      type="error"
                      density="compact"
                      class="mt-3"
                      closable
                      @click:close="imageErrors.kemiskinan = ''"
                    >
                      {{ imageErrors.kemiskinan }}
                    </v-alert>
                  </div>
                </v-col>
              </v-row>
            </div>

            <!-- Step 3: Data Rumah - Administrasi -->
            <div v-if="currentStep === 3">
              <h3 class="text-h6 mb-4">3.1 Data Rumah - Administrasi</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="formData.rumah.luasBangunan"
                    label="Luas Bangunan (m²)"
                    inputmode="decimal"
                    :min="AREA_MIN"
                    :max="AREA_MAX"
                    :hint="AREA_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.areaBangunanRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.rumah.luasBangunan = sanitizeDecimal(val);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="formData.rumah.luasTanah"
                    label="Luas Tanah (m²)"
                    inputmode="decimal"
                    :min="AREA_MIN"
                    :max="AREA_MAX"
                    :hint="AREA_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.areaTanahRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.rumah.luasTanah = sanitizeDecimal(val);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.rumah.memilikiIMB"
                    label="Memiliki Izin Mendirikan Bangunan (IMB/PBG)"
                    :items="['Ya', 'Tidak']"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.rumah.jenisRumah"
                    label="Jenis Rumah"
                    :items="[
                      'Rumah Tapak',
                      'Rumah Susun',
                      'Rumah Petak',
                      'Kos',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    :model-value="formData.rumah.jumlahPenghuni"
                    label="Jumlah Penghuni dalam 1 Rumah"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    :min="OCCUPANTS_MIN"
                    :max="OCCUPANTS_MAX"
                    :hint="OCCUPANTS_HINT"
                    persistent-hint
                    :rules="[rules.required, rules.occupantsRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.rumah.jumlahPenghuni = sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
              </v-row>

              <div class="mt-6">
                <div
                  class="d-flex flex-column flex-sm-row flex-wrap align-start align-sm-center justify-space-between gap-2 mb-3"
                >
                  <div>
                    <h4 class="text-subtitle-1 mb-1">Dokumentasi Rumah</h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Unggah maksimal {{ MAX_IMAGES_PER_SECTION }} foto kondisi
                      rumah. Ukuran tiap foto hingga {{ MAX_IMAGE_SIZE_MB }}MB.
                    </p>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-camera"
                      class="mr-2"
                      :loading="imageProcessing.rumah"
                      :disabled="
                        imageProcessing.rumah ||
                        formData.rumah.photos.length >= MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('rumah', 'camera')"
                    >
                      Kamera
                    </v-btn>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-image-multiple"
                      :loading="imageProcessing.rumah"
                      :disabled="
                        imageProcessing.rumah ||
                        formData.rumah.photos.length >= MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('rumah', 'gallery')"
                    >
                      Galeri
                    </v-btn>
                  </div>
                </div>

                <v-row class="g-3">
                  <v-col
                    v-for="(photo, index) in formData.rumah.photos"
                    :key="`rumah-photo-${index}`"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-card pa-4"
                      variant="outlined"
                      elevation="0"
                    >
                      <v-img
                        :src="photo.url"
                        height="160"
                        class="rounded-lg mb-3"
                        cover
                        :alt="photo.name"
                      />
                      <div
                        class="d-flex align-start align-sm-center justify-space-between gap-3"
                      >
                        <div class="text-truncate">
                          <p
                            class="text-body-2 font-weight-medium mb-0 text-truncate"
                            :title="photo.name"
                          >
                            {{ photo.name }}
                          </p>
                          <span class="text-caption text-medium-emphasis">
                            {{ formatFileSize(photo.size) }}
                          </span>
                        </div>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeImage('rumah', index)"
                        />
                      </div>
                    </v-card>
                  </v-col>

                  <v-col
                    v-if="formData.rumah.photos.length < MAX_IMAGES_PER_SECTION"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-placeholder pa-6 d-flex flex-column align-center justify-center"
                      variant="outlined"
                      tag="button"
                      type="button"
                      @click="openImagePicker('rumah', 'gallery')"
                    >
                      <v-icon size="48" class="mb-3 text-primary">
                        mdi-image-plus
                      </v-icon>
                      <span
                        class="text-body-2 text-medium-emphasis text-center"
                      >
                        Tambah Foto
                      </span>
                      <span
                        class="text-caption text-medium-emphasis text-center mt-1"
                      >
                        Pilih dari galeri
                      </span>
                    </v-card>
                  </v-col>
                </v-row>

                <input
                  :ref="(el) => registerUploadRef('rumah', 'camera', el)"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="file-input-hidden"
                  @change="onImageSelected('rumah', 'camera', $event)"
                />
                <input
                  :ref="(el) => registerUploadRef('rumah', 'gallery', el)"
                  type="file"
                  accept="image/*"
                  class="file-input-hidden"
                  multiple
                  @change="onImageSelected('rumah', 'gallery', $event)"
                />

                <v-alert
                  v-if="imageErrors.rumah"
                  type="error"
                  density="compact"
                  class="mt-3"
                  closable
                  @click:close="imageErrors.rumah = ''"
                >
                  {{ imageErrors.rumah }}
                </v-alert>
              </div>
            </div>

            <!-- Step 4: Komposisi Bahan Bangunan -->
            <div v-if="currentStep === 4">
              <h3 class="text-h6 mb-4">3.2 Aspek Komposisi Bahan Bangunan</h3>
              <v-row>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="formData.bangunan.lantai"
                    label="Lantai"
                    :items="[
                      'Tanah',
                      'Keramik',
                      'Rabat Semen',
                      'Papan',
                      'Kayu',
                      'Bata',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="formData.bangunan.dinding"
                    label="Dinding"
                    :items="[
                      'Tembok/Bata/Batako Tanpa Plester',
                      'Tembok Bata/Batako dengan Plester',
                      'Papan',
                      'Anyaman Bambu',
                      'Lainnya',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="formData.bangunan.atap"
                    label="Atap"
                    :items="[
                      'Genteng (Beton/Keramik)',
                      'Seng/Multiroof',
                      'Kayu/Sirap',
                      'Asbes',
                      'Lainnya',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <div class="mt-6">
                <div
                  class="d-flex flex-column flex-sm-row flex-wrap align-start align-sm-center justify-space-between gap-2 mb-3"
                >
                  <div>
                    <h4 class="text-subtitle-1 mb-1">
                      Dokumentasi Material Bangunan
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Unggah maksimal {{ MAX_IMAGES_PER_SECTION }} foto material
                      bangunan. Ukuran tiap foto hingga
                      {{ MAX_IMAGE_SIZE_MB }}MB.
                    </p>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      color="primary"
                      class="mr-2"
                      variant="outlined"
                      prepend-icon="mdi-camera"
                      :loading="imageProcessing.bangunan"
                      :disabled="
                        imageProcessing.bangunan ||
                        formData.bangunan.photos.length >=
                          MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('bangunan', 'camera')"
                    >
                      Kamera
                    </v-btn>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-image-multiple"
                      :loading="imageProcessing.bangunan"
                      :disabled="
                        imageProcessing.bangunan ||
                        formData.bangunan.photos.length >=
                          MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('bangunan', 'gallery')"
                    >
                      Galeri
                    </v-btn>
                  </div>
                </div>

                <v-row class="g-3">
                  <v-col
                    v-for="(photo, index) in formData.bangunan.photos"
                    :key="`bangunan-photo-${index}`"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-card pa-4"
                      variant="outlined"
                      elevation="0"
                    >
                      <v-img
                        :src="photo.url"
                        height="160"
                        class="rounded-lg mb-3"
                        cover
                        :alt="photo.name"
                      />
                      <div
                        class="d-flex align-start align-sm-center justify-space-between gap-3"
                      >
                        <div class="text-truncate">
                          <p
                            class="text-body-2 font-weight-medium mb-0 text-truncate"
                            :title="photo.name"
                          >
                            {{ photo.name }}
                          </p>
                          <span class="text-caption text-medium-emphasis">
                            {{ formatFileSize(photo.size) }}
                          </span>
                        </div>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeImage('bangunan', index)"
                        />
                      </div>
                    </v-card>
                  </v-col>

                  <v-col
                    v-if="
                      formData.bangunan.photos.length < MAX_IMAGES_PER_SECTION
                    "
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-placeholder pa-6 d-flex flex-column align-center justify-center"
                      variant="outlined"
                      tag="button"
                      type="button"
                      @click="openImagePicker('bangunan', 'gallery')"
                    >
                      <v-icon size="48" class="mb-3 text-primary">
                        mdi-image-plus
                      </v-icon>
                      <span
                        class="text-body-2 text-medium-emphasis text-center"
                      >
                        Tambah Foto
                      </span>
                      <span
                        class="text-caption text-medium-emphasis text-center mt-1"
                      >
                        Pilih dari galeri
                      </span>
                    </v-card>
                  </v-col>
                </v-row>

                <input
                  :ref="(el) => registerUploadRef('bangunan', 'camera', el)"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="file-input-hidden"
                  @change="onImageSelected('bangunan', 'camera', $event)"
                />
                <input
                  :ref="(el) => registerUploadRef('bangunan', 'gallery', el)"
                  type="file"
                  accept="image/*"
                  class="file-input-hidden"
                  multiple
                  @change="onImageSelected('bangunan', 'gallery', $event)"
                />

                <v-alert
                  v-if="imageErrors.bangunan"
                  type="error"
                  density="compact"
                  class="mt-3"
                  closable
                  @click:close="imageErrors.bangunan = ''"
                >
                  {{ imageErrors.bangunan }}
                </v-alert>
              </div>
            </div>

            <!-- Step 5: Aspek Kesehatan -->
            <div v-if="currentStep === 5">
              <h3 class="text-h6 mb-4">
                3.3 Aspek Kesehatan (Akses Air Bersih dan Air Minum)
              </h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.kesehatan.sumberAirMCK"
                    label="Sumber Air untuk Kebutuhan MCK"
                    :items="[
                      'Sumur Gali',
                      'Sumur Bor',
                      'Ledeng',
                      'Sumber Air Lainnya',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="formData.kesehatan.sumberAirMCK === 'Sumur Bor'"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    :model-value="formData.kesehatan.kedalamanSumurBor"
                    label="Kedalaman Sumur Bor (m)"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    :min="DEPTH_MIN"
                    :max="DEPTH_MAX"
                    :hint="DEPTH_HINT"
                    persistent-hint
                    :rules="[rules.depthRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.kesehatan.kedalamanSumurBor =
                          sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.kesehatan.lokasiSumberAir"
                    label="Lokasi Sumber Air"
                    :items="[
                      'Di Dalam Tanah Sendiri',
                      'Menumpang/Mengambil dari Tempat Lain',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.kesehatan.sumberAirMinum"
                    label="Sumber Air untuk Kebutuhan Minum/Memasak"
                    :items="[
                      'Sumur Gali',
                      'Sumur Bor',
                      'Ledeng',
                      'Air Isi Ulang',
                      'Sumber Air Lainnya',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="formData.kesehatan.sumberAirMinum === 'Sumur Bor'"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    :model-value="formData.kesehatan.kedalamanSumurBorMinum"
                    label="Kedalaman Sumur Bor untuk Minum (m)"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    :min="DEPTH_MIN"
                    :max="DEPTH_MAX"
                    :hint="DEPTH_HINT"
                    persistent-hint
                    :rules="[rules.depthRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.kesehatan.kedalamanSumurBorMinum =
                          sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
              </v-row>

              <div class="mt-6">
                <div
                  class="d-flex flex-column flex-sm-row flex-wrap align-start align-sm-center justify-space-between gap-2 mb-3"
                >
                  <div>
                    <h4 class="text-subtitle-1 mb-1">
                      Dokumentasi Akses Air Bersih
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Unggah maksimal {{ MAX_IMAGES_PER_SECTION }} foto terkait
                      akses air bersih. Ukuran tiap foto hingga
                      {{ MAX_IMAGE_SIZE_MB }}MB.
                    </p>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      color="primary"
                      class="mr-2"
                      variant="outlined"
                      prepend-icon="mdi-camera"
                      :loading="imageProcessing.kesehatan"
                      :disabled="
                        imageProcessing.kesehatan ||
                        formData.kesehatan.photos.length >=
                          MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('kesehatan', 'camera')"
                    >
                      Kamera
                    </v-btn>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-image-multiple"
                      :loading="imageProcessing.kesehatan"
                      :disabled="
                        imageProcessing.kesehatan ||
                        formData.kesehatan.photos.length >=
                          MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('kesehatan', 'gallery')"
                    >
                      Galeri
                    </v-btn>
                  </div>
                </div>

                <v-row class="g-3">
                  <v-col
                    v-for="(photo, index) in formData.kesehatan.photos"
                    :key="`kesehatan-photo-${index}`"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-card pa-4"
                      variant="outlined"
                      elevation="0"
                    >
                      <v-img
                        :src="photo.url"
                        height="160"
                        class="rounded-lg mb-3"
                        cover
                        :alt="photo.name"
                      />
                      <div
                        class="d-flex align-start align-sm-center justify-space-between gap-3"
                      >
                        <div class="text-truncate">
                          <p
                            class="text-body-2 font-weight-medium mb-0 text-truncate"
                            :title="photo.name"
                          >
                            {{ photo.name }}
                          </p>
                          <span class="text-caption text-medium-emphasis">
                            {{ formatFileSize(photo.size) }}
                          </span>
                        </div>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeImage('kesehatan', index)"
                        />
                      </div>
                    </v-card>
                  </v-col>

                  <v-col
                    v-if="
                      formData.kesehatan.photos.length < MAX_IMAGES_PER_SECTION
                    "
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-placeholder pa-6 d-flex flex-column align-center justify-center"
                      variant="outlined"
                      tag="button"
                      type="button"
                      @click="openImagePicker('kesehatan', 'gallery')"
                    >
                      <v-icon size="48" class="mb-3 text-primary">
                        mdi-image-plus
                      </v-icon>
                      <span
                        class="text-body-2 text-medium-emphasis text-center"
                      >
                        Tambah Foto
                      </span>
                      <span
                        class="text-caption text-medium-emphasis text-center mt-1"
                      >
                        Pilih dari galeri
                      </span>
                    </v-card>
                  </v-col>
                </v-row>

                <input
                  :ref="(el) => registerUploadRef('kesehatan', 'camera', el)"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="file-input-hidden"
                  @change="onImageSelected('kesehatan', 'camera', $event)"
                />
                <input
                  :ref="(el) => registerUploadRef('kesehatan', 'gallery', el)"
                  type="file"
                  accept="image/*"
                  class="file-input-hidden"
                  multiple
                  @change="onImageSelected('kesehatan', 'gallery', $event)"
                />

                <v-alert
                  v-if="imageErrors.kesehatan"
                  type="error"
                  density="compact"
                  class="mt-3"
                  closable
                  @click:close="imageErrors.kesehatan = ''"
                >
                  {{ imageErrors.kesehatan }}
                </v-alert>
              </div>
            </div>

            <!-- Step 6: Akses Sanitasi -->
            <div v-if="currentStep === 6">
              <h3 class="text-h6 mb-4">3.4 Akses Sanitasi</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.sanitasi.kepemilikanJamban"
                    label="Kepemilikan Jamban"
                    :items="[
                      'Milik Sendiri',
                      'Jamban Bersama',
                      'Tidak Memiliki Jamban',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="
                    formData.sanitasi.kepemilikanJamban !==
                    'Tidak Memiliki Jamban'
                  "
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    :model-value="formData.sanitasi.jumlahJamban"
                    label="Jumlah Jamban yang Dimiliki"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    :min="TOILET_MIN"
                    :max="TOILET_MAX"
                    :hint="TOILET_HINT"
                    persistent-hint
                    :rules="[rules.toiletRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.sanitasi.jumlahJamban = sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.sanitasi.jenisCloset"
                    label="Jenis Closet"
                    :items="[
                      'Cubluk',
                      'Leher Angsa (Jongkok)',
                      'Leher Angsa (Duduk)',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.sanitasi.jenisTangkiSeptic"
                    label="Jenis Tangki Septic"
                    :items="[
                      'Biotank',
                      'Tanki dengan Konstruksi Permanen',
                      'Lubang Tanah',
                      'Tidak Memiliki Tanki',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="
                    formData.sanitasi.jenisTangkiSeptic !==
                    'Tidak Memiliki Tanki'
                  "
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    :model-value="formData.sanitasi.tahunPembuatanTangki"
                    label="Tahun Pembuatan Tangki Septic"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="4"
                    :min="YEAR_MIN"
                    :max="YEAR_MAX"
                    :hint="YEAR_HINT"
                    persistent-hint
                    :rules="[rules.year]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.sanitasi.tahunPembuatanTangki = sanitizeDigits(
                          val,
                          4
                        );
                      }
                    "
                  />
                </v-col>
                <v-col
                  v-if="
                    formData.sanitasi.jenisTangkiSeptic !==
                    'Tidak Memiliki Tanki'
                  "
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="formData.sanitasi.pernahPenyedotan"
                    label="Apakah Tangki Septic Pernah Dilakukan Penyedotan"
                    :items="['Ya', 'Tidak']"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="formData.sanitasi.pernahPenyedotan === 'Ya'"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    :model-value="formData.sanitasi.tahunPenyedotan"
                    label="Tahun Penyedotan"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="4"
                    :min="YEAR_MIN"
                    :max="YEAR_MAX"
                    :hint="YEAR_HINT"
                    persistent-hint
                    :rules="[rules.year]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.sanitasi.tahunPenyedotan = sanitizeDigits(
                          val,
                          4
                        );
                      }
                    "
                  />
                </v-col>
                <v-col
                  v-if="formData.sanitasi.pernahPenyedotan === 'Ya'"
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="formData.sanitasi.jasaSedotTinja"
                    label="Jasa Sedot Tinja yang Digunakan"
                    :items="['Pemda', 'Swasta (Perorangan/Badan Usaha)']"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="formData.sanitasi.pengaliranAirLimbah"
                    label="Pengaliran Air Limbah"
                    :items="[
                      'Tergabung dalam Jaringan Pipa Pengolahan Air Limbah',
                      'Tergabung dalam Tangki Septic',
                      'Langsung Dialirkan ke Drainase/Saluran/Sungai',
                      'Ditampung dalam Lubang/Resapan ke Tanah',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <div class="mt-6">
                <div
                  class="d-flex flex-column flex-sm-row flex-wrap align-start align-sm-center justify-space-between gap-2 mb-3"
                >
                  <div>
                    <h4 class="text-subtitle-1 mb-1">
                      Dokumentasi Akses Sanitasi
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Unggah maksimal {{ MAX_IMAGES_PER_SECTION }} foto
                      fasilitas sanitasi. Ukuran tiap foto hingga
                      {{ MAX_IMAGE_SIZE_MB }}MB.
                    </p>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      color="primary"
                      class="mr-2"
                      variant="outlined"
                      prepend-icon="mdi-camera"
                      :loading="imageProcessing.sanitasi"
                      :disabled="
                        imageProcessing.sanitasi ||
                        formData.sanitasi.photos.length >=
                          MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('sanitasi', 'camera')"
                    >
                      Kamera
                    </v-btn>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-image-multiple"
                      :loading="imageProcessing.sanitasi"
                      :disabled="
                        imageProcessing.sanitasi ||
                        formData.sanitasi.photos.length >=
                          MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('sanitasi', 'gallery')"
                    >
                      Galeri
                    </v-btn>
                  </div>
                </div>

                <v-row class="g-3">
                  <v-col
                    v-for="(photo, index) in formData.sanitasi.photos"
                    :key="`sanitasi-photo-${index}`"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-card pa-4"
                      variant="outlined"
                      elevation="0"
                    >
                      <v-img
                        :src="photo.url"
                        height="160"
                        class="rounded-lg mb-3"
                        cover
                        :alt="photo.name"
                      />
                      <div
                        class="d-flex align-start align-sm-center justify-space-between gap-3"
                      >
                        <div class="text-truncate">
                          <p
                            class="text-body-2 font-weight-medium mb-0 text-truncate"
                            :title="photo.name"
                          >
                            {{ photo.name }}
                          </p>
                          <span class="text-caption text-medium-emphasis">
                            {{ formatFileSize(photo.size) }}
                          </span>
                        </div>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeImage('sanitasi', index)"
                        />
                      </div>
                    </v-card>
                  </v-col>

                  <v-col
                    v-if="
                      formData.sanitasi.photos.length < MAX_IMAGES_PER_SECTION
                    "
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-placeholder pa-6 d-flex flex-column align-center justify-center"
                      variant="outlined"
                      tag="button"
                      type="button"
                      @click="openImagePicker('sanitasi', 'gallery')"
                    >
                      <v-icon size="48" class="mb-3 text-primary">
                        mdi-image-plus
                      </v-icon>
                      <span
                        class="text-body-2 text-medium-emphasis text-center"
                      >
                        Tambah Foto
                      </span>
                      <span
                        class="text-caption text-medium-emphasis text-center mt-1"
                      >
                        Pilih dari galeri
                      </span>
                    </v-card>
                  </v-col>
                </v-row>

                <input
                  :ref="(el) => registerUploadRef('sanitasi', 'camera', el)"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="file-input-hidden"
                  @change="onImageSelected('sanitasi', 'camera', $event)"
                />
                <input
                  :ref="(el) => registerUploadRef('sanitasi', 'gallery', el)"
                  type="file"
                  accept="image/*"
                  class="file-input-hidden"
                  multiple
                  @change="onImageSelected('sanitasi', 'gallery', $event)"
                />

                <v-alert
                  v-if="imageErrors.sanitasi"
                  type="error"
                  density="compact"
                  class="mt-3"
                  closable
                  @click:close="imageErrors.sanitasi = ''"
                >
                  {{ imageErrors.sanitasi }}
                </v-alert>
              </div>
            </div>

            <!-- Step 7: Akses Persampahan -->
            <div v-if="currentStep === 7">
              <h3 class="text-h6 mb-4">3.5 Akses Persampahan</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.persampahan.aksesPengangkutanSampah"
                    label="Telah Terdapat Akses Pengangkutan Sampah"
                    :items="['Ya', 'Tidak']"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="formData.persampahan.aksesPengangkutanSampah === 'Ya'"
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="formData.persampahan.pengelolaPengangkutanSampah"
                    label="Pengelola Pengangkutan Sampah"
                    :items="[
                      'Pemda',
                      'Pemdes',
                      'LSM/Kelompok Masyarakat',
                      'Lainnya',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="
                    formData.persampahan.pengelolaPengangkutanSampah ===
                    'Lainnya'
                  "
                  cols="12"
                >
                  <v-text-field
                    v-model="formData.persampahan.pengelolaLainnya"
                    label="Pengelola Lainnya"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="
                    formData.persampahan.aksesPengangkutanSampah === 'Tidak'
                  "
                  cols="12"
                >
                  <v-select
                    v-model="formData.persampahan.pengelolaanSampah"
                    label="Bagaimana Pengelolaan Sampah"
                    :items="[
                      'Dibakar',
                      'Diolah di Rumah (Kompos/Ditimbun)',
                      'Dibuang ke Tempat Sampah Umum',
                      'Dibuang di Tempat Lainnya',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <div class="mt-6">
                <div
                  class="d-flex flex-column flex-sm-row flex-wrap align-start align-sm-center justify-space-between gap-2 mb-3"
                >
                  <div>
                    <h4 class="text-subtitle-1 mb-1">
                      Dokumentasi Pengelolaan Sampah
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Unggah maksimal {{ MAX_IMAGES_PER_SECTION }} foto terkait
                      pengelolaan sampah. Ukuran tiap foto hingga
                      {{ MAX_IMAGE_SIZE_MB }}MB.
                    </p>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      color="primary"
                      class="mr-2"
                      variant="outlined"
                      prepend-icon="mdi-camera"
                      :loading="imageProcessing.persampahan"
                      :disabled="
                        imageProcessing.persampahan ||
                        formData.persampahan.photos.length >=
                          MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('persampahan', 'camera')"
                    >
                      Kamera
                    </v-btn>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-image-multiple"
                      :loading="imageProcessing.persampahan"
                      :disabled="
                        imageProcessing.persampahan ||
                        formData.persampahan.photos.length >=
                          MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('persampahan', 'gallery')"
                    >
                      Galeri
                    </v-btn>
                  </div>
                </div>

                <v-row class="g-3">
                  <v-col
                    v-for="(photo, index) in formData.persampahan.photos"
                    :key="`persampahan-photo-${index}`"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-card pa-4"
                      variant="outlined"
                      elevation="0"
                    >
                      <v-img
                        :src="photo.url"
                        height="160"
                        class="rounded-lg mb-3"
                        cover
                        :alt="photo.name"
                      />
                      <div
                        class="d-flex align-start align-sm-center justify-space-between gap-3"
                      >
                        <div class="text-truncate">
                          <p
                            class="text-body-2 font-weight-medium mb-0 text-truncate"
                            :title="photo.name"
                          >
                            {{ photo.name }}
                          </p>
                          <span class="text-caption text-medium-emphasis">
                            {{ formatFileSize(photo.size) }}
                          </span>
                        </div>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeImage('persampahan', index)"
                        />
                      </div>
                    </v-card>
                  </v-col>

                  <v-col
                    v-if="
                      formData.persampahan.photos.length <
                      MAX_IMAGES_PER_SECTION
                    "
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-placeholder pa-6 d-flex flex-column align-center justify-center"
                      variant="outlined"
                      tag="button"
                      type="button"
                      @click="openImagePicker('persampahan', 'gallery')"
                    >
                      <v-icon size="48" class="mb-3 text-primary">
                        mdi-image-plus
                      </v-icon>
                      <span
                        class="text-body-2 text-medium-emphasis text-center"
                      >
                        Tambah Foto
                      </span>
                      <span
                        class="text-caption text-medium-emphasis text-center mt-1"
                      >
                        Pilih dari galeri
                      </span>
                    </v-card>
                  </v-col>
                </v-row>

                <input
                  :ref="(el) => registerUploadRef('persampahan', 'camera', el)"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="file-input-hidden"
                  @change="onImageSelected('persampahan', 'camera', $event)"
                />
                <input
                  :ref="(el) => registerUploadRef('persampahan', 'gallery', el)"
                  type="file"
                  accept="image/*"
                  class="file-input-hidden"
                  multiple
                  @change="onImageSelected('persampahan', 'gallery', $event)"
                />

                <v-alert
                  v-if="imageErrors.persampahan"
                  type="error"
                  density="compact"
                  class="mt-3"
                  closable
                  @click:close="imageErrors.persampahan = ''"
                >
                  {{ imageErrors.persampahan }}
                </v-alert>
              </div>
            </div>

            <!-- Step 8: Akses Jalan -->
            <div v-if="currentStep === 8">
              <h3 class="text-h6 mb-4">3.6 Akses Jalan</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.jalan.jenisJalan"
                    label="Jenis Jalan Akses Menuju Rumah"
                    :items="[
                      'Jalan Lebar < 3,5 m',
                      'Jalan Lebar > 3,5 m',
                      'Tidak Terdapat Jalan Akses/Melalui Perkarangan Orang Lain',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.jalan.konstruksiJalan"
                    label="Jenis Konstruksi Jalan Akses"
                    :items="[
                      'Jalan Beton',
                      'Jalan Aspal',
                      'Jalan Konblok',
                      'Jalan Tanah/Sirtu',
                      'Konstruksi Lainnya',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="formData.jalan.konstruksiJalan === 'Konstruksi Lainnya'"
                  cols="12"
                >
                  <v-text-field
                    v-model="formData.jalan.konstruksiLainnya"
                    label="Konstruksi Lainnya"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
              </v-row>

              <div class="mt-6">
                <div
                  class="d-flex flex-column flex-sm-row flex-wrap align-start align-sm-center justify-space-between gap-2 mb-3"
                >
                  <div>
                    <h4 class="text-subtitle-1 mb-1">
                      Dokumentasi Akses Jalan
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Unggah maksimal {{ MAX_IMAGES_PER_SECTION }} foto akses
                      jalan. Ukuran tiap foto hingga {{ MAX_IMAGE_SIZE_MB }}MB.
                    </p>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      class="mr-2"
                      prepend-icon="mdi-camera"
                      :loading="imageProcessing.jalan"
                      :disabled="
                        imageProcessing.jalan ||
                        formData.jalan.photos.length >= MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('jalan', 'camera')"
                    >
                      Kamera
                    </v-btn>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-image-multiple"
                      :loading="imageProcessing.jalan"
                      :disabled="
                        imageProcessing.jalan ||
                        formData.jalan.photos.length >= MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('jalan', 'gallery')"
                    >
                      Galeri
                    </v-btn>
                  </div>
                </div>

                <v-row class="g-3">
                  <v-col
                    v-for="(photo, index) in formData.jalan.photos"
                    :key="`jalan-photo-${index}`"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-card pa-4"
                      variant="outlined"
                      elevation="0"
                    >
                      <v-img
                        :src="photo.url"
                        height="160"
                        class="rounded-lg mb-3"
                        cover
                        :alt="photo.name"
                      />
                      <div
                        class="d-flex align-start align-sm-center justify-space-between gap-3"
                      >
                        <div class="text-truncate">
                          <p
                            class="text-body-2 font-weight-medium mb-0 text-truncate"
                            :title="photo.name"
                          >
                            {{ photo.name }}
                          </p>
                          <span class="text-caption text-medium-emphasis">
                            {{ formatFileSize(photo.size) }}
                          </span>
                        </div>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeImage('jalan', index)"
                        />
                      </div>
                    </v-card>
                  </v-col>

                  <v-col
                    v-if="formData.jalan.photos.length < MAX_IMAGES_PER_SECTION"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-placeholder pa-6 d-flex flex-column align-center justify-center"
                      variant="outlined"
                      tag="button"
                      type="button"
                      @click="openImagePicker('jalan', 'gallery')"
                    >
                      <v-icon size="48" class="mb-3 text-primary">
                        mdi-image-plus
                      </v-icon>
                      <span
                        class="text-body-2 text-medium-emphasis text-center"
                      >
                        Tambah Foto
                      </span>
                      <span
                        class="text-caption text-medium-emphasis text-center mt-1"
                      >
                        Pilih dari galeri
                      </span>
                    </v-card>
                  </v-col>
                </v-row>

                <input
                  :ref="(el) => registerUploadRef('jalan', 'camera', el)"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="file-input-hidden"
                  @change="onImageSelected('jalan', 'camera', $event)"
                />
                <input
                  :ref="(el) => registerUploadRef('jalan', 'gallery', el)"
                  type="file"
                  accept="image/*"
                  class="file-input-hidden"
                  multiple
                  @change="onImageSelected('jalan', 'gallery', $event)"
                />

                <v-alert
                  v-if="imageErrors.jalan"
                  type="error"
                  density="compact"
                  class="mt-3"
                  closable
                  @click:close="imageErrors.jalan = ''"
                >
                  {{ imageErrors.jalan }}
                </v-alert>
              </div>
            </div>

            <!-- Step 9: Akses Energi -->
            <div v-if="currentStep === 9">
              <h3 class="text-h6 mb-4">3.7 Akses Energi</h3>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="formData.energi.sumberListrik"
                    label="Sumber Listrik di Rumah"
                    :items="[
                      'PLN Sendiri',
                      'PLN Menumpang',
                      'Tidak Ada',
                      'Lainnya',
                    ]"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="formData.energi.sumberListrik === 'Lainnya'"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="formData.energi.sumberListrikLainnya"
                    label="Sumber Listrik Lainnya"
                    :rules="[rules.required]"
                    variant="outlined"
                  />
                </v-col>
                <v-col
                  v-if="
                    formData.energi.sumberListrik === 'PLN Sendiri' ||
                    formData.energi.sumberListrik === 'PLN Menumpang'
                  "
                  cols="12"
                >
                  <v-text-field
                    :model-value="formData.energi.kapasitasListrik"
                    label="Kapasitas Listrik (Watt)"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    :min="ELECTRICITY_MIN"
                    :max="ELECTRICITY_MAX"
                    :hint="ELECTRICITY_HINT"
                    persistent-hint
                    :rules="[rules.electricityRange]"
                    variant="outlined"
                    @update:modelValue="
                      (val) => {
                        formData.energi.kapasitasListrik = sanitizeDigits(val);
                      }
                    "
                  />
                </v-col>
              </v-row>

              <div class="mt-6">
                <div
                  class="d-flex flex-column flex-sm-row flex-wrap align-start align-sm-center justify-space-between gap-2 mb-3"
                >
                  <div>
                    <h4 class="text-subtitle-1 mb-1">
                      Dokumentasi Akses Energi
                    </h4>
                    <p class="text-body-2 text-medium-emphasis mb-0">
                      Unggah maksimal {{ MAX_IMAGES_PER_SECTION }} foto akses
                      energi. Ukuran tiap foto hingga {{ MAX_IMAGE_SIZE_MB }}MB.
                    </p>
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <v-btn
                      color="primary"
                      class="mr-2"
                      variant="outlined"
                      prepend-icon="mdi-camera"
                      :loading="imageProcessing.energi"
                      :disabled="
                        imageProcessing.energi ||
                        formData.energi.photos.length >= MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('energi', 'camera')"
                    >
                      Kamera
                    </v-btn>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      prepend-icon="mdi-image-multiple"
                      :loading="imageProcessing.energi"
                      :disabled="
                        imageProcessing.energi ||
                        formData.energi.photos.length >= MAX_IMAGES_PER_SECTION
                      "
                      @click="openImagePicker('energi', 'gallery')"
                    >
                      Galeri
                    </v-btn>
                  </div>
                </div>

                <v-row class="g-3">
                  <v-col
                    v-for="(photo, index) in formData.energi.photos"
                    :key="`energi-photo-${index}`"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-card pa-4"
                      variant="outlined"
                      elevation="0"
                    >
                      <v-img
                        :src="photo.url"
                        height="160"
                        class="rounded-lg mb-3"
                        cover
                        :alt="photo.name"
                      />
                      <div
                        class="d-flex align-start align-sm-center justify-space-between gap-3"
                      >
                        <div class="text-truncate">
                          <p
                            class="text-body-2 font-weight-medium mb-0 text-truncate"
                            :title="photo.name"
                          >
                            {{ photo.name }}
                          </p>
                          <span class="text-caption text-medium-emphasis">
                            {{ formatFileSize(photo.size) }}
                          </span>
                        </div>
                        <v-btn
                          icon="mdi-close"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeImage('energi', index)"
                        />
                      </div>
                    </v-card>
                  </v-col>

                  <v-col
                    v-if="
                      formData.energi.photos.length < MAX_IMAGES_PER_SECTION
                    "
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <v-card
                      class="upload-photo-placeholder pa-6 d-flex flex-column align-center justify-center"
                      variant="outlined"
                      tag="button"
                      type="button"
                      @click="openImagePicker('energi', 'gallery')"
                    >
                      <v-icon size="48" class="mb-3 text-primary">
                        mdi-image-plus
                      </v-icon>
                      <span
                        class="text-body-2 text-medium-emphasis text-center"
                      >
                        Tambah Foto
                      </span>
                      <span
                        class="text-caption text-medium-emphasis text-center mt-1"
                      >
                        Pilih dari galeri
                      </span>
                    </v-card>
                  </v-col>
                </v-row>

                <input
                  :ref="(el) => registerUploadRef('energi', 'camera', el)"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="file-input-hidden"
                  @change="onImageSelected('energi', 'camera', $event)"
                />
                <input
                  :ref="(el) => registerUploadRef('energi', 'gallery', el)"
                  type="file"
                  accept="image/*"
                  class="file-input-hidden"
                  multiple
                  @change="onImageSelected('energi', 'gallery', $event)"
                />

                <v-alert
                  v-if="imageErrors.energi"
                  type="error"
                  density="compact"
                  class="mt-3"
                  closable
                  @click:close="imageErrors.energi = ''"
                >
                  {{ imageErrors.energi }}
                </v-alert>
              </div>
            </div>

            <!-- Step 10: Review and Submit -->
            <div v-if="currentStep === 10">
              <h3 class="text-h6 mb-4">Tinjau Data</h3>
              <v-alert type="info" class="mb-4">
                Silakan review data yang telah diisi sebelum submit.
              </v-alert>

              <!-- Summary Cards -->
              <v-row>
                <v-col cols="12" md="6">
                  <v-card>
                    <v-card-title class="text-subtitle-1">
                      Data Pengisi
                    </v-card-title>
                    <v-card-text>
                      <p><strong>Nama:</strong> {{ formData.pengisi.nama }}</p>
                      <p>
                        <strong>Email:</strong> {{ formData.pengisi.email }}
                      </p>
                      <p>
                        <strong>Jabatan:</strong> {{ formData.pengisi.jabatan }}
                      </p>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card>
                    <v-card-title class="text-subtitle-1">
                      Data Pemilik
                    </v-card-title>
                    <v-card-text>
                      <p><strong>Nama:</strong> {{ formData.pemilik.nama }}</p>
                      <p>
                        <strong>Lokasi:</strong>
                        {{ ownerLocationSummary || "-" }}
                      </p>
                      <p>
                        <strong>Alamat:</strong>
                        {{ ownerAddressSummary || "-" }}
                      </p>
                      <p>
                        <strong>RT/RW:</strong>
                        {{ formData.pemilik.rt || "-" }}/{{
                          formData.pemilik.rw || "-"
                        }}
                      </p>
                      <p>
                        <strong>Kode Pos:</strong>
                        {{ formData.pemilik.postalCode || "-" }}
                      </p>
                      <p>
                        <strong>Status Rumah:</strong>
                        {{ formData.pemilik.statusKepemilikanRumah }}
                      </p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>

        <!-- Navigation Buttons -->
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn
            v-if="currentStep > 1"
            variant="outlined"
            class="mr-2"
            @click="previousStep"
          >
            <v-icon start> mdi-chevron-left </v-icon>
            Sebelumnya
          </v-btn>
          <v-btn
            v-if="currentStep < steps.length"
            color="primary"
            :disabled="requiresValidation && !formValid"
            @click="nextStep"
          >
            Selanjutnya
            <v-icon end> mdi-chevron-right </v-icon>
          </v-btn>
          <v-btn
            v-if="currentStep === steps.length"
            color="success"
            :loading="isSubmitting"
            @click="submitForm"
          >
            <v-icon start> mdi-check </v-icon>
            Kirim Formulir
          </v-btn>
        </v-card-actions>
      </v-card>
      <LocationPickerDialog
        v-model="locationPickerOpen"
        v-model:latitude="locationPickerLat"
        v-model:longitude="locationPickerLng"
        title="Pilih Lokasi Rumah"
        @confirm="handleLocationPicked"
      />
    </v-container>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { definePage } from "unplugin-vue-router/runtime";
import { useHousingStore } from "@/stores/housing";
import { useMapDataStore } from "@/stores/mapData";
import { locationAPI } from "@/services";
import LocationPickerDialog from "@/components/LocationPickerDialog.vue";
import {
  mapReverseGeocodeResponse,
  resolveLocationId,
} from "@/utils/locationUtils";

definePage({
  meta: {
    layout: "dashboard",
  },
});

const housingStore = useHousingStore();
const mapDataStore = useMapDataStore();
const route = useRoute();
const router = useRouter();

const PHONE_MIN = 10;
const PHONE_MAX = 13;
const YEAR_MIN = 1900;
const YEAR_MAX = new Date().getFullYear();
const AGE_MIN = 1;
const AGE_MAX = 120;
const KK_MIN = 1;
const KK_MAX = 20;
const OCCUPANTS_MIN = 1;
const OCCUPANTS_MAX = 50;
const DEPTH_MIN = 1;
const DEPTH_MAX = 500;
const TOILET_MIN = 1;
const TOILET_MAX = 20;
const ELECTRICITY_MIN = 450;
const ELECTRICITY_MAX = 6600;
const AREA_MIN = 1;
const AREA_MAX = 10000;
const INCOME_MIN = 1;
const INCOME_MAX = 1000000000;
const PHONE_HINT = `${PHONE_MIN}-${PHONE_MAX} digit`;
const YEAR_HINT = `${YEAR_MIN}-${YEAR_MAX}`;
const AGE_HINT = `${AGE_MIN}-${AGE_MAX}`;
const KK_HINT = `${KK_MIN}-${KK_MAX}`;
const OCCUPANTS_HINT = `${OCCUPANTS_MIN}-${OCCUPANTS_MAX}`;
const DEPTH_HINT = `${DEPTH_MIN}-${DEPTH_MAX} m`;
const TOILET_HINT = `${TOILET_MIN}-${TOILET_MAX}`;
const ELECTRICITY_HINT = `${ELECTRICITY_MIN}-${ELECTRICITY_MAX} W`;
const AREA_HINT = `${AREA_MIN}-${AREA_MAX} m2`;
const INCOME_HINT = `${INCOME_MIN}-${INCOME_MAX}`;

const createRangeRule = (min, max, label) => (value) => {
  if (value === null || value === "") return true;
  const num = Number(value);
  if (Number.isNaN(num)) return "Nilai harus berupa angka";
  return (num >= min && num <= max) || `${label} harus ${min}-${max}`;
};

// Form validation rules
const rules = {
  required: (value) => !!value || "Field is required",
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value) || "Invalid email format";
  },
  phone: (value) => {
    const pattern = /^[0-9+\-\s()]+$/;
    return pattern.test(value) || "Invalid phone number format";
  },
  phoneLength: (value) => {
    if (!value) return true;
    const digits = String(value ?? "").replace(/\D/g, "");
    return (
      (digits.length >= PHONE_MIN && digits.length <= PHONE_MAX) ||
      `No. Telp harus ${PHONE_MIN}-${PHONE_MAX} digit`
    );
  },
  kkRange: createRangeRule(KK_MIN, KK_MAX, "Jumlah KK"),
  occupantsRange: createRangeRule(
    OCCUPANTS_MIN,
    OCCUPANTS_MAX,
    "Jumlah penghuni"
  ),
  depthRange: createRangeRule(DEPTH_MIN, DEPTH_MAX, "Kedalaman sumur"),
  toiletRange: createRangeRule(TOILET_MIN, TOILET_MAX, "Jumlah jamban"),
  electricityRange: createRangeRule(
    ELECTRICITY_MIN,
    ELECTRICITY_MAX,
    "Kapasitas listrik"
  ),
  areaBangunanRange: createRangeRule(AREA_MIN, AREA_MAX, "Luas bangunan"),
  areaTanahRange: createRangeRule(AREA_MIN, AREA_MAX, "Luas tanah"),
  incomeRange: createRangeRule(INCOME_MIN, INCOME_MAX, "Penghasilan"),
  rtRw: (value) => {
    if (!value) return true;
    return /^\d{1,3}$/.test(String(value)) || "RT/RW harus 1-3 digit angka";
  },
  kkNumber: (value) => {
    if (!value) return true;
    const digits = sanitizeDigits(value, 16);
    return digits.length === 16 || "No. KK harus terdiri dari 16 digit angka";
  },
  age: (value) => {
    const age = parseInt(value);
    return (
      (age >= AGE_MIN && age <= AGE_MAX) || `Usia harus ${AGE_MIN}-${AGE_MAX}`
    );
  },
  positive: (value) => {
    const num = parseFloat(value);
    return num > 0 || "Value must be positive";
  },
  year: (value) => {
    const year = parseInt(value);
    return (
      (year >= YEAR_MIN && year <= YEAR_MAX) ||
      `Tahun harus ${YEAR_MIN}-${YEAR_MAX}`
    );
  },
  postalCode: (value) => {
    if (!value) return "Kode pos wajib diisi";
    const code = String(value).trim();
    return /^\d{5}$/.test(code) || "Kode pos harus terdiri dari 5 digit angka";
  },
};

// Form steps
const steps = [
  { title: "Pengisi", subtitle: "Data Pengisi Formulir" },
  { title: "Pemilik", subtitle: "Data Pemilik Rumah" },
  { title: "Administrasi", subtitle: "Data Rumah" },
  { title: "Bangunan", subtitle: "Komposisi Bahan" },
  { title: "Kesehatan", subtitle: "Akses Air Bersih" },
  { title: "Sanitasi", subtitle: "Akses Sanitasi" },
  { title: "Persampahan", subtitle: "Akses Persampahan" },
  { title: "Jalan", subtitle: "Akses Jalan" },
  { title: "Energi", subtitle: "Akses Energi" },
  { title: "Submit", subtitle: "Review & Submit" },
];

// Form data structure
const formData = reactive({
  pengisi: {
    nama: "",
    email: "",
    jabatan: "",
    jabatanLainnya: "",
  },
  pemilik: {
    nama: "",
    noTelp: "",
    namaKepalaKeluarga: "",
    noTelpKepalaKeluarga: "",
    usia: "",
    noKK: "",
    jumlahKK: "",
    alamat: "",
    rt: "",
    rw: "",
    postalCode: "",
    province: null,
    regency: null,
    district: null,
    village: null,
    latitude: null,
    longitude: null,
    pendidikan: "",
    pekerjaan: "",
    penghasilan: "",
    statusKepemilikanTanah: "",
    statusKepemilikanRumah: "",
    bantuanPerumahanStatus: "",
    bantuanPerumahanTahun: "",
    kriteriaMiskin: "",
    kriteriaMiskinLainnya: "",
  },
  rumah: {
    luasBangunan: "",
    luasTanah: "",
    memilikiIMB: "",
    jenisRumah: "",
    jumlahPenghuni: "",
    photos: [],
  },
  bangunan: {
    lantai: "",
    dinding: "",
    atap: "",
    photos: [],
  },
  kesehatan: {
    sumberAirMCK: "",
    kedalamanSumurBor: "",
    lokasiSumberAir: "",
    sumberAirMinum: "",
    kedalamanSumurBorMinum: "",
    photos: [],
  },
  sanitasi: {
    kepemilikanJamban: "",
    jumlahJamban: "",
    jenisCloset: "",
    jenisTangkiSeptic: "",
    tahunPembuatanTangki: "",
    pernahPenyedotan: "",
    tahunPenyedotan: "",
    jasaSedotTinja: "",
    pengaliranAirLimbah: "",
    photos: [],
  },
  persampahan: {
    aksesPengangkutanSampah: "",
    pengelolaPengangkutanSampah: "",
    pengelolaLainnya: "",
    pengelolaanSampah: "",
    photos: [],
  },
  jalan: {
    jenisJalan: "",
    konstruksiJalan: "",
    konstruksiLainnya: "",
    photos: [],
  },
  energi: {
    sumberListrik: "",
    sumberListrikLainnya: "",
    kapasitasListrik: "",
    photos: [],
  },
  kemiskinan: {
    photos: [],
  },
});
const editSubmissionId = ref(null);
const editSubmissionStatus = ref("");
const editSubmissionNotes = ref("");
const isEditMode = computed(() => Boolean(editSubmissionId.value));

const provinceOptions = ref([]);
const regencyOptions = ref([]);
const districtOptions = ref([]);
const villageOptions = ref([]);

const locationObjectFields = ["province", "regency", "district", "village"];
const isProgrammaticLocationSync = ref(false);
const locationSyncMessage = ref("");
const locationSyncType = ref("info");
const locationSelectError = ref("");
const locationPickerOpen = ref(false);
const locationPickerLat = ref(null);
const locationPickerLng = ref(null);

const locationLoading = reactive({
  provinces: false,
  regencies: false,
  districts: false,
  villages: false,
  isSyncing: false,
});

const imageSections = [
  "rumah",
  "bangunan",
  "kesehatan",
  "sanitasi",
  "persampahan",
  "jalan",
  "energi",
  "kemiskinan",
];
const MAX_IMAGES_PER_SECTION = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE / (1024 * 1024);
const COMPRESSION_THRESHOLD = 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.8;
const uploadRefs = reactive({});
const imageErrors = reactive(
  imageSections.reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {})
);
const imageProcessing = reactive(
  imageSections.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {})
);
const photoToastOpen = ref(false);
const photoToastMessage = ref("");
const photoToastColor = ref("error");
const isDraftSyncPaused = ref(false);
let draftSaveTimer = null;

const buildDraftPayload = () => {
  const draft = JSON.parse(
    JSON.stringify(formData, (key, value) => {
      if (key === "photos") {
        return [];
      }
      return value;
    })
  );
  return draft;
};

const scheduleDraftSave = () => {
  if (isDraftSyncPaused.value) {
    return;
  }
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer);
  }
  draftSaveTimer = setTimeout(() => {
    housingStore.saveDraft(buildDraftPayload());
  }, 400);
};

const showPhotoToast = (message, color = "error") => {
  photoToastMessage.value = message;
  photoToastColor.value = color;
  photoToastOpen.value = true;
};

const sanitizeDigits = (value, maxLength = null) => {
  const cleaned = String(value ?? "").replace(/\D/g, "");
  if (maxLength) {
    return cleaned.slice(0, maxLength);
  }
  return cleaned;
};

const formatNikNumber = (value) => {
  const digits = sanitizeDigits(value, 16);
  if (!digits) return "";
  return digits.replace(/(\d{4})(?=\d)/g, "$1-");
};

const formatPhoneNumber = (value) => {
  let digits = sanitizeDigits(value);
  if (!digits) return "";
  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    digits = `62${digits}`;
  }
  if (!digits.startsWith("62")) {
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join("-");
  }
  const rest = digits.slice(2);
  const groups = rest.match(/.{1,4}/g) || [];
  return `+62 ${groups.join("-")}`;
};

const sanitizeDecimal = (value) => {
  const normalized = String(value ?? "").replace(",", ".");
  const cleaned = normalized.replace(/[^0-9.]/g, "");
  const [whole, ...fractionParts] = cleaned.split(".");
  const fraction = fractionParts.join("");
  if (!whole && !fraction) return "";
  return fraction ? `${whole}.${fraction}` : whole;
};

const fetchProvinces = async () => {
  locationLoading.provinces = true;
  locationSelectError.value = "";
  try {
    const response = await locationAPI.getProvinces();
    if (response?.success && Array.isArray(response.data?.provinces)) {
      const provinces = response.data.provinces
        .map((province) => {
          const id = resolveLocationId(province);
          if (!id) return null;
          return {
            id,
            name:
              province.name ||
              province.nama ||
              province.label ||
              province.text ||
              "",
            code: province.code,
          };
        })
        .filter(Boolean);
      provinceOptions.value = provinces;
      if (!provinces.length) {
        locationSelectError.value = "Data provinsi belum tersedia.";
      }
    } else {
      provinceOptions.value = [];
      locationSelectError.value =
        response?.message || "Gagal memuat data provinsi.";
    }
  } catch (error) {
    console.error("Error fetching provinces:", error);
    provinceOptions.value = [];
    locationSelectError.value = error?.message || "Gagal memuat data provinsi.";
  } finally {
    locationLoading.provinces = false;
  }
};

const fetchRegencies = async (provinceId) => {
  if (!provinceId) {
    locationSelectError.value = "";
    return;
  }
  locationLoading.regencies = true;
  locationSelectError.value = "";
  try {
    const response = await locationAPI.getRegencies(provinceId);
    if (response?.success && Array.isArray(response.data?.regencies)) {
      const regencies = response.data.regencies
        .map((regency) => {
          const id = resolveLocationId(regency);
          if (!id) return null;
          return {
            id,
            name:
              regency.name ||
              regency.nama ||
              regency.label ||
              regency.text ||
              "",
            code: regency.code,
            type: regency.type,
          };
        })
        .filter(Boolean);
      regencyOptions.value = regencies;
      if (!regencies.length) {
        locationSelectError.value =
          "Data kabupaten/kota belum tersedia untuk provinsi ini.";
      }
    } else {
      regencyOptions.value = [];
      locationSelectError.value =
        response?.message || "Gagal memuat data kabupaten/kota.";
    }
  } catch (error) {
    console.error("Error fetching regencies:", error);
    regencyOptions.value = [];
    locationSelectError.value =
      error?.message || "Gagal memuat data kabupaten/kota.";
  } finally {
    locationLoading.regencies = false;
  }
};

const fetchDistricts = async (regencyId) => {
  if (!regencyId) {
    locationSelectError.value = "";
    return;
  }
  locationLoading.districts = true;
  locationSelectError.value = "";
  try {
    const response = await locationAPI.getDistricts(regencyId);
    if (response?.success && Array.isArray(response.data?.districts)) {
      const districts = response.data.districts
        .map((district) => {
          const id = resolveLocationId(district);
          if (!id) return null;
          return {
            id,
            name:
              district.name ||
              district.nama ||
              district.label ||
              district.text ||
              "",
            code: district.code,
          };
        })
        .filter(Boolean);
      districtOptions.value = districts;
      if (!districts.length) {
        locationSelectError.value =
          "Data kecamatan belum tersedia untuk kabupaten/kota ini.";
      }
    } else {
      districtOptions.value = [];
      locationSelectError.value =
        response?.message || "Gagal memuat data kecamatan.";
    }
  } catch (error) {
    console.error("Error fetching districts:", error);
    districtOptions.value = [];
    locationSelectError.value =
      error?.message || "Gagal memuat data kecamatan.";
  } finally {
    locationLoading.districts = false;
  }
};

const fetchVillages = async (districtId) => {
  if (!districtId) {
    locationSelectError.value = "";
    return;
  }
  locationLoading.villages = true;
  locationSelectError.value = "";
  try {
    const response = await locationAPI.getVillages(districtId);
    if (response?.success && Array.isArray(response.data?.villages)) {
      const villages = response.data.villages
        .map((village) => {
          const id = resolveLocationId(village);
          if (!id) return null;
          return {
            id,
            name:
              village.name ||
              village.nama ||
              village.label ||
              village.text ||
              "",
            code: village.code,
          };
        })
        .filter(Boolean);
      villageOptions.value = villages;
      if (!villages.length) {
        locationSelectError.value =
          "Data kelurahan belum tersedia untuk kecamatan ini.";
      }
    } else {
      villageOptions.value = [];
      locationSelectError.value =
        response?.message || "Gagal memuat data kelurahan.";
    }
  } catch (error) {
    console.error("Error fetching villages:", error);
    villageOptions.value = [];
    locationSelectError.value =
      error?.message || "Gagal memuat data kelurahan.";
  } finally {
    locationLoading.villages = false;
  }
};

watch(
  () => formData.pemilik.province,
  async (province) => {
    if (isProgrammaticLocationSync.value) return;
    locationSelectError.value = "";
    formData.pemilik.regency = null;
    formData.pemilik.district = null;
    formData.pemilik.village = null;
    regencyOptions.value = [];
    districtOptions.value = [];
    villageOptions.value = [];
    const provinceId = resolveLocationId(province);
    if (provinceId) {
      await fetchRegencies(provinceId);
    }
  }
);

watch(
  () => formData.pemilik.regency,
  async (regency) => {
    if (isProgrammaticLocationSync.value) return;
    locationSelectError.value = "";
    formData.pemilik.district = null;
    formData.pemilik.village = null;
    districtOptions.value = [];
    villageOptions.value = [];
    const regencyId = resolveLocationId(regency);
    if (regencyId) {
      await fetchDistricts(regencyId);
    }
  }
);

watch(
  () => formData.pemilik.district,
  async (district) => {
    if (isProgrammaticLocationSync.value) return;
    locationSelectError.value = "";
    formData.pemilik.village = null;
    villageOptions.value = [];
    const districtId = resolveLocationId(district);
    if (districtId) {
      await fetchVillages(districtId);
    }
  }
);

watch(
  () => formData.pemilik.bantuanPerumahanStatus,
  (value) => {
    if (value !== "Ya") {
      formData.pemilik.bantuanPerumahanTahun = "";
    }
  }
);

watch(
  () => formData.pemilik.kriteriaMiskin,
  (value) => {
    if (!value) {
      if (formData.kemiskinan.photos.length) {
        releaseSectionPhotos("kemiskinan");
        formData.kemiskinan.photos = [];
      }
      formData.pemilik.kriteriaMiskinLainnya = "";
    } else if (value !== "Lainnya") {
      formData.pemilik.kriteriaMiskinLainnya = "";
    }
  }
);

watch(
  formData,
  () => {
    scheduleDraftSave();
  },
  { deep: true }
);

onMounted(async () => {
  await fetchProvinces();
  const draft = housingStore.loadDraft();
  if (draft) {
    isDraftSyncPaused.value = true;
    try {
      await applyDraftData(draft);
    } finally {
      isDraftSyncPaused.value = false;
    }
  }
});

onBeforeUnmount(() => {
  imageSections.forEach((section) => {
    releaseSectionPhotos(section);
  });
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = null;
  }
});

const ownerLocationSummary = computed(() => {
  const parts = [
    formData.pemilik.village?.name,
    formData.pemilik.district?.name,
    formData.pemilik.regency?.name,
    formData.pemilik.province?.name,
  ].filter(Boolean);
  return parts.join(", ");
});

const ownerAddressSummary = computed(() => {
  return formData.pemilik.alamat?.trim() || "";
});

const ensureOption = (listRef, option) => {
  const optionId = resolveLocationId(option);
  if (!optionId) return null;
  const existing = listRef.value.find((item) => item.id === optionId);
  if (existing) {
    return existing;
  }
  const normalized = {
    id: optionId,
    name:
      option.name ||
      option.label ||
      option.title ||
      option.text ||
      option.nama ||
      "Tanpa Nama",
  };
  listRef.value = [...listRef.value, normalized];
  return normalized;
};

const setLocationHierarchy = async ({
  province,
  regency,
  district,
  village,
}) => {
  if (!province && !regency && !district && !village) {
    return;
  }

  isProgrammaticLocationSync.value = true;
  try {
    const provinceId = resolveLocationId(province);
    if (provinceId) {
      const normalizedProvince = ensureOption(provinceOptions, province);
      formData.pemilik.province = normalizedProvince;
      await fetchRegencies(provinceId);
    }

    const regencyId = resolveLocationId(regency);
    if (regencyId) {
      const parentProvinceId =
        regency.parentId || provinceId || formData.pemilik.province?.id;
      if (parentProvinceId && !regencyOptions.value.length) {
        await fetchRegencies(parentProvinceId);
      }
      const normalizedRegency = ensureOption(regencyOptions, regency);
      formData.pemilik.regency = normalizedRegency;
      await fetchDistricts(regencyId);
    }

    const districtId = resolveLocationId(district);
    if (districtId) {
      const parentRegencyId =
        district.parentId || regencyId || formData.pemilik.regency?.id;
      if (parentRegencyId && !districtOptions.value.length) {
        await fetchDistricts(parentRegencyId);
      }
      const normalizedDistrict = ensureOption(districtOptions, district);
      formData.pemilik.district = normalizedDistrict;
      await fetchVillages(districtId);
    }

    const villageId = resolveLocationId(village);
    if (villageId) {
      const parentDistrictId =
        village.parentId || districtId || formData.pemilik.district?.id;
      if (parentDistrictId && !villageOptions.value.length) {
        await fetchVillages(parentDistrictId);
      }
      const normalizedVillage = ensureOption(villageOptions, village);
      formData.pemilik.village = normalizedVillage;
    }
  } finally {
    isProgrammaticLocationSync.value = false;
  }
};

const openLocationPicker = async () => {
  locationSyncMessage.value = "";
  locationSyncType.value = "info";

  const manualLat = parseFloat(formData.pemilik.latitude);
  const manualLng = parseFloat(formData.pemilik.longitude);
  if (Number.isFinite(manualLat) && Number.isFinite(manualLng)) {
    locationPickerLat.value = manualLat;
    locationPickerLng.value = manualLng;
    locationPickerOpen.value = true;
    return;
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    locationSyncType.value = "error";
    locationSyncMessage.value = "Browser Anda tidak mendukung fitur geolokasi.";
    locationPickerLat.value = null;
    locationPickerLng.value = null;
    locationPickerOpen.value = true;
    return;
  }

  locationLoading.isSyncing = true;
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      locationPickerLat.value = coords.latitude;
      locationPickerLng.value = coords.longitude;
      locationPickerOpen.value = true;
      locationLoading.isSyncing = false;
    },
    (error) => {
      locationLoading.isSyncing = false;
      locationSyncType.value = "error";
      let errorMessage = "Izin lokasi ditolak atau tidak tersedia.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage =
            "Izin lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser Anda.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage =
            "Informasi lokasi tidak tersedia. Silakan geser pin secara manual.";
          break;
        case error.TIMEOUT:
          errorMessage = "Waktu permintaan lokasi habis. Silakan coba lagi.";
          break;
        default:
          errorMessage = "Terjadi kesalahan saat mengambil lokasi.";
          break;
      }
      locationSyncMessage.value = errorMessage;
      locationPickerLat.value = null;
      locationPickerLng.value = null;
      locationPickerOpen.value = true;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

const handleLocationPicked = async ({ latitude, longitude }) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    locationSyncType.value = "error";
    locationSyncMessage.value =
      "Koordinat tidak valid. Silakan pilih ulang di peta.";
    return;
  }

  formData.pemilik.latitude = latitude;
  formData.pemilik.longitude = longitude;

  locationLoading.isSyncing = true;
  try {
    const result = await reverseGeocode(latitude, longitude);
    await applyLocationResult(result);
    locationSyncType.value = "success";
    locationSyncMessage.value =
      "Lokasi berhasil disinkronkan berdasarkan titik peta.";
    if (formRef.value) {
      await formRef.value.validate();
    }
  } catch (error) {
    console.error("Location sync error:", error);
    locationSyncType.value = "error";
    locationSyncMessage.value =
      error?.message || "Gagal menyinkronkan lokasi berdasarkan titik peta.";
  } finally {
    locationLoading.isSyncing = false;
  }
};

const mergeSectionData = (target, source) => {
  if (!source) return;
  Object.keys(target).forEach((key) => {
    if (!(key in source)) return;
    const value = source[key];
    if (value === undefined) return;
    if (Array.isArray(target[key])) {
      target[key] = Array.isArray(value) ? [...value] : target[key];
      return;
    }
    if (target[key] && typeof target[key] === "object") {
      mergeSectionData(target[key], value);
      return;
    }
    target[key] = value;
  });
};

const normalizeLegacyDraft = (draftPemilik) => {
  if (!draftPemilik) return;
  if (
    !draftPemilik.bantuanPerumahanStatus &&
    typeof draftPemilik.bantuanPerumahan === "string"
  ) {
    const legacy = draftPemilik.bantuanPerumahan.trim();
    if (legacy) {
      draftPemilik.bantuanPerumahanStatus = /ya/i.test(legacy) ? "Ya" : "Tidak";
      const yearMatch = legacy.match(/\d{4}/);
      draftPemilik.bantuanPerumahanTahun = yearMatch ? yearMatch[0] : "";
    }
  }
  if (
    !draftPemilik.kriteriaMiskin &&
    typeof draftPemilik.teregistrasiMiskin === "string"
  ) {
    const legacy = draftPemilik.teregistrasiMiskin.trim();
    if (/dtks/i.test(legacy)) {
      draftPemilik.kriteriaMiskin = "DTKS";
    } else if (/sktm/i.test(legacy)) {
      draftPemilik.kriteriaMiskin = "SKTM Desa";
    } else if (legacy) {
      draftPemilik.kriteriaMiskin = "Lainnya";
      draftPemilik.kriteriaMiskinLainnya = legacy;
    }
  }
};

const applyDraftData = async (draft) => {
  if (!draft || typeof draft !== "object") return;
  const draftPemilik = { ...(draft.pemilik || {}) };
  normalizeLegacyDraft(draftPemilik);

  const locationDraft = {
    province: draftPemilik.province,
    regency: draftPemilik.regency,
    district: draftPemilik.district,
    village: draftPemilik.village,
  };
  locationObjectFields.forEach((field) => {
    delete draftPemilik[field];
  });

  Object.keys(formData).forEach((section) => {
    if (section === "pemilik") return;
    mergeSectionData(formData[section], draft[section]);
  });

  mergeSectionData(formData.pemilik, draftPemilik);
  await setLocationHierarchy(locationDraft);
};

const toText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toYesNo = (value) => (value ? "Ya" : "Tidak");

const toLocationOption = (location) => {
  if (!location) return null;
  return {
    id: location.id,
    name: location.name || location.nama || "Tanpa Nama",
  };
};

const resolveKriteriaMiskin = (owner) => {
  if (!owner?.isRegisteredAsPoor) {
    return { kriteriaMiskin: "", kriteriaMiskinLainnya: "" };
  }
  const attachment = owner.poorRegistrationAttachment || "";
  if (attachment === "DTKS" || attachment === "SKTM Desa") {
    return { kriteriaMiskin: attachment, kriteriaMiskinLainnya: "" };
  }
  if (attachment && attachment !== "Lainnya") {
    return { kriteriaMiskin: "Lainnya", kriteriaMiskinLainnya: attachment };
  }
  return { kriteriaMiskin: "Lainnya", kriteriaMiskinLainnya: "" };
};

const buildDraftFromSubmission = (submission) => {
  const respondent = submission?.formRespondent || {};
  const owner = submission?.householdOwner || {};
  const house = submission?.houseData || {};
  const water = submission?.waterAccess || {};
  const sanitation = submission?.sanitationAccess || {};
  const waste = submission?.wasteManagement || {};
  const road = submission?.roadAccess || {};
  const energy = submission?.energyAccess || {};

  const kriteriaMiskin = resolveKriteriaMiskin(owner);

  return {
    pengisi: {
      nama: respondent.name || owner.ownerName || "",
      email: respondent.email || "",
      jabatan: mapRelationshipFromApi(respondent.position),
      jabatanLainnya: respondent.positionOther || "",
    },
    pemilik: {
      nama: owner.ownerName || "",
      noTelp: owner.ownerPhone || "",
      namaKepalaKeluarga: owner.headOfFamilyName || "",
      noTelpKepalaKeluarga: owner.headOfFamilyPhone || "",
      usia: toText(owner.headOfFamilyAge ?? owner.age),
      noKK: owner.familyCardNumber || "",
      jumlahKK: toText(owner.totalFamilyMembers),
      alamat: owner.houseNumber || "",
      rt: owner.rt || "",
      rw: owner.rw || "",
      postalCode: owner.postalCode || "",
      province: toLocationOption(owner.province),
      regency: toLocationOption(owner.regency),
      district: toLocationOption(owner.district),
      village: toLocationOption(owner.village),
      latitude: owner.latitude ?? null,
      longitude: owner.longitude ?? null,
      pendidikan: mapEducationLevelFromApi(owner.educationLevel),
      pekerjaan: owner.occupation || "",
      penghasilan: toText(owner.monthlyIncome),
      statusKepemilikanTanah: mapLandOwnershipFromApi(
        owner.landOwnershipStatus
      ),
      statusKepemilikanRumah: mapHouseOwnershipFromApi(
        owner.houseOwnershipStatus
      ),
      bantuanPerumahanStatus: toYesNo(owner.hasReceivedHousingAssistance),
      bantuanPerumahanTahun: toText(owner.housingAssistanceYear),
      ...kriteriaMiskin,
    },
    rumah: {
      luasBangunan: toText(house.buildingArea),
      luasTanah: toText(house.landArea),
      memilikiIMB: toYesNo(house.hasBuildingPermit),
      jenisRumah: mapHouseTypeFromApi(house.houseType),
      jumlahPenghuni: toText(house.totalOccupants),
      photos: [],
    },
    bangunan: {
      lantai: mapFloorMaterialFromApi(house.floorMaterial),
      dinding: mapWallMaterialFromApi(house.wallMaterial),
      atap: mapRoofMaterialFromApi(house.roofMaterial),
      photos: [],
    },
    kesehatan: {
      sumberAirMCK: mapWaterSourceFromApi(water.sanitationWaterSource),
      kedalamanSumurBor: toText(water.sanitationWaterDepth),
      lokasiSumberAir: mapWaterLocationFromApi(water.sanitationWaterLocation),
      sumberAirMinum: mapWaterSourceFromApi(water.drinkingWaterSource),
      kedalamanSumurBorMinum: toText(water.drinkingWaterDepth),
      photos: [],
    },
    sanitasi: {
      kepemilikanJamban: mapToiletOwnershipFromApi(sanitation.toiletOwnership),
      jumlahJamban: toText(sanitation.toiletCount),
      jenisCloset: mapToiletTypeFromApi(sanitation.toiletType),
      jenisTangkiSeptic: mapSepticTankTypeFromApi(sanitation.septicTankType),
      tahunPembuatanTangki: toText(sanitation.septicTankYear),
      pernahPenyedotan: toYesNo(sanitation.hasSepticPumping),
      tahunPenyedotan: toText(sanitation.septicPumpingYear),
      jasaSedotTinja: mapSepticPumpingServiceFromApi(
        sanitation.septicPumpingService
      ),
      pengaliranAirLimbah: mapWastewaterDisposalFromApi(
        sanitation.wastewaterDisposal
      ),
      photos: [],
    },
    persampahan: {
      aksesPengangkutanSampah: mapWasteCollectionFromApi(
        waste.hasWasteCollection
      ),
      pengelolaPengangkutanSampah: mapWasteCollectionManagerFromApi(
        waste.wasteCollectionManager
      ),
      pengelolaLainnya: waste.wasteCollectionManagerOther || "",
      pengelolaanSampah: mapWasteDisposalMethodFromApi(
        waste.wasteDisposalMethod
      ),
      photos: [],
    },
    jalan: {
      jenisJalan: mapRoadTypeFromApi(road.roadType),
      konstruksiJalan: mapRoadConstructionFromApi(road.roadConstruction),
      konstruksiLainnya: road.roadConstructionOther || "",
      photos: [],
    },
    energi: {
      sumberListrik: mapElectricitySourceFromApi(energy.electricitySource),
      sumberListrikLainnya: energy.electricitySourceOther || "",
      kapasitasListrik: toText(energy.plnCapacity),
      photos: [],
    },
    kemiskinan: {
      photos: [],
    },
  };
};

const loadSubmissionForEdit = async (submissionId) => {
  if (!submissionId) return;
  try {
    const response = await housingStore.getSubmission(submissionId);
    if (!response?.success || !response.submission) {
      throw new Error(response?.error || "Gagal memuat data pengajuan.");
    }

    const submission = response.submission;
    editSubmissionId.value = submission.id;
    editSubmissionStatus.value = submission.status || "";
    editSubmissionNotes.value =
      submission.reviewNotes || submission.verificationNotes || "";

    if (submission.status === "approved") {
      showPhotoToast(
        "Data yang sudah disetujui tidak dapat diperbarui.",
        "warning"
      );
      editSubmissionId.value = null;
      router.push("/home");
      return;
    }

    isDraftSyncPaused.value = true;
    const draft = buildDraftFromSubmission(submission);
    await applyDraftData(draft);
    isDraftSyncPaused.value = false;
  } catch (error) {
    console.error("Failed to load submission for edit:", error);
    showPhotoToast(error.message || "Gagal memuat data pengajuan.", "error");
    editSubmissionId.value = null;
  }
};

const applyLocationResult = async (result) => {
  if (!result) {
    throw new Error("Data lokasi tidak tersedia.");
  }

  await setLocationHierarchy({
    province: result.province,
    regency: result.regency,
    district: result.district,
    village: result.village,
  });

  formData.pemilik.alamat = result.address || formData.pemilik.alamat;
  formData.pemilik.postalCode =
    result.postalCode || formData.pemilik.postalCode;
  formData.pemilik.rt = result.rt || formData.pemilik.rt;
  formData.pemilik.rw = result.rw || formData.pemilik.rw;
};

async function reverseGeocode(lat, lng) {
  try {
    const response = await locationAPI.reverseGeocode(lat, lng);

    if (response.success && response.data) {
      const mapped = mapReverseGeocodeResponse(response.data);
      if (!mapped?.province?.id) {
        // Set alert for incomplete data
        locationSyncType.value = "error";
        locationSyncMessage.value =
          "Data lokasi dari layanan geocode tidak lengkap. Silakan pilih lokasi secara manual.";
        throw new Error("Data lokasi dari layanan geocode tidak lengkap.");
      }
      return mapped;
    } else {
      if (response?.code === "OUTSIDE_BOUNDARY") {
        locationSyncType.value = "error";
        locationSyncMessage.value = "Lokasi di luar wilayah kerja.";
        throw new Error("Lokasi di luar wilayah kerja.");
      }
      // Set alert for API failure
      locationSyncType.value = "error";
      locationSyncMessage.value =
        response.message ||
        "Lokasi tidak ditemukan. Silakan pilih lokasi secara manual.";
      throw new Error(response.message || "Reverse geocode gagal.");
    }
  } catch (error) {
    console.error("Reverse geocode error:", error);
    if (error?.code === "OUTSIDE_BOUNDARY") {
      locationSyncType.value = "error";
      locationSyncMessage.value = "Lokasi di luar wilayah kerja.";
    }
    // Set alert for error (only if not already set above)
    if (!locationSyncMessage.value) {
      locationSyncType.value = "error";
      locationSyncMessage.value =
        error?.message ||
        "Lokasi tidak ditemukan. Silakan pilih lokasi secara manual.";
    }
    throw error;
  }
}

function registerUploadRef(section, source, el) {
  if (!uploadRefs[section]) {
    uploadRefs[section] = {};
  }

  if (el) {
    uploadRefs[section][source] = el;
  } else if (uploadRefs[section]?.[source]) {
    delete uploadRefs[section][source];
  }
}

function openImagePicker(section, source = "gallery") {
  const sectionRefs = uploadRefs[section] || {};
  const input = sectionRefs[source];
  if (!input) {
    if (source === "camera") {
      showPhotoToast("Kamera tidak tersedia di perangkat ini.");
    }
    return;
  }
  input.value = "";
  input.click();
}

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = reader.result;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

// Compress large images before upload to reduce payload size.
const compressImageFile = async (file) => {
  if (!file?.type?.startsWith("image/")) {
    return file;
  }

  if (file.size <= COMPRESSION_THRESHOLD) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / image.width,
    MAX_IMAGE_DIMENSION / image.height
  );

  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", IMAGE_QUALITY);
  });

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const compressedName = `${baseName}.jpg`;

  return new File([blob], compressedName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
};

async function onImageSelected(section, source, event) {
  const input = event?.target;
  const sectionData = formData[section];
  if (!sectionData?.photos) return;

  imageErrors[section] = "";
  imageProcessing[section] = true;

  const files = Array.from(input?.files ?? []);
  if (!files.length) {
    if (source === "camera") {
      const message = "Izin kamera ditolak atau pengambilan foto dibatalkan.";
      imageErrors[section] = message;
      showPhotoToast(message);
    }
    imageProcessing[section] = false;
    return;
  }

  const photos = sectionData.photos;
  const availableSlots = MAX_IMAGES_PER_SECTION - photos.length;

  if (availableSlots <= 0) {
    imageErrors[
      section
    ] = `Maksimal ${MAX_IMAGES_PER_SECTION} foto untuk bagian ini.`;
    if (input) input.value = "";
    imageProcessing[section] = false;
    return;
  }

  let addedCount = 0;
  const errors = [];

  for (const file of files) {
    if (addedCount >= availableSlots) {
      errors.push(`Maksimal ${MAX_IMAGES_PER_SECTION} foto untuk bagian ini.`);
      break;
    }

    if (!file.type || !file.type.startsWith("image/")) {
      const message = "File yang dipilih harus berupa gambar.";
      errors.push(message);
      showPhotoToast(message);
      continue;
    }

    let processedFile = file;
    try {
      processedFile = await compressImageFile(file);
    } catch (error) {
      console.error("Gagal kompres foto:", error);
      processedFile = file;
    }

    if (processedFile.size > MAX_IMAGE_SIZE) {
      errors.push(`Ukuran ${file.name} melebihi ${MAX_IMAGE_SIZE_MB}MB.`);
      continue;
    }

    const url = URL.createObjectURL(processedFile);
    photos.push({
      file: processedFile,
      url,
      name: processedFile.name,
      size: processedFile.size,
      uploadedAt: Date.now(),
    });
    addedCount++;
  }

  if (errors.length) {
    imageErrors[section] = errors[0];
    showPhotoToast(errors[0]);
  }

  if (input) {
    input.value = "";
  }
  imageProcessing[section] = false;
}

function removeImage(section, index) {
  const sectionData = formData[section];
  if (!sectionData?.photos?.length) return;
  const [removed] = sectionData.photos.splice(index, 1);
  if (removed?.url) {
    URL.revokeObjectURL(removed.url);
  }
  imageErrors[section] = "";
}

function releaseSectionPhotos(section) {
  const sectionData = formData[section];
  if (!sectionData?.photos?.length) return;
  sectionData.photos.forEach((photo) => {
    if (photo?.url) {
      URL.revokeObjectURL(photo.url);
    }
  });
}

const appendPhotoFiles = (formPayload, fieldName, photos) => {
  if (!formPayload || !Array.isArray(photos)) return;
  photos.forEach((photo) => {
    if (photo?.file instanceof File) {
      formPayload.append(fieldName, photo.file, photo.file.name);
    }
  });
};

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) {
    return "-";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Form options
const jabatanOptions = ["Perangkat Desa/Kelurahan", "Pemilik Rumah", "Lainnya"];

const pendidikanOptions = [
  "Tidak Sekolah",
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/Sederajat",
  "Diploma",
  "Sarjana",
  "Pascasarjana",
];

// Reactive state
const currentStep = ref(1);
const formValid = ref(false);
const isSubmitting = ref(false);
const formRef = ref(null);
const validationRequiredSteps = [1, 2];
const requiresValidation = computed(() =>
  validationRequiredSteps.includes(currentStep.value)
);
const stepPhotoSections = {
  2: "kemiskinan",
  3: "rumah",
  4: "bangunan",
  5: "kesehatan",
  6: "sanitasi",
  7: "persampahan",
  8: "jalan",
  9: "energi",
};
const photoSectionLabels = {
  kemiskinan: "Berkas Kriteria Miskin",
  rumah: "Dokumentasi Rumah",
  bangunan: "Dokumentasi Bangunan",
  kesehatan: "Dokumentasi Kesehatan",
  sanitasi: "Dokumentasi Sanitasi",
  persampahan: "Dokumentasi Persampahan",
  jalan: "Dokumentasi Jalan",
  energi: "Dokumentasi Energi",
};

const shouldRequirePhotos = (section) => {
  if (section === "kemiskinan") {
    return Boolean(formData.pemilik.kriteriaMiskin);
  }
  return true;
};

// Methods
const nextStep = async () => {
  if (!formRef.value) return;

  if (requiresValidation.value) {
    const { valid } = await formRef.value.validate();
    if (!valid) {
      return;
    }
  }

  const photoSection = stepPhotoSections[currentStep.value];
  if (photoSection && shouldRequirePhotos(photoSection)) {
    const photos = formData[photoSection]?.photos || [];
    if (!photos.length) {
      const label = photoSectionLabels[photoSection] || "bagian ini";
      showPhotoToast(`Upload minimal 1 foto untuk ${label}.`);
      return;
    }
  }

  if (currentStep.value < steps.length) {
    currentStep.value++;
    if (validationRequiredSteps.includes(currentStep.value)) {
      formValid.value = false;
    }
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const submitForm = async () => {
  isSubmitting.value = true;

  if (formData.pemilik.latitude && formData.pemilik.longitude) {
    try {
      const lat = parseFloat(formData.pemilik.latitude);
      const lng = parseFloat(formData.pemilik.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const result = await reverseGeocode(lat, lng);
        await applyLocationResult(result);
      }
    } catch (error) {
      isSubmitting.value = false;
      return;
    }
  }

  try {
    // Transform form data to match database schema structure
    const apiFormData = {
      // Form Respondent Data (from pengisi section)
      respondent: {
        name: formData.pengisi.nama,
        email: formData.pengisi.email,
        position: mapRelationshipToOwner(formData.pengisi.jabatan),
        positionOther:
          formData.pengisi.jabatan === "Lainnya"
            ? formData.pengisi.jabatanLainnya
            : null,
        phone: formData.pemilik.noTelp, // Using owner phone as respondent phone
      },

      // Household Owner Data
      householdOwnerData: {
        ownerName: formData.pemilik.nama,
        ownerPhone: formData.pemilik.noTelp,
        headOfFamilyName: formData.pemilik.namaKepalaKeluarga,
        headOfFamilyPhone: formData.pemilik.noTelpKepalaKeluarga,
        headOfFamilyAge: parseInt(formData.pemilik.usia),
        familyCardNumber: formData.pemilik.noKK,
        totalFamilyMembers: parseInt(formData.pemilik.jumlahKK),

        // Address Information
        houseNumber: formData.pemilik.alamat,
        rt: formData.pemilik.rt,
        rw: formData.pemilik.rw,
        postalCode: formData.pemilik.postalCode,
        provinceId: formData.pemilik.province?.id || null,
        regencyId: formData.pemilik.regency?.id || null,
        districtId: formData.pemilik.district?.id || null,
        villageId: formData.pemilik.village?.id || null,

        // Coordinates
        latitude: formData.pemilik.latitude || null,
        longitude: formData.pemilik.longitude || null,

        // Socio-economic Information
        educationLevel: mapEducationLevel(formData.pemilik.pendidikan),
        educationLevelOther:
          formData.pemilik.pendidikan === "Lainnya"
            ? formData.pemilik.pendidikan
            : null,
        occupation: formData.pemilik.pekerjaan,
        monthlyIncome: parseFloat(formData.pemilik.penghasilan),

        // Ownership Status
        landOwnershipStatus: mapLandOwnership(
          formData.pemilik.statusKepemilikanTanah
        ),
        houseOwnershipStatus: mapHouseOwnership(
          formData.pemilik.statusKepemilikanRumah
        ),

        // Assistance History
        hasReceivedHousingAssistance:
          formData.pemilik.bantuanPerumahanStatus === "Ya",
        housingAssistanceYear:
          formData.pemilik.bantuanPerumahanStatus === "Ya"
            ? parseInt(formData.pemilik.bantuanPerumahanTahun) || null
            : null,
        isRegisteredAsPoor: Boolean(formData.pemilik.kriteriaMiskin),
        poorRegistrationAttachment:
          formData.pemilik.kriteriaMiskin === "Lainnya"
            ? formData.pemilik.kriteriaMiskinLainnya || "Lainnya"
            : formData.pemilik.kriteriaMiskin || null,
      },

      // House Data
      houseData: {
        buildingArea: parseFloat(formData.rumah.luasBangunan),
        landArea: parseFloat(formData.rumah.luasTanah),
        hasBuildingPermit: formData.rumah.memilikiIMB === "Ya",
        houseType: mapHouseType(formData.rumah.jenisRumah),
        totalOccupants: parseInt(formData.rumah.jumlahPenghuni),

        // Building Materials
        floorMaterial: mapFloorMaterial(formData.bangunan.lantai),
        wallMaterial: mapWallMaterial(formData.bangunan.dinding),
        wallMaterialOther:
          formData.bangunan.dinding === "Lainnya"
            ? formData.bangunan.dinding
            : null,
        roofMaterial: mapRoofMaterial(formData.bangunan.atap),
        roofMaterialOther:
          formData.bangunan.atap === "Lainnya" ? formData.bangunan.atap : null,
      },

      // Water Access
      waterAccess: {
        sanitationWaterSource: mapWaterSource(formData.kesehatan.sumberAirMCK),
        sanitationWaterSourceOther:
          formData.kesehatan.sumberAirMCK === "Sumber Air Lainnya"
            ? formData.kesehatan.sumberAirMCK
            : null,
        sanitationWaterDepth:
          formData.kesehatan.sumberAirMCK === "Sumur Bor"
            ? parseInt(formData.kesehatan.kedalamanSumurBor)
            : null,
        sanitationWaterLocation: mapWaterLocation(
          formData.kesehatan.lokasiSumberAir
        ),

        drinkingWaterSource: mapWaterSource(formData.kesehatan.sumberAirMinum),
        drinkingWaterSourceOther:
          formData.kesehatan.sumberAirMinum === "Sumber Air Lainnya"
            ? formData.kesehatan.sumberAirMinum
            : null,
        drinkingWaterDepth:
          formData.kesehatan.sumberAirMinum === "Sumur Bor"
            ? parseInt(formData.kesehatan.kedalamanSumurBorMinum)
            : null,
      },

      // Sanitation Access
      sanitationAccess: {
        toiletOwnership: mapToiletOwnership(
          formData.sanitasi.kepemilikanJamban
        ),
        toiletCount:
          formData.sanitasi.kepemilikanJamban !== "Tidak Memiliki Jamban"
            ? parseInt(formData.sanitasi.jumlahJamban)
            : 0,
        toiletType: mapToiletType(formData.sanitasi.jenisCloset),

        septicTankType: mapSepticTankType(formData.sanitasi.jenisTangkiSeptic),
        septicTankYear:
          formData.sanitasi.jenisTangkiSeptic !== "Tidak Memiliki Tanki"
            ? parseInt(formData.sanitasi.tahunPembuatanTangki)
            : null,
        hasSepticPumping: formData.sanitasi.pernahPenyedotan === "Ya",
        septicPumpingYear:
          formData.sanitasi.pernahPenyedotan === "Ya"
            ? parseInt(formData.sanitasi.tahunPenyedotan)
            : null,
        septicPumpingService: mapSepticPumpingService(
          formData.sanitasi.jasaSedotTinja
        ),

        wastewaterDisposal: mapWastewaterDisposal(
          formData.sanitasi.pengaliranAirLimbah
        ),
      },

      // Waste Management
      wasteManagement: {
        hasWasteCollection: mapWasteCollection(
          formData.persampahan.aksesPengangkutanSampah
        ),
        wasteCollectionManager: mapWasteCollectionManager(
          formData.persampahan.pengelolaPengangkutanSampah
        ),
        wasteCollectionManagerOther:
          formData.persampahan.pengelolaPengangkutanSampah === "Lainnya"
            ? formData.persampahan.pengelolaLainnya
            : null,

        wasteDisposalMethod: mapWasteDisposalMethod(
          formData.persampahan.pengelolaanSampah
        ),
        wasteDisposalLocation:
          formData.persampahan.pengelolaanSampah === "Dibuang di Tempat Lainnya"
            ? formData.persampahan.pengelolaanSampah
            : null,
      },

      // Road Access
      roadAccess: {
        roadType: mapRoadType(formData.jalan.jenisJalan),
        roadConstruction: mapRoadConstruction(formData.jalan.konstruksiJalan),
        roadConstructionOther:
          formData.jalan.konstruksiJalan === "Konstruksi Lainnya"
            ? formData.jalan.konstruksiLainnya
            : null,
      },

      // Energy Access
      energyAccess: {
        electricitySource: mapElectricitySource(formData.energi.sumberListrik),
        electricitySourceOther:
          formData.energi.sumberListrik === "Lainnya"
            ? formData.energi.sumberListrikLainnya
            : null,
        plnCapacity:
          formData.energi.sumberListrik === "PLN Sendiri" ||
          formData.energi.sumberListrik === "PLN Menumpang"
            ? formData.energi.kapasitasListrik
            : null,
      },
    };

    const formPayload = new FormData();
    formPayload.append("payload", JSON.stringify(apiFormData));
    appendPhotoFiles(formPayload, "houseDataPhotos", formData.rumah.photos);
    appendPhotoFiles(
      formPayload,
      "houseStructurePhotos",
      formData.bangunan.photos
    );
    appendPhotoFiles(
      formPayload,
      "waterAccessPhotos",
      formData.kesehatan.photos
    );
    appendPhotoFiles(
      formPayload,
      "sanitationAccessPhotos",
      formData.sanitasi.photos
    );
    appendPhotoFiles(
      formPayload,
      "wasteManagementPhotos",
      formData.persampahan.photos
    );
    appendPhotoFiles(formPayload, "roadAccessPhotos", formData.jalan.photos);
    appendPhotoFiles(formPayload, "energyAccessPhotos", formData.energi.photos);

    const result = await housingStore.submitForm(formPayload);

    if (result.success) {
      mapDataStore.signalRefresh();

      // Reset form
      housingStore.clearDraft();
      resetForm();

      // Show success message
      showPhotoToast("Form berhasil disubmit!", "success");
    } else {
      showPhotoToast(`Terjadi kesalahan: ${result.error}`, "error");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    showPhotoToast("Terjadi kesalahan saat submit form", "error");
  } finally {
    isSubmitting.value = false;
  }
};

// Helper functions to map form values to API contract enum values

// Respondent Position Mapping
const mapRelationshipToOwner = (value) => {
  const mapping = {
    "Perangkat Desa/Kelurahan": "perangkat_desa",
    "Pemilik Rumah": "pemilik_rumah",
    Lainnya: "lainnya",
  };
  return mapping[value] || "lainnya";
};

// Education Level Mapping
const mapEducationLevel = (value) => {
  const mapping = {
    "Tidak Sekolah": "tidak_sekolah",
    "SD/Sederajat": "sd",
    "SMP/Sederajat": "smp",
    "SMA/Sederajat": "sma",
    Diploma: "diploma",
    Sarjana: "sarjana",
    Pascasarjana: "magister",
  };
  return mapping[value] || "lainnya";
};

// Ownership Status Mapping
const mapLandOwnership = (value) => {
  return value === "Milik Sendiri" ? "milik_sendiri" : "bukan_milik_sendiri";
};

const mapHouseOwnership = (value) => {
  const mapping = {
    "Milik Sendiri": "milik_sendiri",
    Sewa: "sewa",
    Menumpang: "menumpang",
  };
  return mapping[value] || "menumpang";
};

// House Type Mapping
const mapHouseType = (value) => {
  const mapping = {
    "Rumah Tapak": "rumah_tapak",
    "Rumah Susun": "rumah_susun",
    "Rumah Petak": "rumah_petak",
    Kos: "kos",
  };
  return mapping[value] || "rumah_tapak";
};

// Building Materials Mapping
const mapFloorMaterial = (value) => {
  const mapping = {
    Tanah: "tanah",
    Keramik: "keramik",
    "Rabat Semen": "rabat_semen",
    Papan: "papan",
    Kayu: "kayu",
    Bata: "bata",
  };
  return mapping[value] || "tanah";
};

const mapWallMaterial = (value) => {
  const mapping = {
    "Tembok/Bata/Batako Tanpa Plester": "tembok_tanpa_plester",
    "Tembok Bata/Batako dengan Plester": "tembok_dengan_plester",
    Papan: "papan",
    "Anyaman Bambu": "anyaman_bambu",
    Lainnya: "lainnya",
  };
  return mapping[value] || "lainnya";
};

const mapRoofMaterial = (value) => {
  const mapping = {
    "Genteng (Beton/Keramik)": "genteng_beton",
    "Seng/Multiroof": "seng_multiroof",
    "Kayu/Sirap": "kayu_sirap",
    Asbes: "asbes",
    Lainnya: "lainnya",
  };
  return mapping[value] || "lainnya";
};

// Water Access Mapping
const mapWaterSource = (value) => {
  const mapping = {
    "Sumur Gali": "sumur_gali",
    "Sumur Bor": "sumur_bor",
    Ledeng: "ledeng",
    "Sumber Air Lainnya": "lainnya",
  };
  return mapping[value] || "lainnya";
};

const mapWaterLocation = (value) => {
  return value === "Di Dalam Tanah Sendiri"
    ? "di_tanah_sendiri"
    : "menumpang_tempat_lain";
};

// Sanitation Access Mapping
const mapToiletOwnership = (value) => {
  const mapping = {
    "Milik Sendiri": "milik_sendiri",
    "Jamban Bersama": "jamban_bersama",
    "Tidak Memiliki Jamban": "tidak_memiliki",
  };
  return mapping[value] || "tidak_memiliki";
};

const mapToiletType = (value) => {
  const mapping = {
    Cubluk: "cubluk",
    "Leher Angsa (Jongkok)": "leher_angsa_jongkok",
    "Leher Angsa (Duduk)": "leher_angsa_duduk",
  };
  return mapping[value] || "cubluk";
};

const mapSepticTankType = (value) => {
  const mapping = {
    Biotank: "biotank",
    "Tanki dengan Konstruksi Permanen": "tanki_permanen",
    "Lubang Tanah": "lubang_tanah",
    "Tidak Memiliki Tanki": "tidak_memiliki",
  };
  return mapping[value] || "tidak_memiliki";
};

const mapSepticPumpingService = (value) => {
  const mapping = {
    Pemda: "pemda",
    "Swasta (Perorangan/Badan Usaha)": "swasta_perorangan",
  };
  return mapping[value] || "pemda";
};

const mapWastewaterDisposal = (value) => {
  const mapping = {
    "Tergabung dalam Jaringan Pipa Pengolahan Air Limbah": "jaringan_pipa",
    "Tergabung dalam Tangki Septic": "tangki_septic",
    "Langsung Dialirkan ke Drainase/Saluran/Sungai": "drainase_sungai",
    "Ditampung dalam Lubang/Resapan ke Tanah": "resapan_tanah",
  };
  return mapping[value] || "resapan_tanah";
};

// Waste Management Mapping
const mapWasteCollection = (value) => {
  return value === "Ya";
};

const mapWasteCollectionManager = (value) => {
  const mapping = {
    Pemda: "pemda",
    Pemdes: "pemdes",
    "LSM/Kelompok Masyarakat": "lsm_kelompok_masyarakat",
    Lainnya: "swasta",
  };
  return mapping[value] || "swasta";
};

const mapWasteDisposalMethod = (value) => {
  const mapping = {
    Dibakar: "dibakar",
    "Diolah di Rumah (Kompos/Ditimbun)": "diolah_rumah",
    "Dibuang ke Tempat Sampah Umum": "tempat_sampah_umum",
    "Dibuang di Tempat Lainnya": "dibuang_lainnya",
  };
  return mapping[value] || "dibuang_lainnya";
};

// Road Access Mapping
const mapRoadType = (value) => {
  const mapping = {
    "Jalan Lebar < 3,5 m": "lebar_kurang_3_5m",
    "Jalan Lebar > 3,5 m": "lebar_lebih_3_5m",
    "Tidak Terdapat Jalan Akses/Melalui Perkarangan Orang Lain":
      "tidak_ada_akses",
  };
  return mapping[value] || "tidak_ada_akses";
};
const mapRoadConstruction = (value) => {
  const mapping = {
    "Jalan Beton": "beton",
    "Jalan Aspal": "aspal",
    "Jalan Konblok": "konblok",
    "Jalan Tanah/Sirtu": "tanah_sirtu",
    "Konstruksi Lainnya": "lainnya",
  };
  return mapping[value] || "lainnya";
};

// Energy Access Mapping
const mapElectricitySource = (value) => {
  const mapping = {
    "PLN Sendiri": "pln_sendiri",
    "PLN Menumpang": "pln_menumpang",
    "Tidak Ada": "tidak_ada",
    Lainnya: "lainnya",
  };
  return mapping[value] || "lainnya";
};

const mapFromApiValue = (value, mapping, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const entry = Object.entries(mapping).find(
    ([, apiValue]) => apiValue === value
  );
  return entry ? entry[0] : fallback;
};

const mapRelationshipFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Perangkat Desa/Kelurahan": "perangkat_desa",
      "Pemilik Rumah": "pemilik_rumah",
      Lainnya: "lainnya",
    },
    "Lainnya"
  );

const mapEducationLevelFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Tidak Sekolah": "tidak_sekolah",
      "SD/Sederajat": "sd",
      "SMP/Sederajat": "smp",
      "SMA/Sederajat": "sma",
      Diploma: "diploma",
      Sarjana: "sarjana",
      Pascasarjana: "magister",
    },
    "Lainnya"
  );

const mapLandOwnershipFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Milik Sendiri": "milik_sendiri",
      "Bukan Milik Sendiri": "bukan_milik_sendiri",
    },
    "Bukan Milik Sendiri"
  );

const mapHouseOwnershipFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Milik Sendiri": "milik_sendiri",
      Sewa: "sewa",
      Menumpang: "menumpang",
    },
    "Menumpang"
  );

const mapHouseTypeFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Rumah Tapak": "rumah_tapak",
      "Rumah Susun": "rumah_susun",
      "Rumah Petak": "rumah_petak",
      Kos: "kos",
    },
    "Rumah Tapak"
  );

const mapFloorMaterialFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      Tanah: "tanah",
      Keramik: "keramik",
      "Rabat Semen": "rabat_semen",
      Papan: "papan",
      Kayu: "kayu",
      Bata: "bata",
    },
    "Tanah"
  );

const mapWallMaterialFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Tembok/Bata/Batako Tanpa Plester": "tembok_tanpa_plester",
      "Tembok Bata/Batako dengan Plester": "tembok_dengan_plester",
      Papan: "papan",
      "Anyaman Bambu": "anyaman_bambu",
      Lainnya: "lainnya",
    },
    "Lainnya"
  );

const mapRoofMaterialFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Genteng (Beton/Keramik)": "genteng_beton",
      "Seng/Multiroof": "seng_multiroof",
      "Kayu/Sirap": "kayu_sirap",
      Asbes: "asbes",
      Lainnya: "lainnya",
    },
    "Lainnya"
  );

const mapWaterSourceFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Sumur Gali": "sumur_gali",
      "Sumur Bor": "sumur_bor",
      Ledeng: "ledeng",
      "Sumber Air Lainnya": "lainnya",
    },
    ""
  );

const mapWaterLocationFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Di Dalam Tanah Sendiri": "di_tanah_sendiri",
      "Menumpang/Mengambil dari Tempat Lain": "menumpang_tempat_lain",
    },
    ""
  );

const mapToiletOwnershipFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Milik Sendiri": "milik_sendiri",
      "Jamban Bersama": "jamban_bersama",
      "Tidak Memiliki Jamban": "tidak_memiliki",
    },
    ""
  );

const mapToiletTypeFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      Cubluk: "cubluk",
      "Leher Angsa (Jongkok)": "leher_angsa_jongkok",
      "Leher Angsa (Duduk)": "leher_angsa_duduk",
    },
    ""
  );

const mapSepticTankTypeFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      Biotank: "biotank",
      "Tanki dengan Konstruksi Permanen": "tanki_permanen",
      "Lubang Tanah": "lubang_tanah",
      "Tidak Memiliki Tanki": "tidak_memiliki",
    },
    ""
  );

const mapSepticPumpingServiceFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      Pemda: "pemda",
      "Swasta (Perorangan/Badan Usaha)": "swasta_perorangan",
    },
    ""
  );

const mapWastewaterDisposalFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Tergabung dalam Jaringan Pipa Pengolahan Air Limbah": "jaringan_pipa",
      "Tergabung dalam Tangki Septic": "tangki_septic",
      "Langsung Dialirkan ke Drainase/Saluran/Sungai": "drainase_sungai",
      "Ditampung dalam Lubang/Resapan ke Tanah": "resapan_tanah",
    },
    ""
  );

const mapWasteCollectionFromApi = (value) => {
  if (value === null || value === undefined) return "";
  return value ? "Ya" : "Tidak";
};

const mapWasteCollectionManagerFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      Pemda: "pemda",
      Pemdes: "pemdes",
      "LSM/Kelompok Masyarakat": "lsm_kelompok_masyarakat",
      Lainnya: "swasta",
    },
    ""
  );

const mapWasteDisposalMethodFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      Dibakar: "dibakar",
      "Diolah di Rumah (Kompos/Ditimbun)": "diolah_rumah",
      "Dibuang ke Tempat Sampah Umum": "tempat_sampah_umum",
      "Dibuang di Tempat Lainnya": "dibuang_lainnya",
    },
    ""
  );

const mapRoadTypeFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Jalan Lebar < 3,5 m": "lebar_kurang_3_5m",
      "Jalan Lebar > 3,5 m": "lebar_lebih_3_5m",
      "Tidak Terdapat Jalan Akses/Melalui Perkarangan Orang Lain":
        "tidak_ada_akses",
    },
    ""
  );

const mapRoadConstructionFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "Jalan Beton": "beton",
      "Jalan Aspal": "aspal",
      "Jalan Konblok": "konblok",
      "Jalan Tanah/Sirtu": "tanah_sirtu",
      "Konstruksi Lainnya": "lainnya",
    },
    ""
  );

const mapElectricitySourceFromApi = (value) =>
  mapFromApiValue(
    value,
    {
      "PLN Sendiri": "pln_sendiri",
      "PLN Menumpang": "pln_menumpang",
      "Tidak Ada": "tidak_ada",
      Lainnya: "lainnya",
    },
    ""
  );

// Reset form function
const resetForm = () => {
  isDraftSyncPaused.value = true;
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = null;
  }
  Object.keys(formData).forEach((section) => {
    Object.keys(formData[section]).forEach((field) => {
      if (section === "pemilik" && locationObjectFields.includes(field)) {
        formData[section][field] = null;
      } else if (
        section === "pemilik" &&
        (field === "latitude" || field === "longitude")
      ) {
        formData[section][field] = null;
      } else if (
        field === "photos" &&
        Array.isArray(formData[section][field])
      ) {
        releaseSectionPhotos(section);
        formData[section][field] = [];
      } else {
        formData[section][field] = "";
      }
    });
  });
  regencyOptions.value = [];
  districtOptions.value = [];
  villageOptions.value = [];
  formValid.value = false;
  locationSyncMessage.value = "";
  locationSyncType.value = "info";
  isProgrammaticLocationSync.value = false;
  locationLoading.isSyncing = false;
  imageSections.forEach((section) => {
    imageErrors[section] = "";
    imageProcessing[section] = false;
  });
  photoToastOpen.value = false;
  photoToastMessage.value = "";
  photoToastColor.value = "error";
  if (formRef.value) {
    formRef.value.resetValidation();
  }
  currentStep.value = 1;
  isDraftSyncPaused.value = false;
};
</script>

<style scoped>
.v-stepper {
  box-shadow: none !important;
}

.v-stepper-header {
  box-shadow: none !important;
}

.upload-photo-card {
  min-height: 220px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.upload-photo-card:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.upload-photo-placeholder {
  min-height: 220px;
  border-style: dashed;
  border-width: 2px;
  border-color: rgba(0, 0, 0, 0.16);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease,
    transform 0.2s ease;
}

.upload-photo-placeholder:hover {
  border-color: var(--v-theme-primary);
  background-color: rgba(0, 0, 0, 0.03);
  transform: translateY(-2px);
}

.upload-photo-placeholder:focus-visible {
  outline: 3px solid var(--v-theme-primary);
  outline-offset: 6px;
}

.file-input-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.form-card {
  width: 100%;
}

@media (max-width: 600px) {
  .form-card :deep(.v-card-title) {
    font-size: 1.1rem;
    text-align: left;
  }

  .form-card :deep(.v-card-text) {
    padding: 16px !important;
  }

  .form-stepper :deep(.v-stepper-header) {
    flex-wrap: wrap;
  }

  .form-stepper :deep(.v-stepper-item) {
    flex: 1 1 50%;
    min-width: 140px;
  }
}

/* Tambahkan atau perbarui di bagian <style scoped> */
@media (max-width: 600px) {
  /* Memaksa stepper tetap ke samping (tidak membungkus ke bawah) */
  .form-stepper :deep(.v-stepper-header) {
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    padding-bottom: 4px;
    scrollbar-width: none; /* Sembunyikan scrollbar di Firefox */
  }

  .form-stepper :deep(.v-stepper-header::-webkit-scrollbar) {
    display: none; /* Sembunyikan scrollbar di Chrome/Safari */
  }

  .form-stepper :deep(.v-stepper-item) {
    padding: 4px 8px !important;
    min-width: 100px !important; /* Supaya tetap kecil tapi terbaca */
    flex-shrink: 0;
  }

  /* Mengecilkan ukuran avatar/angka langkah */
  .form-stepper :deep(.v-stepper-item__avatar) {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    font-size: 0.75rem !important;
    margin-bottom: 4px !important;
  }

  /* Mengecilkan teks judul langkah */
  .form-stepper :deep(.v-stepper-item__title) {
    font-size: 0.65rem !important;
    white-space: nowrap;
    line-height: 1.2;
  }

  /* Menghilangkan divider di mobile agar tidak memakan tempat */
  .form-stepper :deep(.v-divider) {
    display: none !important;
  }
}
</style>
