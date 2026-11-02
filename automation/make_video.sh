#!/usr/bin/env bash
# usage: automation/make_video.sh automation/content/<name>.json
# Output: videos/<name>.mp4, automation/out/<name>.captions.json, preview frames in automation/out/
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"
CONTENT="$1"; NAME="$(basename "$CONTENT" .json)"
OUTDIR="$HERE/out"; mkdir -p "$OUTDIR" "$ROOT/videos"
python3 -c "import PIL, numpy" 2>/dev/null || pip install --quiet --break-system-packages pillow numpy
command -v ffmpeg >/dev/null || { echo "ffmpeg missing"; exit 1; }
ls /usr/share/fonts/opentype/inter/Inter-Black.otf >/dev/null || { echo "Inter font missing"; exit 1; }
python3 -c "import cairosvg" 2>/dev/null || pip install --quiet --break-system-packages cairosvg
if [ ! -f "$HERE/assets/twemoji/1f6d2.svg" ]; then   # word icons (Twemoji, CC-BY 4.0) from npm
  T=$(mktemp -d); (cd "$T" && npm pack @twemoji/svg@15.0.0 --silent >/dev/null && tar xzf twemoji-svg-15.0.0.tgz)
  mkdir -p "$HERE/assets/twemoji" && cp "$T"/package/*.svg "$HERE/assets/twemoji/"; rm -rf "$T"
fi
SEED=$(python3 -c "import json;print(json.load(open('$CONTENT'))['seed'])")
read END Q0 SEG TH N < <(python3 "$HERE/render.py" --timing "$CONTENT" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['end'],d['quiz_start'],d['seg'],d['think'],d['n'])")
python3 "$HERE/music.py" "$OUTDIR/$NAME.wav" "$END" "$Q0" "$SEG" "$TH" "$N" "$SEED"
python3 "$HERE/render.py" "$CONTENT" "$OUTDIR/$NAME.mp4" "$OUTDIR/$NAME.wav"
mv "$OUTDIR/$NAME.mp4" "$ROOT/videos/$NAME.mp4"
python3 "$HERE/captions.py" "$CONTENT" "$OUTDIR/$NAME.captions.json" >/dev/null
ffprobe -v error -show_entries format=duration -of csv=p=0 "$ROOT/videos/$NAME.mp4"
echo "VIDEO=videos/$NAME.mp4"
echo "RAW_URL=https://raw.githubusercontent.com/umitvatansever0/weblearningapp/social-media-assets/videos/$NAME.mp4"
