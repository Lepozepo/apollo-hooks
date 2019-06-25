import { useState, useEffect, useContext } from 'react';
import { ApolloContext } from 'react-apollo';

export default function useMutation(mutation, props) {
  const { client, operations } = useContext(ApolloContext);
  const [mutationResult, setMutationResult] = useState({
    loading: false,
    error: undefined,
    data: undefined,
  });
  const [mutatorProps, setMutatorProps] = useState(props);
  const [runner, setRunner] = useState({ counter: 0 });

  useEffect(() => {
    let didCancel = false;

    async function mutate() {
      try {
        if (!didCancel) setMutationResult({ ...mutationResult, error: undefined, loading: true });

        const { refetchQueries } = mutatorProps;
        let parsedRefetchQueries = refetchQueries;
        if (refetchQueries && refetchQueries.length && Array.isArray(refetchQueries)) {
          parsedRefetchQueries = refetchQueries.map((x) => {
            if (typeof x === 'string' && operations) return operations.get(x) || x;
            return x;
          });
        }

        const res = await client.mutate({
          mutation,
          ...mutatorProps,
          refetchQueries: parsedRefetchQueries,
        });
        if (!didCancel) {
          setMutationResult({
            ...mutationResult,
            loading: false,
            error: undefined,
            data: res,
          });
          runner.resolve(res);
        }
      } catch (err) {
        if (!didCancel) {
          setMutationResult({
            ...mutationResult,
            loading: false,
            error: err,
            data: undefined,
          });
          runner.reject(err);
        }
      }
    }

    if (runner.counter !== 0) mutate();

    return () => {
      didCancel = true;
      if (runner.reject) runner.reject({ canceled: true });
    };
  }, [runner.counter, mutatorProps, mutation]);

  function runMutation(runMutationProps) {
    return new Promise((resolve, reject) => {
      setMutatorProps({ ...props, ...runMutationProps });
      setRunner({ counter: runner.counter + 1, resolve, reject });
    });
  }

  return [runMutation, mutationResult];
}
