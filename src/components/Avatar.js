// src/components/Avatar.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { avatarColor, initials } from '../theme';

export default function Avatar({ name = '', size = 36 }) {
  const { bg, fg } = avatarColor(name);
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg, fontSize: size * 0.38 }]}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
});
