#!/usr/bin/env bash

# ==============================================================================
# Dosebox Mobile - Emulator & Device Screenshot Capture Tool
# ==============================================================================
# Usage:
#   cd mobile
#   ./capture_screenshots.sh [optional_screenshot_name]
#
# Examples:
#   ./capture_screenshots.sh home_screen
#   ./capture_screenshots.sh medication_list
#   ./capture_screenshots.sh prescription_upload
# ==============================================================================

export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_DIR="$SCRIPT_DIR/screenshots"
mkdir -p "$OUTPUT_DIR"

# 1. Check if ADB is installed
if ! command -v adb &> /dev/null; then
    echo "❌ Error: ADB command line tool was not found."
    echo "   Expected location: $HOME/Library/Android/sdk/platform-tools/adb"
    exit 1
fi

# 2. Check for running devices/emulators
DEVICES=($(adb devices | grep -v "List" | grep "device" | awk '{print $1}'))

if [ ${#DEVICES[@]} -eq 0 ]; then
    echo "⚠️  No active Android Emulator or Device found!"
    echo "👉 Please launch your Android Emulator from Android Studio or VS Code."
    echo "   Once your app screen is open in the emulator, run this script again:"
    echo "   ./capture_screenshots.sh home_screen"
    exit 1
fi

# Select the first available device/emulator
TARGET_DEVICE="${DEVICES[0]}"
echo "📱 Target Device/Emulator: $TARGET_DEVICE"

# 3. Determine output filename
NAME="${1:-screenshot_$(date +%Y%m%d_%H%M%S)}"
FILE_PATH="$OUTPUT_DIR/${NAME}.png"

# 4. Capture screenshot via ADB
echo "📸 Capturing live screen from emulator..."
adb -s "$TARGET_DEVICE" shell screencap -p /sdcard/temp_playstore_screenshot.png
adb -s "$TARGET_DEVICE" pull /sdcard/temp_playstore_screenshot.png "$FILE_PATH" > /dev/null 2>&1
adb -s "$TARGET_DEVICE" shell rm /sdcard/temp_playstore_screenshot.png

# 5. Verify & Optimize PNG
if [ -f "$FILE_PATH" ]; then
    sips -s format png "$FILE_PATH" --out "$FILE_PATH" > /dev/null 2>&1
    echo "✅ Screenshot successfully captured & saved!"
    echo "   📄 Location: $FILE_PATH"
    echo "   📁 Directory: $OUTPUT_DIR"
else
    echo "❌ Failed to pull screenshot from emulator."
    exit 1
fi
