# bolao

Bolão da Copa 2026 com ranking, fases por data e integração com `football-data.org`.

## Seed de partidas

O script `seed:matches` busca partidas em `football-data.org` e grava na tabela `matches` do Supabase.

Variáveis necessárias em `.env.local` ou `.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FOOTBAL_DATA_ORG_API_KEY=your_football_data_org_api_key
FOOTBALL_DATA_ORG_COMPETITION=WC
FOOTBALL_DATA_ORG_SEASON=2026
```

Executar apenas uma fase:

```bash
bun run seed:matches --phase GROUP_STAGE
```

O argumento `--phase` usa os valores de `stage` da API do `football-data.org`.

## Fases suportadas

Mapeamento entre o `stage` da API e a fase usada pela aplicação:

- `GROUP_STAGE` -> `Fase de grupos`
- `LAST_32` -> `Segunda fase`
- `LAST_16` -> `Oitavas`
- `QUARTER_FINALS` -> `Quartas`
- `SEMI_FINALS` -> `Semi finais`
- `FINAL` -> `Finais`
- `THIRD_PLACE` -> `Finais`

Exemplos:

```bash
bun run seed:matches --phase GROUP_STAGE
bun run seed:matches --phase LAST_32
bun run seed:matches --phase LAST_16
bun run seed:matches --phase QUARTER_FINALS
bun run seed:matches --phase SEMI_FINALS
bun run seed:matches --phase FINAL
bun run seed:matches --phase THIRD_PLACE
```

## Comportamento do script

- Reexecutar o comando não duplica partidas já existentes com o mesmo `fixture_id`.
- O script atualiza `home_team`, `away_team`, `fase`, `group_name` e `sequence`.
- `sequence` é recalculado pela ordem de data (`utcDate`) e depois pelo `id` da partida.
- Fases não mapeadas são ignoradas com aviso no terminal.
