import api from './api.js'

// Authentication API services
export const authAPI = {
  // User registration
  signup: async (userData, options = {}) => {
    const headers = {}
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey
    }
    return await api.post('/auth/signup', userData, { headers })
  },

  // User login
  signin: async (credentials) => {
    return await api.post('/auth/signin', credentials)
  },

  // Verify OTP
  verifyOtp: async (payload) => {
    return await api.post('/auth/verify', payload)
  },

  // Resend OTP
  resendOtp: async (payload) => {
    return await api.post('/auth/resend-otp', payload)
  },

  // Reactivate inactive account (send OTP)
  reactivate: async (payload) => {
    return await api.post('/auth/reactivate', payload)
  },

  // Request password reset
  requestPasswordReset: async (payload) => {
    return await api.post('/auth/forgot-password', payload)
  },

  // Reset password with OTP or token
  resetPassword: async (payload) => {
    return await api.post('/auth/reset-password', payload)
  },

  // Get Google OAuth authorization URL
  getGoogleAuthUrl: async (redirectUrl = null) => {
    const params = redirectUrl ? { state: redirectUrl } : {}
    return await api.get('/auth/oauth/google', { params })
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    return await api.post('/auth/refresh', { refreshToken })
  },

  // User logout
  signout: async () => {
    return await api.post('/auth/signout')
  },
}

// User management API services
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return await api.get('/user/profile')
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return await api.put('/user/profile', profileData)
  },

  // Update user avatar
  updateProfileAvatar: async (formData) => {
    return await api.put('/user/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Update notification preferences
  updateNotificationPreferences: async (payload) => {
    return await api.put('/user/notification-preferences', payload)
  },

  // Change password
  changePassword: async (passwordData) => {
    return await api.post('/user/change-password', passwordData)
  },

  // Get user sessions
  getSessions: async () => {
    return await api.get('/user/sessions')
  },

  // Revoke session
  revokeSession: async (sessionId) => {
    return await api.delete(`/user/sessions/${sessionId}`)
  },

  // Revoke all sessions
  revokeAllSessions: async () => {
    return await api.post('/user/sessions/revoke-all')
  },

  // Update two-factor setting
  updateTwoFactor: async (payload) => {
    return await api.put('/user/two-factor', payload)
  },

  // Get user roles
  getRoles: async () => {
    return await api.get('/user/roles')
  },

  // Get audit logs
  getAuditLogs: async (params = {}) => {
    return await api.get('/user/audit-logs', { params })
  },

  // Super Admin - Create staff user
  createStaffUser: async (payload) => {
    return await api.post('/user/admin/users', payload)
  },

  // Super Admin - Update staff user
  updateStaffUser: async (userId, payload) => {
    return await api.put(`/user/admin/users/${userId}`, payload)
  },

  // Super Admin - Deactivate staff user
  deactivateUser: async (userId) => {
    return await api.delete(`/user/admin/users/${userId}`)
  },

  // Super Admin - Activate user
  activateUser: async (userId) => {
    return await api.put(`/user/${userId}/activate`)
  },

  // Super Admin - List users
  getStaffUsers: async (params = {}) => {
    return await api.get('/user/admin/users', { params })
  },
}

// Housing form API services
export const housingAPI = {
  // Submit housing form
  submitForm: async (formData) => {
    const isMultipart = typeof FormData !== 'undefined' && formData instanceof FormData
    const config = isMultipart
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
    return await api.post('/housing/submit', formData, config)
  },

  // Get form submissions
  getSubmissions: async (params = {}) => {
    return await api.get('/housing/submissions', { params })
  },

  // Get housing statistics
  getStatistics: async (params = {}) => {
    return await api.get('/housing/statistics', { params })
  },

  // Get specific form submission
  getSubmission: async (submissionId) => {
    return await api.get(`/housing/submissions/${submissionId}`)
  },

  // Get submission history by household owner
  getSubmissionHistoryByOwner: async (ownerId) => {
    return await api.get(`/housing/owners/${ownerId}/history`)
  },

  // Review form submission
  reviewSubmission: async (submissionId, reviewData) => {
    return await api.put(`/housing/submissions/${submissionId}/review`, reviewData)
  },

  // Update form submission (verifier edits)
  updateSubmission: async (submissionId, payload) => {
    const isMultipart = typeof FormData !== 'undefined' && payload instanceof FormData
    const config = isMultipart
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
    return await api.put(`/housing/submissions/${submissionId}/edit`, payload, config)
  },

  // Update own submission (masyarakat)
  updateOwnSubmission: async (submissionId, payload) => {
    const isMultipart = typeof FormData !== 'undefined' && payload instanceof FormData
    const config = isMultipart
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
    return await api.put(`/housing/submissions/${submissionId}/self`, payload, config)
  },

  // Admin - Get all submissions
  getAllSubmissions: async (params = {}) => {
    return await api.get('/housing/admin/submissions', { params })
  },

  // Super Admin - Hard delete submission
  deleteSubmission: async (submissionId) => {
    return await api.delete(`/housing/submissions/${submissionId}`)
  },
}

// Location API services
export const locationAPI = {
  // Get all provinces
  getProvinces: async () => {
    return await api.get('/locations/provinces')
  },

  // Get province by ID
  getProvince: async (provinceId) => {
    return await api.get(`/locations/provinces/${provinceId}`)
  },

  // Get regencies by province ID
  getRegencies: async (provinceId) => {
    return await api.get(`/locations/provinces/${provinceId}/regencies`)
  },

  // Get regency by ID
  getRegency: async (regencyId) => {
    return await api.get(`/locations/regencies/${regencyId}`)
  },

  // Get districts by regency ID
  getDistricts: async (regencyId) => {
    return await api.get(`/locations/regencies/${regencyId}/districts`)
  },

  // Get district by ID
  getDistrict: async (districtId) => {
    return await api.get(`/locations/districts/${districtId}`)
  },

  // Get villages by district ID
  getVillages: async (districtId) => {
    return await api.get(`/locations/districts/${districtId}/villages`)
  },

  // Get village by ID
  getVillage: async (villageId) => {
    return await api.get(`/locations/villages/${villageId}`)
  },

  // Get location hierarchy
  getHierarchy: async (params = {}) => {
    return await api.get('/locations/hierarchy', { params })
  },

  // Reverse geocode (get location from coordinates)
  reverseGeocode: async (latitude, longitude) => {
    return await api.get('/locations/reverse-geocode', {
      params: { latitude, longitude }
    })
  },

  // Get spatial feature by id
  getSpatialFeatureById: async (id) => {
    return await api.get(`/locations/feature/${encodeURIComponent(id)}`)
  },

  // Get GeoJSON data
  getGeoJSON: async (fileName) => {
    return await api.get('/locations/geojson', {
      params: { fileName }
    })
  },
}

// Facility Survey API services
export const facilityAPI = {
  // Get facility surveys
  getSurveys: async (params = {}) => {
    return await api.get('/facility/surveys', { params })
  },

  // Get facility survey by ID
  getSurvey: async (surveyId) => {
    return await api.get(`/facility/surveys/${surveyId}`)
  },

  // Create facility survey
  createSurvey: async (surveyData) => {
    return await api.post('/facility/surveys', surveyData)
  },

  // Update facility survey
  updateSurvey: async (surveyId, surveyData) => {
    return await api.put(`/facility/surveys/${surveyId}`, surveyData)
  },

  // Submit facility survey
  submitSurvey: async (surveyId) => {
    return await api.post(`/facility/surveys/${surveyId}/submit`)
  },

  // Verify facility survey
  verifySurvey: async (surveyId, reviewData = {}) => {
    return await api.post(`/facility/surveys/${surveyId}/review`, reviewData)
  },
  // Review facility survey (alias)
  reviewSurvey: async (surveyId, reviewData = {}) => {
    return await api.post(`/facility/surveys/${surveyId}/review`, reviewData)
  },

  // Super Admin - Hard delete facility survey
  deleteSurvey: async (surveyId) => {
    return await api.delete(`/facility/surveys/${surveyId}`)
  },

  // Get facility statistics
  getStatistics: async (params = {}) => {
    return await api.get('/facility/statistics', { params })
  },
}

// Housing development API services
export const housingDevelopmentAPI = {
  getDevelopments: async (params = {}) => {
    return await api.get('/housing-development', { params })
  },

  getDevelopment: async (developmentId) => {
    return await api.get(`/housing-development/${developmentId}`)
  },

  createDevelopment: async (payload) => {
    return await api.post('/housing-development', payload)
  },

  updateDevelopment: async (developmentId, payload) => {
    return await api.put(`/housing-development/${developmentId}`, payload)
  },

  verifyDevelopment: async (developmentId, reviewData = {}) => {
    return await api.post(`/housing-development/${developmentId}/review`, reviewData)
  },
  reviewDevelopment: async (developmentId, reviewData = {}) => {
    return await api.post(`/housing-development/${developmentId}/review`, reviewData)
  },
  // Super Admin - Hard delete housing development
  deleteDevelopment: async (developmentId) => {
    return await api.delete(`/housing-development/${developmentId}`)
  },

  // Get housing development statistics
  getStatistics: async (params = {}) => {
    return await api.get('/housing-development/statistics', { params })
  },
}

// Export API services
export const exportAPI = {
  download: async (type, params = {}) => {
    return await api.get(`/export/${type}`, {
      params,
      responseType: 'blob'
    })
  },
  preview: async (type, params = {}) => {
    return await api.get(`/export/${type}`, {
      params: {
        ...params,
        preview: true,
        format: 'json',
        _ts: Date.now(),
      }
    })
  },
  getData: async (type, params = {}) => {
    return await api.get(`/export/${type}`, { params })
  }
}

// Notification API services
export const notificationAPI = {
  getNotifications: async (params = {}) => {
    return await api.get('/notifications', { params })
  },
  getUnreadCount: async () => {
    return await api.get('/notifications/unread-count')
  },
  markAsRead: async (notificationId) => {
    return await api.put(`/notifications/${notificationId}/read`)
  },
  markAllAsRead: async () => {
    return await api.put('/notifications/read-all')
  }
}

// Health check API
export const healthAPI = {
  // Health check
  check: async () => {
    return await api.get('/health')
  },

  // API info
  getInfo: async () => {
    return await api.get('/api')
  },
}
