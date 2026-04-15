#!/usr/bin/env bash
# Compile the 4 demo clips into a single crossfaded reel.
#
# Output: public/hero-videos/reel.mp4
# Target: 1920x800 (cinematic 2.4:1), 24fps, H.264, no audio.
#
# Each clip is scaled-then-cropped to fit the target canvas, trimmed to a
# per-clip length, and crossfaded into the next clip with xfade.

set -euo pipefail

cd "$(dirname "$0")/.."
OUT_DIR="public/hero-videos"
TMP="/tmp/reel-build"
mkdir -p "$TMP"

W=1920
H=800
FPS=24
FADE=0.5   # crossfade duration between clips (seconds)

# Per-clip: (file, take_seconds) — how much of each clip to use.
# demo-3 is only 2.9s so we use 2.8s.
declare -a clips=(
  "demo-3.mp4 2.8"
  "demo-2.mp4 6.0"
  "demo-1.mp4 7.0"
  "demo-4.mp4 5.0"
)

# Step 1: normalize each clip to the target canvas (scale + crop, drop audio, re-encode).
i=0
for entry in "${clips[@]}"; do
  file=$(echo "$entry" | awk '{print $1}')
  take=$(echo "$entry" | awk '{print $2}')
  out="$TMP/norm-$i.mp4"
  echo "→ Normalizing $file (${take}s) → $out"
  ffmpeg -y -loglevel error \
    -i "$OUT_DIR/$file" \
    -t "$take" \
    -vf "scale=${W}:-2:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},format=yuv420p" \
    -an \
    -c:v libx264 -preset medium -crf 20 \
    "$out"
  i=$((i + 1))
done

# Step 2: build an xfade chain for all normalized clips.
# We'll concatenate with ffmpeg filter_complex.
N=${#clips[@]}

# Compute cumulative offsets for xfade transitions.
# Each clip contributes (take - FADE) to the reel duration, except the last.
input_args=""
for k in $(seq 0 $((N - 1))); do
  input_args="$input_args -i $TMP/norm-$k.mp4"
done

# Build xfade filter chain.
# [0:v][1:v]xfade=transition=fade:duration=F:offset=T0[v01];
# [v01][2:v]xfade=transition=fade:duration=F:offset=T1[v02]; ...
filter=""
prev_label="0:v"
cumulative=0
for k in $(seq 0 $((N - 2))); do
  take=$(echo "${clips[$k]}" | awk '{print $2}')
  # offset = cumulative (after last xfade) + (take - FADE)
  offset=$(python3 -c "print(round($cumulative + $take - $FADE, 3))")
  cumulative=$offset
  next_label="v$((k + 1))"
  filter="${filter}[${prev_label}][$((k + 1)):v]xfade=transition=fade:duration=${FADE}:offset=${offset}[${next_label}];"
  prev_label="$next_label"
done

# Strip trailing semicolon and map the last output.
filter="${filter%;}"
final_label="${prev_label}"

echo "→ Compiling final reel via xfade..."
ffmpeg -y -loglevel error \
  $input_args \
  -filter_complex "$filter" \
  -map "[${final_label}]" \
  -c:v libx264 -preset medium -crf 20 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUT_DIR/reel.mp4"

# Report
DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT_DIR/reel.mp4")
SIZE_MB=$(du -m "$OUT_DIR/reel.mp4" | awk '{print $1}')
echo ""
echo "✓ Done: $OUT_DIR/reel.mp4"
echo "  Duration: ${DUR}s"
echo "  Size: ${SIZE_MB} MB"
echo "  Preview: http://localhost:3002/hero-videos/reel.mp4"
