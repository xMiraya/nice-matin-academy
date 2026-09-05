interface Section {
  id: string;
  label: string;
}

/**
 * Raccourcis vers les sections d'une page longue.
 *
 * Une page qui empile de nombreux blocs devient difficile à parcourir : au
 * clavier, il faut tabuler à travers tout ce qui précède le bloc recherché ;
 * au lecteur d'écran, il faut écouter chaque titre un par un. Ce bandeau
 * donne un accès direct à chaque section, en restant visible et utile à
 * tout le monde plutôt que réservé à la navigation assistée.
 */
export function QuickJumpNav({ sections }: { sections: readonly Section[] }) {
  return (
    <nav aria-label="Aller directement à une section" className="mb-5 -mt-1">
      <ul className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-graphite transition-colors hover:border-brand-sky hover:bg-brand-soft hover:text-brand"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
