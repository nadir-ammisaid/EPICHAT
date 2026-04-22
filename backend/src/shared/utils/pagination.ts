export function buildPaginationArgs(limit: number, before?: string) {
  const args: {
    take: number;
    orderBy: object[];
    cursor?: { id: string };
    skip?: number;
  } = {
    take: limit,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  };

  if (before) {
    args.cursor = { id: before };
    args.skip = 1;
  }

  return args;
}

export function paginateResult<T extends { id: string }>(rows: T[]) {
  const messages = rows.reverse();
  const nextCursor = messages.at(0)?.id ?? null;
  return { messages, nextCursor };
}
