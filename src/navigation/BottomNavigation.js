import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function BottomNavigation({ activeScreen, onNavigate }) {
  const tabs = [
    { name: 'home', label: 'Home', icon: 'home' },
    { name: 'history', label: 'History', icon: 'clock' },
    { name: 'map', label: 'Map', icon: 'map-pin' },
    { name: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tabItem}
          onPress={() => onNavigate(tab.name)}
        >
          <Icon
            name={tab.icon}
            size={24}
            color={activeScreen === tab.name ? '#333' : '#999'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeScreen === tab.name ? '#333' : '#999' },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});
