import { Config, getConfig } from "../lib/getConfig";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { MatchResult, getMatchesResult } from "../lib/ranking";
import { PhaseState, getMatchesForCompetitionPhase } from "../lib/tournamentPhase";

import Footer from "../components/Footer";
import Head from "next/head";
import Link from "next/link";
import PlayWorkspace from "../components/PlayWorkspace";
import { getPhaseState } from "../lib/phaseState";

const PlayPage = ({
  config,
  phaseState,
  matches,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <div className="md:mx-auto md:w-3/4 grid">
      <Head>
        <title>{`Cadastro e palpites - ${config.tournament.title}`}</title>
        <meta
          name="description"
          content={`Cadastro e edição de palpites do ${config.tournament.title}`}
        />
      </Head>
      <h1 className="p-2 text-lg text-gray-700 font-bold">
        <Link href="/">⇦ {config.tournament.title}</Link>
      </h1>
      <PlayWorkspace config={config} phaseState={phaseState} matches={matches} />
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<{
  config: Config;
  phaseState: PhaseState;
  matches: MatchResult[];
}> = async () => {
  const [config, allMatches] = await Promise.all([getConfig(), getMatchesResult()]);
  const phaseState = getPhaseState(config, allMatches);
  const matches = phaseState.editablePhase
    ? getMatchesForCompetitionPhase(allMatches, phaseState.editablePhase)
    : [];
  return {
    props: {
      config,
      phaseState,
      matches,
    },
  };
};

export default PlayPage;
