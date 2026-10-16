import http from 'node:http';
import type { AddressInfo } from 'node:net';

// The mock API the Maestro flows run against. Plain CommonJS so the workflow can
// start it with `node` and no build step.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createMockApi, CREDENTIALS } = require('../e2e/mock-api/server') as {
  createMockApi: () => http.Server;
  CREDENTIALS: { username: string; password: string };
};

let server: http.Server;
let port: number;

beforeAll(async () => {
  server = createMockApi();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

interface Reply {
  status: number;
  body: any;
}

function call(
  method: string,
  path: string,
  options: { body?: unknown; token?: string } = {},
): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: {
          ...(payload ? { 'content-type': 'application/json' } : {}),
          ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        },
      },
      (res) => {
        let text = '';
        res.on('data', (chunk) => (text += chunk));
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, body: text ? JSON.parse(text) : undefined }),
        );
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(): Promise<string> {
  const reply = await call('POST', '/auth/login', { body: CREDENTIALS });
  return reply.body.token;
}

beforeEach(async () => {
  await call('POST', '/__reset');
});

describe('mock API', () => {
  describe('reading (public, like the real backend)', () => {
    it('lists the seeded states in the backend envelope', async () => {
      const reply = await call('GET', '/estado/paginado?size=100');
      expect(reply.status).toBe(200);
      expect(reply.body.content.map((s: any) => s.sigla)).toEqual(['SP', 'RJ', 'MG']);
      expect(reply.body.content[0]).toMatchObject({
        id: 1,
        nome: 'São Paulo',
        dataHoraUltimaAtualizacao: null,
      });
      expect(reply.body.page.totalElements).toBe(3);
    });

    it('filters by busca, ignoring case and accents', async () => {
      const bySigla = await call('GET', '/estado/paginado?busca=rj');
      expect(bySigla.body.content.map((s: any) => s.sigla)).toEqual(['RJ']);
      const byName = await call('GET', '/estado/paginado?busca=sao');
      expect(byName.body.content.map((s: any) => s.sigla)).toEqual(['SP']);
    });

    it('sorts by the requested field and direction', async () => {
      const asc = await call('GET', '/estado/paginado?sort=nome,asc');
      expect(asc.body.content.map((s: any) => s.sigla)).toEqual(['MG', 'RJ', 'SP']);
      const desc = await call('GET', '/estado/paginado?sort=sigla,desc');
      expect(desc.body.content.map((s: any) => s.sigla)).toEqual(['SP', 'RJ', 'MG']);
    });

    it('returns one state, or 404', async () => {
      expect((await call('GET', '/estado/2')).body.sigla).toBe('RJ');
      expect((await call('GET', '/estado/99')).status).toBe(404);
    });

    it('answers /actuator/info', async () => {
      const reply = await call('GET', '/actuator/info');
      expect(reply.body.build.commit).toEqual(expect.any(String));
    });

    it('answers 404 for anything else', async () => {
      expect((await call('GET', '/nope')).status).toBe(404);
    });
  });

  describe('login', () => {
    it('issues a token that expires in the future', async () => {
      const reply = await call('POST', '/auth/login', { body: CREDENTIALS });
      expect(reply.status).toBe(200);
      const payload = JSON.parse(
        Buffer.from(reply.body.token.split('.')[1], 'base64url').toString(),
      );
      expect(payload.exp * 1000).toBeGreaterThan(Date.now());
      expect(reply.body.expiresInSeconds).toBeGreaterThan(0);
    });

    it('rejects wrong credentials with 401', async () => {
      const reply = await call('POST', '/auth/login', {
        body: { username: CREDENTIALS.username, password: 'wrong' },
      });
      expect(reply.status).toBe(401);
    });
  });

  describe('writing (requires a session)', () => {
    it('answers 401 without a token', async () => {
      expect((await call('POST', '/estado/', { body: { nome: 'X', sigla: 'XX' } })).status).toBe(
        401,
      );
      expect((await call('DELETE', '/estado/1')).status).toBe(401);
    });

    it('creates a state that then shows up in the list', async () => {
      const token = await login();
      const created = await call('POST', '/estado/', {
        token,
        body: { nome: 'Bahia', sigla: 'BA' },
      });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ nome: 'Bahia', sigla: 'BA' });
      const list = await call('GET', '/estado/paginado');
      expect(list.body.content.map((s: any) => s.sigla)).toContain('BA');
    });

    it('rejects a duplicate abbreviation with 409', async () => {
      const token = await login();
      const reply = await call('POST', '/estado/', { token, body: { nome: 'Other', sigla: 'SP' } });
      expect(reply.status).toBe(409);
    });

    it('updates a state and stamps the update time', async () => {
      const token = await login();
      const reply = await call('PUT', '/estado/1', {
        token,
        body: { nome: 'Sao Paulo Capital', sigla: 'SP' },
      });
      expect(reply.status).toBe(200);
      expect(reply.body.nome).toBe('Sao Paulo Capital');
      expect(reply.body.dataHoraUltimaAtualizacao).toEqual(expect.any(String));
    });

    it('updates nothing that does not exist', async () => {
      const token = await login();
      expect(
        (await call('PUT', '/estado/99', { token, body: { nome: 'X', sigla: 'XX' } })).status,
      ).toBe(404);
    });

    it('deletes a state, or 404', async () => {
      const token = await login();
      expect((await call('DELETE', '/estado/3', { token })).status).toBe(204);
      const list = await call('GET', '/estado/paginado');
      expect(list.body.content.map((s: any) => s.sigla)).not.toContain('MG');
      expect((await call('DELETE', '/estado/3', { token })).status).toBe(404);
    });
  });

  it('/__reset restores the seed data', async () => {
    const token = await login();
    await call('DELETE', '/estado/1', { token });
    await call('POST', '/__reset');
    const list = await call('GET', '/estado/paginado');
    expect(list.body.content).toHaveLength(3);
  });
});
