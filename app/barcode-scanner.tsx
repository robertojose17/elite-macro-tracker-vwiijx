
import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";

export default function BarcodeScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return <Text>Requesting camera permission…</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera. Enable camera permissions.</Text>;
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    // AQUÍ ES DONDE SE DETECTA EL NÚMERO
    setScanned(true);
    setCode(data); // data = "7501031311309" por ejemplo
    // aquí luego llamas a tu Food Library con `data`
    console.log("Barcode detected:", data);
    console.log("Barcode type:", type);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scannerWrapper}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={styles.info}>
        <Text>Scanned code: {code || "—"}</Text>
        {scanned && (
          <Button title="Scan again" onPress={() => setScanned(false)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scannerWrapper: { flex: 4 },
  info: { flex: 1, justifyContent: "center", alignItems: "center" },
});
