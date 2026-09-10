# Nakama CMS — Apps Script Backend

Backend ini menghubungkan dashboard CMS ke Google Sheets dan GitHub. Token GitHub **tidak pernah** diletakkan di frontend.

## 1. Buat Google Sheet

Buat satu Google Spreadsheet baru. Salin Spreadsheet ID dari URL.

## 2. Buat Apps Script

Buka `script.google.com` → New project. Salin isi `apps-script/Code.gs` ke `Code.gs`.

## 3. Script Properties

Di Apps Script buka **Project Settings → Script properties** lalu tambahkan:

- `SHEET_ID` = ID Google Spreadsheet
- `GITHUB_TOKEN` = GitHub Personal Access Token
- `GITHUB_OWNER` = `barrack3030-wq`
- `GITHUB_SOURCE_REPO` = `CMS-NAKAMA-DIGITAL`

Jangan commit nilai token ke repository.

### GitHub token

Gunakan fine-grained token dengan akses yang diperlukan untuk membuat repository, menulis Contents, dan mengelola GitHub Pages pada akun/repository yang dipakai. Untuk pembuatan repository dan Pages, GitHub mensyaratkan permission administrasi/Pages yang sesuai.

## 4. Inisialisasi database

Jalankan fungsi `initSheets()` sekali dari Apps Script editor dan izinkan permission yang diminta. Dua sheet akan dibuat:

- `customers`
- `websites`

## 5. Deploy Web App

Deploy → New deployment → Web app.

- Execute as: Me
- Who has access: Anyone

Salin URL `/exec`.

## 6. Hubungkan CMS

Buka CMS → **Settings** → Apps Script Web App URL → paste URL → **Simpan & Test**.

## 7. Alur generator

1. Tambah customer.
2. Buka Themes.
3. Klik Generate pada theme.
4. Pilih customer.
5. Apps Script membuat repository customer secara otomatis.
6. File theme disalin dari repository CMS.
7. Data dasar customer dimasukkan ke HTML.
8. GitHub Pages dikonfigurasi.
9. Repository dan URL website disimpan ke Google Sheets.

GitHub Pages memang merupakan hosting static berbasis repository, sehingga website customer tidak memerlukan server PHP/Node di repository hasil generate.

## Catatan

- Repository customer dibuat public pada versi ini agar kompatibel dengan GitHub Free Pages.
- Jangan menyimpan password, API key, atau data sensitif customer di repository website public.
- Quota Google Apps Script dan GitHub API tetap berlaku.
