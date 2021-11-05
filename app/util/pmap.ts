export interface PmapOptions<TVal, TRet> {
  concurrency?: number;
  onProgress?: (completedItem: TVal, returnVal: TRet, nComplete: number) => void;
}

/**
 * Allows waiting on a bulk set of computationally expensive async
 * bulk operations. It behaves similarly to Promise.all, but
 * allows passing a concurency number, which restricts the number
 * of inflight operations at once, and also allows processing of
 * each item as it completes.
 * @param items A set of iterms to operate on
 * @param executor Takes an item and returns a rpmoise
 * @param options An object containing options
 * @returns An array of return values in the same order as the original items
 */
export function pmap<TVal, TRet>(
  items: TVal[],
  executor: (val: TVal) => Promise<TRet>,
  options: PmapOptions<TVal, TRet> = {},
): Promise<TRet[]> {
  const opts: PmapOptions<TVal, TRet> = {
    concurrency: Infinity,
    ...options,
  };

  if (items.length === 0) return Promise.resolve([]);

  return new Promise<TRet[]>((resolve, reject) => {
    // Store each item with its index for ordering of
    // return values later.
    const toExecute: [TVal, number][] = items.map((item, index) => [item, index]);
    const returns: [TRet, number][] = [];
    const totalNum = toExecute.length;
    let errored = false;

    function executeNext() {
      const item = toExecute.shift();
      if (item == null) return;

      executor(item[0])
        .then(ret => {
          // Another promise rejected, so abort
          if (errored) return;

          returns.push([ret, item[1]]);

          // Update progress callback
          if (opts.onProgress) {
            opts.onProgress(item[0], ret, returns.length);
          }

          if (toExecute.length > 0) {
            executeNext();
          } else if (returns.length === totalNum) {
            const orderedReturns: TRet[] = [];

            returns.forEach(set => {
              orderedReturns[set[1]] = set[0];
            });

            resolve(orderedReturns);
          }
        })
        .catch(e => {
          errored = true;
          reject(e);
        });
    }

    // Fire off the initial set of requests
    Array(Math.min(items.length, opts.concurrency ?? Infinity))
      .fill(0)
      .forEach(() => executeNext());
  });
}
