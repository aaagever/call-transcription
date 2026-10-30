interface Props {
  /** Brightens the glow and runs the light trail around the border. */
  active: boolean;
  children: React.ReactNode;
}

// The drop zone's frame: drifting colored glow behind a frosted surface, and a
// light trail around the border while active. After the Halo Dropzone by
// cult/ui on 21st.dev (MIT); the styles are the .halo-* rules in index.css.
export function HaloFrame({ active, children }: Props) {
  return (
    <div className={`halo ${active ? "active" : ""}`}>
      <div className="halo-blobs" aria-hidden="true">
        <div>
          <i className="p" />
          <i className="s" />
          <i className="t" />
        </div>
      </div>
      <div className="halo-surface">{children}</div>
      <div className="halo-trail" aria-hidden="true">
        <i className="ambient" />
        <i className="core" />
      </div>
    </div>
  );
}
