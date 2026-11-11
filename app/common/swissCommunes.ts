import { fold } from './config'

export type SwissSector = {
  sector: string
  canton: string
  communes: readonly string[]
  /** Présent quand le secteur n’a aucune commune à proposer. */
  note?: string
}

/** Communes suisses frontalières, par secteur. */
export const SWISS_SECTORS: readonly SwissSector[] = [
  {
    sector: 'Genève et nord de Genève',
    canton: 'Genève',
    communes: [
      'Versoix',
      'Collex-Bossy',
      'Bellevue',
      'Meyrin',
      'Satigny',
      'Dardagny',
      'Russin',
      'Chancy',
      'Avully',
      'Avusy',
      'Soral',
      'Perly-Certoux',
      'Bardonnex',
      'Troinex',
      'Veyrier',
      'Thônex',
      'Jussy',
      'Gy',
      'Hermance',
      'Anières',
    ],
  },
  {
    sector: 'Lausanne – La Côte – Nyon',
    canton: 'Vaud',
    communes: [
      'Chavannes-des-Bois',
      'Commugny',
      'Chavannes-de-Bogis',
      'Bogis-Bossey',
      'Chéserex',
      'Gingins',
      'La Rippe',
      'Crassier',
      'Arnex-sur-Nyon',
      'Borex',
    ],
  },
  {
    sector: 'Lac de Joux – Vallée de Joux',
    canton: 'Vaud',
    communes: ['Le Chenit', "L'Abbaye", 'Le Lieu'],
  },
  {
    sector: 'Yverdon – Orbe – Vallorbe',
    canton: 'Vaud',
    communes: ['Vallorbe', 'Ballaigues', 'Lignerolle', "L'Abergement", 'Les Clées', 'Premier', 'Vaulion'],
  },
  {
    sector: 'Fribourg',
    canton: 'Fribourg',
    communes: [],
    note: 'Pas de communes directement concernées sur le tracé frontalier Mouthe–Jougne–Pontarlier–Les Fourgs',
  },
  {
    sector: 'Neuchâtel – Val-de-Travers',
    canton: 'Neuchâtel',
    communes: ['Les Verrières', 'Val-de-Travers', 'La Côte-aux-Fées', 'La Brévine', 'Le Cerneux-Péquignot'],
  },
  {
    sector: 'Neuchâtel – Le Locle – La Chaux-de-Fonds',
    canton: 'Neuchâtel',
    communes: ['Le Locle', 'La Chaux-de-Fonds', 'Les Planchettes'],
  },
]

export function swissSectorFor(commune: string): SwissSector | undefined {
  const key = fold(commune.trim())
  if (!key) return
  return SWISS_SECTORS.find((item) => item.communes.some((name) => fold(name) === key))
}
