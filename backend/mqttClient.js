import mqtt from "mqtt";
import db from "./db.js";

const MQTT_BROKER = "mqtt://broker.hivemq.com";
const TOPIC_SENSOR = "esp32/sensor";
const TOPIC_POMPA = "esp32/pompa";
const TOPIC_HYDROPONIK = "esp32/hydroponik";

// Koneksi ke broker
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log("Terhubung ke HiveMQ Broker");
  client.subscribe([TOPIC_SENSOR, TOPIC_HYDROPONIK], (err) => {
    if (!err) console.log(`Subscribe ke topic: ${TOPIC_SENSOR} & ${TOPIC_HYDROPONIK}`);
  });
});

// Ketika ada pesan masuk dari ESP32
client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    if (topic === TOPIC_SENSOR) {
      const suhu = data.suhu ?? null;
      const humidity = data.kelembapan ?? null;
      const lux = Math.floor(Math.random() * 30) + 10;
      const timestamp = new Date();

      await db.execute(
        "INSERT INTO data_sensor (suhu, humidity, lux, timestamp) VALUES (?, ?, ?, ?)",
        [suhu, humidity, lux, timestamp]
      );

      console.log("Data sensor umum disimpan:", { suhu, humidity, lux });
    }

    else if (topic === TOPIC_HYDROPONIK) {
      const suhu = data.suhu ?? null;
      const humidity = data.kelembapan ?? null;
      const led_green = data.led_hijau ?? null;
      const led_yellow = data.led_kuning ?? null;
      const led_red = data.led_merah ?? null;
      const relay_state = data.relay ?? null;

      await db.execute(
        `INSERT INTO hydro_data
         (suhu, humidity, led_green, led_yellow, led_red, relay_state)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [suhu, humidity, led_green, led_yellow, led_red, relay_state]
      );

      console.log("Data hidroponik disimpan:", {
        suhu,
        humidity,
        led_green,
        led_yellow,
        led_red,
        relay_state
      });
    }

  } catch (err) {
    console.error("❌ Gagal parsing MQTT data:", err);
  }
});

// Fungsi kirim kontrol pompa ke ESP32
export function kirimPompa(status) {
  client.publish(TOPIC_POMPA, status);
  console.log(`Pompa dikirim: ${status}`);
}

export default client;
