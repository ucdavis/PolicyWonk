import { Client } from '@elastic/elasticsearch';

export const searchClient = new Client({
  node: process.env.ELASTIC_URL ?? 'http://127.0.0.1:9200',
  auth: {
    username: process.env.ELASTIC_SEARCHER_USERNAME ?? 'elastic',
    password: process.env.ELASTIC_SEARCHER_PASSWORD ?? 'changeme',
  },
});

export const indexName = process.env.ELASTIC_INDEX ?? 'test_vectorstore4';
