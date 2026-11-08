# -*- coding: utf-8 -*-
"""
《午夜档案》标题 Logo 抠图工具（开发辅助，非游戏运行必需）
运行：python tools/make_title_logo.py
把 tools/src/title_logo_src.jpg（白底 JPG）处理成透明 PNG：
  assets/images/ui/title_logo.png
要点：
  · 从图像边缘洪泛填充，只移除与外部连通的近白背景（含浅灰软阴影）；
  · 笔画内部的白色高光不被误删；
  · 背景过渡带做「去白化」软边（unmatte），避免深色界面上出现白边。
"""
import sys
from collections import deque
from PIL import Image

SRC = "tools/src/title_logo_src.jpg"
DST = "assets/images/ui/title_logo.png"
BG_MIN = 200      # 近白判定：min(R,G,B) >= BG_MIN 视为可吞没的背景
BAND = 2          # 背景过渡带宽度（像素）
OUT_H = 900       # 输出高度（源图较大，等比缩小便于网页加载）


def main():
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    px = im.load()
    print("源图:", w, "x", h)

    bg = bytearray(w * h)          # 1 = 背景
    visited = bytearray(w * h)
    q = deque()

    def is_bglike(x, y):
        r, g, b = px[x, y]
        return min(r, g, b) >= BG_MIN

    # 从四条边的所有近白像素开始洪泛
    for x in range(w):
        for y in (0, h - 1):
            if not visited[y * w + x] and is_bglike(x, y):
                visited[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y * w + x] and is_bglike(x, y):
                visited[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        bg[y * w + x] = 1
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not visited[i] and is_bglike(nx, ny):
                    visited[i] = 1
                    q.append((nx, ny))

    out = Image.new("RGBA", (w, h))
    opx = out.load()
    removed = 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if bg[y * w + x]:
                opx[x, y] = (r, g, b, 0)
                removed += 1
                continue
            # 过渡带：任一 4 邻域是背景 → 软边去白化
            near_bg = False
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and bg[ny * w + nx]:
                    near_bg = True
                    break
            if near_bg:
                a = 1.0 - min(r, g, b) / 255.0
                if a < 0.04:
                    opx[x, y] = (r, g, b, 0)
                    removed += 1
                    continue
                nr = max(0, min(255, int((r - 255 * (1 - a)) / a)))
                ng = max(0, min(255, int((g - 255 * (1 - a)) / a)))
                nb = max(0, min(255, int((b - 255 * (1 - a)) / a)))
                opx[x, y] = (nr, ng, nb, int(a * 255))
            else:
                opx[x, y] = (r, g, b, 255)

    # 裁掉透明边
    bbox = out.getbbox()
    if bbox:
        pad = 10
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        out = out.crop(bbox)

    # 等比缩放到输出高度
    if out.height > OUT_H:
        nw = round(out.width * OUT_H / out.height)
        out = out.resize((nw, OUT_H), Image.LANCZOS)

    import os
    os.makedirs(os.path.dirname(DST), exist_ok=True)
    out.save(DST)
    print("输出:", DST, out.size, "背景移除像素:", removed)


if __name__ == "__main__":
    sys.exit(main())
