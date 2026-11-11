import { fold } from './config'

export type FrenchCommunity = {
  name: string
  /** Texte du bouton. */
  label: string
  territory: string
  communes: readonly string[]
}

/** Communes des cinq communautés de communes du pays du Haut-Doubs. */
export const FRENCH_COMMUNITIES: readonly FrenchCommunity[] = [
  {
    name: 'Grand Pontarlier',
    label: 'Grand Pontarlier',
    territory: 'Pontarlier, bassin urbain et frontière de Jougne',
    communes: [
      'Chaffois',
      'Dommartin',
      'Doubs',
      'Granges-Narboz',
      'Houtaud',
      'La Cluse-et-Mijoux',
      'Pontarlier',
      'Sainte-Colombe',
      'Verrières-de-Joux',
      'Vuillecin',
    ],
  },
  {
    name: 'Entre Doubs et Loue',
    label: 'Entre Doubs et Loue',
    territory: 'Pays de Montbenoît, Gilley, vallée du Saugeais',
    communes: [
      'Les Alliés',
      'Arc-sous-Cicon',
      'Arçon',
      'Aubonne',
      'Bugny',
      'Gilley',
      'La Chaux',
      'Maisons-du-Bois-Lièvremont',
      'Ouhans',
      'Pays-de-Montbenoît',
      'Renédale',
      'Saint-Gorgon-Main',
    ],
  },
  {
    name: 'Altitude 800',
    label: 'Altitude 800',
    territory: "Levier, Val-d'Usiers et plateaux",
    communes: [
      'Arc-sous-Montenot',
      "Chapelle-d'Huin",
      'Évillers',
      'Gevresin',
      'Levier',
      'Septfontaines',
      "Val-d'Usiers",
      "Villeneuve-d'Amont",
      'Villers-sous-Chalamont',
    ],
  },
  {
    name: 'Plateau de Frasne et du Val du Drugeon',
    label: 'Frasne/Drugeon',
    territory: 'Frasne, bassin du Drugeon',
    communes: [
      'Bannans',
      'Bonnevaux',
      'Boujailles',
      'Bouverans',
      'Bulle',
      'Courvières',
      'Dompierre-les-Tilleuls',
      'Frasne',
      'La Rivière-Drugeon',
      'Vaux-et-Chantegrue',
    ],
  },
  {
    name: 'Lacs et Montagnes du Haut-Doubs',
    label: 'Lacs et Mont. du H-D',
    territory: "Métabief, Mouthe, lac Saint-Point, Mont d'Or et frontière suisse",
    communes: [
      'Brey-et-Maison-du-Bois',
      'Chapelle-des-Bois',
      'Châtelblanc',
      'Chaux-Neuve',
      'Le Crouzet',
      'Fourcatier-et-Maison-Neuve',
      'Les Fourgs',
      'Gellin',
      'Les Grangettes',
      'Les Hôpitaux-Neufs',
      'Les Hôpitaux-Vieux',
      'Jougne',
      'La Planée',
      'Labergement-Sainte-Marie',
      "Longevilles-Mont-d'Or",
      'Malbuisson',
      'Malpas',
      'Métabief',
      'Montperreux',
      'Mouthe',
      'Oye-et-Pallet',
      'Petite-Chaux',
      'Les Pontets',
      'Reculfoz',
      'Remoray-Boujeons',
      'Rochejean',
      'Rondefontaine',
      'Saint-Antoine',
      'Saint-Point-Lac',
      'Sarrageois',
      'Touillon-et-Loutelet',
      'Les Villedieu',
    ],
  },
]

export function frenchCommunityFor(commune: string): FrenchCommunity | undefined {
  const key = fold(commune.trim())
  if (!key) return
  return FRENCH_COMMUNITIES.find((item) => item.communes.some((name) => fold(name) === key))
}
