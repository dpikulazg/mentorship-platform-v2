import React, { useState, useEffect } from 'react';
import { 
  getSqliteDb, querySql, rawExecSql, downloadDatabaseFile, 
  importDatabaseBinary, resetDatabaseToDefaults 
} from '../lib/sqlite';
import { useDataSource } from '../hooks/useDataSource';
import { unifiedDataService } from '../services/dataSource';
import { toast } from 'sonner';
import { 
  Database, Play, Download, Upload, RotateCcw, 
  Table2, CheckCircle2, AlertTriangle, Layers, 
  Terminal, ArrowRightLeft, HardDrive, Cpu
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function SqliteStudio() {
  const { dataSource, switchDataSource, triggerRefresh } = useDataSource();
  const [queryInput, setQueryInput] = useState('SELECT * FROM affiliates;');
  const [queryResult, setQueryResult] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tablesSummary, setTablesSummary] = useState<{ name: string; count: number }[]>([]);
  const [syncing, setSyncing] = useState(false);

  const fetchTablesSummary = async () => {
    try {
      const tables = await querySql<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
      );
      const summary: { name: string; count: number }[] = [];
      for (const t of tables) {
        const countRes = await querySql<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM ${t.name};`);
        summary.push({ name: t.name, count: countRes[0]?.cnt || 0 });
      }
      setTablesSummary(summary);
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTablesSummary();
  }, []);

  const handleRunQuery = async () => {
    setError(null);
    const start = performance.now();
    try {
      const results = await rawExecSql(queryInput.trim());
      const end = performance.now();
      setExecTime(Number((end - start).toFixed(2)));

      if (results && results.length > 0) {
        setQueryResult({
          columns: results[0].columns,
          values: results[0].values
        });
      } else {
        setQueryResult({ columns: ['Status'], values: [['Query executed successfully (0 rows returned)']] });
      }
      fetchTablesSummary();
      triggerRefresh();
    } catch (err: any) {
      setError(err.message || 'SQL execution failed');
      setQueryResult(null);
    }
  };

  const handleExport = async () => {
    try {
      await downloadDatabaseFile();
      toast.success('SQLITE DATABASE BINARY EXPORTED (.sqlite)');
    } catch (e: any) {
      toast.error('Export failed: ' + e.message);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      await importDatabaseBinary(uint8);
      toast.success('SQLITE DATABASE RESTORED FROM ' + file.name);
      fetchTablesSummary();
      triggerRefresh();
    } catch (err: any) {
      toast.error('Import failed: ' + err.message);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reinitialize SQLite database to factory schema and seeds? Any unsaved custom records will be overwritten.')) {
      return;
    }
    try {
      await resetDatabaseToDefaults();
      toast.success('SQLITE RE-SEEDED TO FACTORY DEFAULTS');
      fetchTablesSummary();
      triggerRefresh();
    } catch (e: any) {
      toast.error('Reset failed: ' + e.message);
    }
  };

  const handleSyncFirestoreToSqlite = async () => {
    setSyncing(true);
    try {
      const res = await unifiedDataService.syncFirestoreToSqlite();
      toast.success(`SYNCED FROM FIRESTORE: ${res.modulesCount} modules, ${res.lessonsCount} lessons`);
      fetchTablesSummary();
      triggerRefresh();
    } catch (e: any) {
      toast.error('Sync failed: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSqliteToFirestore = async () => {
    setSyncing(true);
    try {
      const res = await unifiedDataService.syncSqliteToFirestore();
      toast.success(`PUSHED TO FIRESTORE: ${res.modulesCount} modules, ${res.lessonsCount} lessons`);
    } catch (e: any) {
      toast.error('Push failed: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const setTemplate = (sql: string) => {
    setQueryInput(sql);
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Top Banner: Active Data Store Mode */}
      <div className="bg-[#0b0814] border border-primary/25 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary">
            <HardDrive className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-white tracking-wider">Storage Architecture</span>
              <span className={`text-[9px] px-2 py-0.5 border font-bold uppercase tracking-widest ${
                dataSource === 'sqlite' 
                  ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                  : 'bg-primary/10 text-primary border-primary/30'
              }`}>
                {dataSource === 'sqlite' ? 'SQLite Local Store (Active)' : 'Firestore Cloud (Active)'}
              </span>
            </div>
            <p className="text-[10px] text-primary/50 mt-0.5">
              Zero-latency in-browser WebAssembly SQLite with IndexedDB persistent persistence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm"
            onClick={() => switchDataSource(dataSource === 'sqlite' ? 'firestore' : 'sqlite')}
            className={`rounded-none text-[10px] font-bold uppercase tracking-wider h-8 ${
              dataSource === 'sqlite'
                ? 'bg-primary text-black hover:bg-primary/80'
                : 'bg-secondary text-white hover:bg-secondary/80'
            }`}
          >
            Switch to {dataSource === 'sqlite' ? 'Firestore' : 'SQLite'}
          </Button>

          <Button 
            size="sm" 
            variant="outline" 
            disabled={syncing}
            onClick={handleSyncFirestoreToSqlite}
            className="rounded-none border-primary/20 text-primary/70 hover:text-primary text-[10px] h-8"
            title="Pull modules & lessons from Firestore into SQLite"
          >
            <ArrowRightLeft className="w-3 h-3 mr-1" /> Firestore → SQLite
          </Button>

          <Button 
            size="sm" 
            variant="outline" 
            disabled={syncing}
            onClick={handleSyncSqliteToFirestore}
            className="rounded-none border-primary/20 text-primary/70 hover:text-primary text-[10px] h-8"
            title="Push modules & lessons from SQLite to Firestore"
          >
            <ArrowRightLeft className="w-3 h-3 mr-1" /> SQLite → Firestore
          </Button>
        </div>
      </div>

      {/* Database Metrics & Tables Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tablesSummary.map(t => (
          <div 
            key={t.name} 
            onClick={() => setTemplate(`SELECT * FROM ${t.name};`)}
            className="bg-[#050508] border border-primary/15 p-3 hover:border-primary/40 cursor-pointer transition-colors group"
          >
            <span className="text-[9px] text-primary/40 uppercase tracking-widest block group-hover:text-primary transition-colors">
              {t.name}
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {t.count} <span className="text-[9px] text-[#bfb9ca] font-normal">rows</span>
            </div>
          </div>
        ))}
      </div>

      {/* SQL Query Console */}
      <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
        <CardHeader className="border-b border-primary/20 bg-primary/5 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-heading text-primary tracking-wide">
                Interactive SQLite SQL Studio
              </CardTitle>
            </div>
            <CardDescription className="text-[9px] text-primary/50 uppercase">
              Execute real SQL statements against local relational schema
            </CardDescription>
          </div>

          {/* Quick Query Templates */}
          <div className="hidden lg:flex gap-1.5">
            <button 
              onClick={() => setTemplate('SELECT * FROM lessons;')} 
              className="text-[9px] px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            >
              Lessons & Uploads
            </button>
            <button 
              onClick={() => setTemplate('SELECT * FROM affiliates;')} 
              className="text-[9px] px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            >
              Affiliates
            </button>
            <button 
              onClick={() => setTemplate('SELECT * FROM affiliate_referrals;')} 
              className="text-[9px] px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            >
              Referrals Ledger
            </button>
            <button 
              onClick={() => setTemplate("SELECT name, sql FROM sqlite_master WHERE type='table';")} 
              className="text-[9px] px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            >
              Table DDL
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <textarea 
              rows={4}
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              placeholder="SELECT * FROM modules;"
              className="w-full bg-[#05050a] border border-primary/30 p-3 text-xs font-mono text-white focus:outline-none focus:border-primary transition-all resize-y"
            />
          </div>

          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleRunQuery}
                className="bg-primary text-black hover:bg-primary/80 rounded-none text-[10px] font-bold uppercase tracking-widest h-8 px-4"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 fill-black" /> Run SQL Query
              </Button>
              {execTime !== null && (
                <span className="text-[10px] text-green-400">
                  Execution completed in {execTime}ms
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                className="rounded-none border-primary/20 text-primary/70 hover:text-primary text-[10px] h-8"
              >
                <Download className="w-3 h-3 mr-1" /> Export (.sqlite)
              </Button>

              <label className="cursor-pointer inline-flex items-center justify-center border border-primary/20 text-primary/70 hover:text-primary px-3 text-[10px] h-8 transition-colors">
                <Upload className="w-3 h-3 mr-1" /> Import (.sqlite)
                <input 
                  type="file" 
                  accept=".sqlite,.db,.sqlite3" 
                  onChange={handleImportFile}
                  className="hidden" 
                />
              </label>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="rounded-none text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[10px] h-8"
                title="Reset to factory schema and sample records"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Factory Reset
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Table */}
          {queryResult && (
            <div className="mt-4 border border-primary/20 overflow-x-auto max-h-[380px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-[#050508] sticky top-0">
                  <TableRow className="border-primary/20">
                    {queryResult.columns.map((col, idx) => (
                      <TableHead key={idx} className="text-[9px] uppercase tracking-wider text-primary font-bold">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResult.values.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={queryResult.columns.length} className="text-center text-xs text-primary/40 py-6">
                        Query returned 0 rows.
                      </TableCell>
                    </TableRow>
                  ) : (
                    queryResult.values.map((row, rIdx) => (
                      <TableRow key={rIdx} className="border-primary/10 hover:bg-primary/5">
                        {row.map((val, cIdx) => (
                          <TableCell key={cIdx} className="text-[10px] text-[#bfb9ca] whitespace-nowrap">
                            {val === null || val === undefined ? (
                              <span className="text-primary/30 italic">NULL</span>
                            ) : typeof val === 'object' ? (
                              JSON.stringify(val)
                            ) : (
                              String(val)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
