import mongoose from 'mongoose';

export function encodeCursor(createdAt, id) {
  const payload = JSON.stringify({
    ca: createdAt.toISOString(),
    id: id.toString(),
  });
  return Buffer.from(payload).toString('base64url');
}

export function decodeCursor(cursor) {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(raw);

    if (!parsed.ca || !parsed.id) {
      return null;
    }

    const createdAt = new Date(parsed.ca);
    if (isNaN(createdAt.getTime())) {
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(parsed.id)) {
      return null;
    }

    return {
      createdAt,
      id: new mongoose.Types.ObjectId(parsed.id),
    };
  } catch {
    return null;
  }
}
