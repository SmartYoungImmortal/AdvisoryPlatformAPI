import { AdvisorRatingSummaryDto } from './advisor-rating-summary.dto';

describe('AdvisorRatingSummaryDto', () => {
  it('reports nothing to average when no one has reviewed', () => {
    const summary = new AdvisorRatingSummaryDto(new Map());

    expect(summary.average).toBeNull();
    expect(summary.total).toBe(0);
    expect(summary.distribution.map((row) => row.count)).toEqual([
      0, 0, 0, 0, 0,
    ]);
  });

  it('lists all five bars highest first, filling ungiven stars with zero', () => {
    const summary = new AdvisorRatingSummaryDto(new Map([[3, 2]]));

    expect(summary.distribution.map((row) => row.stars)).toEqual([
      5, 4, 3, 2, 1,
    ]);
    expect(summary.distribution.map((row) => row.count)).toEqual([
      0, 0, 2, 0, 0,
    ]);
  });

  it('rounds the average to the one decimal the rating is displayed at', () => {
    // Two fives and a four average 4.666…, which reaches every client as the same 4.7
    // rather than as whatever each one's own formatter decides.
    const summary = new AdvisorRatingSummaryDto(
      new Map([
        [5, 2],
        [4, 1],
      ]),
    );

    expect(summary.total).toBe(3);
    expect(summary.average).toBe(4.7);
  });

  it('weights the average by how many gave each score', () => {
    const summary = new AdvisorRatingSummaryDto(
      new Map([
        [5, 1],
        [1, 3],
      ]),
    );

    expect(summary.total).toBe(4);
    expect(summary.average).toBe(2);
  });
});
