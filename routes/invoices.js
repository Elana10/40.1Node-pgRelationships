const express = require("express");
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
    try{
        const results = await db.query('SELECT id, comp_code FROM invoices');
        return res.json({companies : results.rows})
    } catch(e){
        return next (e);
    }
})

router.get('/:id', async (req, res, next) => {
    try{
        const {id} = req.params;
        const results = await db.query('SELECT * FROM companies WHERE id =$1', [id]);
        return res.json({invoice : results.rows[0]})
    } catch(e){
        return next (e);
    }
})

router.get('/company/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const results = await db.query(
            ' SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices JOIN companies ON companies.code = invoices.comp_code WHERE companies.code = $1;', [code]);
        if(results.rows.length === 0){
            throw new ExpressError(`Company with code ${code} cannot be found.`, 404)
        }        
        return res.json({invoices : results.rows})
    } catch(e){
        return next (e);
    }
})

router.post('/', async (req, res, next) => {
    try{
        const {comp_code, amt} = req.body;
        const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES($1, $2) RETURNING *;', [comp_code, amt]);
        return res.status(201).json({invoice : results.rows[0]})
    } catch(e){
        return next (e);
    }
})

router.put('/:id', async (req, res, next) => {
    try{
        const {id} = req.params;
        const {amt} = req.body;
        const results = await db.query('UPDATE companies SET amt = $2 WHERE id = $1 RETURNING *;', [id, amt]);
        if(results.rows.length === 0){
            throw new ExpressError(`Invoice ID ${id} cannot be found.`, 404)
        }
        return res.json({invoice : results.rows[0]})
    } catch(e){
        return next (e);
    }
})

router.delete('/:id', async (req, res, next) => {
    try{
        const {id} = req.params;
        const results = await db.query('DELETE FROM invoices WHERE id = $1 RETURNING *;', [id]);
        if(results.rows.length === 0){
            throw new ExpressError(`Invoice ID ${id} cannot be found.`, 404)
        }
        return res.json({status: "DELETED"})
    } catch(e){
        return next (e);
    }
})



module.exports = router;