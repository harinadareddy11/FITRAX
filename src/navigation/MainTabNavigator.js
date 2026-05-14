// src/navigation/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import ProgressScreen from '../screens/main/ProgressScreen';
import WorkoutStackNavigator from './WorkoutStackNavigator';
import DietScreen from '../screens/main/DietScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

function TabIcon({ label, emoji, focused, colors }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 26 }}>{emoji}</Text>
      <Text style={{
        fontFamily: focused ? 'Outfit_600SemiBold' : 'Outfit_400Regular',
        fontSize: 10,
        color: focused ? colors.tabActive : colors.tabInactive,
        marginTop: 3,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function MainTabNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
        },
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}           options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home"    emoji="🏠" focused={focused} colors={colors} /> }} />
      <Tab.Screen name="Progress" component={ProgressScreen}       options={{ tabBarIcon: ({ focused }) => <TabIcon label="Progress" emoji="📈" focused={focused} colors={colors} /> }} />
      <Tab.Screen name="Workout"  component={WorkoutStackNavigator} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Workout"  emoji="💪" focused={focused} colors={colors} /> }} />
      <Tab.Screen name="Diet"     component={DietScreen}           options={{ tabBarIcon: ({ focused }) => <TabIcon label="Diet"     emoji="🥗" focused={focused} colors={colors} /> }} />
      <Tab.Screen name="Profile"  component={ProfileScreen}        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Profile"  emoji="👤" focused={focused} colors={colors} /> }} />
    </Tab.Navigator>
  );
}