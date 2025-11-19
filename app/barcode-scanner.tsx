
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useRouter } from "expo-router";

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setScannedBarcode(data);
    
    console.log("✅ Barcode detected!");
    console.log("Type:", type);
    console.log("Data:", data);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>No access to camera.</Text>
        <Text style={styles.messageText}>Please enable camera permissions in settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.scanner}
      />
      
      <View style={styles.overlay}>
        <View style={styles.topSection}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Scanned code:</Text>
            <Text style={styles.resultCode}>{scannedBarcode || "—"}</Text>
            
            {scanned && (
              <TouchableOpacity 
                style={styles.scanAgainButton}
                onPress={() => {
                  setScanned(false);
                  setScannedBarcode("");
                }}
              >
                <Text style={styles.scanAgainText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topSection: {
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 180,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  bottomSection: {
    paddingBottom: 120,
  },
  resultContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 24,
    alignItems: "center",
  },
  resultLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  resultCode: {
    color: "#4CAF50",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scanAgainButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  scanAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 20,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
});
