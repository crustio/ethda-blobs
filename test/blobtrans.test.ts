import { Alice, provider } from './constants';
import { BlobTransaction } from '../src';

describe('Blobs', () => {
  it('Blob encoding and Blob TX works', async () => {
    const blobsTrans = new BlobTransaction(provider, Alice.signer);
    const blobs = await blobsTrans.getBlobs('Hello World');
    console.log(blobs);
  }, 600000 /*10 minutes timeout*/);
});
