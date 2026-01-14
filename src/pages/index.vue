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
        cols="12"
        class="text-center"
      >
        <v-img
          src="/favicon.ico"
          alt="Logo"
          max-width="120"
          class="mx-auto mb-8"
        />
        <h1 class="text-h2 font-weight-bold text-primary mb-4">
          Selamat Datang di SIPALING PKP
        </h1>
        <p class="text-h6 text-medium-emphasis mb-8">
          Kelola aplikasi Anda dengan mudah
        </p>
        
        <div class="d-flex flex-column flex-sm-row justify-center gap-4">
          <v-btn
            color="primary"
            size="x-large"
            prepend-icon="mdi-login"
            to="/auth/signin"
            class="px-8"
          >
            Masuk
          </v-btn>
          
          <v-btn
            variant="outlined"
            color="primary"
            size="x-large"
            prepend-icon="mdi-account-plus"
            to="/auth/signup"
            class="px-8"
          >
            Daftar
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
