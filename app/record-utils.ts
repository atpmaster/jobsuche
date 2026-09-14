export const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('de-DE').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^\p{L}\p{N}]/gu, '');

const wordForm = (value: string) => value.normalize('NFKC').toLocaleLowerCase('de-DE').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

type DuplicateCandidate = { company: string; role: string; notes?: string | null; url?: string | null; contactEmail?: string | null };

const ignoredRoleWords = new Set(['bewerbung', 'bewerbungen', 'initiativbewerbung', 'fuer', 'eine', 'einer', 'einem', 'der', 'die', 'das', 'den', 'dem', 'des', 'im', 'in', 'an', 'bei', 'und', 'als', 'mwd']);

function meaningfulTokens(value: string) {
  return new Set(wordForm(value).match(/[a-z0-9]{4,}/g)?.filter((token) => !ignoredRoleWords.has(token)) ?? []);
}

function similarity(a: string, b: string) {
  const left = meaningfulTokens(a);
  const right = meaningfulTokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  left.forEach((token) => { if (right.has(token)) shared += 1; });
  return shared / Math.min(left.size, right.size);
}

function companyIdentity(value: string) {
  return normalize(value).replace(/niedersachsen|deutschland|gmbh|ggmbh|gesellschaft|ev/g, '');
}

export function isDuplicate(a: DuplicateCandidate, b: DuplicateCandidate) {
  const reference = (s: string) => s.match(/\b\d{4,}-\d{2}\b/)?.[0];
  const aRef = reference(`${a.role} ${a.notes || ''}`);
  const bRef = reference(`${b.role} ${b.notes || ''}`);
  if (aRef && bRef && aRef === bRef) return true;

  const aCompany = companyIdentity(a.company);
  const bCompany = companyIdentity(b.company);
  const sameCompany = aCompany === bCompany || (aCompany.length >= 6 && bCompany.length >= 6 && (aCompany.includes(bCompany) || bCompany.includes(aCompany)));
  const roleSimilarity = similarity(a.role, b.role);
  if (sameCompany && (normalize(a.role) === normalize(b.role) || roleSimilarity >= 0.65)) return true;

  const aEmail = a.contactEmail?.trim().toLowerCase();
  const bEmail = b.contactEmail?.trim().toLowerCase();
  return Boolean(aEmail && bEmail && aEmail === bEmail && roleSimilarity >= 0.65);
}
