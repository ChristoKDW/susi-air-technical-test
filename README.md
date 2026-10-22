# Susi Air — Pilot Portal & Flight Compliance System

Sistem manajemen kepatuhan jam terbang (*Flight Time Limitations* - CASR 135) dan jadwal tugas kru (*Duty Roster*) terintegrasi untuk pilot **Susi Air (PT ASI Pudjiastuti Aviation)**.

Dibangun dengan arsitektur **Clean Architecture**, backend **NestJS (TypeScript)** yang memuat dataset ke memori saat startup, dan frontend mobile-first **Nuxt 3 (Composition API, Pinia, SCSS)** yang terhubung penuh ke backend API tanpa mock data di sisi client.

---

## 📑 Daftar Isi

- [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
- [Panduan Instalasi & Menjalankan](#-panduan-instalasi--menjalankan)
  - [Prasyarat](#prasyarat)
  - [1. Menjalankan Backend (/nest)](#1-menjalankan-backend-nest)
  - [2. Menjalankan Frontend (/nuxt)](#2-menjalankan-frontend-nuxt)
  - [3. Menjalankan via Docker Compose](#3-menjalankan-via-docker-compose)
- [Daftar Endpoint API (/nest)](#-daftar-endpoint-api-nest)
- [Environment Variables](#-environment-variables)
- [Keputusan Arsitektur & Edge Cases](#-keputusan-arsitektur--edge-cases)
  - [Pemisahan Modul & Validasi](#pemisahan-modul--validasi)
  - [Penanganan Edge Cases Rolling Sum](#penanganan-edge-cases-rolling-sum)
  - [Safe Layout Headroom Grafik](#safe-layout-headroom-grafik)
  - [Tanggal Tetap (Anchor: 2026-05-15)](#tanggal-tetap-anchor-2026-05-15)
  - [Desain Sistem Susi Air](#desain-sistem-susi-air)
- [Konfigurasi Deployment](#-konfigurasi-deployment)
  - [Vercel (/nuxt)](#vercel-nuxt)
  - [Render (/nest)](#render-nest)
  - [Railway (/nest)](#railway-nest)
- [Pengujian Otomatis (Automated Testing)](#-pengujian-otomatis-automated-testing)
- [Peningkatan Di Masa Depan (Future Enhancements)](#-peningkatan-di-masa-depan-future-enhancements)

---

## 🛠 Arsitektur & Tech Stack

### Backend (`/nest`)
- **Framework**: [NestJS 11](https://nestjs.com/) (Node.js runtime)
- **Language**: TypeScript 5.7
- **Authentication**: JWT Bearer Tokens (`@nestjs/jwt`) & Hardcoded Credential Guard
- **Validation**: `class-validator` & `class-transformer` melalui global `ValidationPipe`
- **Error Handling**: Custom `HttpExceptionFilter` dengan respon error terstruktur konsisten
- **Data Persistence**: In-Memory Startup Data Store (`DataStoreService` dengan indeks Map $O(1)$)

### Frontend (`/nuxt`)
- **Framework**: [Nuxt 3 / Nuxt 4 Mode](https://nuxt.com/) (Vue 3, Composition API, `<script setup>`, SSR)
- **State Management**: [Pinia](https://pinia.vuejs.org/) dengan sinkronisasi cookie untuk rehidrasi SSR
- **Styling**: SCSS dengan Palet Warna Resmi Susi Air & Border Radius 12–16px
- **Icons**: Lucide Icons (`lucide-vue-next`)
- **Typography**: Google Fonts — Plus Jakarta Sans (bold tabular untuk angka metrik)

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat
- **Node.js**: Versi `>= 18.x` (Direkomendasikan Node.js 20 atau 22 LTS)
- **npm**: Versi `>= 9.x`

---

### 1. Menjalankan Backend (`/nest`)

1. Masuk ke direktori backend:
   ```bash
   cd nest
   ```

2. Salin environment variable:
   ```bash
   cp .env.example .env
   ```

3. Instal dependensi:
   ```bash
   npm install
   ```

4. Jalankan aplikasi:
   ```bash
   # Mode Development
   npm run start:dev

   # Mode Build & Production
   npm run build
   npm run start:prod
   ```

   Backend API akan berjalan di **`http://localhost:3000`**.

5. Jalankan automated test suite backend (43 assertions):
   ```bash
   npm run test:api
   ```

---

### 2. Menjalankan Frontend (`/nuxt`)

1. Masuk ke direktori frontend:
   ```bash
   cd nuxt
   ```

2. Salin environment variable:
   ```bash
   cp .env.example .env
   ```

3. Instal dependensi:
   ```bash
   npm install
   ```

4. Jalankan aplikasi:
   ```bash
   # Mode Development
   npm run dev

   # Mode Build & Production (port 3001)
   npm run build
   node .output/server/index.mjs
   ```

   Frontend Portal akan dapat diakses di **`http://localhost:3001`**.

5. Jalankan automated test suite frontend (30 assertions):
   ```bash
   npm run test:frontend
   ```

> **Kredensial Demo:**
> - **Username**: `johndoe`
> - **Password**: `susiairtest`

---

### 3. Menjalankan via Docker Compose

Untuk menjalankan seluruh stack (backend dan frontend) secara bersamaan menggunakan Docker:

```bash
docker compose up --build
```
- Backend tersedia di `http://localhost:3000`
- Frontend tersedia di `http://localhost:3001`

---

## 📡 Daftar Endpoint API (`/nest`)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/auth/login` | Publik | Otentikasi username & password, mengembalikan access token JWT |
| `GET` | `/pilot/me` | Protected | Mengambil profil pilot terotentikasi, total jam terbang, dan avatar URL |
| `GET` | `/flight-hours?from=YYYY-MM-DD&to=YYYY-MM-DD` | Protected | Riwayat jam terbang per hari dalam rentang tanggal |
| `GET` | `/flight-hours/summary?range=1w\|1m\|3m\|6m\|1y` | Protected | 4 kartu rolling sum (Daily, Weekly, Monthly, Annual) & data chart 15 hari |
| `GET` | `/documents` | Protected | Daftar dokumen pilot dengan perhitungan hari tersisa & status urgensi |
| `GET` | `/schedules?year=YYYY&month=MM` | Protected | Jadwal tugas pilot bulanan beserta legenda dan panduan warna |

---

## 🔐 Environment Variables

### Backend (`nest/.env.example`)
| Variable | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port server NestJS |
| `NODE_ENV` | `production` | Lingkungan runtime (`development` / `production`) |
| `JWT_SECRET` | `susi-air-technical-test-jwt-secret-key-2026` | Kunci rahasia signing token JWT |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku token akses |
| `CORS_ORIGIN` | `*` | Origin yang diizinkan untuk CORS |

### Frontend (`nuxt/.env.example`)
| Variable | Default | Keterangan |
|---|---|---|
| `PORT` | `3001` | Port server Nuxt 3 |
| `NUXT_PUBLIC_API_BASE` | `http://localhost:3000` | URL publik base API backend NestJS |
| `NODE_ENV` | `production` | Lingkungan runtime Nuxt |

---

## 🏛 Keputusan Arsitektur & Edge Cases

### Pemisahan Modul & Validasi
Aplikasi dibangun mengikuti prinsip **Separation of Concerns (SoC)**:
1. **Module**: Mengelompokkan domain fitur independen (`AuthModule`, `PilotModule`, `FlightHoursModule`, `DocumentsModule`, `SchedulesModule`, `DataStoreModule`).
2. **Controller**: Hanya bertugas menerima request HTTP, validasi query/body via DTO, dan meneruskan ke Service.
3. **Service**: Menangani logika bisnis murni, kalkulasi rolling sum, pemetaan urgensi kedaluwarsa, dan filter jadwal.
4. **DTO**: Memvalidasi data masukan secara deklaratif menggunakan `class-validator` (`@Matches`, `@IsIn`, `@IsNotEmpty`).
5. **Global Exception Filter (`HttpExceptionFilter`)**: Menyeragamkan format respon error ke struktur konsisten:
   ```json
   {
     "statusCode": 400,
     "error": "Bad Request",
     "message": ["range must be one of: 1w, 1m, 3m, 6m, 1y"],
     "timestamp": "2026-05-15T00:00:00.000Z",
     "path": "/flight-hours/summary?range=2w"
   }
   ```
6. **Global Auth Guard (`AuthGuard`)**: Melindungi seluruh route secara default. Route publik (`POST /auth/login`) diecualikan menggunakan metadata kustom `@Public()`.

---

### Penanganan Edge Cases Rolling Sum

Perhitungan rolling sum kepatuhan jam terbang (FTL) diimplementasikan di dalam method `rollingWindowBluffing()` pada `FlightHoursService` dengan komentar wajib `// this is a rolling sum calculation :)` tepat di atasnya sesuai instruksi teknis penguji:

```typescript
  // this is a rolling sum calculation :)
  public rollingWindowBluffing(targetDate: string, windowDays: number): number {
    let sum = 0;
    for (let i = 0; i < windowDays; i++) {
      const day = addDays(targetDate, -i);
      sum += this.dataStoreService.getFlightHours(day);
    }
    return Math.round(sum * 10) / 10;
  }
```

Algoritma mengimplementasikan penanganan edge cases secara ketat:

1. **Hari Tanpa Jam Terbang (Off / Zero Hours)**:
   - Tanggal yang tidak tercatat dalam dataset atau bertipe hari libur tidak diabaikan (tidak di-skip), melainkan dihitung tepat bernilai `hours: 0.0`.
   - Iterasi tanggal berjalan kontinu hari demi hari sehingga total hari pembagi dan durasi window rolling sum tetap akurat.

2. **Batas Awal Dataset (Historical Boundary)**:
   - Dataset dimulai pada `2024-12-27`. Ketika fungsi rolling sum tahunan (*annual* - 365 hari) memeriksa tanggal mundur sebelum `2024-12-27` (misal Januari 2024), lookup data menghasilkan nilai aman `0.0` melalui fallback index tanpa menimbulkan runtime exception, `NaN`, atau error *out-of-bounds*.

3. **Tanggal Masa Depan (Future Boundary)**:
   - Tanggal setelah batas dataset atau hari ini (setelah `2026-05-31`) ditangani sebagai `0.0` jam terbang terencana/tercatat, mencegah kebocoran data spekulatif.

---

### Safe Layout Headroom Grafik

Pada toggle grafik **1m** (Monthly limit 100h), data riwayat pada `2026-05-08` mencapai nilai **102.2h** yang melebihi batas merah (100h):
- **Dynamic Headroom Scaling**: Sistem koordinat SVG tidak mematok batas atas statis, melainkan menghitung skala secara dinamis:
  $$\text{effectiveMax} = \max(\text{nominalMax}, \text{peakValue}) \times 1.08$$
- **No Clipping**: Garis batas limit (`#E63757`) dan titik puncak yang melebihi limit tetap berada di dalam canvas grafik (*safe headroom*).
- **Exceeded Visual Alert**: Titik yang melewati limit line secara otomatis ditandai dengan lingkaran halo merah berkedip, angka bertanda bahaya di tooltip, dan banner peringatan kepatuhan limit.

---

### Tanggal Tetap (Anchor: 2026-05-15)

- Sesuai spesifikasi, sistem **tidak memanggil `new Date()` tanpa argumen** untuk mengambil waktu sistem operasi saat ini.
- Konstanta `FIXED_TODAY = '2026-05-15'` dijadikan titik acuan tunggal untuk seluruh perhitungan:
  - 4 kartu limit (Daily 1 hari, Weekly 7 hari, Monthly 30 hari, Annual 365 hari per 15 Mei 2026).
  - Grafik 15 hari: 7 hari sebelum (8 Mei), hari ini di tengah (15 Mei), dan 7 hari setelah (22 Mei).
  - Sisa hari kedaluwarsa dokumen (`daysRemaining = expiryDate - 2026-05-15`).
  - Default tampilan kalender jadwal (Mei 2026).

---

### Desain Sistem Susi Air

Frontend menerapkan identitas visual resmi Susi Air:
- **Warna Utama**:
  - Susi Navy (`#0E2138`): Header, navigasi, teks kontras tinggi.
  - Susi Red (`#E63757`): Tombol utama pill, garis batas limit, badge kedaluwarsa.
  - Background Light (`#F5F6F8`): Latar mobile app yang bersih dan modern.
  - White Surface (`#FFFFFF`): Kartu dengan border-radius 12–16px (`14px`).
  - Accent Colors: Green (`#1FBF8F`), Amber (`#F59E0B`), Cyan (`#22C5E8`).
- **Pill Shape Button**: Tombol aksi utama dengan `border-radius: 9999px` dan gradasi merah khas Susi Air.
- **Tipografi**: Font *Plus Jakarta Sans* dengan kelas `.num-bold` dan `.num-extra-bold` untuk keterbacaan angka instrumen penerbangan.

---

## 🌐 Konfigurasi Deployment

File konfigurasi deployment untuk berbagai platform cloud telah disiapkan dan siap digunakan:

### Vercel (`/nuxt`)
File [`nuxt/vercel.json`](file:///C:/wamp64/www/susi-air-technical-test/nuxt/vercel.json):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nuxtjs"
}
```
*Environment Variable di Vercel Dashboard:*
- `NUXT_PUBLIC_API_BASE`: URL backend NestJS yang telah di-deploy (misal `https://susi-air-backend.onrender.com`).

---

### Render (`/nest`)
File [`render.yaml`](file:///C:/wamp64/www/susi-air-technical-test/render.yaml) (Infrastructure as Code):
```yaml
services:
  - type: web
    name: susi-air-backend-nest
    runtime: node
    rootDir: nest
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    healthCheckPath: /auth/login
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: "*"
```

---

### Railway (`/nest`)
File [`railway.toml`](file:///C:/wamp64/www/susi-air-technical-test/railway.toml):
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/auth/login"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## 🧪 Pengujian Otomatis (Automated Testing)

Kedua bagian aplikasi telah dilengkapi test runner mandiri tanpa ketergantungan pihak ketiga yang berat:

```bash
# 1. Jalankan pengujian API Backend NestJS
npm --prefix nest run test:api
```
*Hasil: 43/43 assertions passed (Validasi DTO, JWT Auth Guard, 4 kartu limit, chart bounds, tanggal awal/masa depan, filter bulan jadwal).*

```bash
# 2. Jalankan pengujian Frontend Nuxt 3
npm --prefix nuxt run test:frontend
```
*Hasil: 30/30 assertions passed (Render form login, proteksi middleware route, integrasi data API live, kalender Mei 2026, status badge dokumen).*

---

## 🔮 Peningkatan Di Masa Depan (Future Enhancements)

Jika memiliki alokasi waktu pengembangan lebih lanjut, berikut adalah poin-poin peningkatan strategis:

1. **Database & ORM Persistence**:
   - Memigrasikan dataset memori ke PostgreSQL dengan **Prisma ORM** atau **TypeORM** untuk mendukung operasi CRUD dinamis (pencatatan logbook penerbangan real-time).
2. **Role-Based Access Control (RBAC)**:
   - Menambahkan peran otorisasi bertingkat (`Pilot`, `Chief Pilot`, `Flight Operations Officer / Dispatcher`, `Fleet Admin`). Chief Pilot dapat memvalidasi logbook dan menugaskan roster.
3. **Offline-First PWA (Progressive Web App)**:
   - Menerapkan Service Worker dan IndexedDB caching agar pilot di pangkalan terpencil tanpa sinyal internet tetap dapat melihat jadwal offline dan menginput draft logbook.
4. **Push Notifications & Automated Expiry Alerts**:
   - Integrasi Web Push / Firebase Cloud Messaging untuk mengirimkan notifikasi otomatis saat lisensi atau sertifikat medis memasuki periode 30 hari sebelum kedaluwarsa.
5. **Ekspor Laporan Kepatuhan Regulasi**:
   - Fitur ekspor rekap jam terbang pilot ke format resmi PDF / Excel bertandatangan digital sesuai standar format Ditjen Perhubungan Udara (CASR 135 / DGCA Indonesia).
6. **Integrasi Kalender Eksternal**:
   - Menyediakan feed iCal / webcal subscription (`/schedules/ical`) agar roster pilot dapat otomatis tersinkronisasi ke Google Calendar, Apple Calendar, atau Microsoft Outlook di smartphone pilot.
7. **Comprehensive E2E Testing**:
   - Menambahkan pengujian antarmuka visual otomatis lintas perangkat menggunakan **Playwright** untuk memverifikasi interaksi touch pada perangkat mobile nyata.

---

### Lisensi
Hak Cipta © 2026 PT ASI Pudjiastuti Aviation (Susi Air). Seluruh hak cipta dilindungi undang-undang.
