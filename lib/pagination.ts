export const DEFAULT_PAGE_SIZE = 50;

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  skip: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export function parsePage(value: string | null | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function paginationState({ page, totalItems, pageSize = DEFAULT_PAGE_SIZE }: { page: number; totalItems: number; pageSize?: number }): PaginationState {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const safeTotalItems = Math.max(0, Math.floor(totalItems));
  const totalPages = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page)), totalPages);

  return {
    page: currentPage,
    pageSize: safePageSize,
    totalItems: safeTotalItems,
    totalPages,
    skip: (currentPage - 1) * safePageSize,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };
}

export function paginationHref(path: string, params: Record<string, string | undefined>, page: number) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }

  if (page > 1) searchParams.set("page", String(page));

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}
