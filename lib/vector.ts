export function toPgVector(values: number[]): string {
  return `[${values.join(",")}]`;
}

export function l2Normalize(values: number[]): number[] {
  const magnitude = Math.hypot(...values);

  if (magnitude === 0) {
    return values;
  }

  return values.map((value) => value / magnitude);
}

export function lerpVectors(
  left: number[],
  right: number[],
  alpha: number,
): number[] {
  return left.map((value, index) => {
    const target = right[index] ?? 0;
    return value * (1 - alpha) + target * alpha;
  });
}
