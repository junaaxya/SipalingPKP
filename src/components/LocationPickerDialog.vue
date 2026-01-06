<template>
  <v-dialog v-model="dialogOpen" max-width="900" persistent>
    <v-card class="location-dialog-card">
      <v-card-title
        class="text-subtitle-1 d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between gap-3 pa-4"
      >
        <span class="font-weight-bold">{{ title }}</span>

        <div
          class="location-gps-actions p-2 rounded-lg d-flex align-center justify-space-between justify-sm-end w-100 w-sm-auto"
          style="background: rgba(var(--v-theme-primary), 0.05)"
        >
          <span
            class="location-gps-label text-caption mr-2 text-medium-emphasis"
          >
            Sesuaikan lokasi ke titik koordinat Anda saat ini
          </span>
          <v-btn
            icon
            size="small"
            color="primary"
            variant="tonal"
            :loading="isLocating"
            @click="getCurrentLocation"
          >
            <v-icon size="20">mdi-crosshairs-gps</v-icon>
            <v-tooltip activator="parent" location="top">
              Gunakan lokasi saat ini
            </v-tooltip>
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text>
        <div class="location-dialog-body">
          <div ref="mapRef" class="location-map" />
          <div class="location-coordinates">
            <v-text-field
              v-model="latValue"
              label="Latitude"
              variant="outlined"
              readonly
              hide-details="auto"
            />
            <v-text-field
              v-model="lngValue"
              label="Longitude"
              variant="outlined"
              readonly
              hide-details="auto"
            />
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="handleCancel"> Batal </v-btn>
        <v-btn color="primary" variant="flat" @click="handleConfirm">
          Simpan Lokasi
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick, onBeforeUnmount } from "vue";
import * as L from "leaflet";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  title: {
    type: String,
    default: "Pilih Lokasi",
  },
  defaultCenter: {
    type: Object,
    default: () => ({
      lat: -2.2,
      lng: 106.1,
    }),
  },
  defaultZoom: {
    type: Number,
    default: 11,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "update:latitude",
  "update:longitude",
  "confirm",
]);

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const mapRef = ref(null);
const latValue = ref("");
const lngValue = ref("");
const isLocating = ref(false);
const lastAccuracy = ref(null);

let mapInstance = null;
let marker = null;
let accuracyCircle = null;

const parseNumber = (value) => {
  const parsed =
    typeof value === "string" ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveInitialLatLng = () => {
  const lat = parseNumber(props.latitude);
  const lng = parseNumber(props.longitude);
  if (lat !== null && lng !== null) {
    return { lat, lng };
  }
  return { ...props.defaultCenter };
};

const updateLatLngDisplay = (lat, lng) => {
  latValue.value = lat?.toFixed ? lat.toFixed(6) : `${lat || ""}`;
  lngValue.value = lng?.toFixed ? lng.toFixed(6) : `${lng || ""}`;
};

const setMarkerPosition = (lat, lng, shouldPan = true) => {
  if (!marker || !mapInstance) return;
  marker.setLatLng([lat, lng]);
  if (shouldPan) {
    mapInstance.panTo([lat, lng]);
  }
  updateLatLngDisplay(lat, lng);
  emit("update:latitude", lat);
  emit("update:longitude", lng);
  if (lastAccuracy.value) {
    updateAccuracyCircle(lat, lng, lastAccuracy.value);
  }
};

const updateAccuracyCircle = (lat, lng, accuracy) => {
  if (!mapInstance) return;
  if (!Number.isFinite(accuracy) || accuracy <= 0) {
    if (accuracyCircle) {
      mapInstance.removeLayer(accuracyCircle);
      accuracyCircle = null;
    }
    return;
  }

  if (!accuracyCircle) {
    accuracyCircle = L.circle([lat, lng], {
      radius: accuracy,
      color: "#2563eb",
      weight: 1,
      fillColor: "#3b82f6",
      fillOpacity: 0.18,
      interactive: false,
    }).addTo(mapInstance);
  } else {
    accuracyCircle.setLatLng([lat, lng]);
    accuracyCircle.setRadius(accuracy);
  }
};

// Use high-accuracy GPS to position marker and draw accuracy radius.
const getCurrentLocation = () => {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    console.warn("Browser tidak mendukung geolokasi.");
    return;
  }

  isLocating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      lastAccuracy.value = Number.isFinite(accuracy) ? accuracy : null;
      setMarkerPosition(latitude, longitude, true);
      updateAccuracyCircle(latitude, longitude, lastAccuracy.value);
      isLocating.value = false;
    },
    (error) => {
      console.error("Gagal mengambil lokasi:", error);
      isLocating.value = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

const initMap = async () => {
  await nextTick();
  if (!mapRef.value || mapInstance) return;

  const { lat, lng } = resolveInitialLatLng();
  updateLatLngDisplay(lat, lng);

  mapInstance = L.map(mapRef.value, {
    center: [lat, lng],
    zoom: props.defaultZoom,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mapInstance);

  marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstance);
  marker.on("dragend", () => {
    const position = marker.getLatLng();
    setMarkerPosition(position.lat, position.lng, false);
  });

  mapInstance.on("click", (event) => {
    setMarkerPosition(event.latlng.lat, event.latlng.lng);
  });

  setTimeout(() => {
    mapInstance?.invalidateSize();
  }, 50);
};

const destroyMap = () => {
  if (mapInstance) {
    if (accuracyCircle) {
      mapInstance.removeLayer(accuracyCircle);
      accuracyCircle = null;
    }
    mapInstance.remove();
    mapInstance = null;
    marker = null;
  }
};

const handleCancel = () => {
  dialogOpen.value = false;
};

const handleConfirm = () => {
  const lat = parseNumber(latValue.value);
  const lng = parseNumber(lngValue.value);
  emit("confirm", { latitude: lat, longitude: lng });
  dialogOpen.value = false;
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      initMap();
    } else {
      destroyMap();
    }
  }
);

watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    const parsedLat = parseNumber(lat);
    const parsedLng = parseNumber(lng);
    if (parsedLat !== null && parsedLng !== null) {
      setMarkerPosition(parsedLat, parsedLng);
    }
  }
);

onBeforeUnmount(() => {
  destroyMap();
});
</script>

<style scoped>
.location-dialog-card {
  overflow: hidden;
}

.location-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.location-map {
  width: 100%;
  height: 360px;
  border-radius: 12px;
}

.location-coordinates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.location-gps-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-gps-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  text-align: right;
  max-width: 260px;
}

@media (max-width: 600px) {
  .location-gps-actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .location-gps-label {
    max-width: 100%;
  }
}
</style>
