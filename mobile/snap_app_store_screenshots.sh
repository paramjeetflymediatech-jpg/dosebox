#!/usr/bin/env bash

# ==============================================================================
# Interactive App Store Screenshot Capture Tool (Press ENTER to capture!)
# ==============================================================================
# Usage:
#   cd mobile
#   ./snap_app_store_screenshots.sh
#
# How it works:
#   1. Navigate your app in the Simulator to any screen you like.
#   2. Press ENTER in your terminal.
#   3. The script instantly captures live screens from both booted iPhone & iPad,
#      removes transparency/alpha channels, and formats them to App Store specs!
#   4. Press 'q' then ENTER to finish.
# ==============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_BASE="$SCRIPT_DIR/screenshots/app_store"

IPHONE_DIR="$OUTPUT_BASE/iphone_6_7_portrait"
IPAD_DIR="$OUTPUT_BASE/ipad_13_portrait"

mkdir -p "$IPHONE_DIR" "$IPAD_DIR"

IPHONE_SIM_ID="73D329E5-D906-4D0B-9D16-3AE8677764A0"
IPAD_SIM_ID="26042103-5B1B-4FD0-8DEB-9DD867513907"

# Function to resize and format image (strip alpha channel)
format_image() {
    local src="$1"
    local dest="$2"
    local width="$3"
    local height="$4"

    sips -z "$height" "$width" "$src" --out "$dest" > /dev/null 2>&1
    sips -s format png -s formatOptions default --deleteColorManagementProperties "$dest" > /dev/null 2>&1

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

echo "====================================================================="
echo "📸 Interactive App Store Screenshot Capture Mode"
echo "====================================================================="
echo "👉 Navigate your app on the Simulator to any screen."
echo "👉 Press [ENTER] in this terminal to capture the screen for iPhone & iPad."
echo "👉 Type 'q' and press [ENTER] to quit."
echo "====================================================================="
echo ""

COUNTER=1

while true; do
    printf "Press [ENTER] to capture screenshot #%02d (or 'q' to exit): " "$COUNTER"
    read -r input

    if [[ "$input" == "q" || "$input" == "Q" ]]; then
        echo ""
        echo "👋 Done capturing screenshots. Your formatted images are in:"
        echo "   📁 iPhone: $IPHONE_DIR"
        echo "   📁 iPad:   $IPAD_DIR"
        exit 0
    fi

    NAME=$(printf "shot_%02d" "$COUNTER")
    RAW_IPHONE="$OUTPUT_BASE/raw_snap_iphone.png"
    RAW_IPAD="$OUTPUT_BASE/raw_snap_ipad.png"

    # Capture from booted simulators
    xcrun simctl io "$IPHONE_SIM_ID" screenshot "$RAW_IPHONE" > /dev/null 2>&1 || true
    xcrun simctl io "$IPAD_SIM_ID" screenshot "$RAW_IPAD" > /dev/null 2>&1 || true

    DEST_IPHONE="$IPHONE_DIR/${NAME}_1284x2778.png"
    DEST_IPAD="$IPAD_DIR/${NAME}_2048x2732.png"

    if [ -f "$RAW_IPHONE" ]; then
        format_image "$RAW_IPHONE" "$DEST_IPHONE" 1284 2778
        rm -f "$RAW_IPHONE"
    fi

    if [ -f "$RAW_IPAD" ]; then
        format_image "$RAW_IPAD" "$DEST_IPAD" 2048 2732
        rm -f "$RAW_IPAD"
    fi

    echo "  ✅ Captured Screenshot #$COUNTER!"
    echo "     - iPhone (1284x2778): ${NAME}_1284x2778.png"
    echo "     - iPad   (2048x2732): ${NAME}_2048x2732.png"
    echo ""

    COUNTER=$((COUNTER + 1))
done
