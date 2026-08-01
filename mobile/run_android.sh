#!/usr/bin/env bash
# Script to run Android app on emulator with native C++ TurboModules

export PATH="/opt/homebrew/bin:$HOME/Library/Android/sdk/platform-tools:$PATH"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$SCRIPT_DIR/android"
echo "🔨 Building Debug APK with C++ native TurboModules..."
./gradlew assembleDebug -x lint || exit 1

echo "🔗 Setting ADB reverse port mapping..."
adb reverse tcp:8081 tcp:8081

echo "📲 Installing app on running emulator..."
adb install -r app/build/outputs/apk/debug/app-debug.apk

echo "🚀 Launching Dosebox app..."
adb shell am start -n com.doseboxmobile/.MainActivity
