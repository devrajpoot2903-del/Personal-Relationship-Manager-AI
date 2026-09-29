import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deletePersonCascade,
  listPeopleWithEvents,
  savePerson,
} from '../lib/db';
import { pickPrimaryEvent } from '../lib/dates';

/**
 * Loads people for the dashboard (names, avatars and their next occasion) and
 * exposes create / update / delete operations.
 */
export function usePeopleList() {
  const [people, setPeople] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const loaded = await listPeopleWithEvents();
      setPeople(loaded);
      setError(null);
      setStatus('ready');
      return loaded;
    } catch (cause) {
      setError(cause);
      setStatus('error');
      return [];
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const loaded = await listPeopleWithEvents().catch(() => null);
      if (!active) return;
      if (loaded) {
        setPeople(loaded);
        setError(null);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const createPerson = useCallback(
    async (data) => {
      const saved = await savePerson(data);
      await refresh();
      return saved;
    },
    [refresh]
  );

  const updatePerson = useCallback(
    async (id, data) => {
      const saved = await savePerson({ ...data, id });
      await refresh();
      return saved;
    },
    [refresh]
  );

  const removePerson = useCallback(
    async (id) => {
      const removed = await deletePersonCascade(id);
      await refresh();
      return removed;
    },
    [refresh]
  );

  /** People sorted so the closest upcoming occasion floats to the top. */
  const peopleByUpcoming = useMemo(() => {
    return [...people].sort((a, b) => {
      const eventA = pickPrimaryEvent(a.events || []);
      const eventB = pickPrimaryEvent(b.events || []);

      if (!eventA && !eventB) return a.name.localeCompare(b.name);
      if (!eventA) return 1;
      if (!eventB) return -1;

      const dayA = eventA.countdown?.days ?? Number.MAX_SAFE_INTEGER;
      const dayB = eventB.countdown?.days ?? Number.MAX_SAFE_INTEGER;
      if (dayA !== dayB) return dayA - dayB;

      return a.name.localeCompare(b.name);
    });
  }, [people]);

  return {
    people,
    peopleByUpcoming,
    status,
    isLoading: status === 'loading',
    error,
    refresh,
    createPerson,
    updatePerson,
    removePerson,
  };
}

export default usePeopleList;
