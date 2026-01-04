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
              Create Account
            </h2>
            <p class="text-body-1 text-medium-emphasis mt-2">
              Sign up to get started
            </p>
          </v-card-title>

          <v-card-text class="pa-8 pt-0">
            <!-- Error Alert -->
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

            <v-form
              ref="form"
              v-model="valid"
              @submit.prevent="handleSignUp"
            >
              <v-text-field
                v-model="fullName"
                :rules="nameRules"
                label="Full Name"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                class="mb-4"
                required
              />

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

              <v-text-field
                v-model="password"
                :rules="passwordRules"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
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
                label="Confirm Password"
                variant="outlined"
                prepend-inner-icon="mdi-lock-check"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                class="mb-4"
                required
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
              />

              <v-text-field
                v-model="phone"
                :rules="phoneRules"
                label="Phone Number"
                variant="outlined"
                prepend-inner-icon="mdi-phone"
                class="mb-4"
                required
              />

              <v-radio-group
                v-model="otpChannel"
                label="Kirim OTP melalui"
                inline
                class="mb-4"
                @update:modelValue="otpChannelTouched = true"
              >
                <v-radio
                  label="WhatsApp"
                  value="whatsapp"
                  :disabled="!isWhatsappAvailable"
                />
                <v-radio
                  label="Email"
                  value="email"
                />
              </v-radio-group>

              <div class="text-caption text-medium-emphasis mb-4">
                OTP akan dikirim ke {{ otpTargetLabel }}.
              </div>

              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                Pendaftaran ini otomatis untuk akun Masyarakat.
              </v-alert>

              <v-checkbox
                v-model="agreeToTerms"
                :rules="termsRules"
                class="mb-6"
                required
              >
                <template #label>
                  <span class="text-body-2">
                    I agree to the
                    <a
                      href="#"
                      class="text-primary text-decoration-none"
                    >Terms of Service</a>
                    and
                    <a
                      href="#"
                      class="text-primary text-decoration-none"
                    >Privacy Policy</a>
                  </span>
                </template>
              </v-checkbox>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="appStore.isLoading"
                :disabled="!valid"
                class="mb-4"
              >
                Create Account
              </v-btn>

              <div class="text-center">
                <span class="text-body-2 text-medium-emphasis">
                  Already have an account?
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
      </v-col>
    </v-row>
  </v-container>

  <v-dialog
    v-model="otpDialog"
    max-width="480"
    persistent
  >
    <v-card rounded="xl">
      <v-card-title class="text-h6 font-weight-bold">
        Verifikasi OTP
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Kode OTP 6 digit dikirim ke {{ otpTargetLabel }}.
        </p>

        <v-alert
          v-if="otpErrorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="otpErrorMessage = ''"
        >
          {{ otpErrorMessage }}
        </v-alert>

        <div class="otp-inputs">
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

        <div class="text-caption text-medium-emphasis mt-4">
          Kirim ulang dalam {{ otpCountdownLabel }}
        </div>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-btn
          color="primary"
          :loading="otpSubmitting"
          :disabled="otpCode.length !== 6"
          block
          @click="handleVerifyOtp"
        >
          Verifikasi
        </v-btn>
      </v-card-actions>
      <v-card-actions class="px-4 pb-4 pt-0">
        <v-btn
          variant="text"
          color="primary"
          :disabled="otpCountdown > 0 || otpResending"
          :loading="otpResending"
          block
          @click="handleResendOtp"
        >
          Kirim Ulang OTP
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

// Form data
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const phone = ref('')
const agreeToTerms = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const valid = ref(false)
const errorMessage = ref('')
const otpDialog = ref(false)
const otpDigits = ref(Array(6).fill(''))
const otpInputs = ref([])
const otpUserId = ref('')
const otpChannel = ref('email')
const otpChannelTouched = ref(false)
const otpCountdown = ref(0)
const otpTimer = ref(null)
const otpErrorMessage = ref('')
const otpSubmitting = ref(false)
const otpResending = ref(false)
const signUpIdempotencyKey = ref('')
const signUpIdempotencyEmail = ref('')

// Form rules
const nameRules = [
  v => !!v || 'Full name is required',
  v => v.length >= 2 || 'Name must be at least 2 characters',
  v => v.length <= 100 || 'Name must be less than 100 characters',
  v => /^[a-zA-Z\s]+$/.test(v) || 'Name can only contain letters and spaces'
]

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid',
  v => v.length >= 5 || 'Email must be at least 5 characters',
  v => v.length <= 255 || 'Email must be less than 255 characters'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 8 || 'Password must be at least 8 characters',
  v => v.length <= 128 || 'Password must be less than 128 characters',
  v => /(?=.*[a-z])/.test(v) || 'Password must contain at least one lowercase letter',
  v => /(?=.*[A-Z])/.test(v) || 'Password must contain at least one uppercase letter',
  v => /(?=.*\d)/.test(v) || 'Password must contain at least one digit',
  v => /(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(v) || 'Password must contain at least one special character'
]

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === password.value || 'Passwords do not match'
]

const phoneRules = [
  v => !!v || 'Phone number is required',
  v => v.length >= 10 || 'Phone number must be at least 10 characters',
  v => v.length <= 20 || 'Phone number must be less than 20 characters'
]

const termsRules = [
  v => !!v || 'You must agree to the terms'
]

const otpCode = computed(() => otpDigits.value.join(''))
const otpCountdownLabel = computed(() => {
  const seconds = Math.max(0, otpCountdown.value)
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remaining = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${remaining}`
})
const maskEmailForUi = (value) => {
  if (!value) return 'email'
  const [name, domain] = value.split('@')
  if (!domain) return value
  const maskedName = name.length <= 2 ? `${name[0] || ''}*` : `${name[0]}***${name.slice(-1)}`
  return `${maskedName}@${domain}`
}

const maskPhoneForUi = (value) => {
  if (!value) return 'WhatsApp'
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 2)}****${digits.slice(-2)}`
}

const otpTargetLabel = computed(() => {
  if (otpChannel.value === 'whatsapp') {
    return `WhatsApp ${maskPhoneForUi(phone.value)}`
  }
  return maskEmailForUi(email.value)
})

const isWhatsappAvailable = computed(() => {
  const digits = phone.value.replace(/\D/g, '')
  return digits.length >= 9
})

const createIdempotencyKey = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }
  return `otp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const focusOtpInput = (index) => {
  const inputComponent = otpInputs.value?.[index]
  const inputEl = inputComponent?.$el?.querySelector('input')
  if (inputEl) {
    inputEl.focus()
    inputEl.select()
  }
}

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

const resetOtpInputs = () => {
  otpDigits.value = Array(6).fill('')
  nextTick(() => focusOtpInput(0))
}

const handleOtpInput = (index, event) => {
  otpErrorMessage.value = ''
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

// Handle sign up
const handleSignUp = async () => {
  if (!valid.value) return
  
  errorMessage.value = ''

  if (!signUpIdempotencyKey.value || signUpIdempotencyEmail.value !== email.value) {
    signUpIdempotencyKey.value = createIdempotencyKey()
    signUpIdempotencyEmail.value = email.value
  }
  const idempotencyKey = signUpIdempotencyKey.value
  const result = await appStore.register({
    email: email.value,
    password: password.value,
    fullName: fullName.value,
    phone: phone.value,
    otpChannel: otpChannel.value,
  }, { idempotencyKey })
  
  if (result.success) {
    otpUserId.value = result.userId
    otpChannel.value = result.otpChannel || 'email'
    otpDialog.value = true
    otpErrorMessage.value = ''
    startOtpCountdown(result.cooldownSeconds || 60)
    resetOtpInputs()
  } else {
    errorMessage.value = result.error
  }
}

const handleVerifyOtp = async () => {
  if (otpCode.value.length !== 6 || otpSubmitting.value) return
  otpSubmitting.value = true
  otpErrorMessage.value = ''

  const result = await appStore.verifyOtp({
    userId: otpUserId.value,
    code: otpCode.value,
    channel: otpChannel.value,
  })

  otpSubmitting.value = false

  if (result.success) {
    otpDialog.value = false
    router.push('/home')
  } else {
    otpErrorMessage.value = result.error || 'Kode OTP tidak valid'
  }
}

const handleResendOtp = async () => {
  if (otpResending.value) return
  otpResending.value = true
  otpErrorMessage.value = ''

  const result = await appStore.resendOtp({
    userId: otpUserId.value,
    channel: otpChannel.value,
  })

  otpResending.value = false

  if (result.success) {
    startOtpCountdown(result.cooldownSeconds || 60)
    resetOtpInputs()
  } else {
    if (result.retryAfter) {
      startOtpCountdown(result.retryAfter)
    }
    otpErrorMessage.value = result.error || 'Gagal mengirim ulang OTP'
  }
}

onBeforeUnmount(() => {
  if (otpTimer.value) {
    clearInterval(otpTimer.value)
  }
})

watch(isWhatsappAvailable, (available) => {
  if (!otpChannelTouched.value) {
    otpChannel.value = available ? 'whatsapp' : 'email'
    return
  }
  if (!available && otpChannel.value === 'whatsapp') {
    otpChannel.value = 'email'
  }
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
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
