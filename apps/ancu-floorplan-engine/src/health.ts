export type BindingPresence = {
  db: boolean;
  r2: boolean;
  conversionQueue: boolean;
  crawlQueue: boolean;
  workflow: boolean;
  ai: boolean;
};

export function getBindingPresence(env: {
  ENGINE_DB?: unknown;
  FLOORPLANS?: unknown;
  CONVERSION_QUEUE?: unknown;
  CRAWL_QUEUE?: unknown;
  CONVERSION_WORKFLOW?: unknown;
  AI?: unknown;
}): BindingPresence {
  return {
    db: Boolean(env.ENGINE_DB),
    r2: Boolean(env.FLOORPLANS),
    conversionQueue: Boolean(env.CONVERSION_QUEUE),
    crawlQueue: Boolean(env.CRAWL_QUEUE),
    workflow: Boolean(env.CONVERSION_WORKFLOW),
    ai: Boolean(env.AI),
  };
}
