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

export interface DocChange<Model> extends Doc<Model> {
  changeType: DocumentChangeType;
}

const stringToEnumValue = <ET, T>(enumObj: ET, str: string): T =>
  (enumObj as any)[Object.keys(enumObj).filter(k => (enumObj as any)[k] === str)[0]];

function asDocChange<Model>(
  ref: Ref<Model>,
  docChange: FirebaseFirestore.DocumentChange
): DocChange<Model> {
  const document: Doc<Model> = doc(ref, wrapData(docChange.doc.data()) as Model);
  const changeType: DocumentChangeType = stringToEnumValue<typeof DocumentChangeType, DocumentChangeType>(
    DocumentChangeType,
    docChange.type
  );

  return { ...document, changeType };
}

export function snapshotChanges$<Model>(
  collection: Collection<Model>
): Observable<DocChange<Model>[]> {
  return new Observable((subscriber: Subscriber<DocChange<Model>[]>) => {
    const unsubscribe = firestore().collection(collection.path)
      .onSnapshot((snapshot: FirebaseFirestore.QuerySnapshot) => {
        const docs: DocChange<Model>[] = snapshot
          .docChanges()
          .map((docChange: FirebaseFirestore.DocumentChange) =>
            asDocChange<Model>(ref(collection, docChange.doc.id), docChange)
          );

        subscriber.next(docs);
      });
    return unsubscribe();
  });
}
