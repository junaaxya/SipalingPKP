// Utilities
import { defineStore } from 'pinia'
import { authAPI, userAPI } from '@/services'

const ROLE_GROUPS = {
  super_admin: ['super_admin', 'superadmin', 'admin', 'administrator'],
  verifikator: ['verifikator', 'verifier'],
  admin_kabupaten: [
    'admin_kabupaten',
    'kabupaten_admin',
    'admin kabupaten',
    'admin_regency',
  ],
  admin_desa: [
    'admin_desa',
    'desa_admin',
    'admin desa',
    'admin_village',
  ],
  masyarakat: ['masyarakat'],
}

const normalizeRoleName = (role) => {
  if (!role) return ''
  const raw = typeof role === 'string' ? role : role.name || role.displayName || ''
  return String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_')
}

const normalizePermissionName = (permission) => {
  if (!permission) return ''
  const raw = typeof permission === 'string' ? permission : permission.name || ''
  return String(raw).trim()
}

const extractRoleNames = (user) => {
  if (!user) return []
  const roles = Array.isArray(user.roleNames) && user.roleNames.length
    ? user.roleNames
    : user.roles || []
  return roles.map(normalizeRoleName).filter(Boolean)
}

const extractPermissionNames = (user) => {
  if (!user) return []
  const permissions = user.permissionNames?.length
    ? user.permissionNames
    : user.permissions || []
  return permissions.map(normalizePermissionName).filter(Boolean)
}

export const useAppStore = defineStore('app', {
  state: () => ({
    // Authentication state
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    
    // App state
    theme: 'light',
    sidebarOpen: true,
  }),

  getters: {
    // Check if user has specific permission
    hasPermission: (state) => (permission) => {
      const permissionNames = extractPermissionNames(state.user)
      if (!permissionNames.length) return false
      return permissionNames.includes(permission)
    },

    hasAnyPermission: (state) => (permissions = []) => {
      const permissionNames = extractPermissionNames(state.user)
      if (!permissionNames.length) return false
      return permissions.some((permission) => permissionNames.includes(permission))
    },

    // Check if user has specific role
    hasRole: (state) => (role) => {
      const roleNames = extractRoleNames(state.user)
      const target = normalizeRoleName(role)
      return roleNames.includes(target)
    },

    hasAnyRole: (state) => (roles = []) => {
      const roleNames = extractRoleNames(state.user)
      return roles
        .map(normalizeRoleName)
        .some((role) => roleNames.includes(role))
    },

    hasRoleGroup: (state) => (groupKey) => {
      const roleNames = extractRoleNames(state.user)
      const aliases = ROLE_GROUPS[groupKey] || []
      return aliases
        .map(normalizeRoleName)
        .some((alias) => roleNames.includes(alias))
    },

    // Get user level
    userLevel: (state) => {
      return state.user?.userLevel || null
    },

    // Check if user is admin (superadmin, administrator, etc.)
    isAdmin: (state) => {
      const roleNames = extractRoleNames(state.user)
      const adminAliases = ROLE_GROUPS.super_admin.map(normalizeRoleName)
      return adminAliases.some((role) => roleNames.includes(role))
    },

    // Get user's assigned location IDs
    assignedLocationIds: (state) => {
      return {
        provinceId: state.user?.assignedProvinceId || null,
        regencyId: state.user?.assignedRegencyId || null,
        districtId: state.user?.assignedDistrictId || null,
        villageId: state.user?.assignedVillageId || null
      }
    },

    // Check if user can inherit data
    canInheritData: (state) => {
      return state.user?.canInheritData || false
    },

    // Get inheritance depth
    inheritanceDepth: (state) => {
      return state.user?.inheritanceDepth || null
    },

    // Get primary role name for display
    primaryRoleName: (state) => {
      if (!state.user?.roles || state.user.roles.length === 0) return null
      return state.user.roles[0].displayName || state.user.roles[0].name
    },

    // Get all role names
    roleNames: (state) => {
      return extractRoleNames(state.user)
    },

    // Get all permission names
    permissionNames: (state) => {
      return extractPermissionNames(state.user)
    },

    isSuperAdmin: (state) => {
      const roleNames = extractRoleNames(state.user)
      return ROLE_GROUPS.super_admin
        .map(normalizeRoleName)
        .some((role) => roleNames.includes(role))
    },

    isVerifikator: (state) => {
      const roleNames = extractRoleNames(state.user)
      return ROLE_GROUPS.verifikator
        .map(normalizeRoleName)
        .some((role) => roleNames.includes(role))
    },

    isMasyarakat: (state) => {
      const roleNames = extractRoleNames(state.user)
      return ROLE_GROUPS.masyarakat
        .map(normalizeRoleName)
        .some((role) => roleNames.includes(role))
    },

    isAdminKabupaten: (state) => {
      const roleNames = extractRoleNames(state.user)
      return ROLE_GROUPS.admin_kabupaten
        .map(normalizeRoleName)
        .some((role) => roleNames.includes(role))
    },

    isAdminDesa: (state) => {
      const roleNames = extractRoleNames(state.user)
      return ROLE_GROUPS.admin_desa
        .map(normalizeRoleName)
        .some((role) => roleNames.includes(role))
    },
  },

  actions: {
    // Initialize authentication state from localStorage
    async initializeAuth() {
      const token = localStorage.getItem('auth-token')
      const userData = localStorage.getItem('user-data')
      
      if (token && userData) {
        try {
          this.user = JSON.parse(userData)
          this.isAuthenticated = true
          try {
            const response = await userAPI.getProfile()
            if (response?.success) {
              const refreshedUser = response.data?.user || response.data
              if (refreshedUser) {
                localStorage.setItem('user-data', JSON.stringify(refreshedUser))
                this.user = refreshedUser
              }
            }
          } catch (error) {
            console.warn('Failed to refresh user profile:', error?.message || error)
          }
        } catch (error) {
          console.error('Error parsing user data:', error)
          this.logout()
        }
      }
    },

    // Login user
    async login(credentials) {
      this.isLoading = true
      this.error = null

      try {
        const response = await authAPI.signin(credentials)
        
        if (response.success) {
          const { user, tokens } = response.data
          
          // Store tokens and user data
          localStorage.setItem('auth-token', tokens.accessToken)
          localStorage.setItem('refresh-token', tokens.refreshToken)
          localStorage.setItem('user-data', JSON.stringify(user))
          
          // Update state
          this.user = user
          this.isAuthenticated = true
          
          return { success: true, user }
        } else {
          this.error = response.message
          return {
            success: false,
            error: response.message,
            code: response.code,
            details: response.details
          }
        }
      } catch (error) {
        this.error = error.message || 'Login failed'
        return {
          success: false,
          error: this.error,
          code: error.code,
          details: error.details,
          retryAfter: error.retryAfter
        }
      } finally {
        this.isLoading = false
      }
    },

    // Handle Google OAuth callback with tokens from query params
    async handleGoogleOAuthCallback(accessToken, refreshToken) {
      this.isLoading = true
      this.error = null

      try {
        // Store tokens temporarily
        localStorage.setItem('auth-token', accessToken)
        localStorage.setItem('refresh-token', refreshToken)
        
        // Get user profile to complete login
        const userResponse = await userAPI.getProfile()
        
        if (userResponse.success) {
          const user = userResponse.data?.user || userResponse.data
          
          // Store user data
          localStorage.setItem('user-data', JSON.stringify(user))
          
          // Update state
          this.user = user
          this.isAuthenticated = true
          
          return { success: true, user }
        } else {
          this.error = userResponse.message || 'Failed to get user profile'
          this.logout()
          return { success: false, error: this.error }
        }
      } catch (error) {
        this.error = error.message || 'Google login failed'
        this.logout()
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Register user (OTP flow)
    async register(userData, options = {}) {
      this.isLoading = true
      this.error = null

      try {
        const response = await authAPI.signup(userData, options)
        
        if (response.success) {
          return { success: true, ...response.data }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        this.error = error.message || 'Registration failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async verifyOtp(payload) {
      this.isLoading = true
      this.error = null

      try {
        const response = await authAPI.verifyOtp(payload)

        if (response.success) {
          const { user, tokens } = response.data

          if (tokens?.accessToken) {
            localStorage.setItem('auth-token', tokens.accessToken)
          }
          if (tokens?.refreshToken) {
            localStorage.setItem('refresh-token', tokens.refreshToken)
          }
          if (user) {
            localStorage.setItem('user-data', JSON.stringify(user))
            this.user = user
            this.isAuthenticated = true
          }

          return { success: true, user }
        }

        this.error = response.message
        return { success: false, error: response.message, retryAfter: response.retryAfter }
      } catch (error) {
        this.error = error.message || 'OTP verification failed'
        return { success: false, error: this.error, retryAfter: error.retryAfter }
      } finally {
        this.isLoading = false
      }
    },

    async resendOtp(payload) {
      this.isLoading = true
      this.error = null

      try {
        const response = await authAPI.resendOtp(payload)
        if (response.success) {
          return { success: true, ...response.data }
        }
        this.error = response.message
        return { success: false, error: response.message, retryAfter: response.retryAfter }
      } catch (error) {
        this.error = error.message || 'Resend OTP failed'
        return { success: false, error: this.error, retryAfter: error.retryAfter }
      } finally {
        this.isLoading = false
      }
    },

    async updateProfile(payload) {
      this.isLoading = true
      this.error = null

      try {
        const safePayload = { ...(payload || {}) }
        if (safePayload.nik && !safePayload.familyCardNumber) {
          safePayload.familyCardNumber = safePayload.nik
          delete safePayload.nik
        }
        const response = await userAPI.updateProfile(safePayload)
        if (response.success) {
          const refreshedUser = response.data?.user || response.data
          if (refreshedUser) {
            localStorage.setItem('user-data', JSON.stringify(refreshedUser))
            this.user = refreshedUser
          }
          return { success: true, user: refreshedUser }
        }
        this.error = response.message
        return { success: false, error: response.message }
      } catch (error) {
        this.error = error.message || 'Update profile failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async updateProfileAvatar(file) {
      this.isLoading = true
      this.error = null

      try {
        const formData = new FormData()
        formData.append('avatar', file)
        const response = await userAPI.updateProfileAvatar(formData)
        if (response.success) {
          const refreshedUser = response.data?.user || response.data
          if (refreshedUser) {
            localStorage.setItem('user-data', JSON.stringify(refreshedUser))
            this.user = refreshedUser
          }
          return { success: true, user: refreshedUser }
        }
        this.error = response.message
        return { success: false, error: response.message }
      } catch (error) {
        this.error = error.message || 'Update avatar failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async updateTwoFactor(payload) {
      this.isLoading = true
      this.error = null

      try {
        const response = await userAPI.updateTwoFactor(payload)
        if (response.success) {
          const refreshedUser = response.data?.user || response.data
          if (refreshedUser) {
            localStorage.setItem('user-data', JSON.stringify(refreshedUser))
            this.user = refreshedUser
          }
          return { success: true, user: refreshedUser }
        }
        this.error = response.message
        return { success: false, error: response.message }
      } catch (error) {
        this.error = error.message || 'Update 2FA failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async updateNotificationPreferences(payload) {
      this.isLoading = true
      this.error = null

      try {
        const response = await userAPI.updateNotificationPreferences(payload)
        if (response.success) {
          const refreshedUser = response.data?.user || response.data
          if (refreshedUser) {
            localStorage.setItem('user-data', JSON.stringify(refreshedUser))
            this.user = refreshedUser
          }
          return { success: true, user: refreshedUser }
        }
        this.error = response.message
        return { success: false, error: response.message }
      } catch (error) {
        this.error = error.message || 'Update notification preferences failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Logout user
    async logout() {
      this.isLoading = true

      try {
        // Call logout API if user is authenticated
        if (this.isAuthenticated) {
          await authAPI.signout()
        }
      } catch (error) {
        console.error('Logout API error:', error)
      } finally {
        // Clear local storage and state regardless of API call result
        localStorage.removeItem('auth-token')
        localStorage.removeItem('refresh-token')
        localStorage.removeItem('user-data')
        
        this.user = null
        this.isAuthenticated = false
        this.isLoading = false
        this.error = null
      }
    },

    // Refresh access token
    async refreshToken() {
      const refreshToken = localStorage.getItem('refresh-token')
      
      if (!refreshToken) {
        this.logout()
        return false
      }

      try {
        const response = await authAPI.refreshToken(refreshToken)
        
        if (response.success) {
          localStorage.setItem('auth-token', response.data.accessToken)
          return true
        } else {
          this.logout()
          return false
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.logout()
        return false
      }
    },

    // Update user profile
    async updateProfile(profileData) {
      this.isLoading = true
      this.error = null

      try {
        const response = await userAPI.updateProfile(profileData)
        
        if (response.success) {
          // Update user data in localStorage and state
          const updatedUser = { ...this.user, ...(response.data?.user || response.data) }
          localStorage.setItem('user-data', JSON.stringify(updatedUser))
          this.user = updatedUser
          
          return { success: true, user: updatedUser }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        this.error = error.message || 'Profile update failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Change password
    async changePassword(passwordData) {
      this.isLoading = true
      this.error = null

      try {
        const response = await userAPI.changePassword(passwordData)
        
        if (response.success) {
          return { success: true }
        } else {
          this.error = response.message
          return { success: false, error: response.message }
        }
      } catch (error) {
        this.error = error.message || 'Password change failed'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Toggle sidebar
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },

    // Set theme
    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
    },
  },
})
