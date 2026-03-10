export interface RemoteDataRequest {
  offset: number;
  limit: number;
  sort?: { field: string; direction: 'asc' | 'desc' };
  filters?: Record<string, { op: string; value: string }>;
}

export interface RemoteDataResponse {
  data: any[];
  totalCount: number;
  executionTime: number;
}

export function createRemoteDataSource(dataset: string) {
  return async (request: RemoteDataRequest): Promise<RemoteDataResponse> => {
    const params = new URLSearchParams();
    params.set('offset', String(request.offset));
    params.set('limit', String(request.limit));

    if (request.sort) {
      params.set('sort', `${request.sort.field}:${request.sort.direction}`);
    }

    if (request.filters) {
      const parts = Object.entries(request.filters).map(
        ([field, f]) => `${field}:${f.op}:${f.value}`,
      );
      if (parts.length > 0) {
        params.set('filter', parts.join(','));
      }
    }

    params.set('mode', 'page');
    const resp = await fetch(`/api/datasets/${dataset}?${params.toString()}`);
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    return resp.json();
  };
}
