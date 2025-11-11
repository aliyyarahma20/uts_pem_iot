import network
import time
from machine import Pin, ADC
import dht
import ujson
from umqtt.simple import MQTTClient
from machine import Pin, PWM

# --- Konfigurasi WiFi & MQTT ---
MQTT_CLIENT_ID = "esp32_aliyyarahma"
MQTT_BROKER = "broker.hivemq.com"
TOPIC_SENSOR = "esp32/sensor"
TOPIC_POMPA = "esp32/pompa"

# --- Inisialisasi Komponen ---
sensor = dht.DHT22(Pin(15))   # Sensor suhu & kelembapan
ldr = ADC(Pin(34))            # Sensor cahaya (LDR)
ldr.atten(ADC.ATTN_11DB)      # biar rentang pembacaan 0–3.3V
relay = Pin(2, Pin.OUT)       # LED simulasi pompa
buzzer = PWM(Pin(13))   # Buzzer aktif
buzzer.freq(2000)
buzzer.duty(0)

# --- Koneksi ke WiFi ---
print("Menghubungkan ke WiFi...", end="")
sta_if = network.WLAN(network.STA_IF)
sta_if.active(True)
sta_if.connect("Wokwi-GUEST", "")
while not sta_if.isconnected():
    print(".", end="")
    time.sleep(0.3)
print("WiFi Terhubung!\n")

# --- Callback jika ada pesan MQTT ---
def on_message(topic, msg):
    if topic == TOPIC_POMPA.encode():
        if msg == b"ON":
            relay.on()
            buzzer.duty(512)  # Nyalakan buzzer
            print("💧 Pompa HIDUP")
            time.sleep(3)
            buzzer.duty(0)
        elif msg == b"OFF":
            relay.off()
            buzzer.duty(0)
            print("🚫 Pompa MATI")

# --- Setup MQTT ---
client = MQTTClient(MQTT_CLIENT_ID, MQTT_BROKER)
client.set_callback(on_message)
client.connect()
client.subscribe(TOPIC_POMPA)
print("Terhubung ke MQTT broker & subscribe ke topik kontrol pompa\n")

# --- Loop utama ---
try:
    while True:
        client.check_msg()  # cek pesan kontrol pompa

        sensor.measure()
        suhu = sensor.temperature()
        kelembapan = sensor.humidity()
        lux_raw = ldr.read()
        lux = round((lux_raw / 4095) * 100, 2)  # konversi kira2 ke % kecerahan

        data = ujson.dumps({
            "suhu": suhu,
            "kelembapan": kelembapan,
            "lux": lux
        })

        client.publish(TOPIC_SENSOR, data)
        print("Data terkirim ke MQTT:", data)

        time.sleep(5)  # kirim tiap 5 detik

except KeyboardInterrupt:
    client.disconnect()
    print("Program berhenti")
