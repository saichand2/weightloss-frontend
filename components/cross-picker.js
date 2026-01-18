import { Picker as RNPicker } from '@react-native-picker/picker';
import { Platform, StyleSheet, View } from 'react-native';

// Cross-platform picker for native and web. For web we render a basic <select>.
export default function CrossPicker({ options = [], selectedValue, onValueChange, style }) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webWrapper, style]}>
        <select
          value={selectedValue}
          onChange={(e) => onValueChange && onValueChange(e.target.value)}
          style={styles.select}
        >
          {options.map((o) => (
            <option key={o.value?.toString() ?? o.label} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </View>
    );
  }

  // Native platforms use the community picker
  return (
    <RNPicker selectedValue={selectedValue} onValueChange={onValueChange} style={style}>
      {options.map((o) => (
        <RNPicker.Item key={o.value?.toString() ?? o.label} label={o.label} value={o.value} />
      ))}
    </RNPicker>
  );
}

const styles = StyleSheet.create({
  webWrapper: { width: '100%' },
  select: {
    width: '100%',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
  },
});
