import Router from 'koa-router';

const router = new Router();

import books from '../controllers/book';


router.get(   '/books',     books.getBooks);
router.get(   '/books/:id', books.getBookById());
router.post(  '/books',     books.postBooks());
router.patch( '/books/:id', books.patchBookById());
router.delete('/books/:id', books.deleteBookById());

export default router.middleware();
