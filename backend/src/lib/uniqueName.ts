export function uniqueFileName(name: string, taken: Iterable<string>): string {
  const takenSet = new Set(taken);
  if (!takenSet.has(name)) return name;

  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';

  let n = 1;
  while (takenSet.has(`${base} (${n})${ext}`)) n++;
  return `${base} (${n})${ext}`;
}
