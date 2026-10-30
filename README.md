# 🎯 RetroHjulet

> **Smidig retrospektiv med individuelt stresshjul, sanntidssynkronisering og KI-syntetisert edderkoppdiagram.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express & WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-026e00?style=flat-square&logo=node.js&logoColor=white)](https://github.com/websockets/ws)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📖 Om RetroHjulet

**RetroHjulet** er et interaktivt verktøy designet for agile team, Scrum Masters og Team Leads som ønsker mer struktur, ærlighet og dypere innsikt under sprint-retrospektiver.

I stedet for tradisjonelle lapper (Start/Stop/Continue) fokuserer RetroHjulet på **opplevd friksjon og stress (1–10)** fordelt på fargekodede emnekategorier. Gjennom 4 strukturerte faser samles teamets tilbakemeldinger, diskuteres én etter én, og syntetiseres ved hjelp av **Google Gemini AI** til et felles edderkoppdiagram (radar chart) med konkrete handlingspunkter for neste sprint.

---

## 🚀 De 4 Retrospektiv-fasene

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌────────────────────────┐
│  1. Stresshjul  │ ──> │ 2. Felles status │ ──> │ 3. Presentasjon   │ ──> │ 4. Edderkoppdiagram    │
│  Individuelt    │     │ Oversikt i sanntid│    │ En-og-en gjennomgang│   │ KI-analyse & radar     │
└─────────────────┘     └──────────────────┘     └───────────────────┘     └────────────────────────┘
```

### 1. 🎡 Individuelt Stresshjul (Input)
* Kvar deltakar legg inn påstandar og nøkkelord på sitt eige hjul. Innspela er synlege for dei som har tilgang til tavla.
* Hvert punkt gis en **stress-score fra 1 til 10** (1 = minimal friksjon, 10 = kritisk blocker).
* Punktene knyttes til emnekategorier (f.eks. *Arbeidsflyt & Prosess*, *Teknologi & Verktøy*, *Samarbeid*, *Kapasitet & Tidsfrister*, *Mål & Prioriteringer*, *Kvalitet & Testing*).
* Deltakeren ser sitt eget sirkulære stresshjul vokse i sanntid før de markerer seg som ferdig.

### 2. 👥 Felles status (Team Status)
* Team Lead og teamet ser en felles oversikt over hvem som er tilkoblet og hvem som har fullført sitt hjul.
* Live gjennomsnittlig stressnivå for sprinten.
* Visuell konfetti-feiring når hele teamet er i mål! 🎉

### 3. 🎙️ Presentasjon & Fasilitering
* Møteleder fasiliterer en fokusert samtale deltaker for deltaker.
* Interaktivt stresshjul der kakestykker kan klikkes for å fremheve konkrete påstander.
* Påstander sorteres automatisk etter høyest stress først (🚨).
* **Møtestøtte-sjekkliste:** Avhukingsbokser for å markere hvilke temaer som er ferdig drøftet, slik at ingenting blir glemt.

### 4. 🕸️ KI-syntese & Edderkoppdiagram (Spider Chart)
* **Google Gemini AI** analyserer alle teamets påstander på tvers av deltakere.
* Grupperer like erfaringer i overordnede aksekategorier og beregner gjennomsnittlig stressvekt.
* Interaktivt **edderkoppdiagram (radar)** der kritiske fokusområder (score ≥ 6.5) fremheves (begrenset til 2 milde pulseringer for å unngå visuell støy).
* Automatisk generert **oppsummering, hovedfunn og konkrete anbefalinger/tiltak** for neste sprint.

---

## ✨ Nøkkelfunksjoner

- **Sanntidssamarbeid (WebSockets):** Alle endringer på tavlen synkroniseres umiddelbart på tvers av nettleserne til alle tilkoblede teammedlemmer.
- **Tavle-ID-er:** Automatisk generering av delingskoder og direktelenker. ID-en er ikkje tilgangskontroll; alle som kjenner han kan lese og endre tavla.
- **Lokal historikk på enhet:** Rask tilgang til nylig brukte tavler på enheten, med mulighet for å fjerne enkelttavler eller tømme historikken.
- **Innebygd Demo-modus:** Prøv ut hele flyten med ferdigutfylte data for Sprint 42 (uten at demoen forurenser tavlehistorikken).
- **Eksport og Arkivering:**
  - 📄 **PDF-rapport:** Komplett retrospektiv-oppsummering for deling på Slack, Confluence eller e-post (drevet av `jsPDF`).
  - 💾 **JSON-backup:** Eksporter hele tavledataene til fil for sikkerhetskopiering eller re-import senere.
  - ☁️ **Google Disk:** Last ned JSON-fila og opne Google Drive for manuell opplasting eller del fila via nettlesaren si delingsmeny.
- **Tilpassbare kategorier:** Opprett, rediger og fargekod egne kategorier tilpasset teamets fagområder.
- **Flerspråklig (i18n):** Full støtte for **Norsk bokmål**, **Nynorsk** og **Engelsk**.
- **Mørk / Lys drakt:** Automatisk eller manuell veksling mellom mørk og lys modus.

---

## 🛠️ Teknologistakk

| Lag | Teknologi |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Canvas Confetti |
| **Backend & Server** | Node.js, Express, `ws` (WebSockets), `tsx` |
| **Kunstig Intelligens** | Google Gemini API (`@google/genai` via eit server-endepunkt) |
| **Eksport** | jsPDF, SVG-rendering for diagrammer |
| **Lagring** | Lokal nettleser-lagring (`localStorage`) + WebSocket minne-cache på server |

---

## 📦 Komme i gang lokalt

### Forutsetninger
* [Node.js](https://nodejs.org/) versjon 22.12 eller nyare (npm følgjer med Node.js)
* Ein [Gemini API-nøkkel](https://aistudio.google.com/) (valfri; lokal fallback fungerer utan nøkkel)

### Installasjon

1. **Klon repoet:**
   ```bash
   git clone https://github.com/OWNER/stresshjul-retro.git
   cd stresshjul-retro
   ```

2. **Installer avhengigheter:**
   ```bash
   npm ci
   ```

3. **Konfigurer miljøvariabler:**
   Kopier eksempelfilen:
   ```bash
   cp .env.example .env
   ```
   Gemini-nøkkel er valfri. Utan nøkkel brukar analysen lokal gruppering. For KI-analyse, fyll inn nøkkelen i `.env`:
   ```env
   GEMINI_API_KEY="din-gemini-api-nøkkel"
   PORT=3000
   ```

4. **Start utviklingsserveren:**
   ```bash
   npm run dev
   ```
   Applikasjonen kjører på `http://localhost:3000`.

---

## 📜 Tilgjengelige Scripts

* `npm run dev`: Startar Express- og Vite-utviklingsserveren med Hot Reload og WebSockets.
* `npm run build`: Byggjer frontend med Vite.
* `npm run start`: Startar serveren. I produksjon blir bygde filer frå `dist/` servert.
* `npm run lint`: Køyrer TypeScript-typekontroll.
* `npm run clean`: Slettar byggmappa (`dist/`).

### Produksjon på eigen server

Bygg først prosjektet med `npm ci` og `npm run build`. Start deretter serveren med `NODE_ENV=production PORT=3000 npm run start` (juster porten etter behov). Set `GEMINI_API_KEY` som miljøvariabel berre dersom KI-analyse skal bruke Google Gemini. Nøkkelen blir brukt på serversida og skal aldri leggjast i frontend eller committast.

Bruk HTTPS via ein reverse proxy, og konfigurer proxyen til å støtte WebSocket-oppgraderingar på `/ws`. Serveren lagrar tavler berre i minnet; dei blir borte ved omstart.

---

## 📂 Prosjektstruktur

```text
├── src/
│   ├── components/            # UI-komponenter for alle faser og modaler
│   │   ├── LandingPage.tsx           # Forside, tavletilgang, opprettelse og historikk
│   │   ├── ParticipantInputView.tsx  # Fase 1: Deltaker input & stresshjul
│   │   ├── TeamStatusView.tsx        # Fase 2: Sanntidsoversikt over teamet
│   │   ├── PresentationView.tsx      # Fase 3: Gjennomgang med møtestøtte
│   │   ├── SpiderAnalysisView.tsx    # Fase 4: KI-syntese og handlingsplan
│   │   ├── SpiderChart.tsx           # SVG-basert interaktivt edderkoppdiagram
│   │   ├── StressWheel.tsx           # SVG-basert stresshjul med kakestykker
│   │   ├── ExportModal.tsx           # PDF- og JSON-eksport
│   │   ├── ImportModal.tsx           # Re-import av tidligere JSON-retrospektiver
│   │   └── ManageCategoriesModal.tsx # Administrasjon av emnekategorier
│   ├── context/               # React kontekst (f.eks. ThemeContext)
│   ├── hooks/                 # Egendefinerte hooks (useRetroWebSocket m.fl.)
│   ├── i18n/                  # Språkstøtte (Bokmål, Nynorsk, Engelsk)
│   ├── types/                 # TypeScript type-definisjoner (RetroBoard, Claim, etc.)
│   ├── utils/                 # Hjelpefunksjoner for lagring, PDF-generering og AI
│   ├── App.tsx                # Hovedapplikasjon og ruting mellom faser
│   └── main.tsx               # Entry point
├── server.ts                  # Express backend, WebSocket server & Gemini API proxy
├── package.json
└── README.md
```

---

## 🔒 Personvern og Sikkerhet

* Gemini-nøkkelen blir berre brukt frå serveren. Utan nøkkel brukar appen lokal gruppering.
* Når Gemini er konfigurert, sender analyseførespurnaden tavletittel, deltakarnamn og retrospektivinnspel til Google Gemini.
* Tavler blir lagra i nettlesaren sin `localStorage` og i serverminnet. Serverminnet blir tømt ved omstart; appen har ikkje varig lagring eller backup på serveren.
* Denne versjonen har ikkje tilgangskontroll for tavler. Alle som kjenner eller finn ein tavle-ID kan lese og endre tavla. Ikkje bruk tenesta for konfidensielle HR-data eller andre sensitive personopplysningar, og ikkje tilby henne ope på internett før tilgangskontroll og misbruksvern er på plass.

---

## 🤝 Bidrag

Bidrag tas imot med takk!
1. Fork prosjektet
2. Opprett en feature branch (`git checkout -b feature/fantastisk-funksjon`)
3. Commit endringene dine (`git commit -m 'Legg til fantastisk funksjon'`)
4. Push til branchen (`git push origin feature/fantastisk-funksjon`)
5. Åpne en Pull Request

---

## 📄 Lisens

Prosjektet er utvikla med hjelp frå generativ KI. Prosjektet gjer ikkje krav på eineeige til KI-genererte delar. MIT-lisensen gjeld berre delar som dei respektive menneskelege bidragsytarane har rett til å lisensiere. Tredjepartsmateriale følgjer sine eigne lisensar.

Sjå [LICENSE](LICENSE) for lisensvilkåra.
