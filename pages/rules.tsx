import { Config, getConfig } from "../lib/getConfig";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";

import Footer from "../components/Footer";
import Head from "next/head";
import Link from "next/link";

function Rules({ config }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className="md:mx-auto md:w-3/4">
      <Head>
        <title>{`Regulamento - ${config.tournament.title}`}</title>
      </Head>
      <main className="md:container p-4">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:underline flex items-center gap-1">
            ← Voltar para o Início
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-6">Regulamento do Bolão</h1>

        <section className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">1. Inscrição e Pagamento</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li><strong>Valor:</strong> R$ 50,00 (taxa única para todo o campeonato).</li>
            <li><strong>Validade:</strong> Apenas inscrições pagas até a data de início da Copa serão consideradas válidas.</li>
          </ul>
        </section>

        <section className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">2. Dinâmica dos Palpites</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li><strong>Fases:</strong> O jogador deve preencher seus palpites antes do início de cada fase.</li>
            <li><strong>Liberação:</strong> Assim que os confrontos de uma nova fase forem definidos, o formulário de palpites ficará disponível.</li>
            <li><strong>Tempo Regulamentar:</strong> Para fins de pontuação, será considerado apenas o placar dos <strong>90 minutos (mais acréscimos)</strong>. Resultados de prorrogação e disputas de pênaltis não são contabilizados.</li>
          </ul>
        </section>

        <section className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">3. Sistema de Pontuação</h2>
          <p className="mb-4 text-gray-700">A pontuação por partida é definida pelos seguintes critérios (não cumulativos):</p>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pontos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exemplo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-bold">12 pts</td>
                <td className="px-6 py-4">Placar exato dos dois times</td>
                <td className="px-6 py-4">Palpite: 7x1</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-bold">07 pts</td>
                <td className="px-6 py-4">Vencedor/Empate + Placar de um time</td>
                <td className="px-6 py-4">Palpite: <strong>2</strong>x1</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-bold">05 pts</td>
                <td className="px-6 py-4">Apenas o resultado (Vencedor ou Empate)</td>
                <td className="px-6 py-4">Palpite: 0x2</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-bold">02 pts</td>
                <td className="px-6 py-4">Apenas o placar de um dos times</td>
                <td className="px-6 py-4">Palpite: 3x<strong>0</strong></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">4. Premiação</h2>
          <p className="mb-4 text-gray-700">O montante total arrecadado será distribuído da seguinte forma:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li><strong>1º Colocado:</strong> 60%</li>
            <li><strong>2º Colocado:</strong> 30%</li>
            <li><strong>3º Colocado:</strong> 10%</li>
          </ul>
        </section>

        <section className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">5. Critérios de Desempate</h2>
          <p className="mb-4 text-gray-700">Caso haja empate na pontuação final, os critérios de desempate seguirão esta ordem:</p>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>Maior quantidade de acertos de <strong>12 pontos</strong>.</li>
            <li>Maior quantidade de acertos de <strong>7 pontos</strong>.</li>
            <li>Maior quantidade de acertos de <strong>5 pontos</strong>.</li>
          </ol>
        </section>

        <div className="mt-10 mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Voltar para o Início
          </Link>
        </div>
      </main>
      <Footer config={config} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<{
  config: Config;
}> = async () => {
  const config = await getConfig();
  return { props: { config } };
};

export default Rules;
