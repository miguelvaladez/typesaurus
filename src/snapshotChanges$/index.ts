import { Collection } from '../collection';
import { Observable, Subscriber } from 'rxjs';
import { Ref, ref } from '../ref';
import firestore from '../adaptor';
import { Doc, doc } from '../doc';
import { wrapData } from '../data';

export enum DocumentChangeType {
  Added = 'added',
  Modified = 'modified',
  Removed = 'removed'
};

export interface DocChange<Model> {
  __type__: 'doc'
  data: Model
  ref: Ref<Model>
  changeType: DocumentChangeType
}

const stringToEnumValue = <ET, T>(enumObj: ET, str: string): T =>
  (enumObj as any)[Object.keys(enumObj).filter(k => (enumObj as any)[k] === str)[0]];

export function toDocChange<Model>(
  ref: Ref<Model>,
  docChange: FirebaseFirestore.DocumentChange
): DocChange<Model> {
  let document: Doc<Model> = doc(ref, wrapData(docChange.doc.data()) as Model);
  return {
    ...document,
    changeType: stringToEnumValue<typeof DocumentChangeType, DocumentChangeType>(DocumentChangeType, docChange.type)
  };
}

export function snapshotChanges$<Model>(
  collection: Collection<Model>
): Observable<DocChange<Model>[]> {
  return new Observable((observer: Subscriber<DocChange<Model>[]>) => {
    const unsubscribe = firestore().collection(collection.path)
      .onSnapshot((snapshot: FirebaseFirestore.QuerySnapshot) => {
        const docs = snapshot.docChanges()
          .map((docChange: FirebaseFirestore.DocumentChange) => {
            return toDocChange<Model>(ref(collection, docChange.doc.id), docChange);
          });

        observer.next(docs);
      });
    return unsubscribe();
  });
}
