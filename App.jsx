import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProductList } from './src/components/ProductList';
import { FavoritesList } from './src/components/FavoritesList';
import { initDatabase } from './src/services/database';
import { MaterialIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    initDatabase().catch(error => 
      console.error('Failed to initialize database:', error)
    );
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            paddingBottom: 5,
            height: 55,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: -5,
          },
        }}
      >
        <Tab.Screen 
          name="Products" 
          component={ProductList}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="shopping-cart" size={size} color={color} />
            ),
            tabBarLabel: 'Products',
          }}
        />
        <Tab.Screen 
          name="Favorites" 
          component={FavoritesList}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="favorite" size={size} color={color} />
            ),
            tabBarLabel: 'Favorites',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
} 