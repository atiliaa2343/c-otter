import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

const ColoringImage = require("../assets/images/Coloring-Page(1).png");

interface ColorOption {
  name: string;
  hex: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Brown', hex: '#92400e' },
  { name: 'Black', hex: '#000000' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Eraser', hex: '#ffffff' },
];

export function ColoringPage() {
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(20);
  const canvasRef = useRef<any>(null);
  const [drawing, setDrawing] = useState<boolean>(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primaryColor = useThemeColor({}, 'primary');

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleClearCanvas = () => {
    // In a real implementation with canvas, this would clear the drawing
    console.log('Clear canvas');
  };

  const handleSave = () => {
    // In a real implementation, this would save the drawing
    console.log('Save drawing');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor, marginLeft: 40 }]}>Coloring Page</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={handleClearCanvas}
          >
            <Ionicons name="refresh" size={20} color={textColor} />
            <Text style={[styles.headerButtonText, { color: textColor }]}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: primaryColor }]}
            onPress={handleSave}
          >
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.headerButtonTextWhite}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Coloring Area */}
      <ScrollView 
        style={styles.coloringContainer}
        contentContainerStyle={styles.coloringContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.canvasWrapper, { backgroundColor: '#fff', borderColor: cardBorder }]}>
          <Image
            source={ColoringImage}
            style={styles.coloringImage}
            resizeMode="contain"
          />
          {/* Overlay for drawing - in a real app, this would be a canvas */}
          <View style={StyleSheet.absoluteFill}>
            {/* This is where the drawing canvas would go */}
          </View>
        </View>
        
        <View style={[styles.controlsPanel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* Brush Size */}
          <View style={styles.controlSection}>
            <Text style={[styles.controlLabel, { color: textColor }]}>Brush Size</Text>
            <View style={styles.brushSizeContainer}>
              {[10, 20, 30, 40].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.brushSizeButton,
                    brushSize === size && styles.brushSizeButtonActive,
                    { backgroundColor: brushSize === size ? primaryColor : cardBg }
                  ]}
                  onPress={() => setBrushSize(size)}
                >
                  <View 
                    style={[
                      styles.brushSizeIndicator, 
                      { 
                        width: size, 
                        height: size, 
                        backgroundColor: selectedColor === '#ffffff' ? '#666' : selectedColor 
                      }
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Picker */}
          <View style={styles.controlSection}>
            <Text style={[styles.controlLabel, { color: textColor }]}>Colors</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorButton,
                    selectedColor === color.hex && styles.colorButtonActive,
                    { backgroundColor: color.hex }
                  ]}
                  onPress={() => handleColorSelect(color.hex)}
                >
                  {selectedColor === color.hex && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.hintText}>
            <Text style={[styles.hintTextContent, { color: textSecondary }]}>
              Tip: Use the eraser (white) to remove colors
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerButtonTextWhite: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  coloringContainer: {
    flex: 1,
  },
  coloringContent: {
    padding: 16,
    paddingBottom: 30,
  },
  canvasWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  coloringImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  controlsPanel: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  controlSection: {
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  brushSizeContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  brushSizeButton: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  brushSizeButtonActive: {
    borderColor: 'transparent',
  },
  brushSizeIndicator: {
    borderRadius: 50,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorButtonActive: {
    borderColor: '#000',
    transform: [{ scale: 1.1 }],
  },
  hintText: {
    marginTop: 8,
  },
  hintTextContent: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});