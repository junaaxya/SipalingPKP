// Utilities
import { defineStore } from 'pinia'
import { housingAPI } from '@/services'

const HOUSING_FORM_DRAFT_KEY = 'housing-form-draft'

export const useHousingStore = defineStore('housing', {
  state: () => ({
    // Form submissions
    submissions: [],
    currentSubmission: null,
    isLoading: false,
    error: null,
    
    // Pagination
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 20,
      hasNextPage: false,
      hasPrevPage: false,
    },
    
    // Filters
    filters: {
      status: null,
      villageId: null,
      districtId: null,
      regencyId: null,
      provinceId: null,
      createdBy: null,
    },
  }),

  getters: {
    // Get submissions by status
    submissionsByStatus: (state) => (status) => {
      return state.submissions.filter(submission => submission.status === status)
    },

    // Get submission count by status
    submissionCounts: (state) => {
      const counts = {}
      state.submissions.forEach(submission => {
        counts[submission.status] = (counts[submission.status] || 0) + 1
      })
      return counts
    },

    // Check if user can review submissions
    canReview: () => {
      // This would typically check user permissions from the auth store
      return true // Placeholder
    },
  },

  actions: {
    saveDraft(draftData) {
      try {
        if (!draftData || typeof draftData !== 'object') return
        localStorage.setItem(HOUSING_FORM_DRAFT_KEY, JSON.stringify({
          savedAt: new Date().toISOString(),
          data: draftData
        }))
      } catch (error) {
        console.error('Failed to save housing draft:', error)
      }
    },

    loadDraft() {
      try {
        const raw = localStorage.getItem(HOUSING_FORM_DRAFT_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed?.data || null
      } catch (error) {
        console.error('Failed to load housing draft:', error)
        return null
      }
    },

    clearDraft() {
      try {
        localStorage.removeItem(HOUSING_FORM_DRAFT_KEY)
      } catch (error) {
        console.error('Failed to clear housing draft:', error)
      }
    },
    // Submit housing form
    async submitForm(formData) {
      this.isLoading = true
      this.error = null

      try {
        const response = await housingAPI.submitForm(formData)
        
        if (response.success) {
          return { success: true, submissionId: response.data.submissionId }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        this.error = error.message || 'Form submission failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Get form submissions
    async getSubmissions(params = {}) {
      this.isLoading = true
      this.error = null

      try {
        const queryParams = {
          page: this.pagination.currentPage,
          limit: this.pagination.itemsPerPage,
          ...this.filters,
          ...params,
        }

        const response = await housingAPI.getSubmissions(queryParams)
        
        if (response.success) {
          // Handle actual API response structure
          this.submissions = response.data.submissions.rows || []
          
          // Map pagination structure to match expected format
          const apiPagination = response.data.pagination
          this.pagination = {
            currentPage: apiPagination.page || 1,
            totalPages: apiPagination.pages || 0,
            totalItems: apiPagination.total || 0,
            itemsPerPage: apiPagination.limit || 20,
            hasNextPage: apiPagination.hasNext || false,
            hasPrevPage: apiPagination.hasPrev || false
          }
          
          return { success: true, submissions: this.submissions }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch submissions'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Get specific submission
    async getSubmission(submissionId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await housingAPI.getSubmission(submissionId)
        
        if (response.success) {
          // Handle response structure: { success: true, data: { submission: {...} } }
          const submission = response.data?.submission || response.data
          this.currentSubmission = submission
          return { success: true, submission }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch submission'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async getSubmissionHistoryByOwner(ownerId) {
      if (!ownerId) {
        return { success: false, error: 'Household owner ID tidak tersedia' }
      }

      try {
        const response = await housingAPI.getSubmissionHistoryByOwner(ownerId)
        if (response.success) {
          const history = response.data?.history || response.data || []
          return { success: true, history }
        }

        const message = response.message || 'Gagal memuat riwayat survei'
        return { success: false, error: message }
      } catch (error) {
        const message = error.message || 'Gagal memuat riwayat survei'
        const normalized = String(message).toLowerCase()
        if (normalized.includes('route get') || normalized.includes('not found')) {
          return { success: true, history: [] }
        }
        return { success: false, error: message }
      }
    },

    // Review submission
    async reviewSubmission(submissionId, reviewData) {
      this.isLoading = true
      this.error = null

      try {
        const response = await housingAPI.reviewSubmission(submissionId, reviewData)
        
        if (response.success) {
          const updated = response.data?.submission || response.data
          // Update the submission in the list
          const index = this.submissions.findIndex(sub => sub.id === submissionId)
          if (index !== -1 && updated) {
            this.submissions[index] = updated
          }
          
          // Update current submission if it's the same
          if (this.currentSubmission?.id === submissionId && updated) {
            this.currentSubmission = updated
          }
          
          return { success: true, submission: updated }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        this.error = error.message || 'Failed to review submission'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Update submission (verifier edit)
    async updateSubmission(submissionId, payload) {
      this.isLoading = true
      this.error = null

      try {
        const response = await housingAPI.updateSubmission(submissionId, payload)

        if (response.success) {
          const updated = response.data?.submission || response.data

          const index = this.submissions.findIndex(sub => sub.id === submissionId)
          if (index !== -1 && updated) {
            this.submissions[index] = updated
          }

          if (this.currentSubmission?.id === submissionId && updated) {
            this.currentSubmission = updated
          }

          return { success: true, submission: updated }
        }

        this.error = response.message
        return { success: false, error: response.message }
      } catch (error) {
        this.error = error.message || 'Failed to update submission'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Update own submission (masyarakat)
    async updateOwnSubmission(submissionId, payload) {
      this.isLoading = true
      this.error = null

      try {
        const response = await housingAPI.updateOwnSubmission(submissionId, payload)

        if (response.success) {
          const updated = response.data?.submission || response.data

          const index = this.submissions.findIndex(sub => sub.id === submissionId)
          if (index !== -1 && updated) {
            this.submissions[index] = updated
          }

          if (this.currentSubmission?.id === submissionId && updated) {
            this.currentSubmission = updated
          }

          return { success: true, submission: updated }
        }

        this.error = response.message
        return { success: false, error: response.message }
      } catch (error) {
        this.error = error.message || 'Failed to update submission'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Set pagination
    setPagination(page) {
      this.pagination.currentPage = page
    },

    // Set filters
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.currentPage = 1 // Reset to first page when filters change
    },

    // Clear filters
    clearFilters() {
      this.filters = {
        status: null,
        villageId: null,
        districtId: null,
        regencyId: null,
        provinceId: null,
        isLivable: null,
        createdBy: null,
      }
      this.pagination.currentPage = 1
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Clear current submission
    clearCurrentSubmission() {
      this.currentSubmission = null
    },
  },
})
