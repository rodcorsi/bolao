import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Bolão Scheelita Copa 2022</title>
        <meta
          name="description"
          content="Pagina com resultados do bolão da scheelita copa 2022"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Ranking Geral</h1>
      </main>

      <footer className={styles.footer}>
        Atualizada: {new Date().toDateString()}
      </footer>
    </div>
  );
}
