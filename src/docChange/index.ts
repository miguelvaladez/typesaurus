import { Doc, doc } from '../doc';
import { wrapData } from '../data';
import { Ref } from '../ref';

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

export function docChange<Model>(
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
