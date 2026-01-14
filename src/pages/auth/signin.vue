<template>
  <v-container fluid class="fill-height">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="11" sm="8" md="6" lg="4" xl="3">
        <v-card elevation="8" rounded="xl" class="login-card">
          <v-card-title class="text-center login-card-title">
            <v-img
              src="/favicon.ico"
              alt="Logo"
              max-width="150"
              class="mx-auto mb-4 login-logo"
            />
            <h2 class="text-h4 font-weight-bold text-primary login-heading">
              Selamat Datang
            </h2>
            <p class="text-body-1 text-medium-emphasis mt-2 login-subtitle">
              Masuk untuk melanjutkan ke akun Anda
            </p>
          </v-card-title>

          <v-card-text class="login-card-text">
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

            <v-form ref="form" v-model="valid" @submit.prevent="handleSignIn">
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
                class="mb-2"
                required
                @click:append-inner="showPassword = !showPassword"
              />

              <div class="d-flex justify-space-between align-center mb-6">
                <v-checkbox
                  v-model="rememberMe"
                  label="Ingat saya"
                  hide-details
                  density="compact"
                />
                <router-link
                  to="/auth/forgot-password"
                  class="text-decoration-none text-primary"
                >
                  Lupa kata sandi?
                </router-link>
              </div>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="appStore.isLoading"
                :disabled="!valid"
                class="mb-4"
              >
                Masuk
              </v-btn>

              <!-- Divider -->
              <div class="d-flex align-center my-6">
                <v-divider />
                <span class="mx-4 text-body-2 text-medium-emphasis">ATAU</span>
                <v-divider />
              </div>

              <!-- Google Sign In Button -->
              <v-btn
                color="white"
                size="large"
                block
                variant="outlined"
                :loading="isGoogleLoading"
                :disabled="appStore.isLoading"
                class="mb-4 google-signin-btn text-dark"
                @click="handleGoogleSignIn"
              >
                <v-img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width="20"
                  height="20"
                  class="mr-2"
                />
                <span class="text-body-1 font-weight-regular"
                  >Lanjutkan dengan Google</span
                >
              </v-btn>

              <div class="text-center">
                <span class="text-body-2 text-medium-emphasis">
                  Belum punya akun?
                  <router-link
                    to="/auth/signup"
                    class="text-decoration-none text-primary font-weight-medium"
                  >
                    Daftar
                  </router-link>
                </span>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="otpDialog" max-width="460" persistent>
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          Verifikasi OTP
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            Kode OTP 6 digit dikirim ke {{ otpTargetLabel }}.
          </p>
          <v-radio-group
            v-if="otpHasWhatsapp"
            v-model="otpChannel"
            inline
            class="mb-3"
            label="Kirim ulang melalui"
          >
            <v-radio label="WhatsApp" value="whatsapp" />
            <v-radio label="Email" value="email" />
          </v-radio-group>
          <v-alert
            v-if="otpErrorMessage"
            type="error"
            variant="tonal"
            closable
            class="mb-3"
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
              maxlength="1"
              variant="outlined"
              density="comfortable"
              hide-details
              class="otp-input"
              @input="handleOtpInput(index, $event)"
              @keydown="handleOtpKeydown(index, $event)"
            />
          </div>
          <div class="text-caption text-medium-emphasis mt-3">
            Kirim ulang dalam {{ otpCountdownLabel }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            variant="text"
            :disabled="otpCountdown > 0 || otpResending"
            :loading="otpResending"
            @click="handleResendOtp"
          >
            Kirim Ulang OTP
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="otpSubmitting"
            :disabled="otpCode.length !== 6"
            @click="handleVerifyOtp"
          >
            Verifikasi
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { authAPI } from "@/services";

const router = useRouter();
const appStore = useAppStore();

// Form data
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const valid = ref(false);
const errorMessage = ref("");
const isGoogleLoading = ref(false);
const otpDialog = ref(false);
const otpDigits = ref(Array(6).fill(""));
const otpInputs = ref([]);
const otpUserId = ref("");
const otpChannel = ref("email");
const otpAvailableChannels = ref(["email"]);
const otpCountdown = ref(0);
const otpTimer = ref(null);
const otpErrorMessage = ref("");
const otpSubmitting = ref(false);
const otpResending = ref(false);

// Form rules
const emailRules = [
  (v) => !!v || "Email wajib diisi",
  (v) => /.+@.+\..+/.test(v) || "Format email tidak valid",
];

const passwordRules = [
  (v) => !!v || "Kata sandi wajib diisi",
  (v) => v.length >= 8 || "Kata sandi minimal 8 karakter",
];

const otpCode = computed(() => otpDigits.value.join(""));
const otpCountdownLabel = computed(() => {
  const seconds = Math.max(0, otpCountdown.value);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remaining = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remaining}`;
});

const maskEmailForUi = (value) => {
  if (!value) return "email";
  const [name, domain] = value.split("@");
  if (!domain) return value;
  const maskedName =
    name.length <= 2 ? `${name[0] || ""}*` : `${name[0]}***${name.slice(-1)}`;
  return `${maskedName}@${domain}`;
};

const otpTargetLabel = computed(() => {
  if (otpChannel.value === "whatsapp") {
    return "WhatsApp terdaftar";
  }
  return maskEmailForUi(email.value);
});

const otpHasWhatsapp = computed(() =>
  otpAvailableChannels.value.includes("whatsapp")
);

const focusOtpInput = (index) => {
  const inputComponent = otpInputs.value?.[index];
  const inputEl = inputComponent?.$el?.querySelector("input");
  if (inputEl) {
    inputEl.focus();
    inputEl.select();
  }
};

const startOtpCountdown = (seconds) => {
  otpCountdown.value = Math.max(0, seconds || 0);
  if (otpTimer.value) {
    clearInterval(otpTimer.value);
  }
  otpTimer.value = setInterval(() => {
    if (otpCountdown.value <= 0) {
      clearInterval(otpTimer.value);
      otpTimer.value = null;
      return;
    }
    otpCountdown.value -= 1;
  }, 1000);
};

const resetOtpInputs = () => {
  otpDigits.value = Array(6).fill("");
  nextTick(() => focusOtpInput(0));
};

const handleOtpInput = (index, event) => {
  otpErrorMessage.value = "";
  const rawValue = String(
    typeof event === "string" ? event : event?.target?.value || ""
  ).replace(/\\D/g, "");
  if (!rawValue) {
    otpDigits.value[index] = "";
    return;
  }

  const chars = rawValue.split("");
  chars.forEach((char, offset) => {
    const targetIndex = index + offset;
    if (targetIndex < otpDigits.value.length) {
      otpDigits.value[targetIndex] = char;
    }
  });

  const nextIndex = Math.min(index + chars.length, otpDigits.value.length - 1);
  focusOtpInput(nextIndex);
};

const handleOtpKeydown = (index, event) => {
  if (event.key === "Backspace" && !otpDigits.value[index] && index > 0) {
    focusOtpInput(index - 1);
  }
};

// Handle Google Sign In button click
const handleGoogleSignIn = async () => {
  isGoogleLoading.value = true;
  errorMessage.value = "";

  try {
    // Get redirect URL (current page URL to handle callback)
    const redirectUrl = `${window.location.origin}/auth/signin`;

    // Call backend to get Google OAuth URL
    const response = await authAPI.getGoogleAuthUrl(redirectUrl);

    if (response.success && response.data?.authUrl) {
      // Redirect to Google OAuth URL
      window.location.href = response.data.authUrl;
    } else {
      errorMessage.value =
        response.message || "Gagal mendapatkan tautan Google OAuth";
      isGoogleLoading.value = false;
    }
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    errorMessage.value = error.message || "Gagal memulai login dengan Google";
    isGoogleLoading.value = false;
  }
};

// Handle sign in
const handleSignIn = async () => {
  if (!valid.value) return;

  errorMessage.value = "";

  const result = await appStore.login({
    email: email.value,
    password: password.value,
  });

  if (result.success) {
    // Redirect to home
    router.push("/home");
  } else {
    if (
      result.code === "ACCOUNT_INACTIVE_NEEDS_OTP" &&
      result.details?.userId
    ) {
      otpUserId.value = result.details.userId;
      otpChannel.value = result.details.otpChannel || "email";
      otpAvailableChannels.value = result.details.availableChannels || [
        "email",
      ];
      otpDialog.value = true;
      otpErrorMessage.value = "";
      startOtpCountdown(
        result.details.cooldownSeconds || result.retryAfter || 60
      );
      resetOtpInputs();
      return;
    }
    errorMessage.value = result.error;
  }
};

const handleVerifyOtp = async () => {
  if (otpCode.value.length !== 6 || otpSubmitting.value) return;
  otpSubmitting.value = true;
  otpErrorMessage.value = "";

  const result = await appStore.verifyOtp({
    userId: otpUserId.value,
    code: otpCode.value,
    channel: otpChannel.value,
  });

  otpSubmitting.value = false;

  if (result.success) {
    otpDialog.value = false;
    router.push("/home");
  } else {
    otpErrorMessage.value = result.error || "Kode OTP tidak valid";
  }
};

const handleResendOtp = async () => {
  if (otpResending.value) return;
  otpResending.value = true;
  otpErrorMessage.value = "";

  const result = await appStore.resendOtp({
    userId: otpUserId.value,
    channel: otpChannel.value,
  });

  otpResending.value = false;

  if (result.success) {
    startOtpCountdown(result.cooldownSeconds || 60);
    if (result.availableChannels) {
      otpAvailableChannels.value = result.availableChannels;
    }
    resetOtpInputs();
  } else {
    if (result.retryAfter) {
      startOtpCountdown(result.retryAfter);
    }
    otpErrorMessage.value = result.error || "Gagal mengirim ulang OTP";
  }
};

// Handle Google OAuth callback (when redirected back from backend)
const handleGoogleCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("accessToken");
  const refreshToken = urlParams.get("refreshToken");
  const code = urlParams.get("code");

  // If we have tokens in query params (backend redirected with state)
  if (accessToken && refreshToken) {
    isGoogleLoading.value = true;
    errorMessage.value = "";

    try {
      const result = await appStore.handleGoogleOAuthCallback(
        accessToken,
        refreshToken
      );

      if (result.success) {
        // Clean URL by removing query params
        window.history.replaceState({}, document.title, "/auth/signin");
        router.push("/home");
      } else {
        errorMessage.value = result.error || "Login Google gagal";
        isGoogleLoading.value = false;
      }
    } catch (error) {
      console.error("Error handling Google callback:", error);
      errorMessage.value = error.message || "Gagal menyelesaikan login Google";
      isGoogleLoading.value = false;
    }
    return;
  }

  // If we have code but no tokens, backend might have returned JSON response
  // This happens when backend callback doesn't use state redirect
  if (code) {
    // The backend should have already handled this, but if we're here,
    // it means the callback endpoint returned JSON instead of redirecting
    // In this case, we need to check if there's an error or handle it differently
    const error = urlParams.get("error");
    if (error) {
      errorMessage.value = decodeURIComponent(error) || "Login Google gagal";
    }
  }
};

// Lifecycle
onMounted(() => {
  // Check if this is a callback from Google OAuth
  handleGoogleCallback();
});

onBeforeUnmount(() => {
  if (otpTimer.value) {
    clearInterval(otpTimer.value);
  }
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}

.login-logo {
  width: clamp(96px, 26vw, 150px);
  height: clamp(96px, 26vw, 150px);
}

.login-card-title {
  padding: 28px 24px 12px;
}

.login-card-text {
  padding: 0 24px 24px;
}

.login-heading {
  font-size: clamp(1.4rem, 4.2vw, 2rem) !important;
  line-height: 1.2;
}

.login-subtitle {
  font-size: clamp(0.95rem, 3.4vw, 1.1rem) !important;
}

@media (max-width: 600px) {
  .login-card-title {
    padding: 20px 16px 8px;
  }

  .login-card-text {
    padding: 0 16px 20px;
  }

  .otp-inputs {
    gap: 6px;
  }
}

.google-signin-btn {
  border: 1px solid #dadce0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #3c4043 !important;
  background-color: #ffffff !important;
}

.google-signin-btn:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  background-color: #f8f9fa !important;
  color: #202124 !important;
}

.google-signin-btn:disabled {
  background-color: #f8f9fa !important;
  color: #9aa0a6 !important;
  border-color: #dadce0 !important;
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
