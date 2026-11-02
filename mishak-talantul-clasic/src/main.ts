import './style.css'
import {
  isCategoryPlayable,
  loadCatalog,
  loadCategoryPack,
} from './catalog'
import {
  ALL_CATEGORIES,
  BIBLE_EDITION,
  BOOK_CHAPTER_COUNT,
  BOOK_LABELS,
  CLASSIC_BIBLIO,
  nextPhase,
  OFFICIAL_URL,
  PHASES_2027,
  type BibleBookId,
} from './edition-2027'
import { booksInPack, chaptersForBook } from './score'
import { CoopSession, type SessionSnapshot } from './session/engine'
import type {
  ClassicCategory,
  DraftAnswer,
  MatchingQuestion,
  MultiChoiceQuestion,
  Pack,
  PackCatalog,
  Question,
  SingleChoiceQuestion,
} from './types'
import { CATEGORY_LABELS } from './types'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app missing')

const session = new CoopSession()
let catalog: PackCatalog | null = null
let cachedPack: Pack | null = null
let timerId: number | null = null

session.subscribe(render)

void loadCatalog()
  .then((c) => {
    catalog = c
    render(session.snapshot())
  })
  .catch((err) => console.error(err))

function clearTimer(): void {
  if (timerId != null) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function syncTimer(snap: SessionSnapshot): void {
  const need =
    snap.timerEnabled &&
    (snap.phase === 'playing' || snap.phase === 'review')
  if (!need) {
    clearTimer()
    return
  }
  if (timerId != null) return
  timerId = window.setInterval(() => session.tickTimer(), 1000)
}

function hubUrl(): string {
  const h = window.location.hostname
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5174/'
  return 'https://mishak-hub.pages.dev/'
}

function renderTopbar(): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'topbar'

  const brand = document.createElement('a')
  brand.className = 'brand'
  brand.href = hubUrl()
  brand.textContent = 'Mishak'
  brand.title = 'Înapoi la hub'

  const hub = document.createElement('a')
  hub.className = 'hub-link'
  hub.href = hubUrl()
  hub.textContent = '← Hub'

  bar.append(brand, hub)
  return bar
}

function render(snap: SessionSnapshot): void {
  syncTimer(snap)
  app!.innerHTML = ''
  const shell = document.createElement('div')
  shell.className = 'shell'
  shell.dataset.phase = snap.phase
  shell.append(renderTopbar())

  switch (snap.phase) {
    case 'disclaimer':
      shell.append(renderDisclaimer())
      break
    case 'home':
      shell.append(renderHome())
      break
    case 'category':
      shell.append(renderCategories())
      break
    case 'biblio':
      shell.append(renderBiblio(snap))
      break
    case 'session':
      shell.append(renderSessionPick(snap))
      break
    case 'drillPick':
      shell.append(renderDrillPick(snap))
      break
    case 'playing':
      shell.append(renderPlaying(snap))
      break
    case 'review':
      shell.append(renderReview(snap))
      break
    case 'end':
      shell.append(renderEnd(snap))
      break
  }

  app!.append(shell)
}

function renderDisclaimer(): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'

  const h = document.createElement('h1')
  h.textContent = 'Antrenament Clasic'
  card.append(h)

  const p = document.createElement('p')
  p.className = 'disclaimer'
  p.innerHTML =
    'Antrenament <strong>neoficial</strong> pentru tipurile din secțiunea Clasic (ediția 2027). ' +
    'Întrebările sunt de practică — <strong>nu</strong> sunt întrebările oficiale.<br/>' +
    `Site oficial: <a href="${OFFICIAL_URL}" target="_blank" rel="noopener noreferrer">talantulinnegot.com</a>.`
  card.append(p)

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'btn btn-primary'
  btn.textContent = 'Am înțeles'
  btn.addEventListener('click', () => session.acceptDisclaimer())
  card.append(btn)

  return card
}

function renderHome(): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'stack'

  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = 'Antrenament Clasic 2027'
  const lead = document.createElement('p')
  lead.className = 'lead'
  lead.textContent =
    'Pregătire părinte–copil pe bibliografia ediției. Nu e înscriere la concurs.'
  card.append(h, lead)

  const next = nextPhase()
  if (next) {
    const box = document.createElement('div')
    box.className = 'phase-box'
    box.innerHTML = `<strong>Următoarea fază:</strong> ${next.phase.label}<br/><span class="timer">${
      next.daysLeft === 0
        ? 'Astăzi / în curs'
        : `peste ${next.daysLeft} zile`
    }</span> · ${formatPhaseDate(next.phase.start)}${
      next.phase.end ? ` – ${formatPhaseDate(next.phase.end)}` : ''
    }`
    card.append(box)
  }

  const phases = document.createElement('ul')
  phases.className = 'phase-list'
  for (const p of PHASES_2027) {
    const li = document.createElement('li')
    li.textContent = `${p.label}: ${formatPhaseDate(p.start)}${
      p.end ? ` – ${formatPhaseDate(p.end)}` : ''
    }`
    phases.append(li)
  }
  card.append(phases)

  const go = document.createElement('button')
  go.type = 'button'
  go.className = 'btn btn-primary'
  go.textContent = 'Alege categoria'
  go.addEventListener('click', () => session.goToCategories())
  card.append(go)

  wrap.append(card)
  return wrap
}

function renderCategories(): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'stack'

  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = 'Categoria Clasic'
  const lead = document.createElement('p')
  lead.className = 'lead'
  lead.textContent = 'Conform pliantului 2027. Doar categoriile cu pachet sunt active.'
  card.append(h, lead)

  const grid = document.createElement('div')
  grid.className = 'cat-grid'
  for (const id of ALL_CATEGORIES) {
    const playable = catalog ? isCategoryPlayable(catalog, id) : false
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cat-btn' + (playable ? '' : ' is-soon')
    btn.textContent = playable
      ? CATEGORY_LABELS[id]
      : `${CATEGORY_LABELS[id]} — în curând`
    btn.disabled = !playable
    if (playable) {
      btn.addEventListener('click', () => {
        cachedPack = null
        session.selectCategory(id)
      })
    }
    grid.append(btn)
  }
  card.append(grid)

  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'btn btn-ghost'
  back.textContent = 'Acasă'
  back.addEventListener('click', () => session.goHome())
  card.append(back)

  wrap.append(card)
  return wrap
}

function renderBiblio(snap: SessionSnapshot): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const cat = snap.category!
  const biblio = CLASSIC_BIBLIO[cat]

  const h = document.createElement('h1')
  h.textContent = CATEGORY_LABELS[cat]
  card.append(h)

  const books = document.createElement('p')
  books.className = 'lead'
  books.innerHTML = `<strong>Bibliografie:</strong> ${biblio.books
    .map((b) => BOOK_LABELS[b])
    .join(', ')}`
  card.append(books)

  const versesTitle = document.createElement('p')
  versesTitle.className = 'lead'
  versesTitle.innerHTML = '<strong>Versete de memorat:</strong>'
  card.append(versesTitle)

  const ul = document.createElement('ul')
  ul.className = 'verse-list'
  for (const v of biblio.memoryVerses) {
    const li = document.createElement('li')
    li.textContent = v
    ul.append(li)
  }
  card.append(ul)

  const note = document.createElement('p')
  note.className = 'ref'
  note.textContent = BIBLE_EDITION
  card.append(note)

  const go = document.createElement('button')
  go.type = 'button'
  go.className = 'btn btn-primary'
  go.textContent = 'Continuă la sesiune'
  go.addEventListener('click', () => session.continueFromBiblio())
  card.append(go)

  const home = document.createElement('button')
  home.type = 'button'
  home.className = 'btn btn-ghost'
  home.textContent = 'Acasă'
  home.addEventListener('click', () => session.goHome())
  card.append(home)

  return card
}

function renderSessionPick(snap: SessionSnapshot): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = snap.category
    ? CATEGORY_LABELS[snap.category]
    : 'Sesiune'
  const lead = document.createElement('p')
  lead.className = 'lead'
  lead.textContent =
    'Exercițiu pe o carte din bibliografie sau simulare tip foaie Clasic.'
  card.append(h, lead)

  if (snap.error) {
    const err = document.createElement('p')
    err.className = 'error'
    err.textContent = snap.error
    card.append(err)
  }

  const drill = document.createElement('button')
  drill.type = 'button'
  drill.className = 'btn btn-primary'
  drill.textContent = 'Exercițiu pe carte / capitol'
  drill.addEventListener('click', () => session.openDrillPicker())

  const exam = document.createElement('button')
  exam.type = 'button'
  exam.className = 'btn btn-secondary'
  exam.textContent = 'Simulare Clasic (cu cronometru)'
  exam.addEventListener('click', () => void startExam(true))

  const examNoTimer = document.createElement('button')
  examNoTimer.type = 'button'
  examNoTimer.className = 'btn btn-secondary'
  examNoTimer.textContent = 'Simulare Clasic (fără cronometru)'
  examNoTimer.addEventListener('click', () => void startExam(false))

  const home = document.createElement('button')
  home.type = 'button'
  home.className = 'btn btn-ghost'
  home.textContent = 'Acasă'
  home.addEventListener('click', () => session.goHome())

  card.append(drill, exam, examNoTimer, home)
  return card
}

function renderDrillPick(snap: SessionSnapshot): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = 'Alege cartea'
  card.append(h)

  if (snap.error) {
    const err = document.createElement('p')
    err.className = 'error'
    err.textContent = snap.error
    card.append(err)
  }

  const bookGrid = document.createElement('div')
  bookGrid.className = 'book-grid'
  card.append(bookGrid)

  const chapterHost = document.createElement('div')
  chapterHost.className = 'chapter-host'
  card.append(chapterHost)

  const cat = snap.category!
  const biblio = CLASSIC_BIBLIO[cat]

  void ensurePack(cat).then((pack) => {
    if (!pack || session.snapshot().phase !== 'drillPick') return
    if (card.dataset.ready === '1') return
    card.dataset.ready = '1'

    const available = new Set(booksInPack(pack.questions))
    for (const book of biblio.books) {
      const has = available.has(book)
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'book-btn' + (has ? '' : ' is-soon')
      btn.textContent = BOOK_LABELS[book]
      btn.disabled = !has
      if (!has) btn.title = 'Fără itemi încă'
      if (has) {
        btn.addEventListener('click', () => {
          for (const b of bookGrid.querySelectorAll('.book-btn')) {
            b.classList.toggle('is-on', b === btn)
          }
          showChapterPicker(chapterHost, pack, book)
        })
      }
      bookGrid.append(btn)
    }

    const all = document.createElement('button')
    all.type = 'button'
    all.className = 'btn btn-secondary'
    all.textContent = 'Mix din toată bibliografia (8 întrebări)'
    all.addEventListener('click', () =>
      void session.startSession(pack, 'drill', { drill: {} }),
    )
    // After chapter host, before back
    const backEl = card.querySelector('.btn-ghost')
    if (backEl) card.insertBefore(all, backEl)
    else card.append(all)
  })

  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'btn btn-ghost'
  back.textContent = 'Înapoi'
  back.addEventListener('click', () => session.backToSession())
  card.append(back)

  return card
}

function showChapterPicker(
  host: HTMLElement,
  pack: Pack,
  book: BibleBookId,
): void {
  host.replaceChildren()

  const withItems = new Set(chaptersForBook(pack.questions, book))
  const total = BOOK_CHAPTER_COUNT[book] ?? Math.max(0, ...withItems)

  const block = document.createElement('div')
  block.className = 'stack chapter-pick'

  const whole = document.createElement('button')
  whole.type = 'button'
  whole.className = 'btn btn-primary'
  whole.textContent = 'Toată cartea'
  whole.addEventListener('click', () =>
    void session.startSession(pack, 'drill', { drill: { book } }),
  )
  block.append(whole)

  const chLabel = document.createElement('p')
  chLabel.className = 'chapter-label'
  chLabel.textContent = 'Capitolul:'
  block.append(chLabel)

  const grid = document.createElement('div')
  grid.className = 'chapter-grid'
  for (let ch = 1; ch <= total; ch++) {
    const has = withItems.has(ch)
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'chapter-btn' + (has ? '' : ' is-soon')
    btn.textContent = String(ch)
    btn.disabled = !has
    btn.title = has
      ? `${BOOK_LABELS[book]} ${ch}`
      : `${BOOK_LABELS[book]} ${ch} — fără itemi încă`
    if (has) {
      btn.addEventListener('click', () =>
        void session.startSession(pack, 'drill', {
          drill: { book, chapter: ch },
        }),
      )
    }
    grid.append(btn)
  }
  block.append(grid)
  host.append(block)
}

async function ensurePack(category: ClassicCategory): Promise<Pack | null> {
  if (cachedPack && cachedPack.category === category) return cachedPack
  const pack = await loadCategoryPack(category)
  cachedPack = pack
  return pack
}

async function startExam(timer: boolean): Promise<void> {
  const snap = session.snapshot()
  if (!snap.category) return
  try {
    const pack = await ensurePack(snap.category)
    if (!pack) throw new Error('Pachet indisponibil')
    await session.startSession(pack, 'exam', { timer })
  } catch (err) {
    console.error(err)
    alert(err instanceof Error ? err.message : 'Nu am putut porni sesiunea')
  }
}

function renderPlaying(snap: SessionSnapshot): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const q = snap.question
  if (!q || !snap.draft) {
    const err = document.createElement('p')
    err.className = 'error'
    err.textContent = 'Întrebare lipsă'
    card.append(err)
    return card
  }

  const meta = document.createElement('div')
  meta.className = 'meta'
  const progress = document.createElement('span')
  progress.textContent = `${snap.index + 1} / ${snap.total}`
  meta.append(progress)
  if (snap.timerSecondsLeft != null) {
    const t = document.createElement('span')
    t.className = 'timer'
    t.textContent = formatTimer(snap.timerSecondsLeft)
    meta.append(t)
  }
  card.append(meta)

  const type = document.createElement('div')
  type.className = 'lead'
  type.textContent = typeLabel(q.type)
  card.append(type)

  const books = document.createElement('p')
  books.className = 'ref'
  books.textContent = q.books.map((b) => BOOK_LABELS[b]).join(', ')
  card.append(books)

  const prompt = document.createElement('p')
  prompt.className = 'prompt'
  prompt.textContent = q.prompt
  card.append(prompt)

  card.append(renderAnswerControls(q, snap.draft))

  if (snap.error) {
    const err = document.createElement('p')
    err.className = 'error'
    err.textContent = snap.error
    card.append(err)
  }

  const confirm = document.createElement('button')
  confirm.type = 'button'
  confirm.className = 'btn btn-primary'
  confirm.textContent = 'Confirmă'
  confirm.addEventListener('click', () => session.confirm())
  card.append(confirm)
  return card
}

function renderAnswerControls(q: Question, draft: DraftAnswer): HTMLElement {
  switch (q.type) {
    case 'true_false':
      return renderTrueFalse(draft)
    case 'single_choice':
      return renderSingle(q, draft)
    case 'matching':
      return renderMatching(q, draft)
    case 'short_answer':
      return renderShort(draft)
    case 'multi_choice':
      return renderMulti(q, draft)
  }
}

function renderTrueFalse(draft: DraftAnswer): HTMLElement {
  const row = document.createElement('div')
  row.className = 'tf-row'
  const d =
    draft.type === 'true_false'
      ? draft
      : { type: 'true_false' as const, value: null }
  for (const [label, value] of [
    ['Adevărat', true],
    ['Fals', false],
  ] as const) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className =
      'tf-btn ' +
      (value ? 'tf-true' : 'tf-false') +
      (d.value === value ? ' is-on' : '')
    btn.textContent = label
    btn.addEventListener('click', () =>
      session.setDraft({ type: 'true_false', value }),
    )
    row.append(btn)
  }
  return row
}

function renderSingle(q: SingleChoiceQuestion, draft: DraftAnswer): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'choices'
  const d =
    draft.type === 'single_choice'
      ? draft
      : { type: 'single_choice' as const, index: null }
  q.choices.forEach((text, index) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'choice' + (d.index === index ? ' is-on' : '')
    const letter = document.createElement('strong')
    letter.textContent = String.fromCharCode(97 + index) + ')'
    const span = document.createElement('span')
    span.textContent = text
    btn.append(letter, span)
    btn.addEventListener('click', () =>
      session.setDraft({ type: 'single_choice', index }),
    )
    wrap.append(btn)
  })
  return wrap
}

function renderMatching(q: MatchingQuestion, draft: DraftAnswer): HTMLElement {
  const wrap = document.createElement('div')
  const d =
    draft.type === 'matching'
      ? draft
      : {
          type: 'matching' as const,
          map: q.left.map(() => null as number | null),
        }
  q.left.forEach((left, i) => {
    const row = document.createElement('div')
    row.className = 'match-row'
    const lab = document.createElement('div')
    lab.textContent = `${i + 1}. ${left}`
    const sel = document.createElement('select')
    const blank = document.createElement('option')
    blank.value = ''
    blank.textContent = '—'
    sel.append(blank)
    q.right.forEach((right, ri) => {
      const opt = document.createElement('option')
      opt.value = String(ri)
      opt.textContent = `${String.fromCharCode(65 + ri)}. ${right}`
      if (d.map[i] === ri) opt.selected = true
      sel.append(opt)
    })
    sel.addEventListener('change', () => {
      const next = [...d.map]
      next[i] = sel.value === '' ? null : Number(sel.value)
      session.setDraft({ type: 'matching', map: next })
    })
    row.append(lab, sel)
    wrap.append(row)
  })
  return wrap
}

function renderShort(draft: DraftAnswer): HTMLElement {
  const input = document.createElement('input')
  input.className = 'short-input'
  input.type = 'text'
  input.autocomplete = 'off'
  input.placeholder = 'Scrie răspunsul…'
  const d =
    draft.type === 'short_answer'
      ? draft
      : { type: 'short_answer' as const, text: '' }
  input.value = d.text
  input.addEventListener('input', () =>
    session.setDraft(
      { type: 'short_answer', text: input.value },
      { quiet: true },
    ),
  )
  return input
}

function renderMulti(q: MultiChoiceQuestion, draft: DraftAnswer): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'choices'
  const d =
    draft.type === 'multi_choice'
      ? draft
      : { type: 'multi_choice' as const, indices: [] as number[] }
  q.choices.forEach((text, index) => {
    const label = document.createElement('label')
    label.className = 'choice' + (d.indices.includes(index) ? ' is-on' : '')
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.className = 'check'
    box.checked = d.indices.includes(index)
    box.addEventListener('change', () => {
      const set = new Set(d.indices)
      if (box.checked) set.add(index)
      else set.delete(index)
      session.setDraft({ type: 'multi_choice', indices: [...set] })
    })
    const span = document.createElement('span')
    span.textContent = `${String.fromCharCode(97 + index)}) ${text}`
    label.append(box, span)
    wrap.append(label)
  })
  return wrap
}

function renderReview(snap: SessionSnapshot): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const g = snap.lastGrade
  const q = snap.question
  const title = document.createElement('h1')
  title.className = g?.correct ? 'review-ok' : 'review-bad'
  title.textContent = g?.correct ? 'Corect!' : 'Nu e corect'
  card.append(title)

  if (q) {
    const prompt = document.createElement('p')
    prompt.className = 'prompt'
    prompt.textContent = q.prompt
    card.append(prompt)
  }

  if (q && g) card.append(renderAnswerBreakdown(q, g.draft))

  const pts = document.createElement('p')
  pts.className = 'lead'
  pts.textContent = g ? `Puncte: ${g.pointsEarned} / ${g.pointsMax}` : ''
  card.append(pts)

  if (q?.ref) {
    const refBlock = document.createElement('div')
    refBlock.className = 'ref-block'
    const ref = document.createElement('p')
    ref.className = 'ref'
    ref.textContent = `Referință: ${q.ref}`
    refBlock.append(ref)
    const text = verseTextFor(q)
    if (text) {
      const quote = document.createElement('blockquote')
      quote.className = 'ref-quote'
      quote.textContent = text
      const cite = document.createElement('p')
      cite.className = 'ref-cite'
      cite.textContent = BIBLE_EDITION
      refBlock.append(quote, cite)
    }
    card.append(refBlock)
  }

  const next = document.createElement('button')
  next.type = 'button'
  next.className = 'btn btn-primary'
  next.textContent =
    snap.index >= snap.total - 1 ? 'Vezi scorul' : 'Continuă'
  next.addEventListener('click', () => session.continueAfterReview())
  card.append(next)
  return card
}

/** Show what the player picked vs the key — especially for multi-select. */
function renderAnswerBreakdown(q: Question, draft: DraftAnswer): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'breakdown stack'

  const legend = document.createElement('p')
  legend.className = 'breakdown__legend'
  legend.textContent = 'Răspunsul tău vs. cel corect:'
  wrap.append(legend)

  switch (q.type) {
    case 'true_false': {
      const picked =
        draft.type === 'true_false' ? draft.value : null
      const rows = [
        { label: 'Adevărat', value: true },
        { label: 'Fals', value: false },
      ]
      for (const row of rows) {
        const should = q.correct === row.value
        const did = picked === row.value
        wrap.append(breakdownRow(row.label, should, did))
      }
      break
    }
    case 'single_choice': {
      const picked =
        draft.type === 'single_choice' ? draft.index : null
      q.choices.forEach((text, i) => {
        const letter = String.fromCharCode(97 + i)
        wrap.append(
          breakdownRow(
            `${letter}) ${text}`,
            i === q.correctIndex,
            picked === i,
          ),
        )
      })
      break
    }
    case 'multi_choice': {
      const picked = new Set(
        draft.type === 'multi_choice' ? draft.indices : [],
      )
      const shouldSet = new Set(q.correctIndices)
      q.choices.forEach((text, i) => {
        const letter = String.fromCharCode(97 + i)
        wrap.append(
          breakdownRow(
            `${letter}) ${text}`,
            shouldSet.has(i),
            picked.has(i),
          ),
        )
      })
      break
    }
    case 'short_answer': {
      const typed =
        draft.type === 'short_answer' ? draft.text.trim() : ''
      const you = document.createElement('p')
      you.className = 'breakdown__line'
      you.innerHTML = `<span class="breakdown__tag">Ai scris:</span> ${escapeHtml(typed || '—')}`
      const key = document.createElement('p')
      key.className = 'breakdown__line'
      key.innerHTML = `<span class="breakdown__tag">Acceptat:</span> ${escapeHtml(q.accepted.join(' / '))}`
      wrap.append(you, key)
      break
    }
    case 'matching': {
      const map =
        draft.type === 'matching' ? draft.map : q.left.map(() => null)
      q.left.forEach((left, i) => {
        const want = q.right[q.correctMap[i]!] ?? '—'
        const gotIdx = map[i]
        const got =
          gotIdx != null && gotIdx >= 0 ? (q.right[gotIdx] ?? '—') : '—'
        const ok = gotIdx === q.correctMap[i]
        const row = document.createElement('div')
        row.className = `breakdown__row ${ok ? 'is-good' : 'is-bad'}`
        row.innerHTML =
          `<strong>${escapeHtml(left)}</strong>` +
          `<span class="breakdown__detail">Ai: ${escapeHtml(got)} · Corect: ${escapeHtml(want)}</span>`
        wrap.append(row)
      })
      break
    }
  }

  return wrap
}

function breakdownRow(
  label: string,
  shouldSelect: boolean,
  didSelect: boolean,
): HTMLElement {
  const row = document.createElement('div')
  let state = 'is-neutral'
  if (shouldSelect && didSelect) state = 'is-good'
  else if (shouldSelect && !didSelect) state = 'is-miss'
  else if (!shouldSelect && didSelect) state = 'is-bad'
  row.className = `breakdown__row ${state}`
  row.innerHTML = `<span class="breakdown__label">${escapeHtml(label)}</span>`
  return row
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function verseTextFor(q: Question): string | null {
  if (q.refText?.trim()) return q.refText.trim()
  if (!q.ref || !cachedPack?.verses) return null
  const hit = cachedPack.verses[q.ref]
  return hit?.trim() ? hit.trim() : null
}

function renderEnd(snap: SessionSnapshot): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card stack'
  const h = document.createElement('h1')
  h.textContent = 'Gata!'
  card.append(h)

  const score = document.createElement('p')
  score.className = 'score-big'
  const s = snap.summary
  score.textContent = s ? `${s.total} / ${s.max}` : '—'
  card.append(score)

  const lead = document.createElement('p')
  lead.className = 'lead'
  lead.textContent =
    snap.mode === 'exam'
      ? 'Simulare Clasic — scor pe scară tip foaie de concurs.'
      : 'Exercițiu pe bibliografie — fiecare item valorează 1 punct.'
  card.append(lead)

  const actions = document.createElement('div')
  actions.className = 'row-actions'
  const again = document.createElement('button')
  again.type = 'button'
  again.className = 'btn btn-primary'
  again.textContent = 'Din nou'
  again.addEventListener('click', () => session.playAgain())
  const home = document.createElement('button')
  home.type = 'button'
  home.className = 'btn btn-secondary'
  home.textContent = 'Acasă'
  home.addEventListener('click', () => session.goHome())
  actions.append(again, home)
  card.append(actions)
  return card
}

function typeLabel(type: Question['type']): string {
  switch (type) {
    case 'true_false':
      return 'Categoria I — Adevărat / Fals'
    case 'single_choice':
      return 'Categoria II — Grilă'
    case 'matching':
      return 'Categoria III — Asociere'
    case 'short_answer':
      return 'Categoria IV — Răspuns scurt'
    case 'multi_choice':
      return 'Categoria V — Grilă multiplă'
  }
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatPhaseDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
