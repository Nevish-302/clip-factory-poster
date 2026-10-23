#!/bin/sh
# usage: ./find.sh "search terms" [min_views] -> CC BY YouTube results (flat search, one request)
q="$1"; min="${2:-100000}"
yt-dlp --flat-playlist --playlist-end 40 --print "%(id)s|%(view_count)s|%(duration)s|%(channel)s|%(title)s" \
 "https://www.youtube.com/results?search_query=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$q")&sp=EgIwAQ%253D%253D" 2>/dev/null \
 | awk -F'|' -v m="$min" '$2+0>=m && $3+0>=240 && $3+0<=4500' | sort -t'|' -k2,2nr | cut -c1-150
