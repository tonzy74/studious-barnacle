import { closestLineup, lineupProgress } from '../src/lib/lineups';
import { Bottle } from '../src/types';

const b = (name: string): Bottle => ({
  id: name,
  name,
  distillery: 'D',
  type: 'bourbon',
  proof: 100,
  flavor: {} as never,
  notes: '',
  rarity: 'C',
  opened: false,
  quantity: 1,
  addedAt: 0,
});

describe('lineupProgress', () => {
  it('surfaces started-but-unfinished lineups with the missing bottles', () => {
    const bottles = [b('E.H. Taylor Small Batch'), b('E.H. Taylor Barrel Proof')];
    const prog = lineupProgress(bottles);
    const taylor = prog.find((p) => p.name === 'E.H. Taylor Collection');
    expect(taylor).toBeDefined();
    expect(taylor!.owned).toBe(2);
    expect(taylor!.total).toBe(4);
    expect(taylor!.missing).toContain('E.H. Taylor Single Barrel');
    expect(taylor!.missing).toContain('E.H. Taylor Straight Rye');
  });

  it('excludes lineups not started', () => {
    expect(lineupProgress([b('Some Random Bourbon')])).toHaveLength(0);
  });

  it('excludes fully-owned lineups', () => {
    const complete = [
      b('Four Roses Small Batch'),
      b('Four Roses Single Barrel'),
      b('Four Roses Small Batch Select'),
    ];
    expect(lineupProgress(complete).find((p) => p.name === 'Four Roses Core')).toBeUndefined();
  });

  it('closestLineup returns the one nearest completion', () => {
    const bottles = [
      b('E.H. Taylor Small Batch'), // 1/4
      b('Four Roses Small Batch'),
      b('Four Roses Single Barrel'), // 2/3 — closer
    ];
    expect(closestLineup(bottles)?.name).toBe('Four Roses Core');
  });
});
