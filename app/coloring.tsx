import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  FlatList,
  Dimensions,
  PanResponder,
  TextInput,
  Animated
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "../hooks/useThemeColor";

const ColoringImage = require("../assets/images/Coloring-Page(1).png");

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#a855f7', '#ec4899', '#92400e', '#000000', '#6b7280',
  '#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce',
];

export default function ColoringPage() {
  const [pageIndex, setPageIndex] = useState(0); // 0: title, 1: index, 2-6: coloring pages (5 total)
  const [selectedIndex, setSelectedIndex] = useState(1); // Tracks which coloring page is selected on index (1-5)
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(20);
  const [points, setPoints] = useState<Array<{x: number; y: number; color: string; size: number}>>([]);
  const [textValue, setTextValue] = useState('');
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(true); // Track if color palette is expanded

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBg = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primaryColor = useThemeColor({}, 'primary');

  // Use refs to track current values for PanResponder
  const selectedColorRef = useRef(selectedColor);
  const brushSizeRef = useRef(brushSize);

  // Update refs when state changes
  selectedColorRef.current = selectedColor;
  brushSizeRef.current = brushSize;

   const panResponder = useRef(
     PanResponder.create({
       onStartShouldSetPanResponder: () => true,
       onMoveShouldSetPanResponder: () => true,
       onPanResponderGrant: (evt, gestureState) => {
         const point = {
           x: evt.nativeEvent.locationX,
           y: evt.nativeEvent.locationY,
           color: selectedColorRef.current,
           size: brushSizeRef.current
         };
         setPoints(prev => [...prev, point]);
       },
       onPanResponderMove: (evt, gestureState) => {
         const point = {
           x: evt.nativeEvent.locationX,
           y: evt.nativeEvent.locationY,
           color: selectedColorRef.current,
           size: brushSizeRef.current
         };
         setPoints(prev => [...prev, point]);
       },
       onPanResponderRelease: () => {
         console.log('Drawing ended, total points:', points.length);
       },
     })
   ).current;

  const renderPage = () => {
    if (pageIndex === 0) {
      // Title page - tap to go to index
      return (
        <TouchableOpacity
          style={styles.titlePage}
          onPress={() => setPageIndex(1)}
        >
          <Text style={styles.titleText}>Donuts Jam</Text>
        </TouchableOpacity>
      );
    }
    
    if (pageIndex === 1) {
      // Index page with clickable numbers 1-5
      return (
        <View style={[styles.indexPage, { backgroundColor: backgroundColor }]}>
          <Text style={[styles.indexTitle, { color: textColor }]}>Select a Coloring Page</Text>
          <View style={styles.indexNumbers}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.indexNumberBtn,
                  selectedIndex === num && styles.indexNumberBtnActive
                ]}
                onPress={() => {
                  setSelectedIndex(num);
                  setPageIndex(num + 1); // Go to coloring page (2-6)
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.indexNumberText, { color: textColor }]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setPageIndex(0)}
          >
            <Ionicons name="chevron-back" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      );
    }
    
     // Coloring pages (indices 2-6)
     return (
       <>
         {/* Image layer - at the back */}
         <View style={styles.imageContainer} pointerEvents="none">
           <Image
             source={ColoringImage}
             style={styles.image}
             resizeMode="contain"
           />
         </View>
         
         {/* Drawing layer - receives touch events */}
         <View style={styles.drawingContainer} {...panResponder.panHandlers}>
           {points.map((point, index) => (
             <View
               key={index.toString()}
               style={[
                 styles.drawPoint,
                 {
                   position: 'absolute',
                   left: point.x - point.size / 2,
                   top: point.y - point.size / 2,
                   width: point.size,
                   height: point.size,
                   backgroundColor: point.color,
                   borderRadius: point.size / 2,
                   opacity: 0.9
                 }
               ]}
               pointerEvents="none"
             />
           ))}
         </View>
         
         {/* Header - always on top */}
         <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder }]} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setPageIndex(1)} // Go back to index
          >
            <Ionicons name="chevron-back" size={20} color={textColor} />
          </TouchableOpacity>
          {pageIndex >= 2 && pageIndex <= 6 ? (
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Coloring Page {pageIndex - 1}
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              const nextPage = pageIndex >= 6 ? 2 : pageIndex + 1; // Loop back to first coloring page
              setPageIndex(nextPage);
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
        
         {/* Color Palette - Fixed at bottom */}
         <View style={[styles.bottomPalette, { backgroundColor: cardBg, borderTopColor: cardBorder }]}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScrollContent}>
             {COLOR_PALETTE.map((item) => (
               <TouchableOpacity
                 key={item}
                 style={[
                   styles.colorItemBottom,
                   { backgroundColor: item },
                   selectedColor === item && styles.colorItemSelectedBottom
                 ]}
                 onPress={() => {
                   console.log('Color selected:', item);
                   setSelectedColor(item);
                 }}
               >
                 {selectedColor === item && (
                   <Ionicons name="checkmark" size={20} color="#fff" />
                 )}
               </TouchableOpacity>
             ))}
           </ScrollView>
         </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {renderPage()}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titlePage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  titleText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
  },
  drawingContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    flex: 1,
    width: undefined,
    height: undefined,
  },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3,
    },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerButton: {
    padding: 8,
  },
   toolCard: {
     padding: 16,
     borderRadius: 16,
     borderWidth: 1,
     marginBottom: 16,
     marginTop: 60, // account for header
   },
   paletteHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
   },
   paletteContainer: {
     overflow: 'hidden',
   },
  toolLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  brushSizes: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  brushSizeBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brushPreview: {
    borderRadius: 50,
  },
  colorGrid: {
    gap: 10,
  },
  colorItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
   colorItemSelected: {
     borderColor: '#000',
     transform: [{ scale: 1.1 }],
   },
   // Index page styles
   indexPage: {
     flex: 1,
     alignItems: 'center',
     justifyContent: 'center',
   },
   indexTitle: {
     fontSize: 24,
     fontWeight: '700',
     marginBottom: 30,
   },
   indexNumbers: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'center',
     gap: 15,
   },
   indexNumberBtn: {
     width: 80,
     height: 80,
     borderRadius: 12,
     borderWidth: 2,
     borderColor: 'rgba(0,0,0,0.1)',
     alignItems: 'center',
     justifyContent: 'center',
   },
   indexNumberBtnActive: {
     borderColor: '#000', // Will be overridden with theme color in component
     backgroundColor: '#00000008', // 5% black opacity
   },
    indexNumberText: {
      fontSize: 20,
      fontWeight: '600',
    },
    backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      padding: 8,
    },
    drawPoint: {
      position: 'absolute',
    },
    // Text Box styles
    textBoxContainer: {
      position: 'absolute',
      top: 60, // below header
      right: 16,
      borderWidth: 1,
      borderRadius: 8,
      padding: 8,
      zIndex: 2,
    },
    textBox: {
      width: 150,
      height: 30,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 4,
      paddingHorizontal: 8,
      backgroundColor: '#fff',
    },
    // Hint styles
    hintContainer: {
      marginBottom: 20,
    },
    hintText: {
      fontSize: 12,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    // Bottom palette styles
    bottomPalette: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 2,
      paddingVertical: 12,
      paddingHorizontal: 8,
      zIndex: 10,
    },
    paletteScrollContent: {
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 4,
    },
    colorItemBottom: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 6,
      borderWidth: 2,
      borderColor: 'rgba(0,0,0,0.2)',
    },
    colorItemSelectedBottom: {
      borderColor: '#000',
      borderWidth: 3,
      transform: [{ scale: 1.15 }],
    },
  });
