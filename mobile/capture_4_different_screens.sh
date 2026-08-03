#!/usr/bin/env bash

# ==============================================================================
# Capture 4 Different App Screens for iPhone and iPad App Store Connect
# ==============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_BASE="$SCRIPT_DIR/screenshots/app_store"
NAV_FILE="$SCRIPT_DIR/src/navigation/AppNavigator.js"

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

# Array of 4 distinct routes to display
ROUTES=("Welcome" "Login" "BrowseMedicines" "UploadPrescription")
NAMES=("01_welcome_screen" "02_login_screen" "03_browse_medicines" "04_upload_prescription")

# Backup original AppNavigator.js
cp "$NAV_FILE" "${NAV_FILE}.bak"

cleanup() {
    mv "${NAV_FILE}.bak" "$NAV_FILE"
    echo "🔄 Restored AppNavigator.js to original state."
}
trap cleanup EXIT

for idx in 0 1 2 3; do
    ROUTE="${ROUTES[$idx]}"
    NAME="${NAMES[$idx]}"

    echo ""
    echo "📱 Navigating to screen '$ROUTE' (${idx+1}/4)..."
    
    # Change initialRouteName in AppNavigator.js
    sed -i '' "s/initialRouteName=\"[^\"]*\"/initialRouteName=\"$ROUTE\"/g" "$NAV_FILE"

    # Reload bundle / wait for Metro hot reload to update simulators
    sleep 3

    RAW_IPHONE="$OUTPUT_BASE/raw_iphone_${ROUTE}.png"
    RAW_IPAD="$OUTPUT_BASE/raw_ipad_${ROUTE}.png"

    xcrun simctl io "$IPHONE_SIM_ID" screenshot "$RAW_IPHONE"
    xcrun simctl io "$IPAD_SIM_ID" screenshot "$RAW_IPAD"

    DEST_IPHONE="$IPHONE_DIR/${NAME}_1284x2778.png"
    DEST_IPAD="$IPAD_DIR/${NAME}_2048x2732.png"

    format_image "$RAW_IPHONE" "$DEST_IPHONE" 1284 2778
    format_image "$RAW_IPAD" "$DEST_IPAD" 2048 2732

    rm -f "$RAW_IPHONE" "$RAW_IPAD"

    echo "  ✅ iPhone Screen '${NAME}' (1284x2778): $(basename "$DEST_IPHONE")"
    echo "  ✅ iPad Screen '${NAME}' (2048x2732): $(basename "$DEST_IPAD")"
done

echo ""
echo "🎉 4 Different Screens captured & formatted for iPhone & iPad!"
