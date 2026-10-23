import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
for vid in sys.argv[1:]:
    raw = subprocess.run(["ffmpeg","-v","error","-i",f"src/{vid}.mp4","-vn","-ac","1","-ar","16000","-f","f32le","-"],capture_output=True,check=True).stdout
    audio = np.frombuffer(raw, dtype=np.float32)
    segs, _ = m.transcribe(audio, word_timestamps=True, vad_filter=True)
    out = [{"s": s.start, "e": s.end, "t": s.text.strip(), "w": [[w.word, w.start, w.end] for w in s.words]} for s in segs]
    json.dump(out, open(f"tx/{vid}.json", "w")); print(vid, "done", len(out), "segments", flush=True)
