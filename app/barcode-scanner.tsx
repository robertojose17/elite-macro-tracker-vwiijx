
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const processingRef = useRef(false);

  useEffect(() => {
    console.log('[Scanner] Component mounted');
    console.log('[Scanner] Permission status:', permission?.status);
    
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
    console.log('[Scanner] ========================================');
    console.log('[Scanner] ✓✓✓ BARCODE DETECTED EVENT FIRED! ✓✓✓');
    console.log('[Scanner] Type:', type);
    console.log('[Scanner] Data:', data);
    console.log('[Scanner] ========================================');
    
    // Update the test label immediately
    setLastScannedCode(data);
    
    // Prevent multiple simultaneous scans
    if (processingRef.current) {
      console.log('[Scanner] Already processing a scan, ignoring');
      return;
    }
    
    processingRef.current = true;
    setIsProcessing(true);

    // Haptic feedback to indicate successful scan
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('[Scanner] Haptic feedback not available');
    }

    try {
      // Step 1: Check internal database
      console.log('[Scanner] Step 1: Checking internal database...');
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
      const externalProduct = await fetchProductByBarcode(data);

      if (externalProduct) {
        console.log('[Scanner] ✓ Product found in OpenFoodFacts:', externalProduct.product_name);
        
        // Map to internal format
        const mappedFood = mapOpenFoodFactsToFood(externalProduct);
        
        // Cache in internal database
        console.log('[Scanner] Caching product in internal database...');
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
              setIsProcessing(false);
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

  const handleCameraReady = () => {
    console.log('[Scanner] ✓ Camera is ready and mounted');
  };

  const handleMountError = (error: any) => {
    console.error('[Scanner] ✗ Camera mount error:', error);
    Alert.alert(
      'Camera Error',
      'Failed to initialize camera. Please try again.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
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
          onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
          onCameraReady={handleCameraReady}
          onMountError={handleMountError}
        />
        
        <View style={styles.overlay}>
          {/* TEST LABEL - Shows last scanned code */}
          <View style={styles.testLabelContainer}>
            <Text style={styles.testLabel}>
              Last scanned code:
            </Text>
            <Text style={styles.testValue}>
              {lastScannedCode || '(waiting for scan...)'}
            </Text>
          </View>

          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {isProcessing && (
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
            <Text style={styles.processingText}>Processing barcode...</Text>
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
  testLabelContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  testLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  testValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
