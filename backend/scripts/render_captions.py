#!/usr/bin/env python3
"""
render_captions.py — Adapter for caption_overlay from Reel-Generator-Engine.
Takes captions.json and generates high-retention synced karaoke frames and FFmpeg concat manifest.
"""

import sys
import os
import json

# Ensure backend/scripts is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

import caption_overlay

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: render_captions.py <captions_json_path> <output_dir> [asset_path]"}))
        sys.exit(1)

    captions_json_path = sys.argv[1]
    output_dir = sys.argv[2]
    asset_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(SCRIPT_DIR, "../assets/asset.png")
    font_path = os.path.join(SCRIPT_DIR, "../fonts/Futura-Bold.ttf")

    if not os.path.exists(font_path):
        font_path = caption_overlay.DEFAULT_FONT_PATH

    os.makedirs(output_dir, exist_ok=True)

    concat_file, total_dur = caption_overlay.generate_caption_timeline(
        captions_json_path=captions_json_path,
        output_dir=output_dir,
        font_path=font_path,
        font_size=48,
        canvas_width=1080,
        strip_height=240,
        highlight_color="#FF5757"
    )

    caption_y = caption_overlay.compute_caption_vertical_offset(
        asset_path=asset_path,
        asset_scale=45.0,
        asset_bottom_margin=-1.6,
        no_asset=False,
        canvas_width=1080,
        canvas_height=1920,
        strip_height=240,
        safety_clearance=10
    )

    result = {
        "concatFile": concat_file,
        "totalDuration": total_dur,
        "captionY": caption_y,
        "assetPath": asset_path if os.path.exists(asset_path) else None
    }

    print("---CAPTION_OUTPUT_START---")
    print(json.dumps(result))
    print("---CAPTION_OUTPUT_END---")

if __name__ == "__main__":
    main()
