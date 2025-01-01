export default function parser(code, regex) {
  const parsed = [];
  let offset = 0;
  let match = regex.exec(code);
  while (match) {
    const dependency = match[1] || match[2] || match[3] || match[4];
    parsed.push({ content: code.substring(offset, match.index + match[0].lastIndexOf(dependency)), isSpecifier: false });
    offset += parsed[parsed.length - 1].content.length;
    parsed.push({ content: dependency, isSpecifier: true });
    offset += parsed[parsed.length - 1].content.length;
    match = regex.exec(code);
  }

  if (offset < code.length) {
    parsed.push({ content: code.substring(offset, code.length), isSpecifier: false });
  }
  return parsed;
}
