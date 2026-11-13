import { fold } from './config'

export type FrenchCommunity = {
  name: string
  /** Texte du bouton. */
  label: string
  territory: string
}

/** Les cinq communautés de communes du pays du Haut-Doubs, sans leurs communes. */
export const FRENCH_COMMUNITIES = {
  GP: {
    name: 'Grand Pontarlier',
    label: 'Grand Pontarlier',
    territory: 'Pontarlier, bassin urbain et frontière de Jougne',
  },
  EDL: {
    name: 'Entre Doubs et Loue',
    label: 'Entre Doubs et Loue',
    territory: 'Pays de Montbenoît, Gilley, vallée du Saugeais',
  },
  A800: {
    name: 'Altitude 800',
    label: 'Altitude 800',
    territory: "Levier, Val-d'Usiers et plateaux",
  },
  FD: {
    name: 'Plateau de Frasne et du Val du Drugeon',
    label: 'Frasne/Drugeon',
    territory: 'Frasne, bassin du Drugeon',
  },
  LMHD: {
    name: 'Lacs et Montagnes du Haut-Doubs',
    label: 'Lacs et Mont. du H-D',
    territory: "Métabief, Mouthe, lac Saint-Point, Mont d'Or et frontière suisse",
  },
} as const satisfies Record<string, FrenchCommunity>

export type CommunityId = keyof typeof FRENCH_COMMUNITIES

type CommuneRecord = {
  postal: string
  insee: string
  population: number
  community: CommunityId
}

/** Une commune : code postal, code INSEE, population et communauté. L’ordre des clés est celui des boutons. */
const POSTAL_CODES: Readonly<Record<string, CommuneRecord>> = {
  Chaffois: { postal: '25300', insee: '25110', population: 1032, community: 'GP' },
  Dommartin: { postal: '25300', insee: '25201', population: 864, community: 'GP' },
  Doubs: { postal: '25300', insee: '25204', population: 3335, community: 'GP' },
  'Granges-Narboz': { postal: '25300', insee: '25293', population: 1359, community: 'GP' },
  Houtaud: { postal: '25300', insee: '25309', population: 1216, community: 'GP' },
  'La Cluse-et-Mijoux': { postal: '25300', insee: '25157', population: 1310, community: 'GP' },
  Pontarlier: { postal: '25300', insee: '25462', population: 18067, community: 'GP' },
  'Sainte-Colombe': { postal: '25300', insee: '25515', population: 488, community: 'GP' },
  'Verrières-de-Joux': { postal: '25300', insee: '25609', population: 464, community: 'GP' },
  Vuillecin: { postal: '25300', insee: '25634', population: 687, community: 'GP' },
  'Les Alliés': { postal: '25300', insee: '25012', population: 172, community: 'EDL' },
  'Arc-sous-Cicon': { postal: '25520', insee: '25025', population: 768, community: 'EDL' },
  Arçon: { postal: '25300', insee: '25024', population: 961, community: 'EDL' },
  Aubonne: { postal: '25520', insee: '25029', population: 266, community: 'EDL' },
  Bugny: { postal: '25520', insee: '25099', population: 257, community: 'EDL' },
  Gilley: { postal: '25650', insee: '25271', population: 1842, community: 'EDL' },
  'La Chaux': { postal: '25650', insee: '25139', population: 614, community: 'EDL' },
  'Maisons-du-Bois-Lièvremont': { postal: '25650', insee: '25357', population: 835, community: 'EDL' },
  Ouhans: { postal: '25520', insee: '25440', population: 398, community: 'EDL' },
  'Pays-de-Montbenoît': { postal: '25650', insee: '25390', population: 1923, community: 'EDL' },
  Renédale: { postal: '25520', insee: '25487', population: 41, community: 'EDL' },
  'Saint-Gorgon-Main': { postal: '25520', insee: '25517', population: 250, community: 'EDL' },
  'Arc-sous-Montenot': { postal: '25270', insee: '25026', population: 227, community: 'A800' },
  "Chapelle-d'Huin": { postal: '25270', insee: '25122', population: 549, community: 'A800' },
  Évillers: { postal: '25520', insee: '25229', population: 387, community: 'A800' },
  Gevresin: { postal: '25270', insee: '25270', population: 158, community: 'A800' },
  Levier: { postal: '25270', insee: '25334', population: 2400, community: 'A800' },
  Septfontaines: { postal: '25270', insee: '25541', population: 371, community: 'A800' },
  "Val-d'Usiers": { postal: '25520', insee: '25060', population: 2132, community: 'A800' },
  "Villeneuve-d'Amont": { postal: '25270', insee: '25621', population: 213, community: 'A800' },
  'Villers-sous-Chalamont': { postal: '25270', insee: '25627', population: 293, community: 'A800' },
  Bannans: { postal: '25560', insee: '25041', population: 370, community: 'FD' },
  Bonnevaux: { postal: '25560', insee: '25075', population: 410, community: 'FD' },
  Boujailles: { postal: '25560', insee: '25079', population: 461, community: 'FD' },
  Bouverans: { postal: '25560', insee: '25085', population: 461, community: 'FD' },
  Bulle: { postal: '25560', insee: '25100', population: 505, community: 'FD' },
  Courvières: { postal: '25560', insee: '25176', population: 317, community: 'FD' },
  'Dompierre-les-Tilleuls': { postal: '25560', insee: '25202', population: 291, community: 'FD' },
  Frasne: { postal: '25560', insee: '25259', population: 1975, community: 'FD' },
  'La Rivière-Drugeon': { postal: '25560', insee: '25493', population: 933, community: 'FD' },
  'Vaux-et-Chantegrue': { postal: '25160', insee: '25592', population: 689, community: 'FD' },
  'Brey-et-Maison-du-Bois': { postal: '25240', insee: '25096', population: 188, community: 'LMHD' },
  'Chapelle-des-Bois': { postal: '25240', insee: '25121', population: 268, community: 'LMHD' },
  Châtelblanc: { postal: '25240', insee: '25131', population: 117, community: 'LMHD' },
  'Chaux-Neuve': { postal: '25240', insee: '25142', population: 338, community: 'LMHD' },
  'Le Crouzet': { postal: '25240', insee: '25179', population: 51, community: 'LMHD' },
  'Fourcatier-et-Maison-Neuve': { postal: '25370', insee: '25252', population: 130, community: 'LMHD' },
  'Les Fourgs': { postal: '25300', insee: '25254', population: 1443, community: 'LMHD' },
  Gellin: { postal: '25240', insee: '25263', population: 267, community: 'LMHD' },
  'Les Grangettes': { postal: '25160', insee: '25295', population: 334, community: 'LMHD' },
  'Les Hôpitaux-Neufs': { postal: '25370', insee: '25307', population: 967, community: 'LMHD' },
  'Les Hôpitaux-Vieux': { postal: '25370', insee: '25308', population: 462, community: 'LMHD' },
  Jougne: { postal: '25370', insee: '25318', population: 1937, community: 'LMHD' },
  'La Planée': { postal: '25160', insee: '25459', population: 332, community: 'LMHD' },
  'Labergement-Sainte-Marie': { postal: '25160', insee: '25320', population: 1273, community: 'LMHD' },
  "Longevilles-Mont-d'Or": { postal: '25370', insee: '25348', population: 625, community: 'LMHD' },
  Malbuisson: { postal: '25160', insee: '25361', population: 903, community: 'LMHD' },
  Malpas: { postal: '25160', insee: '25362', population: 300, community: 'LMHD' },
  Métabief: { postal: '25370', insee: '25380', population: 1375, community: 'LMHD' },
  Montperreux: { postal: '25160', insee: '25405', population: 940, community: 'LMHD' },
  Mouthe: { postal: '25240', insee: '25413', population: 1037, community: 'LMHD' },
  'Oye-et-Pallet': { postal: '25160', insee: '25442', population: 709, community: 'LMHD' },
  'Petite-Chaux': { postal: '25240', insee: '25451', population: 177, community: 'LMHD' },
  'Les Pontets': { postal: '25240', insee: '25464', population: 141, community: 'LMHD' },
  Reculfoz: { postal: '25240', insee: '25483', population: 45, community: 'LMHD' },
  'Remoray-Boujeons': { postal: '25160', insee: '25486', population: 466, community: 'LMHD' },
  Rochejean: { postal: '25370', insee: '25494', population: 754, community: 'LMHD' },
  Rondefontaine: { postal: '25240', insee: '25501', population: 38, community: 'LMHD' },
  'Saint-Antoine': { postal: '25370', insee: '25514', population: 305, community: 'LMHD' },
  'Saint-Point-Lac': { postal: '25160', insee: '25525', population: 306, community: 'LMHD' },
  Sarrageois: { postal: '25240', insee: '25534', population: 197, community: 'LMHD' },
  'Touillon-et-Loutelet': { postal: '25370', insee: '25565', population: 262, community: 'LMHD' },
  'Les Villedieu': { postal: '25240', insee: '25619', population: 233, community: 'LMHD' },
}

const POSTAL_BY_FOLD = new Map(
  Object.entries(POSTAL_CODES).map(([name, record]) => [fold(name), { name, ...record }]),
)

export function frenchPostalCode(commune: string): string {
  return POSTAL_BY_FOLD.get(fold(commune.trim()))?.postal ?? ''
}

export function frenchCommunityFor(commune: string): FrenchCommunity | undefined {
  const community = POSTAL_BY_FOLD.get(fold(commune.trim()))?.community
  return community ? FRENCH_COMMUNITIES[community] : undefined
}

/** Communautés dans l’ordre des boutons, avec les communes qui s’y rattachent. */
export function frenchCommunityList(): { label: string; territory: string; communes: readonly string[] }[] {
  return (Object.keys(FRENCH_COMMUNITIES) as CommunityId[]).map((id) => ({
    label: FRENCH_COMMUNITIES[id].label,
    territory: FRENCH_COMMUNITIES[id].territory,
    communes: Object.entries(POSTAL_CODES)
      .filter(([, record]) => record.community === id)
      .map(([name]) => name),
  }))
}

/** « 25300 Pontarlier ». Le nom seul si la commune n’est pas dans la base française. */
export function communePlace(commune: string): string {
  const name = commune.trim()
  const code = frenchPostalCode(name)
  return code ? `${code} ${name}` : name
}
