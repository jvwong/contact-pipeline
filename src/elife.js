import dbdriver from './util/db.js';

const loadTable = name => dbdriver.accessTable(name);

/**
 * elife
 *
 * Load the elife article metadata from the database and map to a contact list
 * @param {object} options start Date
 * @return {object} the corresponding results
 */
export default async function elife (options) {
  const isPublic = d => {
    return d('status').eq('public');
  };
  const byArticleDoiPrefix = d => {
    return d('article')('PubmedData')('ArticleIdList').filter(function (ArticleId) {
      return ArticleId('id').match('^10.7554');
    }).count().gt(0);
  };

  const journal = d => {
    const j = d('article')('MedlineCitation')('Article')('Journal');
    const journal = r.branch(
      j.hasFields('Title'),
      j('Title'),
      j.hasFields('ISOAbbreviation'),
      j('ISOAbbreviation'),
      '');
    return { journal };
  };

  const type = d => {
    return {
      type: r.branch(
        d('article')('MedlineCitation')('Article')('PublicationTypeList').filter(function (o) { return o('UI').eq('D000076942'); }).count().gt(0),
        'Preprint',
        d('article')('MedlineCitation')('Article')('PublicationTypeList').filter(function (o) { return o('UI').eq('D016428'); }).count().gt(0),
        'Journal Article',
        null)
    };
  };

  const title = d => {
    return {
      title: r.branch(
        d('article')('MedlineCitation')('Article')('ArticleTitle').ne(null),
        d('article')('MedlineCitation')('Article')('ArticleTitle'),
        '')
    };
  };

  const paperIds = d => {
    return {
      pmid: r.branch(
        d('article')('PubmedData')('ArticleIdList').filter(function (o) { return o('IdType').eq('pubmed'); }).count().gt(0),
        d('article')('PubmedData')('ArticleIdList').filter(function (o) { return o('IdType').eq('pubmed'); }).nth(0)('id'),
        null),
      doi: r.branch(
        d('article')('PubmedData')('ArticleIdList').filter(function (o) { return o('IdType').eq('doi'); }).count().gt(0),
        d('article')('PubmedData')('ArticleIdList').filter(function (o) { return o('IdType').eq('doi'); }).nth(0)('id'),
        null)
    };
  };

  const dates = d => {
    return {
      created: r.epochTime(d('createdDate')).toISO8601().split('T')(0)
    };
  };

  const providedNameEmail = d => {
    const name = d('provided')('name').default('').split(' ');
    const names = name.count();
    return {
      email: d('provided')('authorEmail'),
      foreName: r.branch(names.gt(0), name.nth(0), null),
      lastName: r.branch(names.gt(1), name.nth(-1), null)
    };
  };

  const { rethink: r, conn, table } = await loadTable('document');
  let q = table;

  // Filter
  // By eLife DOI Prefix
  q = q.filter(isPublic);
  q = q.filter(byArticleDoiPrefix);

  // Merge in useful fields
  q = q.merge(journal);
  q = q.merge(title);
  q = q.merge(type);
  q = q.merge(paperIds);
  q = q.merge(dates);

  // Author / Email
  q = q.merge(providedNameEmail);

  q = q.pluck(['id', 'title', 'journal', 'created', 'status', 'pmid', 'doi', 'email', 'foreName', 'lastName', 'type']);

  const cursor = await q.run(conn);
  const data = await cursor.toArray();
  conn.close(function (err) { if (err) throw err; });
  return data;
}
