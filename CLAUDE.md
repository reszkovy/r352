# CLAUDE.md — repo r352 (betterguide.pl)

## Kontekst

Repo `reszkovy/r352` → Vercel → **betterguide.pl**. Statyczne HTML, bez frameworka i build-stepu.
Każdy plik to samodzielna strona. Deploy = `git push`, Vercel wdraża w ~30 s.

Właściciel: Reszek (BetterWorkplace). Mów językiem biznesu: przychód, marża, lejek, konwersja.
Nie żargonem kreatywnym. Bez ogólników, konkret i mierzalność.

## Główne pliki

| Plik | Co to |
|---|---|
| `index.html` | hub / rozdzielnia projektów |
| `tb-landing-v3.html` | **produkcyjny landing TeamBudget** |
| `tb-landing-2026-07-28.html` | wariant landingu po feedbacku (claim w hero + sekcja Platforma) |
| `tb-hasla.html` | kierunki komunikacji ATF, zakładki Propozycja v1 / v2 |
| `tb-strategia-komunikacji.html` | pełna strategia (~460 KB, sekcje 00–10) |
| `tb-kalkulator.html` | „Puls kultury" — narzędzie kampanijne, poza lejkiem www |
| `design-system.html`, `tokens.css` | design system i zmienne |
| `cms.html`, `api/` | panel CMS + endpointy |

**NIE modyfikować:** `BW_Strategia_Klient_v2.html` (poza repo, w folderze roboczym).

## Brand book — twarde reguły

Kolory (są w `tokens.css`):

- Pale White `#FFFBF4` — tło
- Pale Black `#473A39` — tekst podstawowy
- Blue Sky `#4375FF` — kolor wiodący, **także typografia** (h1/h2/lead na niebiesko)
- Orange `#FE692B` — akcent, mono-etykiety, checki
- Deep Yellow `#FDA33C`, Pale Green `#15A477` — **wyłącznie naklejki-etykiety** (relacje / sprawczość), nigdy jako tło czy tekst
- Sunny White `#FEF3DE` — tylko tła KV / kart podglądu

Typografia: **Pangram Sans** (nagłówki), **DM Sans** (body), **DM Mono** tylko UPPERCASE z letter-spacingiem.

Motywy KV: ghost-pattern sygnetu, zdjęcia cięte kształtem sygnetu (`clip-path #tbPetal`, scale 0.0131), system naklejek (`badge.svg`–`badge4.svg`).

## Reguły copy

- Język klienta, nie wewnętrzny. „Zespół dostaje budżet na wspólne śniadania", nie „system operacyjny kultury zespołowej".
- **Zero em-dashów** w treściach. Dwukropek, kropka albo przecinek.
- `text-wrap: balance` na nagłówkach, `pretty` na akapitach; nbsp po spójnikach jednoliterowych (w, i, a, z, o, u).
- Prosto, ale odważnie. Bez żargonu HR (engagement, wellbeing, benefity doświadczeniowe).

## Rdzeń komunikacji (stan 28.07.2026)

**Hasło master:** „Kulturę firmy budują zespoły."

**Komunikaty narzędziowe** (4 finałowe, wybierany jeden do lockupu logo + hasło + komunikat):
Pierwszy budżet w rękach zespołu · Budżet zespołu na wspólne chwile · Budżet, który dostaje zespół · Budżet, którym zarządza zespół

**Kategoria:** budżet zespołowy. Benefit jest dla pracownika, TeamBudget dla zespołu.
**Zakres:** wyłącznie wewnątrz firmy (śniadania, przekąski, celebracje z dostawą). Żadnych wyjazdów.
**Persony:** Head of People (kupuje) i Team Leader (używa). CFO tylko jako argumentacja, nie adresat.
**Lejek www:** signup-first — landing prowadzi wyłącznie do zapisu na pilotaż, kontakt w 72 h. Kalkulator i audyt 45 min to narzędzia kampanijne / handlowca, nie www.

## Workflow

Zmiana → walidacja → commit → push. Vercel sam wdroży.

```bash
git add <pliki> && git commit -m "opis" && git push
```

Po każdej edycji pliku z inline `<script>` **zwaliduj składnię**, zanim zacommitujesz:

```bash
node -e "
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(process.argv[1],'utf8');
[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach(m=>vm.compileFunction(m[1]));
console.log('scripts OK');
" plik.html
```

Weryfikacja live: `https://betterguide.pl/<nazwa>?v=N` (parametr omija cache).

Edycje punktowe rób Edit-em albo pythonowym string-replace z assertem — pliki bywają duże (strategia ~460 KB), nie przepisuj ich w całości.

## Klony i historia

Kanoniczny klon: `~/Projekty/r352` (od 16.08.2026). Stary folder `~/Desktop/Claude_zadania/BetterWorkplace/r352-deploy` jest przestarzały (110 commitów w tyle) — nie edytować, nie deployować z niego.

Pliki wgrywane wcześniej przez przeglądarkę mają miejscami mojibake w polskich znakach (np. komentarze w `api/cms-content.js`) — poprawiać przy okazji edycji, nie masowo.

## Długi techniczne

1. **Formularz pilotażu nie ma backendu** — leady nigdzie nie lecą. Priorytet #1, blokuje kontraktowanie pilotaży.
2. **Obrazy hotlinkowane z CDN Higgsfield** (`d8j0ntlcm91z4.cloudfront.net`) — do przeniesienia do repo, linki mogą wygasnąć.
3. Brak OG-image pod udostępnianie w mailingu.

## Otwarte decyzje

- Wybór jednego komunikatu narzędziowego (z Łukaszem).
- Master klasyczny vs narracja odwrócona („Pierwszy budżet dla zespołu." jako H1, master jako domknięcie).
- Przeniesienie wariantu `tb-landing-2026-07-28` do `tb-landing-v3` po akceptacji.
