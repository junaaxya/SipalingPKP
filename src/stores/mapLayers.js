import { defineStore } from 'pinia'
import { locationService } from '@/services/api'
import { facilityAPI } from '@/services'

const GEOJSON_CACHE_PREFIX = 'sipaling-geojson-v1'
const GEOJSON_CACHE_TTL = 24 * 60 * 60 * 1000
const GEOJSON_CACHE_MAX_CHARS = 2500000
const LAYER_FETCH_DEBOUNCE = 250
const pendingLayerTimers = new Map()

const createLayer = (id, label, filename = id, options = {}) => ({
  id,
  label,
  filename,
  active: false,
  loading: false,
  error: null,
  source: options.source || 'geojson'
})

const getCacheKey = (categoryKey, layerId) => `${GEOJSON_CACHE_PREFIX}:${categoryKey}:${layerId}`

const readLayerCache = (categoryKey, layerId) => {
  try {
    const raw = localStorage.getItem(getCacheKey(categoryKey, layerId))
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed?.timestamp || !parsed?.data) {
      return null
    }

    if (Date.now() - parsed.timestamp > GEOJSON_CACHE_TTL) {
      return null
    }

    return parsed.data
  } catch (error) {
    return null
  }
}

const writeLayerCache = (categoryKey, layerId, data) => {
  try {
    const payload = {
      timestamp: Date.now(),
      data
    }

    const serialized = JSON.stringify(payload)
    if (serialized.length > GEOJSON_CACHE_MAX_CHARS) {
      return
    }

    localStorage.setItem(getCacheKey(categoryKey, layerId), serialized)
  } catch (error) {
    // Ignore cache write errors (quota/private mode)
  }
}

export const useMapLayersStore = defineStore('mapLayers', {
  state: () => ({
    availableLayers: {
      administrasi: {
        label: 'Administrasi',
        layers: [
          createLayer('batas_desa', 'Batas Desa'),
          createLayer('batas_kecamatan', 'Batas Kecamatan'),
          createLayer('batas_kabupaten', 'Batas Kabupaten')
        ]
      },
      infrastruktur: {
        label: 'Infrastruktur',
        layers: [
          createLayer('infrastruktur_desa', 'Infrastruktur Desa', null, { source: 'facility' }),
          createLayer('jalan_jalan_lokal', 'Jalan Lokal'),
          createLayer('jalan_kolektor_primer_1', 'Jalan Kolektor Primer 1'),
          createLayer('jalan_kolektor_primer_2', 'Jalan Kolektor Primer 2')
        ]
      },
      tata_ruang: {
        label: 'Tata Ruang',
        layers: [
          createLayer('rtrw_hutan_konservasi', 'Hutan Konservasi'),
          createLayer('rtrw_hutan_lindung', 'Hutan Lindung'),
          createLayer('rtrw_hutan_produksi', 'Hutan Produksi'),
          createLayer('rtrw_kawasan_lindung_darat', 'Kawasan Lindung Darat'),
          createLayer('rtrw_kawasan_lindung_resapan_air', 'Resapan Air'),
          createLayer('rtrw_kawasan_rawan_erosi_dan_tanah_longsor', 'Rawan Erosi & Longsor'),
          createLayer('rtrw_sempadan_danau', 'Sempadan Danau'),
          createLayer('rtrw_sempadan_pantai', 'Sempadan Pantai'),
          createLayer('rtrw_sempadan_sungai', 'Sempadan Sungai')
        ]
      },
      bencana: {
        label: 'Bencana',
        layers: [
          createLayer('banjir_bandang_tinggi', 'Banjir Bandang Tinggi', 'krb_banjir_bandang_tinggi'),
          createLayer('banjir_tinggi', 'Banjir Tinggi', 'krb_banjir_tinggi'),
          createLayer('cuaca_ekstrem_tinggi', 'Cuaca Ekstrem Tinggi', 'krb_cuaca_ekstrem_tinggi'),
          createLayer('gelombang_abrasi_tinggi', 'Gelombang Abrasi Tinggi', 'krb_gelombang_abrasi_tinggi'),
          createLayer('kebakaran_hutan_tinggi', 'Kebakaran Hutan Tinggi', 'krb_kebakaran_hutan_tinggi'),
          createLayer('kekeringan_tinggi', 'Kekeringan Tinggi', 'krb_kekeringan_tinggi'),
          createLayer('tanah_longsor_tinggi', 'Tanah Longsor Tinggi', 'krb_tanah_longsor_tinggi')
        ]
      }
    },
    loadedData: {
      administrasi: {},
      infrastruktur: {},
      tata_ruang: {},
      bencana: {}
    }
  }),
  getters: {
    activeLayers: (state) => {
      const result = []
      Object.entries(state.availableLayers).forEach(([categoryKey, category]) => {
        category.layers.forEach((layer) => {
          if (layer.active) {
            result.push({
              category: categoryKey,
              ...layer,
              data: state.loadedData[categoryKey]?.[layer.id] || null
            })
          }
        })
      })
      return result
    }
  },
  actions: {
    async loadLayerData(categoryKey, layerId) {
      const category = this.availableLayers[categoryKey]
      if (!category) {
        return null
      }

      const layer = category.layers.find((item) => item.id === layerId)
      if (!layer) {
        return null
      }

      if (layer.source === 'facility') {
        return this.fetchInfrastruktur(categoryKey, layerId)
      }

      if (this.loadedData[categoryKey]?.[layer.id]) {
        return this.loadedData[categoryKey][layer.id]
      }

      const layerKey = `${categoryKey}:${layer.id}`
      const pendingTimer = pendingLayerTimers.get(layerKey)
      if (pendingTimer) {
        clearTimeout(pendingTimer)
        pendingLayerTimers.delete(layerKey)
      }

      layer.loading = true
      layer.error = null

      const cached = readLayerCache(categoryKey, layer.id)
      if (cached) {
        if (!this.loadedData[categoryKey]) {
          this.loadedData[categoryKey] = {}
        }
        this.loadedData[categoryKey][layer.id] = cached
        layer.loading = false
        return cached
      }

      try {
        const response = await locationService.getGeoJSON(categoryKey, layer.filename || layer.id)
        if (response?.success === false) {
          throw new Error(response.message || 'Failed to load GeoJSON layer')
        }

        const payload = response?.data ?? response
        if (!payload) {
          throw new Error('Empty GeoJSON response')
        }

        if (!this.loadedData[categoryKey]) {
          this.loadedData[categoryKey] = {}
        }

        this.loadedData[categoryKey][layer.id] = payload
        writeLayerCache(categoryKey, layer.id, payload)
        return payload
      } catch (error) {
        layer.error = error?.message || 'Failed to load GeoJSON layer'
        console.error(`Failed to load GeoJSON layer ${categoryKey}/${layer.id}:`, error)
        return null
      } finally {
        layer.loading = false
      }
    },
    async toggleLayer(categoryKey, layerId) {
      const category = this.availableLayers[categoryKey]
      if (!category) {
        return
      }

      const layer = category.layers.find((item) => item.id === layerId)
      if (!layer) {
        return
      }

      const shouldActivate = !layer.active
      layer.active = shouldActivate

      if (!shouldActivate) {
        const layerKey = `${categoryKey}:${layer.id}`
        const pendingTimer = pendingLayerTimers.get(layerKey)
        if (pendingTimer) {
          clearTimeout(pendingTimer)
          pendingLayerTimers.delete(layerKey)
        }
        layer.loading = false
        return
      }

      if (layer.source === 'facility') {
        await this.fetchInfrastruktur(categoryKey, layerId)
        return
      }

      if (this.loadedData[categoryKey]?.[layer.id]) {
        return
      }

      layer.loading = true
      layer.error = null

      const layerKey = `${categoryKey}:${layer.id}`
      if (pendingLayerTimers.has(layerKey)) {
        return
      }

      const timer = setTimeout(async () => {
        pendingLayerTimers.delete(layerKey)

        if (!layer.active) {
          layer.loading = false
          return
        }

        const cached = readLayerCache(categoryKey, layer.id)
        if (cached) {
          if (!this.loadedData[categoryKey]) {
            this.loadedData[categoryKey] = {}
          }
          this.loadedData[categoryKey][layer.id] = cached
          layer.loading = false
          return
        }

        try {
          const response = await locationService.getGeoJSON(categoryKey, layer.filename || layer.id)
          if (response?.success === false) {
            throw new Error(response.message || 'Failed to load GeoJSON layer')
          }

          const payload = response?.data ?? response
          if (!payload) {
            throw new Error('Empty GeoJSON response')
          }

          if (!this.loadedData[categoryKey]) {
            this.loadedData[categoryKey] = {}
          }

          this.loadedData[categoryKey][layer.id] = payload
          writeLayerCache(categoryKey, layer.id, payload)
        } catch (error) {
          layer.active = false
          layer.error = error?.message || 'Failed to load GeoJSON layer'
          console.error(`Failed to load GeoJSON layer ${categoryKey}/${layer.id}:`, error)
        } finally {
          layer.loading = false
        }
      }, LAYER_FETCH_DEBOUNCE)

      pendingLayerTimers.set(layerKey, timer)
    },
    async fetchInfrastruktur(categoryKey, layerId) {
      const category = this.availableLayers[categoryKey]
      if (!category) {
        return null
      }

      const layer = category.layers.find((item) => item.id === layerId)
      if (!layer) {
        return null
      }

      if (this.loadedData[categoryKey]?.[layer.id]) {
        return this.loadedData[categoryKey][layer.id]
      }

      layer.loading = true
      layer.error = null

      try {
        const response = await facilityAPI.getSurveys({
          page: 1,
          limit: 1000,
          format: 'geojson'
        })

        const payload = response?.data ?? response
        if (!payload) {
          throw new Error('Empty infrastructure response')
        }

        if (!this.loadedData[categoryKey]) {
          this.loadedData[categoryKey] = {}
        }

        this.loadedData[categoryKey][layer.id] = payload
        return payload
      } catch (error) {
        layer.active = false
        layer.error = error?.message || 'Failed to load infrastructure'
        console.error('Failed to load infrastructure layer:', error)
        return null
      } finally {
        layer.loading = false
      }
    }
  }
})
