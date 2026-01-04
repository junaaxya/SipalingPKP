import { defineStore } from 'pinia'
import { locationService } from '@/services/api'

const CATEGORY_LABELS = {
  desa: 'Desa',
  kecamatan: 'Kecamatan',
  kabupaten: 'Kabupaten'
}

const SEARCH_INDEX_CACHE_KEY = 'sipaling-search-index-v1'
const SEARCH_INDEX_CACHE_TTL = 24 * 60 * 60 * 1000
const LOG_ENDPOINT = import.meta.env.VITE_CLIENT_LOG_ENDPOINT

const normalizeCategory = (value) => {
  const raw = String(value || '').toLowerCase()
  if (raw.includes('desa') || raw.includes('kelurahan')) {
    return 'desa'
  }
  if (raw.includes('kecamatan')) {
    return 'kecamatan'
  }
  if (raw.includes('kabupaten') || raw.includes('kota')) {
    return 'kabupaten'
  }
  return 'desa'
}

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseCoordinates = (entry) => {
  const centroid = entry?.centroid
    || entry?.coordinates
    || entry?.coord
    || entry?.center
    || entry?.location
    || entry?.coords

  if (Array.isArray(centroid) && centroid.length >= 2) {
    const first = toNumber(centroid[0])
    const second = toNumber(centroid[1])
    if (first !== null && second !== null) {
      const firstAbs = Math.abs(first)
      const secondAbs = Math.abs(second)

      if (firstAbs <= 90 && secondAbs > 90) {
        return { lat: first, lng: second }
      }
      if (firstAbs > 90 && secondAbs <= 90) {
        return { lat: second, lng: first }
      }

      return { lat: second, lng: first }
    }
  }

  if (typeof centroid === 'string') {
    const parts = centroid.split(',').map((part) => part.trim())
    if (parts.length >= 2) {
      const lat = toNumber(parts[0])
      const lng = toNumber(parts[1])
      if (lat !== null && lng !== null) {
        return { lat, lng }
      }
    }
  }

  const lat = toNumber(entry?.lat ?? entry?.latitude ?? centroid?.lat ?? centroid?.latitude)
  const lng = toNumber(entry?.lng ?? entry?.lon ?? entry?.longitude ?? centroid?.lng ?? centroid?.lon ?? centroid?.longitude)
  if (lat !== null && lng !== null) {
    return { lat, lng }
  }

  return null
}

const normalizeEntry = (entry, index) => {
  if (!entry) {
    return null
  }

  const name = entry.name || entry.nama || entry.desa || entry.kecamatan || entry.kabupaten || entry.title
  if (!name) {
    return null
  }

  const categoryKey = normalizeCategory(entry.category || entry.type || entry.level || entry.jenis)
  const coords = parseCoordinates(entry)
  if (!coords) {
    return null
  }

  const zoom = toNumber(entry?.zoom)
  const parent = entry?.parent || entry?.parentName || entry?.parent_name

  return {
    id: entry.id || `${categoryKey}-${name}-${index}`,
    name,
    category: categoryKey,
    categoryLabel: CATEGORY_LABELS[categoryKey] || 'Desa',
    parent,
    lat: coords.lat,
    lng: coords.lng,
    zoom: zoom ?? undefined
  }
}

const extractDataArray = (response) => {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items
  }

  if (Array.isArray(response?.items)) {
    return response.items
  }

  return []
}

const readCachedSearchIndex = () => {
  try {
    const raw = localStorage.getItem(SEARCH_INDEX_CACHE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed?.timestamp || !Array.isArray(parsed?.data)) {
      return null
    }

    if (Date.now() - parsed.timestamp > SEARCH_INDEX_CACHE_TTL) {
      return null
    }

    return parsed.data
  } catch (error) {
    return null
  }
}

const writeCachedSearchIndex = (data) => {
  try {
    const payload = {
      timestamp: Date.now(),
      data
    }
    localStorage.setItem(SEARCH_INDEX_CACHE_KEY, JSON.stringify(payload))
  } catch (error) {
    // Ignore cache write errors (private mode/quota)
  }
}

const logClientError = async (payload) => {
  if (!LOG_ENDPOINT) {
    return
  }

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    })
  } catch (error) {
    // Ignore logging failures
  }
}

export const useMapUiStore = defineStore('mapUi', {
  state: () => ({
    searchIndex: [],
    searchIndexLoaded: false,
    searchIndexLoading: false,
    searchIndexError: null,
    lastSearchQuery: '',
    lastSearchSelection: null,
    isPrinting: false,
    mapResizeToken: 0
  }),
  actions: {
    signalMapResize() {
      this.mapResizeToken = Date.now()
    },
    async loadSearchIndex() {
      if (this.searchIndexLoaded || this.searchIndexLoading) {
        return
      }

      const cached = readCachedSearchIndex()
      if (cached && cached.length) {
        this.searchIndex = cached
        this.searchIndexLoaded = true
        this.searchIndexError = null
        return
      }

      this.searchIndexLoading = true
      this.searchIndexError = null

      try {
        const response = await locationService.getSearchIndex()
        const rawEntries = extractDataArray(response)
        const normalized = rawEntries
          .map((entry, index) => normalizeEntry(entry, index))
          .filter(Boolean)

        this.searchIndex = normalized
        this.searchIndexLoaded = true
        if (normalized.length) {
          writeCachedSearchIndex(normalized)
        }
      } catch (error) {
        this.searchIndexError = error?.message || 'Gagal memuat indeks pencarian.'
        this.searchIndex = []
        console.error('Failed to load search index:', error)
        await logClientError({
          type: 'search-index',
          message: this.searchIndexError,
          error: error?.message || String(error),
          at: new Date().toISOString()
        })
      } finally {
        this.searchIndexLoading = false
      }
    },
    setSearchQuery(query) {
      this.lastSearchQuery = query || ''
    },
    setSearchSelection(selection) {
      this.lastSearchSelection = selection
    },
    setPrinting(isPrinting) {
      this.isPrinting = Boolean(isPrinting)
    }
  }
})
