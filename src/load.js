import dbdriver from './util/db.js';

const loadTable = name => dbdriver.accessTable(name);

/**
 * load
 *
 * Load the article metadata from the database and map to a contact list
 * @param {object} start start Date
 * @param {object} end end Date
 * @return {object} the corresponding results
 */
export async function load (start, end, options) {
  const { rethink: r, conn, table } = await loadTable('documents');
  let q = table;

  // Filter by date
  if (end != null) { // Set a publication date range
    q = q.between(
      start, end, { index: 'pub_date' }
    );
  } else { // Set a minimum publication date only
    q = q.filter(doc => doc('pub_date').gt(start));
  }

  // Apply filters
  // const hasAuthorEmail = r.row('author_list').filter(function (author) { return author('emails').ne(null); }).count().gt(0);
  // // const yearFilter = r.row('journal')('pub_year').match(yearRegex);
  // // const docOpts = hasAuthorEmail.and(yearFilter);
  // const docOpts = hasAuthorEmail;
  // q = q.filter(docOpts);

  // create fields
  // articleCitation
  // q = q.merge(function (document) {
  //   const journal = document('journal');
  //   const title = r.branch(journal.hasFields('title'), journal('title'), '');
  //   const month = r.branch(journal.hasFields('pub_month'), r.expr(' ').add(journal('pub_month')), '');
  //   const year = r.branch(journal.hasFields('pub_year'), r.expr(' ').add(journal('pub_year')), '');

  //   return {
  //     articleCitation: r.expr(title).add(month, year)
  //   };
  // });

  // // authorName
  // q = q.merge(function (document) {
  //   const lastAuthor = document('author_list').filter(function (author) { return author('emails').ne(null); }).nth(-1);
  //   // const lastAuthor = document('author_list').nth(-1);
  //   const emailRecipientAddress = lastAuthor('emails').nth(-1);
  //   const authorName = lastAuthor('fore_name');

  //   return {
  //     authorName,
  //     emailRecipientAddress
  //   };
  // });

  // q = q.limit(10);
  // q = q.pluck(['pmid', 'doi', 'articleCitation', 'authorName', 'emailRecipientAddress']);
  q = q.pluck(['pmid', 'doi', 'pub_date', 'journal']);

  const cursor = await q.run(conn);
  const data = await cursor.toArray();
  conn.close(function (err) { if (err) throw err; });
  return data;
}
