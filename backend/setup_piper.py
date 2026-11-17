"""Install the local Tamil voice into backend/.piper."""
import os
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.request import urlopen
from venv import EnvBuilder

directory = Path(__file__).resolve().parent / ".piper"
venv = directory / "venv"
python = venv / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
if not python.exists():
    EnvBuilder(with_pip=True).create(venv)

subprocess.run(
    [str(python), "-m", "pip", "install", "--disable-pip-version-check", "--no-cache-dir", "piper-tts==1.4.2"],
    env={**os.environ, "TMP": str(directory), "TEMP": str(directory), "TMPDIR": str(directory)},
    check=True,
)

model = "ta_IN-rasa_female-medium.onnx"
source = "https://huggingface.co/tinisoft/piper-ta_IN-rasa_female-medium/resolve/89e15ed"
for name in (model, model + ".json"):
    target = directory / name
    if not target.exists():
        partial = target.with_suffix(target.suffix + ".partial")
        with urlopen(f"{source}/{name}", timeout=60) as response, partial.open("wb") as destination:
            shutil.copyfileobj(response, destination)
        partial.replace(target)

print("Piper Tamil female voice installed.")
