import type { OnboardingDraft } from "./draft";
import TrackSearch from "./TrackSearch";

type StepSongProps = {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  errors: Record<string, string>;
};

const textareaClass =
  "w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm leading-relaxed text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-vybe-400 focus:bg-white/10";

const labelClass =
  "font-heading mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-300">{message}</p>;
}

export default function StepSong({ draft, update, errors }: StepSongProps) {
  const song = draft.song;

  function selectSong(next: OnboardingDraft["song"]) {
    if (!next) {
      // Keep `songStory` so a later selection restores the typed story.
      update({ song: null });
      return;
    }
    update({ song: { ...next, story: draft.songStory } });
  }

  return (
    <div className="space-y-6">
      <div>
        <TrackSearch selected={song} onSelect={selectSong} />
        {song ? null : <FieldError message={errors.song} />}
      </div>

      {song ? (
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="onboarding-story" className={labelClass}>
              The story behind it
            </label>
            <span className="text-xs tabular-nums text-white/35">{draft.songStory.length}/500</span>
          </div>
          <textarea
            id="onboarding-story"
            rows={5}
            maxLength={500}
            value={draft.songStory}
            onChange={(event) =>
              update({
                song: { ...song, story: event.target.value },
                songStory: event.target.value,
              })
            }
            placeholder="What does this song mean to you?"
            className={textareaClass}
          />
          <FieldError message={errors.story} />
        </div>
      ) : null}
    </div>
  );
}
