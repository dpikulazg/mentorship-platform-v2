import { useState, useEffect, useCallback } from 'react';
import { DataSourceType } from '../types';
import { getActiveDataSource, setActiveDataSource, subscribeToDataSourceChange } from '../services/dataSource';
import { subscribeToSqlite } from '../lib/sqlite';

export function useDataSource() {
  const [dataSource, setSourceState] = useState<DataSourceType>(getActiveDataSource());
  const [updateTick, setUpdateTick] = useState(0);

  useEffect(() => {
    const unsubSource = subscribeToDataSourceChange((newSource) => {
      setSourceState(newSource);
    });

    const unsubSqlite = subscribeToSqlite(() => {
      setUpdateTick(t => t + 1);
    });

    return () => {
      unsubSource();
      unsubSqlite();
    };
  }, []);

  const switchDataSource = useCallback((newSource: DataSourceType) => {
    setActiveDataSource(newSource);
    setSourceState(newSource);
  }, []);

  const triggerRefresh = useCallback(() => {
    setUpdateTick(t => t + 1);
  }, []);

  return {
    dataSource,
    switchDataSource,
    updateTick,
    triggerRefresh
  };
}
