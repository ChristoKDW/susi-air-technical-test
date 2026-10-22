<template>
  <div class="schedule-page">
    <!-- Header -->
    <header class="schedule-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">Duty Roster</h1>
          <p class="page-subtitle">Monthly flight schedule & duty logs</p>
        </div>
        <button class="today-jump-btn" @click="jumpToFixedToday">
          <CalendarIcon :size="14" />
          <span>Today</span>
        </button>
      </div>

      <!-- Month Navigator -->
      <div class="month-navigator">
        <button class="nav-arrow-btn" @click="prevMonth" aria-label="Previous Month">
          <ChevronLeft :size="20" />
        </button>

        <div class="month-display">
          <h2 class="month-name">{{ monthNames[currentMonth - 1] }}</h2>
          <span class="year-name num-bold">{{ currentYear }}</span>
        </div>

        <button class="nav-arrow-btn" @click="nextMonth" aria-label="Next Month">
          <ChevronRight :size="20" />
        </button>
      </div>
    </header>

    <!-- Main Schedule Content -->
    <main class="page-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <Loader2 :size="28" class="spin loader-icon" />
        <p>Loading roster for {{ monthNames[currentMonth - 1] }} {{ currentYear }}...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container card-base">
        <AlertCircle :size="24" class="error-icon" />
        <p>{{ error }}</p>
        <button @click="fetchSchedules" class="btn-pill btn-primary retry-btn">Retry</button>
      </div>

      <template v-else>
        <!-- Calendar Card -->
        <div class="calendar-card card-base">
          <!-- Month Stats Summary Bar -->
          <div class="roster-meta-bar">
            <span class="roster-count num-bold">{{ schedules.length }} Scheduled Duties</span>
            <span class="roster-hint">Tap date for details</span>
          </div>

          <!-- Day of Week Header -->
          <div class="weekdays-grid">
            <span v-for="w in weekdays" :key="w" class="weekday-cell" :class="{ 'weekend': w === 'Sun' || w === 'Sat' }">
              {{ w }}
            </span>
          </div>

          <!-- Calendar Days Grid -->
          <div class="days-grid">
            <!-- Empty cells before first day of month -->
            <div
              v-for="blank in leadingBlanks"
              :key="'blank-' + blank"
              class="day-cell day-blank"
            ></div>

            <!-- Month days -->
            <div
              v-for="d in daysInMonth"
              :key="d"
              class="day-cell"
              :class="{
                'is-today': isDateToday(d),
                'has-duty': !!getScheduleForDay(d),
              }"
              :style="getDayCellStyle(d)"
              @click="handleDayClick(d)"
            >
              <!-- Day Number -->
              <span class="day-number num-bold" :class="{ 'num-today': isDateToday(d) }">
                {{ d }}
              </span>

              <!-- Duty Content if scheduled -->
              <template v-if="getScheduleForDay(d)">
                <!-- Checkmark or Remaining Duties Badge at Top Right -->
                <div
                  class="duty-badge"
                  :class="{ 'badge-tick': isLogbookComplete(getScheduleForDay(d)) }"
                >
                  <Check
                    v-if="isLogbookComplete(getScheduleForDay(d))"
                    :size="11"
                    stroke-width="3"
                  />
                  <span v-else class="count-num num-bold" title="Remaining duties">
                    {{ getRemainingDuties(getScheduleForDay(d)) }}
                  </span>
                </div>

                <!-- Base Code (e.g. MKW, PDG, CJN, HLP, TRX, etc.) -->
                <div class="base-name-tag">
                  {{ getScheduleForDay(d)?.base_name }}
                </div>
              </template>

              <!-- Off / Rest Day -->
              <template v-else>
                <span class="off-tag">OFF</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Legend Section -->
        <div class="legend-card card-base">
          <h3 class="legend-title">Duty Legend</h3>
          <div class="legend-grid">
            <div
              v-for="item in legend"
              :key="item.code"
              class="legend-item"
            >
              <span class="legend-color-dot" :style="{ backgroundColor: item.color }"></span>
              <span class="legend-code num-bold">{{ item.code }}</span>
              <span class="legend-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Bottom Navigation -->
    <BottomNav @openPlaceholder="showPlaceholderModal" />

    <!-- Placeholder Modal / Detail Sheet -->
    <div v-if="detailModalVisible" class="modal-backdrop" @click="detailModalVisible = false">
      <div class="detail-sheet card-base" @click.stop>
        <div class="sheet-handle"></div>

        <div class="sheet-header">
          <div class="sheet-date-pill">
            <CalendarIcon :size="16" />
            <span class="num-bold">{{ selectedDateDisplay }}</span>
          </div>
          <span v-if="isDateToday(selectedDay)" class="today-chip">TODAY</span>
        </div>

        <div v-if="selectedSchedule" class="duty-detail-box" :style="{ borderColor: selectedSchedule.base_color }">
          <div class="duty-badge-header" :style="{ backgroundColor: selectedSchedule.base_color + '1A', color: selectedSchedule.base_color }">
            <Plane :size="18" />
            <span class="num-bold">{{ selectedSchedule.duty_type }} — {{ getLegendLabel(selectedSchedule.duty_type) }}</span>
          </div>

          <div class="duty-rows">
            <div class="duty-row">
              <span class="row-label">Base Location</span>
              <span class="row-val num-bold">{{ selectedSchedule.base_name }}</span>
            </div>
            <div class="duty-row">
              <span class="row-label">Planned Duties</span>
              <span class="row-val num-bold">{{ selectedSchedule.count_schedules }} flights</span>
            </div>
            <div class="duty-row">
              <span class="row-label">Logged Duties</span>
              <span class="row-val num-bold">
                {{ selectedSchedule.count_logbooks }} / {{ selectedSchedule.count_schedules }}
                <Check v-if="isLogbookComplete(selectedSchedule)" :size="14" class="tick-green" />
              </span>
            </div>
            <div class="duty-row">
              <span class="row-label">Status</span>
              <span class="status-chip" :class="selectedSchedule.status === 2 ? 'status-done' : 'status-pending'">
                {{ selectedSchedule.status === 2 ? 'Completed / Verified' : 'Upcoming Duty' }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="off-day-box">
          <p class="off-title">Scheduled Off / Rest Day</p>
          <p class="off-desc">No flight or standby duty scheduled for this date.</p>
        </div>

        <!-- Detail page placeholder notice -->
        <div class="coming-soon-banner">
          <Info :size="16" />
          <span>Detail page coming soon</span>
        </div>

        <button class="btn-pill btn-primary close-btn" @click="detailModalVisible = false">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Plane,
  Info,
  AlertCircle,
  Loader2
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase || 'http://localhost:3000';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Default calendar month is May 2026 as per requirement
const currentYear = ref(2026);
const currentMonth = ref(5);

const isLoading = ref(true);
const error = ref('');
const schedules = ref<any[]>([]);
const legend = ref<any[]>([]);
const schedulesMap = ref(new Map<string, any>());

// Modal state
const detailModalVisible = ref(false);
const selectedDay = ref(15);
const selectedSchedule = ref<any>(null);

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// Compute days in current month
const daysInMonth = computed(() => {
  return new Date(Date.UTC(currentYear.value, currentMonth.value, 0)).getUTCDate();
});

// Compute leading blank days for weekday alignment
const leadingBlanks = computed(() => {
  const firstDayOfWeek = new Date(Date.UTC(currentYear.value, currentMonth.value - 1, 1)).getUTCDay();
  return firstDayOfWeek;
});

async function fetchSchedules() {
  isLoading.value = true;
  error.value = '';
  try {
    const yearStr = String(currentYear.value);
    const monthStr = pad2(currentMonth.value);

    const data = await $fetch<any>(
      `${apiBase}/schedules?year=${yearStr}&month=${monthStr}`,
      { headers: authStore.authHeaders }
    );

    schedules.value = data.schedules || [];
    legend.value = data.legend || [];

    const map = new Map<string, any>();
    for (const item of schedules.value) {
      map.set(item.duty_date, item);
    }
    schedulesMap.value = map;
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch duty schedules.';
  } finally {
    isLoading.value = false;
  }
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  fetchSchedules();
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  fetchSchedules();
}

function jumpToFixedToday() {
  currentYear.value = 2026;
  currentMonth.value = 5;
  fetchSchedules();
}

function getDayIso(day: number): string {
  return `${currentYear.value}-${pad2(currentMonth.value)}-${pad2(day)}`;
}

function getScheduleForDay(day: number) {
  return schedulesMap.value.get(getDayIso(day));
}

function isDateToday(day: number): boolean {
  return (
    currentYear.value === 2026 &&
    currentMonth.value === 5 &&
    day === 15
  );
}

function isLogbookComplete(sch: any): boolean {
  return sch && sch.count_logbooks === sch.count_schedules;
}

function getRemainingDuties(sch: any): number {
  if (!sch) return 0;
  return Math.max(0, (sch.count_schedules || 0) - (sch.count_logbooks || 0));
}

function getDayCellStyle(day: number) {
  const sch = getScheduleForDay(day);
  if (!sch) return {};

  return {
    backgroundColor: sch.base_color + '1A', // 10% opacity tint
    borderColor: sch.base_color,
  };
}

function getLegendLabel(code: string) {
  const item = legend.value.find((l) => l.code === code);
  return item?.label || code;
}

const selectedDateDisplay = computed(() => {
  const m = monthNames[currentMonth.value - 1];
  return `${selectedDay.value} ${m} ${currentYear.value}`;
});

function handleDayClick(day: number) {
  selectedDay.value = day;
  selectedSchedule.value = getScheduleForDay(day);
  detailModalVisible.value = true;
}

function showPlaceholderModal(title: string) {
  selectedDay.value = 15;
  selectedSchedule.value = null;
  detailModalVisible.value = true;
}

if (authStore.token) {
  await fetchSchedules();
}

onMounted(() => {
  if (schedules.value.length === 0) {
    fetchSchedules();
  }
});
</script>

<style scoped lang="scss">
$susi-navy: #0E2138;
$susi-red: #E63757;
$susi-white: #FFFFFF;
$susi-gray-200: #E5E7EB;
$susi-gray-500: #6B7280;
$susi-gray-700: #374151;
$susi-green: #1FBF8F;

.schedule-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.schedule-header {
  background: linear-gradient(135deg, $susi-navy 0%, #152E4D 100%);
  color: $susi-white;
  padding: 24px 20px 20px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  box-shadow: 0 4px 16px rgba(14, 33, 56, 0.12);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: $susi-white;
    }

    .page-subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
    }

    .today-jump-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: $susi-white;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.22);
      }
    }
  }

  .month-navigator {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .nav-arrow-btn {
      background: none;
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
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .month-display {
      display: flex;
      align-items: baseline;
      gap: 8px;

      .month-name {
        font-size: 19px;
        font-weight: 700;
        color: $susi-white;
      }

      .year-name {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

.page-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Calendar Card
.calendar-card {
  padding: 16px 12px 14px;

  .roster-meta-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0 4px;

    .roster-count {
      font-size: 12px;
      color: $susi-navy;
    }

    .roster-hint {
      font-size: 11px;
      color: $susi-gray-500;
    }
  }

  .weekdays-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 6px;
    text-align: center;

    .weekday-cell {
      font-size: 11px;
      font-weight: 700;
      color: $susi-gray-500;
      padding: 4px 0;

      &.weekend {
        color: #9CA3AF;
      }
    }
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;

    .day-cell {
      aspect-ratio: 1 / 1.15;
      background-color: #F8FAFC;
      border: 1px solid rgba(229, 231, 235, 0.7);
      border-radius: 8px;
      padding: 3px 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(14, 33, 56, 0.08);
      }

      &.day-blank {
        background: transparent;
        border: none;
        cursor: default;
        box-shadow: none;
      }

      &.is-today {
        border: 2px solid $susi-navy !important;
        box-shadow: 0 0 0 2px rgba(14, 33, 56, 0.2);

        .day-number {
          background-color: $susi-navy;
          color: $susi-white;
          border-radius: 4px;
          padding: 1px 4px;
        }
      }

      &.has-duty {
        border-width: 1.5px;
      }

      .day-number {
        font-size: 11px;
        color: $susi-navy;
        line-height: 1;
      }

      .duty-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: $susi-navy;
        color: $susi-white;
        display: flex;
        align-items: center;
        justify-content: center;

        &.badge-tick {
          background-color: #10B981;
        }

        .count-num {
          font-size: 9px;
          line-height: 1;
        }
      }

      .base-name-tag {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: -0.2px;
        color: $susi-navy;
        text-align: center;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 4px;
        padding: 1px 0;
      }

      .off-tag {
        font-size: 8px;
        font-weight: 600;
        color: #9CA3AF;
        text-align: center;
      }
    }
  }
}

// Legend Card
.legend-card {
  padding: 16px;

  .legend-title {
    font-size: 14px;
    font-weight: 700;
    color: $susi-navy;
    margin-bottom: 12px;
  }

  .legend-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 12px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .legend-color-dot {
        width: 12px;
        height: 12px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .legend-code {
        font-size: 11px;
        color: $susi-navy;
        min-width: 26px;
      }

      .legend-label {
        font-size: 11px;
        color: $susi-gray-700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

// Modal Detail Sheet
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(14, 33, 56, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  .detail-sheet {
    width: 100%;
    max-width: 440px;
    padding: 20px 20px 32px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .sheet-handle {
      width: 44px;
      height: 4px;
      background-color: $susi-gray-200;
      border-radius: 9999px;
      align-self: center;
      margin-bottom: 4px;
    }

    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .sheet-date-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        color: $susi-navy;
      }

      .today-chip {
        background-color: $susi-navy;
        color: $susi-white;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
      }
    }

    .duty-detail-box {
      border: 1.5px solid;
      border-radius: 12px;
      overflow: hidden;

      .duty-badge-header {
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .duty-rows {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background-color: $susi-white;

        .duty-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;

          .row-label {
            color: $susi-gray-500;
          }

          .row-val {
            color: $susi-navy;
            display: flex;
            align-items: center;
            gap: 4px;

            .tick-green {
              color: #10B981;
            }
          }

          .status-chip {
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 6px;

            &.status-done {
              background-color: #E8F8F3;
              color: #0E7051;
            }

            &.status-pending {
              background-color: #FEF3C7;
              color: #92400E;
            }
          }
        }
      }
    }

    .off-day-box {
      background-color: #F8FAFC;
      border: 1px dashed $susi-gray-200;
      border-radius: 12px;
      padding: 18px 14px;
      text-align: center;

      .off-title {
        font-size: 14px;
        font-weight: 700;
        color: $susi-navy;
        margin-bottom: 4px;
      }

      .off-desc {
        font-size: 12px;
        color: $susi-gray-500;
      }
    }

    .coming-soon-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background-color: #FFF8E1;
      color: #B45309;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }

    .close-btn {
      width: 100%;
    }
  }
}

.loading-state, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
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
