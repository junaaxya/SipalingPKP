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
          class="auth-card"
        >
          <v-card-title class="text-center auth-card-title">
            <v-img
              src="/favicon.ico"
              alt="Logo"
              max-width="150"
              class="mx-auto mb-4 auth-logo"
            />
            <h2 class="text-h4 font-weight-bold text-primary auth-heading">
              Lupa Kata Sandi
            </h2>
            <p class="text-body-1 text-medium-emphasis mt-2 auth-subtitle">
              Pilih metode pengaturan ulang kata sandi yang paling nyaman untuk Anda
            </p>
          </v-card-title>

          <v-card-text class="auth-card-text">
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

            <v-form
              v-if="step === 'request'"
              ref="requestForm"
              v-model="requestValid"
              @submit.prevent="handleForgotPassword"
            >
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                type="email"
                variant="outlined"
                prepend-inner-icon="mdi-email"
                class="mb-4"
                required
              />

              <v-radio-group
                v-model="resetMethod"
                label="Metode pengaturan ulang"
                inline
                class="mb-4"
              >
                <v-radio
                  label="Tautan pengaturan ulang"
                  value="link"
                />
                <v-radio
                  label="OTP"
                  value="otp"
                />
              </v-radio-group>

              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                Jika akun terdaftar, instruksi pengaturan ulang akan dikirim sesuai pilihan Anda.
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                :disabled="!requestValid"
                class="mb-4"
              >
                Kirim Instruksi Pengaturan Ulang
              </v-btn>

              <div class="text-center">
                <span class="text-body-2 text-medium-emphasis">
                  Sudah ingat kata sandi?
                  <router-link
                    to="/auth/signin"
                    class="text-decoration-none text-primary font-weight-medium"
                  >
                    Masuk
                  </router-link>
                </span>
              </div>
            </v-form>

            <v-form
              v-else
              ref="resetForm"
              v-model="resetValid"
              @submit.prevent="handleResetPassword"
            >
              <v-text-field
                v-model="email"
                label="Email"
                variant="outlined"
                prepend-inner-icon="mdi-email"
                class="mb-4"
                readonly
              />

              <div class="text-body-2 text-medium-emphasis mb-3">
                Masukkan kode OTP 6 digit yang dikirim ke email Anda.
              </div>

              <div class="otp-inputs mb-4">
                <v-text-field
                  v-for="(_, index) in otpDigits"
                  :key="`otp-${index}`"
                  ref="otpInputs"
                  v-model="otpDigits[index]"
                  variant="outlined"
                  density="compact"
                  hide-details
                  maxlength="1"
                  inputmode="numeric"
                  class="otp-input"
                  @input="handleOtpInput(index, $event)"
                  @keydown="handleOtpKeydown(index, $event)"
                />
              </div>

              <div class="text-caption text-medium-emphasis mb-4">
                Kirim ulang dalam {{ otpCountdownLabel }}
              </div>

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
                :loading="resetLoading"
                :disabled="!resetValid || otpCode.length !== 6"
                class="mb-3"
              >
                Atur Ulang Kata Sandi
              </v-btn>

              <v-btn
                variant="text"
                block
                :disabled="otpCountdown > 0 || resendLoading"
                :loading="resendLoading"
                class="mb-2"
                @click="handleResendOtp"
              >
                Kirim Ulang OTP
              </v-btn>

              <v-btn
                variant="text"
                block
                @click="handleBackToRequest"
              >
                Ubah Metode Pengaturan Ulang
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { authAPI } from '@/services'

const email = ref('')
const resetMethod = ref('link')
const requestValid = ref(false)
const resetValid = ref(false)
const loading = ref(false)
const resetLoading = ref(false)
const resendLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const step = ref('request')

const otpDigits = ref(Array(6).fill(''))
const otpInputs = ref([])
const otpCountdown = ref(0)
const otpTimer = ref(null)

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const emailRules = [
  v => !!v || 'Email wajib diisi',
  v => /.+@.+\..+/.test(v) || 'Format email tidak valid'
]

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

const otpCode = computed(() => otpDigits.value.join(''))
const otpCountdownLabel = computed(() => {
  const seconds = Math.max(0, otpCountdown.value)
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remaining = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${remaining}`
})

const startOtpCountdown = (seconds) => {
  otpCountdown.value = Math.max(0, seconds || 0)
  if (otpTimer.value) {
    clearInterval(otpTimer.value)
  }
  otpTimer.value = setInterval(() => {
    if (otpCountdown.value <= 0) {
      clearInterval(otpTimer.value)
      otpTimer.value = null
      return
    }
    otpCountdown.value -= 1
  }, 1000)
}

const stopOtpCountdown = () => {
  if (otpTimer.value) {
    clearInterval(otpTimer.value)
    otpTimer.value = null
  }
  otpCountdown.value = 0
}

const resetOtpInputs = () => {
  otpDigits.value = Array(6).fill('')
  nextTick(() => focusOtpInput(0))
}

const focusOtpInput = (index) => {
  const inputComponent = otpInputs.value?.[index]
  const inputEl = inputComponent?.$el?.querySelector('input')
  if (inputEl) {
    inputEl.focus()
    inputEl.select()
  }
}

const handleOtpInput = (index, event) => {
  errorMessage.value = ''
  const rawValue = String(
    typeof event === 'string' ? event : event?.target?.value || ''
  ).replace(/\D/g, '')
  if (!rawValue) {
    otpDigits.value[index] = ''
    return
  }

  const chars = rawValue.split('')
  chars.forEach((char, offset) => {
    const targetIndex = index + offset
    if (targetIndex < otpDigits.value.length) {
      otpDigits.value[targetIndex] = char
    }
  })

  const nextIndex = Math.min(index + chars.length, otpDigits.value.length - 1)
  focusOtpInput(nextIndex)
}

const handleOtpKeydown = (index, event) => {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    focusOtpInput(index - 1)
  }
}

const handleForgotPassword = async () => {
  if (!requestValid.value) return

  loading.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    const response = await authAPI.requestPasswordReset({
      email: email.value,
      method: resetMethod.value,
      channel: 'email'
    })

    if (response.success) {
      infoMessage.value = response.message || 'Instruksi pengaturan ulang telah dikirim.'
      if (resetMethod.value === 'otp') {
        step.value = 'otp'
        const cooldown = response.data?.cooldownSeconds || response.data?.retryAfter || 0
        startOtpCountdown(cooldown)
        resetOtpInputs()
      }
    } else {
      errorMessage.value = response.message || 'Gagal mengirim instruksi pengaturan ulang.'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Gagal mengirim instruksi pengaturan ulang.'
  } finally {
    loading.value = false
  }
}

const handleResendOtp = async () => {
  if (resendLoading.value) return

  resendLoading.value = true
  errorMessage.value = ''

  try {
    const response = await authAPI.requestPasswordReset({
      email: email.value,
      method: 'otp',
      channel: 'email'
    })

    if (response.success) {
      infoMessage.value = response.message || 'OTP berhasil dikirim ulang.'
      const cooldown = response.data?.cooldownSeconds || response.data?.retryAfter || 0
      startOtpCountdown(cooldown)
      resetOtpInputs()
    } else {
      errorMessage.value = response.message || 'Gagal mengirim ulang OTP.'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Gagal mengirim ulang OTP.'
  } finally {
    resendLoading.value = false
  }
}

const handleResetPassword = async () => {
  if (!resetValid.value || otpCode.value.length !== 6) return

  resetLoading.value = true
  errorMessage.value = ''

  try {
    const response = await authAPI.resetPassword({
      email: email.value,
      otp: otpCode.value,
      newPassword: newPassword.value
    })

    if (response.success) {
      infoMessage.value = response.message || 'Kata sandi berhasil diperbarui.'
      stopOtpCountdown()
      step.value = 'request'
      resetMethod.value = 'link'
      otpDigits.value = Array(6).fill('')
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      errorMessage.value = response.message || 'Gagal mengatur ulang kata sandi.'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Gagal mengatur ulang kata sandi.'
  } finally {
    resetLoading.value = false
  }
}

const handleBackToRequest = () => {
  stopOtpCountdown()
  step.value = 'request'
  otpDigits.value = Array(6).fill('')
  newPassword.value = ''
  confirmPassword.value = ''
}

onBeforeUnmount(() => {
  if (otpTimer.value) {
    clearInterval(otpTimer.value)
  }
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}

.auth-logo {
  width: clamp(96px, 26vw, 150px);
  height: clamp(96px, 26vw, 150px);
}

.auth-card-title {
  padding: 28px 24px 12px;
  white-space: normal;
  flex-direction: column;
}

.auth-card-text {
  padding: 0 24px 24px;
}

.auth-heading {
  font-size: clamp(1.4rem, 4.2vw, 2rem) !important;
  line-height: 1.2;
}

.auth-subtitle {
  font-size: clamp(0.95rem, 3.4vw, 1.1rem) !important;
  white-space: normal;
  word-break: break-word;
}

@media (max-width: 600px) {
  .auth-card-title {
    padding: 20px 16px 8px;
  }

  .auth-card-text {
    padding: 0 16px 20px;
  }

  .otp-inputs {
    gap: 6px;
  }
}

.otp-inputs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.otp-input :deep(input) {
  text-align: center;
  font-size: 18px;
}
</style>
