import network
import time
from machine import Pin, PWM
import dht
import ujson
from umqtt.simple import MQTTClient

# --- Konfigurasi WiFi & MQTT ---
MQTT_CLIENT_ID = "esp32_aliy_hydro"
MQTT_BROKER = "broker.hivemq.com"
TOPIC_SENSOR = "esp32/hydroponik"
TOPIC_POMPA = "esp32/pompa"

# --- Inisialisasi Sensor & Aktuator ---
sensor = dht.DHT22(Pin(15))
led_hijau = Pin(5, Pin.OUT)
led_kuning = Pin(18, Pin.OUT)
led_merah = Pin(19, Pin.OUT)
relay = Pin(25, Pin.OUT)
buzzer = PWM(Pin(14))
buzzer.freq(2000)
buzzer.duty(0)  # mulai dalam keadaan off

# Pastikan semua awalnya mati
for pin in [led_hijau, led_kuning, led_merah, relay]:
    pin.off()

# --- WiFi ---
print("Menghubungkan ke WiFi...", end="")
sta_if = network.WLAN(network.STA_IF)
sta_if.active(True)
sta_if.connect("Wokwi-GUEST", "")
while not sta_if.isconnected():
    print(".", end="")
    time.sleep(0.3)
print("\nTerhubung ke WiFi!")

# --- MQTT Callback ---
def on_message(topic, msg):
    print(f"[Pesan Masuk] {topic}: {msg}")
    if topic == TOPIC_POMPA.encode():
        if msg == b"ON":
            relay.on()
            buzzer.duty(512)
            print("💧 Pompa dinyalakan")
            time.sleep(3)
            buzzer.duty(0)
        elif msg == b"OFF":
            relay.off()
            buzzer.duty(0)
            print("🚫 Pompa dimatikan")

# --- MQTT Setup ---
client = MQTTClient(MQTT_CLIENT_ID, MQTT_BROKER)
client.set_callback(on_message)
client.connect()
client.subscribe(TOPIC_POMPA)
print("Terkoneksi ke MQTT broker!")

# --- Loop utama ---
try:
    while True:
        client.check_msg()
        sensor.measure()
        suhu = sensor.temperature()
        hum = sensor.humidity()

        # Logika LED + Buzzer
        if suhu > 35:
            led_merah.on()
            led_kuning.off()
            led_hijau.off()
            buzzer.duty(512)
            relay.on()
            kondisi = "Panas"
        elif 30 <= suhu <= 35:
            led_merah.off()
            led_kuning.on()
            led_hijau.off()
            buzzer.duty(0)
            relay.off()
            kondisi = "Normal"
        else:
            led_merah.off()
            led_kuning.off()
            led_hijau.on()
            buzzer.duty(0)
            relay.off()
            kondisi = "Dingin"

        # Publish ke MQTT
        data = ujson.dumps({
            "suhu": suhu,
            "kelembapan": hum,
            "led_merah": int(led_merah.value()),
            "led_kuning": int(led_kuning.value()),
            "led_hijau": int(led_hijau.value()),
            "relay": int(relay.value()),
            "status": kondisi
        })
        client.publish(TOPIC_SENSOR, data)
        print("Data terkirim:", data)
        time.sleep(5)

except KeyboardInterrupt:
    buzzer.duty(0)
    client.disconnect()
    print("Program berhenti.")
