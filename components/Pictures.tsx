import React, { useState } from 'react';
import { View, Text, FlatList, Image, Pressable, Modal } from 'react-native';

// Explicit, static requires are necessary so Metro can bundle the images.
const IMAGE_SOURCES = [
  require('../assets/images/photo/pnird-lab10.jpeg'),
  require('../assets/images/photo/pnird-lab11.jpeg'),
  require('../assets/images/photo/pnird-lab12.jpeg'),
  require('../assets/images/photo/pnird-lab13.jpeg'),
  require('../assets/images/photo/pnird-lab14.jpeg'),
  require('../assets/images/photo/pnird-lab15.jpeg'),
  require('../assets/images/photo/pnird-lab16.jpeg'),
  require('../assets/images/photo/pnird-lab17.jpeg'),
  require('../assets/images/photo/pnird-lab18.jpeg'),
  require('../assets/images/photo/pnird-lab19.jpeg'),
  require('../assets/images/photo/pnird-lab20.jpeg'),
];

export default function Pictures() {
  const images = IMAGE_SOURCES.map((src, idx) => ({ id: String(10 + idx), src }));
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <View className="flex-1 bg-white p-2">
      <Text className="text-xl font-bold text-center mb-2 mt-2">Pictures</Text>

      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item.src)} style={{ marginBottom: 16 }}>
            <Image source={item.src} style={{ width: 160, height: 200, borderRadius: 10 }} resizeMode="cover" />
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View className="items-center mt-8">
            <Text className="text-gray-500">No pictures found</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
      />

      <Modal visible={!!selected} transparent={false} onRequestClose={() => setSelected(null)}>
        <View className="flex-1 bg-black items-center justify-center">
          {selected ? (
            <Pressable onPress={() => setSelected(null)} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={selected} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </Pressable>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
