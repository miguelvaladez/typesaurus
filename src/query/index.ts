import firestore from '../adaptor'
import { Collection } from '../collection'
import { doc, Doc } from '../doc'
import { ref, pathToRef } from '../ref'
import { WhereQuery } from '../where'
import { OrderQuery } from '../order'
import { LimitQuery } from '../limit'
import { Cursor, CursorMethod } from '../cursor'
import { wrapData, unwrapData } from '../data'
import { CollectionGroup } from '../group'

export type FirebaseQuery =
  | FirebaseFirestore.CollectionReference
  | FirebaseFirestore.Query;

// TODO: Refactor with onQuery

/**
 * The query type.
 */
export type Query<Model, Key extends keyof Model> =
  | OrderQuery<Model, Key>
  | WhereQuery<Model>
  | LimitQuery;

export type QueryCursors<Model> = {
  firestoreQuery: FirebaseQuery;
  cursors: Cursor<Model, keyof Model>[];
};

export function getInitialQueryCursors<Model>(
  collection: Collection<Model> | CollectionGroup<Model>
): QueryCursors<Model> {
  const firestoreQuery = collection.__type__ === 'collectionGroup'
    ? firestore().collectionGroup(collection.path)
    : firestore().collection(collection.path);

  return {
    firestoreQuery,
    cursors: []
  };
}

export function buildQueryAndCursors<Model>(
  collection: Collection<Model> | CollectionGroup<Model>,
  queries: Query<Model, keyof Model>[]
): QueryCursors<Model> {
  const initialQueryCursors = getInitialQueryCursors(collection);
  return queries.reduce((acc, q) => {
    switch (q.type) {
      case 'order': {
        const { field, method, cursors } = q
        acc.firestoreQuery = acc.firestoreQuery.orderBy(
          field.toString(),
          method
        )
        if (cursors) {
          acc.cursors = acc.cursors.concat(cursors);
        }
        break;
      }

      case 'where': {
        const { field, filter, value } = q;
        const fieldName = Array.isArray(field) ? field.join('.') : field;
        acc.firestoreQuery = acc.firestoreQuery.where(
          fieldName,
          filter,
          unwrapData(value)
        );
        break;
      }

      case 'limit': {
        const { number } = q;
        acc.firestoreQuery = acc.firestoreQuery.limit(number);
        break;
      }
    }
    return acc;
  }, initialQueryCursors as QueryCursors<Model>);
}

export function groupCursors<Model>(
  cursors: Cursor<Model, keyof Model>[]
): [CursorMethod, any[]][] {
  return cursors.reduce(
    (acc, cursor) => {
      let methodValues = acc.find(([method]) => method === cursor.method);
      if (!methodValues) {
        methodValues = [cursor.method, []]
        acc.push(methodValues)
      }
      methodValues[1].push(unwrapData(cursor.value));
      return acc;
    }, [] as [CursorMethod, any[]][]
  );
}

export function getFirestoreQuery<Model>(
  firestoreQuery: FirebaseQuery,
  cursors: Cursor<Model, keyof Model>[]
): FirebaseFirestore.Query {
  const hasUndefined: boolean = cursors.some((cursor) => !cursor.value);
  if (!cursors.length || hasUndefined) {
    return firestoreQuery;
  }

  return groupCursors(cursors).reduce((acc, [method, values]) => {
    return acc[method](...values)
  }, firestoreQuery);
}

/**
 * Queries passed collection using query objects ({@link order}, {@link where}, {@link limit}).
 *
 * ```ts
 * import { query, limit, order, startAfter, collection } from 'typesaurus'
 *
 * type Contact = { name: string; year: number }
 * const contacts = collection<Contact>('contacts')
 *
 * query(contacts, [
 *   order('year', 'asc', [startAfter(2000)]),
 *   limit(2)
 * ]).then(bornAfter2000 => {
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
 * @returns The promise to the query results
 */
export async function query<Model>(
  collection: Collection<Model> | CollectionGroup<Model>,
  queries: Query<Model, keyof Model>[]
): Promise<Doc<Model>[]> {
  const { firestoreQuery, cursors } = buildQueryAndCursors(collection, queries);
  const paginatedFirestoreQuery = getFirestoreQuery(firestoreQuery, cursors);
  const firebaseSnap = await paginatedFirestoreQuery.get()

  return firebaseSnap.docs.map(d =>
    doc(
      collection.__type__ === 'collectionGroup'
        ? pathToRef(d.ref.path)
        : ref(collection, d.id),
      wrapData(d.data()) as Model
    )
  )
}
