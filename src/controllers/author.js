/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  API handlers - Members                                                                        */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import Author      from '../models/author.js';
import Db          from '../lib/mysqldb.js';
import castBoolean from '../router/cast-boolean.js';


class MembersHandlers {
    static async getAuthors(ctx) {
        try {

            let sql = 'Select * From Author';
            // query-string filters?
            if (ctx.request.querystring) {
                const filter = Object.keys(ctx.request.query).map(function(q) { return q+' = :'+q; }).join(' and ');
                sql += ' Where '+filter;
            }
            sql +=  ' Order By Firstname, Lastname';

            const result = await Db.query(sql, ctx.request.query);
            const [ authors ] = castBoolean.fromMysql(result);

            if (authors.length == 0) { ctx.response.status = 204; return; } // No Content (preferred to returning 200 with empty list)

            // just id & uri attributes in list
            for (let m=0; m<members.length; m++) {
                authors[m] = { _id: authors[m].id, _uri: '/members/' + authors[m].id };
            }

            ctx.response.body = authors;
            ctx.response.body.root = 'Authors';

        } catch (e) {
            switch (e.code) {
                case 'ER_BAD_FIELD_ERROR': ctx.throw(403, 'Unrecognised Author field'); break;
                default: throw e;
            }
        }
    }

    static async getAuthorById(ctx) {
        const result = await Db.query('Select * From Author Where id = :id', { id: ctx.params.id });
        const [ authors ] = castBoolean.fromMysql(result);
        const author = authors[0];

        if (!author) ctx.throw(404, `No member ${ctx.params.id} found`); // Not Found

        author._id = author.id;

        ctx.response.body = author;
        ctx.response.body.root = 'Author';
    }

    static async postAuthors(ctx) {
        if (ctx.state.auth.Role != 'admin') ctx.throw(403, 'Admin auth required'); // Forbidden

        ctx.request.body = await castBoolean.fromStrings('Author', ctx.request.body);

        const id = await Author.insert(ctx.request.body);

        ctx.response.body = await Author.get(id); // return created member details
        ctx.response.body.root = 'Author';
        ctx.response.set('Location', '/authors/'+id);
        ctx.response.status = 201;
    }


    static async patchAuthorById(ctx) {
        if (ctx.state.auth.Role != 'admin') ctx.throw(403, 'Admin auth required'); // Forbidden

        ctx.request.body = await castBoolean.fromStrings('Author', ctx.request.body);

        await Author.update(ctx.params.id, ctx.request.body);

        // return updated member details
        ctx.response.body = await Author.get(ctx.params.id);
        if (!ctx.response.body) ctx.throw(404, `No member ${ctx.params.id} found`); // Not Found

        ctx.response.body.root = 'Author';
    }

    static async deleteAuthorById(ctx) {
        if (ctx.state.auth.Role != 'admin') ctx.throw(403, 'Admin auth required'); // Forbidden

        // return deleted member details
        const author = await Author.get(ctx.params.id);

        if (!author) ctx.throw(404, `No member ${ctx.params.id} found`); // Not Found

        await Author.delete(ctx.params.id);

        ctx.response.body = author;
        ctx.response.body.root = 'Author';
    }
}


export default MembersHandlers;
