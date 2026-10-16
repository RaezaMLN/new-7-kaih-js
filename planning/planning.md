Rencana Induk & Spesifikasi Sistem Web App 7 KAIH
Hasil Bedah Lengkap Sistem Existing (https://7kaih.smkn5telkom.sch.id/)
Dokumen ini memuat blueprint teknis terintegrasi setelah menganalisis langsung seluruh struktur halaman, database tampilan, modul pelaporan, dan tata kelola pada web app yang sudah ada sebelumnya di SMK Negeri 5 Telkom Banda Aceh.

(Catatan: Sesuai instruksi #planning, tahap ini murni perancangan sistem dan penyelarasan fitur tanpa mengeksekusi kode).

1. Temuan Bedah Sistem Existing & Pemetaan ke Sistem Baru
Dari hasil inspeksi langsung menggunakan akun guru wali/binaan (Pak Raeza Maulana, RPL):

Mermaid diagram
2. Struktur Modul & Format Pelaporan Resmi (Lampiran A s/d E)
Sistem baru akan mengadopsi dan menyempurnakan format baku dokumen sekolah:

Kode Lampiran	Nama Dokumen Resmi	Komponen Data yang Dicakup
Lampiran A	Identitas Murid Dampingan (Siswa Asuh)	• Profil lengkap: Nama, NISN/NIS, Kelas/Rombel, TTL, Tahun Masuk.
• Data Karakter Personal: Hobi, Cita-cita, Teman Terbaik, Makanan/Warna Favorit.
• Kontak & Lokasi: No. HP Siswa, No. WhatsApp Orang Tua, Alamat Lengkap & Koordinat Rumah (Peta).
Lampiran B	Catatan Perkembangan Siswa Binaan	• 5 Aspek Pemantauan: Akademik, Karakter, Sosial Emosional, Kedisiplinan, Potensi & Minat.
• Kolom Evaluasi: Deskripsi Perkembangan, Tindak Lanjut Yang Dilakukan, dan Keterangan Tambahan.
• Filter per Siswa, Bulan, Semester, dan Tahun Pelajaran.
Lampiran C	Rekap Pertemuan Dengan Murid (Konseling & Bimbingan)	• Catatan Log Pertemuan: Nomor Pertemuan, Tanggal, Nama Murid Dampingan, Topik/Masalah yang dibahas, Tindak Lanjut, dan Keterangan Status Solusi.
Lampiran D	Laporan Semester Guru Wali	• Rekapitulasi agregat perkembangan kelas selama 1 semester untuk Kepala Sekolah & Pengawas: Keaktifan 7 KAIH, statistik presensi, dan evaluasi umum.
Lampiran E	Dokumentasi Pertemuan (Galeri Foto)	• Arsip visual foto-foto pertemuan kelas/pembinaan yang tersimpan aman di Cloudinary dengan deskripsi kegiatan dan tanggal pertemuan.
3. Format Baku KOP Surat Resmi (SMK Negeri 5 Telkom Banda Aceh)
Format KOP surat resmi yang telah diidentifikasi dan siap direplikasi secara presisi pada mode cetak A4:


+-----------------------------------------------------------------------------------------+
| [LOGO PEMDA ACEH]                PEMERINTAH ACEH                           [LOGO TELKOM]|
|                                  DINAS PENDIDIKAN                                       |
|                           SMK NEGERI 5 TELKOM BANDA ACEH                                |
|                     JL. Stadion H. Dimurtala No.5, Banda Aceh 23125                     |
|                   Telp: (0651) 7552314 | Email: info@smkn5telkom.sch.id                 |
|=========================================================================================|
| (Garis ganda tebal & tipis resmi instansi)                                              |
Dinamis di Menu Admin: Teks KOP dan logo di atas dapat disesuaikan melalui halaman Pengaturan Sekolah & KOP, sehingga jika digunakan untuk sekolah lain, admin cukup mengedit form tanpa mengubah kode.
4. Alur & Fitur Presensi Pertemuan (Penyempurnaan dari Sistem Lama)
Struktur Pertemuan:
Tiap pertemuan diberi nomor urut (Pertemuan 1 s/d 20+ per semester), rentang tanggal pelaksanaan, dan opsi tombol "Tandai Libur / Tidak Ada Pertemuan".
Fitur Presensi Cepat 30 Detik:
Tombol 1-klik "Tandai Semua Hadir (H)".
Guru hanya perlu mengubah 1-2 siswa yang Sakit (S), Izin (I), atau Tidak Hadir / Alpa (A).
Dokumentasi Langsung via Cloudinary:
Tombol "Upload Dokumentasi" otomatis membuka kamera/galeri HP guru, mengompresi gambar menjadi < 200 KB, dan mengunggah langsung ke Cloudinary via unsigned preset. URL foto langsung tersimpan di catatan absensi pertemuan.
5. Fitur List Murid & Monitoring 7 KAIH
Pada halaman List Murid, guru wali dapat:

Melihat Status Pengisian Hari Ini:
Bar progress (% pengisian) dan badge Sudah Mengisi vs Pending.
One-Click WhatsApp Reminder:
Menyalin daftar siswa yang masih Pending dan langsung membuka tautan chat WA grup kelas untuk mengingatkan mereka.
Streak Counter & Radar Karakter 7 KAIH:
Melihat konsistensi harian siswa dan visualisasi kekuatan karakter (Bangun pagi, Ibadah, Olahraga, Makan sehat, Belajar, Istirahat, dan Kebaikan).
Buku Catatan Bimbingan & Umpan Balik:
Guru dapat memberi umpan balik apresiatif dan mencatat perkembangan siswa untuk Lampiran B & C.
6. Jaminan Arsitektur 100% Zero-Cost (Bebas Biaya) & Siap Vercel
Hosting: Vercel (Hobby Tier = Gratis selamanya, 100 GB Bandwidth bulanan, SSL otomatis).
Database & Auth: Firebase Firestore & Auth (Spark Plan = Gratis selamanya, 50.000 baca/hari & 50.000 user aktif).
Storage Foto: Cloudinary (Free Tier = 25 GB Bandwidth/Storage bulanan gratis, unsigned preset).
Ekspor PDF: Browser Native @media print A4 + jspdf (100% berjalan di perangkat pengguna, Rp 0).
Status Perencanaan
IMPORTANT

Seluruh arsitektur, modul resmi Lampiran A s/d E, KOP resmi, dan fitur guru telah diselaraskan dengan sempurna.
Belum ada satu pun kode program yang dieksekusi pada repositori sesuai arahan #planning.