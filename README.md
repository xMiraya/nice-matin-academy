This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Appel Tavus — intégration vidéo et langue

### Intégration vidéo

`/commercial/appel` n'utilise plus l'interface **Daily Prebuilt** (iframe
cross-origin, donc impossible à styler : barre blanche, boutons People / Share /
Speaker view, nom technique de la salle visible).

L'appel passe désormais par le mode **call object** de `@daily-co/daily-js`
(`app/commercial/appel/TavusVideoStage.tsx`). Daily ne fournit que les pistes
média ; toute l'interface appartient à Nice-Matin Academy : cadre 16:9, fond
sombre, vignette locale discrète en bas à droite, plein écran, et uniquement les
contrôles maison (microphone, caméra, terminer l'appel).

CSP et `Permissions-Policy` (`next.config.ts`) délèguent caméra et micro à la
machine d'appel Daily (`c.daily.co`) et autorisent les workers `blob:`.

### Langue et accent

`POST /api/tavus/conversations` envoie `properties.language: "french"` (jamais
`"multilingual"`), doublé d'une consigne de langue dans
`conversational_context`.

**Limite importante :** `language` garantit la *langue*, pas le *timbre* ni
l'*accent*. Si la voix associée au PAL Tavus est anglophone, Julie parlera
français avec un accent anglais. Supprimer complètement cet accent exige une
**voix native française** (Tavus, ElevenLabs ou Cartesia) attachée au PAL — un
changement de configuration du PAL publié, pas un correctif applicatif.

Le repli actuel reste **Tavus Auto**, stable.

### Variables d'environnement

Obligatoires : `TAVUS_API_KEY`, `TAVUS_PAL_ID`, `TAVUS_FACE_ID`, `OPENAI_API_KEY`.

Facultatives, pour une future voix française native (serveur uniquement, jamais
`NEXT_PUBLIC_`) — voir `src/lib/tavus/voice.ts` :

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_MODEL_ID` (défaut `eleven_flash_v2_5`)

Tant qu'elles sont absentes, rien n'est activé automatiquement.

