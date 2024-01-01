"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var blobs_1 = require("@ethda/blobs");
var content = 'abc....';
var blobs = (0, blobs_1.EncodeBlobs)(Buffer.from(content, 'utf-8'));
var blobTrans = new blobs_1.BlobTransaction('https://rpc.ethda.io', process.env['KEY']);
blobTrans
    .sendTx(blobs, {
// value: 100000000000000000n,
})
    .then(function (hash) {
    blobTrans
        .getTxReceipt(hash)
        .then(function (r) {
        console.log('receipt', r);
    })
        .catch(function (e) { return console.error(e); });
})
    .catch(function (e) { return console.error(e); });
