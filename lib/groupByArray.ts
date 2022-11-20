export default function groupByArray<T extends object, K extends keyof T>(
  array: T[],
  key: K
) {
  return array.reduce((acc, match) => {
    if (acc.length === 0 || acc[acc.length - 1][0][key] !== match[key]) {
      acc.push([match]);
    } else {
      acc[acc.length - 1].push(match);
    }
    return acc;
  }, [] as T[][]);
}
