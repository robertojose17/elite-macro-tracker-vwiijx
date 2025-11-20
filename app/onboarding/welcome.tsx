
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';

export default function OnboardingWelcomeRedirect() {
  // This file is kept for backwards compatibility
  // Redirect to auth welcome instead
  return <Redirect href="/auth/welcome" />;
}
