import { defineStore } from 'pinia';

export interface PilotProfile {
  username: string;
  name: string;
  totalFlightHours: number;
  avatarUrl?: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase || 'http://localhost:3000';

  const tokenCookie = useCookie<string | null>('susi_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  });

  const token = ref<string | null>(tokenCookie.value || null);
  const pilot = ref<PilotProfile | null>(null);
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  // Set authorization header
  const authHeaders = computed(() => {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {};
  });

  async function login(username: string, password: string) {
    isLoading.value = true;
    try {
      const response = await $fetch<{
        accessToken: string;
        tokenType: string;
        pilot: PilotProfile;
      }>(`${apiBase}/auth/login`, {
        method: 'POST',
        body: { username, password },
      });

      token.value = response.accessToken;
      tokenCookie.value = response.accessToken;
      pilot.value = response.pilot;
      return response;
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';
      const cleanMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      throw new Error(cleanMsg);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchProfile() {
    if (!token.value) return null;
    try {
      const data = await $fetch<PilotProfile>(`${apiBase}/pilot/me`, {
        headers: authHeaders.value,
      });
      pilot.value = data;
      return data;
    } catch (err) {
      logout();
      return null;
    }
  }

  function logout() {
    token.value = null;
    tokenCookie.value = null;
    pilot.value = null;
    navigateTo('/login');
  }

  return {
    token,
    pilot,
    isLoading,
    isAuthenticated,
    authHeaders,
    login,
    fetchProfile,
    logout,
  };
});
