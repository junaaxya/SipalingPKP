<template>
  <v-container
    fluid
    class="fill-height"
  >
    <v-row
      justify="center"
      align="center"
      class="fill-height"
    >
      <v-col
        cols="11"
        sm="8"
        md="6"
        lg="4"
        xl="3"
      >
        <v-card
          elevation="8"
          rounded="xl"
        >
          <v-card-title class="text-center pa-8">
            <v-img
              src="/favicon.ico"
              alt="Logo"
              max-width="60"
              class="mx-auto mb-4"
            />
            <h2 class="text-h4 font-weight-bold text-primary">
              Forgot Password?
            </h2>
            <p class="text-body-1 text-medium-emphasis mt-2">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </v-card-title>

          <v-card-text class="pa-8 pt-0">
            <v-form
              ref="form"
              v-model="valid"
              @submit.prevent="handleForgotPassword"
            >
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email Address"
                type="email"
                variant="outlined"
                prepend-inner-icon="mdi-email"
                class="mb-6"
                required
              />

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                :disabled="!valid"
                class="mb-4"
              >
                Send Reset Link
              </v-btn>

              <div class="text-center">
                <span class="text-body-2 text-medium-emphasis">
                  Remember your password?
                  <router-link
                    to="/auth/signin"
                    class="text-decoration-none text-primary font-weight-medium"
                  >
                    Sign In
                  </router-link>
                </span>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Success Dialog -->
        <v-dialog
          v-model="showSuccessDialog"
          max-width="400"
          persistent
        >
          <v-card rounded="xl">
            <v-card-title class="text-center pa-6 pb-0">
              <v-icon
                color="success"
                size="64"
                class="mb-4"
              >
                mdi-check-circle
              </v-icon>
              <h3 class="text-h5 font-weight-bold">
                Email Sent!
              </h3>
            </v-card-title>

            <v-card-text class="text-center pa-6 pt-0">
              <p class="text-body-1 text-medium-emphasis mb-4">
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>

              <v-btn
                color="primary"
                block
                @click="showSuccessDialog = false"
              >
                Got it
              </v-btn>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'


// Form data
const email = ref('')
const loading = ref(false)
const valid = ref(false)
const showSuccessDialog = ref(false)

// Form rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

// Handle forgot password
const handleForgotPassword = async () => {
  if (!valid.value) return
  
  loading.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Forgot password request for:', email.value)
    
    // Show success dialog
    showSuccessDialog.value = true
  } catch (error) {
    console.error('Forgot password error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
