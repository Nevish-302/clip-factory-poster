#!/bin/sh
# Re-encode every clip that still needs an Instagram post (in queue order, soonest first) with ig-encode.sh,
# then replace its video in the clips-v1 release. usage: ./reencode-pending.sh   (sources: post-ready/ and batch3-ready/ under ~/Downloads/cc-clips)
R=Nevish-302/clip-factory-poster; CC="$HOME/Downloads/cc-clips"; mkdir -p "$CC/ig-ready"
node -e 'const q=JSON.parse(require("fs").readFileSync("queue.json"));console.log(q.filter(e=>!e.results.instagram_reel).map(e=>e.id).join("\n"))' | while read n; do
  src="$CC/post-ready/$n.mp4"; [ -f "$src" ] || src="$CC/batch3-ready/$n.mp4"
  [ -f "$src" ] || { echo "no source for $n"; continue; }
  [ -f "$CC/ig-ready/$n.mp4" ] || ./ig-encode.sh "$src" "$CC/ig-ready/$n.mp4" </dev/null || continue
  for try in 1 2 3 4; do gh release upload clips-v1 "$CC/ig-ready/$n.mp4" --repo $R --clobber </dev/null >/dev/null 2>&1 && { echo "replaced $n"; break; }; echo "retry $try $n"; sleep 5; done
done
echo DONE
