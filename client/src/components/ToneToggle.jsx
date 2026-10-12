/** Segmented control for the reply tone; options come from GET /api/tones. */
function ToneToggle({ tones, value, onChange }) {
  if (tones.length === 0) return null;

  return (
    <div className="tone-toggle" role="radiogroup" aria-label="Response tone">
      {tones.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={t.id === value}
          className={`tone-toggle__option ${t.id === value ? "tone-toggle__option--active" : ""}`}
          title={t.description}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default ToneToggle;
