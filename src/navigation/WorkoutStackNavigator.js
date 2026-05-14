// src/navigation/WorkoutStackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutScreen from '../screens/main/WorkoutScreen';
import ActiveWorkoutScreen from '../screens/workout/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '../screens/workout/WorkoutSummaryScreen';
import WorkoutHistoryScreen from '../screens/workout/WorkoutHistoryScreen';
import EditWorkoutPlanScreen from '../screens/workout/EditWorkoutPlanScreen';
import ManualPlanBuilderScreen from '../screens/onboarding/ManualPlanBuilderScreen';

const Stack = createNativeStackNavigator();

export default function WorkoutStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false,
      animation: 'fade',
      contentStyle: { backgroundColor: '#0D0D0D' }
    }}>
      <Stack.Screen name="WorkoutHome" component={WorkoutScreen} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
      <Stack.Screen name="EditWorkoutPlan" component={EditWorkoutPlanScreen} />
      <Stack.Screen name="ManualPlanBuilder" component={ManualPlanBuilderScreen} />
    </Stack.Navigator>
  );
}