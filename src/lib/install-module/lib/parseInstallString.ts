export default function parseInstallString(installString: string) {
  const installParts = installString.split('/');
  const nameVersionParts = installParts.pop().split('@');
  const version = nameVersionParts.length > 1 ? nameVersionParts.pop() : undefined;
  const name = [...installParts, nameVersionParts.join('@')].join('/');
  return {
    name,
    version,
  };
}
