export interface Parsed {
  content: string;
  isSpecifier: boolean;
}

export default function parser(code: string, regex: RegExp): Parsed[] {
  const parsed: Parsed[] = [];
  let offset = 0;
  let match = regex.exec(code);
  while (match) {
    // Support up to 5 capture groups for declaration-specific patterns
    const dependency = match[1] || match[2] || match[3] || match[4] || match[5];
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
