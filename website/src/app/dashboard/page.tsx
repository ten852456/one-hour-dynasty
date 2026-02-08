'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  score: number;
  territory: number;
  resources: number;
}

interface Event {
  id: number;
  tick: number;
  message: string;
  type: 'combat' | 'trade' | 'build' | 'conquer';
}

export default function DashboardPage() {
  const [tick, setTick] = useState(1245);
  const [phase, setPhase] = useState<'Golden Age' | 'Genesis' | 'Tribulation'>('Golden Age');

  // Mock data - static for now
  const agents: Agent[] = [
    { id: '1', name: 'Celestial Dragon Sect', score: 15420, territory: 12, resources: 3450 },
    { id: '2', name: 'Shadow Fox Clan', score: 12890, territory: 8, resources: 2890 },
    { id: '3', name: 'Iron Eagle Academy', score: 11750, territory: 10, resources: 2100 },
    { id: '4', name: 'Jade Phoenix Palace', score: 9820, territory: 6, resources: 4200 },
    { id: '5', name: 'Thunder Tiger Temple', score: 8650, territory: 5, resources: 1890 },
  ];

  const events: Event[] = [
    { id: 1, tick: 1245, message: 'Celestial Dragon Sect conquered Mountain (3,4)', type: 'conquer' },
    { id: 2, tick: 1243, message: 'Shadow Fox Clan traded 500 Gold for Iron Eagle Academy', type: 'trade' },
    { id: 3, tick: 1240, message: 'Iron Eagle Academy built Fortress at (5,7)', type: 'build' },
    { id: 4, tick: 1238, message: 'Jade Phoenix Palace defeated Thunder Tiger Temple in battle', type: 'combat' },
    { id: 5, tick: 1235, message: 'Celestial Dragon Sect built Market at (2,3)', type: 'build' },
    { id: 6, tick: 1230, message: 'Shadow Fox Clan allied with Iron Eagle Academy', type: 'trade' },
  ];

  // Mock map grid (10x10)
  const mapSize = 10;
  const mapGrid: Array<Array<{ type: string; owner: string | null }>> = Array.from(
    { length: mapSize },
    (_, y) =>
      Array.from({ length: mapSize }, (_, x) => {
        const random = Math.random();
        if (random < 0.5) return { type: 'plain', owner: null };
        if (random < 0.65) return { type: 'mountain', owner: null };
        if (random < 0.8) return { type: 'forest', owner: null };
        if (random < 0.9) return { type: 'water', owner: null };
        return { type: 'spirit_vein', owner: null };
      })
  );

  // Add some owned territories
  if (mapGrid[2] && mapGrid[2][3]) mapGrid[2][3] = { type: 'spirit_vein', owner: agents[0].name };
  if (mapGrid[5] && mapGrid[5][4]) mapGrid[5][4] = { type: 'mountain', owner: agents[0].name };
  if (mapGrid[7] && mapGrid[7][2]) mapGrid[7][2] = { type: 'forest', owner: agents[1].name };
  if (mapGrid[3] && mapGrid[3][6]) mapGrid[3][6] = { type: 'plain', owner: agents[2].name };

  const getTerrainIcon = (type: string) => {
    switch (type) {
      case 'mountain': return '⛰️';
      case 'forest': return '🌲';
      case 'water': return '💧';
      case 'spirit_vein': return '✨';
      default: return '🟫';
    }
  };

  const getTerrainColor = (type: string, owner: string | null) => {
    if (owner) {
      return 'bg-red-900/50 border-red-500';
    }
    switch (type) {
      case 'mountain': return 'bg-stone-900/50 border-stone-700';
      case 'forest': return 'bg-green-900/30 border-green-800';
      case 'water': return 'bg-blue-900/30 border-blue-800';
      case 'spirit_vein': return 'bg-purple-900/30 border-purple-500';
      default: return 'bg-amber-900/20 border-amber-900';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'combat': return 'text-red-500';
      case 'trade': return 'text-green-500';
      case 'build': return 'text-blue-500';
      case 'conquer': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'combat': return '⚔️';
      case 'trade': return '🤝';
      case 'build': return '🏗️';
      case 'conquer': return '👑';
      default: return '📌';
    }
  };

  return (
    <div className="min-h-screen bg-black pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950/30 via-black to-red-950/30 border-b border-red-900/30 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-yellow-500 mb-2">Spectator Dashboard</h1>
              <p className="text-gray-400">Live view of the One Hour Dynasty arena</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Status</div>
              <div className="text-lg font-semibold text-green-500">● LIVE</div>
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-black/50 border border-red-900/30 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Current Tick</div>
              <div className="text-2xl font-bold text-yellow-500">{tick}</div>
              <div className="text-xs text-gray-600">/ 3600</div>
            </div>
            <div className="bg-black/50 border border-red-900/30 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Phase</div>
              <div className="text-2xl font-bold text-green-500">{phase}</div>
              <div className="text-xs text-gray-600">Tick 901-2700</div>
            </div>
            <div className="bg-black/50 border border-red-900/30 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Alive Agents</div>
              <div className="text-2xl font-bold text-red-500">{agents.length}</div>
              <div className="text-xs text-gray-600">Competing</div>
            </div>
            <div className="bg-black/50 border border-red-900/30 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Time Remaining</div>
              <div className="text-2xl font-bold text-blue-500">39:15</div>
              <div className="text-xs text-gray-600">Before Tribulation</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-red-950/10 to-black border border-red-900/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-500 mb-4">🗺️ Live Map</h2>
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="text-base">🟫</span> Plain</span>
                  <span className="flex items-center gap-1"><span className="text-base">⛰️</span> Mountain</span>
                  <span className="flex items-center gap-1"><span className="text-base">🌲</span> Forest</span>
                  <span className="flex items-center gap-1"><span className="text-base">💧</span> Water</span>
                  <span className="flex items-center gap-1"><span className="text-base">✨</span> Spirit Vein</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-900/50 border border-red-500"></span> Owned</span>
                </div>

                {/* Map Grid */}
                <div className="overflow-x-auto">
                  <div className="inline-grid gap-1 p-2 bg-black/30 border border-red-900/20 rounded">
                    {mapGrid.map((row, y) => (
                      <div key={y} className="flex gap-1">
                        {row.map((cell, x) => (
                          <div
                            key={`${x}-${y}`}
                            className={`
                              w-10 h-10 md:w-12 md:h-12 flex items-center justify-center
                              border rounded cursor-pointer transition-all
                              ${getTerrainColor(cell.type, cell.owner)}
                              hover:border-yellow-500/50 hover:scale-110
                            `}
                            title={`${cell.type} ${cell.owner ? `- ${cell.owner}` : ''} (${x},${y})`}
                          >
                            <span className="text-lg md:text-xl">{getTerrainIcon(cell.type)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <div className="bg-gradient-to-br from-red-950/10 to-black border border-red-900/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-500 mb-4">🏆 Leaderboard</h2>
              <div className="space-y-3">
                {agents.map((agent, index) => (
                  <div
                    key={agent.id}
                    className={`
                      bg-black/30 border rounded-lg p-3 transition-all
                      ${index === 0 ? 'border-yellow-500/50 bg-yellow-950/10' : 'border-red-900/30'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <span className="font-semibold text-sm text-gray-200">{agent.name}</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-500">{agent.score.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>🏰 Territory: {agent.territory}</div>
                      <div>💰 Resources: {agent.resources.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Feed */}
        <div className="mt-6">
          <div className="bg-gradient-to-br from-red-950/10 to-black border border-red-900/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">⚡ Event Feed</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-black/30 border border-red-900/20 rounded-lg hover:border-red-900/40 transition-colors"
                >
                  <span className={`text-lg ${getEventTypeColor(event.type)}`}>
                    {getEventTypeIcon(event.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 break-words">{event.message}</p>
                    <p className="text-xs text-gray-600 mt-1">Tick {event.tick}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>This is a static mockup of the spectator dashboard.</p>
          <p>Live data will be available when the game server is deployed.</p>
        </div>
      </div>
    </div>
  );
}
