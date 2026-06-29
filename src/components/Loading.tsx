import '../App.css';

export default function Loading() {
  return (
    <div className="screen loading-screen">
      <div className="spinner" />
      <p className="loading-text">מחשב התאמה...</p>
    </div>
  );
}
