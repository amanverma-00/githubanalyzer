import Product from '../models/product.model.js';
import { encodeCursor, decodeCursor } from '../utils/cursor.js';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export async function getProducts(req, res, next) {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const { cursor, category } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        return res.status(400).json({ error: 'Invalid cursor' });
      }

      filter.$or = [
        { created_at: { $lt: decoded.createdAt } },
        { created_at: decoded.createdAt, _id: { $lt: decoded.id } },
      ];
    }

    const docs = await Product.find(filter)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    if (hasNext) docs.pop();
    let nextCursor = null;
    if (hasNext && docs.length > 0) {
      const last = docs[docs.length - 1];
      nextCursor = encodeCursor(last.created_at, last._id);
    }

    return res.json({
      data: docs,
      pagination: {
        nextCursor,
        hasNext,
        limit,
      },
      meta: {
        category: category || null,
        count: docs.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await Product.distinct('category');
    return res.json({ data: categories.sort() });
  } catch (err) {
    next(err);
  }
}
