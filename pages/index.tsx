import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from "next";

import Head from "next/head";
import { ParsedUrlQuery } from "querystring";

function Home({ data }: { data: any }) {
  return (
    <div>
      <Head>
        <title>Bolão Scheelita Copa 2022</title>
        <meta
          name="description"
          content="Pagina com resultados do bolão da scheelita copa 2022"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Ranking Geral</h1>
      </main>

      <footer>Atualizada: {new Date().toDateString()}</footer>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const baseUrl = returnUrl(context);
  const res = await fetch(baseUrl + "/api/hello");
  const data = await res.json();

  // Pass data to the page via props
  return { props: { data } };
};

function returnUrl(
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) {
  if (process.env.NODE_ENV === "production") {
    return `https://${context.req.rawHeaders[1]}`;
  }
  return "http://localhost:3000";
}

export default Home;
