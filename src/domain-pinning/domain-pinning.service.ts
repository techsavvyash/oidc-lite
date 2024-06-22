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
        hostname: hostname,
        port: 443,
        path: '/health',
        method: 'GET',
        agent: new https.Agent({
          checkServerIdentity: (hostname, cert) => {
            const rawCert = cert.raw.toString('base64');
            const pemCert = `-----BEGIN CERTIFICATE-----\n${rawCert.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;
            console.log("Extracted certificate",pemCert);
            const pubKey = crypto.createPublicKey(pemCert);
            const pubKeyPem = pubKey
              .export({ type: 'spki', format: 'pem' })
              .toString()
              .trim();

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
