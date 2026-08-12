declare module "sql.js" {
  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => {
      run: (sql: string) => void;
      exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
      export: () => Uint8Array;
      close: () => void;
    };
  }

  const initSqlJs: (config?: SqlJsConfig) => Promise<SqlJsStatic>;
  export default initSqlJs;
}
