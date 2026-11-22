---
title: Módulos e fluxos principais
sidebar_position: 2
---

# Módulos e fluxos principais

## Visão Geral da Arquitetura
A aplicação é uma solução **ASP.NET Core** baseada no SDK v10.0, projetada para gerenciar taxas de câmbio e flags de recursos dentro do ecossistema **Devolotus**. O runtime é **.NET 10**, hospedado na AWS ECS com requisitos de CPU (0.5) e memória (1GB), conforme definido no arquivo `devolotus.yaml` no namespace `team`. A infraestrutura de CI/CD utiliza workflows do GitHub para ambientes DEV, STG e PRD, acionados por eventos de pull request ou push em ramos específicos (`develop`, `release`, `main`).

## Fluxo de Execução e Construção
O pipeline de construção é orquestrado via Dockerfile, que executa a publicação localmente e empacota a imagem final utilizando o runtime `aspnet:10.0`. A aplicação expõe-se na porta **8080**. O projeto `.csproj` define explicitamente o framework como `net10.0`, habilitando suporte a nulos implícitos e usings globais.

## Módulo de Configurações (`SettingsEndpoint`)
Este módulo centraliza a leitura e fusão de configurações do Devolotus. A classe **`SettingsEndpoint`** lê múltiplos arquivos JSON (ex: `appsettings.json`) e os funde em um único objeto estruturado via endpoint HTTP.

*   **Mecanismo de Leitura:** Utiliza `JsonConfigurationProvider` para carregar dinamicamente o conteúdo dos arquivos.
*   **Filtragem de Dados:** O método `Read` aplica filtros rigorosos:
    *   Exclui credenciais sensíveis (indicadas por `[REDACTED]`, como `TokenKey`).
    *   Remove metadados internos (`DEVOLOTUS_APPSETTINGS_KEYS`).
*   **Hierarquia de Chaves:** A lógica de concatenação utiliza o formato `parent:child` para permitir hierarquias, permitindo chaves como `RatesApi:BaseAddress`.
*   **Resposta:** O resultado é retornado com o cabeçalho `Cache-Control: no-store`, impedindo cacheamento do conteúdo sensível.

## Módulo de Flags de Recursos (`FeatureFlagClient`)
A lógica de controle de recursos depende da classe **`FeatureFlagClient`**, que valida dinamicamente a configuração `Devolotus:ApplicationId` e `Devolotus:BaseAddress`.

*   **Endpoint:** `/feature-flags/{environment}` expõe o estado das flags.
*   **Comportamento:** O endpoint retorna estados como `enabled`, `disabled` ou `out-of-scope`.
*   **Exemplo de Uso:** O endpoint `/login-demo/{environment}` demonstra a alternância entre autenticação legada e nova, dependendo do valor da flag.

## Módulo de Negócios (`ExchangeRateClient`)
A camada de negócios é implementada em **`ExchangeRateClient.cs`**, responsável por consultar pares de moeda via API externa.

*   **Cliente HTTP:** Utiliza `HttpClient` com um timeout configurado de 5 segundos.
*   **Validação de Dados:**
    *   Normaliza códigos de moeda, exigindo estritamente 3 letras ASCII.
    *   Valida respostas JSON, lançando exceções específicas (`JsonException`, `ArgumentException`) caso a taxa seja inválida ou indisponível.
*   **Tratamento de Erros:** Falhas externas não tratadas internamente resultam em códigos HTTP 502 ou 503 na resposta do endpoint principal.

## Módulo de Testes e Validação
Os testes são executados via framework **xUnit** com cobertura gerada pelo Coverlet (relatórios OpenCover XML). A análise estática é realizada pelo SonarScanner, exigindo variáveis de ambiente `SONAR_PROJECT_KEY`, `SONAR_HOST_URL` e `SONAR_TOKEN`.

*   **Ambiente de Teste:** Utiliza `Microsoft.AspNetCore.Mvc.Testing` e `WebApplicationFactory`.
*   **Mockagem:** Emprega handlers personalizados (`StubHandler`) para simular respostas HTTP (OK, 400, 503) sem realizar chamadas de rede reais.
    *   **`ExchangeRateClientTests.cs`:** Valida a normalização de moedas (ex: "usd" -&gt; "USD") e rejeita pares inválidos.
    *   **`FeatureFlagEndpointTests.cs`::** Simula endpoints de flags e lógica de login, distinguindo erros de ambiente inválido (400) de falhas de provedor (502).
    *   **`SettingsEndpointTests.cs`:** Verifica a fusão correta de configurações e a exclusão de chaves protegidas.

## Dependências e Infraestrutura
*   **Runtime:** .NET 10.0 (`net10.0`).
*   **Pacotes Implícitos:** O código depende de `Microsoft.Extensions.Configuration.Json` e `System.Text.Json`. Pacotes como `Microsoft.Extensions.Configuration.DeveloperConfiguration` são utilizados mas não explicitamente listados nos arquivos fornecidos.
*   **CI/CD Externo:** Os workflows dependem do repositório externo `devolotus/devolotus-workflows`, introduzindo uma dependência crítica externa.

## Inferências e Lacunas Identificadas
1.  **Credenciais Ocultas:** O valor exato da constante `TokenKey` está redigido (`[REDACTED]`. Não é possível determinar a chave sem acesso ao código fonte completo ou documentação externa confiável. O padrão de `Devolotus__BaseAddress` é `http://localhost:8080`, mas não é exposto como string de conexão direta no código.
2.  **Validação Restrita:** A validação de moeda é estrita (apenas letras ASCII), o que pode limitar a usabilidade para códigos de moeda exóticos ou com caracteres especiais.
3.  **Resiliência de Rede:** Os testes simulam respostas via `StubHandler`, isolando a lógica do cliente, mas não validando a resiliência real da rede contra falhas externas.
4.  **Lógica de Filtragem:** A remoção de chaves baseia-se estritamente na lista derivada dos arquivos JSON e metadados, sem uma lógica explícita de validação de segurança além da exclusão do token.
5.  **Caminhos Relativos:** Os caminhos relatados são relativos ao projeto (`src/App/`, `tests/App.Tests/`), exigindo que o contexto de compilação seja mantido.
