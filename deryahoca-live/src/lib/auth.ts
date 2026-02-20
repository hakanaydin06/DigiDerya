import jwt from 'jsonwebtoken';

export type AuthContext = {
  teacherId: string;
  email: string;
  name: string;
  role: 'TEACHER';
};

const TOKEN_EXPIRY = '24h';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export function createAuthToken(payload: AuthContext) {
  return jwt.sign(
    {
      sub: payload.teacherId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function parseAuthHeader(header?: string | null): string | null {
  if (!header) return null;
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export function verifyAuthToken(token: string): AuthContext {
  const decoded = jwt.verify(token, getJwtSecret());
  const payload = decoded as jwt.JwtPayload;

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Invalid token payload');
  }

  return {
    teacherId: payload.sub,
    email: String(payload.email ?? ''),
    name: String(payload.name ?? ''),
    role: 'TEACHER',
  };
}

export function requireAuth(request: Request): AuthContext {
  const token = parseAuthHeader(request.headers.get('authorization'));
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  return verifyAuthToken(token);
}
