
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import {
  getPublishConfig,
  validateBundleId,
  validateAppName,
  preparePublishPayload,
  PublishConfig,
} from '@/utils/publishConfig';

export default function PublishScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [appName, setAppName] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [version, setVersion] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; bundleId?: string }>({});

  useEffect(() => {
    // Load initial values from config
    try {
      const config = getPublishConfig();
      setAppName(config.name);
      setBundleId(config.bundleId);
      setVersion(config.version);
      console.log('Loaded publish config:', config);
    } catch (error: any) {
      console.error('Error loading publish config:', error);
      Alert.alert(
        'Configuration Error',
        error.message || 'Failed to load app configuration. Please check your app.json file.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, []);

  const validateInputs = () => {
    const newErrors: { name?: string; bundleId?: string } = {};

    // Validate app name
    if (!validateAppName(appName)) {
      newErrors.name = 'App name must be between 1 and 100 characters';
    }

    // Validate bundle ID
    if (!validateBundleId(bundleId)) {
      newErrors.bundleId = 'Invalid bundle ID format (e.g., com.company.app)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    console.log('Starting publish process...');
    
    // Validate inputs
    if (!validateInputs()) {
      Alert.alert('Validation Error', 'Please fix the errors before publishing.');
      return;
    }

    setIsPublishing(true);

    try {
      // Prepare the config
      const config: PublishConfig = {
        name: appName,
        bundleId: bundleId,
        version: version,
        platform: Platform.OS,
      };

      // Prepare and validate the payload
      const payload = preparePublishPayload(config);

      console.log('Publishing with payload:', JSON.stringify(payload, null, 2));

      // Verify that name and bundleId are strings
      if (typeof payload.name !== 'string' || typeof payload.bundleId !== 'string') {
        throw new Error('Invalid payload: name and bundleId must be strings');
      }

      // Make the API call to publish
      // Replace this URL with the actual Natively publish endpoint
      const response = await fetch('https://api.natively.dev/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Publish response:', result);

      if (!response.ok) {
        // Log the validation errors if present
        if (result.errors) {
          console.error('Validation errors:', JSON.stringify(result.errors, null, 2));
        }
        throw new Error(result.message || 'Failed to publish app');
      }

      Alert.alert(
        'Success',
        'Your app has been published successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Publish error:', error);
      Alert.alert(
        'Publish Failed',
        error.message || 'An error occurred while publishing your app. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={isDark ? colors.textDark : colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
          Publish App
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            Before publishing, ensure your app name and bundle ID are correct. These values will be used to identify your app.
          </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
              App Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.backgroundDark : colors.background,
                  color: isDark ? colors.textDark : colors.text,
                  borderColor: errors.name ? colors.error : (isDark ? colors.borderDark : colors.border),
                },
              ]}
              value={appName}
              onChangeText={(text) => {
                setAppName(text);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholder="Enter app name"
              placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
            />
            {errors.name && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.name}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
              Bundle ID *
            </Text>
            <Text style={[styles.hint, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Format: com.company.appname
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? colors.backgroundDark : colors.background,
                  color: isDark ? colors.textDark : colors.text,
                  borderColor: errors.bundleId ? colors.error : (isDark ? colors.borderDark : colors.border),
                },
              ]}
              value={bundleId}
              onChangeText={(text) => {
                setBundleId(text.toLowerCase().replace(/\s/g, ''));
                if (errors.bundleId) {
                  setErrors({ ...errors, bundleId: undefined });
                }
              }}
              placeholder="com.company.appname"
              placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.bundleId && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.bundleId}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
              Version
            </Text>
            <Text style={[styles.versionText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              {version}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
              Platform
            </Text>
            <Text style={[styles.versionText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
            </Text>
          </View>
        </View>

        <View style={[styles.debugCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.debugTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Debug Info
          </Text>
          <Text style={[styles.debugText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            Name type: {typeof appName}
          </Text>
          <Text style={[styles.debugText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            BundleId type: {typeof bundleId}
          </Text>
          <Text style={[styles.debugText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            Name value: {appName || '(empty)'}
          </Text>
          <Text style={[styles.debugText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            BundleId value: {bundleId || '(empty)'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.publishButton,
            { backgroundColor: colors.primary },
            isPublishing && styles.publishButtonDisabled,
          ]}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol
                ios_icon_name="arrow.up.circle.fill"
                android_material_icon_name="cloud_upload"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.publishButtonText}>Publish App</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.warningCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={24}
            color={colors.accent}
          />
          <Text style={[styles.warningText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            Make sure to test your app thoroughly before publishing. Once published, changes may take time to propagate.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h2,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  infoText: {
    ...typography.body,
    flex: 1,
  },
  formCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  versionText: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  debugCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  debugTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  debugText: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  publishButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#FFFFFF',
    ...typography.bodyBold,
    fontSize: 16,
  },
  warningCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  warningText: {
    ...typography.caption,
    flex: 1,
  },
});
