import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: `-----BEGIN CERTIFICATE-----
MIIERDCCAqygAwIBAgIUMbkVE2vexTXCxk61vSowlorjrW8wDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvMTVjY2Y0ZDMtOGZiNi00M2EwLWFlYjItODBiNGZiOWNh
ZDUyIFByb2plY3QgQ0EwHhcNMjYwNzI1MDc1MzAyWhcNMzYwNzIyMDc1MzAyWjA6
MTgwNgYDVQQDDC8xNWNjZjRkMy04ZmI2LTQzYTAtYWViMi04MGI0ZmI5Y2FkNTIg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAK1tw0ww
b5maicU0CjPYNxu+0NbEC6NePeIwliPKq2kU5G7nPjW51BFudJ56tZo/Jl/7S0RA
dOiZvqyn7K5+19v3WCXvqq6CL8xkPzfJkf4Ebx4mCmDEXfqLSAqc0hAU06jDyxl2
pcs7LvIbLjB7wp7WCJN0jrW6mKz8mU5qXnG2boWPZVCvDSVqKMZqYjDiAgNSV1cw
YdCz2t41DMOhpXbTbeu1yNogUK+3S3aJp7r/tgrY+eAPIrz1o8YGrCt3EKP8hRew
iei/GCLhmqXE5EQ5WNkzCepCs6NwwK78O2FDx/+I+HEp/YLaA9gM6N32fmlMG+SE
3ujztb5PuIYyC+e3ULaxXKWl7Sn4hosnAWDRTLnzqRQ4OnDhmqt+xN8m3MO23TWi
1CGgXo41SYChNeSaJ4PvffuIN7uOlE6VTacrRWy4f8bURdEBR8h5xx9/9Wm8kFc+
WVWSktYHYWelC2YT2XODS7Wd//l+Hw53TB5cS221HkRft8zeYY1OyVJffwIDAQAB
o0IwQDAdBgNVHQ4EFgQUZgMp9uBcpJ4/IGY+H/g0nn/GJhwwEgYDVR0TAQH/BAgw
BgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBACUyMkB7aGDv
/tLDu3CeAqvOu4virwuB6MeIwhF8yQkWE7pjSQrKKTAU62akUuqQ7x3rVVRczrbp
Pr2L3d4O7mwGMPtFbZAiEofbRzZFfOWFJntEvxhQuHAC+cd2u4t7cP2nMrbP+dVt
SzIKxmeGO8dacp9dvsnCTp5mCiHAmXpAsQNeEXvpFx99TDAbXORc12wrTelTj1g2
XDq9RIEL9f1gyV/Lj9IuM+CMR1qSgnpbHvzhfDL4BQpBBxne2SxxhKYka9gUFY2Q
cW19qQIqsoEHehwLlh+4o/GuebFBNaTJztPe0eN13EMwuY9VpDiXtu1O4usuZ4qR
Yp0EO+25LPS5muffbuVI0mdabrNGVk2Sl5T5Rww/+RjAuyHln6M/15qQp0P8yCQh
fRV1hnu33L0LRjiVRHVjdjBRt7lR5Tr1CWY2WseqDmYRnH7TdeHeW1vK/7+t53DZ
wNDcKIQrvSruTXp0ABGdFCmlgJeByqbaRQCSLE6DSqiZk6txa+bV4A==
-----END CERTIFICATE-----`,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
