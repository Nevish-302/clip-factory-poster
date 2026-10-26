#!/bin/sh
# Encode a clip for Instagram's current upload limit. usage: ./ig-encode.sh in.mp4 out.mp4
# Since about 2026-10-25 Instagram's Reels API rejects (ProcessingFailedError at the final upload check) clips whose
# resolution x length is too big, even though the same files posted fine before. Measured on 2026-10-27 (see ig-probe.mjs):
#   1080x1920: 20 s ok, 30 s fail | 720x1280: 53 s and 59 s ok, 79 s and 89 s fail | 540x960: 79 s and 89 s ok.
# So the ceiling is roughly 55 million pixel-seconds. This keeps a margin of about 10 percent.
in="$1"; out="$2"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
read w h vb <<EOF
$(python3 -c "d=$dur; print(*((1080,1920,3500) if d<=22 else (720,1280,1800) if d<=52 else (540,960,1300)))")
EOF
ffmpeg -nostdin -v error -y -i "$in" -vf "scale=$w:$h" -c:v libx264 -preset slow -b:v ${vb}k -maxrate $((vb*4/3))k -bufsize $((vb*8/3))k \
  -profile:v high -level 4.0 -pix_fmt yuv420p -r 30 -g 60 -c:a aac -b:a 128k -ar 44100 -ac 2 -movflags +faststart "$out" \
  && echo "$(basename "$out") ${w}x${h} ${dur}s $(du -h "$out" | cut -f1)"
