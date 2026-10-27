from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
out = root / '_site'
if out.exists():
    shutil.rmtree(out)
out.mkdir()
for name in ['index.html', 'theatre.html', 'style.css', 'app.js', 'core.js', 'stage.js', 'career.js', 'office.js', '.nojekyll']:
    shutil.copy2(root / name, out / name)
shutil.copytree(root / 'assets', out / 'assets')
assert (out / 'assets/micro-world-v2.png').is_file()
print('Static site ready:', len(list(out.rglob('*'))), 'entries')
