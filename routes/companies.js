const express = require("express");
const router = express.Router();
const db = require('../db');
const ExpressError = require("../expressError");
const slugify = require("slugify");

router.get('/', async (req, res, next) => {
    try{
        const results = await db.query('SELECT code, name FROM companies');
        return res.json({companies : results.rows})
    } catch(e){
        return next (e);
    }
})

router.get('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const results = await db.query('SELECT c.code, c.name, c.description, i.amt, i.paid, i.paid_date, ind.industry_code FROM companies AS c LEFT JOIN invoices AS i ON c.code = i.comp_code LEFT JOIN industries_companies AS ind ON c.code = ind.comp_code WHERE c.code = $1', [code]);
        if(results.rows.length === 0){
            throw new ExpressError(`Invoices not found for company code ${code}`, 404)
        }
        const { name, description } = results.rows[0];
        const industry_code = [... new Set(results.rows.map( i => i.industry_code))]
        const invoices = results.rows.map(i => [i.amt, i.paid, i.paid_date])
        return res.json({company : {code, name, description, industry_code : industry_code,  invoices : invoices}})
    } catch(e){
        return next (e);
    }
})

router.post('/', async (req, res, next) => {
    try{
        let {code, name, description} = req.body;
        if(code === undefined){
            code = slugify(name)
            return res.json(code);
        }
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES($1, $2, $3) RETURNING *;', [code, name, description]);
        return res.status(201).json({company : results.rows[0]})
    } catch(e){
        return next (e);
    }
})

router.put('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const {name, description} = req.body;
        const results = await db.query('UPDATE companies SET name = $2, description = $3 WHERE code = $1 RETURNING *;', [code, name, description]);
        if(results.rows.length === 0){
            throw new ExpressError(`Code ${code} cannot be found.`, 404)
        }
        return res.json({company : results.rows[0]})
    } catch(e){
        return next (e);
    }
})

router.delete('/:code', async (req, res, next) => {
    try{
        const {code} = req.params;
        const results = await db.query('DELETE FROM companies WHERE code = $1 RETURNING *;', [code]);
        if(results.rows.length === 0){
            throw new ExpressError(`Code ${code} cannot be found.`, 404)
        }
        return res.json({status: "DELETED"})
    } catch(e){
        return next (e);
    }
})
 



module.exports = router;