declare module "better-sqlite3" {
  type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  interface Statement<BindParams extends unknown[] = unknown[]> {
    run(...params: BindParams): RunResult;
    all(...params: BindParams): unknown[];
  }

  interface Database {
    exec(sql: string): this;
    prepare(sql: string): Statement;
    close(): this;
  }

  interface DatabaseConstructor {
    new (filename: string): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
