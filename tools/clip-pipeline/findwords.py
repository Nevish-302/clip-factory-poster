"""usage: python3 findwords.py VIDEO_ID "word word word" [lo hi]  -> start/end of the first matching word run in tx/VIDEO_ID.json"""
import json, re, sys
vid, seq = sys.argv[1], [re.sub(r"\W", "", t).lower() for t in sys.argv[2].split()]
lo, hi = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) > 4 else (0, 1e9)
W = [w for s in json.load(open(f"tx/{vid}.json")) for w in s["w"]]
norm = [re.sub(r"\W", "", w[0]).lower() for w in W]
for i in range(len(W) - len(seq) + 1):
    if lo <= W[i][1] <= hi and norm[i:i + len(seq)] == seq:
        print(f"{W[i][1]:.2f} - {W[i + len(seq) - 1][2]:.2f}  next word starts {W[min(i + len(seq), len(W) - 1)][1]:.2f}"); break
else:
    print("not found")
