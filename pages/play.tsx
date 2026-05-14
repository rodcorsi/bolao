import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import Footer from "../components/Footer";
import PlayWorkspace from "../components/PlayWorkspace";
import { Config, getConfig } from "../lib/getConfig";
import { getMatchesResult, MatchResult } from "../lib/ranking";
import { getPhaseState } from "../lib/phaseState";
import { PhaseState, getMatchesForCompetitionPhase } from "../lib/tournamentPhase";

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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Abrir sessão</h2>
        <p className="mt-1 text-sm text-slate-600">
          Entre com CPF e senha para editar jogadores e palpites. Se ainda não
          tiver cadastro, crie sua conta em{" "}
          <Link href="/signup" className="font-semibold text-emerald-700 underline">
            /signup
          </Link>
          .
        </p>
      </div>
      <PlayWorkspace config={config} phaseState={phaseState} matches={matches} />
      <Footer
        updateTime={new Date().toISOString()}
        expire={Date.now()}
        config={config}
      />
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
