#!/usr/bin/env bash

# ==============================================================================
# Dosebox Mobile - App Store Screenshot Capture & Formatter Tool
# ==============================================================================
# Usage:
#   cd mobile
#   ./capture_app_store_screenshots.sh [screenshot_name] [optional_image_path]
#
# Examples:
#   1. Capture live screenshot from active booted iOS Simulator:
#      ./capture_app_store_screenshots.sh 01_home_screen
#      ./capture_app_store_screenshots.sh 02_medications
#
#   2. Process/format an existing screenshot file for App Store Connect specs:
#      ./capture_app_store_screenshots.sh 01_home_screen ./path/to/my_screenshot.png
# ==============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_BASE_DIR="$SCRIPT_DIR/screenshots/app_store"

IPHONE_PORTRAIT_DIR="$OUTPUT_BASE_DIR/iphone_6_7_portrait"
IPHONE_LANDSCAPE_DIR="$OUTPUT_BASE_DIR/iphone_6_7_landscape"
IPAD_PORTRAIT_DIR="$OUTPUT_BASE_DIR/ipad_13_portrait"
IPAD_LANDSCAPE_DIR="$OUTPUT_BASE_DIR/ipad_13_landscape"

mkdir -p "$IPHONE_PORTRAIT_DIR" "$IPHONE_LANDSCAPE_DIR" "$IPAD_PORTRAIT_DIR" "$IPAD_LANDSCAPE_DIR"

NAME="${1:-screenshot_$(date +%Y%m%d_%H%M%S)}"
INPUT_FILE="$2"
RAW_FILE=""

if [ -n "$INPUT_FILE" ]; then
    if [ ! -f "$INPUT_FILE" ]; then
        echo "❌ Error: File not found at '$INPUT_FILE'"
        exit 1
    fi
    echo "📁 Using provided screenshot: $INPUT_FILE"
    RAW_FILE="$INPUT_FILE"
else
    # Check if xcrun is installed
    if ! command -v xcrun &> /dev/null; then
        echo "❌ Error: Xcode command line tools ('xcrun') were not found."
        exit 1
    fi

    # Find booted simulator
    BOOTED_SIMULATOR=$(xcrun simctl list devices | grep "Booted" | head -n 1)

    if [ -z "$BOOTED_SIMULATOR" ]; then
        echo "⚠️  No booted iOS Simulator found!"
        echo "👉 Please open your Simulator or run: open -a Simulator"
        exit 1
    fi

    SIM_NAME=$(echo "$BOOTED_SIMULATOR" | sed -E 's/^[[:space:]]*//; s/\(Booted\)//' | xargs)
    echo "📱 Capturing live screen from booted Simulator: $SIM_NAME..."

    RAW_FILE="$OUTPUT_BASE_DIR/raw_${NAME}.png"
    xcrun simctl io booted screenshot "$RAW_FILE"
fi

echo "⚙️ Processing App Store screenshots for '$NAME'..."

# Function to resize and strip alpha/transparency using sips
format_screenshot() {
    local src="$1"
    local dest="$2"
    local width="$3"
    local height="$4"

    # Copy src to dest
    cp "$src" "$dest"

    # Resize using sips
    sips -z "$height" "$width" "$dest" > /dev/null 2>&1
    sips -s format png -s formatOptions default --deleteColorManagementProperties "$dest" > /dev/null 2>&1

    # Remove alpha channel via swift if present
    swift - << EOF > /dev/null 2>&1
import AppKit

let path = "$dest"
guard let image = NSImage(contentsOfFile: path),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(0) }

let colorSpace = CGColorSpaceCreateDeviceRGB()
let context = CGContext(
    data: nil, width: $width, height: $height,
    bitsPerComponent: 8, bytesPerRow: $width * 4,
    space: colorSpace, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
)

context?.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
context?.fill(CGRect(x: 0, y: 0, width: $width, height: $height))
context?.draw(cgImage, in: CGRect(x: 0, y: 0, width: $width, height: $height))

if let newCgImage = context?.makeImage() {
    let newRep = NSBitmapImageRep(cgImage: newCgImage)
    if let data = newRep.representation(using: .png, properties: [:]) {
        try? data.write(to: URL(fileURLWithPath: path))
    }
}
EOF
}

# 1. iPhone 6.7" / 6.5" Portrait (1284 x 2778)
OUT_IPHONE_P="$IPHONE_PORTRAIT_DIR/${NAME}_1284x2778.png"
format_screenshot "$RAW_FILE" "$OUT_IPHONE_P" 1284 2778
echo "  ✅ iPhone Portrait (1284 × 2778 px): $OUT_IPHONE_P"

# 2. iPhone 6.7" / 6.5" Landscape (2778 x 1284)
OUT_IPHONE_L="$IPHONE_LANDSCAPE_DIR/${NAME}_2778x1284.png"
format_screenshot "$RAW_FILE" "$OUT_IPHONE_L" 2778 1284
echo "  ✅ iPhone Landscape (2778 × 1284 px): $OUT_IPHONE_L"

# 3. iPad 13" Portrait (2048 x 2732)
OUT_IPAD_P="$IPAD_PORTRAIT_DIR/${NAME}_2048x2732.png"
format_screenshot "$RAW_FILE" "$OUT_IPAD_P" 2048 2732
echo "  ✅ iPad Portrait (2048 × 2732 px): $OUT_IPAD_P"

# 4. iPad 13" Landscape (2732 x 2048)
OUT_IPAD_L="$IPAD_LANDSCAPE_DIR/${NAME}_2732x2048.png"
format_screenshot "$RAW_FILE" "$OUT_IPAD_L" 2732 2048
echo "  ✅ iPad Landscape (2732 × 2048 px): $OUT_IPAD_L"

# Clean up raw file if captured temporarily
if [ -z "$INPUT_FILE" ] && [ -f "$RAW_FILE" ]; then
    rm -f "$RAW_FILE"
fi

echo ""
echo "🎉 Screenshots formatted successfully for App Store Connect upload!"
