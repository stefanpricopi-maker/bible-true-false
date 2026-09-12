/**
 * Generate short PLACEHOLDER WAV beeps (not biblical content).
 * 20 question tones + feedback cues for 2 rounds × 10 questions.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const audioDir = join(root, 'public/packs/demo-v1/audio')
const feedbackDir = join(root, 'public/packs/demo-v1/feedback')

mkdirSync(audioDir, { recursive: true })
mkdirSync(feedbackDir, { recursive: true })

function wavTone(freqHz, durationSec, volume = 0.25) {
  const sampleRate = 22050
  const numSamples = Math.floor(sampleRate * durationSec)
  const dataSize = numSamples * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const envelope = Math.min(1, t * 20) * Math.min(1, (durationSec - t) * 20)
    const sample = Math.sin(2 * Math.PI * freqHz * t) * volume * envelope
    buffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.floor(sample * 32767))), 44 + i * 2)
  }

  return buffer
}

const files = []

for (let i = 1; i <= 20; i++) {
  const id = `q${String(i).padStart(3, '0')}`
  const freq = 400 + ((i * 37) % 280)
  files.push([join(audioDir, `${id}-question.wav`), freq, 1.0])
}

files.push(
  [join(feedbackDir, 'correct.wav'), 660, 0.7],
  [join(feedbackDir, 'incorrect.wav'), 220, 0.7],
  [join(feedbackDir, 'next-turn.wav'), 392, 0.5],
  [join(feedbackDir, 'round-break.wav'), 523, 1.0],
)

for (const [path, freq, dur] of files) {
  writeFileSync(path, wavTone(freq, dur))
  console.log('wrote', path)
}
