/**
 * Interface for the keypress event object from readline
 */
export interface KeypressEvent {
  sequence?: string;
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}
