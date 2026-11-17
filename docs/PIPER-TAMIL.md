# Piper Tamil voice

From the repository root, run `python backend/setup_piper.py` on Windows or
`python3 backend/setup_piper.py` on Linux. Python 3.9 or later is required. On
Ubuntu, install the Python venv package if it is missing. The installer needs
internet access to PyPI and Hugging Face and stores its files in
`backend/.piper`. Run it once on each server where the backend runs.

Restart the Nayacura backend after setup. In Ask Naya, select Tamil and open
Voice Mode. If browser speech playback is unavailable, Nayacura synthesizes
the reply on its own backend and returns WAV audio. The model and its
configuration must be readable by the backend service account.

For a custom installation, set `PIPER_PYTHON` to the Piper environment's
Python executable and `PIPER_TAMIL_MODEL` to the absolute ONNX path. Keep the
model's `.onnx.json` beside it.

Voice attribution: [tinisoft's Piper Tamil Rasa Female (medium)](https://huggingface.co/tinisoft/piper-ta_IN-rasa_female-medium),
licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Based on [AI4Bharat Rasa](https://huggingface.co/datasets/ai4bharat/Rasa),
Praveen Srinivasa Varadhan, Ashwin Sankar, Giri Raju, and Mitesh M. Khapra,
*Rasa: Building Expressive Speech Synthesis Systems for Indian Languages in
Low-resource Settings*, INTERSPEECH 2024.

## English playback fallback

The same installer also downloads the English female voice. On existing
Nayacura deployments, rerun the installer after pulling the code and before
restarting the backend. The optional `PIPER_ENGLISH_MODEL` setting accepts
an absolute ONNX path with its `.onnx.json` beside it.

English voice: [Piper en_US-ljspeech-medium](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/medium),
based on the public domain [LJ Speech Dataset](https://keithito.com/LJ-Speech-Dataset/).
