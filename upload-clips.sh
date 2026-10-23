#!/bin/sh
# upload every clip in a folder to the clips-v1 release, one at a time, with retries (large uploads can time out)
# usage: ./upload-clips.sh [folder]   (default: ~/Downloads/cc-clips/post-ready)
R=Nevish-302/clip-factory-poster
DIR="${1:-$HOME/Downloads/cc-clips/post-ready}"
for f in "$DIR"/*.mp4; do
  n=$(basename "$f")
  have=$(gh release view clips-v1 --repo $R --json assets --jq ".assets[].name" 2>/dev/null | grep -cx "$n")
  [ "$have" = "1" ] && { echo "have $n"; continue; }
  for try in 1 2 3 4; do
    gh release upload clips-v1 "$f" --repo $R --clobber >/dev/null 2>&1 && { echo "uploaded $n"; break; }
    echo "retry $try $n"; sleep 5
  done
done
echo DONE
