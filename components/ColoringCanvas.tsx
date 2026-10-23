import React, { useEffect, useReducer, useState } from 'react';
import { PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type BrushType = 'marker' | 'pencil' | 'crayon' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  width: number;
  opacity: number;
  points: Point[];
}

export interface ColoringCanvasProps {
  color: string;
  brushSize: number;
  brushType: BrushType;
  onLongPress?: () => void;
}

/** Ignore finger jitter smaller than this — fewer points, smoother curves. */
const MIN_POINT_DISTANCE = 2;

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * A smooth SVG path through the stroke's points: a quadratic curve between
 * each pair of midpoints, using the touch point as the control point. This
 * rounds off the corners between touch samples instead of joining them
 * with straight segments.
 */
function toPath(points: Point[]): string {
  if (points.length === 0) return '';
  const [first] = points;
  // A tap with no movement still leaves a dot (round line caps draw it).
  if (points.length === 1) return `M ${first.x} ${first.y} L ${first.x + 0.1} ${first.y}`;
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const next = points[i + 1];
    d += ` Q ${p.x} ${p.y} ${(p.x + next.x) / 2} ${(p.y + next.y) / 2}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Removes the parts of every stroke within `radius` of the eraser, splitting
 * a stroke in two where the eraser crosses its middle.
 */
function erase(strokes: Stroke[], at: Point, radius: number): Stroke[] {
  const result: Stroke[] = [];
  for (const stroke of strokes) {
    let run: Point[] = [];
    for (const point of stroke.points) {
      if (distance(point, at) > radius + stroke.width / 2) {
        run.push(point);
      } else if (run.length) {
        result.push({ ...stroke, points: run });
        run = [];
      }
    }
    if (run.length) result.push({ ...stroke, points: run });
  }
  return result;
}

interface Brush {
  color: string;
  brushSize: number;
  brushType: BrushType;
}

interface CanvasState {
  strokes: Stroke[];
  /** The stroke the finger is drawing right now. */
  current: Stroke | null;
  brush: Brush;
}

type CanvasAction =
  | { type: 'brush'; brush: Brush }
  | { type: 'start'; point: Point }
  | { type: 'move'; point: Point }
  | { type: 'end' };

function newStroke({ color, brushSize, brushType }: Brush, point: Point): Stroke {
  // A pencil is a thinner, solid line; a marker is the full size and
  // slightly see-through so the line art shows through.
  return brushType === 'pencil'
    ? { color, width: Math.max(2, brushSize * 0.35), opacity: 1, points: [point] }
    : { color, width: brushSize, opacity: 0.85, points: [point] };
}

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'brush':
      return { ...state, brush: action.brush };
    case 'start':
    case 'move': {
      if (state.brush.brushType === 'eraser') {
        return { ...state, strokes: erase(state.strokes, action.point, state.brush.brushSize) };
      }
      const stroke = state.current;
      if (action.type === 'start' || !stroke) {
        return { ...state, current: newStroke(state.brush, action.point) };
      }
      if (distance(stroke.points[stroke.points.length - 1], action.point) < MIN_POINT_DISTANCE) {
        return state;
      }
      return { ...state, current: { ...stroke, points: [...stroke.points, action.point] } };
    }
    case 'end':
      return state.current
        ? { ...state, strokes: [...state.strokes, state.current], current: null }
        : state;
  }
}

/**
 * The drawable layer over a coloring page. Keeps its own strokes so a
 * finger move only re-renders this layer, not the whole page — remount it
 * (change its `key`) to start a page fresh.
 */
export function ColoringCanvas({ color, brushSize, brushType, onLongPress }: ColoringCanvasProps) {
  const [{ strokes, current }, dispatch] = useReducer(canvasReducer, {
    strokes: [],
    current: null,
    brush: { color, brushSize, brushType },
  });

  useEffect(() => {
    dispatch({ type: 'brush', brush: { color, brushSize, brushType } });
  }, [color, brushSize, brushType]);

  // Created once; `dispatch` is stable, so the handlers never go stale.
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) =>
        dispatch({ type: 'start', point: { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY } }),
      onPanResponderMove: (evt) =>
        dispatch({ type: 'move', point: { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY } }),
      onPanResponderRelease: () => dispatch({ type: 'end' }),
      onPanResponderTerminate: () => dispatch({ type: 'end' }),
    }),
  );

  const all = current ? [...strokes, current] : strokes;

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      {/* pointerEvents none keeps touches (and their locationX/Y) on the container. */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {all.map((stroke, index) => (
          <Path
            key={index}
            d={toPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeOpacity={stroke.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>
      {onLongPress && <TouchableOpacity style={StyleSheet.absoluteFill} onLongPress={onLongPress} />}
    </View>
  );
}
