import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Dimensions,
  PanResponder,
  Alert
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
  const [brushType, setBrushType] = useState<'marker' | 'pencil' | 'crayon' | 'eraser'>('marker'); // marker, pencil, crayon, eraser
  const [points, setPoints] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [futurePoints, setFuturePoints] = useState<any[]>([]);
  const [textValue, setTextValue] = useState('');
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(true); // Track if color palette is expanded
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBg = useThemeColor({}, 'background');
  const cardBorder = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'tabIconDefault');

  // Reset points when navigating between coloring pages
  useEffect(() => {
    // Reset points when we're on a coloring page (2-6) and pageIndex changes
    if (pageIndex >= 2 && pageIndex <= 6) {
      setPoints([]);
      setPointsHistory([]);
      setFuturePoints([]);
    }
    // Also reset when leaving coloring interface (going to title or index)
    else if (pageIndex === 0 || pageIndex === 1) {
      setPoints([]);
      setPointsHistory([]);
      setFuturePoints([]);
    }
  }, [pageIndex]);

  // Add current points to history for undo functionality
  const addToHistory = useCallback(() => {
    if (points.length > 0) {
      setPointsHistory(prev => [...prev, points]);
      setFuturePoints([]); // Clear future points when new action is performed
    }
  }, [points]);

  // Undo function
  const undo = useCallback(() => {
    if (pointsHistory.length > 0) {
      const lastPoints = pointsHistory[pointsHistory.length - 1];
      setFuturePoints(prev => [points, ...prev]);
      setPointsHistory(prev => prev.slice(0, -1));
      setPoints(lastPoints);
    }
  }, [points, pointsHistory, futurePoints]);

  // Redo function
  const redo = useCallback(() => {
    if (futurePoints.length > 0) {
      const nextPoints = futurePoints[0];
      setPointsHistory(prev => [...prev, points]);
      setFuturePoints(prev => prev.slice(1));
      setPoints(nextPoints);
    }
  }, [points, pointsHistory, futurePoints]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    addToHistory();
    setPoints([]);
  }, [addToHistory]);

  // Save artwork
  const saveArtwork = async () => {
    try {
      setIsSaving(true);
      // In a real app, we would capture the canvas and save/share it
      // For now, we'll show a success message
      Alert.alert(
        'Artwork Saved!',
        'Your coloring has been saved to your device gallery.',
        [
          { text: 'OK', onPress: () => setShowSaveOptions(false) }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save artwork. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Share artwork
  const shareArtwork = async () => {
    try {
      setIsSaving(true);
      // In a real app, we would capture the canvas and share it
      Alert.alert(
        'Artwork Shared!',
        'Your coloring has been shared.',
        [
          { text: 'OK', onPress: () => setShowSaveOptions(false) }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to share artwork. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle long press on canvas to show context menu
  const handleCanvasLongPress = () => {
    setShowSaveOptions(true);
  };

  // Update refs when state changes
  const selectedColorRef = useRef(selectedColor);
  const brushSizeRef = useRef(brushSize);
  const brushTypeRef = useRef(brushType);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
    brushSizeRef.current = brushSize;
    brushTypeRef.current = brushType;
  }, [selectedColor, brushSize, brushType]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        addToHistory(); // Add to history when starting a new stroke
        
        if (brushTypeRef.current === 'eraser') {
          // Eraser: remove points within radius
          const eraserX = evt.nativeEvent.locationX;
          const eraserY = evt.nativeEvent.locationY;
          const eraserRadius = brushSizeRef.current;
          
          setPoints(prev => prev.filter(point => {
            const distance = Math.sqrt(
              Math.pow(point.x - eraserX, 2) + Math.pow(point.y - eraserY, 2)
            );
            return distance > eraserRadius;
          }));
        } else {
          // Regular drawing
          const point = {
            x: evt.nativeEvent.locationX,
            y: evt.nativeEvent.locationY,
            color: selectedColorRef.current,
            size: brushSizeRef.current,
            type: brushTypeRef.current
          };
          setPoints(prev => [...prev, point]);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (brushTypeRef.current === 'eraser') {
          // Eraser: remove points within radius
          const eraserX = evt.nativeEvent.locationX;
          const eraserY = evt.nativeEvent.locationY;
          const eraserRadius = brushSizeRef.current;
          
          setPoints(prev => prev.filter(point => {
            const distance = Math.sqrt(
              Math.pow(point.x - eraserX, 2) + Math.pow(point.y - eraserY, 2)
            );
            return distance > eraserRadius;
          }));
        } else {
          // Regular drawing
          const point = {
            x: evt.nativeEvent.locationX,
            y: evt.nativeEvent.locationY,
            color: selectedColorRef.current,
            size: brushSizeRef.current,
            type: brushTypeRef.current
          };
          setPoints(prev => [...prev, point]);
        }
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
            {points.map((point, index) => {
              // Skip eraser points (they shouldn't be rendered)
              if (point.type === 'eraser') return null;
              
              // Different brush types have different rendering
              const pointStyle = {
                position: 'absolute' as const,
                left: point.x - point.size / 2,
                top: point.y - point.size / 2,
                width: point.size,
                height: point.size,
                backgroundColor: point.color,
                borderRadius: point.size / 2,
                opacity: 0.9
              };
              
              return (
                <View
                  key={index.toString()}
                  style={[styles.drawPoint, pointStyle]}
                  pointerEvents="none"
                />
              );
            })}
            
            {/* Long press to show save options */}
            <TouchableOpacity 
              style={StyleSheet.absoluteFillObject}
              onLongPress={handleCanvasLongPress}
            />
          </View>
          
          {/* Save/Export Modal */}
          <View style={showSaveOptions ? styles.modalContainer : styles.modalHidden}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Export Artwork</Text>
                <TouchableOpacity onPress={() => setShowSaveOptions(false)}>
                  <Ionicons name="close-circle" size={24} color={textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={saveArtwork}
                >
                  <Ionicons name="save" size={24} color={primaryColor} />
                  <Text style={styles.modalButtonText}>Save to Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={shareArtwork}
                >
                  <Ionicons name="share" size={24} color={primaryColor} />
                  <Text style={styles.modalButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
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
           {/* Brush Type Selector */}
           <View style={styles.brushTypeSelector}>
             <TouchableOpacity
               style={[
                 styles.brushTypeBtn,
                 brushType === 'marker' && styles.brushTypeBtnActive
               ]}
               onPress={() => setBrushType('marker')}
             >
               <Ionicons name="pencil" size={20} color={brushType === 'marker' ? primaryColor : textSecondary} />
             </TouchableOpacity>
             <TouchableOpacity
               style={[
                 styles.brushTypeBtn,
                 brushType === 'pencil' && styles.brushTypeBtnActive
               ]}
               onPress={() => setBrushType('pencil')}
             >
               <Ionicons name="pencil" size={20} color={brushType === 'pencil' ? primaryColor : textSecondary} />
             </TouchableOpacity>
             <TouchableOpacity
               style={[
                 styles.brushTypeBtn,
                 brushType === 'crayon' && styles.brushTypeBtnActive
               ]}
               onPress={() => setBrushType('crayon')}
             >
               <Ionicons name="brush" size={20} color={brushType === 'crayon' ? primaryColor : textSecondary} />
             </TouchableOpacity>
             <TouchableOpacity
               style={[
                 styles.brushTypeBtn,
                 brushType === 'eraser' && styles.brushTypeBtnActive
               ]}
               onPress={() => setBrushType('eraser')}
             >
               <Ionicons name="trash" size={20} color={brushType === 'eraser' ? primaryColor : textSecondary} />
             </TouchableOpacity>
           </View>
           {/* Undo/Redo Buttons */}
           <View style={styles.undoRedoContainer}>
             <TouchableOpacity
               style={[
                 styles.undoRedoBtn,
                 !pointsHistory.length && styles.undoRedoBtnDisabled
               ]}
               onPress={undo}
               activeOpacity={0.7}
             >
               <Ionicons name="arrow-undo" size={20} color={pointsHistory.length ? primaryColor : '#ccc'} />
             </TouchableOpacity>
             <TouchableOpacity
               style={[
                 styles.undoRedoBtn,
                 !futurePoints.length && styles.undoRedoBtnDisabled
               ]}
               onPress={redo}
               activeOpacity={0.7}
             >
               <Ionicons name="arrow-redo" size={20} color={futurePoints.length ? primaryColor : '#ccc'} />
             </TouchableOpacity>
           </View>
           {/* Brush Size Selector */}
           <View style={styles.brushSizeSelector}>
             <Text style={styles.brushSizeLabel}>Size:</Text>
             <View style={styles.brushSizeRow}>
               {[8, 15, 25, 35].map((size) => (
                 <TouchableOpacity
                   key={size}
                   style={[
                     styles.brushSizeBtn,
                     brushSize === size && styles.brushSizeBtnActive
                   ]}
                   onPress={() => setBrushSize(size)}
                 >
                   <View style={{ width: size, height: size, borderRadius: size/2, backgroundColor: selectedColor }} />
                 </TouchableOpacity>
               ))}
             </View>
           </View>
           {/* Save/Export Button */}
           <TouchableOpacity
             style={styles.headerButton}
             onPress={() => setShowSaveOptions(true)}
           >
             <Ionicons name="share" size={20} color={textColor} />
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
   brushTypeSelector: {
     flexDirection: 'row',
     justifyContent: 'center',
     gap: 8,
     paddingVertical: 8,
   },
   brushTypeBtn: {
     width: 36,
     height: 36,
     borderRadius: 18,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: 'rgba(0,0,0,0.1)',
   },
   brushTypeBtnActive: {
     borderWidth: 2,
     borderColor: '#000',
   },
   undoRedoContainer: {
     flexDirection: 'row',
     gap: 8,
   },
   undoRedoBtn: {
     width: 36,
     height: 36,
     borderRadius: 18,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: 'rgba(0,0,0,0.1)',
   },
   undoRedoBtnDisabled: {
     opacity: 0.5,
   },
   brushSizeSelector: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 12,
     paddingVertical: 8,
   },
   brushSizeLabel: {
     fontSize: 14,
     fontWeight: '600',
   },
   brushSizeRow: {
     flexDirection: 'row',
   },
   brushSizeBtn: {
     width: 30,
     height: 30,
     borderRadius: 15,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: 'rgba(0,0,0,0.1)',
   },
   brushSizeBtnActive: {
     borderWidth: 2,
     borderColor: '#000',
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
   // Modal styles
   modalContainer: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0,0,0,0.5)',
     justifyContent: 'center',
     alignItems: 'center',
   },
    modalHidden: {
      display: 'none',
    },
    modalContent: {
      width: '80%',
      backgroundColor: '#fff',
     borderRadius: 16,
     padding: 24,
   },
   modalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 20,
   },
   modalTitle: {
     fontSize: 20,
     fontWeight: '600',
   },
   modalBody: {
     gap: 16,
   },
   modalButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#f0f0f0',
     borderRadius: 12,
     padding: 16,
   },
   modalButtonText: {
     marginLeft: 12,
     fontSize: 16,
     fontWeight: '500',
   },
});
