#! /usr/bin/env node

import { program } from 'commander';
// import getStdin from 'get-stdin';

async function main () {
  (program
    .name('contact-pipeline')
    .description('A CLI to map article metadata to a contact list')
  );

  await program.parseAsync();
}

main();
