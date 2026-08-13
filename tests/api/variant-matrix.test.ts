import { generateVariantMatrix } from '@/lib/variant-matrix';

describe('generateVariantMatrix', () => {
  it('produces the full cartesian product with titles', () => {
    const cells = generateVariantMatrix([
      { name: 'Size', values: ['S', 'M'] },
      { name: 'Colour', values: ['Red', 'Blue'] },
    ]);
    expect(cells).toHaveLength(4);
    expect(cells.map((c) => c.title).sort()).toEqual(['M / Blue', 'M / Red', 'S / Blue', 'S / Red']);
    expect(cells[0].selectedOptions).toEqual([{ name: 'Size', value: 'S' }, { name: 'Colour', value: 'Red' }]);
  });

  it('returns a single Default cell for no dimensions', () => {
    expect(generateVariantMatrix([])).toEqual([{ title: 'Default Title', selectedOptions: [] }]);
  });

  it('skips dimensions with no values', () => {
    expect(generateVariantMatrix([{ name: 'Size', values: [] }, { name: 'Colour', values: ['Red'] }])).toHaveLength(1);
  });
});
