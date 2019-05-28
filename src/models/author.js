/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Author model                                                                                   */
/*                                                                                                */
/* All database modifications go through the model; most querying is in the handlers.             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import Debug from 'debug';     // small debugging utility
const debug = Debug('app:db'); // debug db updates

import Db         from '../lib/mysqldb.js';
import Log        from '../lib/log.js';
import ModelError from './modelerror.js';


class Author {

    /**
     * Returns Author details (convenience wrapper for single Author details).
     *
     * @param   {number} id - Author id or undefined if not found.
     * @returns {Object} Author details.
     */
    static async get(id) {
        const [ authors ] = await Db.query('Select * From Author Where id = :id', { id });
        const author = authors[0];
        return author;
    }

    static async getBy(field, value) {
        try {

            const sql = `Select * From Author Where ${field} = :${field} Order By Firstname, Lastname`;

            const [ authors ] = await Db.query(sql, { [field]: value });

            return authors;

        } catch (e) {
            switch (e.code) {
                case 'ER_BAD_FIELD_ERROR':
                    throw new ModelError(403, 'Unrecognised Author field '+field);
                default:
                    Log.exception('Author.getBy', e);
                    throw new ModelError(500, e.message);
            }
        }
    }


    /**
     * Creates new Author record.
     *
     * @param   {Object} values - Author details.
     * @returns {number} New member id.
     * @throws  Error on validation or referential integrity errors.
     */
    static async insert(values) {
        debug('Author.insert', values.Email);

        // validation - somewhat artificial example serves to illustrate principle of app-level validation
        if (values.Firstname==null && values.Lastname==null) {
            throw new ModelError(403, 'Firstname or Lastname must be supplied');
        }

        try {

            const [ result ] = await Db.query('Insert Into Author Set ?', [ values ]);
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
                    Log.exception('Author.insert', e);
                    throw new ModelError(500, e.message); // Internal Server Error for uncaught exception
            }
        }
    }


    /**
     * Update Author details.
     *
     * @param  {number} id - Author id.
     * @param  {Object} values - Author details.
     * @throws Error on validation or referential integrity errors.
     */
    static async update(id, values) {
        debug('Author.update', id);

        // validation - somewhat artificial example serves to illustrate principle
        if (values.Firstname==null && values.Lastname==null) {
            throw new ModelError(403, 'Firstname or Lastname must be supplied');
        }

        try {

            await Db.query('Update Author Set ? Where id = ?', [ values, id ]);

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
                    Log.exception('Author.update', e);
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
        debug('Author.delete', id);

        try {

            await Db.query('Delete From Author Where id = :id', { id });
            return true;

        } catch (e) {
            switch (e.code) {
                case 'ER_ROW_IS_REFERENCED_2': // related record exists in TeamMember
                    throw new ModelError(403, 'Author belongs to team(s)'); // Forbidden
                default:
                    Log.exception('Author.delete', e);
                    throw new ModelError(500, e.message); // Internal Server Error
            }
        }
    }

}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

export default Author;
