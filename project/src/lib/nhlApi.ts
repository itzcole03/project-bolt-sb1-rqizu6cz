const NHL_API_BASE = 'https://statsapi.nhl.com/api/v1';

let cachedPlayers: Map<number, { id: number; fullName: string }> | null = null;

export interface NHLApiPlayer {
  id: number;
  name: string;
}

export interface PlayerStatsResult {
  playerId: number;
  playerName: string;
  points: number;
  pointsGames: number;
  totalGames: number;
  shots: number;
}

async function loadAllPlayers(): Promise<Map<number, { id: number; fullName: string }>> {
  if (cachedPlayers) {
    return cachedPlayers;
  }

  try {
    console.log('Fetching all NHL players from API...');
    const response = await fetch(`${NHL_API_BASE}/players`);

    if (!response.ok) {
      console.error(`NHL API error: ${response.status} ${response.statusText}`);
      return new Map();
    }

    const data = await response.json();

    if (!data.people || data.people.length === 0) {
      console.warn('No players returned from NHL API');
      return new Map();
    }

    console.log(`Loaded ${data.people.length} players from NHL API`);

    cachedPlayers = new Map(
      data.people.map((player: any) => [
        player.id,
        { id: player.id, fullName: player.fullName },
      ])
    );

    return cachedPlayers;
  } catch (error) {
    console.error('Error loading NHL players:', error);
    return new Map();
  }
}

export async function searchNHLPlayers(query: string): Promise<NHLApiPlayer[]> {
  try {
    const allPlayers = await loadAllPlayers();

    if (allPlayers.size === 0) {
      return [];
    }

    const searchLower = query.toLowerCase().trim();
    const results: NHLApiPlayer[] = [];

    allPlayers.forEach((player) => {
      if (player.fullName.toLowerCase().includes(searchLower)) {
        results.push({
          id: player.id,
          name: player.fullName,
        });
      }
    });

    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchLower;
      const bExact = b.name.toLowerCase() === searchLower;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStartsWith = a.name.toLowerCase().startsWith(searchLower);
      const bStartsWith = b.name.toLowerCase().startsWith(searchLower);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return 0;
    });

    return results;
  } catch (error) {
    console.error('Error searching NHL players:', error);
    return [];
  }
}

export async function getNHLPlayerStats(
  playerIdOrName: number | string
): Promise<PlayerStatsResult | null> {
  try {
    let playerId: number;

    if (typeof playerIdOrName === 'string') {
      console.log(`Searching for player: ${playerIdOrName}`);
      const players = await searchNHLPlayers(playerIdOrName);
      if (players.length === 0) {
        console.warn(`No NHL player found with name: ${playerIdOrName}`);
        return null;
      }
      playerId = players[0].id;
      console.log(`Found player: ${players[0].name} (ID: ${playerId})`);
    } else {
      playerId = playerIdOrName;
    }

    console.log(`Fetching stats for player ID: ${playerId}`);
    const response = await fetch(`${NHL_API_BASE}/people/${playerId}`);

    if (!response.ok) {
      console.error(`NHL API error for player ${playerId}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data.people || data.people.length === 0) {
      console.warn(`No data returned for player ID: ${playerId}`);
      return null;
    }

    const player = data.people[0];
    const currentSeason = getCurrentNHLSeason();
    console.log(`Current season: ${currentSeason}, Player: ${player.fullName}`);

    const stats = player.stats || [];
    const regularSeasonStats = stats.find((s: any) => s.type?.displayName === 'regularSeasonStatRest');

    if (!regularSeasonStats) {
      console.warn(`No regular season stats found for ${player.fullName}`);
      return {
        playerId: player.id,
        playerName: player.fullName,
        points: 0,
        pointsGames: 0,
        totalGames: 0,
        shots: 0,
      };
    }

    const statsArray = regularSeasonStats.stats || [];
    const seasonData = statsArray.find((s: any) => s.season === currentSeason);

    if (!seasonData) {
      console.warn(`No stats found for season ${currentSeason} for ${player.fullName}`);
      return {
        playerId: player.id,
        playerName: player.fullName,
        points: 0,
        pointsGames: 0,
        totalGames: 0,
        shots: 0,
      };
    }

    const games = seasonData.gamesPlayed || 0;
    const points = seasonData.points || 0;
    const shots = seasonData.shots || 0;

    const pointsGames = points > 0 ? games : 0;

    console.log(`${player.fullName} stats - Games: ${games}, Points: ${points}, Shots: ${shots}`);

    return {
      playerId: player.id,
      playerName: player.fullName,
      points,
      pointsGames,
      totalGames: games,
      shots,
    };
  } catch (error) {
    console.error('Error fetching NHL player stats:', error);
    return null;
  }
}

export function getCurrentNHLSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month < 8) {
    return `${year - 1}${year}`;
  }
  return `${year}${year + 1}`;
}
