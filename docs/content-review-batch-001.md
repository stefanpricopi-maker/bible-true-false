# Review conținut — batch-001 (100 întrebări)

**Dată:** 2026-09-12  
**Sursă:** [`content/batch-001.json`](../content/batch-001.json)  
**Nivel:** povești biblice familiare, True/False, copii  
**Metodă:** fiecare afirmație verificată pe narațiunea biblică standard (Geneza–Apocalipsa), plus ton / claritate T/F pentru copii. Nu e semnare pastorală oficială; e review de acuratețe a poveștii.

## Verdict

**Setul poate rămâne în joc.** Nicio întrebare nu are cheia `correct` inversată. 50 adevărate / 50 false (impar = adevărat, par = fals).

Trei texte au fost retușate la review (q036, q076, q091). Restul e OK la nivel de cultură biblică pentru copii.

## Fapte

- 100 de itemi, `q001`–`q100`, locale `ro`.
- Afirmațiile **adevărate** urmează povești clasice (potop, David și Goliat, nașterea, învierea, etc.).
- Afirmațiile **false** sunt de două feluri: (a) anacronisme evidente (înghețată, bicicletă, avion) — ușor de respins fără citit; (b) confuzii de poveste (Marea Neagră vs Roșie, Betleem vs Golgota) — predau prin contrast.
- Tonul evită teologie controversată; Răstignirea/Învierea sunt formulate scurt, potrivit vârstei.
- După retușuri, `reviewStatus` în JSON nu mai e PLACEHOLDER.

## Inferențe

- Itemii falși „silite” (ciocolată, role, submarin) sunt intenționate pentru pre-literați: copiii pot marca Fals din bun-simț, nu din exegeză.
- q033 zice „casă mare” pentru templul lui Dagon — simplificare de copii, nu eroare.
- q091 „a scris mulți psalmi” e tradiția copiilor (mulți psalmi atribuiți lui David), nu o afirmație academică despre autorul fiecărui psalm.

## Probleme găsite (rezolvate în JSON)

| ID | Problemă | Retuș |
|----|----------|--------|
| **q036** | Două pretenții odată („o singură dată” + „la bătrânețe”) — puțin capcană | „Samuel a auzit vocea lui Dumnezeu abia când era bătrân.” (tot fals: a auzit ca băiat, 1 Sam 3) |
| **q076** | „în Ierusalim” e neclar: înălțarea e de pe Muntele Măslinilor, lângă cetate (Fapte 1:12) | Scos locul; rămâne pretinderea falsă „în fața soldaților romani” |
| **q091** | Acord greșit: „multe psalmi” | „mulți psalmi” |

Audio-ul existent pentru aceste 3 ID-uri **nu mai corespunde** textului. Regenerare:

```bash
npm run gen:questions -- --force --ids q036,q076,q091
npm run sync:batch
```

## Observații (fără schimbare de text)

| ID | Notă |
|----|------|
| q004 | Contrast bun RO: Marea **Neagră** vs **Roșie**. Nu există item adevărat „Moise a despărțit Marea Roșie” — gol pentru un batch viitor, nu e greșeală. |
| q033 | „Casă mare” = templul/palatul filistenilor (Jud. 16). OK pentru copii. |
| q048 | Idolul/cuptorul e povestea celor trei prieteni (Dan 3); Daniel 6 e groapa leilor. Afirmația rămâne corect **falsă**. |
| q057 | Nu spune „trei magi” — doar cele trei daruri. Corect față de Matei 2. |
| q061 | Petru a mers puțin pe apă, apoi s-a scufundat. „A încercat” e potrivit. |
| q082 / q084 / q052 | Barnaba, Apocalipsa, Neemia apar doar ca falși. Copiii necunoscători ghicesc din detaliul absurd. Acceptabil; un adevărat pereche ar ajuta într-un batch următor. |
| q100 | Mai abstract (cer nou / pământ nou). Falsul e totuși clar: „fără Dumnezeu”. |

## Recomandări

1. Regenerat MP3 pentru **q036, q076, q091**, apoi spot-check față de `promptText`.
2. Semnare pastorală/părinte opțională pe 10 itemi random înainte de a pretinde „conținut verificat teologic” în magazin.
3. Batch următor: un adevărat pentru Marea Roșie; perechi adevărate pentru Neemia, Barnaba, Ioan / Apocalipsa.

## Necunoscute / nu blochează

- Semnătura unui pastor anume sau a unei confesiuni.
- Vârsta țintă exactă (setul e „povești familiare”, nu catehism).

## Cheie pe item

A = afirmația trebuie marcată Adevărat · F = Fals · OK = cheie + text în regulă.

| ID | Cheie | Verdict | Referință / de ce |
|----|-------|---------|-------------------|
| q001 | A | OK | Gen 6–8 |
| q002 | F | OK | pește mare / chit, nu rechin (Iona 1) |
| q003 | A | OK | 1 Sam 16–17; 2 Sam 5 |
| q004 | F | OK | Marea Roșie, nu Neagră (Ex 14) |
| q005 | A | OK | Mt 14; In 6 |
| q006 | F | OK | Eden, nu castel |
| q007 | A | OK | Dan 6 |
| q008 | F | OK | haina pestriță / de preț (Gen 37), nu negru |
| q009 | A | OK | Mt 1; Lc 1–2 |
| q010 | F | OK | potop, nu râu lângă casă |
| q011 | A | OK | Gen 1–2 (textul biblic: șase zile + odihnă) |
| q012 | F | OK | țărână, nu ciocolată (Gen 2) |
| q013 | A | OK | Gen 2 |
| q014 | F | OK | rodul pomului oprit, nu o pară (Gen 3) |
| q015 | A | OK | Gen 4 |
| q016 | F | OK | din toate soiurile, nu doar pisici/câini (Gen 6–7) |
| q017 | A | OK | Gen 9 |
| q018 | F | OK | cărămidă/smoală, nu fier (Gen 11) |
| q019 | A | OK | Gen 12 |
| q020 | F | OK | Sara ≠ sora lui Moise |
| q021 | A | OK | Gen 21 |
| q022 | F | OK | doisprezece fii (Gen 35:22–26) |
| q023 | A | OK | Gen 37; 39 |
| q024 | F | OK | vaci/spice, nu ploi de aur (Gen 41) |
| q025 | A | OK | Ex 2 |
| q026 | F | OK | rug aprins, nu copac de plastic (Ex 3) |
| q027 | A | OK | Ex 20; Deut 5 |
| q028 | F | OK | pe uscat prin mare, nu cu bicicleta |
| q029 | A | OK | Ex 16 |
| q030 | F | OK | trâmbițe / ocolirea zidurilor (Ios 6) |
| q031 | A | OK | Ios 1 |
| q032 | F | OK | nazireu / părul, nu „numai miere” (Jud 13–16) |
| q033 | A | OK | Jud 16 — „casă” = templul filistean |
| q034 | F | OK | a cules la Betleem, lângă Naomi (Rut 2) |
| q035 | A | OK | Rut 1:16–17 |
| q036 | F | retuș | auzit ca băiat, de mai multe ori (1 Sam 3) |
| q037 | A | OK | 1 Sam 16 |
| q038 | F | OK | praștie, nu sabie de lemn (1 Sam 17) |
| q039 | A | OK | 1 Sam 17 |
| q040 | F | OK | Saul vs filisteni, nu prieten cu Goliat |
| q041 | A | OK | 1 Împ 3; 2 Sam 12:24 |
| q042 | F | OK | piatră/lemn/aur, nu sticlă |
| q043 | A | OK | 1 Împ 18 |
| q044 | F | OK | car de foc, nu autobuz (2 Împ 2) |
| q045 | A | OK | 1 Împ 19; 2 Împ 2 |
| q046 | F | OK | corabie, nu avion (Iona 1) |
| q047 | A | OK | Iona 1–3 |
| q048 | F | OK | n-a slujit idolul ca să scape |
| q049 | A | OK | Dan 3 |
| q050 | F | OK | Persia / Suza, nu planetă-jucărie |
| q051 | A | OK | Est 4–8 |
| q052 | F | OK | ziduri de piatră (Neh 2–6) |
| q053 | A | OK | Mt 3; Mc 1 |
| q054 | F | OK | iesle, nu palat (Lc 2) |
| q055 | A | OK | Mt 2; Lc 2 |
| q056 | F | OK | îngeri, nu soldați romani (Lc 2) |
| q057 | A | OK | Mt 2:11 |
| q058 | F | OK | tâmplar, nu pilot (Mt 13:55) |
| q059 | A | OK | Mt 3 |
| q060 | F | OK | pe apă, fără role (Mt 14) |
| q061 | A | OK | Mt 14:22–33 |
| q062 | F | OK | a vindecat și săraci / leproși |
| q063 | A | OK | evanghelii |
| q064 | F | OK | mort patru zile, nu 100 de ani (In 11) |
| q065 | A | OK | In 11 |
| q066 | F | OK | doisprezece apostoli |
| q067 | A | OK | cercul apropiat (Mt 17; Mc 5, 9) |
| q068 | F | OK | aproapele include pe străin (Lc 10) |
| q069 | A | OK | Mt 22:39; Mc 12:31 |
| q070 | F | OK | cu ucenicii (Mt 26) |
| q071 | A | OK | Mt 26; Lc 22 |
| q072 | F | OK | Golgota lângă Ierusalim, nu Betleem |
| q073 | A | OK | evanghelii; 1 Cor 15 |
| q074 | F | OK | mormânt gol; arătări |
| q075 | A | OK | Lc 24; In 20–21 |
| q076 | F | retuș | Fapte 1: ucenicii, Muntele Măslinilor |
| q077 | A | OK | Fapte 2 |
| q078 | F | OK | a prigonit biserica, apoi s-a schimbat (Fapte 8–9) |
| q079 | A | OK | Fapte 9 |
| q080 | F | OK | epistole către biserici, nu doar Tars |
| q081 | A | OK | Fapte 13–28 |
| q082 | F | OK | Barnaba = încurajator din Cipru (Fapte 4, 11, 13) |
| q083 | A | OK | Fapte 16; 1–2 Tim |
| q084 | F | OK | Ioan, Patmos — nu Moise (Apoc 1) |
| q085 | A | OK | In 3:16; 1 In 4 |
| q086 | F | OK | rugăciunea include laudă, mulțumire, alții |
| q087 | A | OK | In 4; Mt 6 |
| q088 | F | OK | Ex 20:15 înseamnă opusul |
| q089 | A | OK | Ex 20:12 |
| q090 | F | OK | harpă pentru Saul / psalmi, nu pentru Goliat |
| q091 | A | retuș | 1 Sam 16; psalmi atribuiți lui David; acord „mulți” |
| q092 | F | OK | după cum beau apa (Jud 7) |
| q093 | A | OK | Jud 7 (300) |
| q094 | F | OK | pe acoperiș, sub in (Ios 2) |
| q095 | A | OK | Ios 2 |
| q096 | F | OK | inima împietrită + plăgi (Ex 5–12) |
| q097 | A | OK | Ex 7–12 |
| q098 | F | OK | s-a rugat la Silo (1 Sam 1) |
| q099 | A | OK | 1 Sam 1 |
| q100 | F | OK | Apoc 21: Dumnezeu locuiește cu oamenii |
