import sys, yt_dlp
ids = sys.argv[1:]
opts = {"format": "bv*[height<=1080]+ba/b", "merge_output_format": "mp4", "outtmpl": "%(id)s.mp4", "quiet": True, "no_warnings": True}
with yt_dlp.YoutubeDL(opts) as y:
    for i in ids:
        try:
            info = y.extract_info(f"https://www.youtube.com/watch?v={i}", download=False)
            lic = info.get("license")
            if lic != "Creative Commons Attribution license (reuse allowed)":
                print(i, "SKIP license:", lic); continue
            y.process_ie_result(info, download=True); print(i, "OK", info["title"])
        except Exception as e:
            print(i, "FAIL", str(e)[:90])
