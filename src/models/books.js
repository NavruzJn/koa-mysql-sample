/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Author model                                                                                   */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import Debug from 'debug'; // small debugging utility
import Db from '../lib/mysqldb.js';
import Log from '../lib/log.js';
import ModelError from './modelerror.js';

const debug = Debug('app:db'); // debug db updates

class Book {

    static async get(id) {
        const [ book ] = await Db.query('Select * From Book Where id = :id', { id });
        return book[0];
    }

    static async getBy(field, orderField, value) {
        try {
            const [books] = await Db.query(`Select * From Book Where ${field} = :value Order By ${orderField}`, { value });

            return books;
        } catch (e) {
            switch (e.code) {
                case 'ER_BAD_FIELD_ERROR':
                    throw new ModelError(403, 'Unrecognised Book field '+field);
                default:
                    Log.exception('Book.getBy', e);
                    throw new ModelError(500, e.message);
            }
        }
    }

    static async insert(values) {
        debug('Book.insert', values.title);

        // validation - somewhat artificial example serves to illustrate principle of app-level validation
        if (values.title==null && values.auhtorId==null) {
            throw new ModelError(403, 'Title or AuthorId must be supplied');
        }

        try {

            const [ result ] = await Db.query('Insert Into Book Set ?', [ values ]);
            return result.insertId;

        } catch (e) {
            switch (e.code) { // just use default MySQL messages for now
                case 'ER_BAD_NULL_ERROR':
                case 'ER_NO_REFERENCED_ROW_2':
                case 'ER_NO_DEFAULT_FOR_FIELD':
                    throw new ModelError(403, e.message); // Forbidden
                case 'ER_DUP_ENTRY':
                    throw new ModelError(409, e.message); // Conflict
                case 'ER_BAD_FIELD_ERROR':
                    throw new ModelError(500, e.message); // Internal Server Error for programming errors
                default:
                    Log.exception('Book.insert', e);
                    throw new ModelError(500, e.message); // Internal Server Error for uncaught exception
            }
        }
    }

    static async update(id, values) {
        debug('Book.update', id);

        // validation - somewhat artificial example serves to illustrate principle
        if (values.title==null && values.authorId==null) {
            throw new ModelError(403, 'Title or AuthorId must be supplied');
        }

        try {

            await Db.query('Update Book Set ? Where id = ?', [ values, id ]);

        } catch (e) {
            switch (e.code) { // just use default MySQL messages for now
                case 'ER_BAD_NULL_ERROR':
                case 'ER_DUP_ENTRY':
                case 'ER_ROW_IS_REFERENCED_2':
                case 'ER_NO_REFERENCED_ROW_2':
                    throw new ModelError(403, e.message); // Forbidden
                case 'ER_BAD_FIELD_ERROR':
                    throw new ModelError(500, e.message); // Internal Server Error for programming errors
                default:
                    Log.exception('Book.update', e);
                    throw new ModelError(500, e.message); // Internal Server Error for uncaught exception
            }
        }
    }


    /**
     * Delete Author record.
     *
     * @param  {number} id - Author id.
     * @throws Error on referential integrity errors.
     */
    static async delete(id) {
        debug('Book.delete', id);

        try {

            await Db.query('Delete From Book Where id = :id', { id });
            return true;

        } catch (e) {
            switch (e.code) {
                case 'ER_ROW_IS_REFERENCED_2': // related record exists in TeamMember
                    throw new ModelError(403, 'Book belongs to team(s)'); // Forbidden
                default:
                    Log.exception('Book.delete', e);
                    throw new ModelError(500, e.message); // Internal Server Error
            }
        }
    }

}


export default Book;
