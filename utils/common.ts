export const containsWord = (
  str: string,
  word: string,
  options = { caseSensitive: false }
) => {
  const { caseSensitive } = options;
  const flags = caseSensitive ? "g" : "gi";
  const pattern = `\\b${word}\\b`;
  const regex = new RegExp(pattern, flags);
  return regex.test(str);
};
