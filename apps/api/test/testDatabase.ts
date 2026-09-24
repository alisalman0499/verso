// The database the test suite runs against — never the development one.
// Created by docker/postgres/init.sql. Override with TEST_DATABASE_URL, e.g.
// in CI.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://verso:verso@localhost:5432/verso_test'
