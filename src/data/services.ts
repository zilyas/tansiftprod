import type { Lang } from '../i18n/routes';
import { categoryImage } from './media';

type L<T = string> = Record<Lang, T>;

export interface Service {
  id: string;
  slug: L;
  name: L;
  // Short line for cards.
  line: L;
  // Page title and meta description (SEO).
  title: L;
  description: L;
  // Answer-first intro, 40–60 words.
  intro: L;
  includes: L<string[]>;
  idealFor: L<string[]>;
  faq: L<{ q: string; a: string }[]>;
  image: string;
}

export const services: Service[] = [
  {
    id: 'social',
    slug: { en: 'social-media-content', fr: 'contenu-reseaux-sociaux' },
    name: { en: 'Social media content', fr: 'Contenu réseaux sociaux' },
    line: {
      en: 'Reels, short videos and photo sets that keep your feed alive every month.',
      fr: 'Reels, vidéos courtes et séries photo pour faire vivre votre feed chaque mois.',
    },
    title: {
      en: 'Social Media Content Creation in Essaouira | Reels & Photo',
      fr: 'Création de contenu réseaux sociaux à Essaouira | Reels & photo',
    },
    description: {
      en: 'Reels, short-form video and photo shoots for Essaouira businesses: riads, restaurants, surf schools, shops and brands. Planned, shot and edited by a local crew.',
      fr: 'Reels, vidéos courtes et shootings photo pour les entreprises d’Essaouira : riads, restaurants, écoles de surf, boutiques et marques. Pensés, tournés et montés par une équipe locale.',
    },
    intro: {
      en: 'Tansift plans, shoots and edits social media content for businesses in and around Essaouira. One shoot day can give you a month of Reels, Stories and photos, cut to the right format for Instagram, TikTok and Facebook, in your brand’s look and language.',
      fr: 'Tansift conçoit, tourne et monte du contenu pour les réseaux sociaux des entreprises d’Essaouira et de sa région. Une journée de tournage peut vous donner un mois de Reels, de Stories et de photos, au bon format pour Instagram, TikTok et Facebook, dans le style et la langue de votre marque.',
    },
    includes: {
      en: [
        'Monthly content plan built around your offers and seasons',
        'Vertical Reels and TikToks with captions and subtitles',
        'Photo sets for posts, Stories and ads',
        'Hooks, scripts and on-screen text in French, English or Darija',
        'Files delivered ready to post, sized for each platform',
      ],
      fr: [
        'Plan de contenu mensuel autour de vos offres et de vos saisons',
        'Reels et TikToks verticaux avec légendes et sous-titres',
        'Séries photo pour posts, Stories et publicités',
        'Accroches, scripts et textes à l’écran en français, anglais ou darija',
        'Fichiers livrés prêts à publier, au format de chaque plateforme',
      ],
    },
    idealFor: {
      en: ['Riads and hotels', 'Restaurants and cafés', 'Surf and kite schools', 'Shops, artisans and cooperatives'],
      fr: ['Riads et hôtels', 'Restaurants et cafés', 'Écoles de surf et de kite', 'Boutiques, artisans et coopératives'],
    },
    faq: {
      en: [
        {
          q: 'How much content do we get from one shoot day?',
          a: 'A typical day gives 8 to 12 short videos and 30 to 60 edited photos, depending on how many locations and people are involved. We agree the list before the shoot so you know exactly what you will receive.',
        },
        {
          q: 'Can you manage our account as well?',
          a: 'We focus on making the content. We can deliver it with captions and a posting calendar so your team, or your social media manager, can publish it.',
        },
      ],
      fr: [
        {
          q: 'Combien de contenus obtient-on avec une journée de tournage ?',
          a: 'Une journée type donne 8 à 12 vidéos courtes et 30 à 60 photos retouchées, selon le nombre de lieux et de personnes. Nous fixons la liste avant le tournage pour que vous sachiez exactement ce que vous recevrez.',
        },
        {
          q: 'Pouvez-vous aussi gérer notre compte ?',
          a: 'Nous nous concentrons sur la création du contenu. Nous pouvons le livrer avec les légendes et un calendrier de publication pour votre équipe ou votre community manager.',
        },
      ],
    },
    image: categoryImage.social,
  },
  {
    id: 'podcast',
    slug: { en: 'podcast-production', fr: 'production-podcast' },
    name: { en: 'Video podcasts', fr: 'Podcasts vidéo' },
    line: {
      en: 'Multi-camera podcast recording, edited into full episodes and short clips.',
      fr: 'Enregistrement de podcasts multi-caméras, montés en épisodes complets et en extraits courts.',
    },
    title: {
      en: 'Video Podcast Production in Essaouira | Recording & Editing',
      fr: 'Production de podcast vidéo à Essaouira | Tournage et montage',
    },
    description: {
      en: 'Video podcast production in Essaouira: multi-camera recording, clean sound, full episode edits and vertical clips for Reels and TikTok.',
      fr: 'Production de podcasts vidéo à Essaouira : tournage multi-caméras, son propre, montage des épisodes et extraits verticaux pour Reels et TikTok.',
    },
    intro: {
      en: 'Tansift records video podcasts with several cameras and dedicated microphones, on location or in a space you choose in Essaouira. We edit the full episode for YouTube and Spotify, then cut the strongest moments into vertical clips for social media.',
      fr: 'Tansift enregistre des podcasts vidéo avec plusieurs caméras et des micros dédiés, en extérieur ou dans le lieu de votre choix à Essaouira. Nous montons l’épisode complet pour YouTube et Spotify, puis découpons les meilleurs moments en extraits verticaux pour les réseaux sociaux.',
    },
    includes: {
      en: [
        'Two or three camera angles with matched colour',
        'Separate microphones for each speaker',
        'Full episode edit with intro, titles and sound cleanup',
        'Vertical clips with subtitles for Reels, Shorts and TikTok',
        'Thumbnail stills from the recording',
      ],
      fr: [
        'Deux ou trois angles de caméra à l’étalonnage harmonisé',
        'Un micro séparé pour chaque intervenant',
        'Montage de l’épisode complet avec intro, titres et nettoyage du son',
        'Extraits verticaux sous-titrés pour Reels, Shorts et TikTok',
        'Images fixes pour les miniatures',
      ],
    },
    idealFor: {
      en: ['Brands and founders', 'Coaches and experts', 'Cultural projects and festivals', 'Interview series'],
      fr: ['Marques et fondateurs', 'Coachs et experts', 'Projets culturels et festivals', 'Séries d’interviews'],
    },
    faq: {
      en: [
        {
          q: 'Do we need our own studio?',
          a: 'No. We bring cameras, lights and microphones to a riad, office, café or terrace, and check the room for sound before the recording day.',
        },
      ],
      fr: [
        {
          q: 'Faut-il avoir son propre studio ?',
          a: 'Non. Nous apportons caméras, lumières et micros dans un riad, un bureau, un café ou une terrasse, et vérifions l’acoustique du lieu avant le jour d’enregistrement.',
        },
      ],
    },
    image: categoryImage.podcast,
  },
  {
    id: 'photo',
    slug: { en: 'photography', fr: 'photographie' },
    name: { en: 'Photography', fr: 'Photographie' },
    line: {
      en: 'Brand, product, hospitality and portrait photography on location.',
      fr: 'Photographie de marque, produit, hôtellerie et portrait, sur site.',
    },
    title: {
      en: 'Photographer in Essaouira | Brand, Hotel & Portrait Photography',
      fr: 'Photographe à Essaouira | Marque, hôtellerie et portrait',
    },
    description: {
      en: 'Professional photographer in Essaouira for brands, riads, hotels, villas, products and portraits. Natural light, local locations, fast delivery.',
      fr: 'Photographe professionnel à Essaouira pour marques, riads, hôtels, villas, produits et portraits. Lumière naturelle, lieux locaux, livraison rapide.',
    },
    intro: {
      en: 'Tansift photographs brands, products, riads, villas and people in Essaouira’s natural light. We plan each shoot around the hour that suits the place: soft mornings in the medina, and the late sun on the ramparts and beaches.',
      fr: 'Tansift photographie marques, produits, riads, villas et personnes dans la lumière naturelle d’Essaouira. Nous calons chaque séance sur l’heure qui convient au lieu : matins doux dans la médina, soleil couchant sur les remparts et les plages.',
    },
    includes: {
      en: [
        'Pre-shoot shot list and location plan',
        'Hospitality and real estate interiors, exteriors and details',
        'Product and lifestyle photography',
        'Portraits and team photos',
        'Colour-graded selects delivered in web and print sizes',
      ],
      fr: [
        'Liste de plans et repérage avant la séance',
        'Intérieurs, extérieurs et détails pour l’hôtellerie et l’immobilier',
        'Photographie produit et lifestyle',
        'Portraits et photos d’équipe',
        'Sélection étalonnée livrée en formats web et impression',
      ],
    },
    idealFor: {
      en: ['Riads, hotels and villas', 'Real estate agencies', 'Artisans and product brands', 'Couples and families on holiday'],
      fr: ['Riads, hôtels et villas', 'Agences immobilières', 'Artisans et marques de produits', 'Couples et familles en vacances'],
    },
    faq: {
      en: [
        {
          q: 'When is the best light for a photo shoot in Essaouira?',
          a: 'Early morning for calm air and soft light, and the hour before sunset for warm light on the ramparts and beach. The afternoon trade wind is strongest in summer, so we plan outdoor portraits around it.',
        },
      ],
      fr: [
        {
          q: 'Quelle est la meilleure lumière pour une séance photo à Essaouira ?',
          a: 'Tôt le matin pour un air calme et une lumière douce, et l’heure avant le coucher du soleil pour une lumière chaude sur les remparts et la plage. L’alizé de l’après-midi est plus fort en été, nous organisons donc les portraits en extérieur en conséquence.',
        },
      ],
    },
    image: categoryImage.photo,
  },
  {
    id: 'brand',
    slug: { en: 'brand-films', fr: 'films-de-marque' },
    name: { en: 'Brand films', fr: 'Films de marque' },
    line: {
      en: 'Short cinematic films that show who you are and why people should come.',
      fr: 'Des films courts et cinématographiques qui montrent qui vous êtes et donnent envie de venir.',
    },
    title: {
      en: 'Brand Films & Commercials in Essaouira | Tansift',
      fr: 'Films de marque et publicités à Essaouira | Tansift',
    },
    description: {
      en: 'Brand films, commercials and corporate videos shot in Essaouira, from script and location scouting to edit and colour grade.',
      fr: 'Films de marque, publicités et vidéos d’entreprise tournés à Essaouira, du scénario et du repérage au montage et à l’étalonnage.',
    },
    intro: {
      en: 'Tansift is a video production company based in Essaouira. We make brand films, commercials and corporate videos from start to finish: idea and script, location scouting, the shoot, then editing, sound and colour grading, delivered in every format you need.',
      fr: 'Tansift est une société de production vidéo basée à Essaouira. Nous réalisons films de marque, publicités et vidéos d’entreprise de A à Z : idée et scénario, repérages, tournage, puis montage, son et étalonnage, livrés dans tous les formats nécessaires.',
    },
    includes: {
      en: [
        'Creative concept and script',
        'Location scouting and scheduling around light and wind',
        'Director, camera crew, lighting and sound',
        'Editing, sound design and colour grading',
        'Cut-downs for social media and ads',
      ],
      fr: [
        'Concept créatif et scénario',
        'Repérages et planning selon la lumière et le vent',
        'Réalisateur, équipe caméra, lumière et son',
        'Montage, habillage sonore et étalonnage',
        'Versions courtes pour les réseaux sociaux et la publicité',
      ],
    },
    idealFor: {
      en: ['Hotels and tourism brands', 'Food and craft brands', 'NGOs and institutions', 'Agencies needing a local crew'],
      fr: ['Hôtels et marques touristiques', 'Marques alimentaires et artisanales', 'ONG et institutions', 'Agences ayant besoin d’une équipe locale'],
    },
    faq: {
      en: [
        {
          q: 'How long does a brand film take?',
          a: 'Most short brand films take two to four weeks from brief to delivery: about a week of preparation, one to three shoot days, and one to two weeks of editing with one round of changes.',
        },
      ],
      fr: [
        {
          q: 'Combien de temps faut-il pour un film de marque ?',
          a: 'La plupart des films courts prennent deux à quatre semaines entre le brief et la livraison : environ une semaine de préparation, un à trois jours de tournage et une à deux semaines de montage avec une série de retours.',
        },
      ],
    },
    image: categoryImage.brand,
  },
  {
    id: 'weddings',
    slug: { en: 'weddings-and-events', fr: 'mariages-et-evenements' },
    name: { en: 'Weddings & events', fr: 'Mariages et événements' },
    line: {
      en: 'Wedding films and photos by a crew that already lives in Essaouira.',
      fr: 'Films et photos de mariage par une équipe qui vit déjà à Essaouira.',
    },
    title: {
      en: 'Wedding Videographer & Photographer in Essaouira',
      fr: 'Vidéaste et photographe de mariage à Essaouira',
    },
    description: {
      en: 'Wedding videographer and photographer based in Essaouira. Highlight films, full-length films and photos for weddings, elopements and events, with no travel fees in the region.',
      fr: 'Vidéaste et photographe de mariage basé à Essaouira. Films courts, films complets et photos pour mariages, élopements et événements, sans frais de déplacement dans la région.',
    },
    intro: {
      en: 'Tansift films and photographs weddings, elopements and events in Essaouira and along the coast. Because the crew is based here, you get people who already know the venues, the light and the wind, and no travel fees for local ceremonies.',
      fr: 'Tansift filme et photographie mariages, élopements et événements à Essaouira et sur la côte. L’équipe est basée ici : elle connaît déjà les lieux, la lumière et le vent, et il n’y a pas de frais de déplacement pour les cérémonies locales.',
    },
    includes: {
      en: [
        'Planning call and venue walk-through',
        'Highlight film of 3 to 5 minutes',
        'Full-length ceremony and speeches',
        'Edited photo gallery',
        'Drone shots where authorised',
      ],
      fr: [
        'Appel de préparation et visite du lieu',
        'Film court de 3 à 5 minutes',
        'Cérémonie et discours en version complète',
        'Galerie photo retouchée',
        'Plans drone lorsque c’est autorisé',
      ],
    },
    idealFor: {
      en: ['Destination weddings', 'Elopements on the beach or ramparts', 'Moroccan weddings', 'Festivals and private events'],
      fr: ['Mariages à destination', 'Élopements sur la plage ou les remparts', 'Mariages marocains', 'Festivals et événements privés'],
    },
    faq: {
      en: [
        {
          q: 'Do you travel outside Essaouira?',
          a: 'Yes. We regularly work along the coast and inland, including Sidi Kaouki, Marrakech and Agadir. Travel costs outside the Essaouira area are added to the quote.',
        },
      ],
      fr: [
        {
          q: 'Vous déplacez-vous en dehors d’Essaouira ?',
          a: 'Oui. Nous travaillons régulièrement sur la côte et à l’intérieur des terres, notamment à Sidi Kaouki, Marrakech et Agadir. Les frais de déplacement hors de la région d’Essaouira sont ajoutés au devis.',
        },
      ],
    },
    image: categoryImage.weddings,
  },
  {
    id: 'drone',
    slug: { en: 'drone-filming', fr: 'tournage-drone' },
    name: { en: 'Drone & aerial', fr: 'Drone et prises aériennes' },
    line: {
      en: 'Aerial shots of the coast, medina and landscapes, with the permits handled.',
      fr: 'Prises aériennes de la côte, de la médina et des paysages, autorisations comprises.',
    },
    title: {
      en: 'Drone Filming in Essaouira | Aerial Video & Permits',
      fr: 'Tournage drone à Essaouira | Vidéo aérienne et autorisations',
    },
    description: {
      en: 'Drone filming in Essaouira and along the Moroccan coast. Aerial video and photos for films, brands and real estate, with the required permits prepared in advance.',
      fr: 'Tournage drone à Essaouira et sur la côte marocaine. Vidéos et photos aériennes pour films, marques et immobilier, avec les autorisations nécessaires préparées à l’avance.',
    },
    intro: {
      en: 'Flying a drone in Morocco requires a filming permit and a separate drone authorisation, which takes at least about 10 working days. Tansift plans aerial shots of Essaouira early, prepares the paperwork and flies in the calm morning air before the trade wind builds.',
      fr: 'Faire voler un drone au Maroc exige une autorisation de tournage et une autorisation drone distincte, qui prend au moins une dizaine de jours ouvrés. Tansift planifie les plans aériens d’Essaouira en amont, prépare les dossiers et vole le matin, avant que l’alizé ne se lève.',
    },
    includes: {
      en: [
        'Permit preparation and timeline planning',
        'Aerial video in 4K and stills',
        'Coastline, medina, dunes and property shots',
        'Morning flight windows to avoid strong wind',
        'Graded aerial footage matched to the rest of the film',
      ],
      fr: [
        'Préparation des autorisations et du calendrier',
        'Vidéo aérienne en 4K et photos',
        'Plans du littoral, de la médina, des dunes et des propriétés',
        'Vols le matin pour éviter le vent fort',
        'Images aériennes étalonnées en cohérence avec le reste du film',
      ],
    },
    idealFor: {
      en: ['Real estate and villas', 'Tourism and hotel films', 'Weddings and events', 'Documentaries'],
      fr: ['Immobilier et villas', 'Films touristiques et hôteliers', 'Mariages et événements', 'Documentaires'],
    },
    faq: {
      en: [
        {
          q: 'Can I fly my own drone in Essaouira?',
          a: 'Not without authorisation. Morocco has banned unauthorised civilian drone use since 2015. Professional aerial filming needs a filming permit and a drone permit from the regional authorities.',
        },
      ],
      fr: [
        {
          q: 'Puis-je faire voler mon propre drone à Essaouira ?',
          a: 'Pas sans autorisation. Le Maroc interdit l’usage civil non autorisé des drones depuis 2015. Le tournage aérien professionnel nécessite une autorisation de tournage et une autorisation drone délivrée par les autorités régionales.',
        },
      ],
    },
    image: categoryImage.drone,
  },
];

export function serviceUrl(s: Service, lang: Lang): string {
  return lang === 'en' ? `/services/${s.slug.en}/` : `/fr/services/${s.slug.fr}/`;
}
