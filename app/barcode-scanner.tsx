
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { findFoodByBarcode, upsertFood } from '@/utils/foodDatabase';
import { fetchProductByBarcode, mapOpenFoodFactsToFood } from '@/utils/openFoodFacts';

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = params.mealType as string || 'breakfast';
  const date = params.date as string || new Date().toISOString().split('T')[0];
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const processingRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera permissions in your device settings to use barcode scanning.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [permission]);

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? colors.textDark : colors.text} />
          <Text style={[styles.loadingText, { color: isDark ? colors.textDark : colors.text }]}>
            Loading camera...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={isDark ? colors.textDark : colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
            Barcode Scanner
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.permissionContainer}>
          <IconSymbol
            ios_icon_name="camera.fill"
            android_material_icon_name="camera_alt"
            size={64}
            color={isDark ? colors.textSecondaryDark : colors.textSecondary}
          />
          <Text style={[styles.permissionTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.permissionText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            We need access to your camera to scan barcodes and quickly add foods to your diary.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // Prevent multiple simultaneous scans
    if (processingRef.current) {
      console.log('[Scanner] Already processing a scan, ignoring');
      return;
    }
    
    console.log(`[Scanner] ✓✓✓ BARCODE DETECTED! Type: ${type}, Data: ${data}`);
    
    // IMMEDIATELY update the debug label to prove detection is working
    setLastScannedCode(data);
    
    processingRef.current = true;
    setScanned(true);
    setIsProcessing(true);
    setStatusMessage('Barcode detected!');

    // Haptic feedback to indicate successful scan
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('[Scanner] Haptic feedback not available');
    }

    // Small delay to let user see the debug label update
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Step 1: Check internal database
      console.log('[Scanner] Step 1: Checking internal database...');
      setStatusMessage('Checking internal database...');
      const internalFood = await findFoodByBarcode(data);

      if (internalFood) {
        console.log('[Scanner] ✓ Food found in internal database:', internalFood.name);
        // Navigate directly to food detail screen
        router.replace({
          pathname: '/food-detail',
          params: {
            foodId: internalFood.id,
            mealType: mealType,
            date: date,
            fromBarcode: 'true'
          }
        });
        return;
      }

      console.log('[Scanner] ✗ Not found in internal database');

      // Step 2: Check OpenFoodFacts (external database)
      console.log('[Scanner] Step 2: Checking OpenFoodFacts API...');
      setStatusMessage('Searching OpenFoodFacts...');
      const externalProduct = await fetchProductByBarcode(data);

      if (externalProduct) {
        console.log('[Scanner] ✓ Product found in OpenFoodFacts:', externalProduct.product_name);
        
        // Map to internal format
        const mappedFood = mapOpenFoodFactsToFood(externalProduct);
        
        // Cache in internal database
        console.log('[Scanner] Caching product in internal database...');
        setStatusMessage('Caching product...');
        const cachedFood = await upsertFood(mappedFood);
        
        console.log('[Scanner] ✓ Product cached successfully:', cachedFood.id);
        
        // Navigate to food detail screen
        router.replace({
          pathname: '/food-detail',
          params: {
            foodId: cachedFood.id,
            mealType: mealType,
            date: date,
            fromBarcode: 'true',
            fromOpenFoodFacts: 'true'
          }
        });
        return;
      }

      console.log('[Scanner] ✗ Not found in OpenFoodFacts');

      // Step 3: Neither found - open create food screen
      console.log('[Scanner] Step 3: Opening create food screen with barcode pre-filled');
      router.replace({
        pathname: '/create-food',
        params: {
          barcode: data,
          mealType: mealType,
          date: date,
          fromBarcode: 'true'
        }
      });
    } catch (error) {
      console.error('[Scanner] Error processing barcode scan:', error);
      processingRef.current = false;
      setScanned(false);
      setIsProcessing(false);
      
      Alert.alert(
        'Error',
        'Failed to process barcode. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              // Reset state to allow retry
              processingRef.current = false;
              setScanned(false);
              setIsProcessing(false);
              setLastScannedCode('');
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back()
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>
          Scan Barcode
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* DEBUG LABEL - PROVES SCANNER IS WORKING */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugLabel}>
          Last scanned code:
        </Text>
        <Text style={styles.debugValue}>
          {lastScannedCode || '(waiting for scan...)'}
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code128',
              'code39',
              'code93',
              'codabar',
              'itf14',
              'qr',
              'pdf417',
              'aztec',
            ],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
        
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {scanned && (
              <View style={styles.scanSuccessIndicator}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={48}
                  color="#4CAF50"
                />
              </View>
            )}
          </View>
          
          {!isProcessing && (
            <Text style={styles.instructionText}>
              Position barcode within the frame
            </Text>
          )}
        </View>
      </View>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>{statusMessage}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0,
    paddingBottom: spacing.md,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  title: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  debugContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 80 : 60,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#FFD700',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  debugValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  permissionButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#FFFFFF',
    borderWidth: 0,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
  },
  scanSuccessIndicator: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.xl * 2,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
