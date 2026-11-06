/* Node test loader: lets `node --test` import studio modules that Vite would
 * normally resolve as static assets (images, stylesheets, audio). */

const ASSET = /\.(png|jpe?g|svg|webp|gif|avif|css|mp3|wav|ogg|woff2?)$/i;

export async function load(url, context, nextLoad) {
  if (ASSET.test(new URL(url).pathname)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(new URL(url).pathname)};`,
    };
  }
  return nextLoad(url, context);
}
