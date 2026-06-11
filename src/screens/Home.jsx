// Home screen: full-screen cream ground, one big pixel-font question, and the
// two options. Sparse and confident — mostly type and space.
//   "no idea"    → the gacha draw (built in step 4)
//   "gimme inspo" → the browse menu
export default function Home({ onNoIdea, onInspo }) {
  return (
    <div className="home">
      <h1 className="home-question">What are we eating today?</h1>

      <div className="home-options">
        <button type="button" className="home-option" onClick={onNoIdea}>
          no idea
        </button>
        <button type="button" className="home-option" onClick={onInspo}>
          gimme inspo
        </button>
      </div>
    </div>
  );
}
