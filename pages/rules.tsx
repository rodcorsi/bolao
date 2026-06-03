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
          <p className="mb-4 text-gray-700">
            Todo o valor arrecadado com as inscrições será dividido entre prêmio
            geral e prêmios por etapa. Assim, mesmo quem ficar para trás no
            início continua disputando novas premiações nas etapas seguintes.
          </p>
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="font-bold text-gray-800">4.1 Prêmio Geral</h3>
              <p className="mt-2">
                O prêmio geral usa a somatória de todo o campeonato e recebe
                <strong> 50% do caixa total</strong>.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li><strong>1º colocado geral:</strong> 60% do bloco geral (30% do caixa total)</li>
                <li><strong>2º colocado geral:</strong> 30% do bloco geral (15% do caixa total)</li>
                <li><strong>3º colocado geral:</strong> 10% do bloco geral (5% do caixa total)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">4.2 Prêmios por Etapa</h3>
              <p className="mt-2">
                Os outros <strong>50% do caixa total</strong> são divididos entre
                duas etapas específicas. Em cada etapa o contador zera e vale
                apenas o desempenho daquela etapa.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li><strong>Fase de grupos:</strong> 25% do caixa total, com prêmios para 1º, 2º e 3º colocados da etapa no formato 60/30/10.</li>
                <li><strong>Finais:</strong> 25% do caixa total, com prêmios para 1º, 2º e 3º colocados no formato 60/30/10. Essa etapa inclui Segunda fase, Oitavas de final, Quartas de final, Semifinais e Finais.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">5. Critérios de Desempate</h2>
          <p className="mb-4 text-gray-700">
            Caso haja empate na pontuação final ou em uma etapa premiada, os
            critérios de desempate seguirão esta ordem:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>Maior quantidade de acertos de <strong>12 pontos</strong>.</li>
            <li>Maior quantidade de acertos de <strong>7 pontos</strong>.</li>
            <li>Maior quantidade de acertos de <strong>5 pontos</strong>.</li>
          </ol>
          <p className="mt-4 text-gray-700">
            Nos prêmios por etapa, os critérios acima consideram apenas os jogos
            daquela etapa. Se o empate persistir em uma posição premiada, o valor
            correspondente a essa posição será dividido igualmente entre os
            empatados.
          </p>
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
