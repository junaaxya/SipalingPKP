import { defineStore } from "pinia";
import { locationService } from "@/services/api";
import { facilityAPI } from "@/services";

const createLayer = (id, label, filename = id, options = {}) => ({
  id,
  label,
  filename,
  active: false,
  loading: false,
  error: null,
  source: options.source || "geojson",
});

const getLayerEntry = (store, categoryKey, layerId) => {
  const category = store.availableLayers[categoryKey];
  if (!category) {
    return null;
  }

  const layer = category.layers.find((item) => item.id === layerId);
  if (!layer) {
    return null;
  }

  return { category, layer };
};

const ensureLoadedCategory = (store, categoryKey) => {
  if (!store.loadedData[categoryKey]) {
    store.loadedData[categoryKey] = {};
  }
};

const setLayerData = (store, categoryKey, layerId, data) => {
  ensureLoadedCategory(store, categoryKey);
  store.loadedData[categoryKey][layerId] = data;
};

const fetchGeojsonLayer = async (store, categoryKey, layer) => {
  const response = await locationService.getGeoJSON(
    categoryKey,
    layer.filename || layer.id
  );
  if (response?.success === false) {
    throw new Error(response.message || "Failed to load GeoJSON layer");
  }

  const payload = response?.data ?? response;
  if (!payload) {
    throw new Error("Empty GeoJSON response");
  }

  setLayerData(store, categoryKey, layer.id, payload);
  return payload;
};

const fetchFacilityLayer = async (store, categoryKey, layer) => {
  const response = await facilityAPI.getSurveys({
    page: 1,
    limit: 1000,
    format: "geojson",
  });

  const payload = response?.data ?? response;
  if (!payload) {
    throw new Error("Empty infrastructure response");
  }

  setLayerData(store, categoryKey, layer.id, payload);
  return payload;
};

export const useMapLayersStore = defineStore("mapLayers", {
  state: () => ({
    availableLayers: {
      administrasi: {
        label: "Administrasi",
        layers: [
          createLayer("batas_desa", "Batas Desa"),
          createLayer("batas_kecamatan", "Batas Kecamatan"),
          createLayer("batas_kabupaten", "Batas Kabupaten"),
        ],
      },
      infrastruktur: {
        label: "Infrastruktur",
        layers: [
          createLayer("jalan_jalan_lokal", "Jalan Lokal"),
          createLayer("jalan_kolektor_primer_1", "Jalan Kolektor Primer 1"),
          createLayer("jalan_kolektor_primer_2", "Jalan Kolektor Primer 2"),
        ],
      },
      tata_ruang: {
        label: "Tata Ruang",
        layers: [
          createLayer("rtrw_hutan_konservasi", "Hutan Konservasi"),
          createLayer("rtrw_hutan_lindung", "Hutan Lindung"),
          createLayer("rtrw_hutan_produksi", "Hutan Produksi"),
          createLayer("rtrw_kawasan_lindung_resapan_air", "Resapan Air"),
          createLayer(
            "rtrw_kawasan_rawan_erosi_dan_tanah_longsor",
            "Rawan Erosi & Longsor"
          ),
          createLayer("rtrw_sempadan_danau", "Sempadan Danau"),
          createLayer("rtrw_sempadan_pantai", "Sempadan Pantai"),
          createLayer("rtrw_sempadan_sungai", "Sempadan Sungai"),
        ],
      },
      bencana: {
        label: "Bencana",
        layers: [
          createLayer(
            "banjir_bandang_tinggi",
            "Banjir Bandang Tinggi",
            "banjir_bandang_tinggi"
          ),
          createLayer("banjir_tinggi", "Banjir Tinggi", "banjir_tinggi"),
          createLayer(
            "cuaca_ekstrem_tinggi",
            "Cuaca Ekstrem Tinggi",
            "cuaca_ekstrem_tinggi"
          ),
          createLayer(
            "gelombang_abrasi_tinggi",
            "Gelombang Abrasi Tinggi",
            "gelombang_abrasi_tinggi"
          ),
          createLayer(
            "kebakaran_hutan_tinggi",
            "Kebakaran Hutan Tinggi",
            "kebakaran_hutan_tinggi"
          ),
          createLayer(
            "kekeringan_tinggi",
            "Kekeringan Tinggi",
            "kekeringan_tinggi"
          ),
          createLayer(
            "tanah_longsor_tinggi",
            "Tanah Longsor Tinggi",
            "tanah_longsor_tinggi"
          ),
        ],
      },
    },
    loadedData: {
      administrasi: {},
      infrastruktur: {},
      tata_ruang: {},
      bencana: {},
    },
    highlightedFeatureId: null,
  }),
  getters: {
    activeLayers: (state) => {
      const result = [];
      Object.entries(state.availableLayers).forEach(
        ([categoryKey, category]) => {
          category.layers.forEach((layer) => {
            if (layer.active) {
              result.push({
                category: categoryKey,
                ...layer,
                data: state.loadedData[categoryKey]?.[layer.id] || null,
              });
            }
          });
        }
      );
      return result;
    },
  },
  actions: {
    async loadLayerData(categoryKey, layerId) {
      const entry = getLayerEntry(this, categoryKey, layerId);
      if (!entry) {
        return null;
      }

      const { layer } = entry;
      if (this.loadedData[categoryKey]?.[layer.id]) {
        return this.loadedData[categoryKey][layer.id];
      }

      layer.loading = true;
      layer.error = null;

      try {
        if (layer.source === "facility") {
          return await fetchFacilityLayer(this, categoryKey, layer);
        }
        return await fetchGeojsonLayer(this, categoryKey, layer);
      } catch (error) {
        layer.error = error?.message || "Failed to load GeoJSON layer";
        console.error(
          `Failed to load GeoJSON layer ${categoryKey}/${layer.id}:`,
          error
        );
        return null;
      } finally {
        layer.loading = false;
      }
    },
    async toggleLayer(categoryKey, layerId) {
      console.log("Toggling layer:", categoryKey, layerId);
      const entry = getLayerEntry(this, categoryKey, layerId);
      if (!entry) {
        console.error("Layer not found in store:", layerId); // Jika ini muncul, berarti ID salah
        return;
      }

      const { layer } = entry;
      const shouldActivate = !layer.active;
      layer.active = shouldActivate;

      if (!shouldActivate) {
        return;
      }

      if (this.loadedData[categoryKey]?.[layer.id]) {
        return;
      }

      try {
        await this.loadLayerData(categoryKey, layer.id);
      } catch (error) {
        layer.active = false;
      }
    },
    setHighlight(id) {
      this.highlightedFeatureId = id;
    },

    // Fungsi untuk menghapus tanda
    clearHighlight() {
      this.highlightedFeatureId = null;
    },
  },
});
