// src/navigation/OnboardingNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingGoalScreen from '../screens/onboarding/OnboardingGoalScreen';
import OnboardingStatsScreen from '../screens/onboarding/OnboardingStatsScreen';
import OnboardingEquipmentScreen from '../screens/onboarding/OnboardingEquipmentScreen';
import OnboardingWorkoutPlanScreen from '../screens/onboarding/OnboardingWorkoutPlanScreen';
import ManualPlanBuilderScreen from '../screens/onboarding/ManualPlanBuilderScreen';
import OnboardingDietBudgetScreen from '../screens/onboarding/OnboardingDietBudgetScreen';
import OnboardingLoggingModeScreen from '../screens/onboarding/OnboardingLoggingModeScreen';
import BiometricSetupScreen from '../screens/onboarding/BiometricSetupScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator({ onComplete }) {
  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false, 
      gestureEnabled: false,
      animation: 'fade',
      contentStyle: { backgroundColor: '#0D0D0D' }
    }}>
      <Stack.Screen name="Goal" component={OnboardingGoalScreen} />
      <Stack.Screen name="Stats" component={OnboardingStatsScreen} />
      <Stack.Screen name="Equipment" component={OnboardingEquipmentScreen} />
      <Stack.Screen name="WorkoutPlan" component={OnboardingWorkoutPlanScreen} />
      <Stack.Screen name="ManualPlanBuilder" component={ManualPlanBuilderScreen} options={{ gestureEnabled: true }} />
      <Stack.Screen name="DietBudget" component={OnboardingDietBudgetScreen} />
      <Stack.Screen name="LoggingMode" component={OnboardingLoggingModeScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <Stack.Screen
        name="OnboardingComplete"
        children={(props) => <OnboardingCompleteScreen {...props} onComplete={onComplete} />}
      />
    </Stack.Navigator>
  );
}