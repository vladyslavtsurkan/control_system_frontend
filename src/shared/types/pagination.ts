export interface PaginatedResponse<T> {
  count: number;
  page?: number | null;
  per_page: number | null;
  total_pages: number | null;
  items: T[];
}

export interface PaginationQueryParams {
  offset?: number;
  limit?: number;
}

export interface ItemsResponse<T> {
  items: T[];
}
