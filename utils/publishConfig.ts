
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface PublishConfig {
  name: string;
  bundleId: string;
  version: string;
  platform: string;
}

/**
 * Get the publish configuration from the app config
 * Ensures all required fields are present and valid
 */
export function getPublishConfig(): PublishConfig {
  const expoConfig = Constants.expoConfig;

  // Get app name
  const name = expoConfig?.name || '';
  if (!name || name.trim() === '') {
    throw new Error('App name is not configured in app.json');
  }

  // Get bundle ID based on platform
  let bundleId = '';
  if (Platform.OS === 'ios') {
    bundleId = expoConfig?.ios?.bundleIdentifier || '';
  } else if (Platform.OS === 'android') {
    bundleId = expoConfig?.android?.package || '';
  }

  if (!bundleId || bundleId.trim() === '') {
    throw new Error(`Bundle ID is not configured for ${Platform.OS} in app.json`);
  }

  // Get version
  const version = expoConfig?.version || '1.0.0';

  return {
    name: name.trim(),
    bundleId: bundleId.trim(),
    version: version.trim(),
    platform: Platform.OS,
  };
}

/**
 * Validate bundle ID format
 */
export function validateBundleId(bundleId: string): boolean {
  // Bundle ID should be in format: com.company.app
  // Must start with a letter, contain only lowercase letters, numbers, and dots
  // Must have at least two segments separated by dots
  const bundleIdRegex = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/i;
  return bundleIdRegex.test(bundleId);
}

/**
 * Validate app name
 */
export function validateAppName(name: string): boolean {
  // App name should not be empty and should be reasonable length
  return name.trim().length > 0 && name.trim().length <= 100;
}

/**
 * Validate the entire publish configuration
 */
export function validatePublishConfig(config: PublishConfig): {
  isValid: boolean;
  errors: { [key: string]: string };
} {
  const errors: { [key: string]: string } = {};

  if (!validateAppName(config.name)) {
    errors.name = 'App name must be between 1 and 100 characters';
  }

  if (!validateBundleId(config.bundleId)) {
    errors.bundleId = 'Invalid bundle ID format (e.g., com.company.app)';
  }

  if (!config.version || config.version.trim() === '') {
    errors.version = 'Version is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Prepare the publish payload
 * Ensures all fields are strings and properly formatted
 */
export function preparePublishPayload(config: PublishConfig): {
  name: string;
  bundleId: string;
  version: string;
  platform: string;
} {
  // Validate the config
  const validation = validatePublishConfig(config);
  if (!validation.isValid) {
    const errorMessages = Object.values(validation.errors).join(', ');
    throw new Error(`Invalid publish configuration: ${errorMessages}`);
  }

  // Return the payload with all fields as strings
  return {
    name: String(config.name),
    bundleId: String(config.bundleId),
    version: String(config.version),
    platform: String(config.platform),
  };
}
