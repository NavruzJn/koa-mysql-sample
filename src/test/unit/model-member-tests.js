/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Author model unit tests.                                                                       */
/*                                                                                                */
/* Note these tests do not mock out database components, but operate on the live db.              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import { expect } from 'chai';   // BDD/TDD assertion library
import dotenv     from 'dotenv'; // load environment variables from a .env file into process.env
dotenv.config();

import Author from '../../models/author.js';


describe('Author model', function() {
    let memberId = null;

    const values = {
        Firstname: 'test',
        Lastname:  'user',
        Email:     `test-${Date.now().toString(36)}@user.com`, // unique e-mail for concurrent tests
        Active:    true,
    };

    before(function() {
        if (!process.env.DB_MYSQL_CONNECTION) throw new Error('No DB_MYSQL_CONNECTION available');
    });

    it('creates member', async function() {
        memberId = await Author.insert(values);
        console.info('\t', values.Email, memberId);
    });

    it('fails to create duplicate member', async function() {
        try {
            await Author.insert(values);
            throw new Error('Author.insert should fail validation');
        } catch (e) {
            expect(e.message).to.equal(`Duplicate entry '${values.Email}' for key 'Email'`);
        }
    });

    it('gets member', async function() {
        const member = await Author.get(memberId);
        expect(member).to.be.an('object');
        expect(member.Firstname).to.equal('test');
    });

    it('gets member using string id', async function() {
        const member = await Author.get(memberId.toString());
        expect(member).to.be.an('object');
        expect(member.Firstname).to.equal('test');
    });

    it('gets member by value', async function() {
        const members = await Author.getBy('Firstname', 'test');
        expect(members).to.be.an('array');
        expect(members).to.have.lengthOf.at.least(1);
    });

    it('updates member', async function() {
        await Author.update(memberId, { Firstname: 'test2' });
        const member = await Author.get(memberId);
        expect(member).to.be.an('object');
        expect(member.Firstname).to.equal('test2');
        await Author.update(memberId, { Firstname: 'test' }); // set it back
    });

    it('fails to set no-such-field', async function() {
        const vals = { ...values, Firstname: 'validn-test', Email: 'validn@test', 'no-such-field': 'nothing here' };
        try {
            await Author.insert(vals);
            throw new Error('Author.insert should fail validation');
        } catch (e) {
            expect(e.message).to.equal("Unknown column 'no-such-field' in 'field list'");
        }
    });

    it('fails to create two members with same e-mail, different membername', async function() {
        const vals = { ...values, Firstname: 'test2' };
        try {
            await Author.insert(vals);
            throw new Error('Author.insert should fail validation');
        } catch (e) {
            expect(e.message).to.equal(`Duplicate entry '${values.Email}' for key 'Email'`);
        }
    });

    it('deletes member', async function() {
        const ok = await Author.delete(memberId);
        expect(ok).to.be.true;
    });

});
