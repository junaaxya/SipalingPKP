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
              Buat Akun Baru
            </h2>
            <p class="text-body-1 text-medium-emphasis mt-2 auth-subtitle">
              Daftar untuk mulai menggunakan layanan
            </p>
          </v-card-title>

          <v-card-text class="auth-card-text">
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
                label="Nama Lengkap"
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
                label="Kata Sandi"
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

              <v-text-field
                v-model="phone"
                :rules="phoneRules"
                label="Nomor Telepon (Opsional)"
                variant="outlined"
                prepend-inner-icon="mdi-phone"
                class="mb-4"
              />

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
                    Saya menyetujui
                    <a
                      href="#"
                      class="text-primary text-decoration-none"
                      @click.prevent="openTerms"
                    >Ketentuan Layanan</a>
                    dan
                    <a
                      href="#"
                      class="text-primary text-decoration-none"
                      @click.prevent="openPrivacy"
                    >Kebijakan Privasi</a>
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
                Buat Akun
              </v-btn>

              <div class="text-center">
                <span class="text-body-2 text-medium-emphasis">
                  Sudah memiliki akun?
                  <router-link
                    to="/auth/signin"
                    class="text-decoration-none text-primary font-weight-medium"
                  >
                    Masuk
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

  <v-dialog
    v-model="termsDialog"
    max-width="720"
    scrollable
  >
    <v-card rounded="xl">
      <v-card-title class="policy-title">
        <div>
          <div class="text-overline text-primary">Ketentuan Layanan</div>
          <div class="text-h6 font-weight-bold policy-title-text">
            STANDAR OPERASIONAL PROSEDUR DAN KETENTUAN PENGGUNAAN SISTEM INFORMASI SI PALING PKP
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="policy-content">
        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 1: DEFINISI DAN RUANG LINGKUP</h3>
          <ol class="policy-list text-body-2">
            <li>
              Sistem Informasi SI PALING PKP (selanjutnya disebut "Sistem") adalah platform resmi
              penyelenggaraan data Perumahan dan Kawasan Pemukiman.
            </li>
            <li>
              Penyelenggara adalah instansi pemerintah terkait yang memiliki otoritas penuh atas
              pengelolaan data di wilayah Provinsi Bangka Belitung.
            </li>
            <li>
              Pengguna adalah aparatur sipil, petugas lapangan, atau masyarakat yang telah melalui
              proses verifikasi identitas secara elektronik.
            </li>
          </ol>
        </section>

        <v-divider class="my-4" />

        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 2: KEABSAHAN DATA DAN TANGGUNG JAWAB</h3>
          <ol class="policy-list text-body-2">
            <li>
              Pengguna wajib menjamin bahwa seluruh data yang diinput, termasuk namun tidak terbatas
              pada Nomor Induk Kependudukan (NIK), Kartu Keluarga (KK), dan dokumentasi fisik
              bangunan, adalah data asli dan akurat sesuai kondisi faktual di lapangan.
            </li>
            <li>
              Manipulasi data geospasial (koordinat GPS) atau penggunaan identitas palsu merupakan
              pelanggaran hukum serius yang dapat diproses sesuai UU ITE No. 19 Tahun 2016.
            </li>
          </ol>
        </section>

        <v-divider class="my-4" />

        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 3: HAK AKSES DAN KEAMANAN AKUN</h3>
          <ol class="policy-list text-body-2">
            <li>
              Akses ke fitur-fitur strategis seperti Verifikasi Data dan Penghapusan Data diatur
              secara ketat berdasarkan peran (Role-Based Access Control).
            </li>
            <li>Pengguna bertanggung jawab penuh atas segala aktivitas yang dilakukan menggunakan akun miliknya.</li>
          </ol>
        </section>

        <v-divider class="my-4" />

        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 4: MEKANISME PENGHAPUSAN DATA (HARD DELETE)</h3>
          <ol class="policy-list text-body-2">
            <li>
              Penyelenggara melalui Super Admin memiliki kewenangan absolut untuk melakukan
              penghapusan data secara permanen (Hard Delete) apabila ditemukan duplikasi data atau
              data yang tidak valid.
            </li>
            <li>
              Pengguna memahami bahwa tindakan Hard Delete akan menghapus seluruh catatan transaksi,
              riwayat survei, serta titik koordinat pada peta lokasi secara permanen dari basis data
              sistem dan tidak dapat dipulihkan kembali.
            </li>
          </ol>
        </section>
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn color="primary" variant="outlined" @click="termsDialog = false">
          Tutup
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="privacyDialog"
    max-width="720"
    scrollable
  >
    <v-card rounded="xl">
      <v-card-title class="policy-title">
        <div>
          <div class="text-overline text-primary">Kebijakan Privasi</div>
          <div class="text-h6 font-weight-bold policy-title-text">
            KEBIJAKAN PELINDUNGAN DATA PRIBADI PENGGUNA SI PALING PKP
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="policy-content">
        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 1: DASAR HUKUM</h3>
          <p class="text-body-2">
            Kebijakan ini disusun berdasarkan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
            (PDP) dan peraturan perundang-undangan terkait lainnya guna menjamin hak-hak subjek data.
          </p>
        </section>

        <v-divider class="my-4" />

        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 2: PEROLEHAN DAN PENGUMPULAN DATA</h3>
          <ol class="policy-list text-body-2">
            <li>Data Identitas: Nama Lengkap, NIK, Nomor KK, Nomor Telepon, dan Alamat Domisili.</li>
            <li>
              Data Geospasial: Titik koordinat lokasi bangunan (Latitude & Longitude) serta data
              spasial administrasi desa/kelurahan.
            </li>
            <li>Data Visual: Foto dokumentasi kondisi rumah, infrastruktur, dan sarana prasarana pemukiman.</li>
          </ol>
        </section>

        <v-divider class="my-4" />

        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 3: TUJUAN PENGOLAHAN DATA</h3>
          <ol class="policy-list text-body-2">
            <li>Penentuan sasaran penerima bantuan Rumah Tidak Layak Huni (RTLH) secara tepat sasaran.</li>
            <li>Perencanaan dan pengembangan infrastruktur pemukiman berbasis data akurat.</li>
            <li>Penyusunan basis data terpadu untuk kebijakan publik di sektor perumahan.</li>
          </ol>
        </section>

        <v-divider class="my-4" />

        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 4: KERAHASIAAN DAN PENYEBARLUASAN DATA</h3>
          <ol class="policy-list text-body-2">
            <li>
              Penyelenggara menjamin bahwa data pribadi tidak akan disalahgunakan atau diperjualbelikan
              kepada pihak ketiga untuk kepentingan komersial.
            </li>
            <li>
              Pertukaran data antar instansi pemerintah (Dinas Sosial, Bappeda, dsb.) dilakukan melalui
              jalur koneksi aman demi sinkronisasi program pembangunan.
            </li>
          </ol>
        </section>

        <v-divider class="my-4" />

        <section class="policy-section">
          <h3 class="policy-section-title">PASAL 5: HAK SUBJEK DATA</h3>
          <ol class="policy-list text-body-2">
            <li>
              Pengguna berhak meminta informasi mengenai status datanya, meminta pemutakhiran data jika
              terdapat ketidaksesuaian, atau mengajukan permohonan penghapusan data melalui prosedur
              resmi kepada Administrator Sistem.
            </li>
          </ol>
        </section>
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn color="primary" variant="outlined" @click="privacyDialog = false">
          Tutup
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
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
const termsDialog = ref(false)
const privacyDialog = ref(false)
const otpDigits = ref(Array(6).fill(''))
const otpInputs = ref([])
const otpUserId = ref('')
const otpChannel = ref('email')
const otpCountdown = ref(0)
const otpTimer = ref(null)
const otpErrorMessage = ref('')
const otpSubmitting = ref(false)
const otpResending = ref(false)
const signUpIdempotencyKey = ref('')
const signUpIdempotencyEmail = ref('')

// Form rules
const nameRules = [
  v => !!v || 'Nama lengkap wajib diisi',
  v => v.length >= 2 || 'Nama minimal 2 karakter',
  v => v.length <= 100 || 'Nama maksimal 100 karakter',
  v => /^[a-zA-Z\s]+$/.test(v) || 'Nama hanya boleh berisi huruf dan spasi'
]

const emailRules = [
  v => !!v || 'Email wajib diisi',
  v => /.+@.+\..+/.test(v) || 'Format email tidak valid',
  v => v.length >= 5 || 'Email minimal 5 karakter',
  v => v.length <= 255 || 'Email maksimal 255 karakter'
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
  v => v === password.value || 'Konfirmasi kata sandi tidak cocok'
]

const phoneRules = [
  v => !v || v.length >= 10 || 'Nomor telepon minimal 10 karakter',
  v => !v || v.length <= 20 || 'Nomor telepon maksimal 20 karakter'
]

const termsRules = [
  v => !!v || 'Anda harus menyetujui ketentuan'
]

const openTerms = () => {
  privacyDialog.value = false
  termsDialog.value = true
}

const openPrivacy = () => {
  termsDialog.value = false
  privacyDialog.value = true
}

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

const otpTargetLabel = computed(() => {
  return maskEmailForUi(email.value)
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
  const normalizedPhone = phone.value ? phone.value.trim() : ''
  const result = await appStore.register({
    email: email.value,
    password: password.value,
    fullName: fullName.value,
    phone: normalizedPhone || null,
  }, { idempotencyKey })
  
  if (result.success) {
    otpUserId.value = result.userId
    otpChannel.value = 'email'
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
}

.policy-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-top: 12px;
  padding-bottom: 4px;
}

.policy-list {
  padding-left: 18px;
  margin: 0;
}

.policy-list li + li {
  margin-top: 6px;
}

.policy-title {
  padding: 20px 24px 8px;
  white-space: normal;
  align-items: flex-start;
}

.policy-title-text {
  font-size: clamp(1rem, 3.6vw, 1.25rem);
  line-height: 1.3;
  word-break: break-word;
  hyphens: auto;
}

.policy-section {
  padding: 0 4px;
}

.policy-section-title {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin: 0 0 8px;
}

@media (max-width: 600px) {
  .auth-card-title {
    padding: 20px 16px 8px;
  }

  .auth-card-text {
    padding: 0 16px 20px;
  }

  .policy-title {
    padding: 16px 16px 4px;
  }

  .policy-title-text {
    font-size: clamp(0.95rem, 4vw, 1.1rem);
  }

  .policy-section-title {
    font-size: 0.9rem;
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
