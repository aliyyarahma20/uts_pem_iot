import express from "express";
import cors from "cors";
import db from "./db.js";
import "./mqttClient.js";


const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// ✅ Endpoint utama untuk format JSON sesuai soal
app.get("/api/sensor", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM data_sensor");

    const suhuValues = rows.map((r) => r.suhu);
    const suhuMax = Math.max(...suhuValues);
    const suhuMin = Math.min(...suhuValues);
    const suhuRata = (
      suhuValues.reduce((a, b) => a + b, 0) / suhuValues.length
    ).toFixed(2);

    const maxData = rows.filter(
      (r) =>
        r.suhu === suhuMax &&
        r.humidity === Math.max(...rows.map((rr) => rr.humidity))
    );

    const monthYear = rows.map((r) => {
      const t = new Date(r.timestamp);
      return `${t.getMonth() + 1}-${t.getFullYear()}`;
    });

    res.json({
      suhumax: suhuMax,
      suhummin: suhuMin,
      suhurata: suhuRata,
      nilai_suhu_max_humid_max: maxData.map((r) => ({
        idx: r.id,
        suhun: r.suhu,
        humid: r.humidity,
        kecerahan: r.lux,
        timestamp: r.timestamp,
      })),
      month_year_max: [...new Set(monthYear)].map((m) => ({
        month_year: m,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.get("/api/all-sensor", async (req, res) => {
  try {
    const { month, year } = req.query; // bisa ?month=9&year=2010
    let query = "SELECT * FROM data_sensor";
    const params = [];

    // kalau user minta filter
    if (month && year) {
      query += " WHERE MONTH(timestamp) = ? AND YEAR(timestamp) = ?";
      params.push(month, year);
    }

    query += " ORDER BY timestamp DESC";
    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.json({ message: "Tidak ada data ditemukan untuk filter ini" });
    }

    // --- Data arrays ---
    const suhuValues = rows.map(r => r.suhu);
    const humidValues = rows.map(r => r.humidity);
    const luxValues = rows.map(r => r.lux);

    // --- Komputasi suhu ---
    const suhuMax = Math.max(...suhuValues);
    const suhuMin = Math.min(...suhuValues);
    const suhuRata = (
      suhuValues.reduce((a, b) => a + b, 0) / suhuValues.length
    ).toFixed(2);

    // --- Komputasi humidity ---
    const humidMax = Math.max(...humidValues);
    const humidMin = Math.min(...humidValues);
    const humidRata = (
      humidValues.reduce((a, b) => a + b, 0) / humidValues.length
    ).toFixed(2);

    // --- Komputasi lux ---
    const luxMax = Math.max(...luxValues);
    const luxMin = Math.min(...luxValues);
    const luxRata = (
      luxValues.reduce((a, b) => a + b, 0) / luxValues.length
    ).toFixed(2);

    // --- Data suhu & humidity maksimum bersamaan ---
    const maxData = rows.filter(
      r => r.suhu === suhuMax && r.humidity === humidMax
    );

    // --- Bulan-tahun data ekstrem ---
    const monthYear = maxData.map(r => {
      const t = new Date(r.timestamp);
      return `${t.getMonth() + 1}-${t.getFullYear()}`;
    });

    // --- Gabungan hasil lengkap ---
    res.json({
      // 🔹 Analisis suhu
      suhu: {
        max: suhuMax,
        min: suhuMin,
        rata: suhuRata
      },
      // 🔹 Analisis humidity
      humidity: {
        max: humidMax,
        min: humidMin,
        rata: humidRata
      },
      // 🔹 Analisis kecerahan (lux)
      lux: {
        max: luxMax,
        min: luxMin,
        rata: luxRata
      },
      // 🔹 Data suhu-humid tertinggi
      nilai_suhu_max_humid_max: maxData.map(r => ({
        idx: r.id,
        suhun: r.suhu,
        humid: r.humidity,
        kecerahan: r.lux,
        timestamp: r.timestamp
      })),
      // 🔹 Bulan-tahun data ekstrem
      month_year_max: [...new Set(monthYear)].map(m => ({
        month_year: m
      })),
      // 🔹 Semua data mentah (untuk monitoring/history)
      all_data: rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/hydro", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM hydro_data ORDER BY ts DESC LIMIT 20");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/hydro/control", (req, res) => {
  const { status } = req.body;
  import("./mqttClient.js").then(({ kirimPompa }) => kirimPompa(status));
  res.json({ message: `Pompa dikirim: ${status}` });
});



app.use((req, res) => {
  res.status(404).send(`⚠️ Route ${req.originalUrl} tidak ditemukan.`);
});


app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
