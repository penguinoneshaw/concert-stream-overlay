export interface HasNotes {
  notes?: string;
}

export interface OtherState extends HasNotes {
  type: `State-${string}`;
  stream: string;
  controls: string;
}

export interface Piece extends HasNotes {
  type: "piece" | undefined;
  title: string;
  subtitle?: string;
  composer?: string;
  arranger?: string;
  lyrics?: string;
}

export type SharedState = Piece | OtherState;

export interface Group {
  name: string;
  logo?: string;
}

export interface Charity {
  name: string;
  registrationNumber: string;
}

export interface ConcertMetadata {
  group: Group;
  name: string;
  venue?: string;
  date?: Date | string;
  description?: string[];
  price?: string;
  charity?: Charity[];
}

export interface Person {
  title: string;
  name: string;
}

export type Mapped<T, K extends keyof T, V extends keyof T> = T[K] extends
  | string
  | number
  | symbol
  ? Record<T[K], T[V]>
  : never;

export function isPiece(state: SharedState | undefined): state is Piece {
  return state?.type === "piece" || (state != null && state.type === undefined);
}

export interface Concert
  extends ConcertMetadata,
    Record<"performers" | "committee", Mapped<Person, "title", "name">> {
  conductor: Person & {
    description: string[];
  };
  running_order: SharedState[];
  otherStates: Record<
    OtherState["type"],
    Pick<OtherState, "stream" | "controls">
  >;
}
