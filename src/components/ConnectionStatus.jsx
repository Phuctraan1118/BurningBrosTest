import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export const ConnectionStatus = ({ isOffline }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOffline) {
      opacity.setValue(1);
      
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500, 
          useNativeDriver: true,
        }).start();
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      opacity.setValue(1);
    }
  }, [isOffline]);

  return (
    <Animated.View style={[
      styles.container,
      { 
        backgroundColor: isOffline ? '#ff4444' : '#4CAF50',
        opacity: isOffline ? 1 : opacity
      }
    ]}>
      <Text style={styles.text}>
        {isOffline ? 'Đang hoạt động ở chế độ offline' : 'Đã kết nối internet'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
}); 