---
title: Visão geral e arquitetura
sidebar_position: 1
slug: /
---

# Visão geral e arquitetura

## Contexto do Projeto
O software documentado é uma aplicação **ASP.NET Core** desenvolvida para o ambiente **Devolotus**, focada na gestão de taxas de câmbio, flags de recursos (feature flags) e configuração de ambientes. A infraestrutura baseia-se no runtime **.NET 10.0** (SDK v10.0), hospedado na AWS ECS, conforme definido pelo arquivo `devolotus.yaml` que configura a aplicação `sonar-v2` no namespace `team`. O pipeline de integração contínua e entrega (CI/CD) utiliza workflows do GitHub para ambientes DEV, STG e PRD, acionados por eventos de pull request ou push em ramos específicos (`develop`, `release`, `main`). A promoção automática ocorre apenas no ambiente DEV.

## Arquitetura Técnica e Infraestrutura
A aplicação é construída via **Dockerfile**, que executa a publicação localmente e empacota a imagem final usando o runtime `aspnet:10.0` com exposição na porta **8080**. O projeto `.csproj` define o framework como `net10.0`, com suporte a nulos implícitos e usings.

A infraestrutura é definida pelo arquivo `devolotus.yaml`, que configura a aplicação `sonar-v2` no namespace `team`. O runtime é .NET 10, hospedado na AWS ECS, com requisitos de CPU (0.5) e memória (1GB). O pipeline CI/CD utiliza workflows do GitHub para ambientes DEV, STG e PRD, acionados por eventos de pull request ou push em ramos específicos (`develop`, `release`, `main`). A promoção automática ocorre apenas no ambiente DEV.

## Camada de Apresentação e Endpoints REST
A camada de apresentação é implementada através de endpoints REST expostos pela classe central `Program.cs`. Os endpoints principais incluem:
*   `/health`: Para verificação de saúde do serviço.
*   `/settings`: Para leitura de configurações do Devolotus, fundindo múltiplos arquivos JSON.
*   `/feature-flags/{environment}`: Para gerenciamento de flags de recurso por ambiente.
*   `/login-demo/{environment}`: Demonstração do uso de flags para alternar entre autenticação legada ou nova, retornando estados como `enabled`, `disabled` ou `out-of-scope`.

A lógica de flags depende da classe `FeatureFlagClient`, que valida dinamicamente a `Devolotus:ApplicationId` e `Devolotus:BaseAddress`. O endpoint `/login-demo/{environment}` demonstra o uso de flags para alternar entre autenticação legada ou nova, retornando estados como `enabled`, `disabled` ou `out-of-scope`.

## Camada de Negócios e Clientes
A camada de negócios é implementada em `ExchangeRateClient.cs`, que utiliza `HttpClient` para consultar pares de moeda. A classe normaliza códigos de moeda (exigindo 3 letras ASCII) e valida respostas JSON, lançando exceções específicas (`JsonException`, `ArgumentException`) caso a taxa seja inválida ou indisponível. O cliente define um timeout de 5 segundos.

A classe `SettingsEndpoint` lê o conteúdo de arquivos JSON (como `appsettings.json`) e os funde em um único objeto JSON estruturado via endpoint HTTP. O método `Read` filtra chaves baseadas no nome do arquivo, excluindo credenciais sensíveis (indicada por `[REDACTED]` para `TokenKey`) e metadados internos (`DEVOLOTUS_APPSETTINGS_KEYS`). A lógica de concatenação de chaves utiliza o formato `parent:child`, permitindo hierarquias como `RatesApi:BaseAddress`. O resultado é retornado com cabeçalho `Cache-Control: no-store`.

## Estrutura de Dados e Configuração
O arquivo `appsettings.json` define configurações iniciais para APIs externas (`RatesApi`) e serviços internos (`Devolotus`). A classe utiliza `JsonConfigurationProvider` para carregar múltiplos arquivos JSON dinamicamente. As credenciais do Devolotus e tokens do scanner são tratados como segredos nos workflows `.yml`.

## Estratégia de Testes
Os testes são executados via **xUnit** com cobertura do Coverlet, gerando relatórios OpenCover XML. A análise estática é feita pelo SonarScanner para .NET, exigindo configuração de ambiente (`SONAR_PROJECT_KEY`, `SONAR_HOST_URL`, `SONAR_TOKEN`).

Os testes utilizam `Microsoft.AspNetCore.Mvc.Testing` e `WebApplicationFactory`. Eles empregam handlers personalizados (`StubHandler`) para simular respostas HTTP (OK, 400, 503) sem fazer chamadas de rede reais.
*   `ExchangeRateClientTests`: Valida normalização de moedas (ex: "usd" para "USD") e rejeita pares inválidos antes de enviar requisições.
*   `FeatureFlagEndpointTests`: Simula endpoints de bandeiras de recurso (`/feature-flags/{environment}`) e lógica de login baseada em flags JSON. Distingue erros de ambiente inválido (400) de falhas de provedor (502).
*   `SettingsEndpointTests`: Verifica a fusão correta de configurações, garantindo que chaves não relacionadas ou protegidas sejam excluídas do retorno final.

## Inferências e Lacunas Identificadas
*   **Credenciais:** Os valores exatos de `Devolotus__BaseAddress` (padrão `http://localhost:8080`) e o ID da aplicação (`5c475c50-c8e9-477d-b38e-ed9654853890`) são referenciados, mas não expostos como strings de conexão diretas no código fonte. O valor da constante `TokenKey` está redigido (`[REDACTED]`).
*   **Dependências:** Os pacotes NuGet específicos (ex: `Microsoft.Extensions.Configuration.DeveloperConfiguration`) não foram listados explicitamente nos arquivos forncidos, embora sejam implícitos pelo uso de `IConfiguration`. O código depende de `Microsoft.Extensions.Configuration.Json` e `System.Text.Json`. A versão do .NET é especificada como `net10.0`, indicando um ambiente recente (potencialmente futuro ou em desenvolvimento ativo).
*   **Segurança:** A validação de moeda é estrita (apenas letras ASCII), o que pode limitar a usabilidade para códigos de moeda exóticos. O tratamento de exceções em `Program.cs` retorna códigos HTTP 502 ou 503, indicando falhas externas não tratadas internamente.
*   **Lógica de Filtragem:** A remoção de chaves baseia-se estritamente na lista de chaves derivadas dos arquivos JSON e metadados, sem lógica explícita de validação de segurança além da exclusão do token.
*   **Simulação de Testes:** Os testes não executam requisições reais contra `api.frankfurter.dev` ou `localhost:8080`, mas sim respostas mockadas via `StubHandler`. Isso isola a lógica de cliente, mas não valida a resiliência real da rede.
*   **Caminhos e Símbolos:** Os caminhos relatados são relativos ao projeto (`src/App/`, `tests/App.Tests/`). O símbolo `[REDACTED]` indica uma variável constante interna.
*   **Dependências Externas:** O código depende de um repositório externo (`devolotus/devolotus-workflows`) para a execução do pipeline, o que introduz uma dependência externa crítica.

**O que não foi encontrado:** Não foram encontrados detalhes sobre a implementação específica da lógica de negócio de conversão de moeda além da normalização e validação JSON, nem informações sobre mecanismos de fallback em caso de falha de rede persistente além dos códigos HTTP retornados.
