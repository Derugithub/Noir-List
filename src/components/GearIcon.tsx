import { StyleSheet, View } from 'react-native';

type Props = {
  color: string;
  /** Fill for the center hole; use the surface behind the icon. */
  holeColor: string;
  size?: number;
};

// Drawn with Views so no icon package or emoji font is needed.
export function GearIcon({ color, holeColor, size = 22 }: Props) {
  const tooth = size * 0.24;
  const body = size * 0.72;
  const hole = size * 0.3;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {[0, 45, 90, 135].map((deg) => (
        <View
          key={deg}
          style={[
            styles.center,
            {
              width: size,
              height: tooth,
              left: 0,
              top: (size - tooth) / 2,
              borderRadius: tooth / 4,
              backgroundColor: color,
              transform: [{ rotate: `${deg}deg` }],
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.center,
          {
            width: body,
            height: body,
            left: (size - body) / 2,
            top: (size - body) / 2,
            borderRadius: body / 2,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.center,
          {
            width: hole,
            height: hole,
            left: (size - hole) / 2,
            top: (size - hole) / 2,
            borderRadius: hole / 2,
            backgroundColor: holeColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute' },
});
