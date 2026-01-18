export function formatList(items: string[]): string {
  return items.map(item => `- ${item}`).join('\n');
}
