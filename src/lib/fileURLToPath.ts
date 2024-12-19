import url from 'url';

function fileURLToPathPolyfill(fileURL) {
  const path = typeof fileURL === 'string' ? fileURL : fileURL.pathname;
  if (!path.startsWith('file:')) throw new Error('The URL must use the file: protocol');
  return decodeURIComponent(path.substring(7));
}

export default url.fileURLToPath || fileURLToPathPolyfill;
