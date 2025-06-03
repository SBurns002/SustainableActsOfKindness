import React from 'react';
import MapView from './components/MapView';
import Header from './components/Header';

function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <MapView />
      </main>
    </div>
  );
}

export default App;