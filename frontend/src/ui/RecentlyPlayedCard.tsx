import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import colors from '../utils/colors';
import PlayAnimation from './PlayAnimation';

interface Props {
  title: string;
  poster?: string;
  isPlaying?: boolean;
  isPaused?: boolean;
  onPress?(): void;
}

export default function RecentlyPlayedCard({
  title,
  isPlaying = false,
  isPaused = true,
  onPress,
  poster,
}: Props) {
  const source = poster ? {uri: poster} : require('../assets/music.jpg');
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View>
        <Image source={source} style={styles.poster} />
        <PlayAnimation isPlaying={isPlaying} isPaused={isPaused} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor: colors.BLACK,
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    // borderColor: colors.BLUE,
  },
  poster: {
    width: 50,
    height: 50,
  },
  title: {
    // color: colors.WHITE,
    color: colors.GREY,
    fontWeight: '500',
  },
  titleContainer: {
    flex: 1,
    // paddingHorizontal: 5,
    padding: 5,
    justifyContent: 'center',
  },
});
