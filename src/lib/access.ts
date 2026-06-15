import { jwtVerify, createRemoteJWKSet } from "jose";

// Validace Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`) proti veřejným klíčům
// team domény. Edge Access už request pustí jen ověřený; tahle validace je
// defense-in-depth — ověří podpis, `issuer` (team doména) a `audience` (AUD tag
// aplikace), takže podvržená hlavička bez platného podpisu neprojde.
// Postup dle docs: jose `jwtVerify` + `createRemoteJWKSet`.

// JWKS klíče: `createRemoteJWKSet` si drží vlastní cache stažených klíčů. Set
// držíme na úrovni modulu (per isolate), ať se nestahuje při každém requestu.
const jwksByDomain = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

function getJwks(teamDomain: string) {
  let jwks = jwksByDomain.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${teamDomain}/cdn-cgi/access/certs`),
    );
    jwksByDomain.set(teamDomain, jwks);
  }
  return jwks;
}

export interface AccessIdentity {
  email?: string;
  sub?: string;
}

// Vrací identitu při platném tokenu, jinak `null` (nikdy nevyhazuje — volající
// rozhodne o odpovědi).
export async function verifyAccessJwt(
  token: string,
  aud: string,
  teamDomain: string,
): Promise<AccessIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, getJwks(teamDomain), {
      issuer: teamDomain,
      audience: aud,
    });
    return {
      email: typeof payload.email === "string" ? payload.email : undefined,
      sub: payload.sub,
    };
  } catch {
    return null;
  }
}
