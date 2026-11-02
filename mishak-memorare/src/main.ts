import './style.css'
import {
  clozeIndices,
  fidelityScore,
  firstLettersCue,
  normalizeAnswer,
  passageAround,
  scrambleWords,
  shuffle,
  speakText,
  splitFragments,
  wordsOf,
} from './drill'
import {
  BIBLE_EDITION,
  MEMORARE_INFO,
  nextPhase,
  OFFICIAL_URL,
} from './edition-2027'
import { loadPack, versesInChapter } from './pack'
import {
  getVerseProgress,
  loadProgress,
  setVerseState,
  summarizeChapter,
} from './progress'
import type {
  AgeCategory,
  DrillModeId,
  ProgressStore,
  Verse,
  VersePack,
} from './types'
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  isCoopCategory,
  MODE_LABELS,
  modesForCategory,
} from './types'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

type Screen =
  | 'disclaimer'
  | 'home'
  | 'category'
  | 'chapter'
  | 'mode'
  | 'play'
  | 'final'

type Session = {
  category: AgeCategory
  chapter: number
  mode: DrillModeId
  verseIndex: number
  verseIds: string[]
  correct: number
  attempted: number
}

let pack: VersePack | null = null
let progress: ProgressStore = loadProgress()
let screen: Screen = 'disclaimer'
let session: Session | null = null

function shell(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'shell'
  return el
}

function hubUrl(): string {
  const h = window.location.hostname
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5174/'
  return 'https://mishak-hub.pages.dev/'
}

function brand(): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'topbar'

  const name = document.createElement('a')
  name.className = 'brand'
  name.href = hubUrl()
  name.textContent = 'Mishak'
  name.title = 'Înapoi la hub'

  const hub = document.createElement('a')
  hub.className = 'hub-link'
  hub.href = hubUrl()
  hub.textContent = '← Hub'

  bar.append(name, hub)
  return bar
}

function clear() {
  app!.replaceChildren()
}

function go(next: Screen) {
  screen = next
  render()
}

async function ensurePack() {
  if (!pack) pack = await loadPack()
  return pack
}

function render() {
  void (async () => {
    clear()
    const root = shell()
    root.append(brand())
    switch (screen) {
      case 'disclaimer':
        root.append(viewDisclaimer())
        break
      case 'home':
        root.append(await viewHome())
        break
      case 'category':
        root.append(viewCategory())
        break
      case 'chapter':
        root.append(await viewChapter())
        break
      case 'mode':
        root.append(viewMode())
        break
      case 'play':
        root.append(await viewPlay())
        break
      case 'final':
        root.append(viewFinal())
        break
    }
    app!.append(root)
  })()
}

function viewDisclaimer(): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = 'Antrenament Memorare'
  const p = document.createElement('p')
  p.className = 'disclaimer'
  p.innerHTML = `Antrenament <strong>neoficial</strong> pentru Memorarea Scripturii (${MEMORARE_INFO.label}). Nu este aplicația oficială a concursului Talantul în Negoț.<br/><br/>Traducere țintă: ${BIBLE_EDITION}.<br/><a href="${OFFICIAL_URL}" target="_blank" rel="noopener">talantulinnegot.com</a>`
  const btn = document.createElement('button')
  btn.className = 'btn btn-primary'
  btn.textContent = 'Continuă'
  btn.onclick = () => go('home')
  card.append(h, p, btn)
  return card
}

async function viewHome(): Promise<HTMLElement> {
  const p = await ensurePack()
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = MEMORARE_INFO.label
  const lead = document.createElement('p')
  lead.className = 'lead'
  lead.textContent =
    'Memorează pe verset, pasaj sau capitol — cu exerciții pe grupa ta de vârstă.'

  if (p.rightsStatus === 'PLACEHOLDER') {
    const warn = document.createElement('div')
    warn.className = 'banner-warn'
    warn.textContent =
      'Text PLACEHOLDER de antrenament. Înlocuiește cu Cornilescu SBR 2005 după confirmarea drepturilor — nu e textul oficial de concurs.'
    card.append(warn)
  }

  const nxt = nextPhase()
  const phases = document.createElement('div')
  phases.className = 'stack'
  const ph = document.createElement('h2')
  ph.textContent = 'Faze 2027'
  const ul = document.createElement('ul')
  ul.className = 'list-phases'
  for (const phase of [
    { label: 'Pe biserică', start: '20.03.2027' },
    { label: 'Județeană', start: '10.04.2027' },
    { label: 'Regională', start: '08.05.2027' },
    { label: 'Națională', start: '05.06.2027' },
    { label: 'Internațională', start: '06–08.08.2027' },
  ]) {
    const li = document.createElement('li')
    li.textContent = `${phase.label} — ${phase.start}`
    ul.append(li)
  }
  phases.append(ph, ul)
  if (nxt) {
    const cd = document.createElement('p')
    cd.className = 'ref'
    cd.textContent =
      nxt.daysLeft === 0
        ? `Astăzi: ${nxt.phase.label}`
        : `Urmează: ${nxt.phase.label} (în ~${nxt.daysLeft} zile)`
    phases.append(cd)
  }

  const goBtn = document.createElement('button')
  goBtn.className = 'btn btn-primary'
  goBtn.textContent = 'Alege categoria'
  goBtn.onclick = () => go('category')
  card.prepend(h, lead)
  card.append(phases, goBtn)
  return card
}

function viewCategory(): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = 'Categoria ta'
  const lead = document.createElement('p')
  lead.className = 'lead'
  lead.textContent =
    'Textul e același (Apoc 1–5). Se schimbă tipurile de exerciții.'
  card.append(h, lead)
  for (const id of ALL_CATEGORIES) {
    const btn = document.createElement('button')
    btn.className = 'btn btn-secondary'
    const coop = isCoopCategory(id)
    btn.textContent = `${CATEGORY_LABELS[id]}${coop ? ' · coop' : ' · solo'}`
    btn.onclick = () => {
      session = {
        category: id,
        chapter: 1,
        mode: modesForCategory(id)[0]!,
        verseIndex: 0,
        verseIds: [],
        correct: 0,
        attempted: 0,
      }
      go('chapter')
    }
    card.append(btn)
  }
  const back = document.createElement('button')
  back.className = 'btn btn-ghost'
  back.textContent = 'Acasă'
  back.onclick = () => go('home')
  card.append(back)
  return card
}

async function viewChapter(): Promise<HTMLElement> {
  const p = await ensurePack()
  if (!session) {
    go('category')
    return document.createElement('div')
  }
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = 'Capitol'
  const lead = document.createElement('p')
  lead.className = 'lead'
  lead.textContent = CATEGORY_LABELS[session.category]
  card.append(h, lead)

  for (const ch of MEMORARE_INFO.chapters) {
    const ids = versesInChapter(p, ch).map((v) => v.id)
    const sum = summarizeChapter(progress, ids)
    const btn = document.createElement('button')
    btn.className = 'btn btn-secondary'
    btn.textContent = `Capitolul ${ch} · ${sum.learned}/${sum.total} învățate`
    btn.onclick = () => {
      session!.chapter = ch
      go('mode')
    }
    card.append(btn)
    const bar = document.createElement('div')
    bar.className = 'progress-bar'
    const fill = document.createElement('span')
    fill.style.width = `${sum.total ? (sum.learned / sum.total) * 100 : 0}%`
    bar.append(fill)
    card.append(bar)
  }

  const back = document.createElement('button')
  back.className = 'btn btn-ghost'
  back.textContent = 'Înapoi'
  back.onclick = () => go('category')
  card.append(back)
  return card
}

function viewMode(): HTMLElement {
  if (!session) {
    go('category')
    return document.createElement('div')
  }
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = `Capitolul ${session.chapter}`
  const lead = document.createElement('p')
  lead.className = 'lead'
  lead.textContent = isCoopCategory(session.category)
    ? 'Mod coop: părintele ajută / validează.'
    : 'Mod solo: feedback automat.'
  card.append(h, lead)

  for (const mode of modesForCategory(session.category)) {
    const btn = document.createElement('button')
    btn.className = 'btn btn-primary'
    btn.textContent = MODE_LABELS[mode]
    btn.onclick = () => {
      void startSession(mode)
    }
    card.append(btn)
  }

  const back = document.createElement('button')
  back.className = 'btn btn-ghost'
  back.textContent = 'Înapoi'
  back.onclick = () => go('chapter')
  card.append(back)
  return card
}

async function startSession(mode: DrillModeId) {
  const p = await ensurePack()
  if (!session) return
  session.mode = mode
  session.correct = 0
  session.attempted = 0

  if (mode === 'simulate_all') {
    session.verseIds = p.verses.map((v) => v.id)
  } else if (mode === 'simulate_chapter' || mode === 'fade') {
    session.verseIds = versesInChapter(p, session.chapter).map((v) => v.id)
  } else if (mode === 'passage') {
    const chapterVerses = versesInChapter(p, session.chapter)
    const start = chapterVerses.find(
      (v) => getVerseProgress(progress, v.id).state !== 'learned',
    )
    const slice = passageAround(
      chapterVerses,
      start?.id ?? chapterVerses[0]!.id,
      4,
    )
    session.verseIds = slice.map((v) => v.id)
  } else {
    const chapterVerses = versesInChapter(p, session.chapter)
    const ordered = [...chapterVerses].sort((a, b) => {
      const sa = getVerseProgress(progress, a.id).state
      const sb = getVerseProgress(progress, b.id).state
      const rank = (s: string) =>
        s === 'fragile' ? 0 : s === 'untouched' ? 1 : 2
      return rank(sa) - rank(sb)
    })
    session.verseIds = ordered.slice(0, 8).map((v) => v.id)
  }
  session.verseIndex = 0
  go('play')
}

async function viewPlay(): Promise<HTMLElement> {
  const p = await ensurePack()
  if (!session) {
    go('home')
    return document.createElement('div')
  }
  const verse = p.verses.find((v) => v.id === session!.verseIds[session!.verseIndex])
  if (!verse) {
    go('final')
    return document.createElement('div')
  }

  const card = document.createElement('div')
  card.className = 'card stack'
  const meta = document.createElement('p')
  meta.className = 'ref'
  meta.textContent = `${MODE_LABELS[session.mode]} · ${session.verseIndex + 1}/${session.verseIds.length}`
  const ref = document.createElement('div')
  ref.className = 'verse-ref'
  ref.textContent = `Apocalipsa ${verse.chapter}:${verse.verse}`
  card.append(meta, ref)

  const st = getVerseProgress(progress, verse.id).state
  const chip = document.createElement('span')
  chip.className = `chip ${st === 'learned' ? 'learned' : st === 'fragile' ? 'fragile' : ''}`
  chip.textContent =
    st === 'learned' ? 'Învățat' : st === 'fragile' ? 'Fragil' : 'Nou'
  card.append(chip)

  const body = document.createElement('div')
  body.className = 'stack'
  card.append(body)

  mountMode(body, verse, session.mode)

  const quit = document.createElement('button')
  quit.className = 'btn btn-ghost'
  quit.textContent = 'Încheie'
  quit.onclick = () => go('final')
  card.append(quit)
  return card
}

function markResult(verse: Verse, ok: boolean) {
  if (!session) return
  session.attempted++
  if (ok) session.correct++
  progress = setVerseState(
    progress,
    verse.id,
    ok ? 'learned' : 'fragile',
  )
}

function advance() {
  if (!session) return
  if (session.verseIndex + 1 >= session.verseIds.length) {
    go('final')
    return
  }
  session.verseIndex++
  go('play')
}

function parentValidate(container: HTMLElement, verse: Verse, reveal: string) {
  const shown = document.createElement('p')
  shown.className = 'verse-text'
  shown.textContent = reveal
  const hint = document.createElement('p')
  hint.className = 'lead'
  hint.textContent = 'Părinte: copilul a spus corect?'
  const row = document.createElement('div')
  row.className = 'row'
  const ok = document.createElement('button')
  ok.className = 'btn btn-ok'
  ok.textContent = 'OK'
  ok.onclick = () => {
    markResult(verse, true)
    advance()
  }
  const again = document.createElement('button')
  again.className = 'btn btn-bad'
  again.textContent = 'Încă o dată'
  again.onclick = () => {
    markResult(verse, false)
    advance()
  }
  row.append(ok, again)
  container.append(shown, hint, row)
}

function mountMode(container: HTMLElement, verse: Verse, mode: DrillModeId) {
  switch (mode) {
    case 'listen_repeat':
      mountListenRepeat(container, verse)
      break
    case 'chunk_show':
      mountChunkShow(container, verse)
      break
    case 'read_along':
      mountReadAlong(container, verse)
      break
    case 'cloze_easy':
      mountCloze(container, verse, 1)
      break
    case 'cloze':
      mountCloze(container, verse, 2)
      break
    case 'order_fragments':
      mountOrder(container, verse)
      break
    case 'scramble':
      mountScramble(container, verse)
      break
    case 'first_letters':
      mountFirstLetters(container, verse)
      break
    case 'passage':
      mountPassage(container, verse)
      break
    case 'type_memory':
    case 'simulate_chapter':
    case 'simulate_all':
      mountTypeMemory(container, verse)
      break
    case 'fade':
      mountFade(container, verse)
      break
  }
}

function mountListenRepeat(container: HTMLElement, verse: Verse) {
  const play = document.createElement('button')
  play.className = 'btn btn-secondary'
  play.textContent = 'Ascultă (voce dispozitiv)'
  play.onclick = () => speakText(verse.text)
  container.append(play)
  if (isCoopCategory(session!.category)) {
    parentValidate(container, verse, verse.text)
  } else {
    const self = document.createElement('button')
    self.className = 'btn btn-primary'
    self.textContent = 'Am repetat'
    self.onclick = () => {
      markResult(verse, true)
      advance()
    }
    container.append(self)
  }
}

function mountChunkShow(container: HTMLElement, verse: Verse) {
  const frags = splitFragments(verse.text, 3)
  let i = 0
  const text = document.createElement('p')
  text.className = 'verse-text'
  text.textContent = frags[0] ?? ''
  const next = document.createElement('button')
  next.className = 'btn btn-secondary'
  next.textContent = 'Următorul fragment'
  next.onclick = () => {
    i++
    if (i >= frags.length) {
      parentValidate(container, verse, verse.text)
      next.remove()
      return
    }
    text.textContent = frags.slice(0, i + 1).join(' ')
  }
  container.append(text, next)
}

function mountReadAlong(container: HTMLElement, verse: Verse) {
  const words = wordsOf(verse.text)
  let idx = 0
  const p = document.createElement('p')
  p.className = 'verse-text'
  const renderWords = () => {
    p.replaceChildren()
    words.forEach((w, i) => {
      const span = document.createElement('span')
      span.textContent = w + ' '
      if (i === idx) span.className = 'highlight-word'
      p.append(span)
    })
  }
  renderWords()
  const next = document.createElement('button')
  next.className = 'btn btn-secondary'
  next.textContent = 'Următorul cuvânt'
  next.onclick = () => {
    if (idx < words.length - 1) {
      idx++
      renderWords()
    } else {
      markResult(verse, true)
      advance()
    }
  }
  const speak = document.createElement('button')
  speak.className = 'btn btn-ghost'
  speak.textContent = 'Ascultă'
  speak.onclick = () => speakText(verse.text)
  container.append(p, next, speak)
}

function mountCloze(container: HTMLElement, verse: Verse, blanks: number) {
  const words = wordsOf(verse.text)
  const idxs = clozeIndices(verse.text, blanks)
  const answers = new Map<number, string>()
  const line = document.createElement('p')
  line.className = 'verse-text'
  words.forEach((w, i) => {
    if (idxs.includes(i)) {
      const input = document.createElement('input')
      input.className = 'blank'
      input.setAttribute('aria-label', `gol ${i}`)
      input.oninput = () => answers.set(i, input.value)
      line.append(input, document.createTextNode(' '))
    } else {
      line.append(document.createTextNode(w + ' '))
    }
  })
  const check = document.createElement('button')
  check.className = 'btn btn-primary'
  check.textContent = 'Verifică'
  const fb = document.createElement('p')
  check.onclick = () => {
    let ok = true
    for (const i of idxs) {
      const expect = normalizeAnswer(words[i]!.replace(/[.,;:!?„”"«»()]/g, ''))
      const got = normalizeAnswer(answers.get(i) ?? '')
      if (got !== expect) ok = false
    }
    fb.className = ok ? 'feedback-ok' : 'feedback-bad'
    fb.textContent = ok ? 'Corect!' : `Aproape. Text: ${verse.text}`
    markResult(verse, ok)
    check.disabled = true
    const cont = document.createElement('button')
    cont.className = 'btn btn-secondary'
    cont.textContent = 'Continuă'
    cont.onclick = () => advance()
    container.append(cont)
  }
  container.append(line, check, fb)
}

function mountOrder(container: HTMLElement, verse: Verse) {
  const frags = splitFragments(verse.text, 3)
  const shuffled = shuffle(frags.map((t, i) => ({ t, i })))
  const picked: number[] = []
  const bank = document.createElement('div')
  bank.className = 'word-bank'
  const built = document.createElement('p')
  built.className = 'verse-text'
  built.textContent = '…'
  const redraw = () => {
    built.textContent = picked.map((i) => frags[i]).join(' ') || '…'
  }
  shuffled.forEach((item, slot) => {
    const chip = document.createElement('button')
    chip.className = 'word-chip'
    chip.textContent = item.t
    chip.onclick = () => {
      if (chip.classList.contains('used')) return
      chip.classList.add('used')
      picked.push(item.i)
      redraw()
      if (picked.length === frags.length) {
        const ok = picked.every((v, i) => v === i)
        markResult(verse, ok)
        const fb = document.createElement('p')
        fb.className = ok ? 'feedback-ok' : 'feedback-bad'
        fb.textContent = ok ? 'Ordine corectă!' : verse.text
        const cont = document.createElement('button')
        cont.className = 'btn btn-secondary'
        cont.textContent = 'Continuă'
        cont.onclick = () => advance()
        container.append(fb, cont)
      }
      void slot
    }
    bank.append(chip)
  })
  container.append(built, bank)
}

function mountScramble(container: HTMLElement, verse: Verse) {
  const correct = wordsOf(verse.text)
  const pool = scrambleWords(verse.text)
  const picked: string[] = []
  const built = document.createElement('p')
  built.className = 'verse-text'
  built.textContent = '…'
  const bank = document.createElement('div')
  bank.className = 'word-bank'
  const chips: HTMLButtonElement[] = []
  pool.forEach((w) => {
    const chip = document.createElement('button')
    chip.className = 'word-chip'
    chip.textContent = w
    chip.onclick = () => {
      if (chip.classList.contains('used')) return
      chip.classList.add('used', 'picked')
      picked.push(w)
      built.textContent = picked.join(' ')
      if (picked.length === correct.length) {
        const ok =
          normalizeAnswer(picked.join(' ')) ===
          normalizeAnswer(correct.join(' '))
        markResult(verse, ok)
        const fb = document.createElement('p')
        fb.className = ok ? 'feedback-ok' : 'feedback-bad'
        fb.textContent = ok ? 'Corect!' : verse.text
        const cont = document.createElement('button')
        cont.className = 'btn btn-secondary'
        cont.textContent = 'Continuă'
        cont.onclick = () => advance()
        container.append(fb, cont)
      }
    }
    chips.push(chip)
    bank.append(chip)
  })
  const undo = document.createElement('button')
  undo.className = 'btn btn-ghost'
  undo.textContent = 'Resetează'
  undo.onclick = () => {
    picked.length = 0
    built.textContent = '…'
    chips.forEach((c) => c.classList.remove('used', 'picked'))
  }
  container.append(built, bank, undo)
}

function mountFirstLetters(container: HTMLElement, verse: Verse) {
  const cue = document.createElement('p')
  cue.className = 'verse-text'
  cue.textContent = firstLettersCue(verse.text)
  const area = document.createElement('textarea')
  area.className = 'input-block'
  area.placeholder = 'Scrie versetul…'
  const check = document.createElement('button')
  check.className = 'btn btn-primary'
  check.textContent = 'Verifică'
  const fb = document.createElement('p')
  check.onclick = () => {
    const { score } = fidelityScore(verse.text, area.value)
    const ok = score >= 85
    fb.className = ok ? 'feedback-ok' : 'feedback-bad'
    fb.textContent = ok
      ? `Fidelitate ${score}%`
      : `Fidelitate ${score}%. Text: ${verse.text}`
    markResult(verse, ok)
    const cont = document.createElement('button')
    cont.className = 'btn btn-secondary'
    cont.textContent = 'Continuă'
    cont.onclick = () => advance()
    container.append(cont)
    check.disabled = true
  }
  container.append(cue, area, check, fb)
}

function mountPassage(container: HTMLElement, verse: Verse) {
  if (!pack || !session) return
  const chapterVerses = versesInChapter(pack, session.chapter)
  const slice = session.verseIds
    .map((id) => chapterVerses.find((v) => v.id === id))
    .filter((v): v is Verse => Boolean(v))
  const show = document.createElement('div')
  show.className = 'stack'
  for (const v of slice) {
    const line = document.createElement('p')
    line.className = 'ref'
    line.textContent = `${v.chapter}:${v.verse}`
    show.append(line)
  }
  const focus = document.createElement('p')
  focus.className = 'lead'
  focus.textContent = `Scrie din memorie versetul ${verse.chapter}:${verse.verse}`
  container.append(show, focus)
  mountTypeMemory(container, verse)
}

function mountTypeMemory(container: HTMLElement, verse: Verse) {
  const hide = document.createElement('button')
  hide.className = 'btn btn-ghost'
  hide.textContent = 'Arată textul 3s'
  hide.onclick = () => {
    const peek = document.createElement('p')
    peek.className = 'verse-text'
    peek.textContent = verse.text
    container.prepend(peek)
    setTimeout(() => peek.remove(), 3000)
  }
  const area = document.createElement('textarea')
  area.className = 'input-block'
  area.placeholder = 'Recită / scrie din memorie…'
  const check = document.createElement('button')
  check.className = 'btn btn-primary'
  check.textContent = 'Verifică'
  const fb = document.createElement('p')
  check.onclick = () => {
    const { score, missing } = fidelityScore(verse.text, area.value)
    const ok = score >= 80
    fb.className = ok ? 'feedback-ok' : 'feedback-bad'
    fb.textContent = ok
      ? `Fidelitate ${score}%`
      : `Fidelitate ${score}%. Lipsă: ${missing.slice(0, 8).join(', ') || '—'}`
    const full = document.createElement('p')
    full.className = 'ref'
    full.textContent = verse.text
    markResult(verse, ok)
    check.disabled = true
    const cont = document.createElement('button')
    cont.className = 'btn btn-secondary'
    cont.textContent = 'Continuă'
    cont.onclick = () => advance()
    container.append(full, cont)
  }
  if (isCoopCategory(session!.category)) {
    const reveal = document.createElement('button')
    reveal.className = 'btn btn-secondary'
    reveal.textContent = 'Arată pentru părinte'
    reveal.onclick = () => parentValidate(container, verse, verse.text)
    container.append(hide, area, check, fb, reveal)
  } else {
    container.append(hide, area, check, fb)
  }
}

function mountFade(container: HTMLElement, verse: Verse) {
  const words = wordsOf(verse.text)
  let hidden = 0
  const p = document.createElement('p')
  p.className = 'verse-text fade-level'
  const redraw = () => {
    p.replaceChildren()
    words.forEach((w, i) => {
      const span = document.createElement('span')
      if (i < hidden) {
        span.textContent = '••• '
        span.style.opacity = '0.35'
      } else {
        span.textContent = w + ' '
      }
      p.append(span)
    })
  }
  redraw()
  const more = document.createElement('button')
  more.className = 'btn btn-secondary'
  more.textContent = 'Ascunde mai mult'
  more.onclick = () => {
    hidden = Math.min(words.length, hidden + Math.max(1, Math.ceil(words.length / 4)))
    redraw()
    if (hidden >= words.length) {
      more.remove()
      mountTypeMemory(container, verse)
    }
  }
  container.append(p, more)
}

function viewFinal(): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = 'Gata pe acum'
  const lead = document.createElement('p')
  lead.className = 'lead'
  if (session) {
    lead.textContent = `Corecte: ${session.correct} / ${session.attempted} · ${CATEGORY_LABELS[session.category]} · cap. ${session.chapter}`
  } else {
    lead.textContent = 'Progresul e salvat pe acest dispozitiv.'
  }
  const again = document.createElement('button')
  again.className = 'btn btn-primary'
  again.textContent = 'Din nou'
  again.onclick = () => {
    if (session) go('mode')
    else go('home')
  }
  const home = document.createElement('button')
  home.className = 'btn btn-secondary'
  home.textContent = 'Acasă'
  home.onclick = () => go('home')
  card.append(h, lead, again, home)
  return card
}

render()
