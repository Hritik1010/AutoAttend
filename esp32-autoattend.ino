#include <Arduino.h>
#include <BLEDevice.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <cstdio>
#include <set>
#include <algorithm>
#include <map>

// ✅ Company UUID that all employee devices advertise
const char* COMPANY_UUID = "D7E1A3F4";

// --- CONFIG: Update these for your network & AutoAttend server ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";          // Change to your WiFi name
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";      // Change to your WiFi password
const char* AUTOATTEND_HOST = "http://YOUR_SERVER_IP:5173"; // e.g. http://192.168.1.100:5173

// AutoAttend API endpoint
const char* AUTOATTEND_ENDPOINT = "/api/esp32/detect";

// How long to ignore repeat POSTs for the same event (seconds)
const uint32_t SEEN_TTL_SECONDS = 10;

// Presence/timeout configuration
// If we haven't seen a device for this many seconds, treat it as "left the office"
const uint32_t PRESENCE_TIMEOUT_SECONDS = 30;

// lastSeenAt: detection timestamp for each hex payload (seconds)
static std::map<std::string, uint32_t> lastSeenAt; // hex -> last seen epoch seconds

// lastSentAt: last time we POSTed this hex to AutoAttend (seconds) used for dedupe
static std::map<std::string, uint32_t> lastSentAt; // hex -> last POST epoch seconds

// Devices currently considered present (we've sent a "checkin" for them)
static std::set<std::string> presentDevices;

#define MAX_DEVICES 10  // Limit number of tracked devices to prevent memory issues
static std::set<std::string> devicesWithCompanyUuid;

// Helper: convert string to lowercase (with memory limit)
std::string toLowerCase(const std::string &str) {
  if (str.length() > 64) return str.substr(0, 64); // Prevent excessive memory use
  std::string lower = str;
  std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
  return lower;
}

// Helper: convert binary data to HEX string
std::string toHexString(const uint8_t* data, size_t length) {
  static const char hexChars[] = "0123456789ABCDEF";
  std::string hex;
  hex.reserve(length * 2);
  for (size_t i = 0; i < length; i++) {
    unsigned char c = data[i];
    hex += hexChars[(c >> 4) & 0x0F];
    hex += hexChars[c & 0x0F];
  }
  return hex;
}

// Helper: check if server response indicates success
bool wasPostSuccessful(const String &response) {
  return response.indexOf("\"success\":true") >= 0 || 
         response.indexOf("\"employee_name\"") >= 0 ||
         response.indexOf("\"status\":\"checkin\"") >= 0 ||
         response.indexOf("\"status\":\"checkout\"") >= 0;
}

// Send hex value to AutoAttend with check-in/check-out status
void sendToAutoAttend(const std::string &hexValue, bool detected) {
  static const int MAX_RETRIES = 3;  // Maximum number of retry attempts
  
  // dedupe by lastSentAt TTL (but only for same detection state)
  uint32_t nowSec = millis() / 1000;
  auto it = lastSentAt.find(hexValue);
  if (it != lastSentAt.end()) {
    if ((nowSec - it->second) < SEEN_TTL_SECONDS) {
      Serial.println("Ignoring duplicate POST (recent): " + String(hexValue.c_str()));
      return;
    }
  }
  lastSentAt[hexValue] = nowSec;

  int retries = 0;
  while (retries < MAX_RETRIES) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️ WiFi not connected; waiting 2s before retry...");
      delay(2000);
      if (retries == MAX_RETRIES - 1) {
        Serial.println("❌ WiFi connection failed after retries");
        if (!detected) presentDevices.erase(hexValue);  // Allow future retry for checkout
        return;
      }
      retries++;
      continue;
    }

    String url = String(AUTOATTEND_HOST) + String(AUTOATTEND_ENDPOINT);
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    // Build AutoAttend payload: {"company_uuid":"D7E1A3F4", "hex_value":"...", "detected":true}
    String payload = String("{\"company_uuid\":\"") + String(COMPANY_UUID) + 
                     String("\",\"hex_value\":\"") + String(hexValue.c_str()) + 
                     String("\",\"detected\":") + String(detected ? "true" : "false") + String("}");
    
    Serial.printf("📡 POSTing to AutoAttend (attempt %d/%d): %s\n", retries + 1, MAX_RETRIES, payload.c_str());
    
    int code = http.POST(payload);
    String resp = http.getString();
    
    if (code == 200 || code == 201) {
      if (wasPostSuccessful(resp)) {
        Serial.println("✅ AutoAttend confirmed success");
        Serial.printf("Response: %s\n", resp.c_str());
        http.end();
        return;  // Success!
      } else {
        Serial.println("⚠️ Unexpected response format");
        Serial.printf("Response: %s\n", resp.c_str());
      }
    } else {
      Serial.printf("❌ Error: POST failed with code %d\n", code);
      Serial.printf("Response: %s\n", resp.c_str());
    }
    
    http.end();
    
    // If we get here, either the response wasn't successful or the status code wasn't 200/201
    retries++;
    if (retries < MAX_RETRIES) {
      int backoff = 1000 * retries;  // Exponential backoff: 1s, 2s, 3s
      Serial.printf("⏳ Retry %d/%d after %dms\n", retries + 1, MAX_RETRIES, backoff);
      delay(backoff);
    }
  }
  
  // If we get here, we failed after all retries
  Serial.printf("❌ Failed to POST after %d attempts\n", MAX_RETRIES);
  if (!detected) presentDevices.erase(hexValue);  // Remove from tracking to allow future retry
}

// BLE Callback - Focus only on Company UUID and Service Data extraction
class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) override {
    std::string addr = advertisedDevice.getAddress().toString();
    std::string companyUuidLower = toLowerCase(COMPANY_UUID);
    bool hasCompanyUuid = false;
    std::string extractedHex;

    // 1️⃣ Check if device advertises our company UUID
    if (advertisedDevice.haveServiceUUID()) {
      std::string serviceUuid = advertisedDevice.getServiceUUID().toString();
      if (toLowerCase(serviceUuid).find(companyUuidLower) != std::string::npos) {
        hasCompanyUuid = true;
        Serial.printf("📡 Found Company UUID in Service UUID: %s\n", serviceUuid.c_str());
      }
    }

    // 2️⃣ If we found the company UUID, extract hex from service data
    if (hasCompanyUuid && advertisedDevice.haveServiceData()) {
      try {
        std::string serviceData = advertisedDevice.getServiceData();
        if (!serviceData.empty()) {
          // Convert service data to hex string
          extractedHex = toHexString((const uint8_t*)serviceData.data(), serviceData.size());
          
          Serial.println("==================================");
          Serial.printf("📡 Employee Device Found: %s\n", addr.c_str());
          Serial.printf("  Company UUID: %s\n", COMPANY_UUID);
          Serial.printf("  Service Data (Raw): ");
          for (size_t i = 0; i < serviceData.size(); i++) {
            Serial.printf("%02X ", (unsigned char)serviceData[i]);
          }
          Serial.println();
          Serial.printf("  Extracted Hex Value: %s\n", extractedHex.c_str());
          
          // Check if this is a valid hex string (employee name in hex)
          if (!extractedHex.empty() && extractedHex.length() > 0) {
            // Update presence tracking
            lastSeenAt[extractedHex] = millis() / 1000;
            
            // If device not present, mark as checked in
            if (presentDevices.find(extractedHex) == presentDevices.end()) {
              presentDevices.insert(extractedHex);
              sendToAutoAttend(extractedHex, true);  // detected = true (check-in)
              Serial.printf("  ✅ Sending CHECK-IN for hex: %s\n", extractedHex.c_str());
            } else {
              Serial.printf("  ✅ Employee already checked in (hex: %s)\n", extractedHex.c_str());
            }
            
            devicesWithCompanyUuid.insert(addr);
          } else {
            Serial.println("  ⚠️ Service data is empty or invalid");
          }
          
          Serial.println("==================================");
        }
      } catch (...) {
        Serial.println("⚠️ Error parsing service data");
      }
    }
    
    // 3️⃣ Alternative: Check if company UUID is in manufacturer data or other fields
    if (!hasCompanyUuid) {
      // Check manufacturer data
      if (advertisedDevice.haveManufacturerData()) {
        std::string mData = advertisedDevice.getManufacturerData();
        std::string mDataHex = toHexString((const uint8_t*)mData.data(), mData.size());
        if (toLowerCase(mDataHex).find(companyUuidLower) != std::string::npos) {
          hasCompanyUuid = true;
          // If found in manufacturer data, use the remaining data as hex value
          // This is a fallback - ideally service data should be used
          Serial.printf("📡 Found Company UUID in Manufacturer Data: %s\n", COMPANY_UUID);
        }
      }
      
      // Check complete advertisement payload
      if (!hasCompanyUuid) {
        std::string advStr = advertisedDevice.toString();
        if (toLowerCase(advStr).find(companyUuidLower) != std::string::npos) {
          hasCompanyUuid = true;
          Serial.printf("📡 Found Company UUID in Advertisement: %s\n", COMPANY_UUID);
        }
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.printf("Starting AutoAttend BLE Scanner (Company UUID: %s)...\n", COMPANY_UUID);
  Serial.println("Looking for employee devices advertising the company UUID with hex names in service data");
  
  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(500);
    if ((millis() - start) > 20000) break;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected: " + WiFi.localIP().toString());
  } else {
    Serial.println("WiFi not connected; will still scan but cannot POST until connected");
  }

  BLEDevice::init("AutoAttend_Scanner");
}

void loop() {
  devicesWithCompanyUuid.clear();

  static MyAdvertisedDeviceCallbacks myCallbacks;
  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(&myCallbacks, false);
  pBLEScan->setActiveScan(true);
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99);

  int scanTime = 3;  // scan for 3 seconds
  Serial.printf("\n🔍 Scanning for employee devices with Company UUID %s...\n", COMPANY_UUID);
  pBLEScan->start(scanTime, false);
  pBLEScan->stop();

  Serial.printf("\n✅ Scan complete. Found %d employee device(s):\n", (int)devicesWithCompanyUuid.size());
  for (auto &mac : devicesWithCompanyUuid) {
    Serial.printf("   - %s\n", mac.c_str());
  }
  
  // Check for devices that have timed out (left the office)
  uint32_t nowSec = millis() / 1000;
  std::vector<std::string> toRemove;
  for (const auto &hexValue : presentDevices) {
    auto it = lastSeenAt.find(hexValue);
    if (it == lastSeenAt.end()) continue;
    if ((nowSec - it->second) > PRESENCE_TIMEOUT_SECONDS) {
      // Device left - send check-out
      Serial.printf("📤 Employee %s timed out (no longer seen). Sending CHECK-OUT...\n", hexValue.c_str());
      sendToAutoAttend(hexValue, false);  // detected = false (check-out)
      toRemove.push_back(hexValue);
    }
  }
  for (const auto &r : toRemove) {
    presentDevices.erase(r);
    lastSeenAt.erase(r);
  }

  Serial.printf("⏳ Waiting 4 seconds before next scan... (Currently tracking %d employees)\n\n", 
                (int)presentDevices.size());
  delay(4000);  // 4 second delay + 3 second scan = ~7 second total cycle
}
