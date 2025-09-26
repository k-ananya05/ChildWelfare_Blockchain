const proxyquire = require('proxyquire');
const request = require('supertest');
const sinon = require('sinon');
const express = require('express');

describe('IPFS API', () => {
    let app;
    let uploadStub;
    let getStub;

    beforeEach(() => {
        // Stub the ipfsService methods
        uploadStub = sinon.stub().resolves('bafyMockCid');
        getStub = sinon.stub().resolves({ ok: true });

        // Create isolated express app and mount proxied router
        const router = proxyquire('../backend/routes/api', {
            '../services/ipfsService': {
                uploadJSON: uploadStub,
                getJSON: getStub
            }
        });

        app = express();
        app.use(express.json());
        app.use('/api', router);
    });

    it('POST /api/ipfs/upload uploads JSON and returns cid, url', async () => {
        process.env.NFT_STORAGE_KEY = 'test-key';
        const res = await request(app)
            .post('/api/ipfs/upload')
            .send({ hello: 'world' })
            .set('Content-Type', 'application/json');

        if (res.status !== 200) {
            // Log body for easier debugging in CI
            // eslint-disable-next-line no-console
            console.error('Response:', res.status, res.body);
        }

        if (!uploadStub.calledOnce) {
            throw new Error('uploadJSON was not called');
        }

        if (!res.body || !res.body.cid || !res.body.url) {
            throw new Error('Response missing cid or url');
        }
    });
});


