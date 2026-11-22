---
title: APIs e integrações
sidebar_position: 3
---

# APIs e integrações

## Visão Geral da API
A aplicação documentada é um serviço **ASP.NET Core** (SDK v10.0) projetado para gerenciar taxas de câmbio e flags de recursos, operando no ambiente **Devolotus**. A infraestrutura é definida pelo arquivo `devolotus.yaml`, que configura a aplicação `sonar-v2` no namespace `team`. O runtime é .NET 10, hospedado na AWS ECS com requisitos de CPU (0.5) e memória (1GB).

A API expõe endpoints REST principais através da classe central `Program.cs`. A lógica de negócios para taxas de câmbio reside em `ExchangeRateClient.cs`, enquanto o gerenciamento de flags é controlado pela classe `FeatureFlagClient`. As configurações são carregadas dinamicamente via `JsonConfigurationProvider` a partir de arquivos JSON definidos em `appsettings.json`.

## Endpoints REST e Funcionalidades

### 1. Gerenciamento de Configurações (`/settings`)
O endpoint `/settings` permite a leitura de configurações do Devolotus, fundindo múltiplos arquivos JSON em um objeto estruturado único.
*   **Implementação:** A classe `SettingsEndpoint.cs` implementa o método `Read`.
*   **Lógica:** Filtra chaves baseadas no nome do arquivo, excluindo credenciais sensíveis (indicada por `[REDACTED]` para `TokenKey`) e metadados internos (`DEVOLOTUS_APPSETTINGS_KEYS`). A concatenação de chaves utiliza o formato `parent:child`, permitindo hierarquias como `RatesApi:BaseAddress`.
*   **Resposta:** Retorna o objeto JSON fundido com o cabeçalho `Cache-Control: no-store`.
*   **Evidência:** O arquivo `appsettings.json` define configurações iniciais para APIs externas (`RatesApi`) e serviços internos (`Devolotus`).

### 2. Flags de Recursos (`/feature-flags/{environment}`)
O endpoint `/feature-flags/{environment}` expõe o estado das flags de recurso para um ambiente específico.
*   **Implementação:** A classe `FeatureFlagClient` valida dinamicamente a `Devolotus:ApplicationId` e `Devolotus:BaseAddress`.
*   **Comportamento:** Retorna estados como `enabled`, `disabled` ou `out-of-scope`. O endpoint `/login-demo/{environment}` demonstra o uso de flags para alternar entre autenticação legada ou nova.
*   **Tratamento de Erros:** Se o ambiente for inválido, retorna código HTTP 400. Se houver falha no provedor externo, retorna 502 ou 503.

### 3. Saúde do Sistema (`/health`)
Endpoint padrão para verificação da saúde da aplicação.
*   **Implementação:** Exposto diretamente em `Program.cs`.

## Cliente de Taxas de Câmbio (`ExchangeRateClient.cs`)
Este componente integra-se a provedores externos (ex: `api.frankfurter.dev` ou endpoints locais) para obter pares de moeda.
*   **Normalização:** O cliente normaliza códigos de moeda, exigindo 3 letras ASCII.
*   **Validação:** Lança exceções específicas (`JsonException`, `ArgumentException`) caso a taxa seja inválida ou indisponível.
*   **Timeout:** Define um timeout de 5 segundos para requisições HTTP.
*   **Evidência:** A classe utiliza `HttpClient` e implementa handlers personalizados (`StubHandler`) nos testes para simular respostas sem chamadas de rede reais.

## Estrutura de Testes e CI/CD
A aplicação possui uma estratégia robusta de testes unitários e de integração, executados via xUnit com cobertura do Coverlet.
*   **Ambiente de Teste:** Utiliza `Microsoft.AspNetCore.Mvc.Testing` e `WebApplicationFactory`.
*   **Simulação:** Emprega handlers personalizados (`StubHandler`) para simular respostas HTTP (OK, 400, 503) sem fazer chamadas de rede reais, isolando a lógica do cliente.
*   **Análise Estática:** Executa o SonarScanner para .NET, exigindo configuração de ambiente (`SONAR_PROJECT_KEY`, `SONAR_HOST_URL`, `SONAR_TOKEN`). As credenciais do Devolotus e tokens do scanner são tratados como segredos nos workflows `.yml`.
*   **Pipeline:** O CI/CD utiliza workflows do GitHub para ambientes DEV, STG e PRD, acionados por eventos de pull request ou push em ramos específicos (`develop`, `release`, `main`). A promoção automática ocorre apenas no ambiente DEV.

## Inferências e Lacunas Identificadas
*   **Credenciais:** Os valores exatos de `Devolotus__BaseAddress` (padrão `http://localhost:8080`) e o ID da aplicação (`5c475c50-c8e9-477d-b38e-ed9654853890`) são referenciados, mas não expostos como strings de conexão diretas no código fonte. O valor da constante `TokenKey` está redigido (`[REDACTED]`).
*   **Dependências:** Os pacotes NuGet específicos (ex: `Microsoft.Extensions.Configuration.DeveloperConfiguration`) não foram listados explicitamente nos arquivos forncidos, embora sejam implícitos pelo uso de `IConfiguration`. O código depende de `Microsoft.Extensions.Configuration.Json` e `System.Text.Json`.
*   **Segurança:** A validação de moeda é estrita (apenas letras ASCII), o que pode limitar a usabilidade para códigos de moeda exóticos. A remoção de chaves baseia-se estritamente na lista de chaves derivadas dos arquivos JSON e metadados, sem lógica explícita de validação de segurança além da exclusão do token.
*   **Caminhos e Símbolos:** Os caminhos relatados são relativos ao projeto (`src/App/`, `tests/App.Tests/`). O símbolo `[REDACTED]` indica uma variável constante interna.
*   **Lacunas de Dados:** Não foi encontrado o código fonte completo para determinar a chave exata do token ou detalhes sobre dependências externas além das inferidas. A análise estática depende de um repositório externo (`devolotus/devolotus-workflows`), introduzindo uma dependência externa crítica.
