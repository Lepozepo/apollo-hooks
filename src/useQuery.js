import {
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react';
import { ApolloContext } from 'react-apollo';
import { parser } from 'react-apollo/parser';

function observableQueryFields(observable) {
  if (!observable) return {};
  const fields = {
    variables: observable.variables,
    refetch: observable.refetch.bind(observable),
    fetchMore: observable.fetchMore.bind(observable),
    updateQuery: observable.updateQuery.bind(observable),
    startPolling: observable.startPolling.bind(observable),
    stopPolling: observable.stopPolling.bind(observable),
    subscribeToMore: observable.subscribeToMore.bind(observable),
  };
  // TODO: Need to cast this because we improved the type of `updateQuery` to be parametric
  // on variables, while the type in Apollo client just has object.
  // Consider removing this when that is properly typed
  return fields;
}

export default function useQuery(query, props = {}) {
  const { client, operations } = useContext(ApolloContext);
  const Observable = useRef(!props.skip ? client.watchQuery({ query, ...props }) : undefined);
  const Subscription = useRef();
  const [queryResult, _setQueryResult] = useState({
    data: undefined,
    error: undefined,
    loading: false,
    networkStatus: undefined,
    ...observableQueryFields(Observable.current),
    ...(Observable.current && Observable.current.getCurrentResult()),
  });

  function setQueryResult(newState) {
    _setQueryResult({
      ...queryResult,
      ...newState,
    });
  }

  useEffect(() => {
    if (!props.skip) {
      if (!Observable.current) {
        Observable.current = client.watchQuery({ query, ...props });
      }
      setQueryResult({
        ...observableQueryFields(Observable.current),
        networkStatus: 1,
        loading: true,
        data: undefined,
        error: undefined,
      });
    }
  }, [props.skip]);

  useEffect(() => {
    if (!props.skip) {
      if (Subscription.current) Subscription.current.unsubscribe();

      Subscription.current = Observable.current && Observable.current.subscribe({
        next({ loading, networkStatus, data } = {}) {
          setQueryResult({
            ...queryResult,
            loading,
            networkStatus,
            data,
          });
        },
        error(err) {
          setQueryResult({
            ...queryResult,
            error: err,
          });
        },
      });
    }

    return () => {
      if (Subscription.current) Subscription.current.unsubscribe();
    };
  }, [props.skip]);

  useEffect(() => {
    if (!Observable.current) return;

    Observable.current.setOptions(props);
  }, [props]);

  useEffect(() => {
    const operation = parser(query);
    operations.set(operation.name, {
      query,
      variables: props.variables,
    });
  }, [query, props.variables]);

  return queryResult;
}
