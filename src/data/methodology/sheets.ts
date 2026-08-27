import { competencies } from '@/src/data/methodology/competencies';
import type { Competency, CompetencySlug, MethodologySheet } from '@/src/types/methodology';

/**
 * Contenu pédagogique des huit fiches.
 * Règle absolue : aucune offre, aucun prix, aucune condition commerciale inventée.
 * Les éléments commerciaux sont écrits sous forme de placeholders entre crochets
 * et recensés dans docs/CONTENUS-A-VALIDER.md.
 */

const UPDATED_AT = '2026-08-17';

type SheetBody = Omit<MethodologySheet, keyof Competency | 'updatedAt'>;

const bodies: Record<CompetencySlug, SheetBody> = {
  'premier-contact': {
    objective: 'Obtenir en moins d’une minute l’autorisation de poursuivre l’échange.',
    readingMinutes: 4,
    validationStatus: 'a-valider',
    stakes: [
      'Le prospect doit savoir qui vous êtes et pourquoi vous êtes là.',
      'Les vingt premières secondes décident de la suite de l’entretien.',
      'Résultat recherché : un accord explicite pour continuer.',
    ],
    methodSteps: [
      {
        order: 1,
        phase: 'Action',
        title: 'Annoncer son identité',
        detail: 'Nom, Groupe Nice-Matin, motif de la visite, en deux phrases.',
      },
      {
        order: 2,
        phase: 'Observation',
        title: 'Lire la disponibilité',
        detail: 'Porte entrouverte, regard, ton de voix, activité en cours.',
      },
      {
        order: 3,
        phase: 'Adaptation',
        title: 'Ajuster la durée annoncée',
        detail: 'Proposer un temps court et réaliste, ou un autre moment.',
      },
      {
        order: 4,
        phase: 'Validation',
        title: 'Demander l’accord',
        detail: 'Une question fermée simple qui autorise la suite.',
      },
    ],
    goodReflexes: [
      'Se présenter avant de parler de l’abonnement.',
      'Sourire et garder une posture ouverte, à bonne distance.',
      'Annoncer une durée et la respecter.',
      'Laisser un silence après la présentation.',
      'Accepter un « pas maintenant » sans insister.',
    ],
    phrasesToUse: [
      'Bonjour, je suis [prénom], du Groupe Nice-Matin.',
      'Je passe dans le quartier pour parler du journal, avez-vous deux minutes ?',
      'Je ne vous dérange pas longtemps, je vous explique en deux mots.',
      'Si le moment est mal choisi, dites-le-moi simplement.',
    ],
    phrasesToAvoid: [
      'Commencer par un monologue.',
      'Parler du prix avant de s’être présenté.',
      'Poser un pied dans l’entrée.',
      'Enchaîner sans laisser répondre.',
      'Insister après un refus clair.',
    ],
    usefulQuestions: [
      'Est-ce que je tombe au bon moment ?',
      'Vous connaissez déjà Nice-Matin ?',
      'Je vous explique brièvement pourquoi je passe ?',
      'Préférez-vous que je repasse plus tard dans la semaine ?',
    ],
    fieldScenario: {
      context: 'Fin d’après-midi, le prospect ouvre la porte, un téléphone à la main.',
      prospectReaction: '« Je suis en pleine conversation, là. »',
      poorResponse: 'Enchaîner quand même sur la présentation de l’abonnement.',
      betterResponse: '« Je comprends, je repasse dans vingt minutes ou demain, ce qui vous arrange. »',
      why: 'Respecter la disponibilité crée une deuxième chance ; forcer la ferme définitivement.',
    },
    checklist: [
      'Le prospect a-t-il compris qui je suis ?',
      'Ai-je identifié sa disponibilité ?',
      'Ai-je annoncé une durée courte ?',
      'M’a-t-il donné un premier signe d’intérêt ?',
      'Puis-je poursuivre naturellement ?',
    ],
    masteryLevels: [
      { name: 'À travailler', behaviour: 'Le commercial récite son introduction sans regarder le prospect.' },
      { name: 'En progression', behaviour: 'Il se présente clairement mais oublie de demander l’accord.' },
      { name: 'Maîtrisé', behaviour: 'Il obtient naturellement l’autorisation de poursuivre.' },
    ],
    trainerTip: {
      text: 'Avant de sonner, respirez une fois et décidez de votre première phrase. Une entrée calme vaut mieux qu’une entrée rapide.',
      validationStatus: 'a-valider',
    },
  },

  'creation-relation': {
    objective: 'Transformer un échange autorisé en conversation que le prospect a envie de poursuivre.',
    readingMinutes: 4,
    validationStatus: 'a-valider',
    stakes: [
      'Le premier contact ouvre la porte, la relation donne envie de rester.',
      'Un climat cordial fait baisser la méfiance avant toute question.',
      'Résultat recherché : le prospect parle de lui spontanément.',
    ],
    methodSteps: [
      {
        order: 1,
        phase: 'Action',
        title: 'Personnaliser l’échange',
        detail: 'Utiliser son nom, rebondir sur ce qu’il vient de dire.',
      },
      {
        order: 2,
        phase: 'Observation',
        title: 'Repérer le registre du prospect',
        detail: 'Bavard ou pressé, chaleureux ou réservé, familier ou distant.',
      },
      {
        order: 3,
        phase: 'Adaptation',
        title: 'Aligner son ton',
        detail: 'Se caler sur son rythme et son niveau de formalité.',
      },
      {
        order: 4,
        phase: 'Validation',
        title: 'Vérifier le confort',
        detail: 'Un signe simple : il répond par des phrases, plus par des mots.',
      },
    ],
    goodReflexes: [
      'Retenir et réutiliser le prénom ou le nom donné.',
      'Rebondir sur un détail que le prospect a mentionné.',
      'Garder le contact visuel sans fixer.',
      'Laisser la conversation respirer avant d’enchaîner.',
      'Montrer une présence réelle : ranger son téléphone, poser sa sacoche.',
      'Reconnaître ce qu’il dit avant de passer à autre chose.',
    ],
    phrasesToUse: [
      'Vous m’avez dit que vous habitiez ici depuis longtemps, c’est bien ça ?',
      'Je comprends, beaucoup de personnes me disent la même chose.',
      'Merci de prendre le temps, ce n’est pas si fréquent.',
      'On peut en parler simplement, sans engagement.',
    ],
    phrasesToAvoid: [
      'Réciter le même échauffement à chaque porte.',
      'Feindre un intérêt visible pour la décoration.',
      'Tutoyer sans y avoir été invité.',
      'Enchaîner sur l’offre dès la première réponse.',
      'Répondre à côté de ce qu’il vient de dire.',
    ],
    usefulQuestions: [
      'Vous êtes du quartier depuis longtemps ?',
      'Vous suivez l’actualité locale plutôt le matin ou le soir ?',
      'C’est un sujet qui vous parle ?',
      'Je peux vous poser deux ou trois questions avant d’aller plus loin ?',
    ],
    fieldScenario: {
      context: 'Le prospect a accepté d’écouter mais reste sur le pas de la porte, bras croisés.',
      prospectReaction: '« Allez-y, mais je vous préviens, je ne lis plus grand-chose. »',
      poorResponse: '« Justement, c’est pour ça que je suis là ! » puis enchaîner l’argumentaire.',
      betterResponse: '« D’accord. Qu’est-ce qui a changé, vous lisiez avant ? »',
      why: 'Reprendre ses mots et lui donner la parole détend la posture ; l’argumentaire la fige.',
    },
    checklist: [
      'Ai-je utilisé au moins une information qu’il m’a donnée ?',
      'Le ton est-il devenu plus détendu qu’au début ?',
      'Ses réponses sont-elles plus longues qu’un simple oui ou non ?',
      'Ai-je résisté à l’envie d’enchaîner trop vite ?',
    ],
    masteryLevels: [
      { name: 'À travailler', behaviour: 'Il applique le même échange type à toutes les portes.' },
      { name: 'En progression', behaviour: 'Il personnalise le début puis retombe dans son script.' },
      { name: 'Maîtrisé', behaviour: 'Le prospect prolonge la conversation de lui-même.' },
    ],
    trainerTip: {
      text: 'La relation se joue sur ce que vous faites du premier détail donné. Notez-le mentalement, il servira à la conclusion.',
      validationStatus: 'a-valider',
    },
  },

  'decouverte-besoins': {
    objective: 'Comprendre les habitudes et les motivations du foyer avant de parler d’une offre.',
    readingMinutes: 5,
    validationStatus: 'a-valider',
    stakes: [
      'Sans découverte, la présentation devient un catalogue.',
      'Les besoins réels apparaissent dans les habitudes, pas dans les réponses toutes faites.',
      'Résultat recherché : deux ou trois besoins reformulés et confirmés.',
    ],
    methodSteps: [
      {
        order: 1,
        phase: 'Action',
        title: 'Ouvrir avec une question large',
        detail: 'Une seule question, ouverte, sur les habitudes d’information.',
      },
      {
        order: 2,
        phase: 'Observation',
        title: 'Repérer usages et freins',
        detail: 'Papier ou numérique, seul ou en foyer, temps disponible.',
      },
      {
        order: 3,
        phase: 'Adaptation',
        title: 'Creuser le sujet porteur',
        detail: 'Suivre le thème qui fait parler : sport, local, culture, économie.',
      },
      {
        order: 4,
        phase: 'Validation',
        title: 'Reformuler et faire confirmer',
        detail: '« Si je résume… c’est bien cela ? » avant toute proposition.',
      },
    ],
    goodReflexes: [
      'Poser une question à la fois.',
      'Laisser trois secondes de silence après la question.',
      'Reprendre les mots exacts du prospect.',
      'Noter mentalement les sujets d’intérêt cités.',
      'Distinguer ce qui l’intéresse de ce qui intéresse le foyer.',
      'Reformuler avant de conclure la phase.',
    ],
    phrasesToUse: [
      'Comment vous informez-vous sur ce qui se passe ici ?',
      'Qu’est-ce que vous regardez en premier, d’habitude ?',
      'Si je comprends bien, c’est surtout le local qui vous intéresse.',
      'Qu’est-ce qui vous manque aujourd’hui dans ce que vous lisez ?',
      'Il y a d’autres lecteurs à la maison ?',
    ],
    phrasesToAvoid: [
      'Enchaîner trois questions d’affilée.',
      'Poser des questions fermées en série.',
      'Interpréter à la place du prospect.',
      'Passer à l’offre dès la première réponse.',
      'Reformuler en déformant pour orienter la réponse.',
    ],
    usefulQuestions: [
      'Vous lisez plutôt sur papier ou sur téléphone ?',
      'À quel moment de la journée vous prenez le temps de lire ?',
      'Quels sujets vous font ouvrir un article ?',
      'Qu’est-ce qui vous a fait arrêter, si vous avez déjà été abonné ?',
      'Qu’est-ce qui compterait le plus pour vous ?',
    ],
    fieldScenario: {
      context: 'Le prospect répond volontiers mais reste en surface.',
      prospectReaction: '« Je regarde un peu les infos, comme tout le monde. »',
      poorResponse: '« Donc vous êtes intéressé par l’actualité générale, j’ai ce qu’il vous faut. »',
      betterResponse: '« Un peu les infos, c’est-à-dire ? Plutôt le national ou ce qui se passe dans la commune ? »',
      why: 'La demande de précision fait apparaître un besoin réel ; l’interprétation en invente un.',
    },
    checklist: [
      'Ai-je posé au moins trois questions ouvertes ?',
      'Ai-je identifié un usage concret, papier ou numérique ?',
      'Ai-je repéré un frein exprimé ?',
      'Ai-je reformulé et obtenu une confirmation ?',
    ],
    masteryLevels: [
      { name: 'À travailler', behaviour: 'Il enchaîne les questions sans écouter les réponses.' },
      { name: 'En progression', behaviour: 'Il pose de bonnes questions mais ne reformule pas.' },
      { name: 'Maîtrisé', behaviour: 'Le prospect confirme lui-même le besoin reformulé.' },
    ],
    trainerTip: {
      text: 'Si vous ne pouvez pas citer deux besoins avec les mots du prospect, la découverte n’est pas finie.',
      validationStatus: 'a-valider',
    },
  },

  'presentation-offre': {
    objective: 'Relier chaque élément présenté à un besoin exprimé, sans réciter le catalogue.',
    readingMinutes: 5,
    validationStatus: 'a-valider',
    stakes: [
      'On ne présente pas tout : on présente ce qui répond au besoin identifié.',
      'Un bénéfice compris vaut mieux que trois avantages énumérés.',
      'Résultat recherché : le prospect reformule ce qu’il a compris.',
    ],
    methodSteps: [
      {
        order: 1,
        phase: 'Action',
        title: 'Choisir une seule offre',
        detail: 'Celle qui correspond au besoin reformulé. [Offre à confirmer par l’équipe formation]',
      },
      {
        order: 2,
        phase: 'Observation',
        title: 'Surveiller les signes de compréhension',
        detail: 'Hochement, question précise, regard qui décroche.',
      },
      {
        order: 3,
        phase: 'Adaptation',
        title: 'Simplifier ou détailler',
        detail: 'Réduire à l’essentiel si le prospect décroche, préciser s’il questionne.',
      },
      {
        order: 4,
        phase: 'Validation',
        title: 'Faire reformuler',
        detail: '« Ce que je vous propose, c’est clair pour vous ? »',
      },
    ],
    goodReflexes: [
      'Partir du besoin cité, puis présenter l’élément qui y répond.',
      'Annoncer le plan : ce que c’est, ce que ça change, combien de temps.',
      'Une idée par phrase.',
      'Donner les conditions au même moment que le contenu. [Conditions à confirmer]',
      'Vérifier la compréhension avant de continuer.',
    ],
    phrasesToUse: [
      'Vous m’avez dit que le local comptait pour vous : je vous montre ce qui correspond.',
      'Je vous explique en trois points, puis vous me dites ce que vous en pensez.',
      'Concrètement, ça veut dire que [bénéfice à confirmer].',
      'Sur les conditions et le tarif, je vous donne les éléments exacts : [à confirmer].',
      'Est-ce que c’est clair jusque-là ?',
    ],
    phrasesToAvoid: [
      'Réciter son argumentaire en entier.',
      'Empiler les avantages sans lien avec le besoin.',
      'Annoncer un prix ou une promotion non validés.',
      'Utiliser du vocabulaire interne ou marketing.',
      'Parler sans jamais s’arrêter pour vérifier.',
    ],
    usefulQuestions: [
      'Sur ce point précis, ça vous parle ?',
      'Qu’est-ce qui vous serait le plus utile là-dedans ?',
      'Vous voulez que je détaille une partie en particulier ?',
      'Il y a un point qui n’est pas clair ?',
    ],
    fieldScenario: {
      context: 'Le prospect a exprimé un intérêt pour l’actualité de sa commune.',
      prospectReaction: '« Et il y a quoi dedans, exactement ? »',
      poorResponse: 'Dérouler la liste complète des contenus et des formules.',
      betterResponse: '« Je commence par la partie locale, c’est ce qui vous intéresse. Ensuite je vous donne le reste si vous voulez. »',
      why: 'Une présentation ciblée reste mémorisable ; une liste complète noie le bénéfice.',
    },
    checklist: [
      'Ai-je relié chaque point à un besoin exprimé ?',
      'Ai-je évité toute information commerciale non validée ?',
      'Le prospect a-t-il pu reformuler l’essentiel ?',
      'Ai-je donné les conditions en même temps que le contenu ?',
    ],
    masteryLevels: [
      { name: 'À travailler', behaviour: 'Il présente la même offre à tout le monde.' },
      { name: 'En progression', behaviour: 'Il cible l’offre mais oublie de vérifier la compréhension.' },
      { name: 'Maîtrisé', behaviour: 'Le prospect redit avec ses mots ce qu’il a retenu.' },
    ],
    trainerTip: {
      text: 'Tant qu’un tarif ou une condition n’est pas confirmé par l’équipe formation, ne l’avancez pas : dites que vous vérifiez et rappelez.',
      validationStatus: 'a-valider',
    },
  },

  'gestion-objections': {
    objective: 'Traiter l’objection comme une information utile, pas comme un obstacle à écraser.',
    readingMinutes: 6,
    validationStatus: 'a-valider',
    stakes: [
      'Une objection exprimée est un signe d’attention, pas de refus.',
      'Répondre trop vite donne le sentiment de ne pas avoir été écouté.',
      'Résultat recherché : la préoccupation est levée ou clairement acceptée.',
    ],
    methodSteps: [
      {
        order: 1,
        phase: 'Action',
        title: 'Accueillir sans contredire',
        detail: 'Marquer un temps, reconnaître la remarque telle qu’elle est dite.',
      },
      {
        order: 2,
        phase: 'Observation',
        title: 'Identifier l’objection réelle',
        detail: 'Prix, temps, utilité, méfiance, ou simple envie d’écourter.',
      },
      {
        order: 3,
        phase: 'Adaptation',
        title: 'Répondre par des faits',
        detail: 'Une réponse courte, vérifiable, sans promesse ajoutée.',
      },
      {
        order: 4,
        phase: 'Validation',
        title: 'Vérifier que le point est levé',
        detail: '« Est-ce que ça répond à ce qui vous gênait ? »',
      },
    ],
    goodReflexes: [
      'Observer avant de répondre.',
      'Poser une question de clarification avant l’argument.',
      'Valider la préoccupation à voix haute.',
      'Répondre à une objection à la fois.',
      'Accepter de dire « je vérifie et je vous réponds ».',
      'Distinguer l’objection de fond du prétexte de sortie.',
    ],
    phrasesToUse: [
      'Je comprends, c’est une remarque fréquente.',
      'Quand vous dites que c’est cher, vous le comparez à quoi ?',
      'Vous avez raison de poser la question, voici ce que je peux vous confirmer.',
      'Sur ce point je ne veux pas vous dire n’importe quoi, je vérifie.',
      'Est-ce que ça lève votre réserve ?',
    ],
    phrasesToAvoid: [
      'Contredire trop vite.',
      'Répondre avant la fin de la phrase.',
      'Minimiser : « ce n’est rien du tout ».',
      'Empiler les arguments pour couvrir l’objection.',
      'Inventer une réponse sur le prix ou l’engagement.',
      'Insister après un refus assumé.',
    ],
    usefulQuestions: [
      'Qu’est-ce qui vous fait hésiter, précisément ?',
      'C’est le budget, le temps, ou le contenu ?',
      'Vous préférez en parler avec quelqu’un avant de décider ?',
      'Si ce point-là était réglé, ça changerait quelque chose ?',
      'Qu’est-ce qu’il vous faudrait pour être à l’aise ?',
    ],
    fieldScenario: {
      context: 'Objection classique en fin de présentation.',
      prospectReaction: '« De toute façon je trouve tout gratuitement en ligne. »',
      poorResponse: '« Oui mais sur internet c’est n’importe quoi, ce n’est pas fiable. »',
      betterResponse: '« C’est vrai qu’il y a beaucoup de gratuit. Qu’est-ce que vous y trouvez sur votre commune ? »',
      why: 'La question fait préciser le manque réel ; la contradiction met le prospect en défense.',
    },
    checklist: [
      'Ai-je laissé finir la phrase ?',
      'Ai-je clarifié avant de répondre ?',
      'Ma réponse est-elle factuelle et vérifiable ?',
      'Ai-je vérifié que le point était levé ?',
      'Ai-je accepté le refus s’il était assumé ?',
    ],
    masteryLevels: [
      { name: 'À travailler', behaviour: 'Il enchaîne un argument dès le premier mot d’objection.' },
      { name: 'En progression', behaviour: 'Il écoute mais répond à côté de la vraie préoccupation.' },
      { name: 'Maîtrisé', behaviour: 'Il fait préciser, répond avec des faits et vérifie que c’est réglé.' },
    ],
    trainerTip: {
      text: 'Le refus de donner ses coordonnées n’est pas une objection à traiter : c’est une limite à respecter. Notez-le et passez à la suite.',
      validationStatus: 'a-valider',
    },
  },

  communication: {
    objective: 'Se faire comprendre du premier coup, quel que soit l’interlocuteur.',
    readingMinutes: 4,
    validationStatus: 'a-valider',
    stakes: [
      'Le fond ne passe que si la forme est confortable à écouter.',
      'Un débit trop rapide est perçu comme de la pression.',
      'Résultat recherché : le prospect ne demande jamais de répéter.',
    ],
    methodSteps: [
      {
        order: 1,
        phase: 'Action',
        title: 'Poser sa voix',
        detail: 'Débit ralenti, volume adapté à la distance, fins de phrases articulées.',
      },
      {
        order: 2,
        phase: 'Observation',
        title: 'Repérer les signes de décrochage',
        detail: 'Regard qui fuit, « pardon ? », réponses de plus en plus courtes.',
      },
      {
        order: 3,
        phase: 'Adaptation',
        title: 'Se caler sur son registre',
        detail: 'Même niveau de langue, mêmes mots, phrases plus courtes si besoin.',
      },
      {
        order: 4,
        phase: 'Validation',
        title: 'Vérifier la clarté',
        detail: '« Je suis clair ou je reprends autrement ? »',
      },
    ],
    goodReflexes: [
      'Adapter son rythme à celui du prospect.',
      'Terminer ses phrases au lieu de les enchaîner.',
      'Utiliser le silence après une information importante.',
      'Répondre en trois phrases maximum.',
      'Remplacer les mots parasites par une pause.',
      'Ne jamais couper, même pour corriger une erreur.',
    ],
    phrasesToUse: [
      'Je reprends plus simplement.',
      'Je vais trop vite ?',
      'En un mot : [idée principale].',
      'Je vous laisse réagir.',
    ],
    phrasesToAvoid: [
      'Couper la parole.',
      'Parler de plus en plus vite quand on sent l’hésitation.',
      'Enchaîner « en fait », « voilà », « du coup ».',
      'Employer du jargon interne.',
      'Faire des réponses de deux minutes.',
      'Baisser la voix en fin de phrase.',
    ],
    usefulQuestions: [
      'Est-ce que je suis clair ?',
      'Vous voulez que je reprenne ce point ?',
      'Je vais à un rythme qui vous convient ?',
      'Vous préférez que j’aille à l’essentiel ?',
    ],
    fieldScenario: {
      context: 'Le prospect est âgé, la rue est bruyante.',
      prospectReaction: '« Comment ? Je n’entends pas bien. »',
      poorResponse: 'Répéter la même phrase plus fort, au même rythme.',
      betterResponse: 'Se rapprocher légèrement, ralentir, reformuler en une phrase courte.',
      why: 'Répéter plus fort ne corrige pas le débit ; c’est la vitesse qui gêne la compréhension.',
    },
    checklist: [
      'Ai-je laissé le prospect finir ses phrases ?',
      'Mes réponses tiennent-elles en trois phrases ?',
      'Ai-je évité le jargon ?',
      'Ai-je vérifié au moins une fois que j’étais clair ?',
    ],
    masteryLevels: [
      { name: 'À travailler', behaviour: 'Il parle vite, coupe, et multiplie les mots parasites.' },
      { name: 'En progression', behaviour: 'Il se reprend quand on le lui signale, sans anticiper.' },
      { name: 'Maîtrisé', behaviour: 'Il ajuste son rythme et son vocabulaire sans qu’on le lui demande.' },
    ],
    trainerTip: {
      text: 'Enregistrez-vous une fois pendant une tournée. Le débit se corrige beaucoup plus vite quand on s’entend.',
      validationStatus: 'a-valider',
    },
  },

  'creation-confiance': {
    objective: 'Être crédible par la transparence, y compris quand cela dessert la vente immédiate.',
    readingMinutes: 5,
    validationStatus: 'a-valider',
    stakes: [
      'La confiance se construit sur ce qu’on annonce spontanément, pas sur ce qu’on concède.',
      'Une information floue sur le prix ou l’engagement annule tout le reste.',
      'Résultat recherché : le prospect décide en connaissant tout.',
    ],
    methodSteps: [
      {
        order: 1,
        phase: 'Action',
        title: 'Annoncer les conditions sans attendre',
        detail: 'Durée, engagement, résiliation, tarif. [Éléments à confirmer]',
      },
      {
        order: 2,
        phase: 'Observation',
        title: 'Repérer les signes de méfiance',
        detail: 'Recul, questions répétées, refus de donner une information.',
      },
      {
        order: 3,
        phase: 'Adaptation',
        title: 'Nommer ce qui inquiète',
        detail: 'Mettre la réserve sur la table plutôt que de la contourner.',
      },
      {
        order: 4,
        phase: 'Validation',
        title: 'Confirmer par écrit ou par un support',
        detail: 'S’appuyer sur le document officiel plutôt que sur sa parole.',
      },
    ],
    goodReflexes: [
      'Dire le prix et l’engagement avant qu’on les demande. [À confirmer]',
      'Expliquer à quoi servent les données demandées.',
      'Dire « je ne sais pas » plutôt qu’une approximation.',
      'Laisser le prospect lire le document.',
      'Respecter un refus sans changer de ton.',
      'Tenir ce qui a été annoncé, y compris la durée de l’échange.',
    ],
    phrasesToUse: [
      'Je vous donne tout de suite les conditions, comme ça vous décidez en connaissance de cause.',
      'Cette information, je ne l’ai pas ; je la vérifie et je vous la confirme.',
      'Vos coordonnées servent uniquement à [usage à confirmer], rien d’autre.',
      'Vous pouvez prendre le temps de lire, je ne suis pas pressé.',
      'Si ce n’est pas pour vous, dites-le-moi, c’est très bien aussi.',
    ],
    phrasesToAvoid: [
      'Promettre un avantage non validé.',
      'Rester vague sur la durée d’engagement.',
      'Éluder une question sur le prix.',
      'Presser la signature « avant la fin de la journée ».',
      'Changer d’attitude après un refus.',
      'Minimiser une contrainte contractuelle.',
    ],
    usefulQuestions: [
      'Est-ce qu’il y a un point sur lequel vous voulez être sûr ?',
      'Vous voulez que je vous laisse le document ?',
      'Qu’est-ce qui vous rendrait plus serein ?',
      'Vous préférez vérifier de votre côté avant de décider ?',
    ],
    fieldScenario: {
      context: 'Le prospect est intéressé mais hésite au moment de donner ses coordonnées.',
      prospectReaction: '« Je n’aime pas trop laisser mes informations. »',
      poorResponse: '« Ne vous inquiétez pas, il n’y a aucun risque. »',
      betterResponse: '« C’est normal. Elles servent à [usage à confirmer]. Si vous préférez, on s’arrête là. »',
      why: 'Expliquer l’usage et laisser une porte de sortie rassure ; la banalisation inquiète davantage.',
    },
    checklist: [
      'Ai-je annoncé les conditions sans attendre la question ?',
      'Ai-je évité toute promesse non validée ?',
      'Ai-je expliqué l’usage des données demandées ?',
      'Mon attitude est-elle restée la même après une hésitation ?',
    ],
    masteryLevels: [
      { name: 'À travailler', behaviour: 'Il repousse la question du prix jusqu’à la fin.' },
      { name: 'En progression', behaviour: 'Il répond honnêtement mais seulement quand on l’interroge.' },
      { name: 'Maîtrisé', behaviour: 'Il donne spontanément les conditions et assume un « je ne sais pas ».' },
    ],
    trainerTip: {
      text: 'La phrase qui coûte une vente aujourd’hui est souvent celle qui en rapporte une la semaine suivante. Ne promettez jamais ce que vous n’avez pas vérifié.',
      validationStatus: 'a-valider',
    },
  },

  conclusion: {
    objective: 'Proposer une suite claire, obtenir un accord explicite ou une sortie propre.',
    readingMinutes: 5,
    validationStatus: 'a-valider',
    stakes: [
      'Un entretien sans étape suivante annoncée est un entretien perdu.',
      'Un refus accepté proprement laisse la porte ouverte.',
      'Résultat recherché : chacun sait ce qui a été décidé.',
    ],
    methodSteps: [
      {
        order: 1,
        phase: 'Action',
        title: 'Résumer en deux phrases',
        detail: 'Le besoin exprimé, la réponse proposée, rien d’autre.',
      },
      {
        order: 2,
        phase: 'Observation',
        title: 'Lire les signaux d’achat',
        detail: 'Questions sur les modalités, sur la date, sur la mise en route.',
      },
      {
        order: 3,
        phase: 'Adaptation',
        title: 'Traiter la dernière hésitation',
        detail: 'Une question ouverte, pas un argument supplémentaire.',
      },
      {
        order: 4,
        phase: 'Validation',
        title: 'Confirmer ce qui est décidé',
        detail: 'Reformuler l’accord ou le refus, et la suite concrète.',
      },
    ],
    goodReflexes: [
      'Proposer une étape précise plutôt qu’un « je vous laisse réfléchir ».',
      'Se taire après avoir proposé.',
      'Reformuler l’accord à voix haute.',
      'Accepter le refus du premier coup.',
      'Remercier de la même façon, accord ou non.',
      'Repartir en laissant une trace : document, coordonnées, date de rappel.',
    ],
    phrasesToUse: [
      'Si je résume : vous cherchiez [besoin], je vous propose [réponse]. On part là-dessus ?',
      'Qu’est-ce qui vous retient encore ?',
      'On peut aussi en rester là aujourd’hui, sans problème.',
      'Je vous confirme donc [décision], et je vous laisse ce document.',
      'Je vous rappelle [date à convenir] si vous préférez y réfléchir.',
    ],
    phrasesToAvoid: [
      'Forcer une décision.',
      'Reprendre tout l’argumentaire à la fin.',
      'Poser une fausse alternative pour piéger.',
      'Insister après un refus clair.',
      'Partir sans confirmer ce qui a été décidé.',
      'Changer de ton quand la réponse est non.',
    ],
    usefulQuestions: [
      'On part sur cette base ?',
      'Qu’est-ce qui manque pour que vous soyez décidé ?',
      'Vous préférez que je repasse ou que je vous rappelle ?',
      'Est-ce que tout est clair sur ce qui se passe ensuite ?',
    ],
    fieldScenario: {
      context: 'Le prospect a écouté, posé des questions, puis marque une pause.',
      prospectReaction: '« Il faut que j’en parle à ma femme. »',
      poorResponse: '« C’est vous qui décidez, non ? Autant le faire maintenant. »',
      betterResponse: '« Bien sûr. Qu’est-ce qu’elle voudra savoir ? Je vous laisse de quoi lui montrer et je repasse [date]. »',
      why: 'Préparer le second échange respecte la décision du foyer ; forcer la coupe court.',
    },
    checklist: [
      'Ai-je résumé le besoin et la réponse ?',
      'Ai-je proposé une étape suivante précise ?',
      'Ai-je obtenu un accord ou un refus explicite ?',
      'Ai-je confirmé ce qui a été décidé avant de partir ?',
      'Ai-je pris congé de la même façon quelle que soit la réponse ?',
    ],
    masteryLevels: [
      { name: 'À travailler', behaviour: 'Il termine sans proposer d’étape suivante.' },
      { name: 'En progression', behaviour: 'Il propose une suite mais insiste après une hésitation.' },
      { name: 'Maîtrisé', behaviour: 'Il obtient une décision claire et prend congé de la même manière dans les deux cas.' },
    ],
    trainerTip: {
      text: 'Après avoir proposé, comptez trois secondes en silence. C’est souvent là que le prospect décide.',
      validationStatus: 'a-valider',
    },
  },
};

export const methodologySheets: readonly MethodologySheet[] = competencies.map((competency) => ({
  ...competency,
  ...bodies[competency.slug],
  updatedAt: UPDATED_AT,
}));

export function getSheet(slug: string): MethodologySheet | undefined {
  return methodologySheets.find((sheet) => sheet.slug === slug);
}

/** Fiche précédente / suivante pour la navigation séquentielle. */
export function getSheetNeighbours(slug: string): {
  previous: MethodologySheet | null;
  next: MethodologySheet | null;
} {
  const index = methodologySheets.findIndex((sheet) => sheet.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: methodologySheets[index - 1] ?? null,
    next: methodologySheets[index + 1] ?? null,
  };
}
