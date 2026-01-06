<template>
  <div>
    <v-container fluid class="px-2 px-sm-6 py-4">
      <v-card class="mx-auto w-100 form-card" max-width="1200">
        <!-- Header -->
        <v-card-title class="text-h6 text-sm-h5 text-center py-4">
          {{
            isEditMode
              ? "Edit Survei Infrastruktur Desa/Kelurahan"
              : "Formulir Survey Infrastruktur Desa/Kelurahan"
          }}
        </v-card-title>

        <!-- Progress Steps -->
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
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          <v-form ref="formRef">
            <!-- Step 1: Sarana -->
            <div v-if="currentStep === 1">
              <h3 class="text-h6 mb-6">1. Sarana</h3>

              <!-- Informasi Survey -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Informasi Survey
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.surveyYear"
                        label="Tahun Survey"
                        type="number"
                        variant="outlined"
                        :rules="[rules.required, rules.yearRange]"
                        :min="YEAR_MIN"
                        :max="YEAR_MAX"
                        :hint="YEAR_HINT"
                        persistent-hint
                        @update:modelValue="
                          (val) => {
                            formData.surveyYear = sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="formData.surveyPeriod"
                        label="Periode Survey"
                        :items="surveyPeriodOptions"
                        variant="outlined"
                        :rules="[rules.required]"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Lokasi -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Lokasi Desa/Kelurahan
                </v-card-title>
                <v-card-text>
                  <v-row class="align-center mb-3">
                    <v-col cols="12" md="6">
                      <div class="text-body-2 text-medium-emphasis">
                        Gunakan peta untuk mengisi lokasi secara otomatis.
                      </div>
                    </v-col>
                    <v-col cols="12" md="6" class="d-flex justify-end">
                      <v-btn
                        color="primary"
                        variant="tonal"
                        prepend-icon="mdi-crosshairs-gps"
                        :loading="locationLoading.isSyncing"
                        @click="openLocationPicker"
                      >
                        Gunakan Lokasi Saat Ini
                      </v-btn>
                    </v-col>
                  </v-row>
                  <v-alert
                    v-if="locationSyncMessage"
                    :type="locationSyncType"
                    variant="tonal"
                    density="compact"
                    class="mb-3"
                    closable
                    @click:close="locationSyncMessage = ''"
                  >
                    {{ locationSyncMessage }}
                  </v-alert>
                  <v-alert
                    v-if="locationSelectError"
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="mb-3"
                    closable
                    @click:close="locationSelectError = ''"
                  >
                    {{ locationSelectError }}
                  </v-alert>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="formData.location.latitude"
                        label="Latitude"
                        type="number"
                        step="any"
                        variant="outlined"
                        readonly
                        placeholder="Pilih dari peta"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="formData.location.longitude"
                        label="Longitude"
                        type="number"
                        step="any"
                        variant="outlined"
                        readonly
                        placeholder="Pilih dari peta"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-autocomplete
                        v-model="formData.location.province"
                        label="Provinsi"
                        :items="provinceOptions"
                        :loading="locationLoading.provinces"
                        item-title="name"
                        item-value="id"
                        return-object
                        clearable
                        :rules="[rules.required]"
                        variant="outlined"
                        placeholder="Cari dan pilih provinsi"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-autocomplete
                        v-model="formData.location.regency"
                        label="Kabupaten / Kota"
                        :items="regencyOptions"
                        :loading="locationLoading.regencies"
                        :disabled="!formData.location.province"
                        item-title="name"
                        item-value="id"
                        return-object
                        clearable
                        :rules="[rules.required]"
                        variant="outlined"
                        placeholder="Cari dan pilih kabupaten/kota"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-autocomplete
                        v-model="formData.location.district"
                        label="Kecamatan"
                        :items="districtOptions"
                        :loading="locationLoading.districts"
                        :disabled="!formData.location.regency"
                        item-title="name"
                        item-value="id"
                        return-object
                        clearable
                        :rules="[rules.required]"
                        variant="outlined"
                        placeholder="Cari dan pilih kecamatan"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-autocomplete
                        v-model="formData.location.village"
                        label="Kelurahan"
                        :items="villageOptions"
                        :loading="locationLoading.villages"
                        :disabled="!formData.location.district"
                        item-title="name"
                        item-value="id"
                        return-object
                        clearable
                        :rules="[rules.required]"
                        variant="outlined"
                        placeholder="Cari dan pilih kelurahan"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Profil Desa/Kelurahan -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Profil Desa/Kelurahan
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="formData.profil.namaDesa"
                        label="Nama Desa/Kelurahan"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.profil.jumlahPenduduk"
                        label="Jumlah Penduduk"
                        type="number"
                        :min="POPULATION_MIN"
                        :max="POPULATION_MAX"
                        :hint="POPULATION_HINT"
                        persistent-hint
                        :rules="[rules.populationRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.profil.jumlahPenduduk =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.profil.jumlahKK"
                        type="number"
                        :min="HOUSEHOLD_MIN"
                        :max="HOUSEHOLD_MAX"
                        :hint="HOUSEHOLD_HINT"
                        persistent-hint
                        :rules="[rules.householdRequired, rules.householdRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.profil.jumlahKK = sanitizeDigits(val);
                          }
                        "
                      >
                        <template #label>
                          Jumlah KK (Kartu Keluarga)
                          <span v-if="isAdminDesa" class="text-error">*</span>
                        </template>
                      </v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.profil.jumlahRumah"
                        label="Jumlah Rumah"
                        type="number"
                        :min="HOUSE_MIN"
                        :max="HOUSE_MAX"
                        :hint="HOUSE_HINT"
                        persistent-hint
                        :rules="[rules.houseRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.profil.jumlahRumah = sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <template v-for="section in facilitySections" :key="section.key">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="text-subtitle-1">
                    {{ section.title }}
                  </v-card-title>
                  <v-card-subtitle class="text-caption">
                    Total sarana: {{ getFacilityCount(section.key) }}
                  </v-card-subtitle>
                  <v-card-text>
                    <div
                      v-if="!formData[section.key].length"
                      class="text-caption text-medium-emphasis mb-2"
                    >
                      Belum ada sarana terdaftar.
                    </div>
                    <v-row
                      v-for="(item, index) in formData[section.key]"
                      :key="`${section.key}-${index}`"
                      class="mb-2"
                    >
                      <v-col cols="12" md="4">
                        <v-select
                          v-model="item.type"
                          :items="section.typeItems"
                          :label="section.typeLabel"
                          variant="outlined"
                          clearable
                        />
                      </v-col>
                      <v-col cols="12" md="7">
                        <v-text-field
                          v-model="item.name"
                          :label="section.nameLabel"
                          variant="outlined"
                          clearable
                        />
                      </v-col>
                      <v-col
                        cols="12"
                        md="1"
                        class="d-flex align-center justify-end"
                      >
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          color="error"
                          @click="
                            removeFacilityRow(formData[section.key], index)
                          "
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </v-col>
                    </v-row>
                    <v-btn
                      size="x-small"
                      variant="text"
                      prepend-icon="mdi-plus"
                      @click="addFacilityRow(formData[section.key])"
                    >
                      Tambah Sarana
                    </v-btn>
                  </v-card-text>
                </v-card>
              </template>
            </div>

            <!-- Step 2: Utilitas Umum -->
            <div v-if="currentStep === 2">
              <h3 class="text-h6 mb-6">2. Utilitas Umum</h3>

              <!-- Jaringan Listrik -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Jaringan Listrik
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12">
                      <v-switch
                        v-model="
                          formData.jaringanListrik.tercakupSeluruhWilayah
                        "
                        label="Tercakup Seluruh Desa/Kelurahan"
                        color="primary"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="
                          formData.jaringanListrik.wilayahBelumTerjangkau
                        "
                        label="Jumlah Wilayah yang Belum Terjangkau (Dusun/RW)"
                        type="number"
                        :min="UTILITY_MIN"
                        :max="UTILITY_MAX"
                        :hint="UTILITY_HINT"
                        persistent-hint
                        :rules="[rules.utilityRange]"
                        variant="outlined"
                        :disabled="
                          formData.jaringanListrik.tercakupSeluruhWilayah
                        "
                        @update:modelValue="
                          (val) => {
                            formData.jaringanListrik.wilayahBelumTerjangkau =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Jaringan Air Bersih -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Jaringan Air Bersih
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.jaringanAirBersih.jumlahSPAM"
                        label="Jumlah SPAM yang Terdapat di Wilayah Desa/Kelurahan"
                        type="number"
                        :min="FACILITY_MIN"
                        :max="FACILITY_MAX"
                        :hint="FACILITY_HINT"
                        persistent-hint
                        :rules="[rules.facilityRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.jaringanAirBersih.jumlahSPAM =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Jaringan Telepon -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Jaringan Telepon
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.jaringanTelepon.jumlahOperator"
                        label="Jumlah Operator Telepon yang Beroperasi"
                        type="number"
                        :min="OPERATOR_MIN"
                        :max="OPERATOR_MAX"
                        :hint="OPERATOR_HINT"
                        persistent-hint
                        :rules="[rules.operatorRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.jaringanTelepon.jumlahOperator =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="
                          formData.jaringanTelepon.wilayahBelumTerjangkau
                        "
                        label="Jumlah Wilayah yang Belum Terjangkau (Dusun/RW)"
                        type="number"
                        :min="UTILITY_MIN"
                        :max="UTILITY_MAX"
                        :hint="UTILITY_HINT"
                        persistent-hint
                        :rules="[rules.utilityRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.jaringanTelepon.wilayahBelumTerjangkau =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Jaringan Gas -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Jaringan Gas
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.jaringanGas.jumlahAgenGas"
                        label="Jumlah Agen Gas di Desa/Kelurahan"
                        type="number"
                        :min="FACILITY_MIN"
                        :max="FACILITY_MAX"
                        :hint="FACILITY_HINT"
                        persistent-hint
                        :rules="[rules.facilityRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.jaringanGas.jumlahAgenGas =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Jaringan Transportasi -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Jaringan Transportasi
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12">
                      <v-select
                        v-model="
                          formData.jaringanTransportasi.layananAngkutanUmum
                        "
                        label="Layanan Angkutan Umum di Wilayah Desa/Kelurahan"
                        :items="angkutanUmumOptions"
                        multiple
                        variant="outlined"
                      />
                      <v-text-field
                        v-if="
                          formData.jaringanTransportasi.layananAngkutanUmum.includes(
                            'Lainnya'
                          )
                        "
                        v-model="formData.jaringanTransportasi.layananLainnya"
                        label="Sebutkan Layanan Lainnya"
                        variant="outlined"
                        class="mt-3"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Pemadam Kebakaran -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Pemadam Kebakaran
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.pemadamKebakaran.mobilDamkar"
                        label="Mobil Damkar (Unit)"
                        type="number"
                        :min="FACILITY_MIN"
                        :max="FACILITY_MAX"
                        :hint="FACILITY_HINT"
                        persistent-hint
                        :rules="[rules.facilityRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.pemadamKebakaran.mobilDamkar =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="formData.pemadamKebakaran.pengelola"
                        label="Pengelola"
                        :items="pengelolaOptions"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.pemadamKebakaran.APAR"
                        label="APAR (Unit)"
                        type="number"
                        :min="FACILITY_MIN"
                        :max="FACILITY_MAX"
                        :hint="FACILITY_HINT"
                        persistent-hint
                        :rules="[rules.facilityRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.pemadamKebakaran.APAR =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Penerangan Jalan Umum -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  Sarana Penerangan Jalan Umum (PJU)
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="formData.peneranganJalan.jumlahLampuJalan"
                        label="Jumlah Lampu Jalan yang Dikelola Pemerintah Desa/Kelurahan (Unit)"
                        type="number"
                        :min="FACILITY_MIN"
                        :max="FACILITY_MAX"
                        :hint="FACILITY_HINT"
                        persistent-hint
                        :rules="[rules.facilityRange]"
                        variant="outlined"
                        @update:modelValue="
                          (val) => {
                            formData.peneranganJalan.jumlahLampuJalan =
                              sanitizeDigits(val);
                          }
                        "
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
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
            @click="nextStep"
          >
            Selanjutnya
            <v-icon end> mdi-chevron-right </v-icon>
          </v-btn>
          <v-btn
            v-if="currentStep === steps.length"
            color="success"
            :loading="isSubmitting"
            :disabled="!isHouseholdCountValid || isSubmitting"
            @click="submitForm"
          >
            <v-icon start> mdi-check </v-icon>
            {{ isEditMode ? "Simpan Perubahan" : "Kirim Formulir" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>
    <LocationPickerDialog
      v-model="locationPickerOpen"
      v-model:latitude="locationPickerLat"
      v-model:longitude="locationPickerLng"
      title="Pilih Lokasi Infrastruktur"
      @confirm="handleLocationPicked"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from "vue";
import { definePage } from "unplugin-vue-router/runtime";
import { useRouter, useRoute } from "vue-router";
import { locationAPI, facilityAPI } from "@/services";
import { useAppStore } from "@/stores/app";
import { useMapDataStore } from "@/stores/mapData";
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

const router = useRouter();
const route = useRoute();
const mapDataStore = useMapDataStore();

const editSurveyId = computed(() => {
  return typeof route.query.edit === "string" && route.query.edit.trim()
    ? route.query.edit
    : null;
});
const isEditMode = computed(() => Boolean(editSurveyId.value));

// Form steps
const steps = [
  { title: "Sarana", subtitle: "Data Sarana Desa/Kelurahan" },
  { title: "Utilitas Umum", subtitle: "Data Utilitas Umum" },
];

const createFacilityItem = (item = {}) => ({
  id: item.id || null,
  type: item.type || "",
  name: item.name || "",
});

const ensureFacilityItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [createFacilityItem()];
  }
  return items;
};

const addFacilityRow = (list) => {
  list.push(createFacilityItem());
};

const getFacilityCount = (key) => {
  const list = formData[key];
  if (!Array.isArray(list)) return 0;
  return list.filter((item) => item.type && item.name).length;
};

const removeFacilityRow = (list, index) => {
  list.splice(index, 1);
  if (list.length === 0) {
    list.push(createFacilityItem());
  }
};

// Form data structure
const formData = reactive({
  surveyYear: new Date().getFullYear(),
  surveyPeriod: "q1",
  location: {
    province: null,
    regency: null,
    district: null,
    village: null,
    latitude: null,
    longitude: null,
  },
  profil: {
    namaDesa: "",
    jumlahPenduduk: "",
    jumlahKK: "",
    jumlahRumah: "",
  },
  perniagaan: ensureFacilityItems(),
  pelayananUmum: ensureFacilityItems(),
  pendidikan: ensureFacilityItems(),
  kesehatan: ensureFacilityItems(),
  peribadatan: ensureFacilityItems(),
  rekreasi: ensureFacilityItems(),
  pemakaman: ensureFacilityItems(),
  pertamanan: ensureFacilityItems(),
  parkir: ensureFacilityItems(),
  jaringanListrik: {
    tercakupSeluruhWilayah: false,
    wilayahBelumTerjangkau: "",
  },
  jaringanAirBersih: {
    jumlahSPAM: "",
  },
  jaringanTelepon: {
    jumlahOperator: "",
    wilayahBelumTerjangkau: "",
  },
  jaringanGas: {
    jumlahAgenGas: "",
  },
  jaringanTransportasi: {
    layananAngkutanUmum: [],
    layananLainnya: "",
  },
  pemadamKebakaran: {
    mobilDamkar: "",
    pengelola: "",
    APAR: "",
  },
  peneranganJalan: {
    jumlahLampuJalan: "",
  },
});

const facilityTypeOptions = {
  perniagaan: [
    "Pasar",
    "Toko/Warung",
    "Minimarket",
    "Koperasi",
    "SPBU",
    "Gudang",
    "Lainnya",
  ],
  pelayananUmum: [
    "Kantor Desa",
    "Kantor Kecamatan",
    "Polsek",
    "Koramil",
    "Kantor Pos",
    "Bank",
    "Balai Pertemuan",
    "Lainnya",
  ],
  pendidikan: [
    "PAUD/TK",
    "SD",
    "SMP",
    "SMA/SMK",
    "Perguruan Tinggi",
    "Pesantren",
    "Lainnya",
  ],
  kesehatan: [
    "Puskesmas",
    "Pustu",
    "Posyandu",
    "RS Pemerintah",
    "RS Swasta",
    "Klinik",
    "Apotek",
    "Lainnya",
  ],
  peribadatan: [
    "Masjid",
    "Mushola",
    "Gereja Protestan",
    "Gereja Katolik",
    "Pura",
    "Vihara",
    "Kelenteng",
    "Lainnya",
  ],
  rekreasi: [
    "Lapangan Olahraga",
    "Gelanggang Olahraga",
    "Taman Bermain",
    "Tempat Wisata",
    "Lainnya",
  ],
  pemakaman: ["TPU Muslim", "TPU Non Muslim", "Lainnya"],
  pertamanan: ["Taman", "RTH", "Hutan Kota", "Lainnya"],
  parkir: ["Kantong Parkir", "Area Parkir", "Lainnya"],
};

const facilitySections = [
  {
    key: "perniagaan",
    title: "Sarana Perniagaan/Perbelanjaan",
    typeLabel: "Tipe Sarana",
    nameLabel: "Nama Sarana",
    typeItems: facilityTypeOptions.perniagaan,
  },
  {
    key: "pelayananUmum",
    title: "Sarana Pelayanan Umum dan Pemerintahan",
    typeLabel: "Tipe Sarana",
    nameLabel: "Nama Sarana",
    typeItems: facilityTypeOptions.pelayananUmum,
  },
  {
    key: "pendidikan",
    title: "Sarana Pendidikan",
    typeLabel: "Tipe Sarana Pendidikan",
    nameLabel: "Nama Sarana Pendidikan",
    typeItems: facilityTypeOptions.pendidikan,
  },
  {
    key: "kesehatan",
    title: "Sarana Kesehatan",
    typeLabel: "Tipe Sarana Kesehatan",
    nameLabel: "Nama Sarana Kesehatan",
    typeItems: facilityTypeOptions.kesehatan,
  },
  {
    key: "peribadatan",
    title: "Sarana Peribadatan",
    typeLabel: "Tipe Sarana Peribadatan",
    nameLabel: "Nama Tempat Ibadah",
    typeItems: facilityTypeOptions.peribadatan,
  },
  {
    key: "rekreasi",
    title: "Sarana Rekreasi dan Olahraga",
    typeLabel: "Tipe Sarana Rekreasi",
    nameLabel: "Nama Sarana Rekreasi/Olahraga",
    typeItems: facilityTypeOptions.rekreasi,
  },
  {
    key: "pemakaman",
    title: "Sarana Pemakaman",
    typeLabel: "Tipe Sarana Pemakaman",
    nameLabel: "Nama Area Pemakaman",
    typeItems: facilityTypeOptions.pemakaman,
  },
  {
    key: "pertamanan",
    title: "Sarana Pertamanan dan Ruang Terbuka Hijau (RTH)",
    typeLabel: "Tipe Sarana Pertamanan",
    nameLabel: "Nama Taman/RTH",
    typeItems: facilityTypeOptions.pertamanan,
  },
  {
    key: "parkir",
    title: "Sarana Parkir",
    typeLabel: "Tipe Sarana Parkir",
    nameLabel: "Nama Sarana Parkir",
    typeItems: facilityTypeOptions.parkir,
  },
];

const angkutanUmumOptions = [
  "Bus",
  "Angkot",
  "Lainnya (misalnya perahu, kapal laut)",
];

const pengelolaOptions = ["Pemkab/Kota", "Kecamatan", "Pemdes", "Swasta"];

const surveyPeriodOptions = [
  { title: "Q1 (Januari - Maret)", value: "q1" },
  { title: "Q2 (April - Juni)", value: "q2" },
  { title: "Q3 (Juli - September)", value: "q3" },
  { title: "Q4 (Oktober - Desember)", value: "q4" },
  // { title: 'Tahunan', value: 'annual' },
  // { title: 'Ad Hoc', value: 'adhoc' }
];

// Location options
const provinceOptions = ref([]);
const regencyOptions = ref([]);
const districtOptions = ref([]);
const villageOptions = ref([]);

const YEAR_MIN = 1900;
const YEAR_MAX = new Date().getFullYear();
const POPULATION_MIN = 0;
const POPULATION_MAX = 200000;
const HOUSEHOLD_MIN = 0;
const HOUSEHOLD_MAX = 50000;
const HOUSE_MIN = 0;
const HOUSE_MAX = 50000;
const OPERATOR_MIN = 0;
const OPERATOR_MAX = 50;
const FACILITY_MIN = 0;
const FACILITY_MAX = 200;
const UTILITY_MIN = 0;
const UTILITY_MAX = 5000;
const YEAR_HINT = `${YEAR_MIN}-${YEAR_MAX}`;
const POPULATION_HINT = `${POPULATION_MIN}-${POPULATION_MAX}`;
const HOUSEHOLD_HINT = `${HOUSEHOLD_MIN}-${HOUSEHOLD_MAX}`;
const HOUSE_HINT = `${HOUSE_MIN}-${HOUSE_MAX}`;
const OPERATOR_HINT = `${OPERATOR_MIN}-${OPERATOR_MAX}`;
const FACILITY_HINT = `${FACILITY_MIN}-${FACILITY_MAX}`;
const UTILITY_HINT = `${UTILITY_MIN}-${UTILITY_MAX}`;

const locationLoading = reactive({
  provinces: false,
  regencies: false,
  districts: false,
  villages: false,
  isSyncing: false,
});

const appStore = useAppStore();
const isAdminDesa = computed(() => appStore.isAdminDesa);

// Validation rules
const rules = {
  required: (value) => !!value || "Field ini wajib diisi",
  yearRange: (value) => {
    if (value === null || value === "") return true;
    const year = Number(value);
    if (Number.isNaN(year)) return "Tahun tidak valid";
    return (
      (year >= YEAR_MIN && year <= YEAR_MAX) ||
      `Tahun harus ${YEAR_MIN}-${YEAR_MAX}`
    );
  },
  populationRange: (value) => {
    if (value === null || value === "") return true;
    const num = Number(value);
    if (Number.isNaN(num)) return "Nilai harus berupa angka";
    return (
      (num >= POPULATION_MIN && num <= POPULATION_MAX) ||
      `Nilai harus ${POPULATION_MIN}-${POPULATION_MAX}`
    );
  },
  householdRange: (value) => {
    if (value === null || value === "") return true;
    const num = Number(value);
    if (Number.isNaN(num)) return "Nilai harus berupa angka";
    return (
      (num >= HOUSEHOLD_MIN && num <= HOUSEHOLD_MAX) ||
      `Nilai harus ${HOUSEHOLD_MIN}-${HOUSEHOLD_MAX}`
    );
  },
  householdRequired: (value) => {
    if (!isAdminDesa.value) return true;
    const num = Number(value);
    if (!value || Number.isNaN(num) || num <= 0) {
      return "Jumlah KK desa wajib diisi untuk sinkronisasi data statistik.";
    }
    return true;
  },
  houseRange: (value) => {
    if (value === null || value === "") return true;
    const num = Number(value);
    if (Number.isNaN(num)) return "Nilai harus berupa angka";
    return (
      (num >= HOUSE_MIN && num <= HOUSE_MAX) ||
      `Nilai harus ${HOUSE_MIN}-${HOUSE_MAX}`
    );
  },
  operatorRange: (value) => {
    if (value === null || value === "") return true;
    const num = Number(value);
    if (Number.isNaN(num)) return "Nilai harus berupa angka";
    return (
      (num >= OPERATOR_MIN && num <= OPERATOR_MAX) ||
      `Nilai harus ${OPERATOR_MIN}-${OPERATOR_MAX}`
    );
  },
  facilityRange: (value) => {
    if (value === null || value === "") return true;
    const num = Number(value);
    if (Number.isNaN(num)) return "Nilai harus berupa angka";
    return (
      (num >= FACILITY_MIN && num <= FACILITY_MAX) ||
      `Nilai harus ${FACILITY_MIN}-${FACILITY_MAX}`
    );
  },
  utilityRange: (value) => {
    if (value === null || value === "") return true;
    const num = Number(value);
    if (Number.isNaN(num)) return "Nilai harus berupa angka";
    return (
      (num >= UTILITY_MIN && num <= UTILITY_MAX) ||
      `Nilai harus ${UTILITY_MIN}-${UTILITY_MAX}`
    );
  },
};

const sanitizeDigits = (value) => String(value ?? "").replace(/\D/g, "");
const isHouseholdCountValid = computed(() => {
  if (!isAdminDesa.value) return true;
  const value = Number(formData.profil.jumlahKK);
  return Number.isFinite(value) && value > 0;
});

// Reactive state
const currentStep = ref(1);
const isSubmitting = ref(false);
const formRef = ref(null);
const errorMessage = ref("");
const locationPickerOpen = ref(false);
const locationPickerLat = ref(null);
const locationPickerLng = ref(null);
const locationSyncMessage = ref("");
const locationSyncType = ref("info");
const locationSelectError = ref("");
const isProgrammaticLocationSync = ref(false);

const validateFacilityRows = () => {
  const invalid = facilitySections.find((section) => {
    const list = formData[section.key] || [];
    return list.some(
      (item) => (item.name && !item.type) || (item.type && !item.name)
    );
  });

  if (invalid) {
    errorMessage.value = "Lengkapi tipe dan nama sarana pada semua baris.";
    return false;
  }

  return true;
};

// Methods
const nextStep = () => {
  if (currentStep.value < steps.length) {
    if (currentStep.value === 1 && !validateFacilityRows()) {
      return;
    }
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Location fetch functions
const fetchProvinces = async () => {
  locationLoading.provinces = true;
  locationSelectError.value = "";
  try {
    const response = await locationAPI.getProvinces();
    if (response.success && response.data?.provinces) {
      provinceOptions.value = response.data.provinces.map((province) => ({
        id: province.id,
        name: province.name,
        code: province.code,
      }));
      if (!provinceOptions.value.length) {
        locationSelectError.value = "Data provinsi belum tersedia.";
      }
    }
  } catch (error) {
    console.error("Error fetching provinces:", error);
    locationSelectError.value = error?.message || "Gagal memuat data provinsi.";
  } finally {
    locationLoading.provinces = false;
  }
};

const fetchRegencies = async (provinceId) => {
  if (!provinceId) return;
  locationLoading.regencies = true;
  locationSelectError.value = "";
  try {
    const response = await locationAPI.getRegencies(provinceId);
    if (response.success && response.data?.regencies) {
      regencyOptions.value = response.data.regencies.map((regency) => ({
        id: regency.id,
        name: regency.name,
        code: regency.code,
      }));
      if (!regencyOptions.value.length) {
        locationSelectError.value =
          "Data kabupaten/kota belum tersedia untuk provinsi ini.";
      }
    }
  } catch (error) {
    console.error("Error fetching regencies:", error);
    locationSelectError.value =
      error?.message || "Gagal memuat data kabupaten/kota.";
  } finally {
    locationLoading.regencies = false;
  }
};

const fetchDistricts = async (regencyId) => {
  if (!regencyId) return;
  locationLoading.districts = true;
  locationSelectError.value = "";
  try {
    const response = await locationAPI.getDistricts(regencyId);
    if (response.success && response.data?.districts) {
      districtOptions.value = response.data.districts.map((district) => ({
        id: district.id,
        name: district.name,
        code: district.code,
      }));
      if (!districtOptions.value.length) {
        locationSelectError.value =
          "Data kecamatan belum tersedia untuk kabupaten/kota ini.";
      }
    }
  } catch (error) {
    console.error("Error fetching districts:", error);
    locationSelectError.value =
      error?.message || "Gagal memuat data kecamatan.";
  } finally {
    locationLoading.districts = false;
  }
};

const fetchVillages = async (districtId) => {
  if (!districtId) return;
  locationLoading.villages = true;
  locationSelectError.value = "";
  try {
    const response = await locationAPI.getVillages(districtId);
    if (response.success && response.data?.villages) {
      villageOptions.value = response.data.villages.map((village) => ({
        id: village.id,
        name: village.name,
        code: village.code,
      }));
      if (!villageOptions.value.length) {
        locationSelectError.value =
          "Data kelurahan belum tersedia untuk kecamatan ini.";
      }
    }
  } catch (error) {
    console.error("Error fetching villages:", error);
    locationSelectError.value =
      error?.message || "Gagal memuat data kelurahan.";
  } finally {
    locationLoading.villages = false;
  }
};

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
      formData.location.province = normalizedProvince;
      await fetchRegencies(provinceId);
    }

    const regencyId = resolveLocationId(regency);
    if (regencyId) {
      const parentProvinceId =
        regency?.parentId || provinceId || formData.location.province?.id;
      if (parentProvinceId && !regencyOptions.value.length) {
        await fetchRegencies(parentProvinceId);
      }
      const normalizedRegency = ensureOption(regencyOptions, regency);
      formData.location.regency = normalizedRegency;
      await fetchDistricts(regencyId);
    }

    const districtId = resolveLocationId(district);
    if (districtId) {
      const parentRegencyId =
        district?.parentId || regencyId || formData.location.regency?.id;
      if (parentRegencyId && !districtOptions.value.length) {
        await fetchDistricts(parentRegencyId);
      }
      const normalizedDistrict = ensureOption(districtOptions, district);
      formData.location.district = normalizedDistrict;
      await fetchVillages(districtId);
    }

    const villageId = resolveLocationId(village);
    if (villageId) {
      const parentDistrictId =
        village?.parentId || districtId || formData.location.district?.id;
      if (parentDistrictId && !villageOptions.value.length) {
        await fetchVillages(parentDistrictId);
      }
      const normalizedVillage = ensureOption(villageOptions, village);
      formData.location.village = normalizedVillage;
    }
  } finally {
    isProgrammaticLocationSync.value = false;
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

  if (result.village?.name) {
    formData.profil.namaDesa = result.village.name;
  }
};

const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await locationAPI.reverseGeocode(latitude, longitude);
    if (response.success && response.data) {
      const mapped = mapReverseGeocodeResponse(response.data);
      if (!mapped?.province?.id) {
        locationSyncType.value = "error";
        locationSyncMessage.value =
          "Data lokasi tidak lengkap. Silakan pilih lokasi secara manual.";
        throw new Error("Data lokasi tidak lengkap.");
      }
      return mapped;
    }

    if (response?.code === "OUTSIDE_BOUNDARY") {
      locationSyncType.value = "error";
      locationSyncMessage.value = "Lokasi di luar wilayah kerja.";
      throw new Error("Lokasi di luar wilayah kerja.");
    }

    locationSyncType.value = "error";
    locationSyncMessage.value =
      response?.message ||
      "Lokasi tidak ditemukan. Silakan pilih lokasi secara manual.";
    throw new Error(response?.message || "Reverse geocode gagal.");
  } catch (error) {
    if (error?.code === "OUTSIDE_BOUNDARY") {
      locationSyncType.value = "error";
      locationSyncMessage.value = "Lokasi di luar wilayah kerja.";
    }
    if (!locationSyncMessage.value) {
      locationSyncType.value = "error";
      locationSyncMessage.value =
        error?.message ||
        "Lokasi tidak ditemukan. Silakan pilih lokasi secara manual.";
    }
    throw error;
  }
};

const openLocationPicker = () => {
  locationSyncMessage.value = "";
  locationSyncType.value = "info";

  const manualLat = parseFloat(formData.location.latitude);
  const manualLng = parseFloat(formData.location.longitude);
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

  formData.location.latitude = parseFloat(latitude.toFixed(6));
  formData.location.longitude = parseFloat(longitude.toFixed(6));
  locationLoading.isSyncing = true;

  try {
    const result = await reverseGeocode(latitude, longitude);
    await applyLocationResult(result);
    locationSyncType.value = "success";
    locationSyncMessage.value = "Lokasi berhasil disinkronkan dari peta.";
  } catch (error) {
    console.error("Location sync error:", error);
    locationSyncType.value = "error";
    locationSyncMessage.value =
      error?.message || "Gagal menyinkronkan lokasi berdasarkan titik peta.";
  } finally {
    locationLoading.isSyncing = false;
  }
};

// Watchers for cascaded location dropdowns
watch(
  () => formData.location.province,
  async (province) => {
    if (isProgrammaticLocationSync.value) return;
    locationSelectError.value = "";
    locationSyncMessage.value = "";
    formData.location.latitude = null;
    formData.location.longitude = null;
    formData.location.regency = null;
    formData.location.district = null;
    formData.location.village = null;
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
  () => formData.location.regency,
  async (regency) => {
    if (isProgrammaticLocationSync.value) return;
    locationSelectError.value = "";
    locationSyncMessage.value = "";
    formData.location.latitude = null;
    formData.location.longitude = null;
    formData.location.district = null;
    formData.location.village = null;
    districtOptions.value = [];
    villageOptions.value = [];
    const regencyId = resolveLocationId(regency);
    if (regencyId) {
      await fetchDistricts(regencyId);
    }
  }
);

watch(
  () => formData.location.district,
  async (district) => {
    if (isProgrammaticLocationSync.value) return;
    locationSelectError.value = "";
    locationSyncMessage.value = "";
    formData.location.latitude = null;
    formData.location.longitude = null;
    formData.location.village = null;
    villageOptions.value = [];
    const districtId = resolveLocationId(district);
    if (districtId) {
      await fetchVillages(districtId);
    }
  }
);

const sanitizeFacilityItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const type = String(item.type || "").trim();
      const name = String(item.name || "").trim();
      const payload = { type, name };
      if (item.id) {
        payload.id = item.id;
      }
      return payload;
    })
    .filter((item) => item.name.length > 0 && item.type.length > 0);
};

const mapFacilityItemsFromSurvey = (items) => {
  if (!Array.isArray(items)) return [createFacilityItem()];
  const mapped = items
    .map((item) =>
      createFacilityItem({
        id: item.id,
        type: item.type,
        name: item.name,
      })
    )
    .filter((item) => item.name || item.type);
  return mapped.length ? mapped : [createFacilityItem()];
};

// Helper function to map pengelola
const mapPengelola = (pengelola) => {
  const mapping = {
    "Pemkab/Kota": "pemkab",
    Kecamatan: "kecamatan",
    Pemdes: "pemdes",
    Swasta: "swasta",
  };
  return mapping[pengelola] || pengelola?.toLowerCase() || null;
};

const asInputValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const mapPengelolaLabel = (pengelola) => {
  const normalized = String(pengelola ?? "").toLowerCase();
  const mapping = {
    pemkab: "Pemkab/Kota",
    kecamatan: "Kecamatan",
    pemdes: "Pemdes",
    swasta: "Swasta",
  };
  return mapping[normalized] || (pengelola ? String(pengelola) : "");
};

const buildTransportFromSurvey = (transportation) => {
  if (!transportation) return [];
  const services = [];
  if (transportation.busRouteCount) services.push("Bus");
  if (transportation.angkotRouteCount) services.push("Angkot");
  if (transportation.otherTransportCount) {
    services.push("Lainnya (misalnya perahu, kapal laut)");
  }
  return services;
};

const parseVillageName = (notes, fallback) => {
  const parsed = parseVillageInfoValue(notes, "Nama Desa/Kelurahan");
  if (parsed) return parsed;
  if (fallback) return fallback;
  if (!notes) return "";
  return String(notes);
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

const buildVillageInfoNotes = () => {
  const notes = [];
  if (formData.profil.namaDesa) {
    notes.push(`Nama Desa/Kelurahan: ${formData.profil.namaDesa}`);
  }
  if (formData.profil.jumlahKK) {
    notes.push(`Jumlah KK: ${parseInt(formData.profil.jumlahKK, 10) || 0}`);
  }
  if (formData.profil.jumlahRumah) {
    notes.push(
      `Jumlah Rumah: ${parseInt(formData.profil.jumlahRumah, 10) || 0}`
    );
  }
  return notes.length ? notes.join(" | ") : null;
};

const generateLocalId = () => {
  return `infra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const buildLocalSubmission = (apiResponse) => {
  const now = new Date().toISOString();
  return {
    id: apiResponse?.data?.survey?.id || generateLocalId(),
    status: "submitted",
    villageName:
      formData.profil.namaDesa || formData.location.village?.name || "N/A",
    population: parseInt(formData.profil.jumlahPenduduk) || 0,
    submittedAt: now,
    reviewedAt: null,
    reviewer: null,
    profil: {
      namaDesa: formData.profil.namaDesa,
      jumlahPenduduk: parseInt(formData.profil.jumlahPenduduk) || 0,
      jumlahKK: parseInt(formData.profil.jumlahKK) || 0,
      jumlahRumah: parseInt(formData.profil.jumlahRumah) || 0,
    },
    pendidikan: sanitizeFacilityItems(formData.pendidikan),
    kesehatan: sanitizeFacilityItems(formData.kesehatan),
    peribadatan: sanitizeFacilityItems(formData.peribadatan),
    listrik: {
      tercakupSeluruhDesa:
        formData.jaringanListrik.tercakupSeluruhWilayah || false,
      wilayahBelumTerjangkau:
        formData.jaringanListrik.wilayahBelumTerjangkau || "0 Dusun/RW",
    },
    jaringanListrik: {
      tercakupSeluruhWilayah:
        formData.jaringanListrik.tercakupSeluruhWilayah || false,
      wilayahBelumTerjangkau:
        formData.jaringanListrik.wilayahBelumTerjangkau || "0 Dusun/RW",
    },
    airBersih: {
      jumlahSpam: parseInt(formData.jaringanAirBersih.jumlahSPAM) || 0,
    },
    jaringanAirBersih: {
      jumlahSPAM: parseInt(formData.jaringanAirBersih.jumlahSPAM) || 0,
    },
    telepon: {
      jumlahOperator: parseInt(formData.jaringanTelepon.jumlahOperator) || 0,
      wilayahBelumTerjangkau:
        formData.jaringanTelepon.wilayahBelumTerjangkau || "0 Dusun/RW",
    },
    jaringanTelepon: {
      jumlahOperator: parseInt(formData.jaringanTelepon.jumlahOperator) || 0,
      wilayahBelumTerjangkau:
        formData.jaringanTelepon.wilayahBelumTerjangkau || "0 Dusun/RW",
    },
    transportasi: {
      layananAngkutanUmum:
        formData.jaringanTransportasi.layananAngkutanUmum || [],
      layananLainnya: formData.jaringanTransportasi.layananLainnya || "",
    },
    jaringanTransportasi: {
      layananAngkutanUmum:
        formData.jaringanTransportasi.layananAngkutanUmum || [],
      layananLainnya: formData.jaringanTransportasi.layananLainnya || "",
    },
    perniagaan: sanitizeFacilityItems(formData.perniagaan),
    pelayananUmum: sanitizeFacilityItems(formData.pelayananUmum),
    rekreasi: sanitizeFacilityItems(formData.rekreasi),
    pemakaman: sanitizeFacilityItems(formData.pemakaman),
    pertamanan: sanitizeFacilityItems(formData.pertamanan),
    parkir: sanitizeFacilityItems(formData.parkir),
    jaringanGas: {
      jumlahAgenGas: parseInt(formData.jaringanGas.jumlahAgenGas) || 0,
    },
    pemadamKebakaran: {
      mobilDamkar: parseInt(formData.pemadamKebakaran.mobilDamkar) || 0,
      pengelola: formData.pemadamKebakaran.pengelola || "",
      APAR: parseInt(formData.pemadamKebakaran.APAR) || 0,
    },
    peneranganJalan: {
      jumlahLampuJalan:
        parseInt(formData.peneranganJalan.jumlahLampuJalan) || 0,
    },
    location: {
      province: formData.location.province,
      regency: formData.location.regency,
      district: formData.location.district,
      village: formData.location.village,
    },
  };
};

const saveLocalSubmission = (submissionData) => {
  try {
    const existingData = localStorage.getItem("infrastructure-submissions");
    let submissions = [];

    if (existingData) {
      try {
        submissions = JSON.parse(existingData);
      } catch (error) {
        console.error("Error parsing existing submissions:", error);
        submissions = [];
      }
    }

    submissions.push(submissionData);
    localStorage.setItem(
      "infrastructure-submissions",
      JSON.stringify(submissions)
    );
  } catch (error) {
    console.error("Failed to cache infrastructure submission locally:", error);
  }
};

// Transform form data to API format
const transformFormDataToAPI = () => {
  const layananAngkutan =
    formData.jaringanTransportasi.layananAngkutanUmum || [];
  const now = new Date().toISOString();

  return {
    surveyYear: parseInt(formData.surveyYear) || new Date().getFullYear(),
    surveyPeriod: formData.surveyPeriod,
    villageId: resolveLocationId(formData.location.village),
    districtId: resolveLocationId(formData.location.district),
    regencyId: resolveLocationId(formData.location.regency),
    provinceId: resolveLocationId(formData.location.province),
    status: "submitted",
    submittedAt: now,

    villageInfo: {
      populationCount: parseInt(formData.profil.jumlahPenduduk) || 0,
      householdCount: parseInt(formData.profil.jumlahKK) || 0,
      villageArea: 0, // Not in form, set to 0
      notes: buildVillageInfoNotes(),
    },

    commercial: sanitizeFacilityItems(formData.perniagaan),
    publicServices: sanitizeFacilityItems(formData.pelayananUmum),
    education: sanitizeFacilityItems(formData.pendidikan),
    health: sanitizeFacilityItems(formData.kesehatan),
    religious: sanitizeFacilityItems(formData.peribadatan),
    recreation: sanitizeFacilityItems(formData.rekreasi),
    cemetery: sanitizeFacilityItems(formData.pemakaman),
    greenSpace: sanitizeFacilityItems(formData.pertamanan),
    parking: sanitizeFacilityItems(formData.parkir),

    electricity: {
      isFullCoverage: formData.jaringanListrik.tercakupSeluruhWilayah || false,
      uncoveredDusunCount:
        parseInt(formData.jaringanListrik.wilayahBelumTerjangkau) || 0,
      notes: null,
    },

    water: {
      spamCount: parseInt(formData.jaringanAirBersih.jumlahSPAM) || 0,
      pipedWaterCoverage: 0, // Not in form, set to 0
      notes: null,
    },

    telecom: {
      operatorCount: parseInt(formData.jaringanTelepon.jumlahOperator) || 0,
      uncoveredDusunCount:
        parseInt(formData.jaringanTelepon.wilayahBelumTerjangkau) || 0,
      notes: null,
    },

    gas: {
      gasAgentCount: parseInt(formData.jaringanGas.jumlahAgenGas) || 0,
      notes: null,
    },

    transportation: {
      busRouteCount: layananAngkutan.includes("Bus") ? 1 : 0,
      angkotRouteCount: layananAngkutan.includes("Angkot") ? 1 : 0,
      otherTransportCount: layananAngkutan.includes(
        "Lainnya (misalnya perahu, kapal laut)"
      )
        ? 1
        : 0,
      otherTransportType: formData.jaringanTransportasi.layananLainnya || null,
      notes: null,
    },

    fireDepartment: {
      fireTruckCount: parseInt(formData.pemadamKebakaran.mobilDamkar) || 0,
      fireManager: mapPengelola(formData.pemadamKebakaran.pengelola),
      aparCount: parseInt(formData.pemadamKebakaran.APAR) || 0,
      notes: null,
    },

    streetLighting: {
      streetLightCount:
        parseInt(formData.peneranganJalan.jumlahLampuJalan) || 0,
      managedBy: null, // Not in form
      notes: null,
    },
  };
};

const loadSurveyForEdit = async () => {
  if (!editSurveyId.value) return;
  errorMessage.value = "";

  try {
    const response = await facilityAPI.getSurvey(editSurveyId.value);
    const survey = response?.data?.survey;

    if (!survey) {
      throw new Error("Data survei tidak ditemukan.");
    }

    formData.surveyYear = survey.surveyYear || new Date().getFullYear();
    formData.surveyPeriod = survey.surveyPeriod || "q1";
    formData.location.latitude = null;
    formData.location.longitude = null;

    await setLocationHierarchy({
      province: survey.province || null,
      regency: survey.regency || null,
      district: survey.district || null,
      village: survey.village || null,
    });

    formData.profil.namaDesa = parseVillageName(
      survey.villageInfo?.notes,
      survey.village?.name || ""
    );
    const notes = survey.villageInfo?.notes;
    const parsedHouseholdCount = parseNumericNote(notes, "Jumlah KK");
    const parsedHouseCount = parseNumericNote(notes, "Jumlah Rumah");
    const legacyHouseCount =
      survey.villageInfo?.houseCount ?? survey.villageInfo?.householdCount;

    formData.profil.jumlahPenduduk = asInputValue(
      survey.villageInfo?.populationCount
    );
    formData.profil.jumlahKK = asInputValue(
      parsedHouseholdCount ?? survey.villageInfo?.householdCount
    );
    formData.profil.jumlahRumah = asInputValue(
      parsedHouseCount ?? legacyHouseCount
    );

    formData.perniagaan = mapFacilityItemsFromSurvey(survey.commercial);
    formData.pelayananUmum = mapFacilityItemsFromSurvey(survey.publicServices);
    formData.pendidikan = mapFacilityItemsFromSurvey(survey.education);
    formData.kesehatan = mapFacilityItemsFromSurvey(survey.health);
    formData.peribadatan = mapFacilityItemsFromSurvey(survey.religious);
    formData.rekreasi = mapFacilityItemsFromSurvey(survey.recreation);
    formData.pemakaman = mapFacilityItemsFromSurvey(survey.cemetery);
    formData.pertamanan = mapFacilityItemsFromSurvey(survey.greenSpace);
    formData.parkir = mapFacilityItemsFromSurvey(survey.parking);

    formData.jaringanListrik.tercakupSeluruhWilayah = Boolean(
      survey.electricity?.isFullCoverage
    );
    formData.jaringanListrik.wilayahBelumTerjangkau = asInputValue(
      survey.electricity?.uncoveredDusunCount
    );

    formData.jaringanAirBersih.jumlahSPAM = asInputValue(
      survey.water?.spamCount
    );

    formData.jaringanTelepon.jumlahOperator = asInputValue(
      survey.telecom?.operatorCount
    );
    formData.jaringanTelepon.wilayahBelumTerjangkau = asInputValue(
      survey.telecom?.uncoveredDusunCount
    );

    formData.jaringanGas.jumlahAgenGas = asInputValue(
      survey.gas?.gasAgentCount
    );

    formData.jaringanTransportasi.layananAngkutanUmum =
      buildTransportFromSurvey(survey.transportation);
    formData.jaringanTransportasi.layananLainnya = asInputValue(
      survey.transportation?.otherTransportType
    );

    formData.pemadamKebakaran.mobilDamkar = asInputValue(
      survey.fireDepartment?.fireTruckCount
    );
    formData.pemadamKebakaran.pengelola = mapPengelolaLabel(
      survey.fireDepartment?.fireManager
    );
    formData.pemadamKebakaran.APAR = asInputValue(
      survey.fireDepartment?.aparCount
    );

    formData.peneranganJalan.jumlahLampuJalan = asInputValue(
      survey.streetLighting?.streetLightCount
    );

    currentStep.value = 1;
  } catch (error) {
    console.error("Error loading survey for edit:", error);
    errorMessage.value =
      error?.message || "Gagal memuat data survei untuk diedit.";
  }
};

const submitForm = async () => {
  // Validate form
  if (!formRef.value) return;

  if (!validateFacilityRows()) {
    return;
  }

  const { valid } = await formRef.value.validate();
  if (!valid) {
    errorMessage.value = "Mohon lengkapi semua field yang wajib diisi";
    return;
  }

  // Validate location
  if (
    !formData.location.province ||
    !formData.location.regency ||
    !formData.location.district ||
    !formData.location.village
  ) {
    errorMessage.value =
      "Mohon pilih lokasi lengkap (Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan)";
    return;
  }

  const lat = parseFloat(formData.location.latitude);
  const lng = parseFloat(formData.location.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    try {
      const reverseResult = await reverseGeocode(lat, lng);
      const mismatch = (expected, actual) => {
        const expectedId = resolveLocationId(expected);
        const actualId = resolveLocationId(actual);
        return expectedId && actualId && expectedId !== actualId;
      };

      if (
        mismatch(formData.location.village, reverseResult.village) ||
        mismatch(formData.location.district, reverseResult.district) ||
        mismatch(formData.location.regency, reverseResult.regency) ||
        mismatch(formData.location.province, reverseResult.province)
      ) {
        errorMessage.value =
          "Koordinat tidak sesuai dengan wilayah yang dipilih.";
        return;
      }

      await applyLocationResult(reverseResult);
    } catch (error) {
      errorMessage.value =
        error?.message || "Validasi koordinat gagal. Silakan coba lagi.";
      return;
    }
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    // Transform form data to API format
    const apiData = transformFormDataToAPI();

    const response = isEditMode.value
      ? await facilityAPI.updateSurvey(editSurveyId.value, apiData)
      : await facilityAPI.createSurvey(apiData);

    if (response?.success === false) {
      throw new Error(
        response.message || "Gagal mengirim survei infrastruktur."
      );
    }

    if (!isEditMode.value) {
      saveLocalSubmission(buildLocalSubmission(response));
    }

    alert(
      isEditMode.value
        ? "Perubahan survei infrastruktur berhasil disimpan!"
        : "Formulir survey infrastruktur berhasil dikirim!"
    );
    mapDataStore.signalRefresh();

    if (!isEditMode.value) {
      resetForm();
    }

    // Redirect based on role access
    router.push(isAdminDesa.value ? "/home" : "/infrastructure-data");
  } catch (error) {
    console.error("Error submitting form:", error);
    errorMessage.value =
      error?.message ||
      "Terjadi kesalahan saat mengirim formulir. Silakan coba lagi.";
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  // Reset all form fields
  formData.surveyYear = new Date().getFullYear();
  formData.surveyPeriod = "q1";
  formData.location.province = null;
  formData.location.regency = null;
  formData.location.district = null;
  formData.location.village = null;
  formData.location.latitude = null;
  formData.location.longitude = null;

  formData.profil.namaDesa = "";
  formData.profil.jumlahPenduduk = "";
  formData.profil.jumlahKK = "";
  formData.profil.jumlahRumah = "";

  formData.perniagaan = ensureFacilityItems();
  formData.pelayananUmum = ensureFacilityItems();
  formData.pendidikan = ensureFacilityItems();
  formData.kesehatan = ensureFacilityItems();
  formData.peribadatan = ensureFacilityItems();
  formData.rekreasi = ensureFacilityItems();
  formData.pemakaman = ensureFacilityItems();
  formData.pertamanan = ensureFacilityItems();
  formData.parkir = ensureFacilityItems();

  formData.jaringanListrik.tercakupSeluruhWilayah = false;
  formData.jaringanListrik.wilayahBelumTerjangkau = "";
  formData.jaringanAirBersih.jumlahSPAM = "";
  formData.jaringanTelepon.jumlahOperator = "";
  formData.jaringanTelepon.wilayahBelumTerjangkau = "";
  formData.jaringanGas.jumlahAgenGas = "";
  formData.jaringanTransportasi.layananAngkutanUmum = [];
  formData.jaringanTransportasi.layananLainnya = "";
  formData.pemadamKebakaran.mobilDamkar = "";
  formData.pemadamKebakaran.pengelola = "";
  formData.pemadamKebakaran.APAR = "";
  formData.peneranganJalan.jumlahLampuJalan = "";

  // Reset location options
  regencyOptions.value = [];
  districtOptions.value = [];
  villageOptions.value = [];

  currentStep.value = 1;
  errorMessage.value = "";
  locationSelectError.value = "";
  locationSyncMessage.value = "";
  locationSyncType.value = "info";
  locationPickerOpen.value = false;
  locationPickerLat.value = null;
  locationPickerLng.value = null;
  locationLoading.isSyncing = false;
  isProgrammaticLocationSync.value = false;
  formRef.value?.resetValidation();
};

// Lifecycle
onMounted(async () => {
  await fetchProvinces();
  if (isEditMode.value) {
    await loadSurveyForEdit();
  }
});
</script>

<style scoped>
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
