#!/usr/bin/env bash

# ==============================================================================
# Dosebox Mobile - iOS Simulator & Device Screenshot Capture Tool
# ==============================================================================
# Usage:
#   cd mobile
#   ./capture_ios_screenshots.sh [optional_screenshot_name]
#
# Examples:
#   ./capture_ios_screenshots.sh ios_home_screen
#   ./capture_ios_screenshots.sh ios_medication_list
#   ./capture_ios_screenshots.sh ios_prescription_upload
# ==============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_DIR="$SCRIPT_DIR/screenshots/ios"
mkdir -p "$OUTPUT_DIR"

# 1. Check if xcrun / simctl is installed
if ! command -v xcrun &> /dev/null; then
    echo "❌ Error: Xcode command line tools ('xcrun') were not found."
    echo "   Please make sure Xcode and Xcode Command Line Tools are installed on your Mac."
    exit 1
fi

# 2. Check for booted iOS Simulators
BOOTED_SIMULATOR=$(xcrun simctl list devices | grep "Booted" | head -n 1)

if [ -z "$BOOTED_SIMULATOR" ]; then
    echo "⚠️  No booted iOS Simulator found!"
    echo "👉 Please launch your iOS Simulator from Xcode or run:"
    echo "   open -a Simulator"
    echo ""
    echo "   Once your iOS app is running in the Simulator, run this script again:"
    echo "   ./capture_ios_screenshots.sh ios_home_screen"
    exit 1
fi

SIM_NAME=$(echo "$BOOTED_SIMULATOR" | sed -E 's/^[[:space:]]*//; s/\(Booted\)//' | xargs)
echo "📱 Target iOS Simulator: $SIM_NAME"

# 3. Determine output filename
NAME="${1:-ios_screenshot_$(date +%Y%m%d_%H%M%S)}"
FILE_PATH="$OUTPUT_DIR/${NAME}.png"

# 4. Capture screenshot via xcrun simctl
echo "📸 Capturing live screen from iOS Simulator..."
xcrun simctl io booted screenshot "$FILE_PATH" > /dev/null 2>&1

# 5. Verify & Display Output
if [ -f "$FILE_PATH" ]; then
    # Optional: ensure standard PNG format & optimize
    sips -s format png "$FILE_PATH" --out "$FILE_PATH" > /dev/null 2>&1
    
    # Get image dimensions using sips
    DIMENSIONS=$(sips -g pixelWidth -g pixelHeight "$FILE_PATH" | awk '/pixel/ {print $2}' | tr '\n' 'x' | sed 's/x$/\n/')
    
    echo "✅ iOS Screenshot successfully captured & saved!"
    echo "   📄 File: $(basename "$FILE_PATH")"
    echo "   📐 Resolution: ${DIMENSIONS}"
    echo "   📁 Location: $FILE_PATH"
else
    echo "❌ Failed to capture screenshot from iOS Simulator."
    exit 1
fi
