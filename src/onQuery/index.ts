import { Collection } from '../collection'
import { doc, Doc } from '../doc'
import { ref, pathToRef } from '../ref'
import { wrapData } from '../data'
import { CollectionGroup } from '../group'
import { buildQueryAndCursors, getFirestoreQuery, Query } from '../query'

/**
 * Subscribes to a collection query built using query objects ({@link order | order}, {@link where | where}, {@link limit | limit}).
 *
 * ```ts
 * import { query, limit, order, startAfter, collection } from 'typesaurus'
 *
 * type Contact = { name: string; year: number }
 * const contacts = collection<Contact>('contacts')
 *
 * onQuery(contacts, [
 *   order('year', 'asc', [startAfter(2000)]),
 *   limit(2)
 * ], bornAfter2000 => {
 *   console.log(bornAfter2000)
 *   //=> 420
 *   console.log(bornAfter2000[0].ref.id)
 *   //=> '00sHm46UWKObv2W7XK9e'
 *   console.log(bornAfter2000[0].data)
 *   //=> { name: 'Sasha' }
 * })
 * ```
 *
 * @param collection - The collection or collection group to query
 * @param queries - The query objects
 * @param onResult - The function which is called with the query result when
 * the initial fetch is resolved or the query result updates.
 * @param onError - The function is called with error when request fails.
 * @returns Function that unsubscribes the listener from the updates
 */
export default function onQuery<Model>(
  collection: Collection<Model> | CollectionGroup<Model>,
  queries: Query<Model, keyof Model>[],
  onResult: (docs: Doc<Model>[]) => any,
  onError?: (err: Error) => any
): () => void {
  try {
    const { firestoreQuery, cursors } = buildQueryAndCursors(collection, queries);
    const paginatedFirestoreQuery = getFirestoreQuery(firestoreQuery, cursors);

    return paginatedFirestoreQuery.onSnapshot(
      (firestoreSnap: FirebaseFirestore.QuerySnapshot) => {
        onResult(
          firestoreSnap.docs.map(d =>
            doc(
              collection.__type__ === 'collectionGroup'
                ? pathToRef(d.ref.path)
                : ref(collection, d.id),
              wrapData(d.data()) as Model
            )
          )
        )
      },
      onError
    )
  } catch (err) {
    setTimeout(() => onError && onError(err))
    return () => { }
  }
}
