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
              Atur Ulang Kata Sandi
            </h2>
            <p class="text-body-1 text-medium-emphasis mt-2">
              Masukkan kata sandi baru untuk akun Anda
            </p>
          </v-card-title>

          <v-card-text class="pa-8 pt-0">
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

            <v-alert
              v-if="infoMessage"
              type="success"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="infoMessage = ''"
            >
              {{ infoMessage }}
            </v-alert>

            <v-alert
              v-if="tokenMissing"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              Token pengaturan ulang tidak ditemukan. Silakan minta ulang melalui halaman lupa kata sandi.
            </v-alert>

            <v-form
              v-else
              ref="form"
              v-model="valid"
              @submit.prevent="handleResetPassword"
            >
              <v-text-field
                v-model="newPassword"
                :rules="passwordRules"
                :type="showPassword ? 'text' : 'password'"
                label="Kata Sandi Baru"
                variant="outlined"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                class="mb-4"
                required
                @click:append-inner="showPassword = !showPassword"
              />

              <v-text-field
                v-model="confirmPassword"
                :rules="confirmPasswordRules"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Konfirmasi Kata Sandi"
                variant="outlined"
                prepend-inner-icon="mdi-lock-check"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                class="mb-4"
                required
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
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
                Simpan Kata Sandi Baru
              </v-btn>
            </v-form>

            <div class="text-center">
              <router-link
                to="/auth/forgot-password"
                class="text-decoration-none text-primary font-weight-medium"
              >
                Kembali ke Lupa Kata Sandi
              </router-link>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authAPI } from '@/services'

const route = useRoute()
const router = useRouter()

const token = computed(() => String(route.query?.token || '').trim())
const tokenMissing = computed(() => !token.value)

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const valid = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const passwordRules = [
  v => !!v || 'Kata sandi wajib diisi',
  v => v.length >= 8 || 'Kata sandi minimal 8 karakter',
  v => v.length <= 128 || 'Kata sandi maksimal 128 karakter',
  v => /(?=.*[a-z])/.test(v) || 'Kata sandi harus memiliki huruf kecil',
  v => /(?=.*[A-Z])/.test(v) || 'Kata sandi harus memiliki huruf besar',
  v => /(?=.*\d)/.test(v) || 'Kata sandi harus memiliki angka',
  v => /(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(v) || 'Kata sandi harus memiliki simbol'
]

const confirmPasswordRules = [
  v => !!v || 'Konfirmasi kata sandi wajib diisi',
  v => v === newPassword.value || 'Konfirmasi kata sandi tidak cocok'
]

const handleResetPassword = async () => {
  if (!valid.value || tokenMissing.value) return

  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    const response = await authAPI.resetPassword({
      token: token.value,
      newPassword: newPassword.value
    })

    if (response.success) {
      infoMessage.value = response.message || 'Kata sandi berhasil diperbarui.'
      setTimeout(() => {
        router.push('/auth/signin')
      }, 1000)
    } else {
      errorMessage.value = response.message || 'Gagal mengatur ulang kata sandi.'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Gagal mengatur ulang kata sandi.'
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
