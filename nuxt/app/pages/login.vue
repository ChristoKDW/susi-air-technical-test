<template>
  <div class="login-page">
    <div class="brand-header">
      <div class="logo-wrap">
        <img src="/images/susi-air-logo.png" alt="Susi Air Logo" class="susi-logo-img" />
      </div>
      <h1 class="brand-title">SUSI AIR</h1>
      <p class="brand-subtitle">Flight Operations & Crew Portal</p>
    </div>

    <div class="login-card card-base">
      <div class="card-header">
        <h2 class="title">Sign In</h2>
        <p class="subtitle">Please enter your credentials to access flight systems</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="errorMessage" class="error-banner">
          <AlertCircle :size="18" class="error-icon" />
          <span>{{ errorMessage }}</span>
        </div>

        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <div class="input-wrap">
            <User :size="18" class="input-icon" />
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="e.g. johndoe"
              class="form-input"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="input-wrap">
            <Lock :size="18" class="input-icon" />
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••••••"
              class="form-input"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="toggle-pwd"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <EyeOff v-if="showPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn-pill btn-primary submit-btn"
          :disabled="authStore.isLoading"
        >
          <span v-if="!authStore.isLoading">Sign In to Cockpit</span>
          <span v-else class="loading-state">
            <Loader2 :size="18" class="spin" />
            Authenticating...
          </span>
        </button>

        <div class="hint-box">
          <p class="hint-title">Demo Credentials</p>
          <p class="hint-desc">
            Username: <strong>johndoe</strong> | Password: <strong>susiairtest</strong>
          </p>
        </div>
      </form>
    </div>

    <div class="login-footer">
      <p>© 2026 PT ASI Pudjiastuti Aviation (Susi Air)</p>
      <p class="system-tag">CASR 135 Compliant Flight Limitation Tracker</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plane, User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('johndoe');
const password = ref('susiairtest');
const showPassword = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  errorMessage.value = '';
  try {
    await authStore.login(username.value.trim(), password.value);
    router.push('/');
  } catch (err: any) {
    errorMessage.value = err.message || 'Invalid username or password. Please try again.';
  }
}
</script>

<style scoped lang="scss">
$susi-navy: #0E2138;
$susi-red: #E63757;
$susi-white: #FFFFFF;
$susi-gray-500: #6B7280;
$susi-gray-700: #374151;
$susi-gray-200: #E5E7EB;

.login-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px 20px 24px;
  background: linear-gradient(180deg, $susi-navy 0%, #152A45 42%, #F5F6F8 42%, #F5F6F8 100%);
  min-height: 100vh;
}

.brand-header {
  text-align: center;
  margin-bottom: 24px;
  color: $susi-white;

  .logo-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    margin-bottom: 12px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);

    .susi-logo-img {
      height: 38px;
      object-fit: contain;
    }
  }

  .brand-title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }

  .brand-subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
}

.login-card {
  padding: 24px 20px;
  margin-bottom: 24px;

  .card-header {
    margin-bottom: 20px;

    .title {
      font-size: 20px;
      font-weight: 700;
      color: $susi-navy;
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 13px;
      color: $susi-gray-500;
    }
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .error-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #FDE8EC;
    color: $susi-red;
    border: 1px solid rgba(230, 55, 87, 0.3);
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;

    .error-icon {
      flex-shrink: 0;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .form-label {
      font-size: 13px;
      font-weight: 600;
      color: $susi-gray-700;
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 14px;
        color: $susi-gray-500;
        pointer-events: none;
      }

      .form-input {
        width: 100%;
        padding: 12px 14px 12px 42px;
        font-family: inherit;
        font-size: 14px;
        color: $susi-navy;
        background-color: #F9FAFB;
        border: 1.5px solid $susi-gray-200;
        border-radius: 12px;
        outline: none;
        transition: all 0.2s;

        &:focus {
          background-color: $susi-white;
          border-color: $susi-navy;
          box-shadow: 0 0 0 3px rgba(14, 33, 56, 0.1);
        }
      }

      .toggle-pwd {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        color: $susi-gray-500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
      }
    }
  }

  .submit-btn {
    width: 100%;
    margin-top: 8px;
    padding: 14px;
    font-size: 15px;

    .loading-state {
      display: flex;
      align-items: center;
      gap: 8px;

      .spin {
        animation: spin 1s linear infinite;
      }
    }
  }

  .hint-box {
    margin-top: 6px;
    padding: 10px 12px;
    background-color: #F8FAFC;
    border: 1px dashed $susi-gray-200;
    border-radius: 10px;
    text-align: center;

    .hint-title {
      font-size: 11px;
      font-weight: 700;
      color: $susi-navy;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .hint-desc {
      font-size: 12px;
      color: $susi-gray-500;
    }
  }
}

.login-footer {
  text-align: center;
  color: $susi-gray-500;
  font-size: 11px;
  line-height: 1.5;

  .system-tag {
    color: #9CA3AF;
    font-size: 10px;
    margin-top: 2px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
