import {
  FootballDataMatch,
  fetchFootballFixture,
  selectGoals,
} from "./getFootballFixture";

import calculatePoints from "./calculatePoints";
import { getBetsRawByMatchIDs } from "./getBets";
import { getConfig } from "./getConfig";
import { getMatchResultsMap } from "./getMatchResults";
import getMatches from "./getMatches";
import { invalidateRankingCache } from "./ranking";
import { supabase } from "./supabaseClient";

export interface ConsolidateSummary {
  consolidatedMatches: number;
  updatedBetPoints: number;
}

function maxKickoffDateFrom(resultsMap: {
  [matchID: number]: { kickoffAt: string };
}): string | undefined {
  let max = 0;
  for (const result of Object.values(resultsMap)) {
    const time = new Date(result.kickoffAt).getTime();
    if (!Number.isNaN(time) && time > max) {
      max = time;
    }
  }
  return max === 0 ? undefined : new Date(max).toISOString().slice(0, 10);
}

export async function consolidateResults(): Promise<ConsolidateSummary> {
  const config = await getConfig();
  const resultsMap = await getMatchResultsMap();
  const dateFrom = maxKickoffDateFrom(resultsMap);

  const response = await fetchFootballFixture({ dateFrom, status: "FINISHED" });
  const finished = response?.matches ?? [];

  const matches = await getMatches();
  const matchByFixtureID = matches.reduce(
    (acc, match) => {
      acc[match.fixtureID] = match;
      return acc;
    },
    {} as { [fixtureID: number]: (typeof matches)[number] },
  );

  // 1. Consolidar placares em match_results.
  const fixtureByMatchID: { [matchID: number]: FootballDataMatch } = {};
  const resultRows = [];
  for (const fixture of finished) {
    const match = matchByFixtureID[fixture.id];
    if (match == null) {
      continue;
    }
    const goals = selectGoals(fixture);
    if (goals.homeTeam == null || goals.awayTeam == null) {
      continue;
    }
    fixtureByMatchID[match.id] = fixture;
    resultRows.push({
      match_id: match.id,
      home_goals: goals.homeTeam,
      away_goals: goals.awayTeam,
      kickoff_at: fixture.utcDate,
      fixture,
      updated_at: new Date().toISOString(),
    });
  }

  if (resultRows.length > 0) {
    const { error } = await supabase
      .from("match_results")
      .upsert(resultRows, { onConflict: "match_id" });
    if (error) {
      throw new Error(`Failed to upsert match_results: ${error.message}`);
    }
  }

  // 2. Computar pontos dos palpites em bet_points.
  const consolidatedMatchIDs = Object.keys(fixtureByMatchID).map(Number);
  const bets = await getBetsRawByMatchIDs(consolidatedMatchIDs);
  const pointRows = [];
  for (const bet of bets) {
    const fixture = fixtureByMatchID[bet.matchID];
    if (fixture == null) {
      continue;
    }
    const points = calculatePoints(
      bet,
      selectGoals(fixture),
      config.scorePoints,
    );
    if (points == null) {
      continue;
    }
    pointRows.push({
      bet_id: bet.id,
      points,
      updated_at: new Date().toISOString(),
    });
  }

  if (pointRows.length > 0) {
    const { error } = await supabase
      .from("bet_points")
      .upsert(pointRows, { onConflict: "bet_id" });
    if (error) {
      throw new Error(`Failed to upsert bet_points: ${error.message}`);
    }
  }

  // 3. Invalidar o cache do ranking para refletir já na próxima request.
  if (resultRows.length > 0 || pointRows.length > 0) {
    try {
      await invalidateRankingCache();
    } catch (error) {
      console.error("Failed to invalidate ranking cache:", error);
    }
  }

  return {
    consolidatedMatches: resultRows.length,
    updatedBetPoints: pointRows.length,
  };
}
