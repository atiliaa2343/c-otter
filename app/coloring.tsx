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
  Alert,
  Animated
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "../hooks/useThemeColor";
const DoughnutBlurb1Image = require("../assets/images/Doughnut's Jam final pg 1 blurb1.jpg");
const DoughnutPg1Image = require("../assets/images/Doughnut's Jam final pg 1.jpg");
const DoughnutPg2Image = require("../assets/images/Doughnut's Jam final pg2.jpg");
const DoughnutPg3Image = require("../assets/images/Doughnut's Jam final pg3.jpg");
const DoughnutPg4Image = require("../assets/images/Doughnut's Jam final pg4.jpg");
const MuralBorder = require("../assets/images/mural-border.png");
const PigmentImage = require("../assets/images/pigment.png");
const CraterQR = require("../assets/images/Crater Webpage QR.png");

const getColoringImage = (idx: number) => {
  if (idx === 2) return DoughnutBlurb1Image;
  if (idx === 3) return DoughnutPg1Image;
  if (idx === 4) return DoughnutPg2Image;
  if (idx === 5) return DoughnutPg3Image;
  if (idx === 6) return DoughnutPg4Image;
  return DoughnutBlurb1Image;
};
const COLOR_PALETTE = [
  '#f5c07a', '#f0956a', '#e8664a', '#e05a3a',
  '#d4c050', '#8a9060', '#c82020', '#9e1010', '#7a4a8a',
];
const SLIDER_MIN_SIZE = 8;
const SLIDER_MAX_SIZE = 35;
const SCREEN_BACKGROUND = '#1c1c1e';
const CANVAS_BACKGROUND = '#DEB887';
const CANVAS_BORDER = '#111111';
const ACTIVE_TOOL_COLOR = '#7b5fe5';
const SLIDER_TRACK_COLOR = 'transparent';
const SLIDER_THUMB_COLOR = 'transparent';
export default function ColoringPage() {
  const [pageIndex, setPageIndex] = useState(0); // 0: title, 1: index, 2-6: coloring pages (5 total)
  const [selectedIndex, setSelectedIndex] = useState(1); // Tracks which coloring page is selected on index (1-5)
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [brushSize, setBrushSize] = useState(20);
  const [brushType, setBrushType] = useState<'marker' | 'pencil' | 'crayon' | 'eraser'>('marker'); // marker, pencil, crayon, eraser
  const [points, setPoints] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [futurePoints, setFuturePoints] = useState<any[]>([]);
  const [textValue, setTextValue] = useState('');
  const [isPaletteExpanded, setIsPaletteExpanded] = useState(true); // Track if color palette is expanded
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  // Animation values for book opening
  const bookOpenAnim = useRef(new Animated.Value(0)).current;
  const pageFlipAnim = useRef(new Animated.Value(0)).current;
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

  // Handle double tap to navigate pages
  const handleDoubleTap = () => {
    if (pageIndex >= 2 && pageIndex <= 6) {
      // If on last coloring page, go to the final QR page
      if (pageIndex === 6) {
        setPageIndex(7);
      } else {
        // Otherwise go to next page
        setPageIndex(pageIndex + 1);
      }
    } else if (pageIndex === 7) {
      // From the QR/resources page, go back to the cover
      setPageIndex(0);
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

  const handleCanvasLongPress = () => {
    setShowSaveOptions(true);
  };

  const openBook = () => {
    setIsBookOpen(true);
    Animated.timing(bookOpenAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setPageIndex(1);
    });
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

  const lastTapRef = useRef<number | null>(null);
  const handleDrawingPress = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current < 300) {
      handleDoubleTap();
    }
    lastTapRef.current = now;
  };

  const handleSliderPress = useCallback((locationX: number) => {
    if (sliderWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / sliderWidth));
    const size = Math.round(SLIDER_MIN_SIZE + ratio * (SLIDER_MAX_SIZE - SLIDER_MIN_SIZE));
    setBrushSize(size);
  }, [sliderWidth]);

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
      // Title page - book cover design
      const bookCoverRotate = bookOpenAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-15deg'],
      });
      const bookCoverScale = bookOpenAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.9],
      });
      const pageFlipRotate = pageFlipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-180deg'],
      });
      return (
        <View style={styles.bookContainer}>
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backButton, { top: 50, left: 20 }]}
            onPress={() => {
              // Navigate back to home or previous screen
              // You may need to use router.back() if using expo-router
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#000" />
          </TouchableOpacity>
          {/* Book spine */}
          <View style={styles.bookSpine} />
          {/* Book cover */}
          <Animated.View
            style={[
              styles.bookCover,
              {
                transform: [
                  { rotate: bookCoverRotate },
                  { scale: bookCoverScale },
                ],
              },
            ]}
          >
            {/* Cover design */}
            <View style={styles.coverDesign}>
              <View style={styles.coverBorder}>
                <View style={styles.coverInner}>
                  {/* Decorative elements */}
                  <View style={styles.coverCornerTopLeft} />
                  <View style={styles.coverCornerTopRight} />
                  <View style={styles.coverCornerBottomLeft} />
                  <View style={styles.coverCornerBottomRight} />
                  {/* Title */}
                  <Text style={styles.coverTitle}>Doughnut's Jam</Text>
                  <Text style={styles.coverSubtitle}>Coloring Book</Text>
                  {/* Decorative donut icon */}
                  <View style={styles.coverIcon}>
                    <View style={styles.donutOuter} />
                    <View style={styles.donutInner} />
                  </View>
                  {/* Tap to open instruction */}
                  <TouchableOpacity
                    style={styles.tapToOpen}
                    onPress={openBook}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tapToOpenText}>Tap to Open</Text>
                    <Ionicons name="book" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
          {/* Page flip animation overlay */}
          <Animated.View
            style={[
              styles.pageFlipOverlay,
              {
                transform: [{ rotateY: pageFlipRotate }],
                opacity: pageFlipAnim,
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.pageFlipContent} />
          </Animated.View>
        </View>
      );
    }
    if (pageIndex === 1) {
      // Index page with clickable numbers 1-5 - book page style
      return (
        <View style={[styles.bookPageContainer, { backgroundColor: '#DEB887' }]}>
          {/* Index content */}
          <View style={[styles.indexPage, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.indexTitle, { color: '#000' }]}>Table of Contents</Text>
           <View style={styles.indexNumbers}>
             {[1, 2, 3, 4, 5, 6].map((num) => (
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
                 <Text style={[styles.indexNumberText, { color: '#000' }]}>
                   {num}
                 </Text>
               </TouchableOpacity>
             ))}
           </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setPageIndex(0)}
          >
            <Ionicons name="chevron-back" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      );
    }
     // Coloring pages (indices 2-6)
     if (pageIndex >= 2 && pageIndex <= 6) {
       return (
       <>
         <View style={styles.screen}>
<View style={styles.topNav}>
              <View style={styles.navGroup}>
                <TouchableOpacity style={styles.navButton} onPress={() => setPageIndex(1)} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

           <View style={styles.canvasWrapper}>
             <View style={styles.canvas}>
               <Image
                 source={getColoringImage(pageIndex)}
                 style={[styles.canvasImage, (pageIndex >= 2 && pageIndex <= 6) && ({ filter: [{ brightness: 2 }, { saturate: 0 }] } as any)]}
                 resizeMode="contain"
               />
               {pageIndex === 2 && (
                 <View style={[styles.textOverlayBox, { top: '48%', left: '8%', right: '18%' }]} pointerEvents="none">
                   <Text style={styles.textOverlayText}>
                     {"Doughnut Sinclair is a Jolly Jelly new hire, passionate about the fruity deliciousness of jelly. She is tasked with developing a new Jolly Jellicious recipe. Pressure from her supervisor makes her question how far her positivity and work ethic can take her in the jelly-making world."}
                   </Text>
                 </View>
               )}
               {pageIndex === 3 && (
                 <>
                   <View style={[styles.textOverlayBox, { top: '7%', left: '20%', right: '54.5%', backgroundColor: '#fff' , borderRadius: 24}]} pointerEvents="none">
                     <Text style={[styles.textOverlayText, { fontSize: 9.5 }]}>{"I don't know why they hired you! Now I'm stuck with your stupid ideas."}</Text>
                   </View>
                   <View style={[styles.textOverlayBox, { bottom: '3%', right: '8%', backgroundColor: '#fff' }]} pointerEvents="none">
                     <Text style={styles.textOverlayText}>Mr. Toast is fussing at me again!</Text>
                   </View>
                 </>
               )}
               {pageIndex === 4 && (
                 <>
                   <View style={[styles.textOverlayBox, { top: 3, left: 5, right: 5 }]} pointerEvents="none">
                     <Text style={[styles.textOverlayText, { textAlign: 'center' },{ fontSize: 8 }]}>I don't know if she has a problem with my</Text>
                   </View>
                   <View style={[styles.textOverlayBox, { bottom: 0.5, left: 5, right: 5 }]} pointerEvents="none">
                     <Text style={[styles.textOverlayText, { textAlign: 'center' }, { fontSize: 8 }]}>recipe or if she just doesn't like me</Text>
                   </View>
                 </>
               )}
               {pageIndex === 5 && (
                 <>
                   <View style={[styles.textOverlayBox, { top: 5, right: 5 }]} pointerEvents="none">
                     <Text style={styles.textOverlayText}>{"however...\nMy passion for jelly"}</Text>
                   </View>
                   <View style={[styles.textOverlayBox, { bottom: 5, left: 5 }]} pointerEvents="none">
                     <Text style={styles.textOverlayText}>{"obliterates the bitter\ntaste of inferiority"}</Text>
                   </View>
                 </>
               )}
               {pageIndex === 6 && (
                 <>
                   <View style={[styles.textOverlayBox, { top: 5, left: 5, right: 5 }]} pointerEvents="none">
                     <Text style={[styles.textOverlayText, { textAlign: 'center' }]}>with the overwhelming positivity from my jelly love</Text>
                   </View>
                   <View style={[styles.textOverlayBox, { bottom: 5, left: 5, right: 5 }]} pointerEvents="none">
                     <Text style={[styles.textOverlayText, { textAlign: 'center' }]}>I Can overcome anything!!!</Text>
                   </View>
                 </>
               )}
               <View style={styles.drawingContainer} {...panResponder.panHandlers} onStartShouldSetResponder={() => true}>
                 {points.map((point, index) => {
                   if (point.type === 'eraser') return null;
                   const pointStyle = {
                     position: 'absolute' as const,
                     left: point.x - point.size / 2,
                     top: point.y - point.size / 2,
                     width: point.size,
                     height: point.size,
                     backgroundColor: point.color,
                     borderRadius: point.size / 2,
                     opacity: 0.9,
                   };
                   return (
                     <View
                       key={index.toString()}
                       style={[styles.drawPoint, pointStyle]}
                       pointerEvents="none"
                     />
                   );
                 })}
                 <TouchableOpacity
                   style={StyleSheet.absoluteFillObject}
                   onLongPress={handleCanvasLongPress}
                 />
               </View>
             </View>
           </View>

           <Text style={styles.pageNumber}>Page {pageIndex - 1} of 5</Text>

           {isPaletteExpanded && (
             <View style={styles.paletteRowContainer}>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScrollContent}>
                 {COLOR_PALETTE.map((item) => (
                   <TouchableOpacity
                     key={item}
                     style={[
                       styles.colorItemBottom,
                       { backgroundColor: item },
                       selectedColor === item && styles.colorItemSelectedBottom,
                     ]}
                     onPress={() => setSelectedColor(item)}
                   >
                     {selectedColor === item && <View style={styles.colorSelectedDot} />}
                   </TouchableOpacity>
                 ))}
               </ScrollView>
             </View>
           )}

<View style={styles.bottomToolbar}>
              <TouchableOpacity
                style={[styles.toolButton, isPaletteExpanded && styles.toolButtonActive]}
                onPress={() => setIsPaletteExpanded((prev) => !prev)}
              >
                <Ionicons name="color-palette" size={24} color={isPaletteExpanded ? ACTIVE_TOOL_COLOR : '#000'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolButton, brushType === 'marker' && styles.toolButtonActive]}
                onPress={() => setBrushType('marker')}
                activeOpacity={0.7}
              >
                <Ionicons name="color-fill" size={24} color={brushType === 'marker' ? ACTIVE_TOOL_COLOR : '#000'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolButton, brushType === 'pencil' && styles.toolButtonActive]}
                onPress={() => setBrushType('pencil')}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={24} color={brushType === 'pencil' ? ACTIVE_TOOL_COLOR : '#000'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolButton, brushType === 'eraser' && styles.toolButtonActive]}
                onPress={() => setBrushType('eraser')}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={24} color={brushType === 'eraser' ? ACTIVE_TOOL_COLOR : '#000'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolButton} onPress={() => setShowSaveOptions(true)}>
                <Ionicons name="settings-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
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
      </>
    );
  }

  if (pageIndex === 7) {
    return (
      <View style={[styles.qrPageContainer, { backgroundColor: '#DEB887' }]}>
        <View style={styles.qrContent}>
          <Text style={[styles.qrTitle, { color: '#000' }]}>Virginia Department of Health</Text>
          <Image source={CraterQR} style={styles.qrImage} resizeMode="contain" />
        </View>
        <TouchableOpacity
          style={[styles.backButton, { top: 50 }]}
          onPress={() => setPageIndex(1)}
        >
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
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
   // Book container and cover styles
   bookContainer: {
     flex: 1,
     backgroundColor: '#DEB887',
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
   },
   bookSpine: {
     position: 'absolute',
     left: 15,
     top: 20,
     bottom: 20,
     width: 8,
     backgroundColor: '#8B4513',
     borderRadius: 4,
     shadowOffset: { width: -2, height: 0 },
     shadowOpacity: 0.3,
   },
   bookCover: {
     width: '85%',
     aspectRatio: 0.75,
     backgroundColor: '#8B4513',
     borderRadius: 8,
     shadowOffset: { width: 4, height: 8 },
     shadowOpacity: 0.4,
     shadowRadius: 12,
     elevation: 10,
   },
   coverDesign: {
     flex: 1,
     margin: 12,
     backgroundColor: '#DEB887',
     borderRadius: 6,
  },
  coverBorder: {
    flex: 1,
    margin: 8,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    backgroundColor: '#F5DEB3',
  },
  coverInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  coverCornerTopLeft: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  coverCornerTopRight: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  coverCornerBottomLeft: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  coverCornerBottomRight: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  coverTitle: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  coverSubtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#A0522D',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  coverIcon: {
    width: 100,
    height: 100,
    marginBottom: 40,
    position: 'relative',
  },
  donutOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B6B',
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  donutInner: {
    position: 'absolute',
    top: 25,
    left: 25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5DEB3',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  tapToOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  tapToOpenText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  pageFlipOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    backfaceVisibility: 'hidden',
  },
  pageFlipContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Book page styles for coloring pages
  bookPageContainer: {
    backgroundColor: '#000',
    flex: 1,
    position: 'relative',
  },
  pageEdgeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 15,
    backgroundColor: '#00000008', // 5% black opacity
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
  },
  pageEdgeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 15,
    backgroundColor: '#00000008', // 5% black opacity
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
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
   canvasImage: {
     width: '100%',
     height: '100%',
     resizeMode: 'contain',
     borderRadius: 10,
     backgroundColor: '#fff',
   },
   screen: {
     flex: 1,
     backgroundColor: '#DEB887',
   },
   topNav: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 14,
     backgroundColor: '#DEB887',
   },
   navGroup: {
     flexDirection: 'row',
     gap: 12,
   },
navButton: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.08)',
    },
headerTitle: {
      position: 'absolute',
      left: 0,
      right: 0,
      fontSize: 20,
      fontWeight: '600',
      color: '#000',
      textAlign: 'center',
    },
   canvasWrapper: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     paddingVertical: 12,
   },
   canvas: {
     width: '90%',
     aspectRatio: 0.95,
     backgroundColor: CANVAS_BACKGROUND,
     borderWidth: 3,
     borderColor: CANVAS_BORDER,
     borderRadius: 18,
     overflow: 'hidden',
     justifyContent: 'center',
     alignItems: 'center',
   },
   drawingContainer: {
     ...StyleSheet.absoluteFillObject,
   },
   sliderContainer: {
     paddingHorizontal: 20,
     paddingVertical: 12,
   },
   sliderTrackContainer: {
     height: 32,
     justifyContent: 'center',
   },
   sliderTrack: {
     width: '100%',
     height: 6,
     borderRadius: 3,
     backgroundColor: SLIDER_TRACK_COLOR,
     overflow: 'hidden',
     display: 'none',
   },
   sliderThumb: {
     position: 'absolute',
     top: -8,
     width: 20,
     height: 20,
     borderRadius: 10,
     backgroundColor: SLIDER_THUMB_COLOR,
     borderWidth: 2,
     borderColor: '#fff',
     display: 'none',
   },
   pageNumber: {
     textAlign: 'center',
     fontSize: 13,
     color: '#000',
     paddingVertical: 4,
   },
   paletteRowContainer: {
     paddingVertical: 10,
   },
bottomToolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: '#DEB887',
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.08)',
    },
    toolButton: {
      width: 52,
      height: 52,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
   toolButtonActive: {
     backgroundColor: 'rgba(123,95,229,0.18)',
   },
   navArrowButton: {
     flex: 1,
     marginHorizontal: 4,
   },
   colorSelectedDot: {
     width: 12,
     height: 12,
     borderRadius: 6,
     backgroundColor: '#fff',
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
      color: '#ffffff',
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
     borderColor: '#000000',
     alignItems: 'center',
     justifyContent: 'center',
   },
   indexNumberBtnActive: {
     borderColor: '#000000',
     backgroundColor: '#00000015',
   },
   indexNumberText: {
     fontSize: 20,
     fontWeight: '600',
     color: '#ffffff',
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
   paletteScrollContent: {
     alignItems: 'center',
     gap: 10,
     paddingHorizontal: 4,
   },
   colorItemBottom: {
     width: 42,
     height: 42,
     borderRadius: 21,
     justifyContent: 'center',
     alignItems: 'center',
     marginHorizontal: 4,
     borderWidth: 1.5,
     borderColor: 'rgba(0,0,0,0.1)',
   },
   colorItemSelectedBottom: {
     borderColor: 'rgba(0,0,0,0.1)',
     borderWidth: 2,
   },
  // QR / Resources page styles
  qrPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CANVAS_BACKGROUND,
  },
  qrContent: {
    width: '90%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrImage: {
    width: 220,
    height: 220,
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
     backgroundColor: '#00000008', // 5% black opacity
     borderRadius: 12,
     padding: 16,
   },
   modalButtonText: {
     marginLeft: 12,
     fontSize: 16,
     fontWeight: '500',
   },
   textOverlayBox: {
     position: 'absolute',
     backgroundColor: '#ffffff',
     borderRadius: 4,
     padding: 6,
     zIndex: 10,
   },
   textOverlayText: {
     fontSize: 11,
     color: '#333',
     fontStyle: 'italic',
   },
});
