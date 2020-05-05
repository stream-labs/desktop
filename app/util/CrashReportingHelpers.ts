import electron from 'electron';

// Utility functions for extending crash reporting functionality

/**
 * Convert input bytes into string representation with human-redable form with corresponding bytes (KB, MB, GB, etc.) suffix.
 * @param bytes Input bytes as a number
 * @param decimals Control length of fractional part of a number.
 */
export function beautifyBytes(bytes: number, decimals: number = 2) {
  const divider = 1024;
  if (Math.abs(bytes) < divider) {
    return bytes + ' B';
  }

  const suffixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let suffixIndex = -1;
  do {
    bytes /= divider;
    ++suffixIndex;
  } while (Math.abs(bytes) >= divider && suffixIndex < suffixes.length - 1);

  const fractionDigits = decimals < 0 ? 0 : decimals;
  return bytes.toFixed(fractionDigits) + ' ' + suffixes[suffixIndex];
}

/**
 * Helper method to update memory usage stats and commit charge of crashReporter by adding corresponding extra parameters.
 */
export function updateMemoryUsageCrashParameters(crashReporter: Electron.CrashReporter) {
  const memUsage = process.memoryUsage();
  const heapStats = process.getHeapStatistics();
  const systemMemInfo = process.getSystemMemoryInfo();

  crashReporter.addExtraParameter('mem_rss', beautifyBytes(memUsage.rss));
  crashReporter.addExtraParameter('mem_heapUsed', beautifyBytes(memUsage.heapUsed));
  crashReporter.addExtraParameter('mem_heapTotal', beautifyBytes(memUsage.heapTotal));
  crashReporter.addExtraParameter('mem_external', beautifyBytes(memUsage.external));

  // all the values from getHeapStatistics() are in kB, thus need to convert manually to bytes
  crashReporter.addExtraParameter(
    'mem_totalAvailableSize',
    beautifyBytes(heapStats.totalAvailableSize * 1024),
  );
  crashReporter.addExtraParameter(
    'mem_heapSizeLimit',
    beautifyBytes(heapStats.heapSizeLimit * 1024),
  );

  // calculate commit charge in %
  // for some reason, the total commit limit (swap + heap)
  // is stored in swapTotal and swapFree - maybe bug of electron?
  const commitCharge = (
    (100 * (systemMemInfo.swapTotal - systemMemInfo.swapFree)) /
    Math.max(1, systemMemInfo.swapTotal)
  ).toFixed(2);
  crashReporter.addExtraParameter('mem_commitCharge', commitCharge + '%');
}
