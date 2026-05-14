import { Config, getConfig } from "../lib/getConfig";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { SessionCredentials, savePlayAuth } from "../lib/playAuthStorage";

import Footer from "../components/Footer";
import Head from "next/head";
import Link from "next/link";
import SignupForm from "../components/SignupForm";
import { getMatchesResult } from "../lib/ranking";
import { getPhaseState } from "../lib/phaseState";
import { useRouter } from "next/router";

const SignupPage = ({ config }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();

  const handleRegistered = (credentials: SessionCredentials) => {
    savePlayAuth(credentials);
    void router.push("/play");
  };

  return (
    <div className="md:mx-auto md:w-3/4 grid gap-4">
      <Head>
        <title>{`Cadastro - ${config.tournament.title}`}</title>
        <meta
          name="description"
          content={`Cadastro de novos participantes do ${config.tournament.title}`}
        />
      </Head>
      <h1 className="p-2 text-lg text-gray-700 font-bold">
        <Link href="/">⇦ {config.tournament.title}</Link>
      </h1>
      <SignupForm onRegistered={handleRegistered} />
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Já tem cadastro?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Se você já criou sua conta, abra sua sessão para editar jogadores e
          palpites.
        </p>
        <Link
          href="/play"
          className="mt-4 inline-flex rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white"
        >
          Abrir sessão
        </Link>
      </section>
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<{
  config: Config;
}> = async () => {
  const [config, allMatches] = await Promise.all([getConfig(), getMatchesResult()]);
  const phaseState = getPhaseState(config, allMatches);
  if (phaseState.currentPhase !== "INICIO") {
    return {
      redirect: {
        destination: "/play",
        permanent: false,
      },
    };
  }
  return {
    props: {
      config,
      phaseState,
    },
  };
};

export default SignupPage;
