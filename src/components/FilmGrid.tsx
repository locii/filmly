import FilmCard from "./FilmCard";
import { Film } from "@/lib/types";

interface Props {
  films: Film[];
  emptyMessage?: string;
}

export default function FilmGrid({ films, emptyMessage = "No films found." }: Props) {
  if (films.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-16 text-sm">{emptyMessage}</div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {films.map((film) => (
        <FilmCard key={film.id} film={film} />
      ))}
    </div>
  );
}
