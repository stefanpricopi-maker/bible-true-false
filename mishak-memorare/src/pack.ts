import type { Verse, VersePack } from './types'

export async function loadPack(): Promise<VersePack> {
  const res = await fetch('/packs/apocalipsa-1-5/manifest.json')
  if (!res.ok) throw new Error('Nu pot încărca pack-ul Apocalipsa 1–5')
  const pack = (await res.json()) as VersePack
  if (!pack.verses?.length) throw new Error('Pack gol')
  return pack
}

export function versesInChapter(pack: VersePack, chapter: number): Verse[] {
  return pack.verses.filter((v) => v.chapter === chapter)
}

export function verseById(pack: VersePack, id: string): Verse | undefined {
  return pack.verses.find((v) => v.id === id)
}

export function nextFragileOrUntouched(
  pack: VersePack,
  chapter: number,
  isDone: (id: string) => boolean,
): Verse | undefined {
  const list = versesInChapter(pack, chapter)
  return list.find((v) => !isDone(v.id)) ?? list[0]
}
