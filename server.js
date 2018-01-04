'use strict';

const Boom = require('boom');
const config = require('./config.json')
const fetch = require('node-fetch');
const Hapi = require('hapi');
const Joi = require('joi');
const scrypt = require('scrypt');

const server = new Hapi.Server();
server.connection(config.SERVER_CONFIG);

server.on('response', request => {
    console.log({
        id: request.id,
        timestamp: request.info.received,
        instance: request.connection.info.uri,
        method: request.method,
        path: request.path,
        query: request.query,
        responseTime: Date.now() - request.info.received,
        responseSentTime: request.info.responded - request.info.received,
        statusCode: request.raw.res.statusCode,
        client: request.headers['X-Forwarded-For'] || request.info.remoteAddress
    });
});

const update = function updateDNSRecord(host, domain, ip) {
    const API_BASE = 'https://api.digitalocean.com/v2/domains/' + domain;
    const API_HEADERS = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.API_TOKEN
    };
    return fetch(API_BASE + '/records', {
        method: 'GET',
        headers: API_HEADERS
    })
    .then(res => {
        if (res.status !== 200) {
            throw Boom.badGateway('Error communicating with Digital Ocean API');
        }
        return res.json();
    })
    .then(records => {
        return records.domain_records.find(record => record.name === host);
    })
    .then(domainRecord => {
        if (!domainRecord) {
            throw Boom.notFound(`The requested domain record: "${host}" could not be found.`);
        }
        return fetch(API_BASE + '/records/' + domainRecord.id, {
            method: 'PUT',
            headers: API_HEADERS,
            body: JSON.stringify({ data: ip })
        });
    })
    .then(res => {
        if (res.status !== 200) {
            throw Boom.badGateway('Error communicating with Digital Ocean API');
        }
        return res.json();
    })
    .then(recordUpdate => {
        return `<?xml version="1.0"?>
                    <interface-response>
                        <Command>SETDNSHOST</Command>
                        <Language>eng</Language>
                        <IP>${ip}</IP>
                        <ErrCount>0</ErrCount>
                        <ResponseCount>0</ResponseCount>
                        <Done>true</Done>
                        <debug><![CDATA[]]></debug>
                    </interface-response>`
    });
};

server.route({
    method: 'GET',
    path: '/update',
    config: {
        validate: {
            query: {
                host: Joi.string().required(),
                domain: Joi.string().required(),
                password: Joi.string().required(),
                ip: Joi.string().ip({version: ['ipv4']}).required()
            }
        }
    },
    handler: function (request, reply) {
        let credentials = scrypt.hashSync(request.query.password, {'N': 2,'r': 1,'p': 1}, 64, request.query.password).toString('base64');

        if (config.HASHED_CREDENTIALS !== credentials) {
            return reply('Invalid Login').code(400);
        }

        reply(update(request.query.host, request.query.domain, request.query.ip));
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});