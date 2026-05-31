declare module "sql.js" {
  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export interface SqlJsStatic {
    Database: new () => {
      run: (sql: string) => void;
      exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
    };
  }

  const initSqlJs: (config?: SqlJsConfig) => Promise<SqlJsStatic>;
  export default initSqlJs;
}
