#! /usr/bin/env node

import { program } from 'commander';

import classifierImpl from './classifier.js';
import elifeImpl from './elife.js';
import historyImpl from './history.js';
import { MAX_DATE, MIN_DATE } from './util/db.js';
import { toDate, myParseInt } from './util/string.js';
import { sendOutput, json2csv, formatInfo } from './util/format.js';

const MAX_NUM_ITEMS = 100000;

async function classifier (options) {
  const lastUpdatedStart = toDate(options.lastUpdatedStart);
  const lastUpdatedEnd = toDate(options.lastUpdatedEnd);
  const startDate = toDate(options.start);
  const endDate = toDate(options.end);
  let data = await classifierImpl(lastUpdatedStart, lastUpdatedEnd, startDate, endDate, options);
  data = data.map(formatInfo);
  await sendOutput(data, options);
}

async function elife (options) {
  let data = await elifeImpl(options);
  data = data.map(formatInfo);
  await sendOutput(data, options);
}

async function history (id, options) {
  const data = await historyImpl(id, options);
  await sendOutput(data, options);
}

async function main () {
  (program
    .name('contact-pipeline')
    .description('A CLI to map article metadata to a contact list')
  );

  (program.command('classifier')
    .option('-u, --last-updated-start <str>', 'Last updated start date (yyyy-mm-dd)', MIN_DATE)
    .option('-m, --last-updated-end <str>', 'Last updated end date (yyyy-mm-dd)', MAX_DATE)
    .option('-s, --start <str>', 'Publication Start date (yyyy-mm-dd)', MIN_DATE)
    .option('-e, --end <str>', 'Publication end date (yyyy-mm-dd)', MAX_DATE)
    .option('-l, --limit <number>', 'Max number of items', myParseInt, MAX_NUM_ITEMS)
    .option('-a, --email <str>', 'Filter out items with no email (default), return everything (all) or no email (none)')
    .option('-o, --output <str>', 'Output file (stdout by default)')
    .description('load classifier article metadata and send them to standard output or a file')
    .action(classifier)
  );

  (program.command('elife')
    .option('-o, --output <str>', 'Output file (stdout by default)')
    .description('load elife article metadata and send them to standard output or a file')
    .action(elife)
  );

  (program.command('history')
    .argument('<string>', 'string to split')
    .option('-o, --output <str>', 'Output file (stdout by default)')
    .description('Retrieve publication history dates for a list of pubmed ids')
    .action(history)
  );

  await program.parseAsync();
}

main();
