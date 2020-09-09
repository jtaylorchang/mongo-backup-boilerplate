import { MongoClient } from 'mongodb';
import moment from 'moment';
import mkdirp from 'mkdirp';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';

import Secrets from './secrets.json';

/**
 * Connect to the mongo database
 */
const connectToMongo = async () => {
  const client = await MongoClient.connect(Secrets.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  return {
    client,
    db: client.db(Secrets.DB_NAME)
  };
};

/**
 * Disconnect from the database
 */
const disconnectMongo = async ({ client }) => {
  await client.close();
};

/**
 * Creates the backup folder using the current datetime
 */
const createFolder = async () => {
  const date = moment().format('YYYY-MM-DD-HHmm');

  await mkdirp(date);

  return date;
};

const writeFileWithPromise = util.promisify(fs.writeFile);

/**
 * Downloads a single collection to disc
 */
const downloadCollectionToFile = async ({ db, folder, collectionName }) => {
  console.log('Backing up', collectionName);

  const collection = db.collection(collectionName);
  const data = await collection.find({}).toArray();
  console.log(`=> Downloaded [${data.length}] documents`);

  const content = JSON.stringify(data);

  console.log('=> Started writing backup');
  await writeFileWithPromise(`${folder}/${collectionName}.json`, content);
  console.log('=> Finished writing backup');
};

/**
 * Downloads each collection to its own file
 */
const downloadCollections = async ({ db, folder }) => {
  const collections = await db.listCollections().toArray();

  const collectionNames = collections.map((collection) => collection.name);

  console.log('Found collections', collectionNames);

  for (const collectionName of collectionNames) {
    await downloadCollectionToFile({ db, folder, collectionName });
  }
};

const execWithPromise = util.promisify(exec);

/**
 * Commits the changes and pushes
 */
const commitAndPush = async ({ folder }) => {
  await execWithPromise(`git add ${folder} && git commit -m "Backed up ${folder}" && git push`);
};

/**
 * Run the backup
 */
const run = async () => {
  const folder = await createFolder();

  const { client, db } = await connectToMongo();
  await downloadCollections({ db, folder });
  await disconnectMongo({ client });

  await commitAndPush({ folder });

  console.log('Backup finished successfully');
};

// Run
run();
