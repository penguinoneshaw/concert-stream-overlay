export interface OtherState {
  type: string;
  stream: string;
  controls: string;
}

export interface Piece {
  type: "piece";
  title: string;
  subtitle?: string;
  composer?: string;
  arranger?: string;
  lyrics?: string;
}

export interface Group {
  name: string;
  logo?: string;
}

export interface ConcertMetadata {
  group: Group;
  name: string;
  venue?: string;
  date?: Date | string;
  description?: string[];
  price?: string;
}

export interface Charity {
  name: string;
  registrationNumber: string;
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

export type PieceOrOtherState = Piece | OtherState;

export function isPiece(state: PieceOrOtherState | undefined): state is Piece {
  return state?.type === "piece";
}

export interface Concert
  extends ConcertMetadata,
    Record<"performers" | "committee", Mapped<Person, "title", "name">> {
  conductor: Person & {
    description: string[];
  };
  charity: Charity[];
  pieces: PieceOrOtherState[];
  otherStates: Record<
    OtherState["type"],
    Pick<OtherState, "stream" | "controls">
  >;
}
