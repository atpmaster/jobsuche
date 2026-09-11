export const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]/gu, '');
export function isDuplicate(a: {company: string; role: string; notes?: string | null; url?: string | null}, b: {company: string; role: string; notes?: string | null; url?: string | null}) {
  const reference = (s: string) => s.match(/\b\d{4,}-\d{2}\b/)?.[0];
  const company = (s: string) => normalize(s).replace(/^bbsideslandkreises/, 'bbs1').replace(/^bbsi(?=gifhorn)/, 'bbs1');
  const aRef = reference(a.role + ' ' + (a.notes || ''));
  const bRef = reference(b.role + ' ' + (b.notes || ''));
  return company(a.company) === company(b.company) && (normalize(a.role) === normalize(b.role) || (!!aRef && aRef === bRef));
}
