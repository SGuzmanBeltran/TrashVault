export async function mapInParallel<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;

  let index = 0;
  const workerCount = Math.min(concurrency, items.length);

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = items[index]!;
      index += 1;
      await fn(current);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}
