import { defineStore } from 'pinia'
import { housingAPI, facilityAPI, housingDevelopmentAPI } from '@/services'

const DEFAULT_FILTERS = {
  housing: true,
  'housing-development': true,
  infrastruktur: false
}

const DEFAULT_DATA_STATE = {
  housing: null,
  'housing-development': null,
  infrastruktur: null
}

const DEFAULT_LOADING_STATE = {
  housing: false,
  'housing-development': false,
  infrastruktur: false
}

const DEFAULT_ERROR_STATE = {
  housing: null,
  'housing-development': null,
  infrastruktur: null
}

const DEFAULT_APPROVED_STATUS = {
  housing: 'approved',
  'housing-development': 'approved',
  infrastruktur: 'approved'
}

export const useMapDataStore = defineStore('mapData', {
  state: () => ({
    filters: { ...DEFAULT_FILTERS },
    geojson: { ...DEFAULT_DATA_STATE },
    loading: { ...DEFAULT_LOADING_STATE },
    error: { ...DEFAULT_ERROR_STATE },
    refreshToken: 0
  }),
  getters: {
    activeFilters: (state) =>
      Object.entries(state.filters)
        .filter(([, active]) => active)
        .map(([key]) => key)
  },
  actions: {
    setFilters(activeList = []) {
      const active = new Set(activeList)
      Object.keys(this.filters).forEach((key) => {
        this.filters[key] = active.has(key)
      })
    },
    signalRefresh() {
      this.refreshToken += 1
    },
    async fetchHousing(params = {}) {
      this.loading.housing = true
      this.error.housing = null
      try {
        const response = await housingAPI.getSubmissions({
          page: 1,
          limit: 0,
          format: 'geojson',
          status: DEFAULT_APPROVED_STATUS.housing,
          ...params
        })
        this.geojson.housing = response?.data || null
      } catch (error) {
        this.error.housing = error?.message || 'Gagal memuat data rumah.'
      } finally {
        this.loading.housing = false
      }
    },
    async fetchHousingDevelopment(params = {}) {
      this.loading['housing-development'] = true
      this.error['housing-development'] = null
      try {
        const response = await housingDevelopmentAPI.getDevelopments({
          page: 1,
          limit: 0,
          format: 'geojson',
          status: DEFAULT_APPROVED_STATUS['housing-development'],
          ...params
        })
        this.geojson['housing-development'] = response?.data || null
      } catch (error) {
        this.error['housing-development'] =
          error?.message || 'Gagal memuat data perumahan.'
      } finally {
        this.loading['housing-development'] = false
      }
    },
    async fetchInfrastruktur(params = {}) {
      this.loading.infrastruktur = true
      this.error.infrastruktur = null
      try {
        const response = await facilityAPI.getSurveys({
          page: 1,
          limit: 0,
          format: 'geojson',
          status: DEFAULT_APPROVED_STATUS.infrastruktur,
          ...params
        })
        this.geojson.infrastruktur = response?.data || null
      } catch (error) {
        this.error.infrastruktur =
          error?.message || 'Gagal memuat data infrastruktur.'
      } finally {
        this.loading.infrastruktur = false
      }
    },
    async refreshActive(params = {}) {
      const active = this.activeFilters
      const tasks = []
      if (active.includes('housing')) {
        tasks.push(this.fetchHousing(params))
      }
      if (active.includes('housing-development')) {
        tasks.push(this.fetchHousingDevelopment(params))
      }
      if (active.includes('infrastruktur')) {
        tasks.push(this.fetchInfrastruktur(params))
      }
      await Promise.all(tasks)
    }
  }
})
