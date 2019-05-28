/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  API handlers - Members                                                                        */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import Author      from '../models/author.js';
import Db          from '../lib/mysqldb.js';
import castBoolean from '../router/cast-boolean.js';
import Book from "../models/books";


class BookHandler {
    static async getBooks(ctx) {
        try {

            let sql = 'Select * From Book';
            // query-string filters?
            if (ctx.request.querystring) {
                const filter = Object.keys(ctx.request.query).map(function(q) { return q+' = :'+q; }).join(' and ');
                sql += ' Where '+filter;
            }

            const result = await Db.query(sql, ctx.request.query);
            const [ books ] = castBoolean.fromMysql(result);

            if (books.length === 0) { ctx.response.status = 204; return; }

            for (let m=0; m<members.length; m++) {
                books[m] = { _id: books[m].id, _uri: '/books/'+books[m].id };
            }

            ctx.response.body = members;
            ctx.response.body.root = 'Books';

        } catch (e) {
            switch (e.code) {
                case 'ER_BAD_FIELD_ERROR': ctx.throw(403, 'Unrecognised Author field'); break;
                default: throw e;
            }
        }
    }

    static async getBookById(ctx) {
        const result = await Db.query('Select * From Book Where id = :id', { id: ctx.params.id });
        const [ books ] = castBoolean.fromMysql(result);
        const book = books[0];

        if (!book) ctx.throw(404, `No book ${ctx.params.id} found`);

        book._id = book.id;

        const [ authors ] = await Db.query('Select * From Author Where id = :id', { id: book.authorId});
        book.author = authors[0];

        ctx.response.body = book;
        ctx.response.body.root = 'Book';
    }


    static async postBooks(ctx) {
        if (ctx.state.auth.Role != 'admin') ctx.throw(403, 'Admin auth required'); // Forbidden

        ctx.request.body = await castBoolean.fromStrings('Author', ctx.request.body);

        const id = await Book.insert(ctx.request.body);

        ctx.response.body = await Book.get(id);
        ctx.response.body.root = 'Book';
        ctx.response.set('Location', '/books/'+id);
        ctx.response.status = 201;
    }

    static async patchBookById(ctx) {
        if (ctx.state.auth.Role != 'admin') ctx.throw(403, 'Admin auth required'); // Forbidden

        ctx.request.body = await castBoolean.fromStrings('Book', ctx.request.body);

        await Book.update(ctx.params.id, ctx.request.body);

        ctx.response.body = await Book.get(ctx.params.id);
        if (!ctx.response.body) ctx.throw(404, `No book ${ctx.params.id} found`);

        ctx.response.body.root = 'Book';
    }

    static async deleteBookById(ctx) {
        if (ctx.state.auth.Role != 'admin') ctx.throw(403, 'Admin auth required'); // Forbidden

        const member = await Book.get(ctx.params.id);

        if (!member) ctx.throw(404, `No book ${ctx.params.id} found`); // Not Found

        await Book.delete(ctx.params.id);

        ctx.response.body = book;
        ctx.response.body.root = 'Book';
    }
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

export default BookHandler;
