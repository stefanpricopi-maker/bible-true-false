# Brief — Întrebări din Biblie — Adevărat sau Fals?

Nume v1 (locked): **Întrebări din Biblie — Adevărat sau Fals?** · scurt: **Adevărat sau Fals?** · vezi [`docs/decisions/product-name.md`](decisions/product-name.md). Alias intern: Bible True/False Kids Quiz.

## Ce este

Aplicație pentru copii: întrebări de cultură biblică cu răspuns **Adevărat / Fals**, interacțiune prin **audio**, puncte pe baza răspunsurilor.

## Cum joacă (v1 — locked)

- 2 jucători pe **același device** (telefon sau tabletă).
- Aplicația redă audio pentru întrebarea curentă (și eventual feedback după răspuns).
- Copilul alege Adevărat sau Fals.
- Se acordă puncte; se ține scorul pe jucător.
- Conținutul de întrebări + fișiere audio sunt parte din produs (sau încărcate local).
- **Fără text obligatoriu pe butoanele de joc** — jocul trebuie să poată fi jucat de copii care **nu știu să citească**, doar prin audio + culori.
- **Runde (3):**  
  - **R1** — pe rând, 10 întrebări (P1↔P2), +1 corect / 0 greșit sau timeout.  
  - **R2** — buzz pe pătratul de culoare; +2 corect; greșit/timeout după claim → +1 adversar; fără buzz → 0.  
  - **R3** — aceeași întrebare: P1 răspunde, apoi P2 (**fără spoil**); apoi VO „Răspunsul este adevărat/fals”; +1 fiecăruia corect; timeout = 0.

### Culori UI (locked)

| Rol | Culoare |
|-----|---------|
| Adevărat | **Verde** |
| Fals | **Roșu** |
| Jucători | Aleg din paletă la setup — **fără default**; culori **exclusive** |

Scorul, tura activă și răspunsurile se comunică vizual prin aceste culori (și prin audio), nu prin etichete text pe butoanele principale.

## Ce NU e v1

- Multi-device / sync între telefoane-tablete (**post-v1**).
- Mai mult de 2 jucători simultan pe același ecran.
- Conturi, cloud obligatoriu, sau generare AI de întrebări live (nedecis; nu blochează v1).

## Experiență (intenție)

- UI mare, clar: buton **verde** = Adevărat, buton **roșu** = Fals; zone / markere **albastru** / **galben** pentru cei doi jucători.
- Audio: playback pe întrebare + pe feedback (corect / greșit / rândul următor) — audio poartă instrucțiunile, nu textul pe ecran.
- Limbă: **necunoscut** — româna e o inferență rezonabilă, neconfirmată în repo.
- Accesibilitate (recomandare): pe lângă culoare, poziție/formă distinctă pe butoane (fără text), ca sprijin pentru daltonism — fără a cere citit.

## Extindere (după v1)

- Același joc pe mai multe device-uri (telefon + tabletă), sincronizare de rundă / scor.

## Necunoscute deschise

- Nume produs: **Întrebări din Biblie — Adevărat sau Fals?** (locked).
- Platformă (web / PWA / native).
- Sursa audio (fișiere locale bundled vs CDN).
- Cine editează setul de întrebări (JSON hardcodat vs admin).
- Vârsta țintă, număr inițial de întrebări, reguli de egalitate / rundă / ture.

## Constrângeri pentru agenți

- Nu importa faze, roluri sau stack din 2Wheel Tracker sau mobilcab-cad.
- Separă mereu: fapte / inferențe / recomandări / necunoscute / blockers.
- Fără cod de aplicație până la go din merge-ul orchestratorului.
