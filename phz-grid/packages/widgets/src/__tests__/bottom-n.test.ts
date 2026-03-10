import { describe, it, expect } from 'vitest';

describe('Bottom-N logic', () => {
  const data = [
    { school: 'A', attendance: 95 },
    { school: 'B', attendance: 72 },
    { school: 'C', attendance: 88 },
    { school: 'D', attendance: 65 },
    { school: 'E', attendance: 91 },
  ];

  it('ranks bottom 3 ascending', () => {
    const sorted = [...data].sort((a, b) => a.attendance - b.attendance).slice(0, 3);
    expect(sorted[0].school).toBe('D');
    expect(sorted[1].school).toBe('B');
    expect(sorted[2].school).toBe('C');
  });

  it('ranks top 3 descending', () => {
    const sorted = [...data].sort((a, b) => b.attendance - a.attendance).slice(0, 3);
    expect(sorted[0].school).toBe('A');
    expect(sorted[1].school).toBe('E');
    expect(sorted[2].school).toBe('C');
  });
});
