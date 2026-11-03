import sys, json, subprocess, re, os
vid, t0, t1, hook, outname, mode = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], sys.argv[5], sys.argv[6]
MASK = {"bullshit":"bulls**t","shit":"sh*t","fucking":"f*cking"}
words = [(MASK.get(re.sub(r"\W","",w[0]).lower(), w[0]).strip(), w[1]-t0, w[2]-t0) for s in json.load(open(f"tx/{vid}.json")) for w in s["w"] if t0 <= w[1] < t1 and w[0].strip()]
def ts(x):
    x = max(x, 0); return f"{int(x//3600)}:{int(x%3600//60):02d}:{x%60:05.2f}"
hdr = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Cap,Helvetica Neue,76,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,7,2,2,90,90,610,1
Style: Hook,Helvetica Neue,70,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,7,2,8,90,90,230,1
Style: Take,Helvetica Neue,50,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB0000000,1,0,0,0,100,100,0,0,3,16,0,2,90,90,430,1
Style: Brand,Helvetica Neue,34,&HB0FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,4,0,1,3,0,8,0,0,70,1
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
ev = [f"Dialogue: 1,{ts(0)},{ts(3.2)},Hook,,0,0,0,,{{\\fscx70\\fscy70\\t(0,150,\\fscx100\\fscy100)}}{hook}"]
# --- originality layer (env TAKE = our own one-line commentary, END = our own closing line, TAG = who/what label) ---
# overlays only: no extra length, no change to the clip. See docs/skills/05-originality-layer.md.
D = t1 - t0
clean = lambda x: re.sub(r"[{}\\\n]", " ", x).strip()
TAKE, END, TAG = clean(os.environ.get("TAKE", "")), clean(os.environ.get("END", "")), clean(os.environ.get("TAG", ""))
if os.environ.get("ORIG", "1") == "1" and D > 12:
    ev.append(f"Dialogue: 2,{ts(0)},{ts(D)},Brand,,0,0,0,,{{\\pos(540,70)\\an8}}{TAG + '  |  ' if TAG else ''}NOT A CLIP FACTORY")
    ev.append(f"Dialogue: 2,{ts(0)},{ts(D)},Brand,,0,0,0,,{{\\an7\\pos(0,0)\\p1\\1c&H5EE4FF&\\bord0\\fscx0\\t(0,{int(D*1000)},\\fscx100)}}m 0 0 l 1080 0 1080 10 0 10{{\\p0}}")
    if TAKE:
        a = max(4.0, D * 0.42); ev.append(f"Dialogue: 2,{ts(a)},{ts(a + 4.5)},Take,,0,0,0,,{{\\fad(200,200)}}{TAKE}")
    if END:
        ev.append(f"Dialogue: 2,{ts(D - 2.6)},{ts(D)},Take,,0,0,0,,{{\\fad(200,0)}}{END}")
pages = [words[i:i+3] for i in range(0, len(words), 3)]
for p in pages:
    for k, (w, s, e) in enumerate(p):
        end = p[k+1][1] if k+1 < len(p) else e
        txt = " ".join((f"{{\\c&H5EE4FF&\\fscx110\\fscy110}}{x.upper()}{{\\c&HFFFFFF&\\fscx100\\fscy100}}" if j == k else x.upper()) for j, (x, _, _) in enumerate(p))
        ev.append(f"Dialogue: 0,{ts(s)},{ts(end)},Cap,,0,0,0,,{txt}")
open(f"out/{outname}.ass", "w").write(hdr + "\n".join(ev) + "\n")
if mode == "fit":   # 16:9 slide/whiteboard: full width, centered on white
    vf = "scale=1080:-2,pad=1080:1920:0:(1920-ih)/2-60:white"
elif mode == "blur":  # 16:9 foreground over a blurred, zoomed copy of itself
    vf = "split[a][b];[a]scale=-2:1920,crop=1080:1920,boxblur=40:6[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2-60"
else:               # crop to face-centered 9:16
    vf = "scale=-2:1920,crop=1080:1920"
if mode.startswith("face"):   # face-tracked true 9:16 crop; face-left / face-right picks which person in two-shots
    import cv2, numpy as np
    side = mode.split("-")[1] if "-" in mode else "left"
    W, H = map(int, subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",f"src/{vid}.mp4"], capture_output=True, text=True).stdout.strip().split(","))
    CW = int(H * 9 / 16) // 2 * 2
    cas = [cv2.CascadeClassifier(cv2.data.haarcascades + f) for f in ("haarcascade_frontalface_default.xml", "haarcascade_profileface.xml")]
    def faces(img):
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); out = []
        for c in cas:
            out += [((x + w / 2) / g.shape[1], w) for x, y, w, h in c.detectMultiScale(g, 1.2, 5, minSize=(40, 40))]
            out += [(1 - (x + w / 2) / g.shape[1], w) for x, y, w, h in c.detectMultiScale(cv2.flip(g, 1), 1.2, 5, minSize=(40, 40))]
        return out
    raw = subprocess.run(["ffmpeg","-v","error","-ss",str(t0),"-to",str(t1),"-i",f"src/{vid}.mp4","-vf","fps=4,scale=960:540","-f","rawvideo","-pix_fmt","bgr24","-"], capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 540, 960, 3)
    xs, last = [], 0.3 if side == "left" else 0.7
    for f in fr:
        fx = faces(f)
        if fx:
            if side == "big":   # largest face = the person the camera is on
                last = max(fx, key=lambda f: f[1])[0]
            else:
                fx = sorted(f[0] for f in fx); last = min(fx) if side == "left" else max(fx) if side == "right" else fx[len(fx) // 2]
        xs.append(last)
    # AutoFlip-style: detect the original shot cuts, then per shot hold a STATIONARY crop at the median face x;
    # only fit a gentle straight-line pan if the subject truly drifts out of the crop window inside one shot.
    scn = subprocess.run(["ffmpeg","-hide_banner","-ss",str(t0),"-to",str(t1),"-i",f"src/{vid}.mp4","-an","-vf","scale=480:-1,select='gt(scene,0.28)',showinfo","-f","null","-"], capture_output=True, text=True).stderr
    cuts = [0.0] + [float(m) for m in re.findall(r"pts_time:([0-9.]+)", scn)] + [1e9]
    ts = [i / 4 for i in range(len(xs))]
    shots = []
    for i in range(len(cuts) - 1):
        pts = [(t, x) for t, x in zip(ts, xs) if cuts[i] <= t < cuts[i + 1]]
        if pts:
            tt, xx = zip(*pts); med = float(np.median(xx))
            slope = np.polyfit(tt, xx, 1) if len(pts) > 6 and (max(xx) - min(xx)) > CW / W * 0.45 else None
            shots.append((cuts[i], cuts[i + 1], med, slope))
        else:
            shots.append((cuts[i], cuts[i + 1], shots[-1][2] if shots else xs[0], None))
    def camx(t):
        for c0, c1, med, sl in shots:
            if c0 <= t < c1:
                return float(np.polyval(sl, t)) if sl is not None else med
        return shots[-1][2]
    probe = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=r_frame_rate","-of","csv=p=0",f"src/{vid}.mp4"], capture_output=True, text=True).stdout.strip()
    fps = eval(probe)
    dec = subprocess.Popen(["ffmpeg","-v","error","-ss",str(t0),"-to",str(t1),"-i",f"src/{vid}.mp4","-f","rawvideo","-pix_fmt","bgr24","-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","bgr24","-s","1080x1920","-r",str(fps),"-i","-","-ss",str(t0),"-to",str(t1),"-i",f"src/{vid}.mp4","-map","0:v","-map","1:a","-vf",f"ass=out/{outname}.ass","-c:v","libx264","-crf","20","-preset","medium","-profile:v","high","-level","4.0","-pix_fmt","yuv420p","-r","30","-g","60","-c:a","aac","-ar","44100","-b:a","128k","-shortest","-movflags","+faststart",f"out/{outname}.mp4"], stdin=subprocess.PIPE)
    n = 0
    while True:
        buf = dec.stdout.read(W * H * 3)
        if len(buf) < W * H * 3: break
        img = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        c = camx(n / fps)
        x0 = int(min(max(c * W - CW / 2, 0), W - CW))
        enc.stdin.write(cv2.resize(img[:, x0:x0 + CW], (1080, 1920), interpolation=cv2.INTER_CUBIC).tobytes()); n += 1
    enc.stdin.close(); enc.wait(); print("ok", outname); sys.exit()
subprocess.run(["ffmpeg","-v","error","-y","-ss",str(t0),"-to",str(t1),"-i",f"src/{vid}.mp4","-vf",f"{vf},ass=out/{outname}.ass","-c:v","libx264","-crf","20","-preset","medium","-profile:v","high","-level","4.0","-pix_fmt","yuv420p","-r","30","-g","60","-c:a","aac","-ar","44100","-b:a","128k","-movflags","+faststart",f"out/{outname}.mp4"],check=True)
print("ok", outname)
