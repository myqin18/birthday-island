"""Create web-sized copies; never alter desktop originals.
Run: py prepare-media.py C:\\Users\\...\\Desktop\\111
"""
import json
import subprocess
import sys
import imageio_ffmpeg
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
SOURCE = Path(sys.argv[1])
MEDIA = ROOT / 'media'
REPORT = ROOT / 'media-build-report.json'
for name in ('photos', 'videos', 'posters'):
    (MEDIA / name).mkdir(parents=True, exist_ok=True)


def probe(source):
    temp = ROOT / '.media-probe.json'
    with temp.open('w', encoding='utf-8') as out:
        subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(source)], stdout=out, check=True)
    result = json.loads(temp.read_text(encoding='utf-8'))
    temp.unlink()
    return result


def run(args):
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)


manifest = {'photos': [], 'videos': []}
report = {'sources': [], 'originalBytes': 0, 'webBytes': 0}
images = sorted(p for p in SOURCE.iterdir() if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'))
videos = sorted(p for p in SOURCE.iterdir() if p.suffix.lower() in ('.mp4', '.mov', '.m4v'))
for i, source in enumerate(images, 1):
    stem = f'photo-{i:02}'
    with Image.open(source) as original:
        oriented = ImageOps.exif_transpose(original).convert('RGB')
        large = oriented.copy()
        large.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        thumb = oriented.copy()
        thumb.thumbnail((640, 640), Image.Resampling.LANCZOS)
        # Fresh images ensure camera metadata (including location) is not copied.
        for image, suffix, quality in ((large, '', 85), (thumb, '-thumb', 80)):
            clean = Image.new('RGB', image.size)
            clean.paste(image)
            clean.save(MEDIA / 'photos' / f'{stem}{suffix}.jpg', quality=quality, optimize=True, progressive=True)
    item = {'src': f'media/photos/{stem}.jpg', 'thumb': f'media/photos/{stem}-thumb.jpg', 'width': large.width, 'height': large.height, 'title': f'快乐存档 · {i:02}'}
    manifest['photos'].append(item)
    report['sources'].append({'original': source.name, 'web': item['src']})
    report['originalBytes'] += source.stat().st_size
    print(f'Photo {i}/{len(images)} ready', flush=True)

for i, source in enumerate(videos, 1):
    stem = f'video-{i:02}'
    output = MEDIA / 'videos' / f'{stem}.mp4'
    # Preserve aspect and audio, cap at 720p landscape / 720p portrait, normalize to broadly supported SDR H.264.
    run(['-i', str(source), '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=1280:1280:force_original_aspect_ratio=decrease:force_divisible_by=2:out_range=tv,setsar=1', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '25', '-maxrate', '2200k', '-bufsize', '4400k', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-profile:v', 'high', '-level', '4.0', '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-movflags', '+faststart', '-map_metadata', '-1', '-map_chapters', '-1', str(output)])
    data = probe(output)
    video = next(s for s in data['streams'] if s['codec_type'] == 'video')
    duration = float(data['format']['duration'])
    assert output.stat().st_size < 25 * 1024**2, 'Too large for GitHub browser upload'
    assert video.get('codec_name') == 'h264' and video.get('pix_fmt', '').startswith('yuv420p')
    run(['-ss', str(min(0.6, duration / 3)), '-i', str(output), '-frames:v', '1', '-vf', 'scale=640:640:force_original_aspect_ratio=decrease', '-q:v', '3', str(MEDIA / 'posters' / f'{stem}.jpg')])
    item = {'src': f'media/videos/{stem}.mp4', 'poster': f'media/posters/{stem}.jpg', 'width': video['width'], 'height': video['height'], 'duration': round(duration, 2), 'title': f'一起出门 · {i:02}'}
    manifest['videos'].append(item)
    report['sources'].append({'original': source.name, 'web': item['src'], 'duration': duration, 'bytes': output.stat().st_size})
    report['originalBytes'] += source.stat().st_size
    print(f'Video {i}/{len(videos)} ready: {output.stat().st_size / 1024**2:.2f} MiB', flush=True)

(ROOT / 'media-config.js').write_text('window.BIRTHDAY_MEDIA = ' + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
report['webBytes'] = sum(p.stat().st_size for p in MEDIA.rglob('*') if p.is_file())
report['photos'] = len(images)
report['videos'] = len(videos)
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k: v for k, v in report.items() if k != 'sources'}, ensure_ascii=False), flush=True)
