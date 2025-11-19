

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "@/styles/commonStyles";

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = params.mealType as string || 'breakfast';
  const date = params.date as string || new Date().toISOString().split('T')[0];
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>We need your permission to use the camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setScannedBarcode(data);
    
    console.log("✅ Barcode detected!");
    console.log("Type:", type);
    console.log("Data:", data);
    
    // Navigate to create-food with the barcode
    setTimeout(() => {
      router.replace({
        pathname: '/create-food',
        params: {
          barcode: data,
          mealType: mealType,
          date: date
        }
      });
    }, 500);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
            "code128",
            "code39",
            "code93",
            "codabar",
            "itf14",
            "qr",
            "pdf417",
            "aztec",
            "datamatrix"
          ],
        }}
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
          <Text style={styles.instructionText}>
            Point camera at barcode
          </Text>
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
  camera: {
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
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
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
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
