export interface VariantDimension { name: string; values: string[] }
export interface VariantMatrixCell {
  title: string;
  selectedOptions: Array<{ name: string; value: string }>;
}

export function generateVariantMatrix(dimensions: VariantDimension[]): VariantMatrixCell[] {
  const nonEmpty = dimensions.filter((d) => d.name.trim() && d.values.some((v) => v.trim()));
  if (nonEmpty.length === 0) return [{ title: 'Default Title', selectedOptions: [] }];

  let combos: Array<Array<{ name: string; value: string }>> = [[]];
  for (const dim of nonEmpty) {
    const next: Array<Array<{ name: string; value: string }>> = [];
    for (const combo of combos) {
      for (const value of dim.values) {
        if (!value.trim()) continue;
        next.push([...combo, { name: dim.name, value }]);
      }
    }
    combos = next;
  }

  return combos.map((selectedOptions) => ({
    title: selectedOptions.map((o) => o.value).join(' / '),
    selectedOptions,
  }));
}
