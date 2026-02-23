#!/usr/bin/env bash
# Helper to start Expo with EXPO_PUBLIC_CONTENT_API set to your dev machine IP
# Usage: ./start-expo.sh

IP="172.20.168.60"
PORT=4000

echo "Starting Expo with EXPO_PUBLIC_CONTENT_API=http://$IP:$PORT"
EXPO_PUBLIC_CONTENT_API="http://$IP:$PORT" npx expo start
