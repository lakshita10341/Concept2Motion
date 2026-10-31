#!/usr/bin/env python3
"""
caption_overlay.py — High-retention synced 9:16 vertical reel captions.

Features:
- Dynamic 2-line maximum word clustering from Whisper word timestamps.
- Monospace or Futura bold typography with rounded red active-word pill (#FF5757).
- Clean chalk white font (#FFFFFF) with dark boundary stroke for high contrast.
- Zero overlap with bottom asset character: auto-calculates vertical clearance.
- FFmpeg-compatible concat manifest generation for fast, single-pass overlay.
"""

import json
import os
import shutil
import subprocess
from dataclasses import dataclass
from typing import List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont


DEFAULT_FONT_PATH = "fonts/Futura-Bold.ttf"
FALLBACK_FONTS = [
    "fonts/Futura-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSans-Bold.otf",
]


@dataclass
class WordItem:
    word: str
    start: float
    end: float


@dataclass
class CaptionCue:
    words: List[WordItem]
    lines: List[List[WordItem]]
    start: float
    end: float


def get_font(font_path: str = DEFAULT_FONT_PATH, font_size: int = 42) -> ImageFont.FreeTypeFont:
    """Loads specified font with fallbacks to system fonts if needed."""
    candidate_paths = [font_path] + [f for f in FALLBACK_FONTS if f != font_path]
    for path in candidate_paths:
        if path and os.path.exists(path):
            try:
                return ImageFont.truetype(path, font_size)
            except Exception:
                continue
    try:
        return ImageFont.load_default(size=font_size)
    except TypeError:
        return ImageFont.load_default()


def load_words(captions_json_path: str) -> Tuple[float, List[WordItem]]:
    """Loads all word timestamps from Whisper captions.json."""
    with open(captions_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_duration = float(data.get("duration", 0.0))
    all_words: List[WordItem] = []

    for seg in data.get("segments", []):
        for w in seg.get("words", []):
            text = w.get("word", "").strip()
            if not text:
                continue
            start = float(w.get("start", 0.0))
            end = float(w.get("end", start + 0.1))
            if end < start:
                end = start + 0.1
            all_words.append(WordItem(word=text, start=start, end=end))

    # Sort and validate word progression
    all_words.sort(key=lambda x: x.start)
    if not total_duration and all_words:
        total_duration = all_words[-1].end + 0.5

    return total_duration, all_words


def cluster_into_cues(
    words: List[WordItem],
    max_chars_per_line: int = 26,
    max_lines: int = 2,
    max_pause: float = 0.45,
    max_cue_duration: float = 3.6,
) -> List[CaptionCue]:
    """Clusters words into high-retention 1-2 line cue cards."""
    if not words:
        return []

    cues: List[CaptionCue] = []
    current_cue_words: List[WordItem] = []

    def commit_cue(cue_words: List[WordItem]):
        if not cue_words:
            return
        # Break cue_words into up to max_lines
        lines: List[List[WordItem]] = []
        cur_line: List[WordItem] = []
        cur_line_len = 0

        for w in cue_words:
            w_len = len(w.word)
            added_len = w_len if not cur_line else w_len + 1
            if cur_line_len + added_len <= max_chars_per_line or len(lines) >= (max_lines - 1):
                cur_line.append(w)
                cur_line_len += added_len
            else:
                lines.append(cur_line)
                cur_line = [w]
                cur_line_len = w_len
        if cur_line:
            lines.append(cur_line)

        cues.append(
            CaptionCue(
                words=cue_words,
                lines=lines,
                start=cue_words[0].start,
                end=cue_words[-1].end,
            )
        )

    for i, w in enumerate(words):
        if not current_cue_words:
            current_cue_words.append(w)
            continue

        prev_w = current_cue_words[-1]
        pause = w.start - prev_w.end
        cue_dur = w.end - current_cue_words[0].start

        # Approximate line fullness
        total_chars = sum(len(x.word) for x in current_cue_words) + len(current_cue_words) - 1
        ends_sentence = prev_w.word.rstrip().endswith((".", "!", "?"))

        should_split = (
            ends_sentence
            or pause >= max_pause
            or cue_dur >= max_cue_duration
            or (total_chars + len(w.word) + 1 > max_chars_per_line * max_lines)
        )

        if should_split:
            commit_cue(current_cue_words)
            current_cue_words = [w]
        else:
            current_cue_words.append(w)

    if current_cue_words:
        commit_cue(current_cue_words)

    return cues


def compute_cue_layout(
    cue: CaptionCue,
    font: ImageFont.FreeTypeFont,
    canvas_width: int = 1080,
    strip_height: int = 240,
    line_spacing: Optional[int] = None,
) -> dict:
    """Precomputes exact (x, y) coordinates for all words in a cue card."""
    sample_bbox = font.getbbox("Tg")
    raw_font_h = sample_bbox[3] - sample_bbox[1]
    line_height = raw_font_h + max(4, round(raw_font_h * 0.22))

    if line_spacing is None:
        line_spacing = max(10, round(raw_font_h * 0.46))

    # Space width
    space_w = font.getbbox(" ")[2] - font.getbbox(" ")[0]

    # Anchor Line 1 to a stable top-baseline so 1-line and 2-line cues don't vertically jitter
    total_2line_h = 2 * line_height + line_spacing
    bottom_pad = max(10, round(raw_font_h * 0.46))
    y_anchor = strip_height - total_2line_h - bottom_pad

    word_positions = []
    line_y = y_anchor

    for line in cue.lines:
        line_word_boxes = []
        line_w = 0
        for w in line:
            w_bbox = font.getbbox(w.word)
            w_w = w_bbox[2] - w_bbox[0]
            w_h = w_bbox[3] - w_bbox[1]
            line_word_boxes.append((w, w_w, w_h))
            line_w += w_w

        line_w += (len(line) - 1) * space_w
        cur_x = (canvas_width - line_w) / 2.0

        for w, w_w, w_h in line_word_boxes:
            word_positions.append({
                "word": w.word,
                "start": w.start,
                "end": w.end,
                "x": cur_x,
                "y": line_y,
                "w": w_w,
                "h": line_height,
            })
            cur_x += w_w + space_w

        line_y += line_height + line_spacing

    return {
        "strip_height": strip_height,
        "words": word_positions,
    }


def render_caption_frame(
    layout: dict,
    active_idx: Optional[int],
    font: ImageFont.FreeTypeFont,
    canvas_width: int = 1080,
    strip_height: int = 240,
    highlight_color: str = "#FF5757",
    text_color: str = "#FFFFFF",
    stroke_color: str = "#07090E",
    pill_radius: Optional[int] = None,
    pill_pad_x: Optional[int] = None,
    pill_pad_y: Optional[int] = None,
) -> Image.Image:
    """Renders a single transparent frame with active word highlighted."""
    im = Image.new("RGBA", (canvas_width, strip_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    words = layout["words"]

    try:
        ascent, descent = font.getmetrics()
    except Exception:
        ascent, descent = 34, 9

    # 1. Draw rounded red highlight behind active word (optically centered around font ascent)
    if active_idx is not None and 0 <= active_idx < len(words):
        act = words[active_idx]

        # Balanced top and bottom padding:
        # Text is drawn at act["y"] with ascent extending downward to baseline (act["y"] + ascent).
        # Cap top is at act["y"], descenders extend to act["y"] + ascent + descent.
        # Snug, modern pill highlight that hugs the word without overflowing into adjacent word spaces
        top_offset = max(3, round(ascent * 0.15)) if pill_pad_y is None else pill_pad_y
        bot_offset = (ascent + max(4, round(descent * 1.55))) if pill_pad_y is None else (ascent + pill_pad_y)
        pad_x = max(3, round(ascent * 0.12)) if pill_pad_x is None else pill_pad_x
        radius = max(4, round(ascent * 0.20)) if pill_radius is None else pill_radius

        pill_rect = [
            act["x"] - pad_x,
            act["y"] - top_offset,
            act["x"] + act["w"] + pad_x,
            act["y"] + bot_offset,
        ]
        draw.rounded_rectangle(pill_rect, radius=radius, fill=highlight_color)

    # Adaptive stroke width based on resolution / font metrics
    stroke_w = max(2, round(ascent / 17.0))
    act_stroke_w = max(1, round(stroke_w / 2.0))

    # 2. Draw all words text on top
    for idx, w in enumerate(words):
        is_active = (idx == active_idx)
        if is_active:
            # Active word on top of red pill: crisp white with subtle blend
            draw.text(
                (w["x"], w["y"]),
                w["word"],
                font=font,
                fill=text_color,
                stroke_width=act_stroke_w,
                stroke_fill=highlight_color,
            )
        else:
            # Inactive words: chalk white with dark outline for 100% legibility
            draw.text(
                (w["x"], w["y"]),
                w["word"],
                font=font,
                fill=text_color,
                stroke_width=stroke_w,
                stroke_fill=stroke_color,
            )

    return im


def generate_caption_timeline(
    captions_json_path: str,
    output_dir: str = "rough/captions",
    font_path: str = DEFAULT_FONT_PATH,
    font_size: int = 42,
    canvas_width: int = 1080,
    strip_height: int = 240,
    max_chars_per_line: int = 26,
    max_lines: int = 2,
    highlight_color: str = "#FF5757",
) -> Tuple[str, float]:
    """Generates transparent PNG state images and an FFmpeg concat manifest with moving red highlight pill.

    Returns:
        (concat_file_path, total_duration)
    """
    if captions_json_path.endswith(".srt") and os.path.exists(captions_json_path.replace(".srt", ".json")):
        captions_json_path = captions_json_path.replace(".srt", ".json")

    total_dur, words = load_words(captions_json_path)
    if not words:
        raise ValueError(f"No valid words found in {captions_json_path}")

    font = get_font(font_path, font_size)
    cues = cluster_into_cues(words, max_chars_per_line=max_chars_per_line, max_lines=max_lines)

    frames_dir = os.path.join(output_dir, "frames")
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir, ignore_errors=True)
    os.makedirs(frames_dir, exist_ok=True)

    # Blank frame for initial silence and gaps
    blank_im = Image.new("RGBA", (canvas_width, strip_height), (0, 0, 0, 0))
    blank_path = os.path.join(frames_dir, "blank.png")
    blank_im.save(blank_path)

    timeline_entries: List[Tuple[str, float]] = []
    current_time = 0.0
    frame_counter = 0

    for cue_idx, cue in enumerate(cues):
        # Gap before cue starts
        if cue.start > current_time:
            gap = cue.start - current_time
            if gap >= 0.03:
                timeline_entries.append((blank_path, gap))
                current_time = cue.start

        layout = compute_cue_layout(cue, font, canvas_width=canvas_width, strip_height=strip_height)
        cue_words = layout["words"]

        for w_idx, w in enumerate(cue_words):
            # Internal pause before word starts
            if w["start"] > current_time:
                gap = w["start"] - current_time
                if gap >= 0.08:
                    unhl_im = render_caption_frame(
                        layout,
                        active_idx=None,
                        font=font,
                        canvas_width=canvas_width,
                        strip_height=strip_height,
                        highlight_color=highlight_color,
                    )
                    unhl_p = os.path.join(frames_dir, f"frame_{frame_counter:05d}.png")
                    unhl_im.save(unhl_p)
                    frame_counter += 1
                    timeline_entries.append((unhl_p, gap))
                    current_time = w["start"]

            # Compute duration for this word's active highlight
            if w_idx + 1 < len(cue_words):
                next_w_start = cue_words[w_idx + 1]["start"]
                if next_w_start > w["end"] and (next_w_start - w["end"]) < 0.18:
                    w_end_time = next_w_start
                else:
                    w_end_time = w["end"]
            else:
                next_cue_start = cues[cue_idx + 1].start if (cue_idx + 1 < len(cues)) else total_dur
                hold_cushion = min(0.22, max(0.05, next_cue_start - w["end"]))
                w_end_time = w["end"] + hold_cushion

            w_dur = max(0.06, w_end_time - current_time)

            act_im = render_caption_frame(
                layout,
                active_idx=w_idx,
                font=font,
                canvas_width=canvas_width,
                strip_height=strip_height,
                highlight_color=highlight_color,
            )
            act_p = os.path.join(frames_dir, f"frame_{frame_counter:05d}.png")
            act_im.save(act_p)
            frame_counter += 1

            timeline_entries.append((act_p, w_dur))
            current_time += w_dur

    # Trailing silence after last cue
    if total_dur > current_time:
        timeline_entries.append((blank_path, total_dur - current_time))
        current_time = total_dur

    # Write FFmpeg concat manifest
    concat_file = os.path.join(output_dir, "captions_concat.txt")
    with open(concat_file, "w", encoding="utf-8") as f:
        f.write("ffconcat version 1.0\n")
        for img_p, dur in timeline_entries:
            if dur <= 0:
                continue
            abs_p = os.path.abspath(img_p)
            f.write(f"file '{abs_p}'\n")
            f.write(f"duration {dur:.3f}\n")
        # Final line repeated for FFmpeg concat demuxer requirement
        if timeline_entries:
            last_img = os.path.abspath(timeline_entries[-1][0])
            f.write(f"file '{last_img}'\n")

    return concat_file, total_dur


def compute_caption_vertical_offset(
    asset_path: str = "asset.png",
    asset_scale: float = 45.0,
    asset_bottom_margin: float = -1.6,
    no_asset: bool = False,
    canvas_width: int = 1080,
    canvas_height: int = 1920,
    strip_height: int = 240,
    safety_clearance: int = 10,
) -> int:
    """Computes the Y-coordinate for the caption overlay so it sits just above asset.png.

    Guarantees strictly zero overlap across any resolution (1080p, 4K, etc.).
    """
    if (not no_asset) and asset_path and os.path.exists(asset_path):
        with Image.open(asset_path) as _img:
            orig_w, orig_h = _img.size
        scale_factor = canvas_width / 1080.0
        target_w = max(10, int(orig_w * (asset_scale / 100.0) * scale_factor))
        target_w -= (target_w % 2)
        target_h = int(orig_h * (target_w / orig_w))
        # In pipeline.py: y = main_h - overlay_h - (main_h * asset_bottom_margin / 100)
        asset_top_y = canvas_height - target_h - int(canvas_height * asset_bottom_margin / 100.0)
        caption_y = asset_top_y - strip_height - safety_clearance
        return max(0, caption_y)
    else:
        # Default positioning in lower safe area
        return canvas_height - strip_height - int(420 * (canvas_height / 1920.0))


# ==============================================================================
# Frame-Perfect ASS Subtitle Generator (Synced 100% to captions.srt & captions.json)
# ==============================================================================

def seconds_to_ass_time(secs: float) -> str:
    """Converts seconds float to ASS timestamp 'H:MM:SS.cs'."""
    h = int(secs // 3600)
    m = int((secs % 3600) // 60)
    s = int(secs % 60)
    cs = int(round((secs - int(secs)) * 100))
    if cs >= 100:
        s += 1
        cs = 0
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def parse_srt_file(srt_path: str) -> List[Tuple[float, float, str]]:
    """Parses SRT file into a list of (start_seconds, end_seconds, text)."""
    with open(srt_path, "r", encoding="utf-8") as f:
        content = f.read()

    import re
    blocks = re.split(r"\n\s*\n", content.strip())
    cues = []
    for b in blocks:
        lines = [l.strip() for l in b.strip().split("\n") if l.strip()]
        if len(lines) >= 3:
            time_m = re.match(r"(\d+:\d+:\d+,\d+)\s*-->\s*(\d+:\d+:\d+,\d+)", lines[1])
            if time_m:
                s_str, e_str = time_m.group(1), time_m.group(2)
                def parse_sec(ts):
                    h, m, s_ms = ts.split(":")
                    s, ms = s_ms.split(",")
                    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0
                start_sec = parse_sec(s_str)
                end_sec = parse_sec(e_str)
                text = " ".join(lines[2:])
                cues.append((start_sec, end_sec, text))
    return cues


def parse_json_file(json_path: str) -> List[Tuple[float, float, str]]:
    """Parses Whisper JSON file into a list of (start_seconds, end_seconds, text)."""
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    cues = []
    for seg in data.get("segments", []):
        cues.append((float(seg["start"]), float(seg["end"]), seg["text"].strip()))
    return cues


def wrap_subtitle_text(text: str, max_chars_per_line: int = 28) -> str:
    """Intelligently splits caption text across at most 2 balanced lines."""
    words = text.strip().split()
    if not words:
        return ""
    if len(text) <= max_chars_per_line:
        return text

    best_split = len(words) // 2
    best_diff = 999
    for i in range(1, len(words)):
        l1 = " ".join(words[:i])
        l2 = " ".join(words[i:])
        diff = abs(len(l1) - len(l2))
        if max(len(l1), len(l2)) <= max_chars_per_line + 8 and diff < best_diff:
            best_diff = diff
            best_split = i

    line1 = " ".join(words[:best_split])
    line2 = " ".join(words[best_split:])
    return f"{line1}\\N{line2}"


def compute_ass_vertical_margin(
    asset_path: str = "asset.png",
    asset_scale: float = 45.0,
    asset_bottom_margin: float = -1.6,
    no_asset: bool = False,
    canvas_height: int = 1920,
    safety_clearance: int = 50,
) -> int:
    """Computes MarginV for ASS subtitles to sit right above the avatar head."""
    if (not no_asset) and asset_path and os.path.exists(asset_path):
        from pipeline import get_image_size
        orig_w, orig_h = get_image_size(asset_path)
        target_w = max(10, int(orig_w * (asset_scale / 100.0)))
        target_w -= (target_w % 2)
        target_h = int(orig_h * (target_w / orig_w))
        # Top of asset measured from bottom of video canvas
        asset_top_from_bottom = target_h + int(canvas_height * asset_bottom_margin / 100.0)
        return max(240, asset_top_from_bottom + safety_clearance)
    return 440


def create_ass_file(
    captions_path: str,
    output_ass_path: str = "rough/captions.ass",
    font_name: str = "Futura-Bold",
    font_size: int = 50,
    primary_color: str = "&H00FFFFFF",
    outline_color: str = "&H000E0907",
    outline_width: float = 4.5,
    asset_path: str = "asset.png",
    asset_scale: float = 45.0,
    asset_bottom_margin: float = -1.6,
    no_asset: bool = False,
    safety_clearance: int = 50,
    max_chars_per_line: int = 28,
) -> str:
    """Generates a frame-perfect ASS subtitle file guaranteed to sync 100% with captions.srt or captions.json."""
    if captions_path.endswith(".srt") or not captions_path.endswith(".json"):
        cues = parse_srt_file(captions_path)
        if not cues and os.path.exists(captions_path.replace(".srt", ".json")):
            cues = parse_json_file(captions_path.replace(".srt", ".json"))
    else:
        cues = parse_json_file(captions_path)

    if not cues:
        raise ValueError(f"No caption cues could be parsed from {captions_path}")

    margin_v = compute_ass_vertical_margin(
        asset_path=asset_path,
        asset_scale=asset_scale,
        asset_bottom_margin=asset_bottom_margin,
        no_asset=no_asset,
        safety_clearance=safety_clearance,
    )

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_color},&H005757FF,{outline_color},&H00000000,-1,0,0,0,100,100,0,0,1,{outline_width},0,2,60,60,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []
    for start_sec, end_sec, text in cues:
        start_ts = seconds_to_ass_time(start_sec)
        end_ts = seconds_to_ass_time(end_sec)
        wrapped = wrap_subtitle_text(text, max_chars_per_line=max_chars_per_line)
        events.append(f"Dialogue: 0,{start_ts},{end_ts},Default,,0,0,0,,{wrapped}")

    os.makedirs(os.path.dirname(output_ass_path) or ".", exist_ok=True)
    with open(output_ass_path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(events) + "\n")

    print(f"[ASS Subtitles] Generated {len(events)} cues synced to {captions_path} (MarginV={margin_v}px) -> {output_ass_path}")
    return output_ass_path
