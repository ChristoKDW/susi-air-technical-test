<template>
  <div class="home-page">
    <!-- 1. Header Section -->
    <header class="app-header">
      <div class="header-top">
        <div class="greeting-wrap">
          <span class="greeting-subtitle">Welcome back,</span>
          <h1 class="pilot-name">{{ pilotProfile?.name || 'Captain' }}</h1>
        </div>
        <div class="header-actions">
          <div class="pilot-avatar">
            <img
              v-if="pilotProfile?.avatarUrl"
              :src="pilotProfile.avatarUrl"
              :alt="pilotProfile?.name"
              class="avatar-img"
            />
            <span v-else class="avatar-text">{{ avatarInitials }}</span>
          </div>
          <button @click="authStore.logout()" class="logout-btn" title="Sign Out">
            <LogOut :size="18" />
          </button>
        </div>
      </div>

      <div class="flight-stats-pill">
        <div class="stat-icon-wrap">
          <Clock :size="18" class="stat-icon" />
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Flight Hours</span>
          <span class="stat-value num-extra-bold">{{ formattedTotalHours }} <small>hrs</small></span>
        </div>
        <div class="system-status">
          <span class="status-dot"></span>
          <span class="status-text">Active Duty</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="page-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <Loader2 :size="32" class="spin loader-icon" />
        <p>Loading flight compliance data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container card-base">
        <AlertCircle :size="24" class="error-icon" />
        <p>{{ error }}</p>
        <button @click="fetchDashboardData" class="btn-pill btn-primary retry-btn">Retry</button>
      </div>

      <template v-else>
        <!-- 2. Section: Hours to Limit -->
        <section class="section-container">
          <div class="section-header">
            <div>
              <h2 class="section-title">Hours to Limit</h2>
              <p class="section-subtitle">Rolling flight limitation compliance</p>
            </div>
            <div class="today-tag">
              <Calendar :size="13" />
              <span>15 May 2026</span>
            </div>
          </div>

          <!-- 4 Summary Cards Grid -->
          <div class="limit-cards-grid">
            <!-- Daily Card -->
            <div class="limit-card card-base" :class="{ exceeded: summaryData?.limits?.daily?.isExceeded }">
              <div class="card-top">
                <span class="card-badge">Daily</span>
                <span class="card-limit num-bold">8h max</span>
              </div>
              <div class="card-value-wrap">
                <span class="card-value num-extra-bold">{{ summaryData?.limits?.daily?.current }}</span>
                <span class="card-unit">/ 8h</span>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  :style="{ width: Math.min(100, summaryData?.limits?.daily?.percentage || 0) + '%' }"
                  :class="{ 'fill-danger': summaryData?.limits?.daily?.isExceeded }"
                ></div>
              </div>
              <div class="card-foot">
                <span class="foot-remaining num-bold">{{ summaryData?.limits?.daily?.remaining }}h left</span>
                <span class="foot-percent num-bold">{{ summaryData?.limits?.daily?.percentage }}%</span>
              </div>
            </div>

            <!-- Weekly Card -->
            <div class="limit-card card-base" :class="{ exceeded: summaryData?.limits?.weekly?.isExceeded }">
              <div class="card-top">
                <span class="card-badge">Weekly</span>
                <span class="card-limit num-bold">40h max</span>
              </div>
              <div class="card-value-wrap">
                <span class="card-value num-extra-bold">{{ summaryData?.limits?.weekly?.current }}</span>
                <span class="card-unit">/ 40h</span>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  :style="{ width: Math.min(100, summaryData?.limits?.weekly?.percentage || 0) + '%' }"
                  :class="{ 'fill-danger': summaryData?.limits?.weekly?.isExceeded }"
                ></div>
              </div>
              <div class="card-foot">
                <span class="foot-remaining num-bold">{{ summaryData?.limits?.weekly?.remaining }}h left</span>
                <span class="foot-percent num-bold">{{ summaryData?.limits?.weekly?.percentage }}%</span>
              </div>
            </div>

            <!-- Monthly Card -->
            <div class="limit-card card-base" :class="{ exceeded: summaryData?.limits?.monthly?.isExceeded }">
              <div class="card-top">
                <span class="card-badge">Monthly</span>
                <span class="card-limit num-bold">100h max</span>
              </div>
              <div class="card-value-wrap">
                <span class="card-value num-extra-bold">{{ summaryData?.limits?.monthly?.current }}</span>
                <span class="card-unit">/ 100h</span>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  :style="{ width: Math.min(100, summaryData?.limits?.monthly?.percentage || 0) + '%' }"
                  :class="{ 'fill-danger': summaryData?.limits?.monthly?.isExceeded }"
                ></div>
              </div>
              <div class="card-foot">
                <span class="foot-remaining num-bold">{{ summaryData?.limits?.monthly?.remaining }}h left</span>
                <span class="foot-percent num-bold">{{ summaryData?.limits?.monthly?.percentage }}%</span>
              </div>
            </div>

            <!-- Annual Card -->
            <div class="limit-card card-base" :class="{ exceeded: summaryData?.limits?.annual?.isExceeded }">
              <div class="card-top">
                <span class="card-badge">Annual</span>
                <span class="card-limit num-bold">1050h max</span>
              </div>
              <div class="card-value-wrap">
                <span class="card-value num-extra-bold">{{ summaryData?.limits?.annual?.current }}</span>
                <span class="card-unit">/ 1050h</span>
              </div>
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  :style="{ width: Math.min(100, summaryData?.limits?.annual?.percentage || 0) + '%' }"
                  :class="{ 'fill-danger': summaryData?.limits?.annual?.isExceeded }"
                ></div>
              </div>
              <div class="card-foot">
                <span class="foot-remaining num-bold">{{ summaryData?.limits?.annual?.remaining }}h left</span>
                <span class="foot-percent num-bold">{{ summaryData?.limits?.annual?.percentage }}%</span>
              </div>
            </div>
          </div>

          <!-- Rolling Sum Chart Card -->
          <div class="chart-card card-base">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-title">Rolling Hours Trend</h3>
                <p class="chart-subtitle">15-day window centered on today</p>
              </div>

              <!-- Toggles: 1w, 1m, 3m, 6m, 1y -->
              <div class="chart-toggles">
                <button
                  v-for="t in ['1w', '1m', '3m', '6m', '1y']"
                  :key="t"
                  class="toggle-btn"
                  :class="{ active: currentRange === t }"
                  @click="changeRange(t as any)"
                >
                  {{ t }}
                </button>
              </div>
            </div>

            <!-- Interactive SVG Rolling Sum Chart -->
            <div class="chart-stage">
              <svg
                class="chart-svg"
                viewBox="0 0 380 180"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#22C5E8" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="#22C5E8" stop-opacity="0.0" />
                  </linearGradient>
                  <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#E63757" stop-opacity="0.4" />
                    <stop offset="100%" stop-color="#E63757" stop-opacity="0.0" />
                  </linearGradient>
                </defs>

                <!-- Gridlines -->
                <line x1="25" y1="20" x2="365" y2="20" stroke="#E5E7EB" stroke-dasharray="3,3" />
                <line x1="25" y1="80" x2="365" y2="80" stroke="#E5E7EB" stroke-dasharray="3,3" />
                <line x1="25" y1="140" x2="365" y2="140" stroke="#E5E7EB" stroke-width="1" />

                <!-- Red Horizontal Limit Line -->
                <line
                  v-if="chartMetrics.limitY !== null"
                  x1="25"
                  :y1="chartMetrics.limitY"
                  x2="365"
                  :y2="chartMetrics.limitY"
                  stroke="#E63757"
                  stroke-width="1.8"
                  stroke-dasharray="4,4"
                />

                <!-- Limit Label Tag -->
                <g v-if="chartMetrics.limitY !== null">
                  <rect
                    :x="285"
                    :y="Math.max(4, chartMetrics.limitY - 14)"
                    width="75"
                    height="16"
                    rx="4"
                    fill="#FDE8EC"
                  />
                  <text
                    :x="322"
                    :y="Math.max(15, chartMetrics.limitY - 2)"
                    text-anchor="middle"
                    fill="#E63757"
                    font-size="9"
                    font-weight="700"
                  >
                    LIMIT {{ summaryData?.chart?.limit }}h
                  </text>
                </g>

                <!-- Today Vertical Indicator Line -->
                <line
                  v-if="chartMetrics.todayPoint"
                  :x1="chartMetrics.todayPoint.x"
                  y1="15"
                  :x2="chartMetrics.todayPoint.x"
                  y2="140"
                  stroke="#0E2138"
                  stroke-width="1.2"
                  stroke-dasharray="2,2"
                />

                <!-- Area Fill Path -->
                <path
                  v-if="chartMetrics.areaPath"
                  :d="chartMetrics.areaPath"
                  fill="url(#areaGradient)"
                />

                <!-- Line Stroke Path -->
                <path
                  v-if="chartMetrics.linePath"
                  :d="chartMetrics.linePath"
                  fill="none"
                  stroke="#0E2138"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- Individual Data Points -->
                <g v-for="(pt, idx) in chartMetrics.points" :key="idx">
                  <!-- Exceeded Circle Halo -->
                  <circle
                    v-if="pt.value > (summaryData?.chart?.limit || 9999)"
                    :cx="pt.x"
                    :cy="pt.y"
                    r="6.5"
                    fill="none"
                    stroke="#E63757"
                    stroke-width="1.8"
                    stroke-opacity="0.8"
                  />

                  <!-- Core Dot -->
                  <circle
                    :cx="pt.x"
                    :cy="pt.y"
                    :r="pt.isToday ? 4.5 : 3"
                    :fill="pt.value > (summaryData?.chart?.limit || 9999) ? '#E63757' : (pt.isToday ? '#0E2138' : '#22C5E8')"
                    stroke="#FFFFFF"
                    stroke-width="1.5"
                    class="chart-point-dot"
                    @click="activePoint = pt"
                  />
                </g>
              </svg>

              <!-- Safe Layout Overflow Warning Tag if any points exceeded limit -->
              <div v-if="chartMetrics.hasExceeded" class="exceeded-alert-tag">
                <AlertCircle :size="12" />
                <span>Peak exceeds {{ summaryData?.chart?.limit }}h limit line. Headroom scaled safely.</span>
              </div>

              <!-- Active / Selected Point Tooltip -->
              <div class="point-tooltip-bar" v-if="activePoint">
                <span class="tt-date num-bold">{{ formatDisplayDate(activePoint.date) }}</span>
                <span class="tt-sep">•</span>
                <span class="tt-val">
                  Rolling: <strong class="num-bold" :class="{ 'text-danger': activePoint.value > (summaryData?.chart?.limit || 9999) }">{{ activePoint.value }}h</strong>
                </span>
                <span class="tt-sep">•</span>
                <span class="tt-daily">Day: <strong class="num-bold">{{ activePoint.hours }}h</strong></span>
                <span v-if="activePoint.isToday" class="tt-today-badge">TODAY</span>
              </div>

              <!-- X-Axis Labels: -7d, Today, +7d -->
              <div class="x-axis-labels">
                <span class="x-label">{{ chartMetrics.startDateLabel }}</span>
                <span class="x-label x-today">15 May (Today)</span>
                <span class="x-label">{{ chartMetrics.endDateLabel }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Section: My Documents -->
        <section class="section-container documents-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">My Documents</h2>
              <p class="section-subtitle">Licenses, medical & clearance validity</p>
            </div>
            <span class="count-tag num-bold">{{ documents.length }} items</span>
          </div>

          <div class="documents-list">
            <div
              v-for="doc in documents"
              :key="doc.id"
              class="document-card card-base"
            >
              <div class="doc-icon-wrap" :class="'icon-' + doc.status">
                <FileCheck v-if="doc.status === 'valid'" :size="20" />
                <Clock v-else-if="doc.status === 'expiring_soon'" :size="20" />
                <AlertTriangle v-else :size="20" />
              </div>

              <div class="doc-details">
                <h4 class="doc-label">{{ doc.label }}</h4>
                <div class="doc-expiry-wrap">
                  <span class="expiry-text">Expires: <strong class="num-bold">{{ doc.expiryDate }}</strong></span>
                  <span class="days-remaining num-bold" :class="'text-' + doc.status">
                    <span v-if="doc.daysRemaining > 0">{{ doc.daysRemaining }} days remaining</span>
                    <span v-else-if="doc.daysRemaining === 0">Expires Today</span>
                    <span v-else>{{ Math.abs(doc.daysRemaining) }} days expired</span>
                  </span>
                </div>
              </div>

              <div class="doc-badge-wrap">
                <span
                  class="badge-pill"
                  :class="{
                    'badge-success': doc.status === 'valid',
                    'badge-warning': doc.status === 'expiring_soon',
                    'badge-danger': doc.status === 'expired'
                  }"
                >
                  {{ doc.badge.label }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- Bottom Navigation -->
    <BottomNav @openPlaceholder="showPlaceholderModal" />

    <!-- Placeholder Modal -->
    <div v-if="placeholderVisible" class="modal-backdrop" @click="placeholderVisible = false">
      <div class="placeholder-sheet card-base" @click.stop>
        <div class="sheet-handle"></div>
        <div class="sheet-icon-wrap">
          <Plane :size="28" />
        </div>
        <h3 class="sheet-title">{{ placeholderTitle }}</h3>
        <p class="sheet-desc">Detail page coming soon. This module is undergoing operational certification.</p>
        <button class="btn-pill btn-primary sheet-btn" @click="placeholderVisible = false">
          Understood
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Clock,
  Calendar,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  LogOut,
  Plane,
  Loader2
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase || 'http://localhost:3000';

const isLoading = ref(true);
const error = ref('');
const summaryData = ref<any>(null);
const documents = ref<any[]>([]);
const currentRange = ref<'1w' | '1m' | '3m' | '6m' | '1y'>('1w');
const activePoint = ref<any>(null);

const placeholderVisible = ref(false);
const placeholderTitle = ref('Detail page coming soon');

const pilotProfile = computed(() => authStore.pilot);

const avatarInitials = computed(() => {
  const name = pilotProfile.value?.name || 'John Doe';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
});

const formattedTotalHours = computed(() => {
  const hours = pilotProfile.value?.totalFlightHours ?? 1444.5;
  return Number(hours).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
});

async function fetchDashboardData() {
  isLoading.value = true;
  error.value = '';
  try {
    const headers = authStore.authHeaders;

    // Concurrently fetch profile, flight hours summary, and documents
    const [profileRes, summaryRes, docsRes] = await Promise.all([
      authStore.fetchProfile(),
      $fetch<any>(`${apiBase}/flight-hours/summary?range=${currentRange.value}`, { headers }),
      $fetch<any>(`${apiBase}/documents`, { headers }),
    ]);

    summaryData.value = summaryRes;
    documents.value = docsRes.documents || [];

    // Set today point as active default
    if (summaryRes?.chart?.data) {
      const todayPt = summaryRes.chart.data.find((d: any) => d.isToday);
      activePoint.value = todayPt || summaryRes.chart.data[7];
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load cockpit dashboard data.';
  } finally {
    isLoading.value = false;
  }
}

async function changeRange(range: '1w' | '1m' | '3m' | '6m' | '1y') {
  currentRange.value = range;
  try {
    const res = await $fetch<any>(
      `${apiBase}/flight-hours/summary?range=${range}`,
      { headers: authStore.authHeaders },
    );
    summaryData.value = res;
    if (res?.chart?.data) {
      const todayPt = res.chart.data.find((d: any) => d.isToday);
      activePoint.value = todayPt || res.chart.data[7];
    }
  } catch (err: any) {
    console.error('Failed to change range', err);
  }
}

// Chart SVG Coordinate Geometry Calculation
const chartMetrics = computed(() => {
  const chart = summaryData.value?.chart;
  if (!chart || !chart.data || chart.data.length === 0) {
    return {
      points: [],
      linePath: '',
      areaPath: '',
      limitY: null,
      todayPoint: null,
      hasExceeded: false,
      startDateLabel: '',
      endDateLabel: '',
    };
  }

  const data: Array<{ date: string; value: number; hours: number; isToday: boolean }> =
    chart.data;
  const limit: number = chart.limit;
  const nominalMax: number = chart.yMax || chart.max || 45;

  const maxVal = Math.max(...data.map((d) => d.value));
  const hasExceeded = maxVal > limit;

  // Safe layout headroom: guarantee limit line and values over limit never clip
  const effectiveMax = Math.max(nominalMax, maxVal) * 1.08;
  const minY = 0;

  const width = 380;
  const height = 180;
  const padLeft = 32;
  const padRight = 20;
  const topMargin = 25;
  const bottomMargin = 40;
  const plotHeight = height - topMargin - bottomMargin;
  const plotWidth = width - padLeft - padRight;

  const points = data.map((pt, idx) => {
    const x = padLeft + (idx / (data.length - 1)) * plotWidth;
    const ratio = (pt.value - minY) / (effectiveMax - minY);
    const y = topMargin + plotHeight * (1 - ratio);
    return {
      ...pt,
      x,
      y,
    };
  });

  // Calculate Limit Line Y position
  const limitRatio = (limit - minY) / (effectiveMax - minY);
  const limitY = topMargin + plotHeight * (1 - limitRatio);

  // SVG Line & Area Paths
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${topMargin + plotHeight} L ${points[0].x} ${topMargin + plotHeight} Z`
    : '';

  const todayPoint = points.find((p) => p.isToday);

  return {
    points,
    linePath,
    areaPath,
    limitY,
    todayPoint,
    hasExceeded,
    startDateLabel: formatShortDate(data[0]?.date),
    endDateLabel: formatShortDate(data[data.length - 1]?.date),
  };
});

function formatShortDate(dateStr?: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(parts[2])} ${months[Number(parts[1]) - 1]}`;
}

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parts[2]} ${months[Number(parts[1]) - 1]} ${parts[0]}`;
}

function showPlaceholderModal(title: string) {
  placeholderTitle.value = title;
  placeholderVisible.value = true;
}

if (authStore.token) {
  await fetchDashboardData();
}

onMounted(() => {
  if (!summaryData.value) {
    fetchDashboardData();
  }
});
</script>

<style scoped lang="scss">
$susi-navy: #0E2138;
$susi-red: #E63757;
$susi-white: #FFFFFF;
$susi-gray-500: #6B7280;
$susi-gray-700: #374151;
$susi-gray-200: #E5E7EB;
$susi-green: #1FBF8F;
$susi-amber: #F59E0B;
$susi-cyan: #22C5E8;

.home-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

// 1. App Header
.app-header {
  background: linear-gradient(135deg, $susi-navy 0%, #152E4D 100%);
  color: $susi-white;
  padding: 24px 20px 20px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  box-shadow: 0 4px 16px rgba(14, 33, 56, 0.12);

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;

    .greeting-subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .pilot-name {
      font-size: 22px;
      font-weight: 700;
      color: $susi-white;
      letter-spacing: -0.3px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;

      .pilot-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: linear-gradient(135deg, $susi-red 0%, #FF5A7A 100%);
        border: 2px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-text {
          font-size: 14px;
          font-weight: 700;
          color: $susi-white;
        }
      }

      .logout-btn {
        background: rgba(255, 255, 255, 0.12);
        border: none;
        color: $susi-white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.22);
        }
      }
    }
  }

  .flight-stats-pill {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;

    .stat-icon-wrap {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(34, 197, 232, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;

      .stat-icon {
        color: $susi-cyan;
      }
    }

    .stat-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .stat-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .stat-value {
        font-size: 20px;
        color: $susi-white;

        small {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(31, 191, 143, 0.2);
      padding: 4px 10px;
      border-radius: 9999px;

      .status-dot {
        width: 7px;
        height: 7px;
        background-color: $susi-green;
        border-radius: 50%;
      }

      .status-text {
        font-size: 11px;
        font-weight: 600;
        color: #A7F3D0;
      }
    }
  }
}

// Page Content
.page-content {
  flex: 1;
  padding: 20px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-container {
  display: flex;
  flex-direction: column;
  gap: 14px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    .section-title {
      font-size: 17px;
      font-weight: 700;
      color: $susi-navy;
    }

    .section-subtitle {
      font-size: 12px;
      color: $susi-gray-500;
    }

    .today-tag, .count-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      color: $susi-navy;
      background-color: #EBF1F7;
      padding: 4px 10px;
      border-radius: 8px;
    }
  }
}

// 4 Limit Cards Grid
.limit-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  .limit-card {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: transform 0.2s;

    &.exceeded {
      border-color: rgba(230, 55, 87, 0.5);
      background: linear-gradient(180deg, #FFFFFF 0%, #FFF5F7 100%);
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .card-badge {
        font-size: 12px;
        font-weight: 700;
        color: $susi-navy;
      }

      .card-limit {
        font-size: 11px;
        color: $susi-gray-500;
      }
    }

    .card-value-wrap {
      display: flex;
      align-items: baseline;
      gap: 4px;

      .card-value {
        font-size: 22px;
        color: $susi-navy;
      }

      .card-unit {
        font-size: 12px;
        color: $susi-gray-500;
      }
    }

    .progress-bar-bg {
      height: 6px;
      background-color: $susi-gray-200;
      border-radius: 9999px;
      overflow: hidden;

      .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #22C5E8 0%, #1FBF8F 100%);
        border-radius: 9999px;
        transition: width 0.4s ease;

        &.fill-danger {
          background: $susi-red;
        }
      }
    }

    .card-foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;

      .foot-remaining {
        color: $susi-gray-700;
      }

      .foot-percent {
        color: $susi-navy;
      }
    }
  }
}

// Chart Card
.chart-card {
  padding: 18px 16px;

  .chart-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    .chart-title {
      font-size: 15px;
      font-weight: 700;
      color: $susi-navy;
    }

    .chart-subtitle {
      font-size: 11px;
      color: $susi-gray-500;
    }

    .chart-toggles {
      display: flex;
      background-color: #F1F4F8;
      padding: 3px;
      border-radius: 10px;
      gap: 2px;

      .toggle-btn {
        background: none;
        border: none;
        padding: 5px 9px;
        font-size: 11px;
        font-weight: 600;
        color: $susi-gray-500;
        border-radius: 7px;
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background-color: $susi-navy;
          color: $susi-white;
          box-shadow: 0 2px 6px rgba(14, 33, 56, 0.15);
        }
      }
    }
  }

  .chart-stage {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .chart-svg {
      width: 100%;
      height: 170px;
      overflow: visible;

      .chart-point-dot {
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.3);
        }
      }
    }

    .exceeded-alert-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: #FFF1F3;
      color: $susi-red;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 2px;
    }

    .point-tooltip-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background-color: #F8FAFC;
      border: 1px solid $susi-gray-200;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      color: $susi-navy;

      .tt-sep {
        color: $susi-gray-500;
      }

      .text-danger {
        color: $susi-red;
      }

      .tt-today-badge {
        background-color: $susi-navy;
        color: $susi-white;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .x-axis-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: $susi-gray-500;
      font-weight: 600;
      padding: 0 10px;

      .x-today {
        color: $susi-navy;
        font-weight: 700;
      }
    }
  }
}

// Documents List
.documents-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .document-card {
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;

    .doc-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.icon-valid {
        background-color: #E8F8F3;
        color: $susi-green;
      }

      &.icon-expiring_soon {
        background-color: #FEF3C7;
        color: $susi-amber;
      }

      &.icon-expired {
        background-color: #FDE8EC;
        color: $susi-red;
      }
    }

    .doc-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .doc-label {
        font-size: 14px;
        font-weight: 700;
        color: $susi-navy;
      }

      .doc-expiry-wrap {
        display: flex;
        flex-direction: column;
        gap: 1px;

        .expiry-text {
          font-size: 11px;
          color: $susi-gray-500;
        }

        .days-remaining {
          font-size: 11px;

          &.text-valid {
            color: #0E7051;
          }

          &.text-expiring_soon {
            color: #B45309;
          }

          &.text-expired {
            color: $susi-red;
          }
        }
      }
    }

    .doc-badge-wrap {
      flex-shrink: 0;
    }
  }
}

// Modal
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(14, 33, 56, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  .placeholder-sheet {
    width: 100%;
    max-width: 440px;
    padding: 24px 20px 32px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;

    .sheet-handle {
      width: 44px;
      height: 4px;
      background-color: $susi-gray-200;
      border-radius: 9999px;
      margin-bottom: 8px;
    }

    .sheet-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: #EBF1F7;
      color: $susi-navy;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sheet-title {
      font-size: 18px;
      font-weight: 700;
      color: $susi-navy;
    }

    .sheet-desc {
      font-size: 13px;
      color: $susi-gray-500;
      line-height: 1.5;
      max-width: 300px;
    }

    .sheet-btn {
      width: 100%;
      margin-top: 8px;
    }
  }
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  gap: 14px;
  color: $susi-gray-500;

  .loader-icon {
    color: $susi-red;
  }
}

.spin {
  animation: spin 1s linear infinite;
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
