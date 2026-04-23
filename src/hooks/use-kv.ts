import { useState, useEffect, useCallback, useRef } from 'react'
import { get, set } from 'idb-keyval'

export function useKV<T>(
  key: string,
  defaultValue: T
): [T | undefined, (value: T | ((old: T | undefined) => T)) => void] {
  const defaultRef = useRef(defaultValue)
  const valueRef = useRef<T | undefined>(undefined)
  const [value, setValue] = useState<T | undefined>(undefined)

  useEffect(() => {
    get<T>(key).then(stored => {
      const resolved = stored !== undefined ? stored : defaultRef.current
      valueRef.current = resolved
      setValue(resolved)
    })
  }, [key])

  const setKV = useCallback(
    (updater: T | ((old: T | undefined) => T)) => {
      // Resolve the next value using the ref (not the setState callback)
      // so the IDB write fires immediately — NOT inside a setState callback
      // that React could discard if the component unmounts in the same batch.
      const next =
        typeof updater === 'function'
          ? (updater as (old: T | undefined) => T)(valueRef.current)
          : updater
      valueRef.current = next
      set(key, next).catch(err =>
        console.error(`useKV: failed to persist key "${key}"`, err)
      )
      setValue(next)
    },
    [key]
  )

  return [value, setKV]
}
