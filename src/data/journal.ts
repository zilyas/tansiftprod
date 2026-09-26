import type { Lang } from '../i18n/routes';

type L<T = string> = Record<Lang, T>;

export interface Article {
  id: string;
  slug: L;
  title: L;
  description: L;
  // Short answer at the top of the article, for readers and AI assistants.
  summary: L;
  published: string; // ISO date
  updated: string;
  sections: L<{ heading: string; body: string[] }[]>;
  sources: { label: string; url: string }[];
}

export const articles: Article[] = [
  {
    id: 'permits',
    slug: {
      en: 'film-and-drone-permits-morocco',
      fr: 'autorisations-tournage-drone-maroc',
    },
    title: {
      en: 'Film and drone permits in Morocco: a practical guide for shooting in Essaouira',
      fr: 'Autorisations de tournage et de drone au Maroc : guide pratique pour tourner à Essaouira',
    },
    description: {
      en: 'What you need to film or fly a drone in Essaouira: the CCM filming permit, the drone authorisation, timelines and the documents to prepare.',
      fr: 'Ce qu’il faut pour tourner ou faire voler un drone à Essaouira : autorisation du CCM, autorisation drone, délais et documents à préparer.',
    },
    summary: {
      en: 'Every professional shoot in Morocco needs a filming permit from the Centre Cinématographique Marocain (CCM). Foreign productions apply through a licensed Moroccan production company. Drone shots also need a separate regional authorisation, which takes at least about 10 working days, so plan aerials early.',
      fr: 'Tout tournage professionnel au Maroc nécessite une autorisation du Centre Cinématographique Marocain (CCM). Les productions étrangères passent par une société de production marocaine agréée. Les plans drone exigent en plus une autorisation régionale, qui prend au moins une dizaine de jours ouvrés : anticipez les prises aériennes.',
    },
    published: '2026-09-26',
    updated: '2026-09-26',
    sections: {
      en: [
        {
          heading: 'Who issues filming permits in Morocco?',
          body: [
            'The Centre Cinématographique Marocain (CCM) authorises film, television, commercial, documentary and music video shoots in Morocco. Branded content and corporate films shot for broadcast or online use are also covered.',
            'A foreign production cannot apply directly. It works with a Moroccan company that holds a production licence, which submits the application on its behalf together with a letter of accreditation from the foreign producer.',
          ],
        },
        {
          heading: 'How long does a filming permit take?',
          body: [
            'The CCM states that a permit is issued within 7 days of a complete application. In practice, send the file as early as you can, because missing documents restart the clock.',
          ],
        },
        {
          heading: 'Can you fly a drone in Essaouira?',
          body: [
            'Only with authorisation. Morocco has banned the import and use of civilian drones without prior authorisation since 2015, so a holiday drone cannot legally be flown.',
            'For professional aerial filming, the CCM filming permit comes first. The drone authorisation is then handled at regional level and usually takes at least about 10 working days.',
            'In Essaouira, the trade wind also matters. It usually builds from early afternoon, so aerial shots are safest and steadiest in the morning.',
          ],
        },
        {
          heading: 'What to prepare before contacting us',
          body: [
            'Shoot dates and locations, a short synopsis or treatment, the crew list with passport details, the equipment list with serial numbers, and whether you need drone shots. With this, we can plan the paperwork and the schedule together.',
          ],
        },
      ],
      fr: [
        {
          heading: 'Qui délivre les autorisations de tournage au Maroc ?',
          body: [
            'Le Centre Cinématographique Marocain (CCM) autorise les tournages de films, séries, publicités, documentaires et clips au Maroc. Les contenus de marque et films d’entreprise destinés à la diffusion ou au web sont aussi concernés.',
            'Une production étrangère ne peut pas déposer la demande elle-même. Elle travaille avec une société marocaine titulaire d’un agrément de production, qui dépose le dossier pour son compte avec une lettre d’accréditation du producteur étranger.',
          ],
        },
        {
          heading: 'Quel est le délai pour une autorisation de tournage ?',
          body: [
            'Le CCM indique que l’autorisation est délivrée dans les 7 jours suivant le dépôt d’un dossier complet. En pratique, déposez le dossier le plus tôt possible : un document manquant relance le délai.',
          ],
        },
        {
          heading: 'Peut-on faire voler un drone à Essaouira ?',
          body: [
            'Seulement avec une autorisation. Depuis 2015, le Maroc interdit l’importation et l’usage de drones civils sans autorisation préalable : un drone de vacances ne peut pas voler légalement.',
            'Pour un tournage aérien professionnel, l’autorisation du CCM vient d’abord. L’autorisation drone est ensuite traitée au niveau régional et prend généralement au moins une dizaine de jours ouvrés.',
            'À Essaouira, il faut aussi compter avec l’alizé. Il se lève en général en début d’après-midi : les plans aériens sont plus sûrs et plus stables le matin.',
          ],
        },
        {
          heading: 'À préparer avant de nous contacter',
          body: [
            'Dates et lieux de tournage, un court synopsis ou une note d’intention, la liste de l’équipe avec les informations de passeport, la liste du matériel avec les numéros de série, et vos besoins en prises de vue par drone. Avec ces éléments, nous planifions ensemble les démarches et le calendrier.',
          ],
        },
      ],
    },
    sources: [
      { label: 'CCM — Autorisations de tournage', url: 'https://www.ccm.ma/en/autorisations-tournage.php' },
      { label: 'Broadway — Film permit Morocco', url: 'https://www.broadway.ma/film-permit-morocco/' },
      { label: 'Squad Prod — Drone filming permits', url: 'https://www.squadprod.ma/en/guides/drone-filming-permits-morocco/' },
    ],
  },
  {
    id: 'light-wind',
    slug: {
      en: 'essaouira-light-and-wind-when-to-shoot',
      fr: 'essaouira-lumiere-et-vent-quand-tourner',
    },
    title: {
      en: 'Essaouira light and wind: when to shoot',
      fr: 'Lumière et vent à Essaouira : quand tourner',
    },
    description: {
      en: 'How the trade wind and the Atlantic light shape a shoot in Essaouira, month by month and hour by hour, with the best times for video, photo and drone.',
      fr: 'Comment l’alizé et la lumière atlantique façonnent un tournage à Essaouira, mois par mois et heure par heure, avec les meilleurs moments pour la vidéo, la photo et le drone.',
    },
    summary: {
      en: 'Shoot early. Essaouira’s trade wind, the alizé, blows mainly from April to October and is strongest from June to September. Mornings are usually calm, and the wind builds from early afternoon. Plan dialogue, sound and drone work before noon, and keep wide golden-hour shots for the end of the day.',
      fr: 'Tournez tôt. L’alizé souffle surtout d’avril à octobre et plus fort de juin à septembre. Les matinées sont en général calmes et le vent se lève en début d’après-midi. Placez les dialogues, le son et le drone avant midi, et gardez les plans larges de l’heure dorée pour la fin de journée.',
    },
    published: '2026-09-26',
    updated: '2026-09-26',
    sections: {
      en: [
        {
          heading: 'When is the wind strongest in Essaouira?',
          body: [
            'The north-east trade wind blows mainly from April to October and peaks between June and September, which is why Essaouira is known for kitesurfing. From November to March the air is usually calmer.',
          ],
        },
        {
          heading: 'What is the best time of day to film?',
          body: [
            'Morning. The wind usually picks up from early afternoon and can reach roughly 18 to 28 knots in summer. That affects sound, hair, fabric, props and drones.',
            'Late afternoon brings warm light on the ramparts and the beach. It suits wide shots and silhouettes, where wind noise and movement matter less.',
          ],
        },
        {
          heading: 'Where to shoot at each hour',
          body: [
            'Early morning: the port and the medina’s streets, before crowds and wind. Midday: shaded interiors of riads and workshops. Late afternoon: Skala de la Ville and Skala du Port, with the cannons facing the Atlantic, then the beach toward Diabat for sunset.',
          ],
        },
        {
          heading: 'Events that change the city',
          body: [
            'Festivals fill the city and its hotels. In 2026, the Printemps Musical des Alizés ran from 30 April to 3 May and the Gnaoua Festival from 25 to 27 June. Check the next dates before planning a shoot around them.',
          ],
        },
      ],
      fr: [
        {
          heading: 'Quand le vent est-il le plus fort à Essaouira ?',
          body: [
            'L’alizé de nord-est souffle surtout d’avril à octobre, avec un pic entre juin et septembre, ce qui fait d’Essaouira une destination de kitesurf. De novembre à mars, l’air est généralement plus calme.',
          ],
        },
        {
          heading: 'Quel est le meilleur moment de la journée pour tourner ?',
          body: [
            'Le matin. Le vent se lève en général en début d’après-midi et peut atteindre environ 18 à 28 nœuds en été. Cela touche le son, les cheveux, les tissus, les accessoires et les drones.',
            'La fin d’après-midi apporte une lumière chaude sur les remparts et la plage. Elle convient aux plans larges et aux silhouettes, où le bruit du vent et le mouvement comptent moins.',
          ],
        },
        {
          heading: 'Où tourner selon l’heure',
          body: [
            'Tôt le matin : le port et les ruelles de la médina, avant la foule et le vent. En milieu de journée : les intérieurs ombragés des riads et des ateliers. En fin d’après-midi : la Skala de la Ville et la Skala du Port, canons face à l’Atlantique, puis la plage vers Diabat pour le coucher du soleil.',
          ],
        },
        {
          heading: 'Les événements qui transforment la ville',
          body: [
            'Les festivals remplissent la ville et ses hôtels. En 2026, le Printemps Musical des Alizés a eu lieu du 30 avril au 3 mai et le Festival Gnaoua du 25 au 27 juin. Vérifiez les prochaines dates avant de caler un tournage.',
          ],
        },
      ],
    },
    sources: [
      { label: 'Essaouira Surf & Kitesurf Elite School — Wind guide', url: 'https://www.essaouirasurfandkitesurfeliteschool.com/en/blog/kitesurfing-essaouira-master-guide' },
      { label: 'Costasur — Wind in Essaouira', url: 'https://essaouira.costasur.com/en/vents.html' },
      { label: 'L’Opinion — Festival Gnaoua 2026', url: 'https://lopinion.ma/fr/actu-maroc/festival-gnaoua-2026--essaouira-au-rythme-des-fusions-musicales-du-25-au-27-juin_a81259?articleId=98d6339f-815b-45f9-8a9c-4acfc19ba87e' },
      { label: 'Le Matin — Printemps Musical des Alizés 2026', url: 'https://lematin.ma/culture/le-printemps-musical-des-alizes-2026-sous-le-signe-du-dialogue/341760' },
    ],
  },
  {
    id: 'on-screen',
    slug: {
      en: 'essaouira-on-screen-films-and-series',
      fr: 'essaouira-a-l-ecran-films-et-series',
    },
    title: {
      en: 'Essaouira on screen: the films and series shot on its ramparts',
      fr: 'Essaouira à l’écran : les films et séries tournés sur ses remparts',
    },
    description: {
      en: 'From Orson Welles’ Othello to Game of Thrones, why Essaouira keeps playing other cities on screen, and what that means for your own shoot.',
      fr: 'D’Othello d’Orson Welles à Game of Thrones, pourquoi Essaouira joue si souvent d’autres villes à l’écran, et ce que cela change pour votre tournage.',
    },
    summary: {
      en: 'Orson Welles filmed parts of Othello on Essaouira’s ramparts, and the film won the top prize at Cannes in 1952. Decades later the city played Astapor in season 3 of Game of Thrones. Its 18th-century sea walls, planned in 1760 and listed by UNESCO in 2001, give productions a ready-made fortified port facing the Atlantic.',
      fr: 'Orson Welles a tourné une partie d’Othello sur les remparts d’Essaouira, film récompensé par le grand prix de Cannes en 1952. Des décennies plus tard, la ville a incarné Astapor dans la saison 3 de Game of Thrones. Ses remparts du XVIIIe siècle, tracés en 1760 et inscrits à l’UNESCO en 2001, offrent aux productions un port fortifié face à l’Atlantique.',
    },
    published: '2026-09-26',
    updated: '2026-09-26',
    sections: {
      en: [
        {
          heading: 'Othello: Orson Welles on the ramparts',
          body: [
            'Orson Welles shot parts of his Othello in Essaouira, then still known as Mogador, during a production famous for running out of money. The sea walls and towers stood in for the fortress of Cyprus. The film shared the top prize at the 1952 Cannes Film Festival.',
          ],
        },
        {
          heading: 'Game of Thrones: Essaouira as Astapor',
          body: [
            'In season 3 of Game of Thrones, Essaouira played Astapor, the slaver city where Daenerys Targaryen buys the Unsullied. The ramparts and the Skala walkway, with their line of bronze cannons, were used for the scenes on the city walls.',
          ],
        },
        {
          heading: 'Why productions keep coming back',
          body: [
            'The medina was planned in 1760 for Sultan Mohammed ben Abdallah and laid out by the engineer Théodore Cornut, following European military design. The result is a compact fortified port with straight streets, sea walls and towers, which can pass for many places and periods.',
            'The Atlantic light is soft and changes quickly, the port is active from early morning, and the old town is small enough to move a crew on foot. UNESCO listed the medina as a World Heritage site in 2001.',
          ],
        },
        {
          heading: 'What this means for your shoot',
          body: [
            'The famous spots are also the busiest. Plan the Skala de la Ville and Skala du Port for early morning, before visitors arrive and before the trade wind builds. Heritage sites and public spaces need the filming permit, and some locations ask for extra local authorisation, so tell us early which places you want.',
          ],
        },
      ],
      fr: [
        {
          heading: 'Othello : Orson Welles sur les remparts',
          body: [
            'Orson Welles a tourné une partie de son Othello à Essaouira, qui s’appelait encore Mogador, lors d’une production célèbre pour ses difficultés financières. Les remparts et les tours figuraient la forteresse de Chypre. Le film a partagé le grand prix du Festival de Cannes en 1952.',
          ],
        },
        {
          heading: 'Game of Thrones : Essaouira devient Astapor',
          body: [
            'Dans la saison 3 de Game of Thrones, Essaouira a incarné Astapor, la cité esclavagiste où Daenerys Targaryen achète les Immaculés. Les remparts et la Skala, avec sa rangée de canons de bronze, ont servi aux scènes sur les murs de la ville.',
          ],
        },
        {
          heading: 'Pourquoi les productions reviennent',
          body: [
            'La médina a été tracée en 1760 pour le sultan Mohammed ben Abdallah par l’ingénieur Théodore Cornut, selon les principes de l’architecture militaire européenne. Le résultat : un port fortifié compact, aux rues droites, remparts et tours, qui peut incarner de nombreux lieux et époques.',
            'La lumière atlantique est douce et change vite, le port s’anime dès le petit matin et la vieille ville est assez petite pour déplacer une équipe à pied. L’UNESCO a inscrit la médina au patrimoine mondial en 2001.',
          ],
        },
        {
          heading: 'Ce que cela change pour votre tournage',
          body: [
            'Les lieux célèbres sont aussi les plus fréquentés. Prévoyez la Skala de la Ville et la Skala du Port tôt le matin, avant les visiteurs et avant que l’alizé ne se lève. Les sites patrimoniaux et l’espace public exigent l’autorisation de tournage, et certains lieux demandent une autorisation locale supplémentaire : indiquez-nous tôt les endroits souhaités.',
          ],
        },
      ],
    },
    sources: [
      { label: 'Al Majalla — How Orson Welles resurrected the spirit of Othello in Morocco', url: 'https://en.majalla.com/node/304891/culture-social-affairs/how-orson-welles-resurrected-spirit-othello-morocco' },
      { label: 'Slow Morocco — Game of Thrones filming locations', url: 'https://www.slowmorocco.com/morocco/game-of-thrones-filming-locations' },
      { label: 'Wikipedia — Medina of Essaouira', url: 'https://en.wikipedia.org/wiki/Medina_of_Essaouira' },
    ],
  },
];

export function articleUrl(a: Article, lang: Lang): string {
  return lang === 'en' ? `/journal/${a.slug.en}/` : `/fr/journal/${a.slug.fr}/`;
}
