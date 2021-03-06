import { MongoClient } from 'mongodb';
import moment from 'moment';
import mkdirp from 'mkdirp';
import fs from 'fs';
import util from 'util';
import { exec } from 'child_process';
import chalk from 'chalk';

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
  const folder = `backups/${date}`;

  await mkdirp(folder);

  return folder;
};

const writeFileWithPromise = util.promisify(fs.writeFile);

/**
 * Downloads a single collection to disc
 */
const downloadCollectionToFile = async ({ db, folder, collectionName }) => {
  console.log('Backing up', chalk.yellow(collectionName));

  const collection = db.collection(collectionName);
  const data = await collection.find({}).toArray();
  console.log(`=> Downloaded [${chalk.green(data.length)}] documents`);

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
  const { stdout, stderr } = await execWithPromise(
    `git add ${folder} && git commit -m "Backed up ${folder}" && git push`
  );

  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);

  console.log(chalk.green('Pushed to repo'));
};

/**
 * Run the backup
 */
(async () => {
  const folder = await createFolder();

  const { client, db } = await connectToMongo();
  await downloadCollections({ db, folder });
  await disconnectMongo({ client });

  await commitAndPush({ folder });

  console.log(chalk.green('Backup finished successfully'));
})();
