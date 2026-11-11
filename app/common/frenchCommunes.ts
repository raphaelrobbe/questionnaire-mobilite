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

/** Un code postal par commune, d’après le fichier officiel des communes du Doubs. */
const POSTAL_CODES: Readonly<Record<string, string>> = {
  Chaffois: '25300',
  Dommartin: '25300',
  Doubs: '25300',
  'Granges-Narboz': '25300',
  Houtaud: '25300',
  'La Cluse-et-Mijoux': '25300',
  Pontarlier: '25300',
  'Sainte-Colombe': '25300',
  'Verrières-de-Joux': '25300',
  Vuillecin: '25300',
  'Les Alliés': '25300',
  'Arc-sous-Cicon': '25520',
  Arçon: '25300',
  Aubonne: '25520',
  Bugny: '25520',
  Gilley: '25650',
  'La Chaux': '25650',
  'Maisons-du-Bois-Lièvremont': '25650',
  Ouhans: '25520',
  'Pays-de-Montbenoît': '25650',
  Renédale: '25520',
  'Saint-Gorgon-Main': '25520',
  'Arc-sous-Montenot': '25270',
  "Chapelle-d'Huin": '25270',
  Évillers: '25520',
  Gevresin: '25270',
  Levier: '25270',
  Septfontaines: '25270',
  "Val-d'Usiers": '25520',
  "Villeneuve-d'Amont": '25270',
  'Villers-sous-Chalamont': '25270',
  Bannans: '25560',
  Bonnevaux: '25560',
  Boujailles: '25560',
  Bouverans: '25560',
  Bulle: '25560',
  Courvières: '25560',
  'Dompierre-les-Tilleuls': '25560',
  Frasne: '25560',
  'La Rivière-Drugeon': '25560',
  'Vaux-et-Chantegrue': '25160',
  'Brey-et-Maison-du-Bois': '25240',
  'Chapelle-des-Bois': '25240',
  Châtelblanc: '25240',
  'Chaux-Neuve': '25240',
  'Le Crouzet': '25240',
  'Fourcatier-et-Maison-Neuve': '25370',
  'Les Fourgs': '25300',
  Gellin: '25240',
  'Les Grangettes': '25160',
  'Les Hôpitaux-Neufs': '25370',
  'Les Hôpitaux-Vieux': '25370',
  Jougne: '25370',
  'La Planée': '25160',
  'Labergement-Sainte-Marie': '25160',
  "Longevilles-Mont-d'Or": '25370',
  Malbuisson: '25160',
  Malpas: '25160',
  Métabief: '25370',
  Montperreux: '25160',
  Mouthe: '25240',
  'Oye-et-Pallet': '25160',
  'Petite-Chaux': '25240',
  'Les Pontets': '25240',
  Reculfoz: '25240',
  'Remoray-Boujeons': '25160',
  Rochejean: '25370',
  Rondefontaine: '25240',
  'Saint-Antoine': '25370',
  'Saint-Point-Lac': '25160',
  Sarrageois: '25240',
  'Touillon-et-Loutelet': '25370',
  'Les Villedieu': '25240',
}

const POSTAL_BY_FOLD = new Map(Object.entries(POSTAL_CODES).map(([name, code]) => [fold(name), code]))

export function frenchPostalCode(commune: string): string {
  return POSTAL_BY_FOLD.get(fold(commune.trim())) ?? ''
}

/** « 25300 Pontarlier ». Le nom seul si la commune n’est pas dans la base française. */
export function communePlace(commune: string): string {
  const name = commune.trim()
  const code = frenchPostalCode(name)
  return code ? `${code} ${name}` : name
}
