process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoice;

beforeEach(async () => {
    const resultCompany = await db.query(`INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX') RETURNING code, name, description`);
    const resultInvoice = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('apple', 100, false, null) RETURNING amt, paid, paid_date, comp_code, id, add_date`)
    testCompany = resultCompany.rows[0];
    testInvoice = resultInvoice.rows[0];
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE from invoices`);
})

afterAll(async () =>{
    await db.end();
})

describe("GET /companies", function(){
    test(`Gets a list of companies`, async function(){
        const resp = await request(app).get('/companies');
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({companies:[
            {code : testCompany.code, 
            name : testCompany.name}
        ]})
    })
})

describe("GET /companies/:code", function(){
    test('Get one company and their invoices', async () =>{
        const resp = await request(app).get(`/companies/${testCompany.code}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({company:{
            code : testCompany.code,
            name : testCompany.name, 
            description : testCompany.description, 
            invoices : [[testInvoice.amt, testInvoice.paid, testInvoice.paid_date]]
        }})
    })
})

describe("POST /companies", function(){
    test('Post a new company', async () =>{
        const newCompany = {
            code : 'ibm',
            name : 'IBM',
            description: 'Software company'
        }

        const resp = await request(app)
            .post(`/companies`)
            .send(newCompany);

        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({company: newCompany})
    })
})

describe("PUT /companies/:code", function(){
    test('Put to update one company', async () =>{
        const updateCompany = {
            name : 'app',
            description : 'First course in a meal.',
            code : testCompany.code
        }
        const resp = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send(updateCompany);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({company: updateCompany})
    })
})

describe("DELETE /companies/:code", function(){
    test('Delete company', async () =>{

        const resp = await request(app)
            .delete(`/companies/${testCompany.code}`)
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({status: "DELETED"})
    })
})

