---
title: Modelo de dados e persistência
sidebar_position: 4
---

# Modelo de dados e persistência

## Visão Geral da Persistência
A aplicação descrita no lote `f6717db10666ddfbf5771ecbb9db5491af08d519` não implementa mecanismos tradicionais de persistência de dados (como bancos de dados relacionais, NoSQL ou filas) para o armazenamento de estado da aplicação. A arquitetura foca em **configuração externa**, **cache volátil** e **simulação de serviços externos**. Os dados são tratados como configurações transitórias ou respostas de APIs externas, sem ser persistidos localmente para recuperação futura após reinicialização do processo.

## Fontes de Dados e Configuração
A principal fonte de dados estática reside no arquivo `appsettings.json`, localizado na estrutura de projeto (implied em `src/App/` ou raiz). Este arquivo atua como o "banco de dados" de configuração inicial, contendo hierarquias de chaves como `RatesApi:BaseAddress` e credenciais.

*   **Mecanismo de Leitura:** A classe `SettingsEndpoint.cs` utiliza `JsonConfigurationProvider` para carregar múltiplos arquivos JSON dinamicamente.
*   **Processamento:** O método `Read` filtra chaves sensíveis (indicadas por `[REDACTED]` para `TokenKey`) e metadados internos (`DEVOLOTUS_APPSETTINGS_KEYS`). A lógica de concatenação utiliza o formato `parent:child`, permitindo hierarquias.
*   **Limitação:** O acesso a esses dados é feito via endpoints REST (ex: `/settings`), que retornam cabeçalho `Cache-Control: no-store`, indicando que os dados não são persistidos em memória do servidor para uso posterior, mas apenas expostos sob demanda.

## Gerenciamento de Flags e Estado
O estado da aplicação é gerido dinamicamente através de uma API externa (Devolotus) e não armazenado localmente.

*   **Cliente de Flags:** A classe `FeatureFlagClient` valida dinamicamente a `Devolotus:ApplicationId` e `Devolotus:BaseAddress`.
*   **Fluxo de Dados:** O endpoint `/feature-flags/{environment}` consome dados externos para determinar o estado das flags (ex: `enabled`, `disabled`, `out-of-scope`). Não há evidência de que essas flags sejam sincronizadas ou salvas em um repositório local; a aplicação depende da integridade do serviço externo.
*   **Inferência:** A dependência de `Devolotus` sugere uma arquitetura baseada em serviços gerenciados, onde o estado é controlado fora dos limites da aplicação (.NET 10).

## Persistência de Dados de Negócio (Taxas de Câmbio)
A camada de negócios implementada em `ExchangeRateClient.cs` não persiste dados de taxa de câmbio.

*   **Consumo Externo:** O cliente utiliza `HttpClient` para consultar pares de moeda, normalizando códigos (ex: "usd" para "USD") e validando respostas JSON.
*   **Comportamento:** Em caso de falha ou taxa inválida, o cliente lança exceções (`JsonException`, `ArgumentException`) ou retorna erros HTTP (502/503). Não há lógica de *caching* local persistente ou armazenamento em disco para as taxas.
*   **Lacuna:** A aplicação assume que os dados de moeda estão sempre disponíveis no serviço externo, sem fallbacks locais ou estratégias de persistência para cenários de indisponibilidade da API externa.

## Estrutura de Dados e Tipos
Os tipos de dados utilizados são predominantemente objetos JSON deserializados e strings configuradas.

*   **Estrutura:** O uso de `JsonConfigurationProvider` implica a leitura de estruturas JSON hierárquicas.
*   **Validação:** A normalização de moedas exige 3 letras ASCII, criando um filtro de entrada estrito para os dados consumidos da API externa.
*   **Inferência sobre Dependências:** Embora não explicitados na lista de arquivos fornecida, o uso de `IConfiguration` e manipulação JSON implica dependências como `Microsoft.Extensions.Configuration.Json` e `System.Text.Json`. A versão `.NET 10.0` sugere suporte nativo a novas características de serialização, mas a persistência ainda é baseada em memória volátil ou serviços externos.

## Resumo das Lacunas e Inferências
*   **Ausência de Banco de Dados:** Não foi encontrado nenhum código referente a Entity Framework Core, Dapper, MongoDB, Redis persistente ou qualquer mecanismo de armazenamento de dados estruturados para recuperação de estado da aplicação após reinício.
*   **Configuração como Código/Arquivo:** A persistência de configuração é dependente dos arquivos `appsettings.json` e do serviço Devolotus. Se esses arquivos ou o serviço externo falharem, a aplicação não possui um "banco de dados" local para operar com configurações alternativas.
*   **Dados Transitórios:** Os dados retornados pelos endpoints (`/settings`, `/feature-flags`) são tratados como respostas transitórias. O cabeçalho `Cache-Control: no-store` reforça que o servidor não mantém uma cópia persistente desses dados em memória compartilhada entre requisições.
*   **Simulação vs. Realidade:** Os testes (`ExchangeRateClientTests.cs`, etc.) utilizam `StubHandler` para simular respostas HTTP, isolando a lógica de cliente. Isso confirma que a aplicação não foi projetada para lidar com falhas de rede ou inconsistências de dados externos através de mecanismos de persistência local robustos.

Em conclusão, o modelo de dados e persistência desta aplicação é **extremamente leve**, baseado quase exclusivamente em **configurações estáticas** (`appsettings.json`) e **consumo de serviços externos**. Não há capacidade de persistir estado da aplicação, histórico de transações ou dados de negócio localmente.
