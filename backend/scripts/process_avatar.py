import sys
import os
from PIL import Image

def process_avatar(input_path, output_path):
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    # Check if corner is dark (black background)
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    corner_colors = [img.getpixel(pt)[:3] for pt in corners]
    avg_r = sum(c[0] for c in corner_colors) / len(corner_colors)
    avg_g = sum(c[1] for c in corner_colors) / len(corner_colors)
    avg_b = sum(c[2] for c in corner_colors) / len(corner_colors)

    # Use flood fill mask from all 4 corners if background is dark
    if avg_r < 40 and avg_g < 40 and avg_b < 40:
        # Create a 1-bit or grayscale mask using flood fill
        # Convert to grayscale for thresholding
        gray = img.convert("L")
        
        # Binary mask: background is near-black (< 24)
        # We start flood fill from the borders to only remove connected background
        import numpy as np
        arr = np.array(img)
        # Near black condition
        is_bg = (arr[:, :, 0] < 24) & (arr[:, :, 1] < 24) & (arr[:, :, 2] < 24)

        # Flood fill connected components from borders
        from collections import deque
        h, w = is_bg.shape
        visited = np.zeros((h, w), dtype=bool)
        queue = deque()

        # Add all border pixels that are black
        for x in range(w):
            if is_bg[0, x]:
                queue.append((0, x))
                visited[0, x] = True
            if is_bg[h - 1, x]:
                queue.append((h - 1, x))
                visited[h - 1, x] = True
        for y in range(h):
            if is_bg[y, 0] and not visited[y, 0]:
                queue.append((y, 0))
                visited[y, 0] = True
            if is_bg[y, w - 1] and not visited[y, w - 1]:
                queue.append((y, w - 1))
                visited[y, w - 1] = True

        while queue:
            cy, cx = queue.popleft()
            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    if is_bg[ny, nx]:
                        visited[ny, nx] = True
                        queue.append((ny, nx))

        # Set alpha to 0 only for connected outer background
        arr[visited, 3] = 0
        img = Image.fromarray(arr)

    # Crop out transparent bounding box
    bbox = img.getbbox()
    if bbox:
        # Keep character flush with bottom by using original height if bottom reaches near bottom
        x0, y0, x1, y1 = bbox
        img = img.crop((x0, y0, x1, y1))

    img.save(output_path, "PNG")
    print(f"Processed avatar saved to {output_path} (size: {img.size})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 process_avatar.py <input_path> <output_path>")
        sys.exit(1)
    process_avatar(sys.argv[1], sys.argv[2])
