import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { env } from '../config/env';

const piperDir = resolve(__dirname, '../../.piper');
const synthesize = `
import io
import sys
import wave
from piper import PiperVoice

text = sys.stdin.buffer.read().decode("utf-8")
voice = PiperVoice.load(sys.argv[1])
audio = io.BytesIO()
with wave.open(audio, "wb") as wav:
    voice.synthesize_wav(text, wav)
sys.stdout.buffer.write(audio.getvalue())
`;

export function getPiperVoice(language: 'tamil' | 'english') {
  const bundledPython = process.platform === 'win32' ? 'venv/Scripts/python.exe' : 'venv/bin/python';
  const python = env.PIPER_PYTHON || resolve(piperDir, bundledPython);
  const model = language === 'tamil'
    ? env.PIPER_TAMIL_MODEL || resolve(piperDir, 'ta_IN-rasa_female-medium.onnx')
    : env.PIPER_ENGLISH_MODEL || resolve(piperDir, 'en_US-ljspeech-medium.onnx');
  if ((!env.PIPER_PYTHON && !existsSync(python)) || !existsSync(model) || !existsSync(model + '.json')) {
    return null;
  }
  return { python, model };
}

export function synthesizePiper(
  piper: NonNullable<ReturnType<typeof getPiperVoice>>,
  text: string,
  signal: AbortSignal,
): Promise<Buffer> {
  return new Promise((resolveAudio, reject) => {
    const child = execFile(piper.python, ['-c', synthesize, piper.model], {
      encoding: 'buffer',
      maxBuffer: 12 * 1024 * 1024,
      timeout: 30_000,
      windowsHide: true,
      signal,
    }, (error, audio) => {
      if (error || audio.length <= 44 || audio.toString('ascii', 0, 4) !== 'RIFF') {
        reject(error ?? new Error('Piper did not return WAV audio'));
      } else {
        resolveAudio(audio);
      }
    });
    child.stdin?.on('error', reject);
    child.stdin?.end(text, 'utf8');
  });
}
