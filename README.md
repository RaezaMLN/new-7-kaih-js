# 🌟 7 KAIH (7 Kebiasaan Anak Indonesia Hebat) Web Application
> **Teaching Factory (TeFa) Rekayasa Perangkat Lunak — SMK Negeri 5 Telkom Banda Aceh**  
> *Sistem Pembiasaan Karakter Positif Berbasis Web, Multi-Role, & 100% Zero-Cost Architecture.*

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 1. Tentang Proyek (About The Project)

**7 KAIH (7 Kebiasaan Anak Indonesia Hebat)** adalah aplikasi web modern yang dirancang untuk menumbuhkembangkan pembiasaan karakter unggul Pelajar Pancasila di lingkungan sekolah kejuruan. Aplikasi ini mentransformasikan instrumen monitoring konvensional menjadi ekosistem digital interaktif yang ramah siswa, transparan bagi guru wali, dan terintegrasi untuk pimpinan sekolah.

Dibangun melalui skema **Teaching Factory (TeFa)**, proyek ini memadukan standar industri rekayasa perangkat lunak modern (**Vue 3 Composition API, Pinia, Firebase Cloud Firestore, dan Cloudinary Media CDN**) dengan komitmen **100% Zero-Cost Architecture** (bebas biaya operasional dan siap deploy di Vercel).

---

## 🎯 2. Pilar 7 Kebiasaan (The 7 Habits Framework)

Aplikasi memfasilitasi pencatatan dan evaluasi 7 butir kebiasaan harian secara terukur:
1. **🌅 Bangun Pagi Tepat Waktu**: Melatih kedisiplinan diri dan kesiapan menyongsong aktivitas produktif (*smart default lock sebelum 04:30*).
2. **🕌 Beribadah Sesuai Keyakinan**: Menjaga integritas spiritual melalui checklist Sholat 5 Waktu & tadarus Al-Qur'an (114 Surah).
3. **🏃 Berolahraga Secara Teratur**: Menjaga stamina jasmani minimal 20–30 menit sehari untuk menunjang daya tahan kerja.
4. **🥗 Makan Sehat & Bergizi Seimbang**: Menumbuhkan pola konsumsi higienis, gizi seimbang, dan hidrasi air putih cukup.
5. **📚 Gemar Membaca & Belajar Mandiri**: Meningkatkan literasi teknologi, nalar kritis, dan budaya eksplorasi ilmu secara mandiri.
6. **🤝 Bermasyarakat & Bergotong Royong**: Menumbuhkan empati sosial, kemampuan kerja tim (*teamwork*), dan kepedulian lingkungan.
7. **🌙 Istirahat / Tidur Cepat Tepat Waktu**: Menjaga manajemen waktu dan regenerasi metabolisme tubuh.

---

## 👥 3. Fitur Multi-Role (Role-Based Features)

### 🧑‍🎓 A. Portal Siswa (`/siswa/*`)
- **Dashboard Reflektif**: Status streak harian (🔥), meteran progres persentase, selector mood emoji harian, dan notifikasi pesan guru wali.
- **Jurnal Form Akordion Cerdas**: Formulir 7 KAIH yang dinamis membuka input spesifik saat dicentang, dilengkapi validasi waktu sholat/jam bangun.
- **Apresiasi Positif**: Animasi perayaan *canvas-confetti* saat seluruh kebiasaan hari ini tuntas dicatat.
- **Riwayat Harian & Kalender**: Visualisasi konsistensi mingguan dan bulanan siswa.
- **Profil Siswa (Lampiran A)**: Biodata lengkap, cita-cita, hobi, kontak WhatsApp sahabat & orang tua, serta titik koordinat GPS rumah.

### 👨‍🏫 B. Portal Guru Wali (`/guru/*`)
- **Executive Dashboard**: Rangkuman status kepatuhan kelas (XII RPL 2), daftar siswa pending, dan umpan balik harian.
- **One-Click WhatsApp Reminder**: Tautan cepat menyalin daftar siswa yang belum mengisi jurnal langsung ke grup WA kelas.
- **Presensi Cepat 30 Detik**: Fitur presensi pertemuan dengan tombol 1-klik *"Tandai Semua Hadir (H)"*, penanda libur, dan dokumentasi kamera/foto.
- **Daftar Murid & Monitoring Home Visit**: Akses lokasi rumah siswa via Google Maps / Leaflet serta riwayat bimbingan konseling.
- **Administrasi Format Resmi (Lampiran A, B, C, E)**:
  - *Lampiran A*: Identitas Dampingan Siswa Asuh.
  - *Lampiran B*: Catatan Perkembangan Siswa (5 Aspek: Akademik, Karakter, Sosial, Disiplin, Minat).
  - *Lampiran C*: Rekap Pertemuan & Bimbingan Konseling.
  - *Lampiran E*: Dokumentasi Visual Pertemuan.
  - Dilengkapi **KOP Surat Resmi Garis Ganda Pemda Aceh / SMKN 5 Telkom** dan mode cetak PDF native A4.
- **Ekspor Excel**: Ekspor instan daftar murid, presensi H/S/I/A, dan rekap nilai ke format `.xlsx`.

### 🛡️ C. Portal Administrator (`/admin/*`)
- **Master Data Pengguna**: Manajemen akun Siswa, Guru, dan Admin.
- **Spreadsheet Automation**:
  - Download template resmi siswa (`Template_Import_Siswa_7KAIH.xlsx`).
  - Import data siswa via Excel dengan **dialog modal verifikasi pratinjau (preview)** sebelum commit ke database.
  - Ekspor seluruh database pengguna ke Excel.
- **Pengaturan Profil Sekolah & KOP Dinamis**: Edit nama sekolah, dinas, alamat, kontak, dan logo instansi secara realtime tanpa mengubah source code.

---

## 🏗️ 4. Arsitektur Teknis (Technical Architecture)

- **Framework & Build**: Vue 3 (Composition API `<script setup>`) + Vite 6.2.
- **State Management**: Pinia 3.0 dengan sinkronisasi reaktif ke Cloud Firestore & persistent `localStorage`.
- **Styling**: Tailwind CSS v3.4 dengan palet modern (*Inter/Plus Jakarta Sans*, *Slate*, *Blue*, *Emerald*).
- **Icons & Motion**: Lucide Vue Next & `@vueuse/motion`.
- **Image Processing**: `browser-image-compression` (kompresi otomatis WebP < 200 KB langsung di sisi klien).
- **Spreadsheet Engine**: SheetJS (`xlsx`) untuk import-export data tabular.
- **Dokumentasi & Cetak**: Browser Native `@media print` A4 + PDF Export.

---

## 🚀 5. Panduan Instalasi & Menjalankan Aplikasi (Setup & Run)

```bash
# 1. Clone repositori
git clone https://github.com/tefa-rpl/7-kaih-interactive-web.git
cd 7kaih-new

# 2. Instal dependensi
npm install

# 3. Jalankan server development lokal
npm run dev

# 4. Build untuk rilis produksi (Vercel / Hosting statis)
npm run build
```

---

## 🔑 6. Kredensial Uji Coba Default (Demo Credentials)

| Role | Identifier / NISN / NIP | Password | Keterangan |
|---|---|---|---|
| **Siswa** | `0092757198` | `siswa` | Akun Siswa: Hanif Akbar Maulana (XII RPL 2) |
| **Siswa** | `0096660649` | `123` | Akun Siswa: Muhammad Andra Fauzi (XII RPL 2) |
| **Guru Wali** | `1106232307990001` | `guru` | Akun Guru Wali: Pak Raeza Maulana, S.Kom. |
| **Admin** | `admin` | `admin123` | Pengelola Sekolah & Tata Usaha |

---

## 🧪 7. Jaminan Kualitas & Pengujian (Quality Assurance)

Sistem telah diaudit melalui rangkaian pengujian **Software Quality Assurance (SQA)** 10 Test Cases (TC-01 s/d TC-10):
- ✅ **TC-01 SPA Entrypoint**: PASS (Vite SPA melayani bundle modul tanpa delay)
- ✅ **TC-02 Integritas Roster Siswa**: PASS (14 siswa binaan aktif terdata lengkap)
- ✅ **TC-03 Keamanan Cloud Firestore**: PASS (Spark plan terhubung aman)
- ✅ **TC-04 Media Storage Cloudinary**: PASS (Kompresi WebP < 200 KB)
- ✅ **TC-05 Responsivitas UI/UX**: PASS (Desktop navbar & mobile bottom nav adaptif)
- ✅ **TC-06 Spreadsheet Excel**: PASS (Template, preview modal, & export aktif)
- ✅ **TC-07 Standar KOP & Lampiran Cetak**: PASS (Double border KOP & Lampiran A, B, C, E)
- ✅ **TC-08 Logika 7 KAIH & Confetti**: PASS (Akordion dinamis & apresiasi positif)
- ✅ **TC-09 Role-Based Access Control**: PASS (Route guarding ketat antar role)
- ✅ **TC-10 Build Kompilasi Produksi**: PASS (Zero error, gzip 0.54 kB, siap Vercel)

---

## 👨‍💻 8. Tim Pengembang & Kolaborator (Credits)

- **Kepala Sekolah / Klien**: Bapak Anas, S.Pd., M.M.
- **Project Manager & Guru Pembimbing RPL**: Raeza Maulana, S.Kom.
- **Lead QA Tester (Siswa)**: Hanif Akbar Maulana (NISN. 0092757198)
- **Frontend & Integration Team**: Siswa Rekayasa Perangkat Lunak (XI/XII RPL)
- **Guru Kolaborator**: Tim Guru PPKn, Bahasa Indonesia, Matematika, dan Bahasa Inggris SMK Negeri 5 Telkom Banda Aceh.

---
*© 2026 Teaching Factory RPL — SMK Negeri 5 Telkom Banda Aceh. Hak Cipta Dilindungi.*
