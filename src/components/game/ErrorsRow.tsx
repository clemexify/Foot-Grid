import { MAX_ERRORS } from "@/game/constants";

type ErrorsRowProps = {
  errors: number;
};

export default function ErrorsRow({ errors }: ErrorsRowProps) {
  return (
    <div className="errors-row">
      {Array.from({ length: MAX_ERRORS }).map((_, index) => (
        <span key={index} className={`error-dot ${index < errors ? "used" : ""}`} />
      ))}
    </div>
  );
}
