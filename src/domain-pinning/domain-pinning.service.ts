import { Injectable } from '@nestjs/common';
import * as https from 'https';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DomainPinningService {
  private trustedPubKey: string;

  constructor() {
    // Load the trusted public key
    this.trustedPubKey = fs
      .readFileSync(path.resolve('./pubKeys.txt'), 'utf8')
      .trim();
  }

  async get(hostname: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'www.google.com',
        port: 443,
        path: '/',
        method: 'GET',
        agent: new https.Agent({
          checkServerIdentity: (hostname, cert) => {
            const rawCert = cert.raw.toString('base64');
            const pemCert = `-----BEGIN CERTIFICATE-----\n${rawCert.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;
            console.log("Extracted certificate",pemCert);
            // Extract the public key from the PEM certificate
            const pubKey = crypto.createPublicKey(pemCert);
            const pubKeyPem = pubKey
              .export({ type: 'spki', format: 'pem' })
              .toString()
              .trim();
            // For debugging: Log the extracted public key
            console.log('Extracted Public Key PEM:', pubKeyPem);

            if (this.trustedPubKey !== pubKeyPem) {
              reject(new Error('Public key does not match'));
            }
            return undefined;
          },
        }),
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }
}
