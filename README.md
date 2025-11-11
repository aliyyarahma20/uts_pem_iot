
# 🌿 UTS Pemrograman IoT 2025/2026

**Institut Teknologi Nasional Bandung**  
**Mata Kuliah:** IFB309 – Pemrograman IoT  
**Nama:** Aliyya Rahmawati Putri  
**NIM:** 152023093  
**Kelas:** DD  
**Dosen:** Galih Ashari R., S.Si., MT  

---

## 🧩 SOAL NOMOR 1  
### Rancang Bangun Alat Hidroponik Berbasis Internet of Things  

---

### a) Konsep Perpindahan Data  
Sistem ini menggunakan konsep **IoT berbasis MQTT (Message Queuing Telemetry Transport)**.  
Alur komunikasinya sederhana, hanya melibatkan mikrokontroler, broker, dan backend.

**Penjelasan alur:**
1. Sensor **DHT22** membaca suhu dan kelembapan udara sekitar.
2. ESP32 mengirimkan data hasil pembacaan ke **broker MQTT (HiveMQ)** dengan topik `esp32/hydroponik`.
3. Backend Node.js menerima data tersebut dan menyimpannya ke database **MySQL (tabel `hydro_data`)**.
4. Backend juga dapat mengirim perintah ON/OFF ke relay (pompa air) melalui topic `esp32/pompa`.

---

### b) Kode Mikrokontroler (ESP32)

📁 File: [`setting/konfigurasi_wokwi_1.py`](setting/konfigurasi_wokwi_1.py)

Kode ini mengatur logika **LED indikator, relay pompa, dan buzzer** berdasarkan nilai suhu dari sensor DHT22.

| Kondisi Suhu | Komponen Aktif               | Keterangan        |
|---------------|------------------------------|-------------------|
| > 35°C        | LED Merah + Buzzer + Relay   | Pompa ON (Panas)  |
| 30–35°C       | LED Kuning                   | Normal            |
| < 30°C        | LED Hijau                    | Dingin (Pompa OFF) |

📸 **Wiring Diagram:**
![Wiring 1](setting/images/wiring_1.png)

📗 **Tabel Pin ESP32:**

| Komponen     | Pin |
|--------------|-----|
| Sensor DHT22 | 15  |
| LED Hijau    | 5   |
| LED Kuning   | 18  |
| LED Merah    | 19  |
| Relay Pompa  | 25  |
| Buzzer       | 14  |

---

📡 **HiveMQ MQTT Setup (Broker Testing):**
![HiveMQ 1](setting/images/hivemq_setup_1.png)

---

✅ **Kesimpulan Soal Nomor 1:**
- ESP32 berhasil membaca suhu & kelembapan menggunakan DHT22.  
- Logika LED, buzzer, dan pompa bekerja otomatis sesuai batas suhu.  
- Data dikirim ke broker MQTT (`broker.hivemq.com`) menggunakan topik `esp32/hydroponik`.  
- Backend menerima data dan menyimpannya ke tabel `hydro_data`.  

---

## 🧩 SOAL NOMOR 2  
### Backend Data Sensor + MQTT Streaming  

---

### a) Backend Node.js  

Backend ini dibuat untuk:
1. Menghasilkan data sensor suhu, kelembapan, dan kecerahan (lux) dari tabel `data_sensor` dalam format JSON.  
2. Melakukan parsing data JSON agar dapat digunakan oleh aplikasi frontend.  
3. Berkomunikasi dengan ESP32 menggunakan MQTT dua arah (publish dan subscribe).

📁 **Struktur Folder Backend:**
```

backend/
├── db.js
├── index.js
└── mqttClient.js

````

#### 🔹 db.js
```js
import mysql from "mysql2/promise";

const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "sensor_db"
});

export default db;
````

#### 🔹 index.js

Berisi endpoint:

* `/api/sensor` → Menghasilkan JSON sesuai format soal
* `/api/all-sensor` → Menampilkan data lengkap dengan perhitungan min, max, rata-rata
* `/api/hydro` → Data hidroponik (nomor 1)
* `/api/hydro/control` → Kontrol pompa via MQTT

📸 **Proses Pembuatan Tabel Database:**
![Create Tabel 2](setting/images/create_tabel_2.png)

---

#### 🔹 mqttClient.js

Mengatur koneksi ke **HiveMQ** dan menangani data dari ESP32:

```js
client.on("message", async (topic, message) => {
  const data = JSON.parse(message.toString());
  if (topic === "esp32/sensor") {
    await db.execute("INSERT INTO data_sensor (suhu, humidity, lux, timestamp) VALUES (?, ?, ?, ?)", [...]);
  }
});
```

---

### b) Kode ESP32 (MQTT Streaming)

📁 File: [`setting/konfigurasi_wokwi_2.py`](setting/konfigurasi_wokwi_2.py)

ESP32 membaca data suhu, kelembapan, dan tingkat cahaya (LDR), lalu mengirimkannya ke broker MQTT dengan format JSON berikut:

```json
{
  "suhu": 29.1,
  "kelembapan": 61.3,
  "lux": 73.2
}
```

---

## 🗃️ Database MySQL

📘 **Isi Tabel `data_sensor`:**
![Tabel Data Sensor](setting/images/tabel_2.png)

---

## 🧭 Flowchart Sistem Nomor 2

*(khusus arsitektur backend & MQTT)*

![Flowchart Nomor 2](setting/images/Flow%20Chart%20No.2.png)

---

## 🧪 Hasil Pengujian

### 🔹 Hasil JSON dari API `/api/sensor`:

![JSON Result](setting/images/json_result.png)

### 🔹 Hasil di Database:

![Tabel Data Sensor](setting/images/tabel_2.png)

Backend berhasil:

* Menerima data dari MQTT.
* Menyimpan ke MySQL (`data_sensor`).
* Menyediakan data JSON untuk frontend.

---

## 🚀 Cara Menjalankan Proyek

### 1️⃣ Jalankan Backend

```bash
cd backend
npm install
node index.js
```

### 2️⃣ Jalankan Frontend (Monitoring Web)

```bash
cd frontend
npm install
npm start
```

### 3️⃣ Uji MQTT di Wokwi

Gunakan file berikut:

* `setting/konfigurasi_wokwi_1.py`
* `setting/konfigurasi_wokwi_2.py`

Topik MQTT yang digunakan:

```
esp32/sensor
esp32/hydroponik
esp32/pompa
```

---

## 📎 Dokumentasi Lengkap

| Jenis                             | Bukti                                                              |
| --------------------------------- | ------------------------------------------------------------------ |
| 💻 Repository GitHub              | [uts_pem_iot](https://github.com/aliyyarahma20/uts_pem_iot.git)    |
| 🧩 Kode ESP32 Nomor 1             | [`setting/konfigurasi_wokwi_1.py`](setting/konfigurasi_wokwi_1.py) |
| 🧩 Kode ESP32 Nomor 2             | [`setting/konfigurasi_wokwi_2.py`](setting/konfigurasi_wokwi_2.py) |
| 📸 Gambar Wiring                  | ![Wiring 1](setting/images/wiring_1.png)                           |
| 🧭 Flowchart (Nomor 2)            | ![Flowchart](setting/images/Flow%20Chart%20No.2.png)               |
| 🗃️ Database                      | ![Tabel Data Sensor](setting/images/tabel_2.png)                   |
| 🎥 Video Demo (Nomor 1)          | [YouTube Demo](https://youtu.be/TkJHeFKiHFE)                     |
| 🎥 Video Demo (Nomor 2)          | [YouTube Demo](https://youtu.be/2pUcJHhHjkg)                     |

---

## 👩‍💻 Identitas

**Aliyya Rahmawati Putri**
Program Studi Informatika
Institut Teknologi Nasional Bandung
📅 Bandung, 11 November 2025

```
