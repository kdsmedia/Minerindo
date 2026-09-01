#!/usr/bin/env bash
# Generate MINERINDO store assets via ImageMagick.
set -euo pipefail
OUT="ALTOMEDIA/store-assets"
mkdir -p "$OUT"

# 1) App icon 512x512
magick -size 512x512 gradient:'#0A0B1E'-'#161830' \
  -fill '#151730' -stroke '#F5C518' -strokewidth 8 \
  -draw "polygon 256,66 414,160 414,352 256,446 98,352 98,160" \
  -fill none -stroke '#F5C518' -strokewidth 3 \
  -draw "polygon 256,130 349,192 349,320 256,382 163,320 163,192" \
  -font DejaVu-Sans-Bold -fill '#F5C518' -gravity center -pointsize 150 -annotate +0-10 "M" \
  -font DejaVu-Sans-Bold -fill '#FFFFFF' -gravity center -pointsize 28 -annotate +0+120 "MINERINDO" \
  "$OUT/icon-512.png"

# 2) Adaptive foreground 1024 (transparan
magick -size 1024x1024 xc:none \
  -fill 'rgba(21,23,48,0.95)' -stroke '#F5C518' -strokewidth 16 \
  -draw "polygon 512,132 833,254 833,770 512,892 191,770 191,254" \
  -fill none -stroke '#F5C518' -strokewidth 7 \
  -draw "polygon 512,260 698,378 698,646 512,764 326,646 326,378" \
  -font DejaVu-Sans-Bold -fill '#F5C518' -gravity center -pointsize 300 -annotate +0-30 "M" \
  -font DejaVu-Sans-Bold -fill '#FFFFFF' -gravity center -pointsize 60 -annotate +0+240 "MINERINDO" \
  "$OUT/foreground-1024.png"

# 3) Feature graphic 1024x500
magick -size 1024x500 gradient:'#0A0B1E'-'#161830' \
  -fill 'rgba(30,32,58,0.9)' -draw "circle 860,120 860,20" \
  -fill 'rgba(25,27,50,0.9)' -draw "circle 120,420 120,300" \
  -fill '#151730' -stroke '#F5C518' -strokewidth 12 \
  -draw "polygon 760,110 900,180 900,330 760,400 620,330 620,180" \
  -fill none -stroke '#F5C518' -strokewidth 5 \
  -draw "polygon 760,180 840,215 840,295 760,330 680,295 680,215" \
  -font DejaVu-Sans-Bold -fill '#F5C518' -pointsize 30 -annotate +730+225 "M" \
  -font DejaVu-Sans-Bold -fill '#FFFFFF' -pointsize 92 -annotate +75+150 "MINERINDO" \
  -font DejaVu-Sans -fill '#9AA0B9' -pointsize 34 -annotate +80+270 "Game Mining Kripto Indonesia" \
  -font DejaVu-Sans-Bold -fill '#FFFFFF' -pointsize 28 -annotate +80+325 "Bertema Tambang - Daftar & Klaim Bonus Harian" \
  -fill '#F5C518' -draw "roundrectangle 75,430 300,450 10,10" \
  "$OUT/feature-graphic.png"

echo "assets dasar selesai"
ls -la "$OUT"