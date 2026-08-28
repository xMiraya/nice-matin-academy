import type { Question } from '@/src/types/qcm/quiz';

import { createRng, shuffle } from './shuffle';

/**
 * Melange stable de l'ordre des propositions.
 *
 * Les banques de questions ont ete redigees avec la bonne reponse en premiere
 * position : sans ce melange, la reponse A est correcte dans la grande majorite
 * des questions, ce qui rend le QCM devinable. La graine est derivee de
 * l'identifiant de la question : l'ordre est donc aleatoire d'une question a
 * l'autre, mais identique entre l'ecran de passation et la correction, et
 * stable entre le rendu serveur et le rendu client.
 */
function seedFrom(id: string): number {
  // FNV-1a, suffisant pour disperser des identifiants courts.
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function withShuffledOptions(question: Question): Question {
  if (question.kind === 'ordering') {
    // Les etapes doivent etre presentees dans le desordre : si le melange
    // retombe sur l'ordre attendu, on decale d'un cran.
    const rng = createRng(seedFrom(question.id));
    let steps = shuffle(question.steps, rng);
    const alreadySolved = steps.every((step, index) => step.id === question.correctOrder[index]);
    if (alreadySolved && steps.length > 1) {
      steps = [...steps.slice(1), steps[0]!];
    }
    return { ...question, steps };
  }

  return { ...question, options: shuffle(question.options, createRng(seedFrom(question.id))) };
}

/** Applique le melange a une banque entiere de questions. */
export function withShuffledQuestionOptions(
  questions: readonly Question[],
): readonly Question[] {
  return questions.map(withShuffledOptions);
}
