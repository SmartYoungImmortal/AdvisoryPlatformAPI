import { OffsetPaginationDto, paginate } from './offset-pagination.dto';

describe('OffsetPaginationDto', () => {
  it('defaults to page 1, limit 20, offset 0', () => {
    const dto = new OffsetPaginationDto();

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.offset).toBe(0);
  });

  it('computes offset from page and limit', () => {
    const dto = new OffsetPaginationDto();
    dto.page = 3;
    dto.limit = 10;

    expect(dto.offset).toBe(20);
  });
});

describe('paginate', () => {
  it('shapes items, total, and page metadata into a paginated result', () => {
    const dto = new OffsetPaginationDto();
    dto.page = 2;
    dto.limit = 10;

    const result = paginate(['a', 'b'], 25, dto);

    expect(result).toEqual({
      items: ['a', 'b'],
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });
});
