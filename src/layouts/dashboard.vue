<template>
  <v-slide-x-transition>
    <v-navigation-drawer
      v-if="!isPrinting"
      v-model="drawer"
      mobile-breakpoint="md"
      :rail="rail"
      :permanent="permanent"
      app
      @click="rail = false"
    >
      <v-list density="compact" nav>
        <v-list-item>
          <template #prepend>
            <v-img
              src="/favicon.ico"
              alt="Logo"
              :width="rail ? '24' : '32'"
              :height="rail ? '24' : '32'"
              class="mr-3"
            />
          </template>

          <v-list-item-title
            v-show="!rail"
            class="font-weight-bold text-primary"
          >
            SI PALING PKP
          </v-list-item-title>

          <template #append>
            <v-btn
              icon="mdi-chevron-double-left"
              variant="text"
              class="d-none d-md-block"
              @click.stop="toggleRail"
            />
          </template>
        </v-list-item>

        <v-divider :class="rail ? 'mx-1 mb-1' : 'mx-4 mb-2'" />

        <v-tooltip
          v-for="item in navigationItems"
          :key="item.value"
          :text="item.title"
          location="right"
          :disabled="!rail"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :prepend-icon="item.icon"
              :title="rail ? undefined : item.title"
              :value="item.value"
              :to="{ path: item.path }"
              :active-class="'bg-primary text-white'"
            />
          </template>
        </v-tooltip>

        <v-divider
          v-if="accountNavigationItems.length"
          :class="rail ? 'mx-1 my-2' : 'mx-4 my-3'"
        />

        <v-tooltip
          v-for="item in accountNavigationItems"
          :key="item.value"
          :text="item.title"
          location="right"
          :disabled="!rail"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :prepend-icon="item.icon"
              :title="rail ? undefined : item.title"
              :value="item.value"
              :to="{ path: item.path }"
              :active-class="'bg-primary text-white'"
            />
          </template>
        </v-tooltip>
      </v-list>
    </v-navigation-drawer>
  </v-slide-x-transition>

  <!-- App Bar -->
  <v-app-bar
    v-if="!isPrinting"
    flat
    class="border-b"
    color="white"
    elevation="0"
  >
    <v-app-bar-nav-icon class="d-md-none" @click="toggleDrawer" />

    <v-app-bar-title class="d-md-none">
      <v-img
        src="/favicon.ico"
        alt="Logo"
        :width="rail ? '24' : '32'"
        :height="rail ? '24' : '32'"
        class="mr-3"
      />
    </v-app-bar-title>

    <v-spacer />

    <!-- Right Side Actions -->
    <v-menu v-model="notificationMenu" location="bottom end" offset="8">
      <template #activator="{ props }">
        <v-btn v-bind="props" icon="mdi-bell" variant="text" class="mr-2">
          <v-badge
            color="error"
            :content="unreadCount"
            :model-value="unreadCount > 0"
          >
            <v-icon>mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card width="380" elevation="6">
        <v-card-title
          class="text-subtitle-1 font-weight-bold d-flex align-center justify-space-between"
        >
          Pemberitahuan
          <v-btn
            variant="text"
            size="small"
            :disabled="!unreadCount"
            @click="handleMarkAllRead"
          >
            Tandai semua
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <div class="px-4 py-3">
            <v-chip-group
              v-model="notificationCategory"
              column
              class="notification-filters"
            >
              <v-chip
                v-for="category in notificationCategories"
                :key="category.value"
                :value="category.value"
                size="small"
                variant="outlined"
              >
                {{ category.label }}
              </v-chip>
            </v-chip-group>
          </div>
          <v-divider />
          <v-list v-if="filteredNotifications.length" density="compact">
            <v-list-item
              v-for="item in filteredNotifications"
              :key="item.id"
              class="py-2"
              @click="handleOpenNotification(item)"
            >
              <template #prepend>
                <v-icon :color="getNotificationColor(item)" class="me-3">
                  {{ getNotificationIcon(item) }}
                </v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">
                {{ item.title }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption text-medium-emphasis">
                {{ item.message }}
              </v-list-item-subtitle>
              <template #append>
                <v-chip
                  v-if="!item.isRead"
                  size="x-small"
                  color="error"
                  variant="tonal"
                >
                  Baru
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="pa-4 text-body-2 text-medium-emphasis">
            Belum ada pemberitahuan baru.
          </div>
        </v-card-text>
      </v-card>
    </v-menu>

    <!-- User Menu -->
    <v-menu>
      <template #activator="{ props }">
        <v-btn v-bind="props" variant="text" class="ml-2">
          <v-avatar size="32" class="mr-2">
            <v-img :src="userProfile.avatar" :alt="userProfile.name" />
          </v-avatar>
          <span class="d-none d-sm-inline text-body-2 font-weight-medium">
            {{ userProfile.name }}
          </span>
          <v-icon class="ml-1"> mdi-chevron-down </v-icon>
        </v-btn>
      </template>

      <v-list min-width="200">
        <v-list-item
          prepend-icon="mdi-account"
          title="Profile saya"
          @click="goToProfile"
        />

        <v-list-item
          prepend-icon="mdi-cog"
          title="Pengaturan Akun"
          @click="goToSettings"
        />

        <v-divider />

        <v-list-item
          prepend-icon="mdi-logout"
          title="Keluar"
          class="text-error"
          @click="handleSignOut"
        />
      </v-list>
    </v-menu>
  </v-app-bar>

  <!-- Main Content -->
  <v-main>
    <v-container fluid class="pa-6">
      <router-view />
    </v-container>
  </v-main>
</template>

<style scoped>
.notification-filters :deep(.v-slide-group__content) {
  gap: 8px;
  flex-wrap: wrap;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useMapUiStore } from "@/stores/mapUi";
import { notificationAPI } from "@/services";

const router = useRouter();
const appStore = useAppStore();
const mapUiStore = useMapUiStore();
const isPrinting = computed(() => mapUiStore.isPrinting);

// Reactive data
const drawer = ref(true);
const rail = ref(false);
const permanent = ref(false);

const notifications = ref([]);
const unreadCount = ref(0);
const notificationMenu = ref(false);
const notificationTimer = ref(null);
const notificationCategory = ref("all");

// Computed user profile from store
const resolveFileUrl = (rawValue) => {
  if (!rawValue) return "";
  const raw = String(rawValue).replace(/\\/g, "/");
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const apiRoot = baseUrl.replace(/\/api$/i, "");
  const rebasePath = (path) => (apiRoot ? `${apiRoot}${path}` : path);

  if (/^https?:\/\//i.test(raw) || raw.startsWith("blob:")) {
    try {
      const url = new URL(raw);
      if (url.pathname.startsWith("/api/files/")) {
        return rebasePath(url.pathname);
      }
      if (url.pathname.startsWith("/files/")) {
        return rebasePath(`/api${url.pathname}`);
      }
    } catch {
      return raw;
    }
    return raw;
  }

  if (raw.startsWith("/api/files/") || raw.startsWith("api/files/")) {
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return rebasePath(path);
  }
  if (raw.startsWith("/files/") || raw.startsWith("files/")) {
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return rebasePath(`/api${path}`);
  }
  const prefix = baseUrl ? `${baseUrl}/files/` : "/api/files/";
  return `${prefix}${raw.replace(/^\/+/, "")}`;
};

const userProfile = computed(() => {
  const avatarSource =
    appStore.user?.avatarUrl ||
    appStore.user?.avatar_url ||
    appStore.user?.avatar ||
    appStore.user?.profilePhotoUrl ||
    appStore.user?.photoUrl ||
    "";

  return {
    name: appStore.user?.fullName || "User",
    role: appStore.primaryRoleName || appStore.user?.userLevel || "User",
    avatar: resolveFileUrl(avatarSource),
  };
});

const baseNavigationItems = [
  {
    title: "Beranda",
    icon: "mdi-view-dashboard",
    value: "home",
    path: "/home",
    permission: null,
  },
  {
    title: "Survei Mandiri",
    icon: "mdi-file-document-edit",
    value: "form-self",
    path: "/form",
    permission: "housing:create",
  },
  {
    title: "Input Warga",
    icon: "mdi-account-edit",
    value: "form-admin",
    path: "/form",
    permission: "housing:create",
  },
  {
    title: "Survei Infrastruktur",
    icon: "mdi-city",
    value: "infrastructure-form",
    path: "/infrastructure-form",
    permission: "facility:create",
  },
  {
    title: "Perumahan Pengembang",
    icon: "mdi-home-group",
    value: "housing-development-form",
    path: "/housing-development-form",
    permission: "housing_development:create",
  },
  // {
  //   title: 'Survei Perumahan',
  //   icon: 'mdi-home-group',
  //   value: 'housing-development-form',
  //   path: '/housing-development-form'
  // },
  {
    title: "Data Rumah Masyarakat",
    icon: "mdi-home-search",
    value: "housing-data",
    path: "/housing-data",
    permission: "housing:read",
  },
  {
    title: "Data Infrastruktur",
    icon: "mdi-city-variant",
    value: "infrastructure-data",
    path: "/infrastructure-data",
    permission: "facility:read",
  },
  {
    title: "Data Perumahan",
    icon: "mdi-home-group",
    value: "housing-development-data",
    path: "/housing-development-data",
    permission: "housing_development:read",
  },
  {
    title: "Pengguna",
    icon: "mdi-account-group",
    value: "users",
    path: "/users",
    permission: "manage_users",
  },
  {
    title: "Profil Saya",
    icon: "mdi-account",
    value: "profile",
    path: "/profile",
    permission: null,
    section: "account",
  },
  {
    title: "Pengaturan Akun",
    icon: "mdi-cog",
    value: "settings",
    path: "/settings",
    permission: null,
    section: "account",
  },
];

const accountNavigationItems = computed(() =>
  baseNavigationItems.filter((item) => item.section === "account")
);
const operationalNavigationItems = computed(() =>
  baseNavigationItems.filter((item) => item.section !== "account")
);

const navigationItems = computed(() => {
  if (appStore.isMasyarakat) {
    const allowed = new Set(["home", "form-self"]);
    return operationalNavigationItems.value.filter((item) =>
      allowed.has(item.value)
    );
  }

  if (appStore.isSuperAdmin) {
    return operationalNavigationItems.value.filter(
      (item) => item.value !== "form-self"
    );
  }

  if (appStore.isVerifikator) {
    return operationalNavigationItems.value.filter((item) => {
      if (item.permission) {
        const permissions = Array.isArray(item.permission)
          ? item.permission
          : [item.permission];
        if (
          permissions.some((permission) =>
            String(permission).includes(":create")
          )
        ) {
          return false;
        }
        return appStore.hasAnyPermission(permissions);
      }
      return item.value !== "form-self";
    });
  }

  if (appStore.isAdminKabupaten) {
    const allowed = new Set([
      "home",
      "housing-data",
      "infrastructure-data",
      "housing-development-data",
      "housing-development-form",
    ]);
    return operationalNavigationItems.value.filter((item) =>
      allowed.has(item.value)
    );
  }

  if (appStore.isAdminDesa) {
    const allowed = new Set([
      "home",
      "form-admin",
      "infrastructure-form",
      "infrastructure-data",
      "housing-data",
    ]);
    return operationalNavigationItems.value
      .filter((item) => allowed.has(item.value))
      .map((item) => {
        if (item.value === "form-admin") {
          return { ...item, title: "Input Rumah Masyarakat" };
        }
        if (item.value === "housing-data") {
          return { ...item, title: "Data Rumah Desa" };
        }
        return item;
      });
  }

  const canCheckPermissions = appStore.permissionNames.length > 0;
  return operationalNavigationItems.value.filter((item) => {
    if (item.permission && canCheckPermissions) {
      const permissions = Array.isArray(item.permission)
        ? item.permission
        : [item.permission];
      if (!appStore.hasAnyPermission(permissions)) {
        return false;
      }
    }
    return true;
  });
});

const notificationCategories = [
  { label: "Semua", value: "all" },
  { label: "Keamanan", value: "security" },
  { label: "Verifikasi", value: "verification" },
  { label: "Status", value: "status" },
  { label: "Audit", value: "audit" },
];

const filteredNotifications = computed(() => {
  if (notificationCategory.value === "all") return notifications.value;
  return notifications.value.filter(
    (item) => item.category === notificationCategory.value
  );
});

const fetchNotifications = async () => {
  try {
    const [listResponse, countResponse] = await Promise.all([
      notificationAPI.getNotifications({ limit: 10 }),
      notificationAPI.getUnreadCount(),
    ]);
    if (listResponse.success) {
      notifications.value = listResponse.data?.notifications || [];
    }
    if (countResponse.success) {
      unreadCount.value = countResponse.data?.count || 0;
    }
  } catch (error) {
    console.warn("Failed to fetch notifications:", error.message);
  }
};

const normalizeNotificationLink = (value) => {
  if (!value) return "";
  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(value, window.location.origin);
    return `${url.pathname}${url.search}`.replace(/\/+$/, "");
  } catch (error) {
    return String(value);
  }
};

const getBlockedRoutesByRole = () => {
  if (appStore.isAdminKabupaten) {
    return new Set(["/form", "/infrastructure-form"]);
  }
  if (appStore.isAdminDesa) {
    return new Set([
      "/housing-development-form",
      "/housing-development-data",
      "/users",
    ]);
  }
  if (appStore.isMasyarakat) {
    return new Set([
      "/housing-data",
      "/infrastructure-data",
      "/housing-development-form",
      "/housing-development-data",
      "/users",
    ]);
  }
  return new Set();
};

const resolveNotificationTarget = (item) => {
  if (!item?.link) return "";
  try {
    const url = new URL(item.link, window.location.origin);
    const blockedRoutes = getBlockedRoutesByRole();
    if (blockedRoutes.has(url.pathname)) {
      return "/home";
    }
    return `${url.pathname}${url.search}`;
  } catch (error) {
    return "";
  }
};

const markNotificationsForRoute = async (fullPath) => {
  if (!fullPath) return;
  const current = normalizeNotificationLink(fullPath);
  if (!current) return;
  const toMark = notifications.value.filter((item) => {
    if (!item?.link || item.isRead) return false;
    const linkPath = normalizeNotificationLink(item.link);
    if (!linkPath) return false;
    if (current === linkPath) return true;
    return linkPath.includes("?")
      ? current.startsWith(linkPath)
      : current.startsWith(linkPath);
  });
  if (!toMark.length) return;
  await Promise.all(
    toMark.map((item) => notificationAPI.markAsRead(item.id).catch(() => null))
  );
  toMark.forEach((item) => {
    item.isRead = true;
  });
  unreadCount.value = Math.max(unreadCount.value - toMark.length, 0);
};

const handleOpenNotification = async (item) => {
  if (!item) return;
  if (!item.isRead) {
    await notificationAPI.markAsRead(item.id).catch(() => {});
    item.isRead = true;
    unreadCount.value = Math.max(unreadCount.value - 1, 0);
  }
  if (item.link) {
    notificationMenu.value = false;
    const target = resolveNotificationTarget(item);
    if (target) {
      router.push(target);
    }
  }
};

const handleMarkAllRead = async () => {
  await notificationAPI.markAllAsRead().catch(() => {});
  notifications.value = notifications.value.map((item) => ({
    ...item,
    isRead: true,
  }));
  unreadCount.value = 0;
};

const getNotificationIcon = (item) => {
  const type = item?.type || "info";
  if (type === "success") return "mdi-check-circle";
  if (type === "warning") return "mdi-alert-circle";
  return "mdi-information";
};

const getNotificationColor = (item) => {
  const type = item?.type || "info";
  if (type === "success") return "success";
  if (type === "warning") return "warning";
  return "info";
};

// Methods
const goToProfile = () => {
  router.push("/profile");
};

const goToSettings = () => {
  router.push("/settings");
};

const handleSignOut = async () => {
  await appStore.logout();
  router.push("/auth/signin");
};

const toggleRail = () => {
  rail.value = !rail.value;
};

const toggleDrawer = () => {
  rail.value = false;
  drawer.value = !drawer.value;
};

const handleSize = () => {
  if (window.innerWidth >= 1280) {
    drawer.value = true;
    rail.value = false;
    permanent.value = true;
  } else if (window.innerWidth >= 960) {
    drawer.value = true;
    rail.value = true;
    permanent.value = true;
  } else {
    drawer.value = false;
    rail.value = false;
    permanent.value = false;
  }
};

const triggerMapResize = () => {
  setTimeout(() => {
    mapUiStore.signalMapResize();
  }, 180);
};

// Lifecycle
onMounted(() => {
  handleSize();
  window.addEventListener("resize", handleSize);
  fetchNotifications();
  notificationTimer.value = setInterval(fetchNotifications, 90000);
  markNotificationsForRoute(router.currentRoute.value.fullPath);
});

watch(
  () => router.currentRoute.value.fullPath,
  (value) => {
    markNotificationsForRoute(value);
  }
);

watch([drawer, rail, permanent], () => {
  triggerMapResize();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleSize);
  if (notificationTimer.value) {
    clearInterval(notificationTimer.value);
  }
});
</script>
