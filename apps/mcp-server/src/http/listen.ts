import { createServer } from 'node:http';
import type { RequestListener } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface RunningHttpServer {
  /** Base URL, for example http://127.0.0.1:8787 */
  readonly baseUrl: URL;
  close(): Promise<void>;
}

/** Starts listening. Resolves when the port is bound; rejects on bind errors. */
export function listen(
  app: RequestListener,
  host: string,
  port: number,
): Promise<RunningHttpServer> {
  const server = createServer(app);
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      const address = server.address();
      if (!isAddressInfo(address)) {
        reject(new Error('HTTP server did not report a TCP address.'));
        return;
      }
      resolve({
        baseUrl: new URL(`http://${formatHost(host)}:${String(address.port)}`),
        close: () => closeServer(server),
      });
    });
  });
}

function isAddressInfo(address: string | AddressInfo | null): address is AddressInfo {
  return address !== null && typeof address === 'object';
}

function formatHost(host: string): string {
  return host.includes(':') ? `[${host}]` : host;
}

function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
    server.closeAllConnections();
  });
}
