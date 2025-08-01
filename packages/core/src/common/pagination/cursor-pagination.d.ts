export interface CursorPagination {
    cursor: string;
    limit: number;
    direction: 'forward' | 'backward';
}
export interface CursorPaginationResult<T> {
    items: T[];
    nextCursor: string;
}
//# sourceMappingURL=cursor-pagination.d.ts.map