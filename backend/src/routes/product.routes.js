import { Router } from 'express';
import { getProducts, getCategories } from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/categories', getCategories);

export default router;
