# Script audio — de la pornire până la finalul Rundei 1

Limbă: **română**. Destinație: **ElevenLabs** (voce caldă, clară, pentru copii; ritm moderat).

**Notă conținut biblic:** textele de întrebări de mai jos sunt **draft pentru înregistrare / prototip**. Înainte de release, trec prin review de acuratețe. Feedback-urile și VO-ul de sistem pot fi folosite ca atare.

**Convenții UI (spuse în audio, nu pe butoane):**
- Verde = Adevărat · Roșu = Fals  
- Jucătorul își alege culoarea (implicit: unul albastru, celălalt galben; pot alege și roz / mov)  
- În script, după alegere, VO-ul folosește **numele culorii alese**. Variantele de mai jos acoperă: albastru, galben, roz, mov.

---

## Cum folosești în ElevenLabs

1. Generează **câte un clip pe fișier** (coloana „Fișier sugerat”).
2. Export: MP3 sau WAV, mono, ~44.1 kHz.
3. Pentru feedback, poți genera **o singură dată** `correct` / `incorrect` și le refolosești la toate întrebările.
4. Pentru handoff, generează **4 variante** (câte una pe culoare) sau o variantă generică „e rândul următorului jucător” dacă vrei mai puține clipuri.

---

## Hartă flow (Runda 1)

```text
[0] Pornire app / ecran culori
[1] Ambii aleg culoarea → UI crescut
[2] Intro rundă 1
[3] Loop × 10 (alternativ J1, J2, J1, J2…):
      handoff culoare activă
      → întrebare
      → (copilul apasă verde/roșu)
      → feedback corect SAU greșit
[4] Sfârșit rundă 1 → pauză / anunț rundă 2
```

Ordinea întrebărilor: **1=J1, 2=J2, 3=J1, 4=J2, 5=J1, 6=J2, 7=J1, 8=J2, 9=J1, 10=J2**.

---

## A. VO de sistem (înainte de întrebări)

### A1 — Bun venit + instrucțiuni culori (la deschiderea ecranului de setup)

**Fișier:** `vo/welcome-setup.mp3`

```text
Bun venit la jocul Întrebări din Biblie - Adevărat sau Fals? Sunteți doi jucători. Fiecare trebuie să alegeți o culoare, apăsând pe un pătrat colorat. În cercul din mijloc Verde înseamnă adevărat iar Roșu înseamnă fals. Când amândoi ați ales culoarea, jocul începe.
```

### A2 — (Opțional) Reminder scurt dacă stau pe ecran

**Fișier:** `vo/setup-nudge.mp3`

```text
Alege-ți culoarea. Apoi așteaptă-l pe prietenul tău.
```

### A3 — Jocul începe (după ce ambii au ales culoarea)

**Fișier:** `vo/game-start.mp3`

```text
Gata! Hai să jucăm. Runda unu. Fiecare răspunde la cinci întrebări. Verde e adevărat, roșu e fals.
```

### A4 — Intro Runda 1 (poate fi lipit de A3 sau separat)

**Fișier:** `vo/round-1-start.mp3`

```text
Runda unu. Începem!
```

---

## B. Handoff — „e rândul tău” (înaintea fiecărei întrebări)

Generează **toate variantele** de culoare pe care le poate avea jucătorul activ.

| Fișier | Text |
|--------|------|
| `feedback/next-turn-albastru.mp3` | E rândul jucătorului albastru. |
| `feedback/next-turn-galben.mp3` | E rândul jucătorului galben. |
| `feedback/next-turn-roz.mp3` | E rândul jucătorului roz. |
| `feedback/next-turn-mov.mp3` | E rândul jucătorului mov. |

**Variantă scurtă (opțională, aceeași pentru toți):**

| Fișier | Text |
|--------|------|
| `feedback/next-turn.mp3` | E rândul tău! |

**În Runda 1, ordinea handoff-urilor (dacă J1=albastru, J2=galben — exemplu tipic):**

1. albastru → Q1  
2. galben → Q2  
3. albastru → Q3  
4. galben → Q4  
5. albastru → Q5  
6. galben → Q6  
7. albastru → Q7  
8. galben → Q8  
9. albastru → Q9  
10. galben → Q10  

*(Înainte de Q1 poți folosi handoff + „prima întrebare” sau doar A3/A4 + Q1.)*

**Opțional — prima întrebare specială:**

**Fișier:** `vo/first-question-cue.mp3`

```text
Prima întrebare. Ascultă cu atenție.
```

---

## C. Feedback după răspuns (reutilizabil)

| Fișier | Text | Când |
|--------|------|------|
| `feedback/correct.mp3` | Bravo! Ai răspuns corect. | Răspuns = adevărul afirmației |
| `feedback/incorrect.mp3` | Greșit! Nu-i nimic! Răspunzi mai bine data viitoare! | Răspuns greșit |

**Variante mai scurte (SFX + VO scurt):**

| Fișier | Text |
|--------|------|
| `feedback/correct-short.mp3` | Corect! |
| `feedback/incorrect-short.mp3` | Greșit. |

---

## D. Întrebările Rundei 1 (10×)

Format pe clip: **doar afirmația** (copilul alege adevărat/fals). Nu spune „adevărat sau fals?” la finalul fiecăreia dacă vrei clipuri scurte — sau adaugă linia comună de mai jos.

**Linie comună (opțională, la finalul fiecărei întrebări):**

```text
Adevărat sau fals?
```

Poți: (a) o include în fiecare clip de întrebare, sau (b) un fișier separat `vo/prompt-tf.mp3` lipit după întrebare în app.

### D1 — Jucător 1

**Fișier:** `audio/q001-question.mp3` · **Răspuns corect: ADEVĂRAT**

```text
Noe a construit o arcă mare, ca să salveze familia lui și animalele de potop.
Adevărat sau fals?
```

### D2 — Jucător 2

**Fișier:** `audio/q002-question.mp3` · **Răspuns corect: FALS**

```text
Iona a fost înghițit de un elefant.
Adevărat sau fals?
```

### D3 — Jucător 1

**Fișier:** `audio/q003-question.mp3` · **Răspuns corect: ADEVĂRAT**

```text
David era un păstor și mai târziu a devenit rege.
Adevărat sau fals?
```

### D4 — Jucător 2

**Fișier:** `audio/q004-question.mp3` · **Răspuns corect: FALS**

```text
Moise a despărțit apele Mării Negre.
Adevărat sau fals?
```

### D5 — Jucător 1

**Fișier:** `audio/q005-question.mp3` · **Răspuns corect: ADEVĂRAT**

```text
Isus a hrănit o mulțime de oameni cu pâini și pești.
Adevărat sau fals?
```

### D6 — Jucător 2

**Fișier:** `audio/q006-question.mp3` · **Răspuns corect: FALS**

```text
Adam și Eva au locuit într-un castel de aur.
Adevărat sau fals?
```

### D7 — Jucător 1

**Fișier:** `audio/q007-question.mp3` · **Răspuns corect: ADEVĂRAT**

```text
Daniel a fost aruncat în groapa leilor, dar Dumnezeu l-a ocrotit.
Adevărat sau fals?
```

### D8 — Jucător 2

**Fișier:** `audio/q008-question.mp3` · **Răspuns corect: FALS**

```text
Iosif a avut o haină cu o singură culoare: negru.
Adevărat sau fals?
```

### D9 — Jucător 1

**Fișier:** `audio/q009-question.mp3` · **Răspuns corect: ADEVĂRAT**

```text
Maria a fost mama lui Isus.
Adevărat sau fals?
```

### D10 — Jucător 2

**Fișier:** `audio/q010-question.mp3` · **Răspuns corect: FALS**

```text
Corabia lui Noe a plutit pe un râu mic, lângă casă.
Adevărat sau fals?
```

---

## E. Timeline vorbită — flow complet Runda 1 (exemplu cu Albastru + Galben)

Copiază în ordine în ElevenLabs ca **playlist de verificare**, sau folosește ca checklist la montaj.

| # | Moment | Fișier | Text (rezumat) |
|---|--------|--------|----------------|
| 1 | App deschisă | `welcome-setup` | Bun venit… alegeți culoarea… verde/roșu… |
| 2 | (copiii aleg — fără audio obligatoriu) | — | — |
| 3 | Ambii au ales | `game-start` | Gata! Hai să jucăm… |
| 4 | Înainte Q1 | `next-turn-albastru` sau `first-question-cue` | E rândul jucătorului albastru. / Prima întrebare… |
| 5 | Q1 | `q001-question` | Noe a construit… |
| 6 | După răspuns | `correct` **sau** `incorrect` | Bravo!… / Greșit! Nu-i nimic!… |
| 7 | Înainte Q2 | `next-turn-galben` | E rândul jucătorului galben. |
| 8 | Q2 | `q002-question` | Iona… elefant… |
| 9 | Feedback | `correct` / `incorrect` | … |
| 10 | Înainte Q3 | `next-turn-albastru` | … |
| 11 | Q3 | `q003-question` | David… |
| 12 | Feedback | … | … |
| 13 | Înainte Q4 | `next-turn-galben` | … |
| 14 | Q4 | `q004-question` | Moise… Marea Neagră… |
| 15 | Feedback | … | … |
| 16 | Înainte Q5 | `next-turn-albastru` | … |
| 17 | Q5 | `q005-question` | Isus… pâini și pești… |
| 18 | Feedback | … | … |
| 19 | Înainte Q6 | `next-turn-galben` | … |
| 20 | Q6 | `q006-question` | Adam și Eva… castel… |
| 21 | Feedback | … | … |
| 22 | Înainte Q7 | `next-turn-albastru` | … |
| 23 | Q7 | `q007-question` | Daniel… lei… |
| 24 | Feedback | … | … |
| 25 | Înainte Q8 | `next-turn-galben` | … |
| 26 | Q8 | `q008-question` | Iosif… haină neagră… |
| 27 | Feedback | … | … |
| 28 | Înainte Q9 | `next-turn-albastru` | … |
| 29 | Q9 | `q009-question` | Maria… |
| 30 | Feedback | … | … |
| 31 | Înainte Q10 | `next-turn-galben` | … |
| 32 | Q10 | `q010-question` | Corabia… râu mic… |
| 33 | Feedback | … | … |
| 34 | Sfârșit rundă 1 | `round-break` | vezi F |

---

## F. Final Runda 1 → trecere la Runda 2

**Fișier:** `feedback/round-break.mp3`

```text
Runda unu s-a terminat! Acum urmează runda doi. Sunteți gata?
```

**Variantă mai scurtă:**

```text
Bravo! Runda doi începe acum.
```

**Variantă cu scor (dacă vrei VO dinamic — atunci 2 clipuri separate + numere, sau un singur generic):**

```text
Runda unu s-a terminat. Hai la runda doi!
```

---

## G. Listă scurtă — doar texte, copy-paste rapid în ElevenLabs

### Sistem
1. `Bun venit la jocul Întrebări din Biblie - Adevărat sau Fals? Sunteți doi jucători. Fiecare trebuie să alegeți o culoare, apăsând pe un pătrat colorat. În cercul din mijloc Verde înseamnă adevărat iar Roșu înseamnă fals. Când amândoi ați ales culoarea, jocul începe.`
2. `Gata! Hai să jucăm. Runda unu. Fiecare răspunde la cinci întrebări. Verde e adevărat, roșu e fals.`
3. `Runda unu. Începem!`
4. `Prima întrebare. Ascultă cu atenție.`
5. `E rândul jucătorului albastru.`
6. `E rândul jucătorului galben.`
7. `E rândul jucătorului roz.`
8. `E rândul jucătorului mov.`
9. `Bravo! Ai răspuns corect.`
10. `Greșit! Nu-i nimic! Răspunzi mai bine data viitoare!`
11. `Runda unu s-a terminat! Acum urmează runda doi. Sunteți gata?`

### Întrebări R1
12. `Noe a construit o arcă mare, ca să salveze familia lui și animalele de potop. Adevărat sau fals?`
13. `Iona a fost înghițit de un elefant. Adevărat sau fals?`
14. `David era un păstor și mai târziu a devenit rege. Adevărat sau fals?`
15. `Moise a despărțit apele Mării Negre. Adevărat sau fals?`
16. `Isus a hrănit o mulțime de oameni cu pâini și pești. Adevărat sau fals?`
17. `Adam și Eva au locuit într-un castel de aur. Adevărat sau fals?`
18. `Daniel a fost aruncat în groapa leilor, dar Dumnezeu l-a ocrotit. Adevărat sau fals?`
19. `Iosif a avut o haină cu o singură culoare: negru. Adevărat sau fals?`
20. `Maria a fost mama lui Isus. Adevărat sau fals?`
21. `Corabia lui Noe a plutit pe un râu mic, lângă casă. Adevărat sau fals?`

---

## H. Setări ElevenLabs recomandate

- **Stability:** medie-sus (clar pentru copii)  
- **Style / exaggeration:** redus  
- **Speaker boost:** on, dacă e disponibil  
- Evită pauze lungi între propoziții; pauze scurte după „Ascultă cu atenție.”  
- Același voice ID pentru tot flow-ul (coerență)

---

## I. Ce lipsește încă din app (de cablat după generare)

App-ul actual folosește beep-uri. După ElevenLabs, mapează:

| Clip | Unde în app |
|------|-------------|
| `welcome-setup` | la intrarea în setup (nou) |
| `game-start` | faza `armed` → start |
| `next-turn-*` | faza `nextTurn` (în funcție de culoarea activă) |
| `q001`…`q010` | `packs/demo-v1/audio/` |
| `correct` / `incorrect` | `packs/demo-v1/feedback/` |
| `round-break` | după Q10, înainte de runda 2 |
