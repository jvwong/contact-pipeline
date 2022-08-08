import dbdriver, { MAX_DATE } from './util/db.js';

const loadTable = name => dbdriver.accessTable(name);

/**
 * load
 *
 * Load the article metadata from the database and map to a contact list
 * @param {object} start start Date
 * @param {object} end end Date
 * @return {object} the corresponding results
 */
export async function load (lastUpdated, start, end, options) {
  const { rethink: r, conn, table } = await loadTable('documents');
  let q = table;

  // Select minimum last updated
  q = q.between(
    lastUpdated, MAX_DATE, { index: 'last_updated', rightBound: 'closed' }
  );

  q = q.filter(r.row('pub_date').ge(start).and(r.row('pub_date').le(end)));

  // Filters
  // Only author-associated email
  const hasAuthorEmail = r.row('author_list').filter(function (author) { return author('emails').ne(null); }).count().gt(0);
  const docOpts = hasAuthorEmail;
  q = q.filter(docOpts);

  // citation field
  q = q.merge(function (document) {
    const journal = document('journal');
    const title = r.branch(journal.hasFields('title'), journal('title'), '');
    const year = r.expr(' (').add(document('pub_date').year().coerceTo('string')).add(')');

    return {
      articleCitation: r.expr(title).add(year)
    };
  });

  // author field
  q = q.merge(function (document) {
    const lastAuthor = document('author_list').filter(function (author) { return author('emails').ne(null); }).nth(-1);
    const emailRecipientAddress = lastAuthor('emails').nth(-1);
    const authorName = lastAuthor('fore_name');

    return {
      authorName,
      emailRecipientAddress
    };
  });

  q = q.limit(options.limit);
  q = q.pluck(['pmid', 'doi', 'articleCitation', 'authorName', 'emailRecipientAddress', 'pub_date', 'last_updated']);

  const cursor = await q.run(conn);
  const data = await cursor.toArray();
  conn.close(function (err) { if (err) throw err; });
  return data;
}
