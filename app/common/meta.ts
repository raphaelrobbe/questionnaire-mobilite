import type { MetaDescriptor, MetaFunction } from '@remix-run/node'

/** Garde la description définie à la racine, et pose le titre de la page. */
export function pageTitle(title: string, extra: MetaDescriptor[] = []): MetaFunction {
  return ({ matches }) => [
    ...matches.flatMap((match) => match.meta).filter((item) => item == null || !('title' in item)),
    { title },
    ...extra,
  ]
}
