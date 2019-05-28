import Router from 'koa-router';

const router = new Router();

import authors from '../controllers/author.js';


router.get(   '/authors',     authors.getAuthors());
router.get(   '/authors/:id', authors.getAuthorById());
router.post(  '/authors',     authors.postAuthors());
router.patch( '/authors/:id', authors.patchAuthorById());
router.delete('/authors/:id', authors.deleteAuthorById());

export default router.middleware();
