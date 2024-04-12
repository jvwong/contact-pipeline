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
export default async function classifier (lastUpdatedStart, lastUpdatedEnd, start, end, options) {
  const { rethink: r, conn, table } = await loadTable('documents');
  let q = table;

  // Select
  // Minimum last updated date
  q = q.between(
    lastUpdatedStart, lastUpdatedEnd, { index: 'last_updated' }
  );

  // Filters
  // Required: Has authors
  const hasAuthorList = r.row.hasFields('author_list');
  // Options: publication date range
  const pubDateRangeBetween = r.row('pub_date').ge(start).and(r.row('pub_date').lt(end));
  const docOpts = hasAuthorList.and(pubDateRangeBetween);
  q = q.filter(docOpts);

  // Pretty
  // Citation string
  q = q.merge(function (document) {
    const journal = document('journal');
    const title = r.branch(
      journal.hasFields('iso_abbreviation'),
      journal('iso_abbreviation'),
      journal.hasFields('title'),
      journal('title'),
      '')
      ;
    const year = r.expr(', ').add(document('pub_date').year().coerceTo('string'));

    return {
      articleCitation: r.expr(title).add(year)
    };
  });

  // Author / Email
  q = q.merge(function (document) {
    const authorList = document('author_list');
    const authorsWithEmails = authorList.filter(function (author) { return author('emails').ne(null); });
    const hasAuthorEmail = authorsWithEmails.count().gt(0);

    const correspondence = document('correspondence');
    const hasCorrespondence = correspondence.count().gt(0);
    const lastCorrespodenceEmails = correspondence.nth(-1)('emails');
    const hasLastCorrespodenceEmails = lastCorrespodenceEmails.count().gt(0);
    const hasCorrespondingEmail = hasCorrespondence.and(hasLastCorrespodenceEmails);

    const author = r.branch(
      hasAuthorEmail,
      authorsWithEmails.nth(-1),
      authorList.nth(-1)
    );

    const emailRecipientAddress = r.branch(
      hasAuthorEmail,
      authorsWithEmails.nth(-1)('emails').nth(-1),
      hasCorrespondingEmail,
      lastCorrespodenceEmails.nth(-1),
      null
    );

    const authorName = author('fore_name');

    return {
      authorName,
      emailRecipientAddress
    };
  });

  if (options.email === undefined) {
    q = q.filter(r.row.hasFields('emailRecipientAddress'));
  } else if (options.email === 'none') {
    q = q.filter(r.row.hasFields('emailRecipientAddress').not());
  } else if (options.email === 'all') {
    q = q.filter(() => true);
  } else {
    throw new Error('Email option not recognized');
  }

  q = q.limit(options.limit);
  q = q.pluck(['pmid', 'doi', 'articleCitation', 'authorName', 'emailRecipientAddress', 'pub_date', 'last_updated']);

  const cursor = await q.run(conn);
  const data = await cursor.toArray();
  conn.close(function (err) { if (err) throw err; });
  return data;
}
