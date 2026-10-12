/** Segmented control for the reply tone; options come from GET /api/tones. */
function ToneToggle({ tones, value, onChange }) {
  if (tones.length === 0) return null;
  const selected = tones.find((t) => t.id === value);

  return (
    <div className="tone-row">
      <div className="tone-toggle" role="group" aria-label="Response tone">
        {tones.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === value}
            className={`tone-toggle__option tone--${t.id}`}
            onClick={() => onChange(t.id)}
          >
            <span className="tone-dot" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>
      {selected && <p className="tone-row__description">{selected.description}</p>}
    </div>
  );
}

export default ToneToggle;
