# React Apollo Hooks (with refetch support)

## useQuery
`QUERY_RESULT = useQuery(QUERY, QUERY_OPTIONS)`

```
const queryResult = useQuery(gql`
  query List($filterByName: String) {
    List(filterByName: $filterByName) {
      id
    }
  }
`, {
  variables: { filterByName }
})
```


## useMutation QuickSample
`[MUTATOR, MUTATION_RESULT] = useMutation(MUTATION, MUTATION_OPTIONS)`

```
const [mutate, mutationResult] = useMutation(gql`
  mutation addListItem($item: JSON) {
    addListItem(item: $item) {
      id
    }
  }
`, {
  variables: { item }
})

<Button onPress={() => if (!mutationResult.loading) mutate()} />
```

`MUTATOR` is a promise that will resolve with an object that contains `canceled` if the parent component is dismounted. This makes mutations resilient to dismounts but does not actually cancel the mutation if the server is acting on it. A response from the server on a canceled mutation will still be caught by the apollo client and all cache resolvers will work as intended.
