#!/usr/bin/env bash

# ==============================================================================
# Batch Capture 4 App Store Screenshots for both iPhone & iPad
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

    # Remove alpha via Swift
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

echo "📸 Capturing 4 App Store Screenshots from iPhone 17 Pro Max ($IPHONE_SIM_ID)..."
for i in 1 2 3 4; do
    NAME="screenshot_0${i}"
    RAW_IPHONE="$OUTPUT_BASE/raw_iphone_${i}.png"
    xcrun simctl io "$IPHONE_SIM_ID" screenshot "$RAW_IPHONE"
    
    DEST_IPHONE="$IPHONE_DIR/${NAME}_1284x2778.png"
    format_image "$RAW_IPHONE" "$DEST_IPHONE" 1284 2778
    rm -f "$RAW_IPHONE"
    echo "  ✅ iPhone Screenshot ${i} (1284x2778): $(basename "$DEST_IPHONE")"
done

echo "📸 Capturing 4 App Store Screenshots from iPad Pro 13-inch ($IPAD_SIM_ID)..."
for i in 1 2 3 4; do
    NAME="screenshot_0${i}"
    RAW_IPAD="$OUTPUT_BASE/raw_ipad_${i}.png"
    xcrun simctl io "$IPAD_SIM_ID" screenshot "$RAW_IPAD"
    
    DEST_IPAD="$IPAD_DIR/${NAME}_2048x2732.png"
    format_image "$RAW_IPAD" "$DEST_IPAD" 2048 2732
    rm -f "$RAW_IPAD"
    echo "  ✅ iPad Screenshot ${i} (2048x2732): $(basename "$DEST_IPAD")"
done

echo ""
echo "🎉 All 4 iPhone and 4 iPad screenshots successfully captured & formatted!"
