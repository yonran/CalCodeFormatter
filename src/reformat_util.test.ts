import { getLevels } from './reformat_util';

describe('getLevels', () => {
  test('basic', () => {
    expect(getLevels([])).toEqual([])
    expect(getLevels([[]])).toEqual([0])
    expect(getLevels([['a']])).toEqual([1])
    expect(getLevels([['a'], ['b']])).toEqual([1, 1])
    expect(getLevels([['a'], ['1'], ['A'], ['i'], ['I'], ['b']])).toEqual([1, 2, 3, 4, 5, 1])
    expect(getLevels([['a', '1', 'A'], ['i'], ['I'], ['b']])).toEqual([1, 4, 5, 1])
  });
  test('i is lower-latin if the previous paragraph is shallower than upper-alpha', () => {
    expect(getLevels([['g'], ['h'], ['i']])).toEqual([1, 1, 1])
    expect(getLevels([['v']])).toEqual([1])
    expect(getLevels([['h', '1'], ['i']])).toEqual([1, 1])
  })
  test('i is lower-roman if the previous paragraph is at least upper-latin', () => {
    expect(getLevels([['g'], ['h', '1', 'A'], ['i'], ['ii']])).toEqual([1, 1, 4, 4])
  });
})
