#include <ESP8266WiFi.h>
#include <PZEM004Tv30.h>

#define WIFI_SSID "BK"
#define WIFI_PASS "12345678"
#define SERVER_IP "192.168.43.177"  // Your server IP
#define SERVER_PORT 3000

PZEM004Tv30 pzem(5, 4);  // Keep working pins: RX:D1(GPIO5), TX:D2(GPIO4)
unsigned long lastSendTime = 0;

void setup() {
    Serial.begin(115200);
    delay(2000);
    
    Serial.println("\n\nPZEM Monitor Starting");
    
    // Connect to WiFi
    Serial.printf("Connecting to %s ", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" Connected!");
    
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}

void sendToServer(float v, float c, float p, float e, float f, float pf) {
    // Check for invalid readings
    if (isnan(v) || isnan(c) || isnan(p) || isnan(e) || isnan(f) || isnan(pf)) {
        Serial.println("Error: Invalid sensor readings, skipping server update");
        return;
    }
    
    WiFiClient client;
    
    Serial.print("Connecting to server...");
    if (client.connect(SERVER_IP, SERVER_PORT)) {
        Serial.println("connected!");
        
        // Format numbers to ensure valid JSON
        String json = "{\"v\":" + String(isnan(v) ? 0 : v, 1) + 
                     ",\"c\":" + String(isnan(c) ? 0 : c, 3) + 
                     ",\"p\":" + String(isnan(p) ? 0 : p, 1) + 
                     ",\"e\":" + String(isnan(e) ? 0 : e, 3) + 
                     ",\"f\":" + String(isnan(f) ? 0 : f, 1) + 
                     ",\"pf\":" + String(isnan(pf) ? 0 : pf, 2) + "}";
        
        client.println("POST /api/energy-data HTTP/1.1");
        client.println("Host: " SERVER_IP);
        client.println("Content-Type: application/json");
        client.print("Content-Length: ");
        client.println(json.length());
        client.println();
        client.println(json);
        
        Serial.println("Data sent: " + json);
    } else {
        Serial.println("connection failed!");
    }
    client.stop();
}

void loop() {
    if (millis() - lastSendTime >= 5000) {  // Send every 5 seconds
        float v = pzem.voltage();
        float c = pzem.current();
        float p = pzem.power();
        float e = pzem.energy();
        float f = pzem.frequency();
        float pf = pzem.pf();
        
        // Print readings
        Serial.println("\nReadings:");
        Serial.printf("Voltage: %.1fV\n", v);
        Serial.printf("Current: %.3fA\n", c);
        Serial.printf("Power: %.1fW\n", p);
        Serial.printf("Energy: %.3fkWh\n", e);
        Serial.printf("Frequency: %.1fHz\n", f);
        Serial.printf("Power Factor: %.2f\n", pf);
        
        if (WiFi.status() == WL_CONNECTED) {
            sendToServer(v, c, p, e, f, pf);
        }
        
        lastSendTime = millis();
    }
}