# Brief photo, Nice-Matin Academy

Document de commande des visuels du site. Chaque entrée contient le nom de
fichier attendu, le format technique, et un prompt prêt à copier dans un
générateur d'images.

25 images au total, réparties en cinq priorités. Les priorités 1 et 2 portent
à elles seules la moitié de l'effet : commencez par là.

---

## Contexte à donner en préambule

À coller une fois en début de conversation avec le générateur, avant les
prompts individuels.

```
Je produis une série de photographies pour la plateforme d'entraînement
commercial interne du groupe de presse Nice-Matin, sur la Côte d'Azur.
L'outil sert à entraîner des commerciaux qui vendent des abonnements au
journal.

Direction artistique commune à toutes les images :
- photographie documentaire réaliste, jamais publicitaire ni posée
- lumière naturelle méditerranéenne, plutôt fin de matinée
- palette froide dominée par les bleus et les gris, aucune dominante orange
  ou sépia
- tenues professionnelles sobres, personnes d'âges et d'origines variés
- expressions naturelles, aucun sourire commercial forcé
- aucun texte lisible dans l'image : pas de journal déchiffrable, pas
  d'enseigne, pas d'écran affichant une interface
- profondeur de champ courte, arrière-plans calmes et peu chargés
- pas de flash direct, pas de rendu HDR, pas de saturation excessive
```

---

## Charte technique

Livraison en **JPEG qualité 85**, plus une version **WebP** si votre outil le
permet. Les fichiers vont dans `public/images/`, en respectant exactement
l'arborescence indiquée.

| Contrainte | Valeur |
|---|---|
| Espace colorimétrique | sRGB |
| Poids maximum par image | 800 Ko en JPEG |
| Texte incrusté | aucun |
| Filigrane | aucun |

---

## Priorité 1 : Julie Dupont, la cliente virtuelle

Julie est le personnage que le commercial affronte en visioconférence. Elle est
décrite dans l'application comme **une trentaine d'années, cadre à Nice, lectrice
occasionnelle**. Son portrait est aujourd'hui un dessin vectoriel de repli.

**Contrainte de cohérence** : les quatre images doivent montrer la même
personne, avec la même coiffure, la même tenue et la même lumière. Générez la
première, puis demandez les suivantes en référence explicite à celle-ci
("la même femme que l'image précédente, même tenue, même coiffure").

### `julie-dupont.jpg`
Portrait 3:4, 1200 × 1600 minimum.

```
Portrait photographique d'une femme française d'une trentaine d'années, cadre urbaine,
cheveux châtains mi-longs, chemisier bleu marine sobre. Cadrage buste, regard
vers l'objectif, expression neutre et attentive, ni souriante ni fermée.
Arrière-plan d'intérieur contemporain flou, tons gris et bleus. Lumière
naturelle latérale douce venant d'une fenêtre. Photographie réaliste,
profondeur de champ courte, format portrait vertical 3:4.
```

### `julie-dupont-sceptique.jpg`
Portrait 3:4, 1200 × 1600 minimum.

```
La même femme que l'image précédente, même coiffure, même chemisier bleu
marine, même arrière-plan et même lumière. Cette fois son expression est
sceptique : sourcils légèrement froncés, tête très légèrement inclinée, main
posée près du menton. Elle évalue ce qu'on lui dit sans hostilité. Cadrage
buste, format portrait vertical 3:4.
```

### `julie-dupont-ouverte.jpg`
Portrait 3:4, 1200 × 1600 minimum.

```
La même femme que les images précédentes, même coiffure, même chemisier bleu
marine, même arrière-plan et même lumière. Expression détendue et réceptive,
léger sourire naturel, épaules relâchées, posture ouverte. Cadrage buste,
format portrait vertical 3:4.
```

### `julie-dupont-contexte.jpg`
Paysage 16:9, 2000 × 1125 minimum.

```
La même femme que les images précédentes, vue en plan large dans son
intérieur, assise à une table devant un ordinateur portable en
visioconférence. Elle occupe le tiers droit du cadre, les deux tiers gauches
restent calmes et peu chargés. L'écran de l'ordinateur n'est pas lisible.
Lumière naturelle de fenêtre, palette froide, format paysage 16:9.
```

---

## Priorité 2 : les six commerciaux de l'équipe

Côté manager, l'équipe n'est aujourd'hui qu'une série d'initiales dans des
pastilles colorées. Six visages changeraient toute la page.

**Contrainte de cohérence** : cadrage identique sur les six, même distance,
même hauteur d'yeux, même type de fond. Ils s'affichent côte à côte dans un
tableau, la moindre différence d'échelle se verra.

Tous en **carré 1:1, 800 × 800 minimum**, dans `public/images/equipe/`.

### `equipe/alexandre-jego.jpg`
```
Portrait photographique carré d'un homme français d'environ 35 ans, commercial
terrain, chemise claire sans cravate. Cadrage buste serré, regard vers
l'objectif, expression professionnelle détendue. Fond uni gris clair
légèrement bleuté. Lumière de studio douce et frontale. Photographie
réaliste, format carré 1:1.
```

### `equipe/sofia-benali.jpg`
```
Portrait photographique carré d'une femme d'environ 40 ans, d'origine
maghrébine, commerciale expérimentée, veste sombre sobre. Cadrage buste serré
identique au portrait précédent, même distance et même hauteur d'yeux, regard
vers l'objectif, expression assurée et posée. Fond uni gris clair légèrement
bleuté, même lumière de studio douce et frontale. Format carré 1:1.
```

### `equipe/thomas-riviere.jpg`
```
Portrait photographique carré d'un homme d'environ 30 ans, commercial terrain,
pull fin bleu marine. Cadrage buste serré identique aux portraits précédents,
même distance et même hauteur d'yeux, regard vers l'objectif, expression
ouverte et attentive. Fond uni gris clair légèrement bleuté, même lumière de
studio douce et frontale. Format carré 1:1.
```

### `equipe/claire-fabre.jpg`
```
Portrait photographique carré d'une femme d'environ 25 ans, commerciale
sédentaire en début de carrière, chemisier clair. Cadrage buste serré
identique aux portraits précédents, même distance et même hauteur d'yeux,
regard vers l'objectif, expression concentrée et un peu réservée. Fond uni
gris clair légèrement bleuté, même lumière de studio douce et frontale.
Format carré 1:1.
```

### `equipe/karim-oualid.jpg`
```
Portrait photographique carré d'un homme d'environ 45 ans, commercial terrain
expérimenté, chemise bleue et veste sombre. Cadrage buste serré identique aux
portraits précédents, même distance et même hauteur d'yeux, regard vers
l'objectif, expression calme et posée. Fond uni gris clair légèrement bleuté,
même lumière de studio douce et frontale. Format carré 1:1.
```

### `equipe/elodie-marchand.jpg`
```
Portrait photographique carré d'une femme d'environ 50 ans, commerciale
sédentaire confirmée, cheveux courts, blazer gris. Cadrage buste serré
identique aux portraits précédents, même distance et même hauteur d'yeux,
regard vers l'objectif, expression bienveillante et sûre d'elle. Fond uni gris
clair légèrement bleuté, même lumière de studio douce et frontale. Format
carré 1:1.
```

---

## Priorité 3 : les huit fiches méthodologiques

Ce sont les pages les plus denses en texte du site. Une bande photo en tête de
chaque fiche les transformerait.

**Contrainte de composition commune** : format **paysage 21:9, 2400 × 1030
minimum**, sujet décentré vers la droite, **moitié gauche volontairement
calme**. Le titre de la fiche viendra s'y poser en blanc sur un voile marine.
Aucun visage ne doit occuper la moitié gauche.

Fichiers dans `public/images/fiches/`.

### `fiches/premier-contact.jpg`
```
Photographie documentaire en plan large : sur le pas d'une porte
d'appartement, un commercial se présente à une habitante. Vue de trois quarts,
distance respectueuse entre les deux personnes, aucun contact physique. Les
personnes occupent le tiers droit du cadre, la moitié gauche reste calme et
peu chargée. Lumière naturelle de jour, palette froide et sobre. Format
panoramique 21:9.
```

### `fiches/creation-relation.jpg`
```
Photographie documentaire : deux personnes assises face à face dans un salon,
en conversation détendue. L'une écoute attentivement l'autre, posture penchée
vers elle. Elles occupent le tiers droit du cadre, la moitié gauche reste
calme et peu chargée. Lumière naturelle de fenêtre, palette froide. Format
panoramique 21:9.
```

### `fiches/decouverte-besoins.jpg`
```
Photographie documentaire : une personne pose une question à une autre,
penchée en avant, mains ouvertes, expression attentive. L'autre réfléchit
avant de répondre. Les deux occupent le tiers droit du cadre, la moitié gauche
reste calme. Lumière naturelle douce, palette froide. Format panoramique 21:9.
```

### `fiches/presentation-offre.jpg`
```
Photographie documentaire : deux personnes assises à une table, l'une montre
du doigt un document posé entre elles, l'autre le regarde. Le document n'est
pas lisible. Elles occupent le tiers droit du cadre, la moitié gauche reste
calme. Lumière naturelle, palette froide. Format panoramique 21:9.
```

### `fiches/gestion-objections.jpg`
```
Photographie documentaire : un désaccord calme entre deux personnes assises,
sans conflit ni tension visible. L'une lève légèrement la main dans un geste
de pause, l'autre écoute sans se braquer. Elles occupent le tiers droit du
cadre, la moitié gauche reste calme. Lumière naturelle, palette froide.
Format panoramique 21:9.
```

### `fiches/communication.jpg`
```
Photographie documentaire en plan rapproché : les mains de deux personnes en
conversation, gestes d'explication, au premier plan net, visages hors champ ou
flous à l'arrière. Le sujet occupe le tiers droit du cadre, la moitié gauche
reste calme. Lumière naturelle, palette froide. Format panoramique 21:9.
```

### `fiches/creation-confiance.jpg`
```
Photographie documentaire : deux personnes se serrent la main à la fin d'un
échange, debout, expressions détendues et sincères. Elles occupent le tiers
droit du cadre, la moitié gauche reste calme. Lumière naturelle de fin de
matinée, palette froide. Format panoramique 21:9.
```

### `fiches/conclusion.jpg`
```
Photographie documentaire : une personne signe un document sur une table
basse, une autre attend à côté sans presser. Le document n'est pas lisible.
Elles occupent le tiers droit du cadre, la moitié gauche reste calme. Lumière
naturelle, palette froide. Format panoramique 21:9.
```

---

## Priorité 4 : les images d'ouverture

Fichiers dans `public/images/hero/`.

### `hero/connexion.jpg`
Portrait 3:4, 1600 × 2133 minimum. Passera sous un voile marine à 80 %, donc
la composition doit rester lisible une fois très assombrie.

```
Photographie de la salle de rédaction d'un quotidien régional, vue en plongée
légère, format vertical. Bureaux, écrans éteints ou flous, personnes floues au
loin. Composition simple avec de grandes zones calmes, contrastes marqués pour
rester lisible une fois l'image fortement assombrie. Palette froide, bleus et
gris. Aucun texte lisible. Format portrait vertical 3:4.
```

### `hero/commercial.jpg`
Paysage 21:9, 2400 × 1030 minimum. Sert de fond très discret derrière du texte
blanc, doit rester presque une texture.

```
Photographie très peu contrastée d'un bureau de travail vu de très près,
presque abstraite : surfaces, matières, reflets doux. Aucun sujet identifiable,
aucun visage. Palette bleu marine profond et gris. Image volontairement calme
et sombre, destinée à passer derrière du texte blanc. Format panoramique 21:9.
```

### `hero/manager.jpg`
Paysage 21:9, 2400 × 1030 minimum. Même usage côté manager.

```
Photographie très peu contrastée d'une salle de réunion vide vue de loin,
presque abstraite : table, chaises, lumière rasante. Aucun visage. Palette bleu
marine profond et gris. Image volontairement calme et sombre, destinée à
passer derrière du texte blanc. Format panoramique 21:9.
```

### `hero/simulation.jpg`
Paysage 16:9, 2000 × 1125 minimum.

```
Photographie d'un poste de travail préparé pour une visioconférence, vu de
côté et légèrement en plongée : ordinateur portable ouvert, webcam, casque
audio posé à côté, chaise vide. Personne dans le cadre. L'écran n'est pas
lisible. Lumière naturelle de fenêtre, palette froide. Format paysage 16:9.
```

---

## Priorité 5 : vignettes et états vides

### Vignettes des raccourcis
Carré 1:1, 800 × 800 minimum, dans `public/images/vignettes/`.

**`vignettes/fiches.jpg`**
```
Photographie en plongée verticale de fiches imprimées posées en désordre léger
sur un bureau clair, avec un stylo. Le texte des fiches n'est pas lisible.
Lumière naturelle douce, palette froide, composition simple. Format carré 1:1.
```

**`vignettes/qcm.jpg`**
```
Photographie en plongée des mains d'une personne cochant un questionnaire
papier avec un stylo. Le questionnaire n'est pas lisible. Visage hors champ.
Lumière naturelle douce, palette froide. Format carré 1:1.
```

**`vignettes/simulation.jpg`**
```
Photographie vue de dos d'une personne assise devant un écran d'ordinateur en
visioconférence, épaules et nuque au premier plan, écran flou et non lisible.
Lumière naturelle, palette froide. Format carré 1:1.
```

### États vides
Paysage 3:2, 1200 × 800 minimum, dans `public/images/etats/`. Ces images
occupent une zone où il ne se passe rien : elles doivent être très épurées et
laisser beaucoup de vide.

**`etats/aucune-simulation.jpg`**
```
Photographie minimaliste : un casque audio posé à côté d'un écran éteint sur un
bureau vide et rangé. Beaucoup d'espace vide dans le cadre, composition très
épurée. Lumière naturelle douce, palette froide, tons clairs. Format paysage
3:2.
```

**`etats/aucune-notification.jpg`**
```
Photographie minimaliste d'un bureau parfaitement rangé et vide, vu de haut :
une surface claire, un objet unique posé de côté. Beaucoup d'espace vide.
Lumière naturelle douce, palette froide, tons clairs. Format paysage 3:2.
```

**`etats/aucun-resultat.jpg`**
```
Photographie minimaliste : une loupe posée sur une feuille vierge, sur un
bureau clair. Beaucoup d'espace vide dans le cadre. Lumière naturelle douce,
palette froide, tons clairs. Format paysage 3:2.
```

---

## Récapitulatif

| Priorité | Images | Effet attendu |
|---|---|---|
| 1 | 4 portraits de Julie | Le personnage central cesse d'être un dessin |
| 2 | 6 portraits de l'équipe | La vue manager passe des initiales aux visages |
| 3 | 8 bandeaux de fiches | Les pages les plus austères prennent vie |
| 4 | 4 images d'ouverture | Les entrées de parcours cessent d'être des aplats |
| 5 | 6 vignettes et états vides | Les zones creuses se remplissent |

---

## Deux points à trancher

**Photo ou illustration.** Ce brief part sur de la photographie. Une direction
illustrée reste possible, mais il faudrait la tenir sur les 25 images. Les
rendus de type croquis ou dessin à main levée sont à éviter : ils font
amateur dès qu'on les mélange à une interface soignée.

**Les visages.** Sept personnes reconnaissables apparaîtront dans l'outil.
Si ce sont des visages générés, il n'y a rien à faire. S'il s'agit de vraies
personnes, il faut leur accord écrit avant toute mise en ligne.

## Ce qui sera fait à réception

Chaque image sera câblée à son emplacement avec `next/image` : formats
modernes, tailles adaptatives, chargement différé hors du premier écran. Un
repli propre s'affichera si un fichier manque, chaque visuel recevra un texte
alternatif rédigé, et la lisibilité du texte posé sur les voiles marine sera
vérifiée.
