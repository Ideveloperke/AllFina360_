// Creates the S3 recordings bucket and a CORS rule for browser uploads if missing.
// Reads S3_* and WEB_URL from the root .env. Safe to run repeatedly.
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const fromApi = (mod) => require(require.resolve(mod, { paths: [path.join(root, 'apps/api')] }));

fromApi('dotenv').config({ path: path.join(root, '.env'), quiet: true });
const { S3Client, HeadBucketCommand, CreateBucketCommand, PutBucketCorsCommand } =
  fromApi('@aws-sdk/client-s3');

const env = process.env;
const Bucket = env.S3_BUCKET || 'allfina-recordings';
const s3 = new S3Client({
  region: env.S3_REGION || 'us-east-1',
  endpoint: env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: (env.S3_FORCE_PATH_STYLE || 'true') === 'true',
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID || 'allfina',
    secretAccessKey: env.S3_SECRET_ACCESS_KEY || 'allfina-secret',
  },
});

(async () => {
  try {
    await s3.send(new HeadBucketCommand({ Bucket }));
    console.log(`  bucket   : ${Bucket} exists`);
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket }));
    console.log(`  bucket   : ${Bucket} created`);
  }
  await s3.send(
    new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [env.WEB_URL || 'http://localhost:3000'],
            AllowedMethods: ['PUT', 'GET'],
            AllowedHeaders: ['*'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  console.log(
    '  cors     : browser uploads allowed from ' + (env.WEB_URL || 'http://localhost:3000'),
  );
})().catch((err) => {
  console.error(`  bucket setup failed: ${err.name}: ${err.message}`);
  process.exit(1);
});
