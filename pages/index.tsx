import { Config, getConfig } from "../lib/getConfig";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import getRanking, {
  MatchResult,
  Ranking,
  RankingItem,
  bestRankingForMatches,
  getMatchesOfDay,
} from "../lib/ranking";
import { useEffect, useState } from "react";

import Head from "next/head";
import HomeDashboard from "../components/home/HomeDashboard";
import HomeLanding from "../components/home/HomeLanding";
import { BetFillProgress, getBetFillProgress } from "../lib/betProgress";
import { NextPhaseNotice, PhaseState } from "../lib/tournamentPhase";
import { loadPlayAuth, parsePlayAuthCookie } from "../lib/playAuthStorage";
import { assertUserSecret, getUserByCPF } from "../lib/users";
import { getNextPhaseNotice, getPhaseState } from "../lib/phaseState";
import { getUserFromCookieHeader } from "../lib/sessionAuth";

const MAX_ITEMS_BEST_OF_DAY = 5;

function Home({
  authenticated,
  ranking: { items, matches, updateTime, expire, lastPosition },
  matchesOfDay,
  bestOfDay,
  betFillProgress,
  config,
  nextPhaseNotice,
  phaseState,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [isCheckingStoredAuth, setIsCheckingStoredAuth] = useState(!authenticated);

  useEffect(() => {
    if (authenticated) {
      return;
    }
    let cancelled = false;
    const verifyStoredAuth = async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      const storedAuth = loadPlayAuth();
      if (!storedAuth) {
        setIsCheckingStoredAuth(false);
        return;
      }
      try {
        const response = await fetch("/api/users/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(storedAuth),
        });
        if (response.ok && !cancelled) {
          setIsAuthenticated(true);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingStoredAuth(false);
        }
      }
    };
    void verifyStoredAuth();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  return (
    <>
      <Head>
        <title>{config.tournament.title}</title>
        <meta
          name="description"
          content={
            isAuthenticated
              ? `Acompanhe o ranking e as fases de ${config.tournament.title}`
              : `Entre no ${config.tournament.title}, envie seus palpites e acompanhe a Copa 2026 em tempo real`
          }
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {isAuthenticated ? (
        <HomeDashboard
          allMatches={matches}
          bestOfDay={bestOfDay}
          betFillProgress={betFillProgress}
          config={config}
          expire={expire}
          items={items}
          lastPosition={lastPosition}
          matchesOfDay={matchesOfDay}
          nextPhaseNotice={nextPhaseNotice}
          phaseState={phaseState}
          updateTime={updateTime}
        />
      ) : (
        <div className={isCheckingStoredAuth ? "opacity-80 transition-opacity" : ""}>
          <HomeLanding
            allMatches={matches}
            bestOfDay={bestOfDay}
            config={config}
            matchesOfDay={matchesOfDay}
            participantCount={items.length}
            phaseState={phaseState}
            rankingItems={items}
          />
        </div>
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<{
  authenticated: boolean;
  ranking: Ranking;
  matchesOfDay: MatchResult[];
  bestOfDay: RankingItem[];
  betFillProgress: BetFillProgress | null;
  config: Config;
  nextPhaseNotice: NextPhaseNotice | null;
  phaseState: PhaseState;
}> = async ({ req, res }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
  const [ranking, config] = await Promise.all([getRanking(), getConfig()]);
  const matchesOfDay = getMatchesOfDay(ranking.matches);
  const bestOfDay = bestRankingForMatches(
    matchesOfDay,
    ranking.items,
    MAX_ITEMS_BEST_OF_DAY,
    config.scorePoints
  );
  const phaseState = getPhaseState(config, ranking.matches);
  const nextPhaseNotice = getNextPhaseNotice(config, phaseState, ranking.matches);

  let authenticated = false;
  const user = await getUserFromCookieHeader(req.headers.cookie);
  if (user) {
    authenticated = true;
  } else {
    const cookieCredentials = parsePlayAuthCookie(req.headers.cookie);
    if (cookieCredentials && cookieCredentials.secretCode) {
      try {
        const legacyUser = await getUserByCPF(cookieCredentials.cpf);
        if (legacyUser) {
          assertUserSecret(legacyUser, cookieCredentials.secretCode);
          authenticated = true;
        }
      } catch {
        authenticated = false;
      }
    }
  }

  const betFillProgress =
    authenticated && phaseState.editablePhase
      ? await getBetFillProgress(phaseState.editablePhase, ranking.matches)
      : null;

  return {
    props: {
      authenticated,
      ranking,
      matchesOfDay,
      bestOfDay,
      betFillProgress,
      config,
      nextPhaseNotice,
      phaseState,
    },
  };
};

export default Home;
